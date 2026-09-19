/* Homepage video carousel with click-to-play YouTube facades.
 * No YouTube code is loaded until a visitor presses play.
 */
(function () {
    'use strict';

    function init() {
        var panel = document.querySelector('[data-video-panel]');
        if (!panel) return;

        var track = panel.querySelector('[data-video-track]');
        var slides = Array.prototype.slice.call(panel.querySelectorAll('.video-slide'));
        var prev = panel.querySelector('[data-video-prev]');
        var next = panel.querySelector('[data-video-next]');
        var dots = document.querySelector('[data-video-indicators]');
        if (!track || slides.length === 0) return;

        var index = 0;

        function render() {
            track.style.transform = 'translateX(' + (-index * 100) + '%)';
            slides.forEach(function (s, i) {
                s.classList.toggle('is-active', i === index);
                // Keep off-screen slides out of the tab order.
                var btn = s.querySelector('button, iframe');
                if (btn && btn.tagName === 'BUTTON') btn.tabIndex = i === index ? 0 : -1;
            });
            if (dots) {
                Array.prototype.forEach.call(dots.children, function (d, i) {
                    d.classList.toggle('is-active', i === index);
                    d.setAttribute('aria-selected', i === index ? 'true' : 'false');
                });
            }
            var single = slides.length < 2;
            if (prev) prev.hidden = single;
            if (next) next.hidden = single;
        }

        function go(i) {
            index = (i + slides.length) % slides.length;
            render();
        }

        if (dots) {
            dots.innerHTML = '';
            slides.forEach(function (_, i) {
                var d = document.createElement('button');
                d.type = 'button';
                d.className = 'video-dot';
                d.setAttribute('role', 'tab');
                d.setAttribute('aria-label', 'Video ' + (i + 1));
                d.addEventListener('click', function () { go(i); });
                dots.appendChild(d);
            });
            if (slides.length < 2) dots.hidden = true;
        }

        if (prev) prev.addEventListener('click', function () { go(index - 1); });
        if (next) next.addEventListener('click', function () { go(index + 1); });

        panel.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft') { go(index - 1); }
            else if (e.key === 'ArrowRight') { go(index + 1); }
        });

        // Swipe support.
        var startX = null;
        panel.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
        }, { passive: true });
        panel.addEventListener('touchend', function (e) {
            if (startX === null) return;
            var dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 50) { go(dx > 0 ? index - 1 : index + 1); }
            startX = null;
        });

        // Click-to-play: swap the facade for a real player only on demand.
        panel.addEventListener('click', function (e) {
            var facade = e.target.closest ? e.target.closest('.video-facade') : null;
            if (!facade) return;
            var id = facade.getAttribute('data-video-id');
            var title = facade.getAttribute('data-video-title') || 'Video';
            if (!id) return;

            var frame = document.createElement('iframe');
            frame.className = 'video-frame';
            frame.setAttribute('title', title);
            frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
            frame.setAttribute('allowfullscreen', '');
            frame.setAttribute('loading', 'lazy');
            frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
            facade.replaceWith(frame);
        });

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
