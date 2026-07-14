(function () {
    'use strict';

    // Order confirmation / payment-return page (loja/pedido.html).
    //
    // Two ways in:
    //   - Test-provider checkout finished locally → ?status=success&order=<display_id>.
    //   - Returning from Mercado Pago Checkout Pro → ?status=success|pending|failure;
    //     the cart id is in localStorage and still needs completion here (the webhook
    //     may already have authorized the session — completion turns it into an order).

    var config = window.MaharajaCommerce || {};
    var API_URL = config.apiUrl || 'https://backend-production-462f.up.railway.app';
    var PUBLISHABLE_KEY = config.publishableKey ||
        'pk_bd7d54b46835285f4a86c89e8fde5e3b2a3fb81bdb5f2d60cc10478da8d2f415';
    var CART_KEY = 'md-checkout-cart';
    var WHATSAPP = 'https://wa.me/5561991334423';

    function byId(id) { return document.getElementById(id); }

    function show(kind, title, text, orderRef) {
        byId('pedidoIcon').className = 'md-pedido-icon is-' + kind;
        byId('pedidoIcon').innerHTML = kind === 'success'
            ? '<i class="fas fa-check" aria-hidden="true"></i>'
            : kind === 'pending'
                ? '<i class="fas fa-hourglass-half" aria-hidden="true"></i>'
                : '<i class="fas fa-times" aria-hidden="true"></i>';
        byId('pedidoTitle').textContent = title;
        byId('pedidoText').textContent = text;
        var refEl = byId('pedidoRef');
        refEl.hidden = !orderRef;
        if (orderRef) refEl.textContent = 'Pedido nº ' + orderRef;
        byId('pedidoLoading').hidden = true;
        byId('pedidoCard').hidden = false;
    }

    function apiFetch(path, options) {
        options = options || {};
        var init = {
            method: options.method || 'GET',
            headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
        };
        return fetch(API_URL + path, init).then(function (response) {
            return response.json().catch(function () { return {}; }).then(function (data) {
                if (!response.ok) throw new Error((data && data.message) || ('HTTP ' + response.status));
                return data;
            });
        });
    }

    function clearCart() {
        try { localStorage.removeItem(CART_KEY); } catch (err) { /* ignore */ }
    }

    function storedCartId() {
        try { return localStorage.getItem(CART_KEY); } catch (err) { return null; }
    }

    function completeStoredCart(attempt) {
        var cartId = storedCartId();
        if (!cartId) {
            // Nothing to complete (already done in checkout.js) — treat as success.
            show('success', 'Pagamento aprovado!', 'Seu pedido foi confirmado. Você receberá os detalhes por email e a loja entra em contato pelo WhatsApp.');
            return;
        }

        apiFetch('/store/carts/' + cartId + '/complete', { method: 'POST' })
            .then(function (data) {
                if (data.type === 'order' && data.order) {
                    clearCart();
                    show('success', 'Pagamento aprovado!',
                        'Seu pedido foi confirmado. Você receberá os detalhes por email e a loja entra em contato pelo WhatsApp.',
                        data.order.display_id || data.order.id);
                    return;
                }
                throw new Error((data.error && data.error.message) || 'pagamento ainda não confirmado');
            })
            .catch(function () {
                // Payment confirmation (webhook) may lag the redirect — retry briefly.
                if (attempt < 5) {
                    setTimeout(function () { completeStoredCart(attempt + 1); }, 2500);
                } else {
                    show('pending', 'Quase lá...',
                        'O pagamento foi recebido pelo Mercado Pago e o pedido será confirmado em instantes. ' +
                        'Se não receber o email de confirmação, chame a loja no WhatsApp.');
                }
            });
    }

    function init() {
        var params = new URLSearchParams(window.location.search);
        var status = params.get('status') || 'success';
        var orderRef = params.get('order');

        if (orderRef) {
            clearCart();
            show('success', 'Pedido confirmado!',
                'Obrigado! Você receberá os detalhes por email e a loja entra em contato pelo WhatsApp para combinar retirada ou envio.',
                orderRef);
            return;
        }

        if (status === 'failure') {
            show('failure', 'Pagamento não concluído',
                'O pagamento não foi aprovado ou foi cancelado. Nenhum valor foi cobrado — você pode tentar novamente ou falar com a loja.');
            return;
        }

        if (status === 'pending') {
            show('pending', 'Pagamento em processamento',
                'O Mercado Pago está processando o pagamento (boleto/Pix podem levar alguns instantes). O pedido será confirmado assim que aprovado.');
            return;
        }

        completeStoredCart(0);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
