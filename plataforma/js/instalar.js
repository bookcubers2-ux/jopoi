/**
 * JOPÓI | Instalación como aplicación (PWA)
 * -----------------------------------------
 * Sección fija en todas las páginas (no es ventana emergente) con un
 * ÚNICO BOTÓN de instalación, siempre visible en Android y escritorio:
 *
 *  - Android (Samsung, Xiaomi, etc.), Chrome y Edge: al tocar el botón
 *    se dispara la instalación nativa de un solo paso
 *    (beforeinstallprompt). Si el navegador todavía no anunció que se
 *    puede instalar, el botón espera unos segundos a que lo haga y
 *    recién entonces, si no hay señal, muestra el camino manual exacto
 *    para ese navegador.
 *  - iPhone y iPad (Safari): Apple no permite a ninguna página web
 *    instalar con un botón; se muestran los 4 pasos oficiales.
 *  - Ya instalada: la sección lo celebra.
 */
(function () {
  'use strict';

  var eventoInstalacion = null;

  function esIos() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function yaInstalada() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
  }

  function nombreNavegador() {
    var ua = navigator.userAgent;
    if (/SamsungBrowser/i.test(ua)) return 'samsung';
    if (/Firefox/i.test(ua)) return 'firefox';
    if (/OPR|Opera/i.test(ua)) return 'opera';
    if (/Edg/i.test(ua)) return 'edge';
    if (/Chrome/i.test(ua)) return 'chrome';
    return 'otro';
  }

  function instruccionesManuales() {
    switch (nombreNavegador()) {
      case 'samsung':
        return 'En el Internet de Samsung: toque el menú de las tres líneas, abajo a la derecha, y elija "Añadir página a" y luego "Pantalla de inicio".';
      case 'firefox':
        return 'En Firefox: toque el menú de los tres puntos y elija "Instalar" o "Añadir a pantalla de inicio".';
      case 'opera':
        return 'En Opera: toque el menú y elija "Añadir a" y luego "Pantalla de inicio".';
      default:
        return 'Toque el menú de los tres puntos de su navegador y elija "Instalar aplicación" o "Añadir a pantalla de inicio".';
    }
  }

  function anunciar(texto) {
    var estado = document.getElementById('estado-instalar');
    if (estado) estado.textContent = texto;
  }

  function lanzarInstalacion() {
    var boton = document.getElementById('btn-instalar-pwa');
    eventoInstalacion.prompt();
    eventoInstalacion.userChoice.then(function (eleccion) {
      if (eleccion.outcome === 'accepted') {
        anunciar('Instalando JOPÓI. En unos segundos aparecerá junto a sus aplicaciones, con su ícono verde.');
        if (boton) boton.hidden = true;
      } else {
        anunciar('Instalación cancelada. Puede instalarla cuando quiera con este mismo botón.');
      }
      eventoInstalacion = null;
    });
  }

  function intentarInstalar() {
    // Camino feliz: el navegador ya anunció que se puede instalar.
    if (eventoInstalacion) { lanzarInstalacion(); return; }

    // El anuncio puede llegar con retraso (Chrome lo emite cuando
    // termina de verificar el manifest y el service worker). Se espera
    // hasta 6 segundos antes de rendirse al camino manual.
    anunciar('Preparando la instalación, un momento por favor.');
    var intentos = 0;
    var temporizador = setInterval(function () {
      intentos++;
      if (eventoInstalacion) {
        clearInterval(temporizador);
        lanzarInstalacion();
      } else if (intentos >= 12) {
        clearInterval(temporizador);
        anunciar('Su navegador no permite la instalación directa con un botón. ' + instruccionesManuales() +
          ' Solo se hace una vez: después JOPÓI queda como una aplicación más.');
      }
    }, 500);
  }

  function construirSeccion() {
    var pie = document.querySelector('footer.sitio');
    if (!pie || document.getElementById('seccion-instalar')) return;

    var seccion = document.createElement('section');
    seccion.id = 'seccion-instalar';
    seccion.className = 'instalar-pwa';
    seccion.setAttribute('aria-labelledby', 'titulo-instalar');

    var html = '<h2 id="titulo-instalar">Lleve JOPÓI en su teléfono</h2>';

    if (yaInstalada()) {
      html += '<p>JOPÓI ya está instalada en este dispositivo. Funciona aunque no tenga internet: las leyes y sus borradores quedan guardados.</p>';
    } else if (esIos()) {
      html += '<p>JOPÓI es una aplicación gratuita que se instala desde el navegador, sin tienda de aplicaciones. Una vez instalada funciona sin internet.</p>';
      html += '<p><strong>Para instalarla en su iPhone o iPad</strong> (Apple no permite hacerlo con un solo botón):</p>';
      html += '<ol>' +
        '<li>Abra esta página en Safari.</li>' +
        '<li>Toque el botón Compartir: el cuadrado con una flecha hacia arriba, en la barra inferior.</li>' +
        '<li>Deslice y toque "Añadir a pantalla de inicio".</li>' +
        '<li>Toque "Añadir". Listo: JOPÓI aparece como una aplicación más, con su ícono verde.</li>' +
        '</ol>';
    } else {
      html += '<p>JOPÓI es una aplicación gratuita que se instala con un solo botón, sin tienda de aplicaciones y sin ocupar casi espacio. Una vez instalada funciona sin internet.</p>';
      html += '<button type="button" id="btn-instalar-pwa">Instalar JOPÓI como aplicación</button>';
    }
    html += '<p id="estado-instalar" role="status" aria-live="polite"></p>';

    seccion.innerHTML = html;
    pie.parentNode.insertBefore(seccion, pie);

    var boton = document.getElementById('btn-instalar-pwa');
    if (boton) boton.addEventListener('click', intentarInstalar);
  }

  // Chromium dispara este evento cuando la PWA cumple los requisitos.
  window.addEventListener('beforeinstallprompt', function (evento) {
    evento.preventDefault(); // sin ventanas emergentes automáticas
    eventoInstalacion = evento;
  });

  window.addEventListener('appinstalled', function () {
    anunciar('JOPÓI quedó instalada. Desde ahora funciona incluso sin internet.');
    var boton = document.getElementById('btn-instalar-pwa');
    if (boton) boton.hidden = true;
  });

  document.addEventListener('DOMContentLoaded', construirSeccion);
}());
