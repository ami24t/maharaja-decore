(function () {
    'use strict';

    var productData = window.MaharajaProducts || [];
    var exhibition = window.MaharajaExhibition || {};
    var body = document.body;
    var pageType = body.getAttribute('data-page-type') || 'ambientes';
    var pageSlug = body.getAttribute('data-page-slug');
    var assetBase = body.getAttribute('data-asset-base') || '';
    var page = (exhibition[pageType] || []).find(function (item) { return item.slug === pageSlug; });
    var selectionKey = 'maharajaSelection';
    var toastTimer;

    function byId(id) {
        return document.getElementById(id);
    }

    function asset(path) {
        if (!path || /^(https?:)?\/\//.test(path) || path.charAt(0) === '/') return path;
        return assetBase + path;
    }

    function productBySlug(slug) {
        return productData.find(function (item) { return item.slug === slug; });
    }

    function setText(id, value) {
        var target = byId(id);
        if (target) target.textContent = value || '';
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

    function updateSelectionUI() {
        var target = byId('cartCount');
        if (target) target.textContent = getSelection().length;
    }

    function showToast(message) {
        var toast = byId('toastMessage');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
    }

    function renderTags(id, items) {
        var target = byId(id);
        if (!target) return;
        target.innerHTML = (items || []).map(function (item) {
            return '<span>' + item + '</span>';
        }).join('');
    }

    function renderSteps() {
        var target = byId('exhibitionSteps');
        if (!target) return;
        target.innerHTML = (page.steps || []).map(function (step, index) {
            return '<article><span>' + String(index + 1).padStart(2, '0') + '</span><strong>' + step + '</strong></article>';
        }).join('');
    }

    function renderProducts() {
        var grid = byId('exhibitionProducts');
        if (!grid) return;
        grid.innerHTML = (page.products || []).map(productBySlug).filter(Boolean).map(function (product) {
            return [
                '<article class="md-exhibit-product">',
                '<a class="md-exhibit-product-media" href="../produto/' + product.slug + '.html"><img src="' + asset(product.image) + '" alt="' + (product.alt || product.title) + '"></a>',
                '<div>',
                '<span>' + product.badge + '</span>',
                '<h3>' + product.title + '</h3>',
                '<p>' + product.summary + '</p>',
                '<div class="product-scene-tags">' + (product.environments || []).slice(0, 3).map(function (tag) { return '<span>' + tag + '</span>'; }).join('') + '</div>',
                '<div class="product-actions">',
                '<button class="btn md-btn md-btn-compact add-exhibit-product" type="button" data-slug="' + product.slug + '" data-name="' + product.title + '"><i class="fas fa-plus" aria-hidden="true"></i>Lista</button>',
                '<a class="btn md-btn md-btn-ghost" href="../produto/' + product.slug + '.html">Ver peça</a>',
                '</div>',
                '</div>',
                '</article>'
            ].join('');
        }).join('');
    }

    function renderRelated() {
        var grid = byId('exhibitionRelated');
        if (!grid) return;
        grid.innerHTML = (page.related || []).map(function (item) {
            var pool = exhibition[item.type] || [];
            var related = pool.find(function (entry) { return entry.slug === item.slug; });
            if (!related) return '';
            return [
                '<a class="md-exhibit-link-card" href="../' + item.type + '/' + item.slug + '.html">',
                '<img src="' + asset(related.heroImage) + '" alt="' + related.alt + '">',
                '<span>' + related.eyebrow + '</span>',
                '<strong>' + item.label + '</strong>',
                '<p>' + related.subtitle + '</p>',
                '</a>'
            ].join('');
        }).join('');
    }

    function setupActions() {
        var year = byId('mdYear');
        if (year) year.textContent = new Date().getFullYear();

        setupMenu();

        document.addEventListener('click', function (event) {
            var add = event.target.closest('.add-exhibit-product');
            if (!add) return;
            var items = getSelection();
            var slug = add.getAttribute('data-slug');
            var name = add.getAttribute('data-name');
            if (slug && !items.some(function (item) { return item.slug === slug; })) {
                items.push({ slug: slug, name: name });
                setSelection(items);
            }
            updateSelectionUI();
            add.classList.add('is-added');
            setTimeout(function () { add.classList.remove('is-added'); }, 650);
            showToast('Peça adicionada à lista de consulta');
        });

        var progress = byId('mdScrollProgress');
        var scrollUp = byId('scrollUp');
        var floatingWhatsApp = document.querySelector('.md-floating-whatsapp');
        function updateProgress() {
            if (progress) {
                var height = document.documentElement.scrollHeight - window.innerHeight;
                progress.style.width = (height > 0 ? (window.scrollY / height) * 100 : 0) + '%';
            }
            if (floatingWhatsApp) floatingWhatsApp.classList.toggle('is-visible', window.scrollY > 420);
            if (scrollUp) scrollUp.style.display = window.scrollY > 300 ? 'inline-flex' : 'none';
        }
        if (scrollUp) scrollUp.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
        updateProgress();
    }

    function setupMenu() {
        var header = document.querySelector('.navbar .container.header');
        if (!header || document.querySelector('.md-nav-drawer-toggle') || document.querySelector('.md-exhibition-menu-button')) return;

        var button = document.createElement('button');
        button.className = 'icon-btn md-exhibition-menu-button';
        button.type = 'button';
        button.setAttribute('aria-label', 'Abrir menu');
        button.setAttribute('aria-expanded', 'false');
        button.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
        header.appendChild(button);

        var menu = document.createElement('div');
        menu.className = 'md-exhibition-menu';
        menu.innerHTML = [
            '<nav aria-label="Menu de páginas">',
            '<a href="../index.html#home">Início</a>',
            '<a href="../ambientes/sala.html">Ambientes</a>',
            '<a href="../colecoes/estatuas.html">Estátuas</a>',
            '<a href="../colecoes/sagrado.html">Coleções</a>',
            '<a href="../index.html#collection">Peças</a>',
            '<a href="../index.html#store">Loja</a>',
            '<a href="../index.html#consultation">Contato</a>',
            '</nav>'
        ].join('');
        document.body.appendChild(menu);

        function setOpen(open) {
            menu.classList.toggle('is-open', open);
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        button.addEventListener('click', function () {
            setOpen(!menu.classList.contains('is-open'));
        });

        menu.addEventListener('click', function (event) {
            if (event.target.closest('a')) setOpen(false);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') setOpen(false);
        });
    }

    function renderPage() {
        if (!page) {
            setText('exhibitionTitle', 'Página não encontrada');
            setText('exhibitionIntro', 'Volte ao catálogo Maharaja para continuar.');
            return;
        }
        document.title = page.title + ' | Maharaja Decor';
        var meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', page.subtitle);
        setText('exhibitionCrumb', pageType === 'ambientes' ? 'Ambientes' : 'Coleções');
        setText('exhibitionCurrent', page.title);
        setText('exhibitionEyebrow', page.eyebrow);
        setText('exhibitionTitle', page.title);
        setText('exhibitionSubtitle', page.subtitle);
        setText('exhibitionIntro', page.intro);
        setText('exhibitionThesis', page.thesis);
        var hero = byId('exhibitionHeroImage');
        if (hero) {
            hero.src = asset(page.heroImage);
            hero.alt = page.alt;
        }
        renderTags('exhibitionTags', page.tags || []);
        renderSteps();
        renderProducts();
        renderRelated();
    }

    renderPage();
    updateSelectionUI();
    setupActions();
}());
