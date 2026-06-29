(function () {
    'use strict';

    var products = window.MaharajaProducts || [];
    var body = document.body;
    var slug = body.getAttribute('data-product-slug');
    var assetBase = body.getAttribute('data-asset-base') || '';
    var product = products.find(function (item) { return item.slug === slug; });
    var selectionKey = 'maharajaSelection';
    var toastTimer;

    function byId(id) {
        return document.getElementById(id);
    }

    function asset(path) {
        if (!path || /^(https?:)?\/\//.test(path) || path.charAt(0) === '/') return path;
        return assetBase + path;
    }

    function getSelection() {
        try {
            return JSON.parse(localStorage.getItem(selectionKey)) || [];
        } catch (error) {
            return [];
        }
    }

    function setSelection(items) {
        localStorage.setItem(selectionKey, JSON.stringify(items));
    }

    function showToast(message) {
        var toast = byId('toastMessage');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
        }, 2200);
    }

    function updateSelectionUI() {
        var cartCount = byId('cartCount');
        var count = getSelection().length;
        if (cartCount) cartCount.textContent = count;
    }

    function renderList(id, items) {
        var target = byId(id);
        if (!target) return;
        target.innerHTML = items.map(function (item) {
            return '<li>' + item + '</li>';
        }).join('');
    }

    function renderTags(id, items) {
        var target = byId(id);
        if (!target) return;
        target.innerHTML = items.map(function (item) {
            return '<span>' + item + '</span>';
        }).join('');
    }

    function setText(id, value) {
        var target = byId(id);
        if (target) target.textContent = value;
    }

    function renderGallery() {
        var main = byId('productHeroImage');
        var thumbs = byId('productGalleryThumbs');
        var images = [product.image, product.scene].filter(Boolean).filter(function (item, index, list) {
            return list.indexOf(item) === index;
        });

        if (main) {
            main.src = asset(images[0]);
            main.alt = product.alt || product.title;
        }

        if (!thumbs) return;
        thumbs.innerHTML = images.map(function (image, index) {
            return '<button type="button" class="' + (index === 0 ? 'active' : '') + '" data-image="' + asset(image) + '" aria-label="Ver imagem ' + (index + 1) + ' de ' + product.title + '"><img src="' + asset(image) + '" alt=""></button>';
        }).join('');

        thumbs.querySelectorAll('button').forEach(function (button) {
            button.addEventListener('click', function () {
                thumbs.querySelectorAll('button').forEach(function (item) { item.classList.toggle('active', item === button); });
                if (main) {
                    main.src = button.getAttribute('data-image');
                }
            });
        });
    }

    function renderRelated() {
        var grid = byId('relatedProducts');
        if (!grid) return;

        var related = (product.related || []).map(function (relatedSlug) {
            return products.find(function (item) { return item.slug === relatedSlug; });
        }).filter(Boolean);

        grid.innerHTML = related.map(function (item) {
            return [
                '<a class="md-related-card" href="' + item.slug + '.html">',
                '<img src="' + asset(item.image) + '" alt="' + (item.alt || item.title) + '">',
                '<span>' + item.badge + '</span>',
                '<strong>' + item.title + '</strong>',
                '<p>' + item.summary + '</p>',
                '</a>'
            ].join('');
        }).join('');
    }

    function updateWhatsApp() {
        var link = byId('productWhatsApp');
        if (!link) return;
        var message = 'Olá, vi a peça "' + product.title + '" no catálogo da Maharaja Decor e quero consultar disponibilidade, valor, tamanho e envio.';
        link.href = 'https://wa.me/5561991334423?text=' + encodeURIComponent(message);
    }

    function renderProduct() {
        if (!product) {
            setText('productTitle', 'Peça não encontrada');
            setText('productSummary', 'Volte ao catálogo para escolher outra curadoria Maharaja.');
            return;
        }

        document.title = product.title + ' | Maharaja Decor';
        var metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) metaDescription.setAttribute('content', product.summary);

        setText('productBadge', product.badge);
        setText('productCategory', product.category);
        setText('productTitle', product.title);
        setText('productPrice', product.price);
        setText('productSummary', product.summary);
        setText('productStory', product.story);
        setText('productSymbolism', product.symbolism);
        setText('productCrumb', product.title);
        renderTags('productTags', product.environments || []);
        renderList('productDetails', product.details || []);
        renderList('productPairings', product.pairings || []);
        renderGallery();
        renderRelated();
        updateWhatsApp();
    }

    function setupActions() {
        var year = byId('mdYear');
        if (year) year.textContent = new Date().getFullYear();

        var addButton = byId('addProductToList');
        if (addButton && product) {
            addButton.addEventListener('click', function () {
                var items = getSelection();
                if (!items.some(function (item) { return item.slug === product.slug; })) {
                    items.push({ slug: product.slug, name: product.title });
                    setSelection(items);
                }
                updateSelectionUI();
                addButton.classList.add('is-added');
                setTimeout(function () { addButton.classList.remove('is-added'); }, 650);
                showToast('Peça adicionada à lista de consulta');
            });
        }

        var scrollUp = byId('scrollUp');
        if (scrollUp) {
            scrollUp.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        var progress = byId('mdScrollProgress');
        var floatingWhatsApp = document.querySelector('.md-floating-whatsapp');
        function updateProgress() {
            if (progress) {
                var height = document.documentElement.scrollHeight - window.innerHeight;
                var percent = height > 0 ? (window.scrollY / height) * 100 : 0;
                progress.style.width = percent + '%';
            }
            if (floatingWhatsApp) {
                floatingWhatsApp.classList.toggle('is-visible', window.scrollY > 420);
            }
            if (scrollUp) {
                scrollUp.style.display = window.scrollY > 300 ? 'inline-flex' : 'none';
            }
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
        updateProgress();
    }

    renderProduct();
    updateSelectionUI();
    setupActions();
}());
