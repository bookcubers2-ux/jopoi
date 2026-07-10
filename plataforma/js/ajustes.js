/**
 * JOPÓI | Página de ajustes: perfil sensorial y voz
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var estado = document.getElementById('estado-ajustes');
    var prefs = window.JopoiA11y.preferencias();

    // Perfiles sensoriales
    document.querySelectorAll('[data-perfil-boton]').forEach(function (boton) {
      var nombre = boton.getAttribute('data-perfil-boton');
      if (prefs.perfil === nombre) boton.setAttribute('aria-pressed', 'true');
      boton.addEventListener('click', function () {
        window.JopoiA11y.aplicarPerfil(nombre);
        document.querySelectorAll('[data-perfil-boton]').forEach(function (b) {
          b.setAttribute('aria-pressed', b === boton ? 'true' : 'false');
        });
        estado.textContent = 'Perfil aplicado. Toda la plataforma queda adaptada y se recordará en este dispositivo.';
      });
    });

    // Velocidad de la voz
    var velocidad = document.getElementById('control-velocidad');
    var etiquetaVelocidad = document.getElementById('valor-velocidad');
    velocidad.value = window.JopoiVoz.obtenerVelocidad();
    etiquetaVelocidad.textContent = velocidad.value;
    velocidad.addEventListener('input', function () {
      window.JopoiVoz.fijarVelocidad(parseFloat(velocidad.value));
      etiquetaVelocidad.textContent = velocidad.value;
    });
    document.getElementById('btn-probar-voz').addEventListener('click', function () {
      window.JopoiVoz.hablar('Hola. Esta es la voz de la plataforma Jopói, leyendo a la velocidad que usted eligió.');
    });

    // Lectura fácil automática
    var lfAuto = document.getElementById('control-lf-auto');
    lfAuto.checked = !!prefs.lecturaFacilAuto;
    lfAuto.addEventListener('change', function () {
      window.JopoiA11y.cambiar({ lecturaFacilAuto: lfAuto.checked });
      estado.textContent = lfAuto.checked
        ? 'Desde ahora los documentos se abrirán con la versión simplificada ya visible.'
        : 'Los documentos se abrirán con el texto completo.';
    });
  });
}());
