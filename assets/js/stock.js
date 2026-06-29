(function () {
    'use strict';

    // Availability ("estoque") layer for Maharaja Decor.
    // Reads assets/data/stock.json (maintained by hand or written by the
    // Instagram sync cron — see scripts/sync-instagram-stock.mjs) and paints a
    // Disponível / Esgotado ribbon on every product surface, dimming sold-out
    // pieces. Fails open: if the file is missing or unreachable, nothing changes.

    var body = document.body;
    var assetBase = body.getAttribute('data-asset-base') || '';
    var STOCK_URL = assetBase + 'assets/data/stock.json';

    var LABELS = {
        in_stock: { text: 'Disponível', cls: 'is-in-stock' },
        sold_out: { text: 'Esgotado', cls: 'is-sold-out' }
    };

    function makeBadge(state) {
        var info = LABELS[state] || LABELS.in_stock;
        var el = document.createElement('span');
        el.className = 'md-stock-badge ' + info.cls;
        el.textContent = info.text;
        return el;
    }

    function apply(card, state, media) {
        if (!state || !media || !LABELS[state]) return;
        var prev = media.querySelector(':scope > .md-stock-badge');
        if (prev) prev.remove();
        media.appendChild(makeBadge(state));
        card.classList.toggle('is-sold-out', state === 'sold_out');
        card.classList.toggle('is-available', state === 'in_stock');
    }

    function decorate(stock) {
        var items = (stock && stock.items) || {};

        // Index grid + exhibition (coleções/ambientes) cards share the pattern:
        // a card element carrying data-slug with an image-wrapper to host the ribbon.
        [
            { card: '.product-card[data-slug]', media: '.product-media' },
            { card: '.md-exhibit-product[data-slug]', media: '.md-exhibit-product-media' }
        ].forEach(function (group) {
            document.querySelectorAll(group.card).forEach(function (card) {
                apply(card, items[card.getAttribute('data-slug')], card.querySelector(group.media));
            });
        });

        // Product detail page (single product identified on <body>).
        var slug = body.getAttribute('data-product-slug');
        if (slug) {
            var card = document.querySelector('.md-product-detail-hero') || body;
            apply(card, items[slug], document.querySelector('.md-product-main-media'));
        }
    }

    function init() {
        if (!window.fetch) return;
        fetch(STOCK_URL, { cache: 'no-store' })
            .then(function (response) { return response.ok ? response.json() : null; })
            .then(function (data) { if (data) decorate(data); })
            .catch(function () { /* fail open — leave the catalog untouched */ });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
