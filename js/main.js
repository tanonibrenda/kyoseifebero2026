/* =============================================================================
   KYOSEI ACCESIBILIDAD — main.js  v2.0
   Cumplimiento: WCAG 2.2 Nivel A, AA y AAA

   Criterios cubiertos:
   ─ 1.3.1  Info and Relationships (A)        — roles y estructura semántica
   ─ 1.4.3  Contrast (AA)                     — modo oscuro / preferencias de sistema
   ─ 1.4.12 Text Spacing (AA)                 — fuente, interlineado, espaciado
   ─ 1.4.13 Content on Hover or Focus (AA)    — panel cierra con Esc y clic fuera
   ─ 2.1.1  Keyboard (A)                      — todo operable sin ratón
   ─ 2.1.2  No Keyboard Trap (A)              — focus trap correcta en modales
   ─ 2.3.3  Animation from Interactions (AAA) — respeta prefers-reduced-motion
   ─ 2.4.1  Bypass Blocks (A)                 — skip link ya en HTML
   ─ 2.4.3  Focus Order (A)                   — foco gestionado al abrir/cerrar
   ─ 2.4.7  Focus Visible (AA)                — foco nunca se pierde
   ─ 2.4.8  Location (AAA)                    — aria-current gestionado
   ─ 2.4.11 Focus Appearance (AA)             — outline siempre visible
   ─ 3.3.1  Error Identification (A)          — errores en formularios
   ─ 3.3.3  Error Suggestion (AA)             — mensajes descriptivos
   ─ 4.1.2  Name, Role, Value (A)             — aria-expanded, aria-pressed
   ─ 4.1.3  Status Messages (AA)              — anuncios con aria-live
============================================================================= */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    inicializarSkipLink();
    inicializarNavegacion();
    inicializarModoOscuro();
    inicializarPanelAccesibilidad();
    inicializarAcordeon();
    marcarPaginaActual();
    anunciarCargaDePagina();
    inicializarFormularioInscripcion();
});


/* =============================================================================
   REGIÓN ARIA-LIVE — WCAG 4.1.3 Status Messages (AA)
   Nodo invisible que anuncia cambios de estado a los lectores de pantalla
   sin desplazar el foco visual.
============================================================================= */
let _liveRegion = null;

function obtenerLiveRegion() {
    if (_liveRegion) return _liveRegion;

    _liveRegion = document.createElement('div');
    _liveRegion.setAttribute('role', 'status');
    _liveRegion.setAttribute('aria-live', 'polite');
    _liveRegion.setAttribute('aria-atomic', 'true');
    _liveRegion.setAttribute('aria-relevant', 'text');

    // Visualmente oculto, accesible para lectores de pantalla
    Object.assign(_liveRegion.style, {
        position:  'absolute',
        width:     '1px',
        height:    '1px',
        padding:   '0',
        margin:    '-1px',
        overflow:  'hidden',
        clip:      'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        border:    '0',
    });

    document.body.appendChild(_liveRegion);
    return _liveRegion;
}

/**
 * Anuncia un mensaje a los lectores de pantalla de forma no intrusiva.
 * @param {string}            mensaje
 * @param {'polite'|'assertive'} urgencia
 */
function anunciar(mensaje, urgencia = 'polite') {
    const region = obtenerLiveRegion();
    region.setAttribute('aria-live', urgencia);
    // Limpiar primero para que el mismo texto vuelva a disparar el evento
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = mensaje; });
}


/* =============================================================================
   SKIP LINK — WCAG 2.4.1 Bypass Blocks (A)
   Garantiza que el enlace de salto funcione en todos los navegadores,
   incluso cuando el destino no tiene tabindex nativo.
============================================================================= */
function inicializarSkipLink() {
    const skipLink = document.querySelector('.skip-link');
    if (!skipLink) return;

    skipLink.addEventListener('click', () => {
        const destino = document.querySelector(skipLink.getAttribute('href'));
        if (!destino) return;
        if (!destino.hasAttribute('tabindex')) {
            destino.setAttribute('tabindex', '-1');
        }
        destino.focus({ preventScroll: false });
    });
}


