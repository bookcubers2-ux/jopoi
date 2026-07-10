/**
 * JOPÓI | Motor Braille
 * ---------------------
 * Convierte texto en español a braille grado 1 (integral) y exporta
 * archivos .BRF (Braille Ready Format): el estándar que aceptan las
 * impresoras braille (embossers) y las líneas braille de todo el mundo.
 *
 * Especificación BRF: páginas de 40 celdas por línea y 25 líneas,
 * codificadas en Braille ASCII norteamericano, con salto de página
 * mediante el carácter Form Feed. Fuente: Library of Congress, fdd000551.
 *
 * Signografía: braille español grado 1 según la tradición de la ONCE y
 * la Comisión Braille Española (vocales acentuadas, ñ, ü, signos de
 * apertura de interrogación y exclamación).
 *
 * Sin dependencias. Funciona en navegador y en Node (para pruebas).
 */
(function (raiz) {
  'use strict';

  var CELDAS_POR_LINEA = 40;
  var LINEAS_POR_PAGINA = 25;

  /* ------------------------------------------------------------------ */
  /* Tabla Braille ASCII: patrón de puntos -> carácter ASCII             */
  /* (North American Braille ASCII Code)                                 */
  /* ------------------------------------------------------------------ */
  var PUNTOS_A_ASCII = {
    '': ' ',
    '1': 'A', '12': 'B', '14': 'C', '145': 'D', '15': 'E', '124': 'F',
    '1245': 'G', '125': 'H', '24': 'I', '245': 'J', '13': 'K', '123': 'L',
    '134': 'M', '1345': 'N', '135': 'O', '1234': 'P', '12345': 'Q',
    '1235': 'R', '234': 'S', '2345': 'T', '136': 'U', '1236': 'V',
    '2456': 'W', '1346': 'X', '13456': 'Y', '1356': 'Z',
    '2': '1', '23': '2', '25': '3', '256': '4', '26': '5', '235': '6',
    '2356': '7', '236': '8', '35': '9', '356': '0',
    '3': "'", '4': '@', '5': '"', '6': ',', '16': '*', '34': '/',
    '345': '>', '346': '+', '36': '-', '45': '^', '46': '.', '56': ';',
    '126': '<', '146': '%', '156': ':', '246': '[', '1246': '$',
    '1256': '\\', '12346': '&', '12356': '(', '1456': '?', '12456': ']',
    '2346': '!', '23456': ')', '3456': '#', '123456': '=', '456': '_'
  };

  /* ------------------------------------------------------------------ */
  /* Signografía española grado 1: carácter -> patrón de puntos          */
  /* ------------------------------------------------------------------ */
  var LETRAS = {
    a: '1', b: '12', c: '14', d: '145', e: '15', f: '124', g: '1245',
    h: '125', i: '24', j: '245', k: '13', l: '123', m: '134', n: '1345',
    o: '135', p: '1234', q: '12345', r: '1235', s: '234', t: '2345',
    u: '136', v: '1236', w: '2456', x: '1346', y: '13456', z: '1356',
    'á': '12356', 'é': '2346', 'í': '34', 'ó': '346', 'ú': '23456',
    'ü': '1256', 'ñ': '12456'
  };

  var PUNTUACION = {
    ',': '2', ';': '23', ':': '25', '.': '3', '¿': '26', '?': '26',
    '¡': '235', '!': '235', '"': '236', '«': '236', '»': '236',
    '(': '126', ')': '345', '-': '36', '–': '36',
    "'": '3', '*': '35',
    '/': '456-34', '@': '5-1', '%': '456-356', '&': '456-12346',
    '+': '235', '=': '2356', '$': '456-234'
  };

  var DIGITOS = { '1': '1', '2': '12', '3': '14', '4': '145', '5': '15',
    '6': '124', '7': '1245', '8': '125', '9': '24', '0': '245' };

  var SIGNO_NUMERO = '3456';     // antecede a toda cifra
  var SIGNO_MAYUSCULA = '46';    // signo de mayúscula en braille español

  function puntosAAscii(puntos) {
    return PUNTOS_A_ASCII[puntos] !== undefined ? PUNTOS_A_ASCII[puntos] : '?';
  }

  function puntosAUnicode(puntos) {
    // Convierte "1245" a su carácter braille Unicode (U+2800 + bits).
    var bits = 0;
    for (var i = 0; i < puntos.length; i++) bits |= 1 << (parseInt(puntos[i], 10) - 1);
    return String.fromCharCode(0x2800 + bits);
  }

  /**
   * Traduce texto español a una lista de patrones de puntos.
   * Devuelve { ascii: 'Braille ASCII', unicode: '⠃⠗⠁⠊⠇⠇⠑' }.
   */
  function traducir(texto) {
    var ascii = '', unicode = '';
    var enNumero = false;
    var t = String(texto || '');

    function emitir(puntos) {
      // Un mismo símbolo puede requerir varias celdas ("456-34").
      puntos.split('-').forEach(function (p) {
        ascii += puntosAAscii(p);
        unicode += puntosAUnicode(p);
      });
    }

    for (var i = 0; i < t.length; i++) {
      var c = t[i];
      var bajo = c.toLowerCase();

      if (/\s/.test(c)) { emitir(''); enNumero = false; continue; }

      if (DIGITOS[c] !== undefined) {
        if (!enNumero) { emitir(SIGNO_NUMERO); enNumero = true; }
        emitir(DIGITOS[c]);
        continue;
      }
      // El punto y la coma dentro de una cifra (1.500) no cortan el número.
      if (enNumero && (c === '.' || c === ',') && DIGITOS[t[i + 1]] !== undefined) {
        emitir(PUNTUACION[c]);
        continue;
      }
      enNumero = false;

      if (LETRAS[bajo] !== undefined) {
        if (c !== bajo) emitir(SIGNO_MAYUSCULA);
        emitir(LETRAS[bajo]);
        continue;
      }
      if (PUNTUACION[c] !== undefined) { emitir(PUNTUACION[c]); continue; }
      // Carácter desconocido: se sustituye por espacio para no
      // introducir celdas erróneas en la impresión.
      emitir('');
    }
    return { ascii: ascii, unicode: unicode };
  }

  /**
   * Ajusta el Braille ASCII a líneas de 40 celdas sin cortar palabras
   * y arma páginas de 25 líneas separadas por Form Feed.
   */
  function formatearBRF(brailleAscii) {
    var palabras = brailleAscii.split(' ');
    var lineas = [];
    var linea = '';
    palabras.forEach(function (palabra) {
      while (palabra.length > CELDAS_POR_LINEA) {
        // Palabra más larga que la línea: corte duro inevitable.
        if (linea) { lineas.push(linea); linea = ''; }
        lineas.push(palabra.slice(0, CELDAS_POR_LINEA));
        palabra = palabra.slice(CELDAS_POR_LINEA);
      }
      if (!linea) { linea = palabra; }
      else if (linea.length + 1 + palabra.length <= CELDAS_POR_LINEA) {
        linea += ' ' + palabra;
      } else {
        lineas.push(linea);
        linea = palabra;
      }
    });
    if (linea) lineas.push(linea);

    var paginas = [];
    for (var i = 0; i < lineas.length; i += LINEAS_POR_PAGINA) {
      paginas.push(lineas.slice(i, i + LINEAS_POR_PAGINA).join('\r\n'));
    }
    return paginas.join('\r\n\f') + '\r\n';
  }

  /**
   * Genera el contenido completo de un archivo .brf a partir de texto
   * en español (título + cuerpo).
   */
  function generarBRF(titulo, cuerpo) {
    var encabezado = titulo ? traducir(titulo).ascii + ' ' : '';
    var contenido = traducir(cuerpo).ascii;
    return formatearBRF(encabezado + contenido);
  }

  /** Descarga un .brf desde el navegador. */
  function descargarBRF(titulo, cuerpo, nombreArchivo) {
    var brf = generarBRF(titulo, cuerpo);
    var blob = new Blob([brf], { type: 'text/plain;charset=us-ascii' });
    var url = URL.createObjectURL(blob);
    var enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = (nombreArchivo || 'documento') + '.brf';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  }

  /* ------------------------------------------------------------------ */
  /* MODO REGLETA Y PUNZÓN (guía de transcripción manual)                */
  /* ------------------------------------------------------------------ */
  // Con la regleta se escribe por el REVERSO del papel, de modo que al
  // darlo vuelta los puntos queden en el orden correcto de lectura.
  // Eso obliga a escribir cada celda en espejo horizontal:
  // el punto 1 pasa a ser el 4, el 2 el 5, el 3 el 6, y viceversa.
  var ESPEJO_PUNTO = { '1': '4', '2': '5', '3': '6', '4': '1', '5': '2', '6': '3' };

  // Tabla inversa: carácter Braille ASCII -> patrón de puntos.
  var ASCII_A_PUNTOS = {};
  Object.keys(PUNTOS_A_ASCII).forEach(function (puntos) {
    ASCII_A_PUNTOS[PUNTOS_A_ASCII[puntos]] = puntos;
  });

  function espejarPuntos(puntos) {
    return puntos.split('').map(function (p) { return ESPEJO_PUNTO[p]; })
      .sort().join('');
  }

  /** Envuelve Braille ASCII en líneas de N celdas sin cortar palabras. */
  function envolverEnLineas(brailleAscii, celdasPorLinea) {
    var limite = celdasPorLinea || CELDAS_POR_LINEA;
    var lineas = [];
    var linea = '';
    brailleAscii.split(' ').forEach(function (palabra) {
      while (palabra.length > limite) {
        if (linea) { lineas.push(linea); linea = ''; }
        lineas.push(palabra.slice(0, limite));
        palabra = palabra.slice(limite);
      }
      if (!linea) { linea = palabra; }
      else if (linea.length + 1 + palabra.length <= limite) { linea += ' ' + palabra; }
      else { lineas.push(linea); linea = palabra; }
    });
    if (linea) lineas.push(linea);
    return lineas;
  }

  function puntosLegibles(puntos) {
    return puntos ? 'puntos ' + puntos.split('').join('-') : 'celda vacía (espacio)';
  }

  /**
   * Genera la guía completa de transcripción con regleta y punzón.
   * Para cada línea entrega: la vista de LECTURA (como quedará el papel
   * al darlo vuelta) y la secuencia de ESCRITURA (celdas en el orden en
   * que se marcan, con los puntos ya convertidos al espejo).
   * @param {string} titulo
   * @param {string} texto
   * @param {number} celdasPorLinea  28 = regleta de bolsillo estándar
   * @returns {string} guía en texto plano lista para imprimir o leer
   */
  function generarGuiaRegleta(titulo, texto, celdasPorLinea) {
    var celdas = celdasPorLinea || 28;
    var ascii = traducir((titulo ? titulo + '. ' : '') + texto).ascii;
    var lineas = envolverEnLineas(ascii, celdas);
    var salida = [];

    salida.push('GUÍA DE TRANSCRIPCIÓN A BRAILLE CON REGLETA Y PUNZÓN');
    salida.push('Documento: ' + (titulo || 'sin título'));
    salida.push('Signografía: braille español grado 1 (la usada en Bolivia).');
    salida.push('Celdas por línea: ' + celdas + '. Total de líneas: ' + lineas.length + '.');
    salida.push('');
    salida.push('CÓMO USAR ESTA GUÍA (no necesita saber braille):');
    salida.push('1. Coloque el papel en la regleta y empiece por la celda de la DERECHA de cada fila, avanzando hacia la izquierda.');
    salida.push('2. En cada celda, marque con el punzón los puntos que indica la lista de ESCRITURA. Los números ya están convertidos al espejo: márquelos tal cual.');
    salida.push('3. Posiciones de los puntos en la celda de la regleta, tal como usted la ve: 1 arriba a la izquierda, 2 al medio a la izquierda, 3 abajo a la izquierda, 4 arriba a la derecha, 5 al medio a la derecha, 6 abajo a la derecha.');
    salida.push('4. Al terminar, retire el papel y dele la vuelta: los puntos quedarán en relieve y se leerán como muestra la vista de LECTURA.');
    salida.push('5. Use papel grueso, de 120 gramos o más.');
    salida.push('');

    lineas.forEach(function (linea, numero) {
      var patrones = linea.split('').map(function (c) {
        return ASCII_A_PUNTOS[c] !== undefined ? ASCII_A_PUNTOS[c] : '';
      });
      var unicodeLectura = patrones.map(function (p) { return puntosAUnicode(p); }).join('');

      salida.push('LÍNEA ' + (numero + 1));
      salida.push('Lectura (así quedará al dar vuelta el papel): ' + unicodeLectura);
      salida.push('Escritura (celdas en el orden de marcado, de derecha a izquierda de la regleta):');
      patrones.slice().reverse().forEach(function (puntos, i) {
        salida.push('  Celda ' + (i + 1) + ': ' + puntosLegibles(espejarPuntos(puntos)));
      });
      salida.push('');
    });

    salida.push('Fin de la guía. Generada por la plataforma JOPÓI (jopoi, palabra guaraní: intercambio recíproco).');
    return salida.join('\r\n');
  }

  /** Descarga la guía de regleta como archivo de texto. */
  function descargarGuiaRegleta(titulo, texto, celdasPorLinea, nombreArchivo) {
    var guia = generarGuiaRegleta(titulo, texto, celdasPorLinea);
    var blob = new Blob(['﻿' + guia], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = (nombreArchivo || 'guia_regleta') + '.txt';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  }

  var API = {
    traducir: traducir,
    generarBRF: generarBRF,
    formatearBRF: formatearBRF,
    descargarBRF: typeof document !== 'undefined' ? descargarBRF : null,
    espejarPuntos: espejarPuntos,
    envolverEnLineas: envolverEnLineas,
    generarGuiaRegleta: generarGuiaRegleta,
    descargarGuiaRegleta: typeof document !== 'undefined' ? descargarGuiaRegleta : null,
    CELDAS_POR_LINEA: CELDAS_POR_LINEA,
    LINEAS_POR_PAGINA: LINEAS_POR_PAGINA
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  raiz.JopoiBraille = API;
}(typeof window !== 'undefined' ? window : globalThis));
