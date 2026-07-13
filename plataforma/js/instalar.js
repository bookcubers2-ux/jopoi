/**
 * JOPÓI | Instalación como aplicación (PWA)
 * -----------------------------------------
 * Muestra en todas las páginas una sección fija (no es ventana
 * emergente: respeta la regla de cero pop-ups) que invita a instalar
 * JOPÓI en el teléfono o la computadora:
 *
 *  - Android (Samsung, Xiaomi, etc.), Chrome y Edge: botón nativo
 *    "Instalar la aplicación" usando el evento beforeinstallprompt.
 *  - iPhone y iPad (Safari): Apple no permite botón directo, así que
 *    se muestran las instrucciones paso a paso de "Añadir a pantalla
 *    de inicio", redactadas de forma accesible.
 *  - Si la aplicación ya está instalada, la sección lo celebra y
 *    recuerda que funciona sin internet.
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
      html += '<p>JOPÓI es una aplicación gratuita que se instala desde el navegador, sin tienda de aplicaciones y sin ocupar casi espacio. Una vez instalada funciona sin internet.</p>';
      html += '<p><strong>Para instalarla en su iPhone o iPad:</strong></p>';
      html += '<ol>' +
        '<li>Abra esta página en Safari.</li>' +
        '<li>Toque el botón Compartir: el cuadrado con una flecha hacia arriba, en la barra inferior.</li>' +
        '<li>Deslice y toque "Añadir a pantalla de inicio".</li>' +
        '<li>Toque "Añadir". Listo: JOPÓI aparece como una aplicación más, con su ícono verde.</li>' +
        '</ol>';
    } else {
      html += '<p>JOPÓI es una aplicación gratuita que se instala desde el navegador, sin tienda de aplicaciones y sin ocupar casi espacio. Una vez instalada funciona sin internet y aparece con su ícono verde junto a sus demás aplicaciones.</p>';
      html += '<button type="button" id="btn-instalar-pwa" hidden>Instalar JOPÓI como aplicación</button>';
      html += '<p id="instrucciones-instalar">Si el botón de instalación no aparece: abra el menú de su navegador (los tres puntos) y elija "Instalar aplicación" o "Añadir a pantalla de inicio".</p>';
    }
    html += '<p id="estado-instalar" role="status" aria-live="polite"></p>';

    seccion.innerHTML = html;
    pie.parentNode.insertBefore(seccion, pie);

    var boton = document.getElementById('btn-instalar-pwa');
    if (boton) {
      if (eventoInstalacion) boton.hidden = false;
      boton.addEventListener('click', function () {
        if (!eventoInstalacion) return;
        eventoInstalacion.prompt();
        eventoInstalacion.userChoice.then(function (eleccion) {
          var estado = document.getElementById('estado-instalar');
          if (eleccion.outcome === 'accepted') {
            estado.textContent = 'Instalando JOPÓI. En unos segundos aparecerá junto a sus aplicaciones.';
            boton.hidden = true;
          } else {
            estado.textContent = 'Instalación cancelada. Puede instalarla cuando quiera desde este mismo botón.';
          }
          eventoInstalacion = null;
        });
      });
    }
  }

  // Chromium dispara este evento cuando la PWA cumple los requisitos.
  window.addEventListener('beforeinstallprompt', function (evento) {
    evento.preventDefault(); // sin ventanas emergentes automáticas
    eventoInstalacion = evento;
    var boton = document.getElementById('btn-instalar-pwa');
    if (boton) boton.hidden = false;
  });

  window.addEventListener('appinstalled', function () {
    var estado = document.getElementById('estado-instalar');
    if (estado) estado.textContent = 'JOPÓI quedó instalada. Desde ahora funciona incluso sin internet.';
    var boton = document.getElementById('btn-instalar-pwa');
    if (boton) boton.hidden = true;
  });

  document.addEventListener('DOMContentLoaded', construirSeccion);
}());