/* =============================================================================
   UTILIDAD: TRAMPA DE FOCO — WCAG 2.1.2 No Keyboard Trap (A)
   Mantiene el foco dentro de un contenedor mientras está activo.
   Al llegar al último elemento enfocable, vuelve al primero y viceversa.
============================================================================= */
const SELECTORES_ENFOCABLES =
    'a[href]:not([disabled]), button:not([disabled]), input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), details > summary, ' +
    '[tabindex]:not([tabindex="-1"])';

function manejarTrampaDeFoco(e, contenedor) {
    if (e.key !== 'Tab') return;

    const elementos = Array.from(contenedor.querySelectorAll(SELECTORES_ENFOCABLES))
        .filter(el => !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]'));

    if (elementos.length === 0) return;

    const primero = elementos[0];
    const ultimo  = elementos[elementos.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === primero) {
            ultimo.focus();
            e.preventDefault();
        }
    } else {
        if (document.activeElement === ultimo) {
            primero.focus();
            e.preventDefault();
        }
    }
}


/* =============================================================================
   NAVEGACIÓN Y MENÚ MÓVIL
   WCAG 2.1.1 Keyboard (A)  — todo operable con teclado
   WCAG 2.1.2 No Keyboard Trap (A) — trampa de foco correcta
   WCAG 2.4.3 Focus Order (A) — foco gestionado al abrir/cerrar
   WCAG 4.1.2 Name, Role, Value (A) — aria-expanded actualizado
   WCAG 4.1.3 Status Messages (AA) — anuncio de apertura/cierre
============================================================================= */
function inicializarNavegacion() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainMenu         = document.getElementById('main-menu');

    if (!mobileMenuToggle || !mainMenu) return;

    // Crear overlay si no existe en el DOM
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.classList.add('nav-overlay');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(overlay);
    }
    overlay.addEventListener('click', () => {
        if (mainMenu.classList.contains('open')) cerrarMenu();
    });

    /**
     * Devuelve todos los elementos enfocables del menú más el propio botón toggle,
     * para que el ciclo de Tab sea completo y no quede el botón huérfano.
     */
    function obtenerElementosMenu() {
        const links = Array.from(mainMenu.querySelectorAll('.nav-link'));
        return [...links, mobileMenuToggle];
    }

    function abrirMenu() {
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
        mobileMenuToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
        mainMenu.classList.add('open');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        anunciar('Menú de navegación abierto');

        // Foco inicial en el primer enlace del menú — WCAG 2.4.3
        requestAnimationFrame(() => {
            const primerEnlace = mainMenu.querySelector('.nav-link');
            if (primerEnlace) primerEnlace.focus();
        });
    }

    function cerrarMenu() {
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileMenuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
        mainMenu.classList.remove('open');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        anunciar('Menú de navegación cerrado');
        mobileMenuToggle.focus();
    }

    mobileMenuToggle.addEventListener('click', () => {
        const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        isExpanded ? cerrarMenu() : abrirMenu();
    });

    // Control global de teclado mientras el menú está abierto
    document.addEventListener('keydown', (e) => {
        if (!mainMenu.classList.contains('open')) return;

        const elementos = obtenerElementosMenu();
        if (elementos.length === 0) return;

        const primero = elementos[0];
        const ultimo  = elementos[elementos.length - 1];

        // Esc cierra y devuelve el foco — WCAG 1.4.13 / 2.1.1
        if (e.key === 'Escape') {
            e.preventDefault();
            cerrarMenu();
            return;
        }

        // Trampa de foco con Tab / Shift+Tab — WCAG 2.1.2
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === primero) {
                    e.preventDefault();
                    ultimo.focus();
                }
            } else {
                if (document.activeElement === ultimo) {
                    e.preventDefault();
                    primero.focus();
                }
            }
            return;
        }

        // Navegación con flechas — patrón APG para menús
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const links = Array.from(mainMenu.querySelectorAll('.nav-link'));
            const idx   = links.indexOf(document.activeElement);
            if (idx !== -1) {
                e.preventDefault();
                const siguiente = e.key === 'ArrowDown'
                    ? (idx + 1) % links.length
                    : (idx - 1 + links.length) % links.length;
                links[siguiente].focus();
            }
        }
    });
}


