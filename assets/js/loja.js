(function () {
    'use strict';

    // Full-catalog page ("Loja"). Renders EVERY published product from the Medusa
    // backend — the editorial hero pieces link to their handcrafted produto/ pages,
    // everything else opens the generic peca.html template. Unlike stock.js there is
    // no static fallback here: without the backend the full catalog doesn't exist,
    // so we show a friendly state pointing to the curated vitrine and WhatsApp.

    var body = document.body;
    var assetBase = body.getAttribute('data-asset-base') || '';

    var config = window.MaharajaCommerce || {};
    var API_URL = config.apiUrl || 'https://backend-production-462f.up.railway.app';
    var PUBLISHABLE_KEY = config.publishableKey ||
        'pk_bd7d54b46835285f4a86c89e8fde5e3b2a3fb81bdb5f2d60cc10478da8d2f415';
    var API_TIMEOUT_MS = 6000;
    var PAGE_SIZE = 24;

    var grid = document.getElementById('lojaGrid');
    var chipsHost = document.getElementById('lojaChips');
    var searchInput = document.getElementById('lojaSearch');
    var sortSelect = document.getElementById('lojaSort');
    var countLabel = document.getElementById('lojaCount');
    var stateHost = document.getElementById('lojaState');
    var moreButton = document.getElementById('lojaMore');

    var allProducts = [];
    var activeCategory = '';
    var searchTerm = '';
    var visibleLimit = PAGE_SIZE;

    var priceFormatter = null;
    try {
        priceFormatter = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    } catch (err) { /* prices shown as consulta */ }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

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

    function imageUrl(product) {
        var meta = product.metadata || {};
        var url = product.thumbnail ||
            (product.images && product.images[0] && product.images[0].url) ||
            meta.storefront_image;
        if (!url) return assetBase + 'assets/img/maharaja/products/hero-altar.jpg';
        return /^https?:\/\//.test(url) ? url : assetBase + url;
    }

    function productHref(product) {
        var meta = product.metadata || {};
        return meta.editorial
            ? assetBase + 'produto/' + encodeURIComponent(product.handle) + '.html'
            : 'peca.html?slug=' + encodeURIComponent(product.handle);
    }

    function normalize(product) {
        var variant = (product.variants || [])[0] || {};
        var qty = variant.inventory_quantity;
        var managed = variant.manage_inventory !== false;
        var price = variant.calculated_price && variant.calculated_price.calculated_amount;
        var meta = product.metadata || {};
        return {
            handle: product.handle,
            title: product.title || product.handle,
            description: product.description || '',
            categories: (product.categories || []).map(function (cat) { return cat.id; }),
            categoryNames: (product.categories || []).map(function (cat) { return cat.name; }),
            price: typeof price === 'number' ? price : null,
            mode: meta.purchase_mode === 'checkout' ? 'checkout' : 'whatsapp',
            soldOut: managed && typeof qty === 'number' && qty <= 0,
            inventory: (managed && typeof qty === 'number') ? qty : null,
            variantId: variant.id || null,
            image: imageUrl(product),
            href: productHref(product),
            searchable: ((product.title || '') + ' ' + (product.description || '')).toLowerCase()
        };
    }

    function priceLabel(item) {
        if (item.mode === 'checkout' && item.price !== null && priceFormatter) {
            return priceFormatter.format(item.price);
        }
        return 'Sob consulta';
    }

    function cardHtml(item) {
        return [
            '<article class="product-card' + (item.soldOut ? ' is-sold-out' : ' is-available') + '" data-slug="' + esc(item.handle) + '">',
            '<a class="product-media" href="' + esc(item.href) + '" aria-label="Ver ' + esc(item.title) + '">',
            '<img src="' + esc(item.image) + '" alt="' + esc(item.title) + '" loading="lazy" decoding="async">',
            '<span class="md-stock-badge ' + (item.soldOut ? 'is-sold-out' : 'is-in-stock') + '">' + (item.soldOut ? 'Esgotado' : 'Disponível') + '</span>',
            '</a>',
            '<div class="product-body">',
            item.categoryNames.length
                ? '<span class="product-meta">' + esc(item.categoryNames.join(' • ')) + '</span>'
                : '',
            '<h3>' + esc(item.title) + '</h3>',
            item.description ? '<p>' + esc(item.description.slice(0, 120)) + (item.description.length > 120 ? '…' : '') + '</p>' : '',
            '<div class="product-foot">',
            '<strong>' + esc(priceLabel(item)) + '</strong>',
            '</div>',
            '<div class="product-actions">',
            '<a class="btn md-btn md-btn-ghost product-details-link" href="' + esc(item.href) + '">Ver peça</a>',
            (item.mode === 'checkout' && !item.soldOut && item.variantId
                ? '<button type="button" class="btn md-btn md-btn-compact md-add-to-cart"' +
                  ' data-variant-id="' + esc(item.variantId) + '"' +
                  ' data-title="' + esc(item.title) + '"' +
                  (item.inventory !== null ? ' data-max-qty="' + item.inventory + '"' : '') + '>' +
                  '<i class="fas fa-shopping-basket" aria-hidden="true"></i> Carrinho</button>'
                : ''),
            '</div>',
            '</div>',
            '</article>'
        ].join('');
    }

    // One delegated listener covers every re-render of the grid.
    document.addEventListener('click', function (event) {
        var button = event.target.closest('.md-add-to-cart');
        if (!button || !window.MaharajaCart) return;
        var maxQty = button.getAttribute('data-max-qty');
        button.disabled = true;
        window.MaharajaCart.addItem(button.getAttribute('data-variant-id'), {
            title: button.getAttribute('data-title'),
            maxQty: maxQty !== null ? parseInt(maxQty, 10) : undefined
        }).catch(function () { /* toast already shown */ }).then(function () {
            button.disabled = false;
        });
    });

    function currentList() {
        var list = allProducts.filter(function (item) {
            if (activeCategory && item.categories.indexOf(activeCategory) === -1) return false;
            if (searchTerm && item.searchable.indexOf(searchTerm) === -1) return false;
            return true;
        });

        var sort = sortSelect ? sortSelect.value : '';
        if (sort === 'price-asc' || sort === 'price-desc') {
            list = list.slice().sort(function (a, b) {
                var pa = a.price === null ? Infinity : a.price;
                var pb = b.price === null ? Infinity : b.price;
                return sort === 'price-asc' ? pa - pb : pb - pa;
            });
        } else if (sort === 'name') {
            list = list.slice().sort(function (a, b) {
                return a.title.localeCompare(b.title, 'pt-BR');
            });
        }
        return list;
    }

    function render() {
        if (!grid) return;
        var list = currentList();
        var visible = list.slice(0, visibleLimit);

        grid.innerHTML = visible.map(cardHtml).join('');
        if (countLabel) {
            countLabel.textContent = list.length === 1
                ? '1 peça encontrada'
                : list.length + ' peças encontradas';
        }
        if (moreButton) moreButton.hidden = list.length <= visibleLimit;
        if (stateHost) {
            stateHost.hidden = list.length > 0;
            if (!list.length) {
                stateHost.innerHTML = '<p>Nenhuma peça encontrada com esses filtros. ' +
                    'Limpe a busca ou <a href="https://wa.me/5561991334423" target="_blank" rel="noopener">consulte a loja no WhatsApp</a>.</p>';
            }
        }
    }

    function renderChips(categories) {
        if (!chipsHost) return;
        var chips = [{ id: '', name: 'Tudo' }].concat(categories);
        chipsHost.innerHTML = chips.map(function (cat) {
            return '<button type="button" class="md-loja-chip' + (cat.id === activeCategory ? ' is-active' : '') +
                '" data-category="' + esc(cat.id) + '">' + esc(cat.name) + '</button>';
        }).join('');
    }

    function showError() {
        if (grid) grid.innerHTML = '';
        if (countLabel) countLabel.textContent = '';
        if (moreButton) moreButton.hidden = true;
        if (stateHost) {
            stateHost.hidden = false;
            stateHost.innerHTML = [
                '<p><strong>O catálogo completo está fora do ar neste momento.</strong></p>',
                '<p>Veja a <a href="' + assetBase + 'index.html#collection">vitrine de peças curadas</a> ',
                'ou <a href="https://wa.me/5561991334423" target="_blank" rel="noopener">fale com a loja no WhatsApp</a>.</p>'
            ].join('');
        }
    }

    function setupControls(categories) {
        renderChips(categories);

        if (chipsHost) {
            chipsHost.addEventListener('click', function (event) {
                var chip = event.target.closest('.md-loja-chip');
                if (!chip) return;
                activeCategory = chip.getAttribute('data-category') || '';
                visibleLimit = PAGE_SIZE;
                renderChips(categories);
                render();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', function () {
                searchTerm = searchInput.value.trim().toLowerCase();
                visibleLimit = PAGE_SIZE;
                render();
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', function () {
                visibleLimit = PAGE_SIZE;
                render();
            });
        }

        if (moreButton) {
            moreButton.addEventListener('click', function () {
                visibleLimit += PAGE_SIZE;
                render();
            });
        }
    }

    function loadAllProducts(regionId, offset, acc) {
        var fields = 'handle,title,description,thumbnail,*images,*categories,+metadata,' +
            '*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory';
        return apiFetch('/store/products?limit=100&offset=' + offset + '&region_id=' + regionId +
            '&fields=' + encodeURIComponent(fields)).then(function (data) {
            var products = (data && data.products) || [];
            var next = acc.concat(products);
            if (products.length === 100 && next.length < 1000) {
                return loadAllProducts(regionId, offset + 100, next);
            }
            return next;
        });
    }

    function init() {
        if (!window.fetch || !grid) return;
        apiFetch('/store/regions').then(function (data) {
            var region = data && data.regions && data.regions[0];
            if (!region) throw new Error('no region');
            return Promise.all([
                loadAllProducts(region.id, 0, []),
                apiFetch('/store/product-categories').catch(function () { return { product_categories: [] }; })
            ]);
        }).then(function (results) {
            allProducts = results[0].map(normalize);
            var categories = ((results[1] && results[1].product_categories) || []).map(function (cat) {
                return { id: cat.id, name: cat.name };
            });
            setupControls(categories);
            render();
        }).catch(function () {
            showError();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
