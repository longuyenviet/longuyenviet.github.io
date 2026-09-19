/* Small progressive enhancements that do not belong to any one widget. */
(function () {
    'use strict';

    function init() {
        /* ------------------------------------------------------------------
         * Email: assembled at runtime so the address never appears as a
         * literal mailto: string in the served HTML. Visitors still see and
         * can click a normal address; harvesters that do not run JS see only
         * a zero-width-joined "user (at) domain" placeholder.
         * ---------------------------------------------------------------- */
        Array.prototype.forEach.call(document.querySelectorAll('.js-email'), function (el) {
            var user = el.getAttribute('data-user');
            var domain = el.getAttribute('data-domain');
            if (!user || !domain) return;
            var address = user + '@' + domain;
            el.setAttribute('href', 'mailto:' + address);
            var label = el.querySelector('.email-text');
            if (label) label.textContent = address;
        });

        /* ------------------------------------------------------------------
         * Defensive: make sure no outbound link opens a new tab without
         * severing the opener reference.
         * ---------------------------------------------------------------- */
        Array.prototype.forEach.call(document.querySelectorAll('a[target="_blank"]'), function (a) {
            var rel = (a.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
            if (rel.indexOf('noopener') === -1) rel.push('noopener');
            if (rel.indexOf('noreferrer') === -1) rel.push('noreferrer');
            a.setAttribute('rel', rel.join(' '));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