/* =============================================================================
   MODO OSCURO
   WCAG 1.4.3 Contrast (AA)  — respeta prefers-color-scheme del sistema
   WCAG 4.1.2 Name, Role, Value (A) — aria-pressed actualizado en tiempo real
   WCAG 4.1.3 Status Messages (AA) — anuncio del cambio de tema
============================================================================= */
function inicializarModoOscuro() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (!darkModeToggle) return;

    const body          = document.body;
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark   = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark        = savedDarkMode === 'true' || (savedDarkMode === null && prefersDark);

    function actualizarBoton(esOscuro) {
        darkModeToggle.setAttribute('aria-pressed', String(esOscuro));
        darkModeToggle.textContent = esOscuro ? 'Desactivar Modo Oscuro' : 'Activar Modo Oscuro';
    }

    // Aplicar estado inicial sin anuncio (la página acaba de cargar)
    body.classList.toggle('dark-mode', isDark);
    actualizarBoton(isDark);

    darkModeToggle.addEventListener('click', () => {
        const esOscuro = body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', esOscuro);
        actualizarBoton(esOscuro);
        anunciar(esOscuro ? 'Modo oscuro activado' : 'Modo claro activado');
    });

    // Seguir cambios del sistema en tiempo real, solo si el usuario no eligió manualmente
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('darkMode') === null) {
            body.classList.toggle('dark-mode', e.matches);
            actualizarBoton(e.matches);
            anunciar(e.matches
                ? 'Modo oscuro activado automáticamente según preferencias del sistema'
                : 'Modo claro activado automáticamente según preferencias del sistema');
        }
    });
}


