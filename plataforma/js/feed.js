/**
 * JOPÓI | Feed Legislativo Departamental
 * --------------------------------------
 * Lista cronológica de leyes y proyectos. Los datos viven en
 * data/leyes.json (editable por cada instancia) y se guardan en
 * localStorage para funcionar sin conexión.
 */
(function () {
  'use strict';

  var CACHE_CLAVE = 'jopoi_leyes_cache';

  function cargarLeyes() {
    return fetch('data/leyes.json')
      .then(function (r) { if (!r.ok) throw new Error('sin datos'); return r.json(); })
      .then(function (json) {
        localStorage.setItem(CACHE_CLAVE, JSON.stringify(json));
        return json;
      })
      .catch(function () {
        var cache = localStorage.getItem(CACHE_CLAVE);
        if (cache) return JSON.parse(cache);
        throw new Error('No hay datos disponibles ni en caché.');
      });
  }

  function fechaLegible(iso) {
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var partes = String(iso).split('-');
    if (partes.length < 3) return iso;
    return parseInt(partes[2], 10) + ' de ' + meses[parseInt(partes[1], 10) - 1] + ' de ' + partes[0];
  }

  function pintarFeed(leyes, filtro) {
    var lista = document.getElementById('lista-feed');
    var estado = document.getElementById('estado-feed');
    if (!lista) return;
    lista.innerHTML = '';

    var visibles = leyes.filter(function (ley) {
      if (!filtro) return true;
      var texto = (ley.titulo + ' ' + ley.resumen + ' ' + (ley.temas || []).join(' ')).toLowerCase();
      return texto.indexOf(filtro.toLowerCase()) !== -1;
    });

    visibles.sort(function (a, b) { return a.fecha < b.fecha ? 1 : -1; });

    estado.textContent = visibles.length === 0
      ? 'No se encontraron documentos con esa búsqueda.'
      : 'Mostrando ' + visibles.length + ' documento' + (visibles.length === 1 ? '' : 's') + ', del más reciente al más antiguo.';

    visibles.forEach(function (ley) {
      var li = document.createElement('li');
      var vigente = ley.estado === 'vigente';
      li.innerHTML =
        '<article class="tarjeta-ley">' +
        '<h3><a href="documento.html?id=' + encodeURIComponent(ley.id) + '">' + ley.titulo + '</a></h3>' +
        '<p class="meta-ley">' +
        '<span class="etiqueta-estado' + (vigente ? ' vigente' : '') + '">' +
        (vigente ? 'Ley vigente' : 'Proyecto en debate') + '</span> ' +
        ley.tipo + '. Fecha: ' + fechaLegible(ley.fecha) + '.' +
        (ley.demo ? ' Documento de demostración.' : '') +
        '</p>' +
        '<p>' + window.JopoiTexto.procesar(ley.resumen) + '</p>' +
        '</article>';
      lista.appendChild(li);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var estado = document.getElementById('estado-feed');
    cargarLeyes().then(function (leyes) {
      pintarFeed(leyes, '');
      var buscador = document.getElementById('buscador');
      if (buscador) {
        buscador.addEventListener('input', function () {
          pintarFeed(leyes, buscador.value.trim());
        });
      }
    }).catch(function (e) {
      if (estado) estado.textContent = e.message;
    });
  });
}());
