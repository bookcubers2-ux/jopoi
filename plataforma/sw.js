/**
 * JOPÓI | Service Worker: funcionamiento sin conexión
 * ---------------------------------------------------
 * - Los archivos de la plataforma se guardan al instalar (precarga).
 * - Los datos legislativos usan "red primero, caché de respaldo":
 *   con internet se ven las leyes nuevas; sin internet, las guardadas.
 * - Las herramientas pesadas (OCR) y los pictogramas de ARASAAC se
 *   guardan la primera vez que se usan y quedan disponibles offline.
 */
'use strict';

var VERSION = 'jopoi-v5';
var PRECARGA = [
  'index.html', 'documento.html', 'ocr.html', 'convertir.html', 'propuestas.html',
  'ajustes.html', 'acerca.html',
  'css/jopoi.css',
  'js/config.js', 'js/middleware.js', 'js/braille.js', 'js/lectura-facil.js',
  'js/tts.js', 'js/stt.js', 'js/pictogramas.js', 'js/a11y.js', 'js/instalar.js',
  'js/feed.js', 'js/documento.js', 'js/ocr.js', 'js/convertir.js', 'js/propuestas.js', 'js/ajustes.js',
  'data/leyes.json',
  'img/icono.svg', 'img/icono-maskable.svg',
  'img/icono-192.png', 'img/icono-512.png', 'img/icono-maskable-512.png', 'img/apple-touch-icon.png',
  'manifest.webmanifest'
];

self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(VERSION).then(function (cache) { return cache.addAll(PRECARGA); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.filter(function (c) { return c !== VERSION; })
        .map(function (c) { return caches.delete(c); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (evento) {
  var url = new URL(evento.request.url);
  if (evento.request.method !== 'GET') return;

  // Datos legislativos: red primero, caché de respaldo.
  if (url.pathname.indexOf('/data/') !== -1) {
    evento.respondWith(
      fetch(evento.request).then(function (respuesta) {
        var copia = respuesta.clone();
        caches.open(VERSION).then(function (cache) { cache.put(evento.request, copia); });
        return respuesta;
      }).catch(function () { return caches.match(evento.request); })
    );
    return;
  }

  // Archivos de la propia plataforma: RED PRIMERO, caché de respaldo.
  // Así toda actualización del código llega de inmediato y la caché
  // solo entra en acción cuando no hay conexión.
  if (url.origin === self.location.origin) {
    evento.respondWith(
      fetch(evento.request).then(function (respuesta) {
        if (respuesta && respuesta.status === 200) {
          var copia = respuesta.clone();
          caches.open(VERSION).then(function (cache) { cache.put(evento.request, copia); });
        }
        return respuesta;
      }).catch(function () { return caches.match(evento.request); })
    );
    return;
  }

  // Recursos externos (CDN de OCR, ARASAAC, fuentes): caché primero,
  // porque no cambian y así quedan disponibles sin conexión.
  evento.respondWith(
    caches.match(evento.request).then(function (guardado) {
      if (guardado) return guardado;
      return fetch(evento.request).then(function (respuesta) {
        if (respuesta && respuesta.status === 200 &&
            (respuesta.type === 'basic' || respuesta.type === 'cors')) {
          var copia = respuesta.clone();
          caches.open(VERSION).then(function (cache) { cache.put(evento.request, copia); });
        }
        return respuesta;
      });
    })
  );
});