/* =============================================================================
   PANEL DE ACCESIBILIDAD
   WCAG 1.4.12 Text Spacing (AA)           — fuente, interlineado, espaciado
   WCAG 1.4.13 Content on Hover or Focus (AA) — cierra con Esc y clic fuera
   WCAG 2.1.2  No Keyboard Trap (A)        — focus trap mientras está abierto
   WCAG 2.3.3  Animation from Interactions (AAA) — respeta reduced-motion
   WCAG 4.1.2  Name, Role, Value (A)       — aria-pressed / aria-expanded
   WCAG 4.1.3  Status Messages (AA)        — anuncios de todos los cambios
============================================================================= */
function inicializarPanelAccesibilidad() {
    const root      = document.documentElement;
    const accToggle = document.getElementById('acc-menu-toggle');
    const accPanel  = document.getElementById('acc-panel');

    if (!accToggle || !accPanel) return;

    // ── Regla de lectura ──────────────────────────────────────────────────────
    const rulerLayer = document.createElement('div');
    rulerLayer.classList.add('reading-ruler-layer');
    rulerLayer.setAttribute('aria-hidden', 'true'); // decorativa, no se anuncia
    document.body.appendChild(rulerLayer);

    const prefiereMenosMovimiento =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Preferencias tipográficas — WCAG 1.4.12 ──────────────────────────────
    const defaults = { fs: 1, lh: 1.5, ls: 0.12, ruler: false };

    let prefs;
    try {
        prefs = JSON.parse(localStorage.getItem('kyoseiAccPrefs')) || { ...defaults };
        // Asegurar que todas las claves existen aunque el storage sea antiguo
        prefs = { ...defaults, ...prefs };
    } catch {
        prefs = { ...defaults };
    }

    /**
     * Aplica las preferencias al :root y persiste en localStorage.
     * @param {string} [msg] — Mensaje a anunciar vía aria-live
     */
    function aplicarPreferencias(msg = '') {
        root.style.setProperty('--base-font-size',      `${prefs.fs}rem`);
        root.style.setProperty('--base-line-height',    prefs.lh);
        root.style.setProperty('--base-letter-spacing', `${prefs.ls}em`);

        const btnRuler = document.getElementById('toggle-ruler');
        if (prefs.ruler) {
            rulerLayer.classList.add('active');
            if (btnRuler) {
                btnRuler.setAttribute('aria-pressed', 'true');
                btnRuler.textContent = 'Desactivar Regla de Lectura';
            }
        } else {
            rulerLayer.classList.remove('active');
            if (btnRuler) {
                btnRuler.setAttribute('aria-pressed', 'false');
                btnRuler.textContent = 'Activar Regla de Lectura';
            }
        }

        try { localStorage.setItem('kyoseiAccPrefs', JSON.stringify(prefs)); } catch { /* sin storage */ }
        if (msg) anunciar(msg);
    }

    // Aplicar al cargar la página (sin anuncio)
    aplicarPreferencias();

    // ── Abrir / cerrar panel ──────────────────────────────────────────────────
    let ultimoFoco = null; // guarda el elemento enfocado antes de abrir

    function abrirPanel() {
        ultimoFoco = document.activeElement;
        accToggle.setAttribute('aria-expanded', 'true');
        accPanel.removeAttribute('hidden');
        anunciar('Panel de accesibilidad abierto');

        // Foco en el primer control interactivo del panel — WCAG 2.4.3
        requestAnimationFrame(() => {
            const primerControl = accPanel.querySelector(SELECTORES_ENFOCABLES);
            if (primerControl) primerControl.focus();
        });
    }

    function cerrarPanel() {
        accToggle.setAttribute('aria-expanded', 'false');
        accPanel.setAttribute('hidden', '');
        anunciar('Panel de accesibilidad cerrado');

        // Devolver foco donde estaba antes de abrirlo — WCAG 2.4.3
        if (ultimoFoco && typeof ultimoFoco.focus === 'function') {
            ultimoFoco.focus();
        } else {
            accToggle.focus();
        }
        ultimoFoco = null;
    }

    accToggle.addEventListener('click', () => {
        const isExpanded = accToggle.getAttribute('aria-expanded') === 'true';
        isExpanded ? cerrarPanel() : abrirPanel();
    });

    // Teclado dentro del panel: Esc cierra, Tab cicla sin salir
    accPanel.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarPanel();
            return;
        }
        manejarTrampaDeFoco(e, accPanel);
    });

    // Cerrar al hacer clic fuera del panel y del botón — WCAG 1.4.13
    document.addEventListener('click', (e) => {
        const isExpanded = accToggle.getAttribute('aria-expanded') === 'true';
        if (isExpanded
            && !accPanel.contains(e.target)
            && !accToggle.contains(e.target)) {
            cerrarPanel();
        }
    });

    // ── Regla de lectura ──────────────────────────────────────────────────────
    const btnRuler = document.getElementById('toggle-ruler');
    if (btnRuler) {
        btnRuler.addEventListener('click', () => {
            prefs.ruler = !prefs.ruler;
            aplicarPreferencias(
                prefs.ruler ? 'Regla de lectura activada' : 'Regla de lectura desactivada'
            );
        });
    }

    function actualizarPosicionRegla(y) {
        if (prefs.ruler) root.style.setProperty('--mouse-y', `${y}px`);
    }

    // No registrar eventos de movimiento si el usuario prefiere menos movimiento
    if (!prefiereMenosMovimiento) {
        document.addEventListener('mousemove',  (e) => actualizarPosicionRegla(e.clientY));
        document.addEventListener('touchmove',  (e) => {
            if (e.touches.length > 0) actualizarPosicionRegla(e.touches[0].clientY);
        }, { passive: true });
    }

    // ── Helper: registrar botones de ajuste ───────────────────────────────────
    function onAccBtn(id, accion) {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', accion);
    }

    // ── Tamaño de fuente ──────────────────────────────────────────────────────
    const FS_MIN = 0.8, FS_MAX = 2.0, FS_PASO = 0.1;

    onAccBtn('btn-fs-decrease', () => {
        if (prefs.fs <= FS_MIN) { anunciar('Tamaño de texto mínimo alcanzado'); return; }
        prefs.fs = Math.max(FS_MIN, parseFloat((prefs.fs - FS_PASO).toFixed(2)));
        aplicarPreferencias(`Tamaño de texto reducido a ${Math.round(prefs.fs * 100)}%`);
    });
    onAccBtn('btn-fs-increase', () => {
        if (prefs.fs >= FS_MAX) { anunciar('Tamaño de texto máximo alcanzado'); return; }
        prefs.fs = Math.min(FS_MAX, parseFloat((prefs.fs + FS_PASO).toFixed(2)));
        aplicarPreferencias(`Tamaño de texto aumentado a ${Math.round(prefs.fs * 100)}%`);
    });
    onAccBtn('btn-fs-reset', () => {
        prefs.fs = defaults.fs;
        aplicarPreferencias('Tamaño de texto restablecido');
    });

    // ── Interlineado ─────────────────────────────────────────────────────────
    const LH_MIN = 1.2, LH_MAX = 2.5, LH_PASO = 0.1;

    onAccBtn('btn-lh-decrease', () => {
        if (prefs.lh <= LH_MIN) { anunciar('Interlineado mínimo alcanzado'); return; }
        prefs.lh = Math.max(LH_MIN, parseFloat((prefs.lh - LH_PASO).toFixed(2)));
        aplicarPreferencias('Interlineado reducido');
    });
    onAccBtn('btn-lh-increase', () => {
        if (prefs.lh >= LH_MAX) { anunciar('Interlineado máximo alcanzado'); return; }
        prefs.lh = Math.min(LH_MAX, parseFloat((prefs.lh + LH_PASO).toFixed(2)));
        aplicarPreferencias('Interlineado aumentado');
    });
    onAccBtn('btn-lh-reset', () => {
        prefs.lh = defaults.lh;
        aplicarPreferencias('Interlineado restablecido');
    });

    // ── Espaciado de letras ───────────────────────────────────────────────────
    const LS_MIN = 0, LS_MAX = 0.3, LS_PASO = 0.02;

    onAccBtn('btn-ls-decrease', () => {
        if (prefs.ls <= LS_MIN) { anunciar('Espaciado de letras mínimo alcanzado'); return; }
        prefs.ls = Math.max(LS_MIN, parseFloat((prefs.ls - LS_PASO).toFixed(3)));
        aplicarPreferencias('Espaciado de letras reducido');
    });
    onAccBtn('btn-ls-increase', () => {
        if (prefs.ls >= LS_MAX) { anunciar('Espaciado de letras máximo alcanzado'); return; }
        prefs.ls = Math.min(LS_MAX, parseFloat((prefs.ls + LS_PASO).toFixed(3)));
        aplicarPreferencias('Espaciado de letras aumentado');
    });
    onAccBtn('btn-ls-reset', () => {
        prefs.ls = defaults.ls;
        aplicarPreferencias('Espaciado de letras restablecido');
    });
}


