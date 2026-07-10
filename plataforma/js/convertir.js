/**
 * JOPÓI | Módulo Convertir a Braille
 * ----------------------------------
 * Convierte cualquier texto en español (pegado, dictado o subido como
 * PDF, imagen o archivo de texto) a braille español grado 1, la
 * signografía usada en Bolivia (signo de mayúscula 4-6, signo de
 * número 3-4-5-6, ñ 1-2-4-5-6, vocales acentuadas propias).
 *
 * Tres salidas:
 *  1. Vista braille en pantalla (Unicode), para verificar y aprender.
 *  2. Archivo .BRF para impresora braille o línea braille.
 *  3. GUÍA DE REGLETA Y PUNZÓN: el documento celda por celda, ya
 *     invertido en espejo y en orden de marcado, para que cualquier
 *     persona voluntaria lo transcriba a mano con una regleta de
 *     10 dólares, sin saber braille.
 *
 * Los PDFs e imágenes se procesan DENTRO del dispositivo (pdf.js y
 * Tesseract.js), igual que en el portal OCR: nada viaja a un servidor.
 */
(function () {
  'use strict';

  var CDN_TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  var CDN_PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  var CDN_PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  function anunciar(mensaje) {
    document.getElementById('estado-convertir').textContent = mensaje;
  }

  function cargarLibreria(url, presente) {
    if (presente()) return Promise.resolve();
    return new Promise(function (resolver, rechazar) {
      var s = document.createElement('script');
      s.src = url;
      s.onload = resolver;
      s.onerror = function () { rechazar(new Error('No se pudo descargar la herramienta. Se necesita internet la primera vez; después queda guardada.')); };
      document.head.appendChild(s);
    });
  }

  /* --------------------- extracción de texto ------------------------ */

  function extraerDeImagen(fuente, alProgresar) {
    return window.Tesseract.recognize(fuente, 'spa', {
      logger: function (m) {
        if (m.status === 'recognizing text' && alProgresar) alProgresar(m.progress);
      }
    }).then(function (r) { return r.data.text || ''; });
  }

  function extraerDePdf(archivo, barra) {
    return archivo.arrayBuffer().then(function (buffer) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_PDFJS_WORKER;
      return window.pdfjsLib.getDocument({ data: buffer }).promise;
    }).then(function (pdf) {
      // Primero se intenta el texto digital del PDF (rápido y exacto).
      var total = Math.min(pdf.numPages, 30);
      var cadena = Promise.resolve('');
      for (var n = 1; n <= total; n++) {
        (function (num) {
          cadena = cadena.then(function (acumulado) {
            return pdf.getPage(num).then(function (pagina) {
              return pagina.getTextContent().then(function (contenido) {
                var textoPagina = contenido.items.map(function (i) { return i.str; }).join(' ');
                return acumulado + '\n\n' + textoPagina;
              });
            });
          });
        }(n));
      }
      return cadena.then(function (textoDigital) {
        if (textoDigital.replace(/\s+/g, '').length > 40) return textoDigital;
        // PDF escaneado (solo imagen): se pasa cada página por OCR.
        anunciar('El PDF es una imagen escaneada. Leyéndolo con reconocimiento óptico, página por página.');
        return cargarLibreria(CDN_TESSERACT, function () { return !!window.Tesseract; }).then(function () {
          var textos = [];
          var cadenaOcr = Promise.resolve();
          for (var n2 = 1; n2 <= total; n2++) {
            (function (num) {
              cadenaOcr = cadenaOcr.then(function () {
                return pdf.getPage(num).then(function (pagina) {
                  var vista = pagina.getViewport({ scale: 2 });
                  var lienzo = document.createElement('canvas');
                  lienzo.width = vista.width;
                  lienzo.height = vista.height;
                  return pagina.render({ canvasContext: lienzo.getContext('2d'), viewport: vista }).promise
                    .then(function () {
                      anunciar('Leyendo la página ' + num + ' de ' + total + '.');
                      return extraerDeImagen(lienzo, function (p) { barra.value = (num - 1 + p) / total; });
                    })
                    .then(function (t) { textos.push(t); });
                });
              });
            }(n2));
          }
          return cadenaOcr.then(function () { return textos.join('\n\n'); });
        });
      });
    });
  }

  function extraerDeArchivo(archivo) {
    var barra = document.getElementById('progreso-convertir');
    barra.hidden = false;
    barra.value = 0;
    var nombre = archivo.name.toLowerCase();

    if (/\.(txt|md)$/.test(nombre) || archivo.type === 'text/plain') {
      return archivo.text();
    }
    if (/\.pdf$/.test(nombre) || archivo.type === 'application/pdf') {
      anunciar('Abriendo el PDF dentro de su dispositivo.');
      return cargarLibreria(CDN_PDFJS, function () { return !!window.pdfjsLib; })
        .then(function () { return extraerDePdf(archivo, barra); });
    }
    anunciar('Leyendo la imagen con reconocimiento óptico, dentro de su dispositivo.');
    return cargarLibreria(CDN_TESSERACT, function () { return !!window.Tesseract; })
      .then(function () { return extraerDeImagen(archivo, function (p) { barra.value = p; }); });
  }

  /* --------------------------- conversión --------------------------- */

  function obtenerTitulo() {
    return document.getElementById('titulo-braille').value.trim() || 'Documento';
  }

  function obtenerTextoLimpio() {
    var crudo = document.getElementById('texto-convertir').value.trim();
    if (!crudo) return '';
    // El middleware expande abreviaturas y corrige lenguaje con @ y x:
    // así el braille resultante dice "Artículo" y no "Art.".
    return window.JopoiTexto.procesar(crudo);
  }

  function celdasElegidas() {
    return parseInt(document.getElementById('celdas-linea').value, 10) || 28;
  }

  function convertir() {
    var texto = obtenerTextoLimpio();
    if (!texto) {
      anunciar('Escriba, dicte o suba primero el texto que quiere convertir.');
      return;
    }
    var resultado = window.JopoiBraille.traducir(texto);
    var lineas = window.JopoiBraille.envolverEnLineas(resultado.ascii, celdasElegidas());

    var zona = document.getElementById('resultado-braille');
    zona.hidden = false;

    var puntosTotales = resultado.ascii.replace(/ /g, '').length;
    document.getElementById('resumen-braille').textContent =
      'Conversión lista: ' + lineas.length + ' líneas de ' + celdasElegidas() +
      ' celdas, ' + puntosTotales + ' celdas con puntos en total. ' +
      'Signografía braille española grado 1, la que se enseña en Bolivia.';

    // Vista de lectura en pantalla, línea por línea.
    var vista = document.getElementById('vista-braille');
    vista.innerHTML = '';
    lineas.forEach(function (lineaAscii) {
      var p = document.createElement('p');
      p.className = 'braille-muestra';
      p.textContent = window.JopoiBraille.traducir('').unicode +
        lineaAsciiAUnicode(lineaAscii);
      vista.appendChild(p);
    });

    zona.querySelector('h2').focus();
  }

  // Convierte una línea Braille ASCII a Unicode usando el propio motor.
  var ASCII_INVERSO = null;
  function lineaAsciiAUnicode(lineaAscii) {
    if (!ASCII_INVERSO) {
      ASCII_INVERSO = {};
      // Se reconstruye desde el motor: cada carácter imprimible ASCII
      // braille corresponde a un patrón conocido de puntos.
      var muestra = ' Aabcdefghijklmnopqrstuvwxyz0123456789áéíóúüñ.,;:¿!()-';
      for (var i = 0; i < muestra.length; i++) {
        var r = window.JopoiBraille.traducir(muestra[i]);
        var celdasAscii = r.ascii.split('');
        var celdasUni = Array.from(r.unicode);
        for (var j = 0; j < celdasAscii.length; j++) ASCII_INVERSO[celdasAscii[j]] = celdasUni[j];
      }
      ASCII_INVERSO[' '] = '⠀';
    }
    return lineaAscii.split('').map(function (c) {
      return ASCII_INVERSO[c] !== undefined ? ASCII_INVERSO[c] : '⠀';
    }).join('');
  }

  /* ---------------------------- arranque ---------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('archivo-convertir').addEventListener('change', function (e) {
      var archivo = e.target.files && e.target.files[0];
      if (!archivo) return;
      extraerDeArchivo(archivo).then(function (texto) {
        document.getElementById('progreso-convertir').hidden = true;
        var limpio = (texto || '').replace(/-\n(?=[a-záéíóúñ])/g, '').trim();
        if (!limpio) {
          anunciar('No se encontró texto en el archivo. Pruebe con un escaneo más nítido.');
          return;
        }
        document.getElementById('texto-convertir').value = limpio;
        if (!document.getElementById('titulo-braille').value) {
          document.getElementById('titulo-braille').value = archivo.name.replace(/\.[^.]+$/, '');
        }
        anunciar('Texto extraído del archivo. Revíselo y pulse "Convertir a braille".');
      }).catch(function (err) {
        document.getElementById('progreso-convertir').hidden = true;
        anunciar('Ocurrió un problema: ' + err.message);
      });
    });

    document.getElementById('btn-convertir').addEventListener('click', convertir);

    document.getElementById('btn-escuchar-original').addEventListener('click', function () {
      if (window.JopoiVoz.estaHablando()) {
        window.JopoiVoz.detener();
        anunciar('Voz detenida.');
        return;
      }
      var texto = obtenerTextoLimpio();
      if (!texto) {
        anunciar('Escriba, dicte o suba primero el texto que quiere escuchar.');
        return;
      }
      if (!window.JopoiVoz.disponible) {
        anunciar('Este navegador no tiene síntesis de voz. Pruebe con Chrome o Edge actualizados.');
        return;
      }
      anunciar('Leyendo el texto en voz alta. Pulse este mismo botón otra vez para detener la voz.');
      window.JopoiVoz.hablar(texto);
    });

    document.getElementById('btn-descargar-brf').addEventListener('click', function () {
      var texto = obtenerTextoLimpio();
      if (!texto) { anunciar('Primero convierta un texto.'); return; }
      window.JopoiBraille.descargarBRF(obtenerTitulo(), texto,
        obtenerTitulo().toLowerCase().replace(/[^a-z0-9]+/g, '_'));
      anunciar('Archivo punto BRF descargado: sirve para impresora braille y para línea braille. Página de 40 celdas por 25 líneas.');
    });

    document.getElementById('btn-descargar-guia').addEventListener('click', function () {
      var texto = obtenerTextoLimpio();
      if (!texto) { anunciar('Primero convierta un texto.'); return; }
      window.JopoiBraille.descargarGuiaRegleta(obtenerTitulo(), texto, celdasElegidas(),
        'guia_regleta_' + obtenerTitulo().toLowerCase().replace(/[^a-z0-9]+/g, '_'));
      anunciar('Guía de regleta descargada: cada celda ya está invertida en espejo y en orden de marcado. Cualquier persona puede transcribirla con regleta y punzón sin saber braille.');
    });

    document.getElementById('btn-ver-guia').addEventListener('click', function () {
      var texto = obtenerTextoLimpio();
      if (!texto) { anunciar('Primero convierta un texto.'); return; }
      var zona = document.getElementById('guia-en-pantalla');
      zona.hidden = false;
      zona.querySelector('pre').textContent =
        window.JopoiBraille.generarGuiaRegleta(obtenerTitulo(), texto, celdasElegidas());
      anunciar('Guía de regleta visible al final de la página. También puede imprimirla con Control más P.');
      zona.querySelector('h2').focus();
    });
  });
}());
