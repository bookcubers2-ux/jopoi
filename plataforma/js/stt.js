/**
 * JOPÓI | Dictado Universal (STT, voz a texto)
 * --------------------------------------------
 * Añade automáticamente un botón de micrófono a CADA campo de texto de
 * la plataforma (input de texto, búsqueda y textarea). La persona dicta
 * y el texto se escribe en el campo, sin teclear.
 *
 * Usa la Web Speech API (SpeechRecognition). Si el navegador no la
 * soporta, el botón lo comunica de forma accesible en vez de fallar
 * en silencio.
 */
(function () {
  'use strict';

  var Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var activo = null; // instancia en uso

  function crearBotonMicrofono(campo) {
    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton-microfono';
    boton.setAttribute('aria-label', 'Dictar por voz en este campo');
    boton.innerHTML =
      '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">' +
      '<path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/>' +
      '</svg><span class="solo-lector">Dictar por voz</span>';

    var estado = document.createElement('span');
    estado.className = 'estado-dictado';
    estado.setAttribute('role', 'status');
    estado.setAttribute('aria-live', 'polite');

    boton.addEventListener('click', function () {
      if (!Reconocimiento) {
        estado.textContent = 'El dictado por voz no está disponible en este navegador. Pruebe con Chrome o Edge.';
        return;
      }
      if (activo) { activo.stop(); activo = null; return; }

      var rec = new Reconocimiento();
      rec.lang = (window.JOPOI_CONFIG || {}).dictadoIdioma || 'es-BO';
      rec.continuous = true;
      rec.interimResults = false;

      rec.onstart = function () {
        activo = rec;
        boton.classList.add('grabando');
        boton.setAttribute('aria-label', 'Detener el dictado');
        estado.textContent = 'Escuchando. Hable ahora. Pulse otra vez el micrófono para terminar.';
      };
      rec.onresult = function (evento) {
        var frase = '';
        for (var i = evento.resultIndex; i < evento.results.length; i++) {
          if (evento.results[i].isFinal) frase += evento.results[i][0].transcript;
        }
        if (!frase) return;
        var separador = campo.value && !/\s$/.test(campo.value) ? ' ' : '';
        campo.value += separador + frase.trim();
        campo.dispatchEvent(new Event('input', { bubbles: true }));
      };
      rec.onerror = function (evento) {
        if (evento.error === 'not-allowed') {
          estado.textContent = 'Permiso de micrófono denegado. Actívelo en la configuración del navegador.';
        } else if (evento.error !== 'aborted') {
          estado.textContent = 'No se pudo escuchar. Intente de nuevo.';
        }
      };
      rec.onend = function () {
        activo = null;
        boton.classList.remove('grabando');
        boton.setAttribute('aria-label', 'Dictar por voz en este campo');
        if (estado.textContent.indexOf('Escuchando') === 0) {
          estado.textContent = 'Dictado terminado. El texto quedó escrito en el campo.';
        }
        campo.focus();
      };
      rec.start();
    });

    return { boton: boton, estado: estado };
  }

  function equipar(campo) {
    if (campo.dataset.conDictado === 'si' || campo.dataset.sinDictado === 'si') return;
    campo.dataset.conDictado = 'si';
    var envoltura = document.createElement('div');
    envoltura.className = 'campo-con-dictado';
    campo.parentNode.insertBefore(envoltura, campo);
    envoltura.appendChild(campo);
    var piezas = crearBotonMicrofono(campo);
    envoltura.appendChild(piezas.boton);
    envoltura.parentNode.insertBefore(piezas.estado, envoltura.nextSibling);
  }

  function equiparTodo(raiz) {
    (raiz || document)
      .querySelectorAll('textarea, input[type="text"], input[type="search"]')
      .forEach(equipar);
  }

  document.addEventListener('DOMContentLoaded', function () { equiparTodo(document); });

  window.JopoiDictado = { equiparTodo: equiparTodo, disponible: !!Reconocimiento };
}());
