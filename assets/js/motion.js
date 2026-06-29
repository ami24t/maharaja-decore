(function () {
    'use strict';

    // Maharaja Decor — motion & transitions layer.
    // Progressive enhancement only: the page entrance is pure CSS (style.css),
    // so if this file fails the site still works and stays visible. Everything
    // here is gated on prefers-reduced-motion and on fine pointers where relevant.

    var reduce = window.matchMedia
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : { matches: false };
    var fine = window.matchMedia
        ? window.matchMedia('(hover: hover) and (pointer: fine)')
        : { matches: true };

    /* ---------------------------------------------------------------
       Page-exit transition: fade out before navigating internally.
       --------------------------------------------------------------- */
    function initPageTransitions() {
        var root = document.documentElement;

        // Restore visible state when returning via the back/forward cache.
        window.addEventListener('pageshow', function (event) {
            if (event.persisted) root.classList.remove('md-page-out');
        });

        if (reduce.matches) return;

        document.addEventListener('click', function (event) {
            if (event.defaultPrevented || event.button !== 0 ||
                event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            var link = event.target.closest('a[href]');
            if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;

            var href = link.getAttribute('href');
            if (!href || href.charAt(0) === '#') return; // in-page anchor / no-op

            var url;
            try { url = new URL(link.href, window.location.href); } catch (e) { return; }
            if (url.origin !== window.location.origin) return; // external
            // Same page + only a hash change → let the browser handle it.
            if (url.pathname === window.location.pathname && url.hash) return;

            event.preventDefault();
            root.classList.add('md-page-out');
            window.setTimeout(function () { window.location.href = link.href; }, 220);
        });
    }

    /* ---------------------------------------------------------------
       Hero parallax: layered pointer-driven depth (logo moves more
       than the copy). Fine pointers only.
       --------------------------------------------------------------- */
    function initHeroParallax() {
        if (reduce.matches || !fine.matches) return;
        var hero = document.querySelector('.md-hero');
        if (!hero) return;
        var content = hero.querySelector('.md-hero-content');
        var logo = hero.querySelector('.md-hero-logo');
        if (!content) return;

        var frame = null;
        hero.addEventListener('pointermove', function (event) {
            if (frame) return;
            frame = requestAnimationFrame(function () {
                frame = null;
                var rect = hero.getBoundingClientRect();
                var dx = (event.clientX - rect.left) / rect.width - 0.5;
                var dy = (event.clientY - rect.top) / rect.height - 0.5;
                content.style.transform =
                    'translate3d(' + (dx * 9).toFixed(1) + 'px,' + (dy * 7).toFixed(1) + 'px,0)';
                if (logo) {
                    logo.style.transform =
                        'translate3d(' + (dx * 9).toFixed(1) + 'px,' + (dy * 7).toFixed(1) + 'px,0)';
                }
            });
        });

        hero.addEventListener('pointerleave', function () {
            content.style.transform = '';
            if (logo) logo.style.transform = '';
        });
    }

    /* ---------------------------------------------------------------
       3D card tilt: pointer-tracked rotateX/Y with a small lift.
       Self-contained inline transforms so it never fights the existing
       hover styles. Fine pointers only.
       --------------------------------------------------------------- */
    function initCardTilt() {
        if (reduce.matches || !fine.matches) return;
        var SELECTOR = '.product-card, .md-exhibit-product, .md-category-card, .md-related-card';
        var MAX = 7; // degrees
        var active = null;
        var frame = null;

        function reset(card) {
            card.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
            card.style.transform = '';
            card.classList.remove('md-tilting');
        }

        document.addEventListener('pointermove', function (event) {
            var card = event.target.closest(SELECTOR);
            if (card !== active) {
                if (active) reset(active);
                active = card;
                if (card) {
                    card.style.transition = 'transform 0.12s ease-out';
                    card.classList.add('md-tilting');
                }
            }
            if (!card || frame) return;
            frame = requestAnimationFrame(function () {
                frame = null;
                if (active !== card) return;
                var rect = card.getBoundingClientRect();
                var px = (event.clientX - rect.left) / rect.width - 0.5;
                var py = (event.clientY - rect.top) / rect.height - 0.5;
                card.style.transform =
                    'perspective(950px) rotateX(' + (py * -MAX).toFixed(2) + 'deg) ' +
                    'rotateY(' + (px * MAX).toFixed(2) + 'deg) translateY(-6px)';
            });
        }, { passive: true });

        // Reset if the pointer leaves a card or the user scrolls.
        document.addEventListener('pointerout', function (event) {
            if (active && !event.relatedTarget) { reset(active); active = null; }
        }, { passive: true });
        window.addEventListener('scroll', function () {
            if (active) { reset(active); active = null; }
        }, { passive: true });
    }

    function init() {
        initPageTransitions();
        initHeroParallax();
        initCardTilt();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
