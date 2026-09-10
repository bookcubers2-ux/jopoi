/**
 * JOPÓI | Escuela Cívica: motor pedagógico accesible
 * --------------------------------------------------
 * Metodología ESCUCHE, EXPLORE, PRACTIQUE, DEMUESTRE.
 *
 * Principios de diseño (no son decoración, son la razón del código):
 *  1. CERO CASTIGO. Un error nunca resta puntos ni bloquea el avance.
 *     Se puede reintentar siempre. La retroalimentación explica el
 *     porqué, no solo dice "incorrecto". Base: accesibilidad cognitiva
 *     (W3C COGA, objetivo 4: evitar que la persona se sienta fracasada).
 *  2. SIN ARRASTRAR. Ninguna actividad usa arrastrar y soltar, que es
 *     inaccesible para lector de pantalla y para motricidad reducida.
 *     Ordenar se hace con botones "subir" y "bajar".
 *  3. TODO SE ANUNCIA. Cada resultado, cada avance y cada insignia se
 *     comunica por texto en una región aria-live, no solo por color.
 *  4. EL PROGRESO ES DE LA PERSONA. Se guarda en su dispositivo
 *     (localStorage). No hay cuentas, no hay servidor, no hay
 *     vigilancia de su desempeño.
 *  5. RITMO PROPIO. Una lección por pantalla, sin cronómetros, sin
 *     rachas que presionen, sin nada que se mueva solo.
 */