/* =============================================================================
   ACORDEÓN ACCESIBLE
   WCAG 2.1.1 Keyboard (A)   — Enter/Espacio abren; Escape cierra
   WCAG 2.4.3 Focus Order (A) — el foco permanece en el botón trigger
   WCAG 4.1.2 Name, Role, Value (A) — aria-expanded actualizado
   WCAG 4.1.3 Status Messages (AA) — anuncio del estado expandido/contraído
   Referencia: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
============================================================================= */
function inicializarAcordeon() {
    const triggers = document.querySelectorAll('.accordion-trigger');
    if (triggers.length === 0) return;

    triggers.forEach((trigger) => {
        trigger.addEventListener('click', () => toggleAcordeon(trigger));

        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (trigger.getAttribute('aria-expanded') === 'true') {
                    cerrarAcordeon(trigger);
                    trigger.focus();
                }
                return;
            }
            // Flechas arriba/abajo navegan entre triggers — patrón APG
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const lista   = Array.from(triggers);
                const idx     = lista.indexOf(trigger);
                const dest    = e.key === 'ArrowDown'
                    ? lista[(idx + 1) % lista.length]
                    : lista[(idx - 1 + lista.length) % lista.length];
                dest.focus();
            }
            if (e.key === 'Home') { e.preventDefault(); triggers[0].focus(); }
            if (e.key === 'End')  { e.preventDefault(); triggers[triggers.length - 1].focus(); }
        });
    });

    function toggleAcordeon(trigger) {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        isExpanded ? cerrarAcordeon(trigger) : abrirAcordeon(trigger);
    }

    function abrirAcordeon(trigger) {
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        if (!panel) return;
        trigger.setAttribute('aria-expanded', 'true');
        panel.removeAttribute('hidden');
        const titulo = trigger.querySelector('.accordion-title-text');
        anunciar(`Sección "${titulo ? titulo.textContent.trim() : ''}" expandida`);
    }

    function cerrarAcordeon(trigger) {
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        if (!panel) return;
        trigger.setAttribute('aria-expanded', 'false');
        panel.setAttribute('hidden', '');
        const titulo = trigger.querySelector('.accordion-title-text');
        anunciar(`Sección "${titulo ? titulo.textContent.trim() : ''}" contraída`);
    }
}


