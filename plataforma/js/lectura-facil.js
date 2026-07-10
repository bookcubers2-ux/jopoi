/**
 * JOPÓI | Motor de Lectura Fácil (Modo Simplificado)
 * --------------------------------------------------
 * Sigue las pautas de la norma UNE 153101:2018 EX (primera norma técnica
 * mundial de Lectura Fácil): oraciones cortas, una idea por oración,
 * palabras frecuentes, glosario de términos difíciles, viñetas.
 *
 * Tres niveles de calidad, en este orden de preferencia:
 *  1. VERSIÓN VALIDADA: si el documento trae "lecturaFacil" redactada y
 *     validada por personas con discapacidad intelectual (lo que exige
 *     la norma UNE), se muestra esa. La máquina nunca reemplaza la
 *     validación humana.
 *  2. API DE IA (opcional): si el administrador configuró un endpoint
 *     en config.js (por ejemplo una función serverless que llama a la
 *     API de Claude), se pide la simplificación ahí.
 *  3. MOTOR LOCAL DE RESPALDO (offline): reglas deterministas que
 *     acortan oraciones y explican jerga legal con el glosario cívico.
 *     Siempre disponible, incluso sin internet.
 *
 * Sin dependencias. Funciona en navegador y en Node (para pruebas).
 */
