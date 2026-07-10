/**
 * JOPÓI | Apoyo Visual Contextual (pictogramas)
 * ---------------------------------------------
 * Ancla el significado de los textos simplificados con pictogramas.
 * Estrategia de dos capas:
 *  1. SIN CONEXIÓN (siempre funciona): banco local de pictogramas SVG
 *     de dos tintas (verde oscuro y blanco) dibujados aquí mismo.
 *  2. CON CONEXIÓN: pictogramas de ARASAAC (arasaac.org), el banco
 *     mundial de más de 12.500 pictogramas de comunicación aumentativa,
 *     con licencia gratuita CC BY-NC-SA. El service worker los guarda
 *     en caché para que la próxima vez también existan sin internet.
 */
(function () {
  'use strict';

  /* Banco local: clave temática -> SVG accesible de dos tintas. */
  var TRAZOS = {
    ley: '<path d="M12 3 4 7v2h16V7l-8-4zM6 11v6H4v3h16v-3h-2v-6h-3v6h-2v-6h-2v6H9v-6H6z"/>',
    votar: '<path d="M18 13h-.7l2.1-2.1a1 1 0 0 0 0-1.4L13 3.1a1 1 0 0 0-1.4 0L6.2 8.5a1 1 0 0 0 0 1.4l3.1 3.1H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2zm-5.7-7.8 4.5 4.5-3.5 3.3H11l-3-3 4.3-4.8zM18 19H6v-4h12v4z"/>',
    arbol: '<path d="M12 2 6 10h3l-4 6h6v4h2v-4h6l-4-6h3L12 2z"/>',
    agua: '<path d="M12 2s-6 7-6 12a6 6 0 0 0 12 0c0-5-6-12-6-12zm0 16a4 4 0 0 1-4-4c0-.5.1-1 .3-1.6L12 6.7l3.7 5.7c.2.6.3 1.1.3 1.6a4 4 0 0 1-4 4z"/>',
    educacion: '<path d="M12 3 1 9l11 6 9-4.9V17h2V9L12 3zM5 13.2V17c0 1.7 3.1 3 7 3s7-1.3 7-3v-3.8l-7 3.8-7-3.8z"/>',
    salud: '<path d="M10 3v7H3v4h7v7h4v-7h7v-4h-7V3h-4z"/>',
    dinero: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-1.1c-1.5-.3-2.7-1.2-2.8-2.9h2c.1.8.7 1.2 1.8 1.2 1 0 1.6-.4 1.6-1.1 0-.6-.4-.9-1.9-1.3-1.6-.4-3.2-1-3.2-2.9 0-1.4 1-2.4 2.5-2.7V5h2v1.2c1.4.3 2.4 1.2 2.5 2.7h-2c-.1-.7-.6-1.1-1.5-1.1-.9 0-1.5.4-1.5 1 0 .6.5.9 2 1.3 1.7.4 3.1 1 3.1 2.9 0 1.5-1 2.5-2.6 2.8V17z"/>',
    transporte: '<path d="M4 5a2 2 0 0 0-2 2v8h1a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h1V9l-3-4H4zm12 2h2.5L20 9.5H16V7zM6 16.5A1.5 1.5 0 1 1 7.5 15 1.5 1.5 0 0 1 6 16.5zm12 0a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z"/>',
    casa: '<path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>',
    trabajo: '<path d="M10 4a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4V6a2 2 0 0 0-2-2h-4zm0 2h4v1h-4V6z"/>',
    personas: '<path d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM8 13c-2.7 0-6 1.3-6 4v2h12v-2c0-2.7-3.3-4-6-4zm8 0c-.3 0-.7 0-1 .1a5.4 5.4 0 0 1 3 4.9v2h6v-2c0-2.7-3.3-5-8-5z"/>',
    hablar: '<path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>',
    documento: '<path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z"/>',
    joven: '<path d="M12 2a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 10c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5z"/>',
    justicia: '<path d="M12 2v2H6l-3 6a3.5 3.5 0 0 0 7 0L7.5 5H11v14H7v2h10v-2h-4V5h3.5L14 10a3.5 3.5 0 0 0 7 0l-3-6h-6V2h-2z"/>',
    internet: '<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm7.4 9h-3a15.6 15.6 0 0 0-1.2-5.3A8 8 0 0 1 19.4 11zM12 4a13.8 13.8 0 0 1 2.4 7H9.6A13.8 13.8 0 0 1 12 4zM4.6 13h3a15.6 15.6 0 0 0 1.2 5.3A8 8 0 0 1 4.6 13zm4.2-2h-3a8 8 0 0 1 4.2-5.3A15.6 15.6 0 0 0 8.8 11zM12 20a13.8 13.8 0 0 1-2.4-7h4.8A13.8 13.8 0 0 1 12 20zm3.2-1.7A15.6 15.6 0 0 0 16.4 13h3a8 8 0 0 1-4.2 5.3z"/>',
    accesibilidad: '<path d="M12 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2zm9 7h-6v11a1 1 0 0 1-2 0v-5h-2v5a1 1 0 0 1-2 0V9H3a1 1 0 0 1 0-2h18a1 1 0 0 1 0 2z"/>'
  };

  /* Sinónimos: palabra del texto -> clave del banco local. */
  var SINONIMOS = {
    ley: 'ley', leyes: 'ley', norma: 'ley', decreto: 'ley', asamblea: 'ley', parlamento: 'ley',
    votar: 'votar', voto: 'votar', eleccion: 'votar', elecciones: 'votar', democracia: 'votar',
    arbol: 'arbol', arboles: 'arbol', bosque: 'arbol', tala: 'arbol', forestal: 'arbol', 'medio ambiente': 'arbol', ambiental: 'arbol',
    agua: 'agua', rio: 'agua', rios: 'agua', sequia: 'agua',
    educacion: 'educacion', escuela: 'educacion', colegio: 'educacion', universidad: 'educacion', beca: 'educacion', becas: 'educacion',
    salud: 'salud', hospital: 'salud', medico: 'salud', medicina: 'salud',
    dinero: 'dinero', presupuesto: 'dinero', impuesto: 'dinero', impuestos: 'dinero', economico: 'dinero', financiamiento: 'dinero',
    transporte: 'transporte', micro: 'transporte', bus: 'transporte', carretera: 'transporte', camino: 'transporte',
    casa: 'casa', vivienda: 'casa', hogar: 'casa',
    trabajo: 'trabajo', empleo: 'trabajo', laboral: 'trabajo',
    personas: 'personas', comunidad: 'personas', poblacion: 'personas', sociedad: 'personas', ciudadania: 'personas',
    hablar: 'hablar', consulta: 'hablar', participacion: 'hablar', opinion: 'hablar', propuesta: 'hablar',
    documento: 'documento', tramite: 'documento', registro: 'documento',
    joven: 'joven', jovenes: 'joven', juventud: 'joven', juventudes: 'joven',
    justicia: 'justicia', derecho: 'justicia', derechos: 'justicia', tribunal: 'justicia',
    internet: 'internet', digital: 'internet', tecnologia: 'internet', web: 'internet',
    accesibilidad: 'accesibilidad', discapacidad: 'accesibilidad', inclusion: 'accesibilidad', braille: 'accesibilidad'
  };

  function normalizar(palabra) {
    return String(palabra || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  /** Crea el elemento <figure> de un pictograma local accesible. */
  function crearPictogramaLocal(clave, etiqueta) {
    var figura = document.createElement('figure');
    figura.className = 'pictograma';
    figura.innerHTML =
      '<svg viewBox="0 0 24 24" role="img" aria-label="Pictograma: ' + etiqueta + '">' +
      '<title>' + etiqueta + '</title>' + TRAZOS[clave] + '</svg>' +
      '<figcaption>' + etiqueta + '</figcaption>';
    figura.title = 'Pictograma: ' + etiqueta;
    return figura;
  }

  /**
   * Devuelve pictogramas locales para un texto: detecta hasta `maximo`
   * temas presentes y crea sus figuras. Nunca requiere internet.
   */
  function paraTexto(texto, maximo) {
    var limite = maximo || 4;
    var bajo = normalizar(texto);
    var usados = {};
    var figuras = [];
    Object.keys(SINONIMOS).forEach(function (palabra) {
      if (figuras.length >= limite) return;
      var clave = SINONIMOS[palabra];
      if (usados[clave]) return;
      var regex = new RegExp('\\b' + palabra.replace(/\s+/g, '\\s+') + '\\b');
      if (regex.test(bajo)) {
        usados[clave] = true;
        figuras.push(crearPictogramaLocal(clave, palabra.charAt(0).toUpperCase() + palabra.slice(1)));
      }
    });
    return figuras;
  }

  /**
   * Búsqueda en ARASAAC (solo con conexión). Devuelve una promesa con
   * elementos <figure> que usan las imágenes oficiales; el service
   * worker las cachea para verlas después sin internet.
   */
  function buscarArasaac(termino, maximo) {
    var config = window.JOPOI_CONFIG || {};
    if (!navigator.onLine || !config.arasaacApi) return Promise.resolve([]);
    var url = config.arasaacApi + '/es/search/' + encodeURIComponent(termino);
    return fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('sin resultados'); return r.json(); })
      .then(function (lista) {
        return (lista || []).slice(0, maximo || 3).map(function (picto) {
          var figura = document.createElement('figure');
          figura.className = 'pictograma';
          var descripcion = (picto.keywords && picto.keywords[0] && picto.keywords[0].keyword) || termino;
          figura.innerHTML =
            '<img src="' + config.arasaacImagen + '/' + picto._id + '/' + picto._id + '_300.png"' +
            ' alt="Pictograma de ARASAAC: ' + descripcion + '" loading="lazy">' +
            '<figcaption>' + descripcion + '</figcaption>';
          figura.title = 'Pictograma de ARASAAC: ' + descripcion;
          return figura;
        });
      })
      .catch(function () { return []; });
  }

  window.JopoiPictogramas = {
    paraTexto: paraTexto,
    buscarArasaac: buscarArasaac,
    crearPictogramaLocal: crearPictogramaLocal
  };
}());