/* =============================================================================
   ESTADO DE PÁGINA ACTUAL — WCAG 2.4.8 Location (AAA)
   Marca con aria-current="page" el enlace de navegación que corresponde
   a la URL activa, tolerando rutas absolutas, relativas y el caso raíz.
============================================================================= */
function marcarPaginaActual() {
    const paginaActual = window.location.pathname;
    const navLinks     = document.querySelectorAll('.nav-link');

    const normalizar = (ruta) =>
        ruta.replace(/\/$/, '').replace(/\/index\.html$/, '') || '/';

    navLinks.forEach((link) => {
        let linkPath;
        try {
            linkPath = new URL(link.getAttribute('href'), window.location.href).pathname;
        } catch {
            linkPath = link.getAttribute('href') || '';
        }

        if (normalizar(paginaActual) === normalizar(linkPath)) {
            link.classList.add('current');
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('current');
            link.removeAttribute('aria-current');
        }
    });
}


/* =============================================================================
   ANUNCIAR CARGA DE PÁGINA — WCAG 4.1.3 Status Messages (AA)
   Comunica el título de la página al lector de pantalla tras la carga,
   útil en navegaciones sin recarga completa (hash, history API).
============================================================================= */
function anunciarCargaDePagina() {
    const titulo = document.title;
    if (titulo) {
        // Pequeño delay para que el DOM y el lector estén listos
        setTimeout(() => anunciar(`Página cargada: ${titulo}`), 350);
    }
}


