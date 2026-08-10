(function () {
    'use strict';

    // Generic product page (loja/peca.html?slug=...). Renders any catalog product
    // from the Medusa Store API. Editorial hero pieces redirect to their handcrafted
    // produto/ pages, so this template only ever shows the "long tail" inventory.

    var body = document.body;
    var assetBase = body.getAttribute('data-asset-base') || '';

    var config = window.MaharajaCommerce || {};
    var API_URL = config.apiUrl || 'https://backend-production-462f.up.railway.app';
    var PUBLISHABLE_KEY = config.publishableKey ||
        'pk_bd7d54b46835285f4a86c89e8fde5e3b2a3fb81bdb5f2d60cc10478da8d2f415';
    var API_TIMEOUT_MS = 6000;
    var WHATSAPP = 'https://wa.me/5561991334423';

    var priceFormatter = null;
    try {
        priceFormatter = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    } catch (err) { /* price shown as consulta */ }

    function byId(id) { return document.getElementById(id); }

    // ---- Lazy 3D viewer (mirrors product-page.js for editorial pages) -----
    // Loads @google/model-viewer only when the visitor asks, and only for
    // products carrying metadata.storefront_model (Meshy-generated GLB).

    var MODEL_VIEWER_SRC = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
    var modelLibPromise = null;

    function loadModelViewer() {
        if (modelLibPromise) return modelLibPromise;
        modelLibPromise = new Promise(function (resolve, reject) {
            if (window.customElements && customElements.get('model-viewer')) { resolve(); return; }
            var script = document.createElement('script');
            script.type = 'module';
            script.src = MODEL_VIEWER_SRC;
            script.onload = function () { customElements.whenDefined('model-viewer').then(resolve, resolve); };
            script.onerror = reject;
            document.head.appendChild(script);
        });
        return modelLibPromise;
    }

    function setupModelViewer(product) {
        var meta = product.metadata || {};
        var modelUrl = meta.storefront_model;
        if (!modelUrl) return;
        var media = document.querySelector('.md-peca-media');
        var img = byId('pecaImage');
        if (!media || !img) return;

        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'md-3d-toggle';
        toggle.innerHTML = '<i class="fas fa-cube" aria-hidden="true"></i> Ver em 3D';
        media.appendChild(toggle);

        // AI-reconstructed models are an illustration, not an exact replica of
        // the hand-painted piece — always label them so customers aren't misled.
        var note = document.createElement('span');
        note.className = 'md-3d-note';
        note.textContent = 'Modelo 3D ilustrativo';
        media.appendChild(note);

        var modelSrc = /^https?:\/\//.test(modelUrl) ? modelUrl : assetBase + modelUrl;
        var viewer = null;
        var showing = false;

        function showModel() {
            toggle.disabled = true;
            toggle.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Carregando 3D…';
            loadModelViewer().then(function () {
                if (!viewer) {
                    viewer = document.createElement('model-viewer');
                    viewer.className = 'md-product-modelviewer';
                    viewer.setAttribute('src', modelSrc);
                    viewer.setAttribute('poster', img.currentSrc || img.src);
                    viewer.setAttribute('alt', 'Modelo 3D de ' + (product.title || 'peça'));
                    viewer.setAttribute('camera-controls', '');
                    viewer.setAttribute('auto-rotate', '');
                    viewer.setAttribute('auto-rotate-delay', '0');
                    viewer.setAttribute('rotation-per-second', '18deg');
                    viewer.setAttribute('interaction-prompt', 'auto');
                    viewer.setAttribute('shadow-intensity', '1');
                    viewer.setAttribute('exposure', '1');
                    viewer.setAttribute('ar', '');
                    viewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
                    viewer.setAttribute('loading', 'eager');
                    media.appendChild(viewer);
                }
                media.classList.add('is-3d');
                showing = true;
                toggle.disabled = false;
                toggle.innerHTML = '<i class="fas fa-image" aria-hidden="true"></i> Ver fotos';
            }).catch(function () {
                toggle.disabled = false;
                toggle.innerHTML = '<i class="fas fa-cube" aria-hidden="true"></i> Ver em 3D';
            });
        }

        function showPhotos() {
            media.classList.remove('is-3d');
            showing = false;
            toggle.innerHTML = '<i class="fas fa-cube" aria-hidden="true"></i> Ver em 3D';
        }

        toggle.addEventListener('click', function () {
            if (showing) showPhotos(); else showModel();
        });
    }

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

    function showState(html) {
        var state = byId('pecaState');
        if (!state) return;
        state.hidden = false;
        state.innerHTML = html;
    }

    function whatsAppHref(title) {
        var text = 'Olá! Vi a peça "' + title + '" no site da Maharaja Decor e quero consultar disponibilidade, valores e envio.';
        return WHATSAPP + '?text=' + encodeURIComponent(text);
    }

    function relatedCardHtml(product) {
        var meta = product.metadata || {};
        var href = meta.editorial
            ? assetBase + 'produto/' + encodeURIComponent(product.handle) + '.html'
            : 'peca.html?slug=' + encodeURIComponent(product.handle);
        return [
            '<article class="product-card" data-slug="' + esc(product.handle) + '">',
            '<a class="product-media" href="' + esc(href) + '" aria-label="Ver ' + esc(product.title) + '">',
            '<img src="' + esc(imageUrl(product)) + '" alt="' + esc(product.title) + '" loading="lazy" decoding="async">',
            '</a>',
            '<div class="product-body">',
            '<h3>' + esc(product.title) + '</h3>',
            '<div class="product-actions">',
            '<a class="btn md-btn md-btn-ghost product-details-link" href="' + esc(href) + '">Ver peça</a>',
            '</div>',
            '</div>',
            '</article>'
        ].join('');
    }

    function renderRelated(regionId, product) {
        var categories = product.categories || [];
        if (!categories.length) return;
        var fields = 'handle,title,thumbnail,*images,+metadata';
        apiFetch('/store/products?limit=5&region_id=' + regionId +
            '&category_id[]=' + encodeURIComponent(categories[0].id) +
            '&fields=' + encodeURIComponent(fields)).then(function (data) {
            var related = ((data && data.products) || []).filter(function (item) {
                return item.handle !== product.handle;
            }).slice(0, 4);
            if (!related.length) return;
            var heading = byId('pecaRelatedHeading');
            if (heading) heading.hidden = false;
            var host = byId('pecaRelated');
            if (host) host.innerHTML = related.map(relatedCardHtml).join('');
        }).catch(function () { /* related is optional */ });
    }

    function render(regionId, product) {
        var meta = product.metadata || {};
        if (meta.editorial) {
            window.location.replace(assetBase + 'produto/' + encodeURIComponent(product.handle) + '.html');
            return;
        }

        var variant = (product.variants || [])[0] || {};
        var qty = variant.inventory_quantity;
        var managed = variant.manage_inventory !== false;
        var soldOut = managed && typeof qty === 'number' && qty <= 0;
        var price = variant.calculated_price && variant.calculated_price.calculated_amount;
        var isCheckout = meta.purchase_mode === 'checkout';

        document.title = product.title + ' | Maharaja Decor';
        var metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && product.description) {
            metaDescription.setAttribute('content', product.description.slice(0, 160));
        }

        byId('pecaCrumb').textContent = product.title;
        byId('pecaTitle').textContent = product.title;
        byId('pecaDescription').textContent = product.description || '';
        byId('pecaCategory').textContent = (product.categories || [])
            .map(function (cat) { return cat.name; }).join(' • ') || 'Catálogo Maharaja';

        var image = byId('pecaImage');
        image.src = imageUrl(product);
        image.alt = product.title;

        var badge = byId('pecaBadge');
        badge.hidden = false;
        badge.textContent = soldOut ? 'Esgotado' : 'Disponível';
        badge.className = 'md-stock-badge ' + (soldOut ? 'is-sold-out' : 'is-in-stock');

        byId('pecaPrice').textContent = (isCheckout && typeof price === 'number' && priceFormatter)
            ? priceFormatter.format(price)
            : 'Sob consulta';

        var availability = byId('pecaAvailability');
        if (soldOut) {
            availability.textContent = 'Peça esgotada no momento — consulte a loja sobre novas chegadas.';
        } else if (managed && typeof qty === 'number' && qty <= 5) {
            availability.textContent = qty === 1 ? 'Última unidade disponível.' : 'Últimas ' + qty + ' unidades disponíveis.';
        } else {
            availability.textContent = 'Disponível na loja em Alto Paraíso de Goiás.';
        }

        byId('pecaWhatsApp').href = whatsAppHref(product.title);

        var buy = byId('pecaBuy');
        if (buy && isCheckout && !soldOut) {
            buy.href = 'checkout.html?slug=' + encodeURIComponent(product.handle);
            buy.hidden = false;
            var whats = byId('pecaWhatsApp');
            whats.classList.remove('md-btn');
            whats.classList.add('md-btn', 'md-btn-ghost');

            // "Adicionar ao carrinho" beside buy-now (multi-item flow).
            if (variant.id && !byId('pecaAddCart')) {
                var addBtn = document.createElement('button');
                addBtn.id = 'pecaAddCart';
                addBtn.type = 'button';
                addBtn.className = 'btn md-btn md-btn-ghost';
                addBtn.innerHTML = '<i class="fas fa-shopping-basket" aria-hidden="true"></i> Adicionar ao carrinho';
                addBtn.addEventListener('click', function () {
                    if (!window.MaharajaCart) return;
                    addBtn.disabled = true;
                    window.MaharajaCart.addItem(variant.id, {
                        title: product.title,
                        maxQty: (managed && typeof qty === 'number') ? qty : undefined
                    }).catch(function () { /* toast already shown */ }).then(function () {
                        addBtn.disabled = false;
                    });
                });
                buy.parentNode.insertBefore(addBtn, buy.nextSibling);
            }
        }

        byId('pecaLayout').hidden = false;

        setupModelViewer(product);
        renderRelated(regionId, product);
    }

    function init() {
        if (!window.fetch) return;
        var params = new URLSearchParams(window.location.search);
        var slug = params.get('slug');
        if (!slug) {
            showState('<p>Peça não informada. <a href="index.html">Voltar à loja</a>.</p>');
            return;
        }

        apiFetch('/store/regions').then(function (data) {
            var region = data && data.regions && data.regions[0];
            if (!region) throw new Error('no region');
            var fields = 'handle,title,description,thumbnail,*images,*categories,+metadata,' +
                '*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory';
            return apiFetch('/store/products?handle=' + encodeURIComponent(slug) +
                '&region_id=' + region.id + '&fields=' + encodeURIComponent(fields))
                .then(function (result) {
                    var product = result && result.products && result.products[0];
                    if (!product) {
                        showState('<p>Peça não encontrada. <a href="index.html">Voltar à loja</a>.</p>');
                        return;
                    }
                    render(region.id, product);
                });
        }).catch(function () {
            showState([
                '<p><strong>Não foi possível carregar a peça agora.</strong></p>',
                '<p>Veja a <a href="' + assetBase + 'index.html#collection">vitrine curada</a> ',
                'ou <a href="' + WHATSAPP + '" target="_blank" rel="noopener">fale com a loja no WhatsApp</a>.</p>'
            ].join(''));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
