(function () {
    'use strict';

    // Shared editorial reveal-on-scroll for Maharaja Decor subpages.
    // Mirrors the IntersectionObserver reveal used inline on index.html so the
    // produto/, colecoes/ and ambientes/ pages get the same staggered fade-in.
    // Included last on each subpage, after product-page.js / exhibition-page.js
    // have injected their content, so dynamically rendered cards are covered.

    var SELECTORS = [
        // shared section chrome
        '.md-breadcrumb',
        '.md-section-heading',
        // product detail (produto/*)
        '.md-product-gallery',
        '.md-product-detail-copy',
        '.md-product-story-grid > article',
        '.md-product-story-grid > aside',
        '.md-related-card',
        // exhibition pages (colecoes/* and ambientes/*)
        '.md-exhibition-media',
        '.md-exhibition-panel > div',
        '.md-exhibition-steps > article',
        '.md-exhibit-product',
        '.md-exhibit-link-card'
    ];

    function run() {
        var reducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var targets = Array.prototype.slice.call(
            document.querySelectorAll(SELECTORS.join(','))
        ).filter(function (item) {
            return !item.classList.contains('md-reveal');
        });

        if (!targets.length) return;

        targets.forEach(function (item, index) {
            item.classList.add('md-reveal');
            // Same stagger curve index.html uses: 0, 70, 140, 210ms, repeating.
            item.style.setProperty('--reveal-delay', Math.min(index % 4, 3) * 70 + 'ms');
        });

        if ('IntersectionObserver' in window && !reducedMotion) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });

            targets.forEach(function (item) { observer.observe(item); });
        } else {
            // Reduced motion or no observer support: show everything immediately.
            targets.forEach(function (item) { item.classList.add('is-visible'); });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
}());
