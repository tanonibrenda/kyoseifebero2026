document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicializar TODA la lógica directamente, el DOM ya contiene el header.
    inicializarNavegacion();
    inicializarModoOscuro();
    inicializarPanelAccesibilidad();
    marcarPaginaActual();
});

/* --- UTILIDAD: TRAMPA DE FOCO (FOCUS TRAP) --- */
// Evita que el usuario de teclado navegue por detrás de un menú modal abierto (WCAG 2.4.3)
function manejarTrampaDeFoco(e, contenedor) {
    const elementosEnfocables = contenedor.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (elementosEnfocables.length === 0) return;

    const primerElemento = elementosEnfocables[0];
    const ultimoElemento = elementosEnfocables[elementosEnfocables.length - 1];

    if (e.key === 'Tab') {
        if (e.shiftKey) { // Navegación hacia atrás (Shift + Tab)
            if (document.activeElement === primerElemento) {
                ultimoElemento.focus();
                e.preventDefault();
            }
        } else { // Navegación hacia adelante (Tab)
            if (document.activeElement === ultimoElemento) {
                primerElemento.focus();
                e.preventDefault();
            }
        }
    }
}

/* --- NAVEGACIÓN Y MENÚ MÓVIL --- */
function inicializarNavegacion() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainMenu = document.getElementById('main-menu');
    
    // Crear el overlay si no existe
    if (!document.querySelector('.nav-overlay')) {
        const overlay = document.createElement('div');
        overlay.classList.add('nav-overlay');
        document.body.appendChild(overlay);
        
        // Cerrar menú al hacer clic fuera
        overlay.addEventListener('click', () => {
            if (mainMenu.classList.contains('open')) toggleMenu();
        });
    }

    function toggleMenu() {
        const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        const overlay = document.querySelector('.nav-overlay');
        
        mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        mainMenu.classList.toggle('open');
        overlay.classList.toggle('open');
        
        if (!isExpanded) {
            // Menú abierto: Evitar scroll de fondo y enviar foco al primer enlace
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                const primerEnlace = mainMenu.querySelector('.nav-link');
                if (primerEnlace) primerEnlace.focus();
            }, 50);
        } else {
            // Menú cerrado: Restaurar scroll y devolver foco al botón hamburguesa
            document.body.style.overflow = '';
            mobileMenuToggle.focus();
        }
    }

    mobileMenuToggle.addEventListener('click', toggleMenu);

    // Controles de teclado para el menú móvil
    mainMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleMenu();
        } else {
            manejarTrampaDeFoco(e, mainMenu);
        }
    });
}

/* --- MODO OSCURO --- */
function inicializarModoOscuro() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const isDarkMode = savedDarkMode === 'true' || (savedDarkMode === null && prefersDarkMode);
    
    if (isDarkMode) {
        body.classList.add('dark-mode');
        darkModeToggle.setAttribute('aria-pressed', 'true');
        darkModeToggle.setAttribute('aria-label', 'Desactivar modo oscuro');
    }

    darkModeToggle.addEventListener('click', () => {
        const isCurrentlyDark = body.classList.contains('dark-mode');
        body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', !isCurrentlyDark);
        
        darkModeToggle.setAttribute('aria-pressed', !isCurrentlyDark);
        darkModeToggle.setAttribute('aria-label', !isCurrentlyDark ? 'Desactivar modo oscuro' : 'Activar modo oscuro');
    });
}