/* =============================================================================
   FORMULARIO DE INSCRIPCIÓN (CARRITO)
   WCAG 3.3.1 Error Identification (A) — identifica cada campo inválido
   WCAG 3.3.3 Error Suggestion (AA)    — mensaje descriptivo por campo
   WCAG 2.4.3 Focus Order (A)          — foco al primer error o al resultado
   WCAG 4.1.3 Status Messages (AA)     — anuncios de validación y envío

   Este módulo se activa sólo si existe el formulario en la página,
   por lo que es completamente inocuo en las demás páginas del sitio.
============================================================================= */
function inicializarFormularioInscripcion() {
    const form            = document.getElementById('kyosei-inscripcion-form');
    const statusContainer = document.getElementById('form-status-message');

    if (!form || !statusContainer) return;

    // ── Limpiar errores previos ───────────────────────────────────────────────
    function limpiarErrores() {
        form.querySelectorAll('.error-dinamico').forEach(el => el.remove());
        form.querySelectorAll('[aria-invalid="true"]').forEach(el => {
            el.removeAttribute('aria-invalid');
            const desc = el.getAttribute('aria-describedby') || '';
            const limpio = desc.replace(el.id + '-error', '').trim();
            if (limpio) {
                el.setAttribute('aria-describedby', limpio);
            } else {
                el.removeAttribute('aria-describedby');
            }
        });
    }

    // ── Mostrar un mensaje de estado accesible ────────────────────────────────
    /**
     * @param {'success'|'error'} tipo
     * @param {string}            texto
     */
    function mostrarEstado(tipo, texto) {
        const esExito  = tipo === 'success';
        const role     = esExito ? 'status' : 'alert';
        const bgColor  = esExito ? '#d4edda' : '#f8d7da';
        const txColor  = esExito ? '#155724' : '#721c24';

        statusContainer.innerHTML = `
            <div
                role="${role}"
                tabindex="-1"
                style="
                    background-color: ${bgColor};
                    color: ${txColor};
                    padding: 1rem 1.25rem;
                    border-radius: 4px;
                    margin-bottom: 1.5rem;
                    border: 1px solid ${esExito ? '#c3e6cb' : '#f5c6cb'};
                ">
                <p style="margin:0">${texto}</p>
            </div>`;

        // Mover el foco al mensaje para que sea leído inmediatamente — WCAG 2.4.3
        const caja = statusContainer.querySelector('[tabindex="-1"]');
        if (caja) caja.focus();
    }

    // ── Envío del formulario ──────────────────────────────────────────────────
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        limpiarErrores();

        // Validación nativa extendida con mensajes accesibles — WCAG 3.3.1 / 3.3.3
        if (!form.checkValidity()) {
            anunciar(
                'El formulario contiene errores. Revisá los campos obligatorios indicados.',
                'assertive'
            );

            let primerInvalido = null;

            Array.from(form.elements).forEach((el) => {
                if (!el.willValidate || el.validity.valid) return;

                el.setAttribute('aria-invalid', 'true');

                const idError  = `${el.id}-error`;
                const spanError = document.createElement('span');
                spanError.id        = idError;
                spanError.className = 'error-dinamico';
                spanError.setAttribute('aria-live', 'polite');
                Object.assign(spanError.style, {
                    color:      '#dc3545',
                    fontSize:   '0.875rem',
                    display:    'block',
                    marginTop:  '0.4rem',
                });
                spanError.textContent = el.validationMessage;

                if (el.type === 'radio') {
                    // Para grupos de radio: insertar una sola vez en el fieldset
                    const fieldset = el.closest('fieldset');
                    if (fieldset && !fieldset.querySelector(`#${idError}`)) {
                        fieldset.appendChild(spanError);
                    }
                } else {
                    el.parentNode.appendChild(spanError);
                    // Vincular al aria-describedby del campo — WCAG 1.3.1
                    const desc = (el.getAttribute('aria-describedby') || '').trim();
                    el.setAttribute(
                        'aria-describedby',
                        desc ? `${desc} ${idError}` : idError
                    );
                }

                if (!primerInvalido) primerInvalido = el;
            });

            // Foco en el primer campo inválido — WCAG 2.4.3
            if (primerInvalido) {
                if (primerInvalido.type === 'radio') {
                    const grupo = form.querySelectorAll(`input[name="${primerInvalido.name}"]`);
                    if (grupo.length > 0) grupo[0].focus();
                } else {
                    primerInvalido.focus();
                }
            }
            return;
        }

        // ── Envío por Fetch API ───────────────────────────────────────────────
        const submitBtn         = form.querySelector('button[type="submit"]');
        const textoOriginal     = submitBtn ? submitBtn.textContent : '';

        if (submitBtn) {
            submitBtn.textContent = 'Procesando inscripción…';
            submitBtn.disabled    = true;
        }
        anunciar('Procesando inscripción, por favor aguardá…', 'polite');

     fetch(form.action, {
            method: 'POST',
            body:   new FormData(form),
        })
        .then(async (res) => {
            if (!res.ok) throw new Error('Error de comunicación con el servidor.');
            
            // Verificamos si Make devolvió texto o JSON para evitar errores de parseo
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Error procesando los datos.');
                return data;
            } else {
                return await res.text(); // Make.com suele devolver "Accepted" en texto plano
            }
        })
        .then(() => {
            // Entramos aquí si la promesa se resolvió correctamente (ya sea JSON exitoso o Texto "Accepted")
            mostrarEstado(
                'success',
                '¡Inscripción exitosa! Tus datos fueron guardados. Te contactaremos a la brevedad para finalizar el proceso de pago.'
            );
            if (typeof anunciar === 'function') {
                anunciar('Inscripción exitosa. Tus datos han sido guardados correctamente.', 'assertive');
            }
            form.reset();
            limpiarErrores();
        })
        .catch((error) => {
            mostrarEstado(
                'error',
                `Ocurrió un error: ${error.message}. Revisá tus datos e intentá nuevamente.`
            );
            if (typeof anunciar === 'function') {
                anunciar('Error al procesar la inscripción. ' + error.message, 'assertive');
            }
        })
        .finally(() => {
            if (submitBtn) {
                submitBtn.textContent = textoOriginal;
                submitBtn.disabled    = false;
            }
        });
    })}