(function (raiz) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* GLOSARIO CÍVICO: jerga legal -> explicación en palabras comunes     */
  /* ------------------------------------------------------------------ */
  var GLOSARIO = {
    'promulgar': 'publicar de forma oficial para que sea ley',
    'promulgación': 'publicación oficial de una ley',
    'derogar': 'eliminar una ley que existía',
    'derogatoria': 'que elimina una ley anterior',
    'abrogar': 'eliminar una ley completa',
    'sancionar': 'aprobar de forma definitiva',
    'fiscalizar': 'vigilar y controlar el trabajo de las autoridades',
    'fiscalización': 'vigilancia del trabajo de las autoridades',
    'legislar': 'crear leyes',
    'normativa': 'conjunto de reglas y leyes',
    'jurisdicción': 'territorio donde una autoridad puede actuar',
    'competencia': 'poder legal para decidir sobre un tema',
    'reglamentación': 'reglas detalladas para aplicar una ley',
    'partida presupuestaria': 'dinero reservado para un gasto específico',
    'presupuesto': 'plan de gastos e ingresos',
    'erario': 'dinero público',
    'interpelar': 'llamar a una autoridad para que explique sus actos',
    'quórum': 'cantidad mínima de personas para poder votar',
    'plenaria': 'reunión de todas las personas de la asamblea',
    'comisión': 'grupo pequeño que estudia un tema',
    'dictamen': 'opinión oficial escrita',
    'vigencia': 'tiempo en que una ley funciona y se aplica',
    'disposición transitoria': 'regla temporal mientras la ley empieza a funcionar',
    'inciso': 'parte pequeña de un artículo',
    'accesibilidad': 'que todas las personas puedan usar algo sin barreras',
    'ajustes razonables': 'cambios necesarios para que una persona con discapacidad participe en igualdad',
    'equiparación de oportunidades': 'dar a cada persona lo que necesita para participar en igualdad'
  };

  /* ------------------------------------------------------------------ */
  /* MOTOR LOCAL DE RESPALDO                                             */
  /* ------------------------------------------------------------------ */
  // Conectores largos que separan ideas: se convierten en punto y aparte.
  var CORTES = [
    /;\s+/g,
    /,\s+(?=y que\b|así como\b|además\b|por lo que\b|en cuyo caso\b)/g,
    /\s+(?=con el objeto de\b|con la finalidad de\b|a efectos de\b|en el marco de\b)/g
  ];

  var REEMPLAZOS_SIMPLES = [
    [/\bcon el objeto de\b/gi, 'para'],
    [/\bcon la finalidad de\b/gi, 'para'],
    [/\ba efectos de\b/gi, 'para'],
    [/\ben el marco de\b/gi, 'según'],
    [/\bde conformidad con\b/gi, 'según'],
    [/\ben virtud de\b/gi, 'por'],
    [/\bno obstante\b/gi, 'pero'],
    [/\basimismo\b/gi, 'también'],
    [/\bpor consiguiente\b/gi, 'por eso'],
    [/\ben consecuencia\b/gi, 'por eso'],
    [/\befectuar\b/gi, 'hacer'],
    [/\bimplementar\b/gi, 'poner en marcha'],
    [/\bcoadyuvar\b/gi, 'ayudar'],
    [/\bprecautelar\b/gi, 'proteger'],
    [/\bremitir\b/gi, 'enviar'],
    [/\bsuscribir\b/gi, 'firmar']
  ];

  function detectarTerminosDificiles(texto) {
    var encontrados = [];
    var bajo = String(texto || '').toLowerCase();
    Object.keys(GLOSARIO).forEach(function (termino) {
      if (bajo.indexOf(termino) !== -1) {
        encontrados.push({ termino: termino, explicacion: GLOSARIO[termino] });
      }
    });
    return encontrados;
  }

  /**
   * Simplificación local (respaldo offline). Devuelve
   * { vinetas: [...], glosario: [{termino, explicacion}] }.
   */
  function simplificarLocal(texto) {
    var t = String(texto || '').replace(/\s+/g, ' ').trim();
    REEMPLAZOS_SIMPLES.forEach(function (par) { t = t.replace(par[0], par[1]); });
    CORTES.forEach(function (regex) { t = t.replace(regex, '. '); });

    var oraciones = t.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [t];
    var vinetas = oraciones
      .map(function (o) { return o.trim(); })
      .filter(function (o) { return o.length > 2; })
      .map(function (o) {
        // Una idea por viñeta, con mayúscula inicial y punto final.
        var limpia = o.charAt(0).toUpperCase() + o.slice(1);
        if (!/[.!?]$/.test(limpia)) limpia += '.';
        return limpia;
      });

    return {
      origen: 'local',
      aviso: 'Resumen automático de apoyo. La versión validada con personas usuarias es la que tiene valor de Lectura Fácil según la norma UNE 153101.',
      vinetas: vinetas,
      glosario: detectarTerminosDificiles(texto)
    };
  }

  /**
   * Punto de entrada principal.
   * @param {object} documento  { titulo, texto, lecturaFacil? }
   * @returns {Promise<{origen, vinetas, glosario, aviso?}>}
   */
  function simplificar(documento) {
    // 1. Versión humana validada incluida en los datos.
    if (documento && Array.isArray(documento.lecturaFacil) && documento.lecturaFacil.length) {
      return Promise.resolve({
        origen: 'validada',
        vinetas: documento.lecturaFacil,
        glosario: detectarTerminosDificiles(documento.texto)
      });
    }
    // 2. API externa configurada (opcional).
    var config = raiz.JOPOI_CONFIG || {};
    if (config.apiLecturaFacil && typeof fetch !== 'undefined' &&
        typeof navigator !== 'undefined' && navigator.onLine) {
      return fetch(config.apiLecturaFacil, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: documento.titulo, texto: documento.texto })
      })
        .then(function (r) { if (!r.ok) throw new Error('API no disponible'); return r.json(); })
        .then(function (json) {
          return {
            origen: 'api',
            aviso: 'Resumen generado con inteligencia artificial. Pendiente de validación humana.',
            vinetas: json.vinetas || [],
            glosario: detectarTerminosDificiles(documento.texto)
          };
        })
        .catch(function () { return simplificarLocal(documento.texto); });
    }
    // 3. Motor local, siempre disponible.
    return Promise.resolve(simplificarLocal(documento.texto));
  }

  var API = {
    simplificar: simplificar,
    simplificarLocal: simplificarLocal,
    detectarTerminosDificiles: detectarTerminosDificiles,
    GLOSARIO: GLOSARIO
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  raiz.JopoiLecturaFacil = API;
}(typeof window !== 'undefined' ? window : globalThis));