/* --- PANEL DE ACCESIBILIDAD --- */
function inicializarPanelAccesibilidad() {
    const root = document.documentElement;
    const accToggle = document.getElementById('acc-menu-toggle');
    const accPanel = document.getElementById('acc-panel');
    
    // Crear la capa visual para la regla de lectura
    const rulerLayer = document.createElement('div');
    rulerLayer.classList.add('reading-ruler-layer');
    rulerLayer.setAttribute('aria-hidden', 'true'); // Ignorado por lectores de pantalla
    document.body.appendChild(rulerLayer);

    // Valores por defecto basados en WCAG
    const defaults = { fs: 1, lh: 1.5, ls: 0.12, ruler: false };
    let prefs = JSON.parse(localStorage.getItem('kyoseiAccPrefs')) || { ...defaults };

    function aplicarPreferencias() {
        root.style.setProperty('--base-font-size', `${prefs.fs}rem`);
        root.style.setProperty('--base-line-height', prefs.lh);
        root.style.setProperty('--base-letter-spacing', `${prefs.ls}em`);
        
        const btnRuler = document.getElementById('toggle-ruler');
        if (prefs.ruler) {
            rulerLayer.classList.add('active');
            if(btnRuler) {
                btnRuler.setAttribute('aria-pressed', 'true');
                btnRuler.textContent = "Desactivar Regla de Lectura";
            }
        } else {
            rulerLayer.classList.remove('active');
            if(btnRuler) {
                btnRuler.setAttribute('aria-pressed', 'false');
                btnRuler.textContent = "Activar Regla de Lectura";
            }
        }
        localStorage.setItem('kyoseiAccPrefs', JSON.stringify(prefs));
    }

    aplicarPreferencias();

    // Lógica para abrir/cerrar el panel
    function toggleAccPanel() {
        const isExpanded = accToggle.getAttribute('aria-expanded') === 'true';
        accToggle.setAttribute('aria-expanded', !isExpanded);
        
        if (isExpanded) {
            accPanel.setAttribute('hidden', '');
            accToggle.focus(); // Devolver el foco al botón al cerrar
        } else {
            accPanel.removeAttribute('hidden');
            // Enviar el foco al primer control del panel al abrir
            setTimeout(() => {
                const primerBoton = document.getElementById('btn-fs-decrease');
                if (primerBoton) primerBoton.focus();
            }, 50);
        }
    }

    accToggle.addEventListener('click', toggleAccPanel);

    // Controles de teclado dentro del panel de accesibilidad
    accPanel.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleAccPanel();
        } else {
            manejarTrampaDeFoco(e, accPanel);
        }
    });

    // Cierra el panel si se hace clic fuera de él
    document.addEventListener('click', (e) => {
        const isExpanded = accToggle.getAttribute('aria-expanded') === 'true';
        if (isExpanded && !accPanel.contains(e.target) && !accToggle.contains(e.target)) {
            toggleAccPanel();
        }
    });

    // Regla de lectura
    const btnToggleRuler = document.getElementById('toggle-ruler');
    if(btnToggleRuler) {
        btnToggleRuler.addEventListener('click', () => {
            prefs.ruler = !prefs.ruler;
            aplicarPreferencias();
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (prefs.ruler) {
            root.style.setProperty('--mouse-y', `${e.clientY}px`);
        }
    });

    // Eventos para los botones de accesibilidad
    const addAccEvent = (id, action) => {
        const btn = document.getElementById(id);
        if(btn) btn.addEventListener('click', action);
    };

    // Tamaño de Fuente
    addAccEvent('btn-fs-decrease', () => { prefs.fs = Math.max(0.8, prefs.fs - 0.1); aplicarPreferencias(); });
    addAccEvent('btn-fs-increase', () => { prefs.fs = Math.min(2.0, prefs.fs + 0.1); aplicarPreferencias(); });
    addAccEvent('btn-fs-reset', () => { prefs.fs = defaults.fs; aplicarPreferencias(); });

    // Interlineado
    addAccEvent('btn-lh-decrease', () => { prefs.lh = Math.max(1.2, prefs.lh - 0.1); aplicarPreferencias(); });
    addAccEvent('btn-lh-increase', () => { prefs.lh = Math.min(2.5, prefs.lh + 0.1); aplicarPreferencias(); });
    addAccEvent('btn-lh-reset', () => { prefs.lh = defaults.lh; aplicarPreferencias(); });

    // Espaciado de Letras
    addAccEvent('btn-ls-decrease', () => { prefs.ls = Math.max(0, prefs.ls - 0.02); aplicarPreferencias(); });
    addAccEvent('btn-ls-increase', () => { prefs.ls = Math.min(0.3, prefs.ls + 0.02); aplicarPreferencias(); });
    addAccEvent('btn-ls-reset', () => { prefs.ls = defaults.ls; aplicarPreferencias(); });
}

/* --- ESTADO DE PÁGINA ACTUAL (ARIA) --- */
function marcarPaginaActual() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('current');
            link.setAttribute('aria-current', 'page'); // WCAG: Identifica semánticamente la página actual
        } else {
            link.classList.remove('current');
            link.removeAttribute('aria-current');
        }
    });
}