(function () {
    'use strict';

    // Hero "Álbum 3D": one rotating sculpture that switches through all the
    // pieces, each floating over its matching editorial scene. Lazy-loaded past
    // first paint; the poster image shows until the first model is ready.

    var stage = document.querySelector('.md-hero-stage');
    var switcher = document.querySelector('.md-hero-switcher');
    if (!stage || !switcher) return;

    var sceneLayers = Array.prototype.slice.call(document.querySelectorAll('.md-hero-scene-layer'));
    var titleEl = document.getElementById('mdHeroPieceTitle');
    var ambienteEl = document.getElementById('mdHeroPieceAmbiente');

    var LIB = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var PIECES = [
        { title: 'Ganesha de resina', ambiente: 'Sala', model: 'assets/models/ganesha-de-resina.glb', thumb: 'assets/img/maharaja/products/ganesha-resina.jpg', scene: 'assets/img/maharaja/editorial/living-ganesha.jpg' },
        { title: 'Fonte de Lakshmi', ambiente: 'Jardim', model: 'assets/models/fonte-de-lakshmi.glb', thumb: 'assets/img/maharaja/products/fonte-lakshmi.jpg', scene: 'assets/img/maharaja/editorial/garden-lakshmi.jpg' },
        { title: 'Buda de Bali', ambiente: 'Piscina', model: 'assets/models/buda-de-bali.glb', thumb: 'assets/img/maharaja/products/buda-bali.jpg', scene: 'assets/img/maharaja/editorial/pool-buda.jpg' },
        { title: 'Elefantes de madeira', ambiente: 'Entrada', model: 'assets/models/elefantes-de-madeira.glb', thumb: 'assets/img/maharaja/products/elefantes-madeira.jpg', scene: 'assets/img/maharaja/editorial/entrance-elephants.jpg' },
        { title: 'Banco pintado à mão', ambiente: 'Madeira', model: 'assets/models/banco-pintado-a-mao.glb', thumb: 'assets/img/maharaja/products/banco-madeira.jpg', scene: null },
        { title: 'Padmini Incenso Dhoop', ambiente: 'Aromas', model: 'assets/models/padmini-incenso-dhoop.glb', thumb: 'assets/img/maharaja/products/incenso-padmini-dhoop.jpg', scene: null },
        { title: 'Luminária turca', ambiente: 'Luz', model: 'assets/models/luminaria-turca.glb', thumb: 'assets/img/maharaja/products/luminaria-turca.jpg', scene: null },
        { title: 'Peças decorativas', ambiente: 'Casa', model: 'assets/models/pecas-decorativas.glb', thumb: 'assets/img/maharaja/products/hero-altar.jpg', scene: null }
    ];

    var DARKEN = 'linear-gradient(96deg, rgba(2,31,13,0.93) 0%, rgba(4,35,15,0.82) 46%, rgba(6,47,20,0.55) 100%)';

    var mv = null;
    var current = -1;
    var activeLayer = 0;
    var thumbs = [];
    var autoTimer = null, resumeTimer = null;
    var autoPaused = false;   // pauses the auto-advance cycle
    var dragging = false;     // pauses the spin while the visitor rotates
    var onScreen = true;
    var spinTheta = 15, spinLast = null, spinRaf = null;

    function setScene(url) {
        if (sceneLayers.length < 2) return;
        var next = sceneLayers[1 - activeLayer];
        if (url) {
            next.style.backgroundImage = DARKEN + ', url("' + url + '")';
            next.style.opacity = '1';
        } else {
            next.style.opacity = '0';
        }
        sceneLayers[activeLayer].style.opacity = '0';
        activeLayer = 1 - activeLayer;
    }

    function select(i) {
        if (i === current) return;
        current = i;
        var p = PIECES[i];
        if (mv) {
            mv.setAttribute('src', p.model);
            mv.setAttribute('alt', 'Escultura ' + p.title + ' em 3D');
        }
        setScene(p.scene);
        if (titleEl) titleEl.textContent = p.title;
        if (ambienteEl) ambienteEl.textContent = p.ambiente;
        thumbs.forEach(function (t, ti) {
            var on = ti === i;
            t.classList.toggle('is-active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
    }

    function buildThumbs() {
        PIECES.forEach(function (p, i) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'md-hero-thumb';
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-label', p.title);
            b.innerHTML = '<img src="' + p.thumb + '" alt="" loading="lazy" decoding="async">';
            b.addEventListener('click', function () { pauseAuto(); select(i); });
            switcher.appendChild(b);
            thumbs.push(b);
        });
    }

    function startAuto() {
        if (reduce || autoTimer || autoPaused || !onScreen) return;
        autoTimer = window.setInterval(function () {
            if (!autoPaused) select((current + 1) % PIECES.length);
        }, 6000);
    }
    function stopAuto() { if (autoTimer) { window.clearInterval(autoTimer); autoTimer = null; } }
    function pauseAuto() {
        autoPaused = true;
        stopAuto();
        window.clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(function () { autoPaused = false; startAuto(); }, 9000);
    }

    function loadLib() {
        return new Promise(function (resolve, reject) {
            if (window.customElements && customElements.get('model-viewer')) { resolve(); return; }
            var s = document.createElement('script');
            s.type = 'module';
            s.src = LIB;
            s.onload = function () { customElements.whenDefined('model-viewer').then(resolve, resolve); };
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    function sizeToStage() {
        var w = stage.clientWidth, h = stage.clientHeight;
        if (mv && w && h) { mv.style.width = w + 'px'; mv.style.height = h + 'px'; }
    }

    // model-viewer's built-in auto-rotate stalls in this layout; drive the spin
    // ourselves (explicit camera changes always force a render).
    function spin(ts) {
        if (!onScreen || dragging) { spinRaf = null; return; }
        if (spinLast === null) spinLast = ts;
        spinTheta = (spinTheta + (ts - spinLast) / 1000 * 14) % 360;
        spinLast = ts;
        if (mv) mv.cameraOrbit = spinTheta + 'deg 80deg auto';
        spinRaf = requestAnimationFrame(spin);
    }
    function startSpin() { if (!reduce && spinRaf === null && onScreen && !dragging) { spinLast = null; spinRaf = requestAnimationFrame(spin); } }
    function stopSpin() { if (spinRaf !== null) { cancelAnimationFrame(spinRaf); spinRaf = null; } }

    function init() {
        buildThumbs();
        loadLib().then(function () {
            mv = document.createElement('model-viewer');
            mv.className = 'md-hero-model';
            mv.setAttribute('loading', 'eager');
            mv.setAttribute('reveal', 'auto');
            mv.setAttribute('camera-controls', '');
            mv.setAttribute('disable-zoom', '');
            mv.setAttribute('touch-action', 'pan-y');
            mv.setAttribute('interaction-prompt', 'none');
            mv.setAttribute('shadow-intensity', '0');
            mv.setAttribute('exposure', '1.05');
            mv.setAttribute('ar', '');
            mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
            mv.addEventListener('load', function () { stage.classList.add('is-loaded'); });
            stage.appendChild(mv);

            sizeToStage();
            if (window.ResizeObserver) { new ResizeObserver(sizeToStage).observe(stage); }
            else { window.addEventListener('resize', sizeToStage); }

            mv.addEventListener('pointerdown', function () { dragging = true; pauseAuto(); stopSpin(); });
            window.addEventListener('pointerup', function () { if (dragging) { dragging = false; startSpin(); } });

            if (window.IntersectionObserver) {
                new IntersectionObserver(function (entries) {
                    onScreen = entries[0].isIntersecting;
                    if (onScreen) { startSpin(); startAuto(); } else { stopSpin(); stopAuto(); }
                }, { threshold: 0.05 }).observe(stage);
            }

            select(0);
            startSpin();
            startAuto();
        }).catch(function () { /* keep the poster */ });
    }

    if ('requestIdleCallback' in window) {
        requestIdleCallback(init, { timeout: 2600 });
    } else {
        window.addEventListener('load', function () { setTimeout(init, 300); });
    }
}());
