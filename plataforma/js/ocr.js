/**
 * JOPÓI | Portal OCR para documentos públicos inaccesibles
 * --------------------------------------------------------
 * Las instituciones suelen publicar leyes como PDF escaneado (imagen),
 * invisible para lectores de pantalla. Aquí la ciudadanía sube el
 * archivo y el texto se extrae CON TESSERACT.JS EN EL PROPIO
 * NAVEGADOR: el documento nunca sale del dispositivo de la persona
 * (soberanía y privacidad) y no hay costo por API.
 *
 * PDF: se dibuja cada página con pdf.js y se pasa al OCR.
 * Imagen (foto de una gaceta, captura): va directo al OCR.
 * El texto extraído pasa por el middleware y se abre en el lector
 * accesible (documento.html?origen=ocr) con voz, braille y todo.
 */
(function () {
  'use strict';

  var CDN_TESSERACT = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  var CDN_PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
  var CDN_PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

  function cargarLibreria(url, presente) {
    if (presente()) return Promise.resolve();
    return new Promise(function (resolver, rechazar) {
      var s = document.createElement('script');
      s.src = url;
      s.onload = resolver;
      s.onerror = function () { rechazar(new Error('No se pudo descargar la herramienta. Se necesita conexión a internet la primera vez; después queda guardada.')); };
      document.head.appendChild(s);
    });
  }

  function anunciar(texto) {
    document.getElementById('estado-ocr').textContent = texto;
  }

  function ocrImagen(fuente, alProgresar) {
    return window.Tesseract.recognize(fuente, 'spa', {
      logger: function (m) {
        if (m.status === 'recognizing text' && alProgresar) alProgresar(m.progress);
      }
    }).then(function (r) { return r.data.text || ''; });
  }

  function pdfAImagenes(archivo) {
    return archivo.arrayBuffer().then(function (buffer) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_PDFJS_WORKER;
      return window.pdfjsLib.getDocument({ data: buffer }).promise;
    }).then(function (pdf) {
      var paginas = [];
      var cadena = Promise.resolve();
      var total = Math.min(pdf.numPages, 30); // límite prudente por memoria
      for (var n = 1; n <= total; n++) {
        (function (num) {
          cadena = cadena.then(function () {
            return pdf.getPage(num).then(function (pagina) {
              var vista = pagina.getViewport({ scale: 2 });
              var lienzo = document.createElement('canvas');
              lienzo.width = vista.width;
              lienzo.height = vista.height;
              return pagina.render({ canvasContext: lienzo.getContext('2d'), viewport: vista })
                .promise.then(function () { paginas.push(lienzo); });
            });
          });
        }(n));
      }
      return cadena.then(function () { return paginas; });
    });
  }

  function procesarArchivo(archivo) {
    var barra = document.getElementById('progreso-ocr');
    var esPdf = /\.pdf$/i.test(archivo.name) || archivo.type === 'application/pdf';
    barra.hidden = false;
    barra.value = 0;
    anunciar('Preparando las herramientas de lectura. Esto puede tardar un momento la primera vez.');

    var listas = esPdf
      ? Promise.all([
          cargarLibreria(CDN_TESSERACT, function () { return !!window.Tesseract; }),
          cargarLibreria(CDN_PDFJS, function () { return !!window.pdfjsLib; })
        ])
      : cargarLibreria(CDN_TESSERACT, function () { return !!window.Tesseract; });

    return listas.then(function () {
      if (!esPdf) {
        anunciar('Leyendo la imagen. El documento no sale de su dispositivo.');
        return ocrImagen(archivo, function (p) { barra.value = p; }).then(function (t) { return [t]; });
      }
      anunciar('Convirtiendo el PDF en imágenes para poder leerlo.');
      return pdfAImagenes(archivo).then(function (lienzos) {
        var textos = [];
        var cadena = Promise.resolve();
        lienzos.forEach(function (lienzo, i) {
          cadena = cadena.then(function () {
            anunciar('Leyendo la página ' + (i + 1) + ' de ' + lienzos.length + '.');
            return ocrImagen(lienzo, function (p) {
              barra.value = (i + p) / lienzos.length;
            }).then(function (t) { textos.push(t); });
          });
        });
        return cadena.then(function () { return textos; });
      });
    }).then(function (textos) {
      barra.hidden = true;
      var crudo = textos.join('\n\n').replace(/-\n(?=[a-záéíóúñ])/g, '').trim();
      if (!crudo) {
        anunciar('No se pudo encontrar texto en el archivo. Pruebe con una foto más nítida o un escaneo más claro.');
        return;
      }
      var limpio = window.JopoiTexto.procesar(crudo);
      var zona = document.getElementById('resultado-ocr');
      zona.hidden = false;
      document.getElementById('texto-ocr').value = limpio;
      sessionStorage.setItem('jopoi_ocr_texto', limpio);
      sessionStorage.setItem('jopoi_ocr_titulo', 'Documento digitalizado: ' + archivo.name);
      anunciar('Listo. El texto fue extraído y limpiado. Puede revisarlo, escucharlo o abrirlo en el lector accesible.');
      zona.querySelector('h2').focus();
    }).catch(function (e) {
      barra.hidden = true;
      anunciar('Ocurrió un problema: ' + e.message);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var entrada = document.getElementById('archivo-ocr');
    entrada.addEventListener('change', function () {
      if (entrada.files && entrada.files[0]) procesarArchivo(entrada.files[0]);
    });
    document.getElementById('btn-escuchar-ocr').addEventListener('click', function () {
      window.JopoiVoz.hablar(document.getElementById('texto-ocr').value);
    });
    document.getElementById('btn-abrir-lector').addEventListener('click', function () {
      sessionStorage.setItem('jopoi_ocr_texto', document.getElementById('texto-ocr').value);
      location.href = 'documento.html?origen=ocr';
    });
    document.getElementById('btn-brf-ocr').addEventListener('click', function () {
      window.JopoiBraille.descargarBRF(
        sessionStorage.getItem('jopoi_ocr_titulo') || 'Documento digitalizado',
        document.getElementById('texto-ocr').value,
        'documento_digitalizado'
      );
    });
  });
}());
