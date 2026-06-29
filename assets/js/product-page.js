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

    // Lazy 3D viewer: only loads the library (and model) when the visitor asks
    // for it, so product pages stay light and keep their Lighthouse scores.
    function setupModelViewer() {
        if (!product || !product.model) return;
        var media = document.querySelector('.md-product-main-media');
        var img = byId('productHeroImage');
        if (!media || !img) return;

        var toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'md-3d-toggle';
        toggle.innerHTML = '<i class="fas fa-cube" aria-hidden="true"></i> Ver em 3D';
        media.appendChild(toggle);

        if (product.modelPreview) {
            var note = document.createElement('span');
            note.className = 'md-3d-note';
            note.textContent = 'Modelo 3D de exemplo';
            media.appendChild(note);
        }

        var viewer = null;
        var showing = false;

        function showModel() {
            toggle.disabled = true;
            toggle.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Carregando 3D…';
            loadModelViewer().then(function () {
                if (!viewer) {
                    viewer = document.createElement('model-viewer');
                    viewer.className = 'md-product-modelviewer';
                    viewer.setAttribute('src', asset(product.model));
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
                showToast('Não foi possível carregar o 3D agora.');
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
        setupModelViewer();
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
