/**
 * JOPÓI | Middleware de Procesamiento Dinámico de Texto
 * -----------------------------------------------------
 * Todo texto que entra a la plataforma (feed, OCR, base de datos)
 * pasa por este filtro ANTES de llegar al lector de pantalla,
 * al motor de voz (TTS) o al motor braille.
 *
 * 1. Expande abreviaturas para que el lector de voz no deletree.
 * 2. Reemplaza lenguaje con caracteres especiales (tod@s, lxs)
 *    por dobletes explícitos que los lectores de pantalla sí pronuncian.
 * 3. Fragmenta texto largo en bloques cortos con pausas semánticas
 *    (estructura para personas neurodivergentes).
 *
 * Sin dependencias. Funciona en navegador y en Node (para pruebas).
 */
(function (raiz) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 1. EXPANSIÓN DE ABREVIATURAS                                        */
  /* ------------------------------------------------------------------ */
  // Orden importa: las siglas compuestas van antes que las simples.
  var ABREVIATURAS = [
    // Siglas jurídicas e institucionales bolivianas
    [/\bC\.?\s?P\.?\s?E\.?(?=[\s,;:.)\]]|$)/g, 'Constitución Política del Estado'],
    [/\bA\.?L\.?D\.?(?=[\s,;:.)\]]|$)/g, 'Asamblea Legislativa Departamental'],
    [/\bD\.?\s?S\.?\s(?=N|n|\d)/g, 'Decreto Supremo '],
    [/\bR\.?\s?M\.?\s(?=N|n|\d)/g, 'Resolución Ministerial '],
    [/\bG\.?A\.?M\.?(?=[\s,;:.)\]]|$)/g, 'Gobierno Autónomo Municipal'],
    [/\bG\.?A\.?D\.?(?=[\s,;:.)\]]|$)/g, 'Gobierno Autónomo Departamental'],
    // Abreviaturas de redacción legislativa
    [/\bArts?\.\s*/g, function (m) { return m.indexOf('Arts') === 0 ? 'Artículos ' : 'Artículo '; }],
    [/\bart\.\s*/g, 'artículo '],
    [/\bInc\.\s*/g, 'Inciso '],
    [/\binc\.\s*/g, 'inciso '],
    [/\bNum\.\s*/g, 'Numeral '],
    [/\bnum\.\s*/g, 'numeral '],
    [/\bCap\.\s*/g, 'Capítulo '],
    [/\bcap\.\s*/g, 'capítulo '],
    [/\bTít\.\s*/g, 'Título '],
    [/\bPárr\.\s*/g, 'Párrafo '],
    [/\bpárr\.\s*/g, 'párrafo '],
    [/\bDisp\.\s*/g, 'Disposición '],
    [/\bN[°º]\s*/g, 'número '],
    [/\bNro\.\s*/g, 'número '],
    [/\bnúm\.\s*/g, 'número '],
    [/\bpágs?\.\s*/g, function (m) { return m.indexOf('págs') === 0 ? 'páginas ' : 'página '; }],
    // Tratamientos y uso general
    [/\bSres\.\s*/g, 'Señores '],
    [/\bSras\.\s*/g, 'Señoras '],
    [/\bSr\.\s*/g, 'Señor '],
    [/\bSra\.\s*/g, 'Señora '],
    [/\bDr\.\s*/g, 'Doctor '],
    [/\bDra\.\s*/g, 'Doctora '],
    [/\betc\.(?=[\s,;:.)\]]|$)/g, 'etcétera'],
    [/\bp\.\s?ej\.\s*/g, 'por ejemplo '],
    [/\bUd\.\s*/g, 'Usted '],
    [/\bUds\.\s*/g, 'Ustedes ']
  ];

  function expandirAbreviaturas(texto) {
    if (!texto) return '';
    var salida = String(texto);
    for (var i = 0; i < ABREVIATURAS.length; i++) {
      salida = salida.replace(ABREVIATURAS[i][0], ABREVIATURAS[i][1]);
    }
    return salida;
  }

  /* ------------------------------------------------------------------ */
  /* 2. LENGUAJE INCLUSIVO SIN CARACTERES ESPECIALES                     */
  /* ------------------------------------------------------------------ */
  // La arroba, la equis y la "e" neutra rompen los lectores de pantalla
  // ("tod@s" se lee "tod arroba ese"). Se reemplazan por dobletes
  // explícitos que sí se pronuncian con naturalidad.
  var INCLUSIVO_DICCIONARIO = {
    'tod@s': 'todas y todos', 'todxs': 'todas y todos', 'todes': 'todas y todos',
    'l@s': 'las y los', 'lxs': 'las y los', 'les ciudadanes': 'las ciudadanas y los ciudadanos',
    'niñ@s': 'niñas y niños', 'niñxs': 'niñas y niños', 'niñes': 'niñas y niños',
    'ciudadan@s': 'ciudadanas y ciudadanos', 'ciudadanxs': 'ciudadanas y ciudadanos',
    'compañer@s': 'compañeras y compañeros', 'compañerxs': 'compañeras y compañeros',
    'amig@s': 'amigas y amigos', 'amigxs': 'amigas y amigos',
    'vecin@s': 'vecinas y vecinos', 'vecinxs': 'vecinas y vecinos',
    'diputad@s': 'diputadas y diputados', 'diputadxs': 'diputadas y diputados',
    'asambleíst@s': 'asambleístas', 'jóvenes trabajador@s': 'jóvenes trabajadoras y trabajadores',
    'trabajador@s': 'trabajadoras y trabajadores', 'trabajadorxs': 'trabajadoras y trabajadores',
    'un@': 'una o uno', 'unx': 'una o uno',
    'ell@s': 'ellas y ellos', 'ellxs': 'ellas y ellos', 'elles': 'ellas y ellos'
  };

  // Patrón genérico de respaldo: palabra terminada en @ o @s, x o xs.
  var INCLUSIVO_GENERICO = /\b([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,})[@ｘx](s?)\b/g;

  function corregirLenguajeInclusivo(texto) {
    if (!texto) return '';
    var salida = String(texto);
    // Primero el diccionario (insensible a mayúsculas, conserva inicial).
    Object.keys(INCLUSIVO_DICCIONARIO).forEach(function (clave) {
      var regex = new RegExp(clave.replace('@', '@'), 'gi');
      salida = salida.replace(regex, function (coincidencia) {
        var reemplazo = INCLUSIVO_DICCIONARIO[clave.toLowerCase()] || INCLUSIVO_DICCIONARIO[clave];
        if (coincidencia[0] === coincidencia[0].toUpperCase()) {
          return reemplazo[0].toUpperCase() + reemplazo.slice(1);
        }
        return reemplazo;
      });
    });
    // Luego el patrón genérico: "vocer@s" que no esté en el diccionario
    // se convierte en doblete femenino y masculino ("voceras y voceros").
    salida = salida.replace(INCLUSIVO_GENERICO, function (coincidencia, base, plural) {
      // Solo actuar si realmente contenía @ o una x final sospechosa.
      if (coincidencia.indexOf('@') === -1) return coincidencia; // evita falsos positivos con x
      var fem = base + 'a' + (plural ? 's' : '');
      var masc = base + 'o' + (plural ? 's' : '');
      return fem + ' y ' + masc;
    });
    return salida;
  }

  /* ------------------------------------------------------------------ */
  /* 3. FRAGMENTACIÓN EN BLOQUES (estructura neurodivergente)            */
  /* ------------------------------------------------------------------ */
  // Divide texto largo en bloques cortos. Reglas:
  // - Nunca corta a mitad de oración.
  // - Máximo aproximado de caracteres por bloque (por defecto 320).
  // - Los párrafos originales siempre inician bloque nuevo.
  function fragmentarEnBloques(texto, maxCaracteres) {
    if (!texto) return [];
    var limite = maxCaracteres || 320;
    var parrafos = String(texto).split(/\n\s*\n|\n(?=[A-ZÁÉÍÓÚÑ])/);
    var bloques = [];
    parrafos.forEach(function (parrafo) {
      var limpio = parrafo.replace(/\s+/g, ' ').trim();
      if (!limpio) return;
      if (limpio.length <= limite) { bloques.push(limpio); return; }
      // Separar por oraciones respetando abreviaturas ya expandidas.
      var oraciones = limpio.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [limpio];
      var actual = '';
      oraciones.forEach(function (oracion) {
        if ((actual + oracion).length > limite && actual) {
          bloques.push(actual.trim());
          actual = '';
        }
        actual += oracion;
      });
      if (actual.trim()) bloques.push(actual.trim());
    });
    return bloques;
  }

  /* ------------------------------------------------------------------ */
  /* TUBERÍA COMPLETA                                                     */
  /* ------------------------------------------------------------------ */
  function procesar(texto) {
    return corregirLenguajeInclusivo(expandirAbreviaturas(texto));
  }

  function procesarEnBloques(texto, maxCaracteres) {
    return fragmentarEnBloques(procesar(texto), maxCaracteres);
  }

  var API = {
    expandirAbreviaturas: expandirAbreviaturas,
    corregirLenguajeInclusivo: corregirLenguajeInclusivo,
    fragmentarEnBloques: fragmentarEnBloques,
    procesar: procesar,
    procesarEnBloques: procesarEnBloques
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  raiz.JopoiTexto = API;
}(typeof window !== 'undefined' ? window : globalThis));
