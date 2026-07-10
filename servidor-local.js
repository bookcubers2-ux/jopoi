// JOPÓI | Servidor local de pruebas (sin dependencias)
// Uso: node servidor-local.js   ->  http://localhost:8080
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, 'plataforma');
const PUERTO = 8080;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8'
};
http.createServer((req, res) => {
  let ruta = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const archivo = path.normalize(path.join(RAIZ, ruta));
  if (!archivo.startsWith(RAIZ)) { res.writeHead(403); res.end(); return; }
  fs.readFile(archivo, (e, datos) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('No encontrado'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(archivo).toLowerCase()] || 'application/octet-stream' });
    res.end(datos);
  });
}).listen(PUERTO, () => console.log('JOPÓI corriendo en http://localhost:' + PUERTO));
