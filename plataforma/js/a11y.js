/**
 * JOPÓI | Núcleo de Accesibilidad
 * -------------------------------
 * - Barra de herramientas de accesibilidad presente en TODAS las páginas
 *   (tamaño de letra, espaciado, tema claro u oscuro, leer página en voz).
 * - Perfiles sensoriales: la persona elige su perfil una sola vez y toda
 *   la plataforma se adapta (ceguera, baja visión, neurodivergencia).
 * - Preferencias persistentes (localStorage) aplicadas antes del primer
 *   pintado para evitar destellos.
 * - Registro del service worker (funcionamiento sin conexión).
 */
(function () {
  'use strict';

  var PREFS_CLAVE = 'jopoi_preferencias';

  var porDefecto = {
    escala: 1,            // multiplicador del tamaño de letra (1 = 20 píxeles)
    espaciado: false,     // espaciado amplio entre letras y líneas
    tema: 'claro',        // 'claro' (fondo blanco) u 'oscuro' (fondo verde muy oscuro)
    perfil: '',           // '', 'ceguera', 'bajavision', 'neurodivergente'
    lecturaFacilAuto: false // abrir documentos directamente en modo simplificado
  };

  function leerPrefs() {
    try {
      return Object.assign({}, porDefecto, JSON.parse(localStorage.getItem(PREFS_CLAVE) || '{}'));
    } catch (e) { return Object.assign({}, porDefecto); }
  }

  function guardarPrefs(prefs) {
    localStorage.setItem(PREFS_CLAVE, JSON.stringify(prefs));
  }

  function aplicarPrefs(prefs) {
    var html = document.documentElement;
    html.style.setProperty('--escala-texto', prefs.escala);
    html.setAttribute('data-tema', prefs.tema);
    html.setAttribute('data-espaciado', prefs.espaciado ? 'amplio' : 'normal');
    html.setAttribute('data-perfil', prefs.perfil || 'ninguno');
  }

  var prefs = leerPrefs();
  aplicarPrefs(prefs);

  function cambiar(cambios) {
    prefs = Object.assign(leerPrefs(), cambios);
    guardarPrefs(prefs);
    aplicarPrefs(prefs);
    document.dispatchEvent(new CustomEvent('jopoi:preferencias', { detail: prefs }));
  }

  /** Aplica un perfil sensorial completo con un solo gesto. */
  function aplicarPerfil(nombre) {
    if (nombre === 'ceguera') {
      cambiar({ perfil: 'ceguera' });
    } else if (nombre === 'bajavision') {
      cambiar({ perfil: 'bajavision', escala: 1.4, espaciado: true, tema: 'oscuro' });
    } else if (nombre === 'neurodivergente') {
      cambiar({ perfil: 'neurodivergente', espaciado: true, lecturaFacilAuto: true });
    } else {
      cambiar(Object.assign({}, porDefecto, { perfil: '' }));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Barra de accesibilidad (se inyecta en el hueco #barra-accesibilidad) */
  /* ------------------------------------------------------------------ */
  function construirBarra() {
    var hueco = document.getElementById('barra-accesibilidad');
    if (!hueco) return;
    hueco.innerHTML =
      '<div class="barra-a11y" role="group" aria-label="Herramientas de accesibilidad">' +
      '<button type="button" id="a11y-menos" aria-label="Reducir el tamaño de la letra">A menos</button>' +
      '<button type="button" id="a11y-mas" aria-label="Aumentar el tamaño de la letra">A más</button>' +
      '<button type="button" id="a11y-espaciado" aria-pressed="false">Espaciado amplio</button>' +
      '<button type="button" id="a11y-tema" aria-pressed="false">Modo oscuro</button>' +
      '<button type="button" id="a11y-leer">Leer esta página en voz alta</button>' +
      '<button type="button" id="a11y-parar" hidden>Detener la voz</button>' +
      '<a href="ajustes.html" class="enlace-barra">Mi perfil de accesibilidad</a>' +
      '</div>';

    var btnEspaciado = document.getElementById('a11y-espaciado');
    var btnTema = document.getElementById('a11y-tema');
    var btnLeer = document.getElementById('a11y-leer');
    var btnParar = document.getElementById('a11y-parar');

    function refrescarBotones() {
      btnEspaciado.setAttribute('aria-pressed', prefs.espaciado ? 'true' : 'false');
      btnTema.setAttribute('aria-pressed', prefs.tema === 'oscuro' ? 'true' : 'false');
    }
    refrescarBotones();

    document.getElementById('a11y-menos').addEventListener('click', function () {
      cambiar({ escala: Math.max(0.8, Math.round((prefs.escala - 0.1) * 10) / 10) });
    });
    document.getElementById('a11y-mas').addEventListener('click', function () {
      cambiar({ escala: Math.min(2.2, Math.round((prefs.escala + 0.1) * 10) / 10) });
    });
    btnEspaciado.addEventListener('click', function () {
      cambiar({ espaciado: !prefs.espaciado }); refrescarBotones();
    });
    btnTema.addEventListener('click', function () {
      cambiar({ tema: prefs.tema === 'oscuro' ? 'claro' : 'oscuro' }); refrescarBotones();
    });
    btnLeer.addEventListener('click', function () {
      var principal = document.querySelector('main');
      if (!principal || !window.JopoiVoz) return;
      var bloques = principal.querySelectorAll('h1, h2, h3, p, li, article .bloque');
      window.JopoiVoz.hablarBloques(Array.prototype.slice.call(bloques));
      btnParar.hidden = false;
      btnLeer.hidden = true;
    });
    btnParar.addEventListener('click', function () {
      if (window.JopoiVoz) window.JopoiVoz.detener();
    });
    document.addEventListener('jopoi:tts-fin', function () {
      btnParar.hidden = true;
      btnLeer.hidden = false;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Tooltips visibles del texto alternativo (baja visión)               */
  /* ------------------------------------------------------------------ */
  function reflejarAltComoTooltip() {
    document.querySelectorAll('img[alt]').forEach(function (img) {
      if (!img.title) img.title = img.alt;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Atajos de teclado globales (anunciados en la página de ajustes)     */
  /* Alt+1 feed, Alt+2 OCR, Alt+3 propuestas, Alt+4 ajustes, Alt+0 leer  */
  /* ------------------------------------------------------------------ */
  var ATAJOS = { '1': 'index.html', '2': 'ocr.html', '3': 'propuestas.html', '4': 'ajustes.html' };
  document.addEventListener('keydown', function (e) {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    if (ATAJOS[e.key]) { window.location.href = ATAJOS[e.key]; }
    if (e.key === '0') {
      var btn = document.getElementById('a11y-leer');
      if (btn && !btn.hidden) btn.click();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    construirBarra();
    reflejarAltComoTooltip();
    // Marcar en la navegación la página actual para el lector de pantalla.
    var actual = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(function (a) {
      if (a.getAttribute('href') === actual) a.setAttribute('aria-current', 'page');
    });
  });

  /* Service worker: la plataforma completa funciona sin conexión. */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* opcional */ });
  }

  window.JopoiA11y = {
    preferencias: leerPrefs,
    cambiar: cambiar,
    aplicarPerfil: aplicarPerfil
  };
}());
