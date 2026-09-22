/* filepath: assets/js/dark_mode.js */
/* Theme switching.
 *
 * An explicit choice is remembered; otherwise the operating system decides.
 * When the browser supports the View Transitions API, the new theme is
 * revealed with a circle expanding from the toggle button. Everywhere else
 * the theme simply changes — the effect is decoration, never a dependency.
 */
(function () {
    'use strict';

    var THEME_KEY = 'theme-preference';

    // Storage throws in some privacy modes, so every access is guarded.
    function storedTheme() {
        try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
    }

    function systemTheme() {
        return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
            ? 'dark' : 'light';
    }

    function getThemePreference() {
        return storedTheme() || systemTheme();
    }

    function setThemePreference(theme) {
        try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
    }

    function prefersReducedMotion() {
        return window.matchMedia
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);

        var toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            var goingDark = theme === 'dark';
            toggle.setAttribute('aria-pressed', goingDark ? 'true' : 'false');
            toggle.setAttribute('aria-label',
                goingDark ? 'Switch to light theme' : 'Switch to dark theme');
        }
    }

    /* Expand a circle from the centre of the toggle, clipped to the new
     * snapshot, so the incoming theme wipes over the outgoing one. */
    function revealFrom(button, theme) {
        var supported = typeof document.startViewTransition === 'function';
        if (!supported || prefersReducedMotion() || !button) {
            applyTheme(theme);
            return;
        }

        var rect = button.getBoundingClientRect();
        var x = rect.left + rect.width / 2;
        var y = rect.top + rect.height / 2;
        // Distance to the furthest corner, so the circle always covers the page.
        var radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        var transition = document.startViewTransition(function () {
            applyTheme(theme);
        });

        transition.ready.then(function () {
            document.documentElement.animate(
                {
                    clipPath: [
                        'circle(0px at ' + x + 'px ' + y + 'px)',
                        'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'
                    ]
                },
                {
                    duration: 520,
                    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        }).catch(function () { /* a skipped transition is fine */ });
    }

    function initializeTheme() {
        applyTheme(getThemePreference());

        var toggle = document.getElementById('darkModeToggle');
        if (toggle) {
            toggle.addEventListener('click', function () {
                var next = getThemePreference() === 'dark' ? 'light' : 'dark';
                setThemePreference(next);
                revealFrom(toggle, next);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTheme);
    } else {
        initializeTheme();
    }

    // Follow the OS while the visitor has never made an explicit choice.
    if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var onChange = function () { if (!storedTheme()) applyTheme(systemTheme()); };
        if (mq.addEventListener) { mq.addEventListener('change', onChange); }
        else if (mq.addListener) { mq.addListener(onChange); }
    }
})();
