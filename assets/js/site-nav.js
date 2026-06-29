(function () {
    'use strict';

    var body = document.body;
    var assetBase = body.getAttribute('data-asset-base') || '';
    var isNestedPage = assetBase === '../' || /\/(produto|ambientes|colecoes)\//.test(window.location.pathname);
    var base = isNestedPage ? '../' : '';
    var pageType = body.getAttribute('data-page-type') || '';
    var isProductPage = body.classList.contains('md-product-detail-page') || !!body.getAttribute('data-product-slug');

    var ambientes = [
        { label: 'Sala', href: 'ambientes/sala.html', icon: 'fa-couch', text: 'Ganesha, madeira, aroma e presença para o convívio.' },
        { label: 'Jardim', href: 'ambientes/jardim.html', icon: 'fa-seedling', text: 'Fontes, Lakshmi, folhagem e pausas ao ar livre.' },
        { label: 'Piscina', href: 'ambientes/piscina.html', icon: 'fa-water', text: 'Buda, pedra, silêncio e composição externa.' },
        { label: 'Entrada', href: 'ambientes/entrada.html', icon: 'fa-door-open', text: 'Peças que recebem, protegem e anunciam a casa.' },
        { label: 'Altar', href: 'ambientes/altar.html', icon: 'fa-place-of-worship', text: 'Símbolos, incensos e intenção para rituais do dia.' }
    ];

    var colecoes = [
        { label: 'Estátuas', href: 'colecoes/estatuas.html', icon: 'fa-monument', text: 'Ganesha, Buda e presenças protagonistas.' },
        { label: 'Sagrado', href: 'colecoes/sagrado.html', icon: 'fa-om', text: 'Peças devocionais, proteção e significado.' },
        { label: 'Fontes', href: 'colecoes/fontes.html', icon: 'fa-water', text: 'Água, jardim, varanda e pausa sensorial.' },
        { label: 'Artesanato', href: 'colecoes/artesanato.html', icon: 'fa-palette', text: 'Madeira pintada à mão, elefantes e cor.' },
        { label: 'Aromas', href: 'colecoes/aromas.html', icon: 'fa-spa', text: 'Incensos, presentes e atmosfera ritual.' },
        { label: 'Decoração', href: 'colecoes/decoracao.html', icon: 'fa-house-user', text: 'Objetos para sala, entrada e casa brasileira.' }
    ];

    function pageUrl(path) {
        return base + path;
    }

    function homeHash(hash) {
        return isNestedPage ? base + 'index.html' + hash : hash;
    }

    function icon(name) {
        var brands = { 'fa-whatsapp': true, 'fa-instagram': true };
        return '<i class="' + (brands[name] ? 'fab' : 'fas') + ' ' + name + '" aria-hidden="true"></i>';
    }

    function currentSection() {
        if (pageType === 'ambientes') return 'ambientes';
        if (pageType === 'colecoes') {
            return /\/colecoes\/estatuas\.html$/.test(window.location.pathname) ? 'estatuas' : 'colecoes';
        }
        if (isProductPage) return 'pecas';
        if (window.location.hash === '#collection' || window.location.hash === '#shop') return 'pecas';
        if (window.location.hash === '#store') return 'loja';
        if (window.location.hash === '#consultation') return 'contato';
        if (window.location.hash === '#album' || window.location.hash === '#inspiration') return 'ambientes';
        return 'inicio';
    }

    function linkItem(item) {
        return [
            '<a class="md-mega-card" href="' + pageUrl(item.href) + '">',
            '<span>' + icon(item.icon) + '</span>',
            '<strong>' + item.label + '</strong>',
            '<small>' + item.text + '</small>',
            '</a>'
        ].join('');
    }

    function megaMenu(section, label, intro, cta, ctaHref, items) {
        return [
            '<div class="md-nav-cluster" data-nav-section="' + section + '">',
            '<button class="md-nav-link md-nav-trigger" type="button" aria-expanded="false">',
            label,
            '<i class="fas fa-chevron-down" aria-hidden="true"></i>',
            '</button>',
            '<div class="md-mega">',
            '<div class="md-mega-intro">',
            '<span>' + intro.eyebrow + '</span>',
            '<strong>' + intro.title + '</strong>',
            '<p>' + intro.text + '</p>',
            '<a href="' + ctaHref + '">' + cta + '<i class="fas fa-arrow-right" aria-hidden="true"></i></a>',
            '</div>',
            '<div class="md-mega-grid">',
            items.map(linkItem).join(''),
            '</div>',
            '</div>',
            '</div>'
        ].join('');
    }

    function renderDesktopNav() {
        return [
            '<nav class="md-site-nav" aria-label="Menu principal">',
            '<a class="md-nav-link" data-nav-section="inicio" href="' + homeHash('#home') + '">Início</a>',
            megaMenu(
                'ambientes',
                'Ambientes',
                {
                    eyebrow: 'Álbum de design',
                    title: 'Percursos para casa, jardim e altar.',
                    text: 'Cada ambiente orienta onde a peça vive melhor: sala, entrada, piscina, varanda ou canto de meditação.'
                },
                'Ver ambientes',
                homeHash('#album'),
                ambientes
            ),
            '<a class="md-nav-link md-nav-featured" data-nav-section="estatuas" href="' + pageUrl('colecoes/estatuas.html') + '">' + icon('fa-monument') + 'Estátuas</a>',
            megaMenu(
                'colecoes',
                'Coleções',
                {
                    eyebrow: 'Curadoria real',
                    title: 'Estátuas, fontes, madeira, aromas e decoração.',
                    text: 'Um mapa de compra por intenção: presença, proteção, água, cor, presente e ritual.'
                },
                'Explorar coleções',
                pageUrl('colecoes/sagrado.html'),
                colecoes
            ),
            '<a class="md-nav-link" data-nav-section="pecas" href="' + homeHash('#collection') + '">Peças</a>',
            '<a class="md-nav-link" data-nav-section="loja" href="' + homeHash('#store') + '">Loja</a>',
            '<a class="md-nav-link" data-nav-section="contato" href="' + homeHash('#consultation') + '">Contato</a>',
            '</nav>'
        ].join('');
    }

    function drawerGroup(title, items) {
        return [
            '<section class="md-drawer-group">',
            '<h3>' + title + '</h3>',
            items.map(function (item) {
                return '<a href="' + pageUrl(item.href) + '">' + icon(item.icon) + '<span><strong>' + item.label + '</strong><small>' + item.text + '</small></span></a>';
            }).join(''),
            '</section>'
        ].join('');
    }

    function renderDrawer() {
        return [
            '<div class="md-nav-drawer" id="mdNavDrawer" hidden>',
            '<div class="md-nav-backdrop" data-nav-close></div>',
            '<aside class="md-nav-panel" role="dialog" aria-modal="true" aria-label="Menu Maharaja">',
            '<div class="md-nav-panel-head">',
            '<div><span>Maharaja Decor</span><strong>Decoração, presentes, artesanato e moda</strong></div>',
            '<button class="icon-btn md-nav-close" type="button" data-nav-close aria-label="Fechar menu">' + icon('fa-times') + '</button>',
            '</div>',
            '<nav class="md-drawer-main" aria-label="Navegação mobile">',
            '<a class="md-drawer-hero-link" href="' + pageUrl('colecoes/estatuas.html') + '">' + icon('fa-monument') + '<span><strong>Estátuas em destaque</strong><small>Ganesha, Buda, Lakshmi e peças protagonistas.</small></span></a>',
            '<div class="md-drawer-quick">',
            '<a href="' + homeHash('#home') + '">Início</a>',
            '<a href="' + homeHash('#collection') + '">Peças</a>',
            '<a href="' + homeHash('#store') + '">Loja</a>',
            '<a href="' + homeHash('#consultation') + '">Contato</a>',
            '</div>',
            drawerGroup('Ambientes', ambientes),
            drawerGroup('Coleções', colecoes),
            '<section class="md-drawer-group md-drawer-service">',
            '<h3>Atendimento</h3>',
            '<a href="https://wa.me/5561991334423" target="_blank" rel="noopener">' + icon('fa-whatsapp') + '<span><strong>Consultar no WhatsApp</strong><small>Disponibilidade, valores, tamanhos e envio.</small></span></a>',
            '<a href="https://www.instagram.com/maharaja_decor/" target="_blank" rel="noopener">' + icon('fa-instagram') + '<span><strong>Instagram</strong><small>Conteúdo real da loja e novidades.</small></span></a>',
            '</section>',
            '</nav>',
            '</aside>',
            '</div>'
        ].join('');
    }

    function setActiveState(header) {
        var section = currentSection();
        header.querySelectorAll('[data-nav-section]').forEach(function (item) {
            var itemSection = item.getAttribute('data-nav-section');
            var isActive = itemSection === section;
            item.classList.toggle('active', isActive);
        });
    }

    function closeMegaMenus(header, except) {
        header.querySelectorAll('.md-nav-cluster').forEach(function (cluster) {
            if (cluster === except) return;
            cluster.classList.remove('is-open');
            var trigger = cluster.querySelector('.md-nav-trigger');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
    }

    function setupMegaMenus(header) {
        header.querySelectorAll('.md-nav-trigger').forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                var cluster = trigger.closest('.md-nav-cluster');
                var isOpen = cluster.classList.contains('is-open');
                closeMegaMenus(header, cluster);
                cluster.classList.toggle('is-open', !isOpen);
                trigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
            });
        });

        document.addEventListener('click', function (event) {
            if (!event.target.closest('.md-site-nav')) closeMegaMenus(header);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeMegaMenus(header);
        });
    }

    function setupDrawer(header) {
        var toggle = header.querySelector('.md-nav-drawer-toggle');
        var drawer = document.getElementById('mdNavDrawer');
        if (!toggle || !drawer) return;

        var closeTargets = drawer.querySelectorAll('[data-nav-close]');
        var focusTarget = drawer.querySelector('.md-nav-close');
        var lastFocus;
        var closeTimer;

        function setOpen(open) {
            window.clearTimeout(closeTimer);
            if (open) {
                lastFocus = document.activeElement;
                drawer.hidden = false;
                window.requestAnimationFrame(function () {
                    drawer.classList.add('is-open');
                    body.classList.add('md-nav-open');
                    toggle.setAttribute('aria-expanded', 'true');
                    if (focusTarget) focusTarget.focus();
                });
                return;
            }

            drawer.classList.remove('is-open');
            body.classList.remove('md-nav-open');
            toggle.setAttribute('aria-expanded', 'false');
            closeTimer = window.setTimeout(function () {
                drawer.hidden = true;
                if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
            }, 220);
        }

        toggle.addEventListener('click', function () {
            setOpen(!drawer.classList.contains('is-open'));
        });

        closeTargets.forEach(function (item) {
            item.addEventListener('click', function () { setOpen(false); });
        });

        drawer.addEventListener('click', function (event) {
            if (event.target.closest('a')) setOpen(false);
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false);
        });
    }

    function setupNav() {
        var header = document.querySelector('.navbar .container.header');
        if (!header) return;

        var brand = header.querySelector('.md-brand');
        if (brand) brand.setAttribute('href', homeHash('#home'));

        header.querySelectorAll('.navbar-nav.items, .navbar-nav.toggle, .md-site-nav, .md-nav-drawer-toggle, .md-exhibition-menu-button').forEach(function (item) {
            item.remove();
        });

        document.querySelectorAll('.md-exhibition-menu').forEach(function (item) {
            item.remove();
        });

        var spacer = header.querySelector('.ml-auto');
        var action = header.querySelector('.navbar-nav.action');
        var nav = document.createElement('div');
        nav.innerHTML = renderDesktopNav();
        var desktopNav = nav.firstElementChild;

        if (action) {
            header.insertBefore(desktopNav, action);
        } else if (spacer && spacer.nextSibling) {
            header.insertBefore(desktopNav, spacer.nextSibling);
        } else {
            header.appendChild(desktopNav);
        }

        var button = document.createElement('button');
        button.className = 'icon-btn md-nav-drawer-toggle';
        button.type = 'button';
        button.setAttribute('aria-label', 'Abrir menu');
        button.setAttribute('aria-controls', 'mdNavDrawer');
        button.setAttribute('aria-expanded', 'false');
        button.innerHTML = icon('fa-bars');
        header.appendChild(button);

        var oldDrawer = document.getElementById('mdNavDrawer');
        if (oldDrawer) oldDrawer.remove();
        document.body.insertAdjacentHTML('beforeend', renderDrawer());

        setActiveState(header);
        setupMegaMenus(header);
        setupDrawer(header);
        window.addEventListener('hashchange', function () { setActiveState(header); });
    }

    if (document.querySelector('.navbar .container.header')) {
        setupNav();
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupNav);
    } else {
        setupNav();
    }
}());
