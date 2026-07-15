/**
 * JOPÓI | Lector de Voz Omnipresente (TTS)
 * ----------------------------------------
 * Reproduce cualquier texto de la plataforma con la voz más natural
 * disponible. Estrategia de calidad:
 *  1. Si hay una API de voz neuronal configurada (config.js), se usa.
 *  2. Si no, se eligen las voces del navegador con puntaje de
 *     naturalidad: voces "neural", "natural" u "online" primero,
 *     y siempre en español (preferencia es-BO > es-419 > es-*).
 * Todo texto pasa por el middleware (JopoiTexto.procesar) antes de
 * hablarse, para que no se deletreen abreviaturas.
 */
(function () {
  'use strict';

  var sintetizador = window.speechSynthesis || null;
  var vozElegida = null;
  var velocidad = parseFloat(localStorage.getItem('jopoi_tts_velocidad') || '1');
  var enCola = [];
  var hablando = false;

  function puntuarVoz(voz) {
    var puntos = 0;
    var nombre = (voz.name || '').toLowerCase();
    var lang = (voz.lang || '').toLowerCase().replace('_', '-');
    var pref = ((window.JOPOI_CONFIG || {}).vozIdioma || 'es-BO').toLowerCase();
    if (lang === pref) puntos += 50;
    if (lang.indexOf('es-419') === 0 || lang.indexOf('es-us') === 0 || lang.indexOf('es-mx') === 0) puntos += 30;
    if (lang.indexOf('es') === 0) puntos += 20;
    // Señales de voz natural (neural) frente a voz robótica antigua.
    if (/natural|neural|online|premium|enhanced/.test(nombre)) puntos += 25;
    if (/sabina|helena|paulina|dalia|elvira|google/.test(nombre)) puntos += 10;
    if (!voz.localService) puntos += 5; // las remotas suelen ser neuronales
    return puntos;
  }

  function elegirVoz() {
    if (!sintetizador) return null;
    var voces = sintetizador.getVoices() || [];
    if (!voces.length) return null;
    var candidatas = voces.filter(function (v) { return (v.lang || '').toLowerCase().indexOf('es') === 0; });
    if (!candidatas.length) candidatas = voces;
    candidatas.sort(function (a, b) { return puntuarVoz(b) - puntuarVoz(a); });
    return candidatas[0];
  }

  if (sintetizador) {
    sintetizador.onvoiceschanged = function () { vozElegida = elegirVoz(); };
    vozElegida = elegirVoz();
  }

  function detener() {
    enCola = [];
    hablando = false;
    if (sintetizador) sintetizador.cancel();
    document.querySelectorAll('.tts-leyendo').forEach(function (el) {
      el.classList.remove('tts-leyendo');
    });
    document.dispatchEvent(new CustomEvent('jopoi:tts-fin'));
  }

  function hablarSiguiente() {
    if (!enCola.length) { hablando = false; document.dispatchEvent(new CustomEvent('jopoi:tts-fin')); return; }
    hablando = true;
    var tarea = enCola.shift();
    var texto = window.JopoiTexto ? window.JopoiTexto.procesar(tarea.texto) : tarea.texto;
    var u = new SpeechSynthesisUtterance(texto);
    if (!vozElegida) vozElegida = elegirVoz();
    if (vozElegida) u.voice = vozElegida;
    u.lang = (window.JOPOI_CONFIG || {}).vozIdioma || 'es-BO';
    u.rate = velocidad;
    u.pitch = 1;
    if (tarea.elemento) tarea.elemento.classList.add('tts-leyendo');
    u.onend = u.onerror = function () {
      if (tarea.elemento) tarea.elemento.classList.remove('tts-leyendo');
      hablarSiguiente();
    };
    sintetizador.speak(u);
  }

  /* ------------------------------------------------------------------ */
  /* Botón "Detener la voz" acompañante                                  */
  /* Aparece justo al lado del botón de escuchar que se pulsó, para que  */
  /* una persona con lector de pantalla no tenga que viajar hasta la     */
  /* barra superior para frenar la voz. Al terminar, desaparece y el     */
  /* foco vuelve al botón original.                                      */
  /* ------------------------------------------------------------------ */
  var botonOrigen = null;

  function mostrarDetenerJunto() {
    var origen = document.activeElement;
    if (!origen || origen.tagName !== 'BUTTON') return;
    if (origen.closest && origen.closest('.barra-a11y')) return; // la barra ya tiene su propio detener
    if (/detener/i.test(origen.textContent)) return;
    var vecino = origen.nextElementSibling;
    if (vecino && vecino.tagName === 'BUTTON' && /detener/i.test(vecino.textContent)) return; // ya hay uno al lado

    botonOrigen = origen;
    var boton = document.getElementById('jopoi-detener-junto');
    if (!boton) {
      boton = document.createElement('button');
      boton.type = 'button';
      boton.id = 'jopoi-detener-junto';
      boton.className = 'secundario';
      boton.textContent = 'Detener la voz';
      boton.addEventListener('click', function () { detener(); });
    }
    origen.insertAdjacentElement('afterend', boton);
    boton.hidden = false;
  }

  function retirarDetenerJunto() {
    var boton = document.getElementById('jopoi-detener-junto');
    if (!boton) return;
    var teniaFoco = document.activeElement === boton;
    boton.remove();
    if (teniaFoco && botonOrigen && document.contains(botonOrigen)) botonOrigen.focus();
    botonOrigen = null;
  }

  document.addEventListener('jopoi:tts-fin', retirarDetenerJunto);

  /**
   * Arranca la lectura con una pausa breve después de cancel().
   * En Chrome, llamar a speak() inmediatamente después de cancel()
   * hace que la voz se pierda en silencio; esta espera lo evita.
   */
  function arrancar() {
    setTimeout(function () {
      try { sintetizador.resume(); } catch (e) { /* opcional */ }
      hablarSiguiente();
    }, 120);
  }

  /**
   * Lee un texto. Si se pasa un elemento, se resalta mientras se lee
   * (apoyo visual para baja visión y neurodivergencia).
   * Los textos largos se leen por partes: Chrome corta las emisiones
   * de más de unos 15 segundos si van en un solo bloque.
   */
  function hablar(texto, elemento) {
    if (!sintetizador) {
      alert('Este navegador no tiene síntesis de voz. Pruebe con Chrome, Edge o Firefox actualizados.');
      return;
    }
    if (!texto || !String(texto).trim()) return;
    detener();
    mostrarDetenerJunto();
    var partes = window.JopoiTexto
      ? window.JopoiTexto.fragmentarEnBloques(String(texto), 260)
      : [String(texto)];
    if (!partes.length) partes = [String(texto)];
    partes.forEach(function (parte) {
      enCola.push({ texto: parte, elemento: elemento || null });
    });
    arrancar();
  }

  /** Lee una lista de bloques en orden, resaltando cada uno. */
  function hablarBloques(elementos) {
    if (!sintetizador || !elementos.length) return;
    detener();
    mostrarDetenerJunto();
    elementos.forEach(function (el) {
      enCola.push({ texto: el.textContent, elemento: el });
    });
    arrancar();
  }

  function fijarVelocidad(v) {
    velocidad = Math.min(2, Math.max(0.5, v));
    localStorage.setItem('jopoi_tts_velocidad', String(velocidad));
  }

  window.JopoiVoz = {
    hablar: hablar,
    hablarBloques: hablarBloques,
    detener: detener,
    fijarVelocidad: fijarVelocidad,
    obtenerVelocidad: function () { return velocidad; },
    estaHablando: function () { return hablando; },
    disponible: !!sintetizador
  };
}());
