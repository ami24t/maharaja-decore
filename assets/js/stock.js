(function () {
    'use strict';

    // Commerce read-path for Maharaja Decor.
    //
    // Primary source: the Medusa backend (maharaja-backend repo) via the Store API —
    // live stock quantities, prices and purchase mode per piece, joined by
    // product handle === the slugs this site already uses.
    // Fallback: assets/data/stock.json (the original manual file), so the site keeps
    // working exactly as before when the backend is unreachable. Fails open: if both
    // sources fail, nothing is painted and the catalog stays untouched.
    //
    // Pieces with metadata.purchase_mode === 'checkout' show their real price;
    // 'whatsapp' pieces keep "Sob consulta" (consultative sale).

    var body = document.body;
    var assetBase = body.getAttribute('data-asset-base') || '';
    var STOCK_URL = assetBase + 'assets/data/stock.json';

    var config = window.MaharajaCommerce || {};
    var API_URL = config.apiUrl || 'http://localhost:9000';
    var PUBLISHABLE_KEY = config.publishableKey ||
        'pk_61239cf22680380ffa76c4ed3f21883a36f775251691a98eaa016ccae084aa3a';
    var API_TIMEOUT_MS = 3000;
    var CACHE_KEY = 'md-catalog-v1';
    var CACHE_TTL_MS = 60000;

    var LABELS = {
        in_stock: { text: 'Disponível', cls: 'is-in-stock' },
        sold_out: { text: 'Esgotado', cls: 'is-sold-out' }
    };

    var priceFormatter = null;
    try {
        priceFormatter = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    } catch (err) { /* keep null — prices simply not painted */ }

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

    function decorate(items) {
        // Index grid + exhibition (coleções/ambientes) cards share the pattern:
        // a card element carrying data-slug with an image-wrapper to host the ribbon.
        [
            { card: '.product-card[data-slug]', media: '.product-media' },
            { card: '.md-exhibit-product[data-slug]', media: '.md-exhibit-product-media' }
        ].forEach(function (group) {
            document.querySelectorAll(group.card).forEach(function (card) {
                var entry = items[card.getAttribute('data-slug')];
                apply(card, entry && entry.state, card.querySelector(group.media));
            });
        });

        // Product detail page (single product identified on <body>).
        var slug = body.getAttribute('data-product-slug');
        if (slug && items[slug]) {
            var card = document.querySelector('.md-product-detail-hero') || body;
            apply(card, items[slug].state, document.querySelector('.md-product-main-media'));
        }
    }

    function formatPrice(amount) {
        if (!priceFormatter || typeof amount !== 'number') return null;
        return priceFormatter.format(amount);
    }

    function paintPrices(items) {
        // Home grid cards: <div class="product-foot"><strong>Sob consulta</strong>…
        document.querySelectorAll('.product-card[data-slug]').forEach(function (card) {
            var entry = items[card.getAttribute('data-slug')];
            var target = card.querySelector('.product-foot strong');
            if (!entry || !target) return;
            var text = entry.mode === 'checkout' ? formatPrice(entry.price) : null;
            if (text) target.textContent = text;
        });

        // Product detail page price line.
        var slug = body.getAttribute('data-product-slug');
        var priceEl = document.getElementById('productPrice');
        if (slug && priceEl && items[slug]) {
            var detailText = items[slug].mode === 'checkout' ? formatPrice(items[slug].price) : null;
            if (detailText) priceEl.textContent = detailText;
        }
    }

    // ---- Medusa Store API (primary source) --------------------------------

    function apiFetch(path) {
        var controller = window.AbortController ? new AbortController() : null;
        var timer = controller && setTimeout(function () { controller.abort(); }, API_TIMEOUT_MS);
        return fetch(API_URL + path, {
            headers: { 'x-publishable-api-key': PUBLISHABLE_KEY },
            signal: controller ? controller.signal : undefined
        }).then(function (response) {
            if (timer) clearTimeout(timer);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        }, function (err) {
            if (timer) clearTimeout(timer);
            throw err;
        });
    }

    function readCache() {
        try {
            var raw = sessionStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            var parsed = JSON.parse(raw);
            if (!parsed || (Date.now() - parsed.at) > CACHE_TTL_MS) return null;
            return parsed.items;
        } catch (err) { return null; }
    }

    function writeCache(items) {
        try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items: items }));
        } catch (err) { /* storage may be unavailable — ignore */ }
    }

    function transformProducts(products) {
        var items = {};
        (products || []).forEach(function (product) {
            var variant = (product.variants || [])[0];
            if (!product.handle || !variant) return;
            var qty = variant.inventory_quantity;
            var managed = variant.manage_inventory !== false;
            var price = variant.calculated_price && variant.calculated_price.calculated_amount;
            var meta = product.metadata || {};
            items[product.handle] = {
                state: (managed && typeof qty === 'number' && qty <= 0) ? 'sold_out' : 'in_stock',
                price: typeof price === 'number' ? price : null,
                mode: meta.purchase_mode === 'checkout' ? 'checkout' : 'whatsapp'
            };
        });
        return items;
    }

    function loadFromApi() {
        var cached = readCache();
        if (cached) return Promise.resolve(cached);

        return apiFetch('/store/regions').then(function (data) {
            var region = data && data.regions && data.regions[0];
            if (!region) throw new Error('no region');
            var fields = 'handle,+metadata,*variants.calculated_price,' +
                '+variants.inventory_quantity,+variants.manage_inventory';
            return apiFetch('/store/products?limit=100&region_id=' + region.id +
                '&fields=' + encodeURIComponent(fields));
        }).then(function (data) {
            if (!data || !data.products || !data.products.length) throw new Error('empty catalog');
            var items = transformProducts(data.products);
            writeCache(items);
            return items;
        });
    }

    // ---- stock.json (fallback source) --------------------------------------

    function loadFromJson() {
        return fetch(STOCK_URL, { cache: 'no-store' })
            .then(function (response) { return response.ok ? response.json() : null; })
            .then(function (data) {
                var raw = (data && data.items) || {};
                var items = {};
                Object.keys(raw).forEach(function (slug) {
                    items[slug] = { state: raw[slug], price: null, mode: 'whatsapp' };
                });
                return items;
            });
    }

    function init() {
        if (!window.fetch) return;
        loadFromApi()
            .catch(function () { return loadFromJson(); })
            .then(function (items) {
                if (!items) return;
                decorate(items);
                paintPrices(items);
            })
            .catch(function () { /* fail open — leave the catalog untouched */ });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
