(function () {
    'use strict';

    // Hero: live 3D sculpture (Ganesha). Loaded LAZILY, after first paint, so it
    // never blocks the homepage LCP — the poster image shows instantly and the
    // rotating model fades in once ready. Fails open: if anything errors, the
    // poster stays.

    var frame = document.querySelector('.md-hero-stage');
    if (!frame) return;

    var MODEL = 'assets/models/ganesha-de-resina.glb';
    var LIB = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

    function init() {
        if (!window.fetch) return; // very old browser → keep the poster
        loadLib().then(function () {
            var mv = document.createElement('model-viewer');
            mv.className = 'md-hero-model';
            mv.setAttribute('loading', 'eager');
            mv.setAttribute('reveal', 'auto');
            mv.setAttribute('src', MODEL);
            mv.setAttribute('alt', 'Escultura de Ganesha da Maharaja Decor em 3D');
            mv.setAttribute('camera-controls', '');
            mv.setAttribute('disable-zoom', '');           // don't hijack page scroll
            mv.setAttribute('touch-action', 'pan-y');
            mv.setAttribute('interaction-prompt', 'none'); // we show our own hint
            mv.setAttribute('shadow-intensity', '1');
            mv.setAttribute('exposure', '1.05');
            mv.setAttribute('ar', '');
            mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
            mv.addEventListener('load', function () { frame.classList.add('is-loaded'); });
            frame.appendChild(mv);

            // model-viewer keeps its canvas hidden if sized with a percentage
            // width in this layout — give it an explicit pixel size, kept in
            // sync with the stage.
            function sizeToStage() {
                var w = frame.clientWidth, h = frame.clientHeight;
                if (w && h) { mv.style.width = w + 'px'; mv.style.height = h + 'px'; }
            }
            sizeToStage();
            if (window.ResizeObserver) {
                new ResizeObserver(sizeToStage).observe(frame);
            } else {
                window.addEventListener('resize', sizeToStage);
            }

            // Drive the slow auto-spin ourselves — model-viewer's built-in
            // auto-rotate stalls in this layout, but explicitly setting
            // camera-orbit always forces a render. Pause while dragging and
            // when the hero is scrolled out of view.
            if (!reduce) {
                var theta = 15, last = null, rafId = null, interacting = false, onScreen = true, resumeTimer = null;
                function spin(ts) {
                    if (!onScreen || interacting) { rafId = null; return; }
                    if (last === null) last = ts;
                    theta = (theta + (ts - last) / 1000 * 14) % 360;
                    last = ts;
                    mv.cameraOrbit = theta + 'deg 80deg auto';
                    rafId = requestAnimationFrame(spin);
                }
                function start() { if (rafId === null && onScreen && !interacting) { last = null; rafId = requestAnimationFrame(spin); } }
                function stop() { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } }
                mv.addEventListener('load', start);
                mv.addEventListener('pointerdown', function () { interacting = true; stop(); window.clearTimeout(resumeTimer); });
                window.addEventListener('pointerup', function () {
                    if (!interacting) return;
                    resumeTimer = window.setTimeout(function () {
                        interacting = false;
                        try { theta = (mv.getCameraOrbit().theta * 180 / Math.PI) % 360; } catch (e) {}
                        start();
                    }, 1800);
                });
                if (window.IntersectionObserver) {
                    new IntersectionObserver(function (entries) {
                        onScreen = entries[0].isIntersecting;
                        if (onScreen) start(); else stop();
                    }, { threshold: 0.05 }).observe(frame);
                }
            }
        }).catch(function () { /* keep poster */ });
    }

    // Defer until the browser is idle (or window load) to protect first paint.
    if ('requestIdleCallback' in window) {
        requestIdleCallback(init, { timeout: 2600 });
    } else {
        window.addEventListener('load', function () { setTimeout(init, 300); });
    }
}());
