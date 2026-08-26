/**
 * JOPÓI | Lector de documentos legislativos
 * -----------------------------------------
 * Muestra una ley o proyecto en texto puro y estructurado:
 * - Bloques cortos con pausa visual (neurodivergencia).
 * - Botón de voz por bloque y lectura completa.
 * - Modo Simplificado (Lectura Fácil, norma UNE 153101) con pictogramas.
 * - Exportación a braille .BRF y vista braille en pantalla.
 * También puede leer un texto traído desde el módulo OCR
 * (documento.html?origen=ocr).
 */
(function () {
  'use strict';

  function parametro(nombre) {
    return new URLSearchParams(location.search).get(nombre);
  }

  function obtenerDocumento() {
    if (parametro('origen') === 'ocr') {
      var texto = sessionStorage.getItem('jopoi_ocr_texto') || '';
      return Promise.resolve({
        id: 'ocr',
        titulo: sessionStorage.getItem('jopoi_ocr_titulo') || 'Documento digitalizado con OCR',
        tipo: 'Documento digitalizado por la ciudadanía',
        estado: 'digitalizado',
        fecha: '',
        texto: texto,
        fuente: 'Archivo subido por la persona usuaria y procesado en su propio dispositivo.'
      });
    }
    var id = parametro('id');
    return fetch('data/leyes.json')
      .then(function (r) { return r.json(); })
      .catch(function () {
        return JSON.parse(localStorage.getItem('jopoi_leyes_cache') || '[]');
      })
      .then(function (leyes) {
        var doc = (leyes || []).filter(function (l) { return l.id === id; })[0];
        if (!doc) throw new Error('No se encontró el documento solicitado.');
        return doc;
      });
  }

  /* ------------------------- pintado ------------------------------- */

  function pintarBloques(doc) {
    var contenedor = document.getElementById('cuerpo-documento');
    contenedor.innerHTML = '';
    var bloques = window.JopoiTexto.procesarEnBloques(doc.texto, 320);
    bloques.forEach(function (textoBloque, i) {
      var div = document.createElement('div');
      div.className = 'bloque';
      div.id = 'bloque-' + (i + 1);
      var botonLeer = document.createElement('button');
      botonLeer.type = 'button';
      botonLeer.className = 'leer-bloque secundario';
      botonLeer.textContent = 'Escuchar este bloque';
      botonLeer.addEventListener('click', function () {
        window.JopoiVoz.hablar(textoBloque, div);
      });
      var p = document.createElement('p');
      p.textContent = textoBloque;
      div.appendChild(botonLeer);
      div.appendChild(p);
      contenedor.appendChild(div);
    });
    return bloques;
  }

  function pintarLecturaFacil(doc) {
    var panel = document.getElementById('panel-lectura-facil');
    var estado = document.getElementById('estado-simplificado');
    estado.textContent = 'Preparando la versión simplificada.';
    window.JopoiLecturaFacil.simplificar(doc).then(function (resultado) {
      panel.hidden = false;
      var origenTexto = {
        validada: 'Versión en Lectura Fácil redactada por personas siguiendo las pautas de la norma UNE 153101.',
        api: resultado.aviso,
        local: resultado.aviso
      }[resultado.origen];

      var html = '<h2 id="titulo-lf">Versión simplificada (Lectura Fácil)</h2>';
      html += '<div class="fila-pictogramas" id="pictos-lf" aria-label="Pictogramas del tema de este documento"></div>';
      html += '<ul class="vinetas">';
      resultado.vinetas.forEach(function (v) { html += '<li>' + v + '</li>'; });
      html += '</ul>';
      if (resultado.glosario.length) {
        html += '<h3>Palabras difíciles de este documento</h3><dl class="glosario">';
        resultado.glosario.forEach(function (g) {
          html += '<dt>' + g.termino + '</dt><dd>Quiere decir: ' + g.explicacion + '.</dd>';
        });
        html += '</dl>';
      }
      html += '<p class="aviso-origen">' + origenTexto + '</p>';
      panel.innerHTML = html;

      // Pictogramas: banco local siempre; ARASAAC si hay conexión.
      var fila = document.getElementById('pictos-lf');
      var locales = window.JopoiPictogramas.paraTexto(doc.titulo + ' ' + doc.texto, 4);
      locales.forEach(function (f) { fila.appendChild(f); });
      var temas = (doc.temas && doc.temas[0]) || null;
      if (temas) {
        window.JopoiPictogramas.buscarArasaac(temas, 2).then(function (figuras) {
          figuras.forEach(function (f) { fila.appendChild(f); });
        });
      }

      estado.textContent = 'Versión simplificada lista debajo de este botón.';
      panel.focus();
    });
  }

  /* ------------------------- braille ------------------------------- */

  function textoCompleto(doc) {
    return window.JopoiTexto.procesar(doc.titulo + '. ' + doc.texto);
  }

  function exportarBRF(doc) {
    window.JopoiBraille.descargarBRF(
      doc.titulo,
      window.JopoiTexto.procesar(doc.texto),
      String(doc.id || 'documento').replace(/[^a-z0-9_-]/gi, '_')
    );
    document.getElementById('estado-braille').textContent =
      'Archivo braille descargado en formato punto BRF, listo para impresora braille o línea braille. ' +
      'Página estándar de 40 celdas por 25 líneas.';
  }

  function mostrarBraille(doc) {
    var zona = document.getElementById('braille-en-pantalla');
    var muestra = window.JopoiBraille.traducir(textoCompleto(doc).slice(0, 400)).unicode;
    zona.hidden = false;
    zona.innerHTML =
      '<h2>Vista braille (primeras líneas)</h2>' +
      '<p class="braille-muestra" aria-label="Muestra del documento en celdas braille">' + muestra + '</p>' +
      '<p>Esta vista es solo demostrativa. Para leer el documento completo use su línea braille conectada: ' +
      'todo el texto de esta página ya es compatible, o descargue el archivo punto BRF.</p>';
  }

  /* --------------- apoyos cognitivos (COGA, WCAG 2.2) --------------- */

  // Resumen en lenguaje claro SIEMPRE al inicio del documento
  // (patrón COGA "Provide a Summary of Long Documents") y el recuadro
  // "¿Qué significa esto para mí?" (práctica de los parlamentos con
  // versión fácil, como el escocés).
  function pintarApoyosCognitivos(doc) {
    var zona = document.getElementById('apoyos-cognitivos');
    if (!zona) return;
    var html = '';
    if (doc.resumen) {
      html += '<h2>Resumen en lenguaje claro</h2><p>' +
        window.JopoiTexto.procesar(doc.resumen) + '</p>';
    }
    if (Array.isArray(doc.paraMi) && doc.paraMi.length) {
      html += '<section class="para-mi"><h3>¿Qué significa esto para usted?</h3><ul>' +
        doc.paraMi.map(function (f) { return '<li>' + f + '</li>'; }).join('') +
        '</ul></section>';
    }
    // El camino de la ley: dónde está esta norma en el proceso.
    var pasos = ['Idea', 'Debate en la Asamblea', 'Votación', 'Ley vigente'];
    var actual = doc.estado === 'vigente' ? 3 : (doc.estado === 'proyecto' ? 1 : -1);
    if (actual >= 0) {
      html += '<h2>El camino de esta norma</h2>' +
        '<ol class="camino-ley" aria-label="Etapas del proceso legislativo">' +
        pasos.map(function (p, i) {
          return '<li' + (i === actual ? ' aria-current="step"' : '') + '>' +
            (i + 1) + '. ' + p + (i === actual ? ' (aquí está ahora)' : '') + '</li>';
        }).join('') + '</ol>';
    }
    zona.innerHTML = html;
  }

  // Barra fina de progreso de lectura (orientación: cuánto falta).
  function activarProgresoLectura() {
    var barra = document.createElement('div');
    barra.id = 'progreso-lectura';
    barra.setAttribute('aria-hidden', 'true');
    document.body.appendChild(barra);
    window.addEventListener('scroll', function () {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var avance = total > 0 ? (window.scrollY / total) * 100 : 0;
      barra.style.width = avance + '%';
    }, { passive: true });
  }

  /* ------------------------- arranque ------------------------------ */

  document.addEventListener('DOMContentLoaded', function () {
    var estado = document.getElementById('estado-documento');
    obtenerDocumento().then(function (doc) {
      document.title = doc.titulo + ' | JOPÓI';
      document.getElementById('titulo-documento').textContent = doc.titulo;
      var meta = document.getElementById('meta-documento');
      meta.textContent = doc.tipo + (doc.fecha ? '. Fecha: ' + doc.fecha : '') +
        (doc.fuente ? '. Fuente: ' + doc.fuente : '') + (doc.demo ? '. Documento de demostración.' : '');

      pintarApoyosCognitivos(doc);
      activarProgresoLectura();
      pintarBloques(doc);

      // Modo foco: oculta menús y todo lo que no sea el documento
      // (COGA Objetivo 6: evitar distracciones).
      var btnFoco = document.getElementById('btn-modo-foco');
      if (btnFoco) {
        btnFoco.addEventListener('click', function () {
          var activo = document.body.classList.toggle('modo-foco');
          btnFoco.setAttribute('aria-pressed', activo ? 'true' : 'false');
          btnFoco.textContent = activo ? 'Salir del modo foco' : 'Modo foco: solo el texto';
        });
      }

      document.getElementById('btn-escuchar-todo').addEventListener('click', function () {
        var bloques = document.querySelectorAll('#cuerpo-documento .bloque p');
        window.JopoiVoz.hablarBloques(Array.prototype.slice.call(bloques));
      });
      document.getElementById('btn-detener-voz').addEventListener('click', function () {
        window.JopoiVoz.detener();
      });
      document.getElementById('btn-simplificar').addEventListener('click', function () {
        pintarLecturaFacil(doc);
      });
      document.getElementById('btn-brf').addEventListener('click', function () {
        exportarBRF(doc);
      });
      document.getElementById('btn-braille-pantalla').addEventListener('click', function () {
        mostrarBraille(doc);
      });
      var btnProponer = document.getElementById('btn-proponer');
      if (btnProponer) {
        btnProponer.href = 'propuestas.html?sobre=' + encodeURIComponent(doc.id);
      }

      // Marco legal al pie del documento.
      var marco = (window.JOPOI_CONFIG || {}).marcoLegal || [];
      if (marco.length) {
        document.getElementById('marco-legal').innerHTML =
          '<h2>Su derecho a esta información</h2>' +
          '<p>El acceso a este documento en formatos accesibles está protegido por:</p>' +
          '<ul>' + marco.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul>';
      }

      // Perfil neurodivergente: abrir directamente el modo simplificado.
      if (window.JopoiA11y.preferencias().lecturaFacilAuto && doc.id !== 'ocr') {
        pintarLecturaFacil(doc);
      }

      estado.textContent = '';
    }).catch(function (e) {
      estado.textContent = e.message + ' Vuelva al inicio para elegir un documento.';
    });
  });
}());
