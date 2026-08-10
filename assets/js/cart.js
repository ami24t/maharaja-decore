(function () {
    'use strict';

    // Shared shopping cart for Maharaja Decor (real Medusa cart, multi-item).
    //
    // Loaded on every page (injected by site-nav.js). Exposes window.MaharajaCart
    // and keeps the nav cart badge in sync. Distinct from the older
    // "Lista de interesse" wishlist (maharajaSelection / bag icon), which remains
    // the consultative-WhatsApp path; this cart is the direct-purchase path.
    //
    // Storage:
    //   md-cart-id       — the persistent shopping cart (this module)
    //   md-checkout-cart — the cart currently going through checkout/payment
    //                      (written by checkout.js, completed by pedido.js)

    var body = document.body;
    var assetBase = body.getAttribute('data-asset-base') || '';

    var config = window.MaharajaCommerce || {};
    var API_URL = config.apiUrl || 'https://backend-production-462f.up.railway.app';
    var PUBLISHABLE_KEY = config.publishableKey ||
        'pk_bd7d54b46835285f4a86c89e8fde5e3b2a3fb81bdb5f2d60cc10478da8d2f415';
    var CART_ID_KEY = 'md-cart-id';

    var regionPromise = null;
    var toastTimer = null;

    function apiFetch(path, options) {
        options = options || {};
        var init = {
            method: options.method || 'GET',
            headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
        };
        if (options.body !== undefined) {
            init.headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(options.body);
        }
        return fetch(API_URL + path, init).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (data) {
                if (!response.ok) {
                    var message = (data && data.message) || ('HTTP ' + response.status);
                    var error = new Error(message);
                    error.status = response.status;
                    throw error;
                }
                return data;
            });
        });
    }

    function getStoredCartId() {
        try { return localStorage.getItem(CART_ID_KEY); } catch (err) { return null; }
    }

    function storeCartId(id) {
        try {
            if (id) localStorage.setItem(CART_ID_KEY, id);
            else localStorage.removeItem(CART_ID_KEY);
        } catch (err) { /* storage unavailable — cart won't persist */ }
    }

    function getRegion() {
        if (!regionPromise) {
            regionPromise = apiFetch('/store/regions').then(function (data) {
                var region = data.regions && data.regions[0];
                if (!region) throw new Error('Loja indisponível.');
                return region;
            }).catch(function (err) {
                regionPromise = null;
                throw err;
            });
        }
        return regionPromise;
    }

    function fetchCart(cartId) {
        return apiFetch('/store/carts/' + cartId);
    }

    // Returns the existing cart, or null if none / stale / already completed.
    function getCart() {
        var id = getStoredCartId();
        if (!id) return Promise.resolve(null);
        return fetchCart(id).then(function (data) {
            if (data.cart && !data.cart.completed_at) return data.cart;
            storeCartId(null);
            return null;
        }).catch(function () {
            storeCartId(null);
            return null;
        });
    }

    function ensureCart() {
        return getCart().then(function (cart) {
            if (cart) return cart;
            return getRegion().then(function (region) {
                return apiFetch('/store/carts', {
                    method: 'POST',
                    body: { region_id: region.id }
                });
            }).then(function (data) {
                storeCartId(data.cart.id);
                return data.cart;
            });
        });
    }

    function countItems(cart) {
        if (!cart || !cart.items) return 0;
        return cart.items.reduce(function (sum, item) { return sum + (item.quantity || 0); }, 0);
    }

    function refreshBadge(cart) {
        var update = function (resolved) {
            var count = countItems(resolved);
            document.querySelectorAll('.md-cart-badge').forEach(function (el) {
                el.textContent = count;
                el.classList.toggle('is-empty', count === 0);
            });
        };
        if (cart !== undefined) { update(cart); return Promise.resolve(); }
        return getCart().then(update).catch(function () { update(null); });
    }

    function emitUpdated(cart) {
        try {
            document.dispatchEvent(new CustomEvent('mdcart:updated', { detail: { cart: cart } }));
        } catch (err) { /* older browsers — badge already refreshed */ }
        refreshBadge(cart);
    }

    function showToast(message) {
        var toast = document.getElementById('toastMessage');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
    }

    // Adds qty of a variant. maxQty (optional) = known available inventory —
    // when provided, refuses to push the line past it (qty=1 unique pieces).
    function addItem(variantId, options) {
        options = options || {};
        var qty = Math.max(1, options.quantity || 1);
        return ensureCart().then(function (cart) {
            var existing = (cart.items || []).find(function (item) {
                return item.variant_id === variantId;
            });
            if (existing && typeof options.maxQty === 'number' &&
                existing.quantity + qty > options.maxQty) {
                showToast('Quantidade máxima desta peça já está no carrinho.');
                return cart;
            }
            return apiFetch('/store/carts/' + cart.id + '/line-items', {
                method: 'POST',
                body: { variant_id: variantId, quantity: qty }
            }).then(function (data) {
                showToast(options.title
                    ? options.title + ' adicionado ao carrinho'
                    : 'Peça adicionada ao carrinho');
                emitUpdated(data.cart);
                return data.cart;
            });
        }).catch(function (error) {
            showToast('Não foi possível adicionar: ' + error.message);
            throw error;
        });
    }

    function updateLine(lineId, quantity) {
        var id = getStoredCartId();
        if (!id) return Promise.reject(new Error('Carrinho vazio.'));
        return apiFetch('/store/carts/' + id + '/line-items/' + lineId, {
            method: 'POST',
            body: { quantity: quantity }
        }).then(function (data) {
            emitUpdated(data.cart);
            return data.cart;
        });
    }

    function removeLine(lineId) {
        var id = getStoredCartId();
        if (!id) return Promise.reject(new Error('Carrinho vazio.'));
        return apiFetch('/store/carts/' + id + '/line-items/' + lineId, {
            method: 'DELETE'
        }).then(function () {
            return getCart();
        }).then(function (cart) {
            emitUpdated(cart);
            return cart;
        });
    }

    function clear() {
        storeCartId(null);
        emitUpdated(null);
    }

    // ---- nav cart icon ------------------------------------------------------

    function injectNavIcon() {
        var action = document.querySelector('.navbar-nav.action');
        if (!action || action.querySelector('.md-cart-nav')) return;
        var li = document.createElement('li');
        li.className = 'nav-item';
        li.innerHTML = '<a class="icon-btn md-cart-nav" href="' + assetBase +
            'loja/carrinho.html" aria-label="Carrinho de compras">' +
            '<i class="fas fa-shopping-basket" aria-hidden="true"></i>' +
            '<span class="md-cart-badge is-empty" aria-hidden="true">0</span></a>';
        action.appendChild(li);
    }

    window.MaharajaCart = {
        getCart: getCart,
        ensureCart: ensureCart,
        addItem: addItem,
        updateLine: updateLine,
        removeLine: removeLine,
        clear: clear,
        refreshBadge: refreshBadge,
        getStoredCartId: getStoredCartId
    };

    function init() {
        injectNavIcon();
        refreshBadge();
        try {
            document.dispatchEvent(new CustomEvent('mdcart:ready'));
        } catch (err) { /* ignore */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
