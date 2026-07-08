(function () {
    'use strict';

    // Buy-now checkout (loja/checkout.html?slug=...&qty=N).
    //
    // Single-item checkout per master plan D5: creates a fresh Medusa cart for the
    // piece, collects contact + entrega (retirada na loja ou envio), then pays:
    //   - Mercado Pago  → redirect to the hosted Checkout Pro page (init_point);
    //                     the return lands on pedido.html which completes the cart.
    //   - Test provider → completes the cart immediately (local development only).

    var body = document.body;
    var assetBase = body.getAttribute('data-asset-base') || '';

    var config = window.MaharajaCommerce || {};
    var API_URL = config.apiUrl || 'http://localhost:9000';
    var PUBLISHABLE_KEY = config.publishableKey ||
        'pk_61239cf22680380ffa76c4ed3f21883a36f775251691a98eaa016ccae084aa3a';
    var MP_PROVIDER_ID = 'pp_mercadopago-checkout_mercadopago-checkout';
    var SYSTEM_PROVIDER_ID = 'pp_system_default';
    var CART_KEY = 'md-checkout-cart';

    var state = {
        region: null,
        product: null,
        variant: null,
        cart: null,
        shippingOptions: [],
        providers: []
    };

    var priceFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

    function byId(id) { return document.getElementById(id); }

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function money(amount) {
        return typeof amount === 'number' ? priceFormatter.format(amount) : '—';
    }

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
                    throw new Error(message);
                }
                return data;
            });
        });
    }

    function showError(message) {
        var el = byId('checkoutError');
        el.hidden = !message;
        el.textContent = message || '';
    }

    function setBusy(busy, label) {
        var button = byId('checkoutSubmit');
        button.disabled = busy;
        button.textContent = busy ? (label || 'Processando...') : 'Finalizar pedido';
    }

    function selectedShippingOption() {
        var checked = document.querySelector('input[name="entrega"]:checked');
        if (!checked) return null;
        return state.shippingOptions.find(function (option) { return option.id === checked.value; }) || null;
    }

    function selectedProviderId() {
        var checked = document.querySelector('input[name="pagamento"]:checked');
        return checked ? checked.value : null;
    }

    function updateSummary() {
        var qty = state.cart ? state.cart.items[0].quantity : 1;
        var unit = state.cart ? state.cart.items[0].unit_price : null;
        var shipping = selectedShippingOption();
        var freight = shipping ? Number(shipping.amount) : 0;
        var total = (unit !== null ? unit * qty : 0) + freight;

        byId('summaryItem').textContent = qty + ' × ' + state.product.title;
        byId('summaryItemPrice').textContent = money(unit !== null ? unit * qty : null);
        byId('summaryShipping').textContent = shipping ? shipping.name : 'Escolha a entrega';
        byId('summaryShippingPrice').textContent = shipping ? (freight === 0 ? 'Grátis' : money(freight)) : '—';
        byId('summaryTotal').textContent = money(total);
    }

    function renderShippingOptions() {
        var host = byId('shippingOptions');
        host.innerHTML = state.shippingOptions.map(function (option, index) {
            var amount = Number(option.amount);
            return [
                '<label class="md-checkout-choice">',
                '<input type="radio" name="entrega" value="' + esc(option.id) + '"' + (index === 0 ? ' checked' : '') + '>',
                '<span><strong>' + esc(option.name) + '</strong>',
                '<small>' + (amount === 0 ? 'Grátis' : money(amount)) + '</small></span>',
                '</label>'
            ].join('');
        }).join('');

        host.addEventListener('change', function () {
            var pickup = isPickupSelected();
            byId('addressFields').hidden = pickup;
            updateSummary();
        });
    }

    function isPickupSelected() {
        var option = selectedShippingOption();
        return !!option && /retirada/i.test(option.name);
    }

    function renderProviders() {
        var host = byId('paymentOptions');
        var labels = {};
        labels[MP_PROVIDER_ID] = { title: 'Mercado Pago', detail: 'Pix, cartão e boleto na página segura do Mercado Pago' };
        labels[SYSTEM_PROVIDER_ID] = { title: 'Pagamento de teste', detail: 'Somente desenvolvimento — confirma o pedido sem cobrança' };

        var known = state.providers.filter(function (p) { return labels[p.id]; });
        host.innerHTML = known.map(function (provider, index) {
            var info = labels[provider.id];
            return [
                '<label class="md-checkout-choice">',
                '<input type="radio" name="pagamento" value="' + esc(provider.id) + '"' + (index === 0 ? ' checked' : '') + '>',
                '<span><strong>' + esc(info.title) + '</strong>',
                '<small>' + esc(info.detail) + '</small></span>',
                '</label>'
            ].join('');
        }).join('');
    }

    function renderItem() {
        var meta = state.product.metadata || {};
        var image = state.product.thumbnail ||
            (state.product.images && state.product.images[0] && state.product.images[0].url) ||
            meta.storefront_image;
        image = image && !/^https?:\/\//.test(image) ? assetBase + image : image;

        byId('checkoutProduct').innerHTML = [
            '<img src="' + esc(image || '') + '" alt="' + esc(state.product.title) + '">',
            '<div><strong>' + esc(state.product.title) + '</strong>',
            '<span>' + money(state.cart.items[0].unit_price) + '</span></div>'
        ].join('');
    }

    // ---- checkout steps ----------------------------------------------------

    function createCart(qty) {
        return apiFetch('/store/carts', {
            method: 'POST',
            body: {
                region_id: state.region.id,
                items: [{ variant_id: state.variant.id, quantity: qty }]
            }
        }).then(function (data) {
            state.cart = data.cart;
            try { localStorage.setItem(CART_KEY, state.cart.id); } catch (err) { /* ignore */ }
        });
    }

    function loadShippingOptions() {
        return apiFetch('/store/shipping-options?cart_id=' + state.cart.id).then(function (data) {
            state.shippingOptions = (data.shipping_options || []).map(function (option) {
                return { id: option.id, name: option.name, amount: option.amount };
            });
        });
    }

    function loadProviders() {
        return apiFetch('/store/payment-providers?region_id=' + state.region.id).then(function (data) {
            state.providers = data.payment_providers || [];
        }).catch(function () {
            state.providers = [{ id: SYSTEM_PROVIDER_ID }];
        });
    }

    function submit(event) {
        event.preventDefault();
        showError('');

        var name = byId('fieldName').value.trim();
        var email = byId('fieldEmail').value.trim();
        var phone = byId('fieldPhone').value.trim();
        var shipping = selectedShippingOption();
        var providerId = selectedProviderId();
        var pickup = isPickupSelected();

        if (!name || !email) { showError('Preencha nome e email.'); return; }
        if (!shipping) { showError('Escolha como quer receber a peça.'); return; }
        if (!providerId) { showError('Escolha a forma de pagamento.'); return; }

        var firstName = name.split(/\s+/)[0];
        var lastName = name.split(/\s+/).slice(1).join(' ') || firstName;
        var address = pickup ? {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            address_1: 'Retirada na loja — Av. Ary Valadão, 1383',
            city: 'Alto Paraíso de Goiás',
            province: 'GO',
            postal_code: '73770-000',
            country_code: 'br'
        } : {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            address_1: byId('fieldStreet').value.trim(),
            city: byId('fieldCity').value.trim(),
            province: byId('fieldUf').value.trim().toUpperCase(),
            postal_code: byId('fieldCep').value.trim(),
            country_code: 'br'
        };

        if (!pickup && (!address.address_1 || !address.city || !address.postal_code)) {
            showError('Preencha o endereço de entrega completo.');
            return;
        }

        setBusy(true);
        apiFetch('/store/carts/' + state.cart.id, {
            method: 'POST',
            body: { email: email, shipping_address: address, billing_address: address }
        }).then(function () {
            return apiFetch('/store/carts/' + state.cart.id + '/shipping-methods', {
                method: 'POST',
                body: { option_id: shipping.id }
            });
        }).then(function () {
            return apiFetch('/store/payment-collections', {
                method: 'POST',
                body: { cart_id: state.cart.id }
            });
        }).then(function (data) {
            return apiFetch('/store/payment-collections/' + data.payment_collection.id + '/payment-sessions', {
                method: 'POST',
                body: { provider_id: providerId }
            });
        }).then(function (data) {
            if (providerId === MP_PROVIDER_ID) {
                var sessions = (data.payment_collection && data.payment_collection.payment_sessions) || [];
                var session = sessions.find(function (s) { return s.provider_id === MP_PROVIDER_ID; }) || sessions[0];
                var redirect = session && session.data &&
                    (session.data.init_point || session.data.sandbox_init_point);
                if (!redirect) throw new Error('Mercado Pago não retornou a página de pagamento.');
                setBusy(true, 'Redirecionando ao Mercado Pago...');
                window.location.href = redirect;
                return null;
            }
            return completeCart();
        }).catch(function (error) {
            setBusy(false);
            showError('Não foi possível concluir: ' + error.message);
        });
    }

    function completeCart() {
        return apiFetch('/store/carts/' + state.cart.id + '/complete', { method: 'POST' })
            .then(function (data) {
                if (data.type === 'order' && data.order) {
                    try { localStorage.removeItem(CART_KEY); } catch (err) { /* ignore */ }
                    window.location.href = 'pedido.html?status=success&order=' +
                        encodeURIComponent(data.order.display_id || data.order.id);
                    return;
                }
                var message = (data.error && data.error.message) || 'O pedido não pôde ser concluído.';
                throw new Error(message);
            });
    }

    // ---- init ---------------------------------------------------------------

    function init() {
        var params = new URLSearchParams(window.location.search);
        var slug = params.get('slug');
        var qty = Math.max(1, parseInt(params.get('qty') || '1', 10) || 1);
        if (!slug) {
            showError('Peça não informada.');
            return;
        }

        apiFetch('/store/regions').then(function (data) {
            state.region = data.regions && data.regions[0];
            if (!state.region) throw new Error('Loja indisponível no momento.');
            var fields = 'handle,title,thumbnail,*images,+metadata,*variants,' +
                '+variants.inventory_quantity,+variants.manage_inventory,*variants.calculated_price';
            return apiFetch('/store/products?handle=' + encodeURIComponent(slug) +
                '&region_id=' + state.region.id + '&fields=' + encodeURIComponent(fields));
        }).then(function (data) {
            state.product = data.products && data.products[0];
            if (!state.product) throw new Error('Peça não encontrada.');
            state.variant = (state.product.variants || [])[0];
            var meta = state.product.metadata || {};
            if (!state.variant || meta.purchase_mode !== 'checkout') {
                throw new Error('Esta peça é vendida por consulta no WhatsApp.');
            }
            var stock = state.variant.inventory_quantity;
            if (state.variant.manage_inventory !== false && typeof stock === 'number' && stock < qty) {
                throw new Error('Peça esgotada no momento.');
            }
            return createCart(qty);
        }).then(function () {
            return Promise.all([loadShippingOptions(), loadProviders()]);
        }).then(function () {
            renderItem();
            renderShippingOptions();
            renderProviders();
            byId('addressFields').hidden = isPickupSelected();
            updateSummary();
            byId('checkoutLoading').hidden = true;
            byId('checkoutLayout').hidden = false;
            byId('checkoutForm').addEventListener('submit', submit);
        }).catch(function (error) {
            byId('checkoutLoading').hidden = true;
            showError(error.message || 'Não foi possível carregar o checkout.');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
