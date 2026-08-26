/**
 * JOPOBOT | Interfaz del asistente de inteligencia artificial
 * -----------------------------------------------------------
 * Conversación pensada primero para la VOZ: un botón grande de
 * micrófono para preguntar hablando, y la respuesta se lee en voz
 * alta automáticamente cuando la pregunta fue dictada. También hay
 * teclado (personas sordas o que prefieren escribir): en ese caso la
 * respuesta no suena sola, cada mensaje trae su botón de escuchar.
 *
 * La clave de la IA no está en este archivo ni en ningún lugar del
 * sitio: vive como secreto en la Edge Function de Supabase.
 */
(function () {
  'use strict';

  var cfg = (window.JOPOI_CONFIG && window.JOPOI_CONFIG.jopobot) || {};
  var MAX_HISTORIAL = 30;
  var Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var escuchando = null;
  var esperando = false;

  /* ---------------- identidad de invitado y historial --------------- */
  function identidadInvitado() {
    var id = null;
    try { id = localStorage.getItem('jopoi_jopobot_invitado'); } catch (e) { /* incógnito */ }
    if (!/^INV-[A-Z0-9]{6}$/.test(id || '')) {
      var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
      for (var i = 0; i < 6; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
      id = 'INV-' + s;
      try { localStorage.setItem('jopoi_jopobot_invitado', id); } catch (e) { /* incógnito */ }
    }
    return id;
  }

  function leerHistorial() {
    try { return JSON.parse(localStorage.getItem('jopoi_jopobot_historial') || '[]'); }
    catch (e) { return []; }
  }
  function guardarHistorial(h) {
    try { localStorage.setItem('jopoi_jopobot_historial', JSON.stringify(h.slice(-MAX_HISTORIAL))); }
    catch (e) { /* incógnito */ }
  }

  /* ---------------- puente al backend ------------------------------- */
  function preguntarApi(mensajes) {
    var url = cfg.supabaseUrl + '/functions/v1/' + (cfg.funcion || 'jopobot');
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': cfg.supabaseAnon,
        'Authorization': 'Bearer ' + cfg.supabaseAnon
      },
      body: JSON.stringify({ codigo: identidadInvitado(), mensajes: mensajes })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok || d.error) {
          var e = new Error(d.error || ('HTTP ' + r.status));
          e.codigo = d.error || '';
          throw e;
        }
        return d;
      });
    });
  }

  function explicar(e) {
    var mapa = {
      'MUY_RAPIDO': 'Vamos muy rápido. Espere unos segundos antes de preguntar de nuevo.',
      'LIMITE_DIARIO': 'Llegó al límite de preguntas por hoy. JOPOBOT lo espera mañana.',
      'LIMITE_GLOBAL': 'JOPOBOT atendió muchas consultas hoy. Inténtelo más tarde.',
      'SIN_CLAVE': 'JOPOBOT todavía no fue activado por la organización. Los demás módulos funcionan con normalidad.',
      'CERRADO': 'JOPOBOT todavía no fue activado por la organización. Los demás módulos funcionan con normalidad.',
      'CUOTA_PROVEEDOR': 'JOPOBOT no está disponible en este momento. Inténtelo en unos minutos.',
      'BLOQUEADO': 'Esa pregunta no se pudo procesar. Intente decirla con otras palabras.'
    };
    return mapa[e.codigo] || 'No hay conexión con JOPOBOT. Revise su internet e inténtelo de nuevo.';
  }

  /* ---------------- interfaz --------------------------------------- */
  function anunciar(texto) {
    document.getElementById('estado-jopobot').textContent = texto;
  }

  function pintarMensaje(rol, texto) {
    var log = document.getElementById('log-jopobot');
    var div = document.createElement('div');
    div.className = 'mensaje-' + (rol === 'usuario' ? 'usuario' : 'bot');
    var quien = document.createElement('p');
    quien.className = 'quien-habla';
    quien.textContent = rol === 'usuario' ? 'Usted dijo:' : 'JOPOBOT responde:';
    var cuerpo = document.createElement('p');
    cuerpo.className = 'texto-mensaje';
    cuerpo.textContent = texto;
    div.appendChild(quien);
    div.appendChild(cuerpo);
    if (rol === 'bot' && window.JopoiVoz && window.JopoiVoz.disponible) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'secundario leer-bloque';
      btn.textContent = 'Escuchar esta respuesta';
      btn.addEventListener('click', function () { window.JopoiVoz.hablar(texto, div); });
      div.appendChild(btn);
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function pintarHistorial() {
    var h = leerHistorial();
    h.forEach(function (m) { pintarMensaje(m.rol, m.texto); });
    if (h.length) anunciar('Su conversación anterior está guardada en este dispositivo. Puede continuarla o borrarla.');
  }

  function bloquear(si) {
    esperando = si;
    ['btn-microfono-jopobot', 'btn-enviar-jopobot'].forEach(function (id) {
      var b = document.getElementById(id);
      if (b) b.disabled = si;
    });
  }

  /* Envía la pregunta. Si fue por voz, la respuesta se lee en voz
     alta: es la continuación natural de la acción que la persona
     pidió (nunca suena sola sin que ella haya hablado primero). */
  function enviarSeguro(texto, porVoz) {
    if (esperando) return;
    var t = String(texto || '').trim();
    if (!t) { anunciar('Escriba o dicte primero su pregunta.'); return; }
    var h = leerHistorial();
    h.push({ rol: 'usuario', texto: t });
    guardarHistorial(h);
    pintarMensaje('usuario', t);
    document.getElementById('texto-jopobot').value = '';
    bloquear(true);
    anunciar('JOPOBOT está pensando la respuesta. Suele tardar unos diez segundos.');
    preguntarApi(h.slice(-12)).then(function (d) {
      h.push({ rol: 'bot', texto: d.respuesta });
      guardarHistorial(h);
      var div = pintarMensaje('bot', d.respuesta);
      anunciar('JOPOBOT ya respondió.');
      if (porVoz && window.JopoiVoz && window.JopoiVoz.disponible) window.JopoiVoz.hablar(d.respuesta, div);
    }).catch(function (e) {
      var msj = explicar(e);
      pintarMensaje('bot', msj);
      anunciar(msj);
      if (porVoz && window.JopoiVoz && window.JopoiVoz.disponible) window.JopoiVoz.hablar(msj);
    }).then(function () { bloquear(false); }, function () { bloquear(false); });
  }

  /* ---------------- dictado de una pregunta ------------------------- */
  function dictarPregunta() {
    var boton = document.getElementById('btn-microfono-jopobot');
    if (!Reconocimiento) {
      anunciar('El dictado por voz no está disponible en este navegador. Pruebe con Chrome o Edge, o escriba su pregunta con el teclado.');
      return;
    }
    if (escuchando) { escuchando.stop(); return; }
    if (window.JopoiVoz) window.JopoiVoz.detener();

    var rec = new Reconocimiento();
    rec.lang = (window.JOPOI_CONFIG || {}).dictadoIdioma || 'es-BO';
    rec.continuous = false;       // una pregunta por toque
    rec.interimResults = false;
    var frase = '';

    rec.onstart = function () {
      escuchando = rec;
      boton.classList.add('grabando');
      boton.setAttribute('aria-label', 'Detener el dictado');
      anunciar('Escuchando. Haga su pregunta. Al terminar de hablar, se envía sola.');
    };
    rec.onresult = function (ev) {
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) frase += ev.results[i][0].transcript;
      }
    };
    rec.onerror = function (ev) {
      if (ev.error === 'not-allowed') {
        anunciar('Permiso de micrófono denegado. Actívelo en la configuración del navegador, o escriba su pregunta.');
      } else if (ev.error !== 'aborted') {
        anunciar('No se pudo escuchar. Intente de nuevo o escriba su pregunta.');
      }
    };
    rec.onend = function () {
      escuchando = null;
      boton.classList.remove('grabando');
      boton.setAttribute('aria-label', 'Preguntar por voz a JOPOBOT');
      if (frase.trim()) enviarSeguro(frase, true);
    };
    rec.start();
  }

  /* ---------------- arranque ---------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    pintarHistorial();

    document.getElementById('btn-microfono-jopobot').addEventListener('click', dictarPregunta);

    var campo = document.getElementById('texto-jopobot');
    document.getElementById('btn-enviar-jopobot').addEventListener('click', function () {
      enviarSeguro(campo.value, false);
    });
    campo.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarSeguro(campo.value, false);
      }
    });

    document.querySelectorAll('[data-sugerencia]').forEach(function (chip) {
      chip.addEventListener('click', function () {
        enviarSeguro(chip.getAttribute('data-sugerencia'), false);
      });
    });

    document.getElementById('btn-borrar-jopobot').addEventListener('click', function () {
      if (!confirm('Esto borrará la conversación guardada en este dispositivo. ¿Desea continuar?')) return;
      try { localStorage.removeItem('jopoi_jopobot_historial'); } catch (e) { /* incógnito */ }
      document.getElementById('log-jopobot').innerHTML = '';
      anunciar('Conversación borrada. Puede empezar de nuevo.');
    });
  });
}());
