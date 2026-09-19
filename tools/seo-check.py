#!/usr/bin/env python3
"""
Post-deploy SEO verification for longuyenviet.github.io.

Checks the things that are objectively true or false about the live HTML:
canonical tags, unique titles and descriptions, structured data, sitemap,
robots.txt, redirects from the old URLs, heading structure and page weight.

It cannot tell you whether you rank well — only whether the site is set up so
that ranking is possible. Rankings are checked in Search Console (see README
note at the bottom of this file).

Usage:
    python tools/seo-check.py                          # checks the live site
    python tools/seo-check.py http://localhost:4000    # checks a local build
"""

import json
import re
import sys
from collections import Counter
import urllib.error
import urllib.request

PROD = "https://longuyenviet.github.io"
BASE = (sys.argv[1] if len(sys.argv) > 1 else PROD).rstrip("/")
# When checking a local preview, canonical tags and the sitemap still point at
# the production domain — that is correct, so compare against PROD, not BASE.
LOCAL = BASE != PROD

PAGES = ["/", "/publications/", "/gallery/", "/notes/"]
REDIRECTS = ["/publications.html", "/gallery.html", "/notes.html"]

PASS, FAIL, WARN = "PASS", "FAIL", "WARN"
results = []


def record(status, label, detail=""):
    results.append((status, label, detail))
    icon = {PASS: "  ok  ", FAIL: " FAIL ", WARN: " warn "}[status]
    print(f"[{icon}] {label}" + (f"\n         {detail}" if detail else ""))


