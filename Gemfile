source "https://rubygems.org"

# Jekyll version used for local development AND, if you enable the workflow in
# .github/workflows/pages.yml, for the deployed build.
#
# IMPORTANT: the *classic* GitHub Pages builder ignores this file entirely and
# always builds with the `github-pages` gem (Jekyll 3.10.x) and its fixed
# plugin allow-list. Switching Pages to "GitHub Actions" as the build source is
# what makes this Gemfile authoritative.
gem "jekyll", "~> 4.4.1"
gem "jekyll-sass-converter", "~> 3.1"

# Standard library gems no longer bundled with Ruby 3.4+.
gem "base64"
gem "bigdecimal"
gem "csv"
gem "logger"

group :jekyll_plugins do
  gem "jekyll-sitemap"
  gem "jekyll-seo-tag"
  gem "jekyll-redirect-from"
  gem "jekyll-email-protect"
end

# Windows / JRuby timezone data.
gem "tzinfo-data", platforms: [:mingw, :mswin, :x64_mingw, :jruby]
gem "wdm", "~> 0.2" if Gem.win_platform?
