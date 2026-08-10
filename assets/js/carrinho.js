(function () {
    'use strict';

    // Cart page (loja/carrinho.html). Renders the shared Medusa cart managed by
    // cart.js: line items with quantity steppers and remove, subtotal, and the
    // "Finalizar compra" hand-off to checkout.html (cart mode — no ?slug).

    var body = document.body;
    var assetBase = body.getAttribute('data-asset-base') || '';

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

    function itemImage(item) {
        var url = item.thumbnail;
        if (!url) return assetBase + 'assets/img/maharaja/products/hero-altar.jpg';
        return /^https?:\/\//.test(url) ? url : assetBase + url;
    }

    function lineHtml(item) {
        var unit = typeof item.unit_price === 'number' ? item.unit_price : null;
        var lineTotal = unit !== null ? unit * item.quantity : null;
        return [
            '<article class="md-carrinho-item" data-line-id="' + esc(item.id) + '">',
            '<img src="' + esc(itemImage(item)) + '" alt="' + esc(item.product_title || item.title) + '">',
            '<div class="md-carrinho-item-body">',
            '<strong>' + esc(item.product_title || item.title) + '</strong>',
            '<span class="md-carrinho-unit">' + money(unit) + ' cada</span>',
            '<div class="md-carrinho-controls">',
            '<div class="md-carrinho-stepper" role="group" aria-label="Quantidade">',
            '<button type="button" class="md-qty-btn" data-action="dec" aria-label="Diminuir">−</button>',
            '<span class="md-qty-value">' + item.quantity + '</span>',
            '<button type="button" class="md-qty-btn" data-action="inc" aria-label="Aumentar">+</button>',
            '</div>',
            '<button type="button" class="md-carrinho-remove" data-action="remove">',
            '<i class="fas fa-trash-alt" aria-hidden="true"></i> Remover</button>',
            '</div>',
            '</div>',
            '<strong class="md-carrinho-line-total">' + money(lineTotal) + '</strong>',
            '</article>'
        ].join('');
    }

    function render(cart) {
        var loading = byId('carrinhoLoading');
        var empty = byId('carrinhoEmpty');
        var layout = byId('carrinhoLayout');
        loading.hidden = true;

        var items = (cart && cart.items) || [];
        if (!items.length) {
            empty.hidden = false;
            layout.hidden = true;
            return;
        }

        empty.hidden = true;
        layout.hidden = false;

        // Stable order: alphabetical by title so re-renders don't shuffle lines.
        items = items.slice().sort(function (a, b) {
            return String(a.product_title || a.title).localeCompare(String(b.product_title || b.title), 'pt-BR');
        });

        byId('carrinhoItems').innerHTML = items.map(lineHtml).join('');

        var count = items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
        var subtotal = items.reduce(function (sum, item) {
            return sum + (typeof item.unit_price === 'number' ? item.unit_price * item.quantity : 0);
        }, 0);
        byId('carrinhoCount').textContent = count === 1 ? '1 peça' : count + ' peças';
        byId('carrinhoSubtotal').textContent = money(subtotal);
    }

    function setLineBusy(lineEl, busy) {
        lineEl.querySelectorAll('button').forEach(function (b) { b.disabled = busy; });
        lineEl.style.opacity = busy ? '0.6' : '';
    }

    function onClick(event) {
        var button = event.target.closest('[data-action]');
        if (!button || !window.MaharajaCart) return;
        var lineEl = button.closest('.md-carrinho-item');
        if (!lineEl) return;
        var lineId = lineEl.getAttribute('data-line-id');
        var qtyEl = lineEl.querySelector('.md-qty-value');
        var current = parseInt(qtyEl ? qtyEl.textContent : '1', 10) || 1;
        var action = button.getAttribute('data-action');

        setLineBusy(lineEl, true);
        var op;
        if (action === 'remove' || (action === 'dec' && current <= 1)) {
            op = window.MaharajaCart.removeLine(lineId);
        } else if (action === 'dec') {
            op = window.MaharajaCart.updateLine(lineId, current - 1);
        } else if (action === 'inc') {
            op = window.MaharajaCart.updateLine(lineId, current + 1);
        } else {
            setLineBusy(lineEl, false);
            return;
        }
        op.then(render).catch(function () {
            setLineBusy(lineEl, false);
        });
    }

    function load() {
        window.MaharajaCart.getCart().then(render).catch(function () {
            byId('carrinhoLoading').hidden = true;
            byId('carrinhoEmpty').hidden = false;
        });
    }

    function init() {
        document.addEventListener('click', onClick);
        if (window.MaharajaCart) {
            load();
        } else {
            document.addEventListener('mdcart:ready', load);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