def get(path, follow=True):
    url = path if path.startswith("http") else BASE + path
    req = urllib.request.Request(url, headers={"User-Agent": "seo-check/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace"), r.headers, r.url
    except urllib.error.HTTPError as e:
        return e.code, "", {}, url
    except Exception as e:
        return None, str(e), {}, url


def one(pattern, html, flags=re.S | re.I):
    m = re.search(pattern, html, flags)
    return m.group(1).strip() if m else None


print(f"\nSEO check against {BASE}"
      + ("   (local preview: canonicals compared against " + PROD + ")" if LOCAL else "")
      + "\n" + "=" * 72)

titles, descriptions, pages_html = {}, {}, {}

# ---------------------------------------------------------------- per page --
for path in PAGES:
    status, html, _, _ = get(path)
    print(f"\n--- {path}")
    if status != 200:
        record(FAIL, f"{path} returns HTTP {status}")
        continue
    pages_html[path] = html

    n_title = len(re.findall(r"<title[ >]", html, re.I))
    title = one(r"<title[^>]*>(.*?)</title>", html)
    if n_title == 1:
        record(PASS, f"exactly one title element", title)
    else:
        record(FAIL, f"{n_title} title elements (must be 1)", title or "")
    titles[path] = title

    canon = one(r'<link[^>]+rel="canonical"[^>]+href="([^"]+)"', html)
    expected = PROD + path
    if canon == expected:
        record(PASS, "canonical points at itself", canon)
    elif canon:
        record(FAIL, "canonical mismatch", f"got {canon}\n         want {expected}")
    else:
        record(FAIL, "no canonical tag")

    desc = one(r'<meta[^>]+name="description"[^>]+content="([^"]*)"', html)
    if desc and 70 <= len(desc) <= 300:
        record(PASS, f"meta description ({len(desc)} chars)", desc[:100] + "…")
    elif desc:
        record(WARN, f"meta description is {len(desc)} chars (aim 120-160 visible)", desc[:100])
    else:
        record(FAIL, "no meta description")
    descriptions[path] = desc

    n_h1 = len(re.findall(r"<h1[ >]", html, re.I))
    record(PASS if n_h1 == 1 else FAIL, f"{n_h1} h1 element(s) (must be 1)")

    og_img = one(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"', html)
    if og_img:
        s, _, hdr, _ = get(og_img)
        record(PASS if s == 200 else FAIL, "og:image resolves", og_img)
    else:
        record(FAIL, "no og:image — link previews will be blank")

    # structured data
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    types = []
    ok = True
    for b in blocks:
        try:
            d = json.loads(b)
        except json.JSONDecodeError as e:
            ok = False
            record(FAIL, "JSON-LD does not parse", str(e)[:90])
            continue
        nodes = d.get("@graph", [d])
        types += [n.get("@type") for n in nodes if isinstance(n, dict)]
    if ok and blocks:
        record(PASS, f"{len(blocks)} JSON-LD block(s) parse", ", ".join(t for t in types if t))
    elif not blocks:
        record(FAIL, "no JSON-LD structured data")

    if path == "/":
        person = None
        for b in blocks:
            try:
                d = json.loads(b)
            except json.JSONDecodeError:
                continue
            for n in d.get("@graph", []):
                if n.get("@type") == "Person":
                    person = n
        if person:
            same = person.get("sameAs", [])
            record(PASS if len(same) >= 2 else WARN,
                   f"Person entity with {len(same)} sameAs link(s)",
                   " | ".join(same))
            if not any("orcid" in s for s in same):
                record(WARN, "no ORCID in sameAs — add one, it is the strongest academic identity signal")
        else:
            record(FAIL, "no Person entity on the homepage")

    if path == "/publications/":
        found = any("ScholarlyArticle" in b for b in blocks)
        record(PASS if found else FAIL, "ScholarlyArticle markup on publications")

# --------------------------------------------------------------- sitewide --
print("\n--- sitewide")

dupe_t = [t for t, c in Counter([v for v in titles.values() if v]).items() if c > 1]
record(PASS if not dupe_t else FAIL,
       "all page titles unique" if not dupe_t else "duplicate titles",
       "; ".join(dupe_t))

dupe_d = [d for d, c in Counter([v for v in descriptions.values() if v]).items() if c > 1]
record(PASS if not dupe_d else FAIL,
       "all meta descriptions unique" if not dupe_d else "duplicate descriptions",
       "; ".join(x[:70] for x in dupe_d))

status, sm, _, _ = get("/sitemap.xml")
if status == 200:
    locs = re.findall(r"<loc>([^<]+)</loc>", sm)
    wrong = [l for l in locs if not l.startswith(PROD)]
    record(PASS if not wrong else FAIL,
           f"sitemap.xml lists {len(locs)} URL(s)",
           "\n         ".join(locs))
    if wrong:
        record(FAIL, "sitemap points at the wrong domain", "; ".join(wrong))
    check = [l.replace(PROD, BASE) for l in locs] if LOCAL else locs
    dead = [l for l in check if get(l)[0] != 200]
    record(PASS if not dead else FAIL,
           "every sitemap URL returns 200" if not dead else "dead sitemap URLs",
           "; ".join(dead))
else:
    record(FAIL, f"sitemap.xml returns HTTP {status}")

status, rb, _, _ = get("/robots.txt")
if status == 200 and "Sitemap:" in rb:
    record(PASS, "robots.txt present and references the sitemap")
else:
    record(FAIL, f"robots.txt problem (HTTP {status})")

for old in REDIRECTS:
    status, html, _, final = get(old)
    target = one(r'url=([^"\']+)', html) or final
    if status == 200 and target and target.rstrip("/") != (BASE + old).rstrip("/"):
        record(PASS, f"{old} redirects", f"-> {target}")
    else:
        record(WARN, f"{old} does not redirect", f"HTTP {status}")

# weight of the homepage
if "/" in pages_html:
    html = pages_html["/"]
    imgs = set(re.findall(r'(?:src|data-src)="(/assets/images/[^"]+)"', html))
    total = 0
    biggest = []
    for i in imgs:
        s, _, hdr, _ = get(i)
        n = int(hdr.get("Content-Length", 0)) if hdr else 0
        total += n
        biggest.append((n, i))
    biggest.sort(reverse=True)
    mb = total / 1048576
    record(PASS if mb < 2 else WARN,
           f"homepage images total {mb:.2f} MB",
           "\n         ".join(f"{n/1024:7.0f} KB  {p}" for n, p in biggest[:4]))

# ------------------------------------------------------------------ verdict --
n_fail = sum(1 for s, _, _ in results if s == FAIL)
n_warn = sum(1 for s, _, _ in results if s == WARN)
n_pass = sum(1 for s, _, _ in results if s == PASS)
print("\n" + "=" * 72)
print(f"{n_pass} passed, {n_warn} warnings, {n_fail} failures")
print("""
This script proves the site is technically indexable. It cannot prove you
rank. For that, after deploying:

  1. Google Search Console (search.google.com/search-console) — verify the
     property, submit the sitemap, then watch Coverage (are pages indexed?)
     and Performance (which queries show you, at what position?).
  2. Rich Results Test (search.google.com/test/rich-results) — confirms
     Google parses the Person and ScholarlyArticle markup.
  3. PageSpeed Insights (pagespeed.web.dev) — Core Web Vitals.
  4. site:longuyenviet.github.io in Google — shows what is actually indexed.

Expect 3-7 days for first indexing and 4-8 weeks before position data on
name and topic queries means anything.
""")
sys.exit(1 if n_fail else 0)