(function () {
  'use strict';

  var CLAVE_PROGRESO = 'jopoi_escuela_progreso';
  var cursos = [];
  var progreso = null;
  var estadoVista = { cursoId: null, leccionIdx: 0 };

  /* ------------------------------------------------------------------ */
  /* PROGRESO (en el dispositivo de la persona)                          */
  /* ------------------------------------------------------------------ */
  function progresoVacio() {
    return { puntos: 0, lecciones: {}, actividades: {}, insignias: [], nombre: '' };
  }

  function leerProgreso() {
    try {
      var g = JSON.parse(localStorage.getItem(CLAVE_PROGRESO) || 'null');
      if (!g || typeof g !== 'object') return progresoVacio();
      return Object.assign(progresoVacio(), g);
    } catch (e) { return progresoVacio(); }
  }

  function guardarProgreso() {
    try { localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(progreso)); }
    catch (e) { /* modo incógnito: la sesión funciona igual, sin recordar */ }
  }

  function sumarPuntos(cantidad, motivo) {
    progreso.puntos += cantidad;
    guardarProgreso();
    anunciar('Ganó ' + cantidad + ' puntos por ' + motivo + '. Ahora tiene ' +
      progreso.puntos + ' puntos en total.');
    pintarMarcador();
  }

  /* ------------------------------------------------------------------ */
  /* UTILIDADES                                                          */
  /* ------------------------------------------------------------------ */
  function anunciar(texto) {
    var e = document.getElementById('estado-escuela');
    if (e) e.textContent = texto;
  }

  function limpio(texto) {
    return window.JopoiTexto ? window.JopoiTexto.procesar(texto) : texto;
  }

  function crear(etiqueta, clase, texto) {
    var el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function curso(id) {
    for (var i = 0; i < cursos.length; i++) if (cursos[i].id === id) return cursos[i];
    return null;
  }

  function leccionesHechas(c) {
    var n = 0;
    c.lecciones.forEach(function (l) { if (progreso.lecciones[l.id]) n++; });
    return n;
  }

  function cursoCompleto(c) {
    return leccionesHechas(c) === c.lecciones.length;
  }

  function totalLecciones() {
    return cursos.reduce(function (s, c) { return s + c.lecciones.length; }, 0);
  }

  function totalHechas() {
    return cursos.reduce(function (s, c) { return s + leccionesHechas(c); }, 0);
  }

  /* ------------------------------------------------------------------ */
  /* MARCADOR (puntos, avance, insignias)                                */
  /* ------------------------------------------------------------------ */
  function pintarMarcador() {
    var zona = document.getElementById('marcador-escuela');
    if (!zona) return;
    var hechas = totalHechas(), total = totalLecciones();
    zona.innerHTML = '';

    var resumen = crear('p', 'marcador-cifras');
    resumen.innerHTML = '<strong>' + progreso.puntos + ' puntos.</strong> ' +
      'Lecciones terminadas: ' + hechas + ' de ' + total + '.';
    zona.appendChild(resumen);

    // Barra de avance con valores reales para el lector de pantalla.
    var barra = crear('div', 'barra-avance');
    barra.setAttribute('role', 'progressbar');
    barra.setAttribute('aria-valuenow', String(hechas));
    barra.setAttribute('aria-valuemin', '0');
    barra.setAttribute('aria-valuemax', String(total));
    barra.setAttribute('aria-label', 'Avance en la Escuela Cívica: ' + hechas + ' de ' + total + ' lecciones');
    var relleno = crear('div', 'barra-avance-relleno');
    relleno.style.width = (total ? Math.round((hechas / total) * 100) : 0) + '%';
    barra.appendChild(relleno);
    zona.appendChild(barra);

    if (progreso.insignias.length) {
      var lista = crear('ul', 'lista-insignias');
      lista.setAttribute('aria-label', 'Insignias ganadas');
      progreso.insignias.forEach(function (id) {
        var c = curso(id);
        if (c) lista.appendChild(crear('li', 'insignia', 'Insignia: ' + c.insignia));
      });
      zona.appendChild(lista);
    }
  }

  /* ------------------------------------------------------------------ */
  /* VISTA 1: LISTA DE CURSOS                                            */
  /* ------------------------------------------------------------------ */
  function pintarCursos() {
    estadoVista.cursoId = null;
    var zona = document.getElementById('zona-escuela');
    zona.innerHTML = '';

    var titulo = crear('h2', null, 'Los cursos');
    titulo.id = 'titulo-vista';
    titulo.setAttribute('tabindex', '-1');
    zona.appendChild(titulo);
    zona.appendChild(crear('p', null,
      'Son cuatro cursos. Puede hacerlos en el orden que quiera y a su propio ritmo. Su avance se guarda solo en este dispositivo.'));

    var lista = crear('ol', 'lista-cursos');
    cursos.forEach(function (c, i) {
      var li = crear('li');
      var tarjeta = crear('article', 'tarjeta-curso');

      var h3 = crear('h3');
      var boton = crear('button', null, 'Curso ' + (i + 1) + '. ' + c.titulo);
      boton.type = 'button';
      boton.addEventListener('click', function () { pintarCurso(c.id); });
      h3.appendChild(boton);
      tarjeta.appendChild(h3);

      tarjeta.appendChild(crear('p', null, c.resumen));

      var hechas = leccionesHechas(c);
      var estado = cursoCompleto(c)
        ? 'Curso terminado. Ganó la insignia: ' + c.insignia + '.'
        : (hechas > 0
          ? 'En camino: ' + hechas + ' de ' + c.lecciones.length + ' lecciones terminadas.'
          : 'Sin empezar. Tiene ' + c.lecciones.length + ' lecciones.');
      tarjeta.appendChild(crear('p', 'estado-curso', estado));

      li.appendChild(tarjeta);
      lista.appendChild(li);
    });
    zona.appendChild(lista);

    // Certificado: solo cuando termina todo.
    var seccionCert = crear('section', 'panel-certificado');
    if (totalHechas() === totalLecciones() && totalLecciones() > 0) {
      seccionCert.appendChild(crear('h3', null, 'Su certificado está listo'));
      seccionCert.appendChild(crear('p', null,
        'Usted terminó los cuatro cursos de la Escuela Cívica JOPÓI. Escriba su nombre y descargue su certificado.'));
      var etiqueta = crear('label', null, 'Su nombre completo, como quiere que aparezca en el certificado');
      etiqueta.setAttribute('for', 'campo-nombre-certificado');
      seccionCert.appendChild(etiqueta);
      var campo = crear('input');
      campo.type = 'text';
      campo.id = 'campo-nombre-certificado';
      campo.value = progreso.nombre || '';
      seccionCert.appendChild(campo);

      var acciones = crear('div', 'acciones-documento');
      acciones.setAttribute('role', 'group');
      acciones.setAttribute('aria-label', 'Descargar el certificado');

      var btnTexto = crear('button', null, 'Descargar mi certificado en texto');
      btnTexto.type = 'button';
      btnTexto.addEventListener('click', function () { descargarCertificado('texto'); });
      acciones.appendChild(btnTexto);

      var btnBraille = crear('button', 'secundario', 'Descargar mi certificado en braille (punto BRF)');
      btnBraille.type = 'button';
      btnBraille.addEventListener('click', function () { descargarCertificado('braille'); });
      acciones.appendChild(btnBraille);

      var btnEscuchar = crear('button', 'secundario', 'Escuchar mi certificado');
      btnEscuchar.type = 'button';
      btnEscuchar.addEventListener('click', function () {
        if (window.JopoiVoz) window.JopoiVoz.hablar(textoCertificado());
      });
      acciones.appendChild(btnEscuchar);

      seccionCert.appendChild(acciones);
    } else {
      seccionCert.appendChild(crear('h3', null, 'Su certificado'));
      seccionCert.appendChild(crear('p', null,
        'Cuando termine los cuatro cursos, aquí podrá descargar su certificado de la Escuela Cívica JOPÓI, en texto y en braille.'));
    }
    zona.appendChild(seccionCert);

    // Reiniciar (con confirmación, nunca por accidente).
    var btnReiniciar = crear('button', 'secundario', 'Borrar mi avance y empezar de nuevo');
    btnReiniciar.type = 'button';
    btnReiniciar.id = 'btn-reiniciar-escuela';
    btnReiniciar.addEventListener('click', function () {
      if (!confirm('Esto borrará sus puntos y su avance en los cuatro cursos. ¿Desea continuar?')) return;
      progreso = progresoVacio();
      guardarProgreso();
      pintarMarcador();
      pintarCursos();
      anunciar('Avance borrado. Puede empezar de nuevo cuando quiera.');
    });
    zona.appendChild(btnReiniciar);

    titulo.focus();
  }

  /* ------------------------------------------------------------------ */
  /* VISTA 2: LECCIONES DE UN CURSO                                      */
  /* ------------------------------------------------------------------ */
  function pintarCurso(cursoId) {
    var c = curso(cursoId);
    if (!c) return;
    estadoVista.cursoId = cursoId;
    var zona = document.getElementById('zona-escuela');
    zona.innerHTML = '';

    zona.appendChild(migas([{ texto: 'Todos los cursos', accion: pintarCursos }], c.titulo));

    var titulo = crear('h2', null, c.titulo);
    titulo.id = 'titulo-vista';
    titulo.setAttribute('tabindex', '-1');
    zona.appendChild(titulo);
    zona.appendChild(crear('p', null, c.resumen));

    var queAprende = crear('section', 'para-mi');
    queAprende.appendChild(crear('h3', null, 'Al terminar este curso usted podrá'));
    var ul = crear('ul');
    c.objetivos.forEach(function (o) { ul.appendChild(crear('li', null, o)); });
    queAprende.appendChild(ul);
    zona.appendChild(queAprende);

    zona.appendChild(crear('h3', null, 'Las lecciones'));
    var lista = crear('ol', 'lista-lecciones');
    c.lecciones.forEach(function (l, i) {
      var li = crear('li');
      var boton = crear('button', progreso.lecciones[l.id] ? 'leccion-hecha' : null,
        'Lección ' + (i + 1) + '. ' + l.titulo +
        (progreso.lecciones[l.id] ? '. Terminada.' : ''));
      boton.type = 'button';
      boton.addEventListener('click', function () { pintarLeccion(cursoId, i); });
      li.appendChild(boton);
      lista.appendChild(li);
    });
    zona.appendChild(lista);

    titulo.focus();
  }

  function migas(anteriores, actual) {
    var nav = crear('nav', 'migas');
    nav.setAttribute('aria-label', 'Dónde está usted');
    var ol = crear('ol');
    anteriores.forEach(function (a) {
      var li = crear('li');
      var b = crear('button', 'secundario enlace-migas', a.texto);
      b.type = 'button';
      b.addEventListener('click', a.accion);
      li.appendChild(b);
      ol.appendChild(li);
    });
    var liActual = crear('li', null, actual);
    liActual.setAttribute('aria-current', 'page');
    ol.appendChild(liActual);
    nav.appendChild(ol);
    return nav;
  }

  /* ------------------------------------------------------------------ */
  /* VISTA 3: UNA LECCIÓN (el corazón de la metodología)                 */
  /* ------------------------------------------------------------------ */
  function pintarLeccion(cursoId, idx) {
    var c = curso(cursoId);
    if (!c || !c.lecciones[idx]) return;
    var l = c.lecciones[idx];
    estadoVista.cursoId = cursoId;
    estadoVista.leccionIdx = idx;

    var zona = document.getElementById('zona-escuela');
    zona.innerHTML = '';

    zona.appendChild(migas([
      { texto: 'Todos los cursos', accion: pintarCursos },
      { texto: c.titulo, accion: function () { pintarCurso(cursoId); } }
    ], 'Lección ' + (idx + 1)));

    var titulo = crear('h2', null, 'Lección ' + (idx + 1) + '. ' + l.titulo);
    titulo.id = 'titulo-vista';
    titulo.setAttribute('tabindex', '-1');
    zona.appendChild(titulo);

    /* --- MOMENTO 1: ESCUCHE ------------------------------------------ */
    var acciones = crear('div', 'acciones-documento');
    acciones.setAttribute('role', 'group');
    acciones.setAttribute('aria-label', 'Escuchar esta lección');
    var btnEscuchar = crear('button', null, 'Escuchar toda la lección');
    btnEscuchar.type = 'button';
    btnEscuchar.addEventListener('click', function () {
      var bloques = zona.querySelectorAll('.bloque-leccion p');
      if (window.JopoiVoz) window.JopoiVoz.hablarBloques(Array.prototype.slice.call(bloques));
    });
    acciones.appendChild(btnEscuchar);
    zona.appendChild(acciones);

    /* --- MOMENTO 2: EXPLORE (contenido en bloques cortos) ------------- */
    var cuerpo = crear('section', 'cuerpo-leccion');
    cuerpo.setAttribute('aria-label', 'Contenido de la lección');
    l.bloques.forEach(function (texto, i) {
      var bloque = crear('div', 'bloque bloque-leccion');
      var btn = crear('button', 'leer-bloque secundario', 'Escuchar este bloque');
      btn.type = 'button';
      var p = crear('p', null, limpio(texto));
      btn.addEventListener('click', function () {
        if (window.JopoiVoz) window.JopoiVoz.hablar(p.textContent, bloque);
      });
      bloque.appendChild(btn);
      bloque.appendChild(p);
      cuerpo.appendChild(bloque);
    });
    zona.appendChild(cuerpo);

    // Pictogramas de apoyo (accesibilidad cognitiva).
    if (window.JopoiPictogramas) {
      var fila = crear('div', 'fila-pictogramas');
      fila.setAttribute('aria-label', 'Pictogramas del tema de esta lección');
      var figuras = window.JopoiPictogramas.paraTexto(l.titulo + ' ' + l.bloques.join(' '), 4);
      if (figuras.length) {
        figuras.forEach(function (f) { fila.appendChild(f); });
        zona.appendChild(fila);
      }
    }

    // Palabras nuevas (glosario de la lección).
    if (l.glosario && l.glosario.length) {
      var g = crear('section', 'panel-glosario');
      g.appendChild(crear('h3', null, 'Palabras nuevas de esta lección'));
      var dl = crear('dl', 'glosario');
      l.glosario.forEach(function (par) {
        dl.appendChild(crear('dt', null, par.palabra));
        dl.appendChild(crear('dd', null, 'Quiere decir: ' + par.significado));
      });
      g.appendChild(dl);
      zona.appendChild(g);
    }

    // Qué significa esto para usted.
    if (l.paraMi) {
      var pm = crear('section', 'para-mi');
      pm.appendChild(crear('h3', null, '¿Qué significa esto para usted?'));
      pm.appendChild(crear('p', null, limpio(l.paraMi)));
      zona.appendChild(pm);
    }

    /* --- MOMENTO 3: PRACTIQUE (las actividades) ---------------------- */
    if (l.actividades && l.actividades.length) {
      zona.appendChild(crear('h3', null, 'Ahora practique'));
      zona.appendChild(crear('p', 'ayuda-campo',
        'Equivocarse no resta puntos y no bloquea nada. Puede intentar las veces que quiera.'));
      l.actividades.forEach(function (act, i) {
        zona.appendChild(pintarActividad(l.id, i, act));
      });
    }

    /* --- MOMENTO 4: DEMUESTRE (cerrar la lección y avanzar) ---------- */
    var cierre = crear('section', 'cierre-leccion');
    var btnTerminar = crear('button', null,
      progreso.lecciones[l.id] ? 'Lección ya terminada. Marcar de nuevo' : 'Marcar esta lección como terminada');
    btnTerminar.type = 'button';
    btnTerminar.addEventListener('click', function () {
      if (!progreso.lecciones[l.id]) {
        progreso.lecciones[l.id] = true;
        guardarProgreso();
        sumarPuntos(10, 'terminar la lección');
        revisarInsignia(c);
      } else {
        anunciar('Esta lección ya estaba terminada.');
      }
      btnTerminar.textContent = 'Lección terminada';
      pintarMarcador();
    });
    cierre.appendChild(btnTerminar);

    var navegar = crear('div', 'acciones-documento');
    navegar.setAttribute('role', 'group');
    navegar.setAttribute('aria-label', 'Moverse entre lecciones');
    if (idx > 0) {
      var btnAnterior = crear('button', 'secundario', 'Lección anterior');
      btnAnterior.type = 'button';
      btnAnterior.addEventListener('click', function () { pintarLeccion(cursoId, idx - 1); });
      navegar.appendChild(btnAnterior);
    }
    if (idx < c.lecciones.length - 1) {
      var btnSiguiente = crear('button', null, 'Siguiente lección');
      btnSiguiente.type = 'button';
      btnSiguiente.addEventListener('click', function () { pintarLeccion(cursoId, idx + 1); });
      navegar.appendChild(btnSiguiente);
    }
    var btnVolver = crear('button', 'secundario', 'Volver a la lista de lecciones');
    btnVolver.type = 'button';
    btnVolver.addEventListener('click', function () { pintarCurso(cursoId); });
    navegar.appendChild(btnVolver);
    cierre.appendChild(navegar);
    zona.appendChild(cierre);

    titulo.focus();
    anunciar('Lección ' + (idx + 1) + ' de ' + c.lecciones.length + ' del curso ' + c.titulo + '.');
  }

  function revisarInsignia(c) {
    if (cursoCompleto(c) && progreso.insignias.indexOf(c.id) === -1) {
      progreso.insignias.push(c.id);
      guardarProgreso();
      sumarPuntos(25, 'terminar el curso completo');
      anunciar('Felicitaciones. Terminó el curso ' + c.titulo +
        ' y ganó la insignia: ' + c.insignia + '.');
    }
  }

  /* ------------------------------------------------------------------ */
  /* ACTIVIDADES (cuatro tipos, todas sin arrastrar)                     */
  /* ------------------------------------------------------------------ */
  function pintarActividad(leccionId, i, act) {
    var claveAct = leccionId + '-' + i;
    var caja = crear('section', 'actividad');
    caja.setAttribute('aria-label', 'Actividad ' + (i + 1));

    caja.appendChild(crear('h4', null, 'Actividad ' + (i + 1)));
    var pregunta = crear('p', 'pregunta-actividad', limpio(act.pregunta));
    caja.appendChild(pregunta);

    var btnOir = crear('button', 'secundario leer-bloque', 'Escuchar la pregunta');
    btnOir.type = 'button';
    btnOir.addEventListener('click', function () {
      if (window.JopoiVoz) window.JopoiVoz.hablar(pregunta.textContent, caja);
    });
    caja.appendChild(btnOir);

    var respuesta = crear('p', 'respuesta-actividad');
    respuesta.setAttribute('role', 'status');
    respuesta.setAttribute('aria-live', 'polite');

    if (act.tipo === 'opciones' || act.tipo === 'verdadero-falso') {
      var opciones = act.tipo === 'verdadero-falso'
        ? ['Verdadero', 'Falso']
        : act.opciones;
      var grupo = crear('div', 'opciones-actividad');
      grupo.setAttribute('role', 'group');
      grupo.setAttribute('aria-label', 'Opciones de respuesta');
      opciones.forEach(function (texto, idx) {
        var b = crear('button', 'secundario opcion', texto);
        b.type = 'button';
        b.addEventListener('click', function () {
          var acerto = idx === act.correcta;
          if (acerto) {
            b.className = 'opcion opcion-correcta';
            b.setAttribute('aria-pressed', 'true');
            respuesta.textContent = 'Correcto. ' + act.explicacion;
            if (!progreso.actividades[claveAct]) {
              progreso.actividades[claveAct] = true;
              sumarPuntos(5, 'acertar la actividad');
            }
          } else {
            respuesta.textContent = 'Esa no es. ' + (act.pista || 'Vuelva a leer la lección y pruebe otra vez. No pasa nada.');
          }
        });
        grupo.appendChild(b);
      });
      caja.appendChild(grupo);

    } else if (act.tipo === 'ordenar') {
      // Ordenar con botones subir y bajar: nunca arrastrar y soltar.
      var orden = act.pasos.map(function (p, k) { return k; });
      mezclar(orden, act.pasos.length);
      var lista = crear('ol', 'lista-ordenar');
      lista.setAttribute('aria-label', 'Pasos para ordenar');

      function repintarOrden() {
        lista.innerHTML = '';
        orden.forEach(function (indicePaso, posicion) {
          var li = crear('li');
          li.appendChild(crear('span', 'texto-paso', act.pasos[indicePaso]));
          var controles = crear('div', 'controles-orden');
          if (posicion > 0) {
            var arriba = crear('button', 'secundario', 'Subir');
            arriba.type = 'button';
            arriba.setAttribute('aria-label', 'Subir el paso: ' + act.pasos[indicePaso]);
            arriba.addEventListener('click', function () {
              var t = orden[posicion - 1]; orden[posicion - 1] = orden[posicion]; orden[posicion] = t;
              repintarOrden();
              anunciar('Paso movido hacia arriba. Ahora está en la posición ' + posicion + '.');
            });
            controles.appendChild(arriba);
          }
          if (posicion < orden.length - 1) {
            var abajo = crear('button', 'secundario', 'Bajar');
            abajo.type = 'button';
            abajo.setAttribute('aria-label', 'Bajar el paso: ' + act.pasos[indicePaso]);
            abajo.addEventListener('click', function () {
              var t = orden[posicion + 1]; orden[posicion + 1] = orden[posicion]; orden[posicion] = t;
              repintarOrden();
              anunciar('Paso movido hacia abajo. Ahora está en la posición ' + (posicion + 2) + '.');
            });
            controles.appendChild(abajo);
          }
          li.appendChild(controles);
          lista.appendChild(li);
        });
      }
      repintarOrden();
      caja.appendChild(lista);

      var btnRevisar = crear('button', null, 'Revisar mi orden');
      btnRevisar.type = 'button';
      btnRevisar.addEventListener('click', function () {
        var bien = orden.every(function (v, k) { return v === k; });
        if (bien) {
          respuesta.textContent = 'Correcto. ' + act.explicacion;
          if (!progreso.actividades[claveAct]) {
            progreso.actividades[claveAct] = true;
            sumarPuntos(5, 'ordenar bien los pasos');
          }
        } else {
          var primerError = 0;
          for (var k = 0; k < orden.length; k++) { if (orden[k] !== k) { primerError = k; break; } }
          respuesta.textContent = 'Todavía no está en orden. Revise el paso número ' +
            (primerError + 1) + '. Puede intentarlo otra vez, no pasa nada.';
        }
      });
      caja.appendChild(btnRevisar);

    } else if (act.tipo === 'escritura') {
      // Práctica libre: se escribe o se dicta. No hay corrección
      // automática porque no hay una sola respuesta correcta; el punto
      // se gana por practicar, que es lo que importa.
      var etiqueta = crear('label', null, act.instruccion || 'Escriba o dicte su respuesta');
      etiqueta.setAttribute('for', 'act-' + claveAct);
      caja.appendChild(etiqueta);
      var area = crear('textarea');
      area.id = 'act-' + claveAct;
      area.rows = 4;
      try {
        var guardado = localStorage.getItem('jopoi_escuela_texto_' + claveAct);
        if (guardado) area.value = guardado;
      } catch (e) { /* incógnito */ }
      area.addEventListener('input', function () {
        try { localStorage.setItem('jopoi_escuela_texto_' + claveAct, area.value); }
        catch (e) { /* incógnito */ }
      });
      caja.appendChild(area);

      var btnListo = crear('button', null, 'Guardar mi respuesta');
      btnListo.type = 'button';
      btnListo.addEventListener('click', function () {
        if (!area.value.trim()) {
          respuesta.textContent = 'Escriba o dicte algo primero. Puede usar el botón del micrófono.';
          return;
        }
        respuesta.textContent = 'Respuesta guardada en su dispositivo. ' + act.explicacion;
        if (!progreso.actividades[claveAct]) {
          progreso.actividades[claveAct] = true;
          sumarPuntos(5, 'practicar la escritura');
        }
      });
      caja.appendChild(btnListo);
    }

    caja.appendChild(respuesta);

    if (progreso.actividades[claveAct]) {
      respuesta.textContent = 'Ya resolvió esta actividad antes. Puede volver a practicarla.';
    }
    return caja;
  }

  /* Mezcla suave que garantiza que el orden inicial NO sea el correcto. */
  function mezclar(arreglo, largo) {
    if (largo < 2) return;
    for (var i = arreglo.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arreglo[i]; arreglo[i] = arreglo[j]; arreglo[j] = t;
    }
    var yaOrdenado = arreglo.every(function (v, k) { return v === k; });
    if (yaOrdenado) { var t2 = arreglo[0]; arreglo[0] = arreglo[1]; arreglo[1] = t2; }
  }

  /* ------------------------------------------------------------------ */
  /* CERTIFICADO                                                         */
  /* ------------------------------------------------------------------ */
  function nombreCertificado() {
    var campo = document.getElementById('campo-nombre-certificado');
    var nombre = campo && campo.value.trim() ? campo.value.trim() : (progreso.nombre || '');
    if (nombre) { progreso.nombre = nombre; guardarProgreso(); }
    return nombre || 'Participante de la Escuela Cívica JOPÓI';
  }

  function fechaHoy() {
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var h = new Date();
    return h.getDate() + ' de ' + meses[h.getMonth()] + ' de ' + h.getFullYear();
  }

  function textoCertificado() {
    var cfg = window.JOPOI_CONFIG || {};
    var lineas = [
      'CERTIFICADO DE LA ESCUELA CÍVICA JOPÓI',
      '',
      'Se certifica que ' + nombreCertificado(),
      'completó los cuatro cursos de la Escuela Cívica de la plataforma JOPÓI:',
      '',
      '1. Qué es la democracia y por qué usted es parte de ella.',
      '2. La Asamblea Legislativa Departamental de Santa Cruz.',
      '3. Cómo nace una ley: el proceso legislativo paso a paso.',
      '4. Sus derechos en el mundo y cómo redactar su propia propuesta.',
      '',
      'Puntaje alcanzado: ' + progreso.puntos + ' puntos.',
      'Lecciones completadas: ' + totalHechas() + ' de ' + totalLecciones() + '.',
      '',
      'Fecha: ' + fechaHoy() + '.',
      'Región: ' + (cfg.region || 'Santa Cruz, Bolivia') + '.',
      '',
      'Esta formación ciudadana fue diseñada para ser accesible a personas ciegas,',
      'con baja visión y neurodivergentes, bajo el principio de Reciprocidad Democrática:',
      'la democracia se adapta a la persona, no la persona a la democracia.',
      '',
      'Plataforma JOPÓI. Software libre y de código abierto.'
    ];
    return lineas.join('\n');
  }

  function descargarCertificado(formato) {
    var texto = textoCertificado();
    if (formato === 'braille') {
      if (!window.JopoiBraille || !window.JopoiBraille.descargarBRF) return;
      window.JopoiBraille.descargarBRF('Certificado de la Escuela Cívica JOPÓI', texto, 'certificado_jopoi');
      anunciar('Certificado descargado en formato braille punto BRF, listo para impresora braille o línea braille.');
      return;
    }
    var blob = new Blob(['﻿' + texto], { type: 'text/plain;charset=utf-8' });
    var enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = 'certificado_escuela_civica_jopoi.txt';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    anunciar('Certificado descargado como archivo de texto.');
  }

  /* ------------------------------------------------------------------ */
  /* ARRANQUE                                                            */
  /* ------------------------------------------------------------------ */
  function cargarCursos() {
    return fetch('data/cursos.json')
      .then(function (r) { if (!r.ok) throw new Error('sin datos'); return r.json(); })
      .then(function (json) {
        try { localStorage.setItem('jopoi_cursos_cache', JSON.stringify(json)); }
        catch (e) { /* incógnito */ }
        return json;
      })
      .catch(function () {
        var cache = null;
        try { cache = localStorage.getItem('jopoi_cursos_cache'); } catch (e) { /* incógnito */ }
        if (cache) return JSON.parse(cache);
        throw new Error('No se pudieron cargar los cursos. Revise su conexión e intente de nuevo.');
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    progreso = leerProgreso();
    anunciar('Cargando los cursos.');
    cargarCursos().then(function (datos) {
      cursos = datos;
      pintarMarcador();
      pintarCursos();
      anunciar('La Escuela Cívica tiene ' + cursos.length + ' cursos y ' +
        totalLecciones() + ' lecciones en total.');
    }).catch(function (e) {
      anunciar(e.message);
    });
  });

  // Expuesto para las pruebas automatizadas.
  window.JopoiEscuela = {
    leerProgreso: leerProgreso,
    textoCertificado: textoCertificado
  };
}());
