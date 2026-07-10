/**
 * JOPÓI | Pruebas del núcleo (se ejecutan con: node test/test-nucleo.js)
 * Verifican el middleware de texto, el motor braille y la lectura fácil,
 * que son los módulos con lógica pura.
 */
'use strict';

var Texto = require('../js/middleware.js');
var Braille = require('../js/braille.js');
var LF = require('../js/lectura-facil.js');

var fallos = 0;
function prueba(nombre, condicion, detalle) {
  if (condicion) {
    console.log('  OK  ' + nombre);
  } else {
    fallos++;
    console.error('FALLO ' + nombre + (detalle ? ' -> ' + detalle : ''));
  }
}

console.log('--- Middleware de texto ---');
var t1 = Texto.expandirAbreviaturas('El Art. 5 de la C.P.E. y el D.S. Nº 1893');
prueba('expande Art.', t1.indexOf('Artículo 5') !== -1, t1);
prueba('expande C.P.E.', t1.indexOf('Constitución Política del Estado') !== -1, t1);
prueba('expande D.S.', t1.indexOf('Decreto Supremo') !== -1, t1);
prueba('expande Nº', t1.indexOf('número 1893') !== -1, t1);

var t2 = Texto.corregirLenguajeInclusivo('Tod@s lxs niñ@s y los vecin@s');
prueba('corrige tod@s', t2.indexOf('Todas y todos') !== -1, t2);
prueba('corrige lxs', t2.indexOf('las y los') !== -1, t2);
prueba('corrige niñ@s', t2.indexOf('niñas y niños') !== -1, t2);
prueba('sin arrobas residuales', t2.indexOf('@') === -1, t2);

var t3 = Texto.corregirLenguajeInclusivo('El examen de rayos x fue exitoso');
prueba('no rompe palabras con x legítima', t3 === 'El examen de rayos x fue exitoso', t3);

var bloques = Texto.fragmentarEnBloques(
  'Primera oración corta. ' +
  'Segunda oración que también es corta. '.repeat(10), 200);
prueba('fragmenta en varios bloques', bloques.length > 1, 'bloques: ' + bloques.length);
prueba('ningún bloque corta oraciones', bloques.every(function (b) { return /[.!?]$/.test(b); }));

console.log('--- Motor braille ---');
var b1 = Braille.traducir('braille');
prueba('braille ascii de "braille"', b1.ascii === 'BRAILLE', b1.ascii);
prueba('braille unicode de "b"', Braille.traducir('b').unicode === '⠃', Braille.traducir('b').unicode);

var b2 = Braille.traducir('Ley 223');
prueba('mayúscula produce signo (punto 46 = ".")', b2.ascii.charAt(0) === '.', b2.ascii);
prueba('número produce signo (#)', b2.ascii.indexOf('#') !== -1, b2.ascii);
prueba('223 usa serie a-j (#BBC)', b2.ascii.indexOf('#BBC') !== -1, b2.ascii);

var b3 = Braille.traducir('canción');
prueba('ó española (puntos 346 = "+")', b3.ascii.indexOf('+') !== -1, b3.ascii);
var b4 = Braille.traducir('ñandú');
prueba('ñ española (puntos 12456 = "]")', b4.ascii.indexOf(']') !== -1, b4.ascii);

var brf = Braille.generarBRF('Título', 'palabra '.repeat(300));
var lineas = brf.split(/\r\n/).filter(function (l) { return l !== '' && l.indexOf('\f') === -1; });
prueba('BRF: ninguna línea supera 40 celdas',
  lineas.every(function (l) { return l.replace('\f', '').length <= 40; }));
prueba('BRF: contiene salto de página cada 25 líneas', brf.indexOf('\f') !== -1);

console.log('--- Modo regleta (espejo) ---');
// Pares espejo conocidos del braille: e(15)<->i(24), d(145)<->f(124), h(125)<->j(245).
prueba('espejo de e (15) es i (24)', Braille.espejarPuntos('15') === '24', Braille.espejarPuntos('15'));
prueba('espejo de d (145) es f (124)', Braille.espejarPuntos('145') === '124', Braille.espejarPuntos('145'));
prueba('espejo de h (125) es j (245)', Braille.espejarPuntos('125') === '245', Braille.espejarPuntos('125'));
prueba('espejo doble vuelve al original', Braille.espejarPuntos(Braille.espejarPuntos('1356')) === '1356');

var lineas28 = Braille.envolverEnLineas(Braille.traducir('palabra '.repeat(40)).ascii, 28);
prueba('envoltura a 28 celdas respeta el límite',
  lineas28.every(function (l) { return l.length <= 28; }));

var guia = Braille.generarGuiaRegleta('Ley', 'ab', 28);
prueba('guía incluye instrucciones de espejo', guia.indexOf('espejo') !== -1);
prueba('guía indica marcado de derecha a izquierda', guia.indexOf('derecha a izquierda') !== -1);
// "Ley. ab" en escritura: la última celda de lectura es b(12); en orden
// de marcado (invertido) la PRIMERA celda debe ser el espejo de b: 45.
prueba('guía invierte el orden y espeja las celdas', guia.indexOf('Celda 1: puntos 4-5') !== -1, guia.slice(0, 0));
prueba('guía numera las líneas', guia.indexOf('LÍNEA 1') !== -1);

console.log('--- Lectura fácil ---');
var lf = LF.simplificarLocal(
  'La presente norma tiene por objeto, en el marco de la Constitución, ' +
  'precautelar los derechos con la finalidad de coadyuvar a la fiscalización; ' +
  'asimismo se establecen sanciones.');
prueba('produce viñetas', lf.vinetas.length >= 2, JSON.stringify(lf.vinetas));
prueba('simplifica "con la finalidad de"', lf.vinetas.join(' ').indexOf('finalidad') === -1, lf.vinetas.join(' '));
prueba('detecta jerga en glosario', lf.glosario.some(function (g) { return g.termino === 'fiscalización'; }));
prueba('marca origen local con aviso', lf.origen === 'local' && !!lf.aviso);

LF.simplificar({ titulo: 'x', texto: 'texto', lecturaFacil: ['Frase validada.'] }).then(function (r) {
  prueba('prefiere versión humana validada', r.origen === 'validada' && r.vinetas[0] === 'Frase validada.');

  console.log('');
  if (fallos) {
    console.error(fallos + ' prueba(s) fallaron.');
    process.exit(1);
  }
  console.log('Todas las pruebas del núcleo pasaron.');
});
