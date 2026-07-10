/**
 * JOPÓI | Redacción de Propuestas Cívicas (input adaptativo)
 * ----------------------------------------------------------
 * Formulario guiado paso a paso (una pregunta a la vez reduce la carga
 * cognitiva). Cada campo tiene dictado por voz. Al final, la plataforma
 * arma un documento formal de propuesta ciudadana listo para enviar a
 * la institución por correo o WhatsApp, copiar o descargar.
 *
 * Todo se guarda automáticamente en el dispositivo (localStorage):
 * si se corta la luz o el internet, no se pierde nada.
 */
(function () {
  'use strict';

  var BORRADOR_CLAVE = 'jopoi_propuesta_borrador';
  var CAMPOS = ['nombre', 'comunidad', 'problema', 'propuesta', 'beneficiarios', 'pedido'];

  function leerBorrador() {
    try { return JSON.parse(localStorage.getItem(BORRADOR_CLAVE) || '{}'); }
    catch (e) { return {}; }
  }

  function guardarBorrador() {
    var datos = {};
    CAMPOS.forEach(function (c) {
      var campo = document.getElementById('campo-' + c);
      if (campo) datos[c] = campo.value;
    });
    localStorage.setItem(BORRADOR_CLAVE, JSON.stringify(datos));
    document.getElementById('estado-borrador').textContent =
      'Borrador guardado en este dispositivo. Puede cerrar y volver cuando quiera.';
  }

  function fechaHoy() {
    var hoy = new Date();
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
      'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return hoy.getDate() + ' de ' + meses[hoy.getMonth()] + ' de ' + hoy.getFullYear();
  }

  function armarDocumento() {
    var d = leerBorrador();
    var config = window.JOPOI_CONFIG || {};
    var lineas = [
      'PROPUESTA CIUDADANA',
      'Presentada mediante la plataforma ' + (config.nombreInstancia || 'JOPÓI') + '.',
      'Fecha: ' + fechaHoy() + '.',
      'Dirigida a: ' + (config.parlamento || 'la institución legislativa') + '.',
      '',
      'QUIÉN PRESENTA',
      (d.nombre || 'Nombre no indicado') + ', de ' + (d.comunidad || 'comunidad no indicada') + '.',
      '',
      'EL PROBLEMA',
      d.problema || '',
      '',
      'LA PROPUESTA',
      d.propuesta || '',
      '',
      'A QUIÉNES BENEFICIA',
      d.beneficiarios || '',
      '',
      'PEDIDO CONCRETO A LA INSTITUCIÓN',
      d.pedido || '',
      '',
      'Esta propuesta se presenta en ejercicio del derecho a la participación reconocido por la Constitución y por la Ley número 341 de Participación y Control Social. Solicito respuesta formal por los canales establecidos.'
    ];
    return window.JopoiTexto.procesar(lineas.join('\n'));
  }

  function validar() {
    var d = leerBorrador();
    var faltantes = [];
    if (!d.problema) faltantes.push('el problema');
    if (!d.propuesta) faltantes.push('la propuesta');
    if (!d.pedido) faltantes.push('el pedido concreto');
    return faltantes;
  }

  function generar() {
    var faltantes = validar();
    var estado = document.getElementById('estado-propuesta');
    if (faltantes.length) {
      estado.textContent = 'Antes de generar el documento, complete: ' + faltantes.join(', ') + '.';
      return;
    }
    var texto = armarDocumento();
    var zona = document.getElementById('documento-final');
    zona.hidden = false;
    document.getElementById('texto-final').value = texto;
    estado.textContent = 'Documento formal generado. Revíselo y elija cómo enviarlo.';

    var config = window.JOPOI_CONFIG || {};
    var asunto = encodeURIComponent('Propuesta ciudadana presentada por ' + (leerBorrador().nombre || 'la ciudadanía'));
    var cuerpo = encodeURIComponent(texto);

    var correo = document.getElementById('btn-correo');
    correo.href = 'mailto:' + (config.correoInstitucion || '') + '?subject=' + asunto + '&body=' + cuerpo;

    var wsp = document.getElementById('btn-whatsapp');
    if (config.whatsappInstitucion) {
      wsp.href = 'https://wa.me/' + config.whatsappInstitucion + '?text=' + cuerpo;
      wsp.hidden = false;
    } else {
      wsp.href = 'https://wa.me/?text=' + cuerpo;
      wsp.hidden = false;
    }
    zona.querySelector('h2').focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Restaurar borrador.
    var borrador = leerBorrador();
    CAMPOS.forEach(function (c) {
      var campo = document.getElementById('campo-' + c);
      if (campo && borrador[c]) campo.value = borrador[c];
      if (campo) campo.addEventListener('input', guardarBorrador);
    });

    // Si viene desde un documento (propuestas.html?sobre=ID), anotarlo.
    var sobre = new URLSearchParams(location.search).get('sobre');
    if (sobre && !borrador.problema) {
      document.getElementById('contexto-propuesta').textContent =
        'Está escribiendo una propuesta relacionada con el documento "' + sobre + '" del feed legislativo.';
    }

    document.getElementById('btn-generar').addEventListener('click', generar);

    document.getElementById('btn-escuchar-final').addEventListener('click', function () {
      window.JopoiVoz.hablar(document.getElementById('texto-final').value);
    });
    document.getElementById('btn-copiar').addEventListener('click', function () {
      var texto = document.getElementById('texto-final').value;
      (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject())
        .then(function () {
          document.getElementById('estado-propuesta').textContent = 'Documento copiado. Péguelo donde lo necesite.';
        })
        .catch(function () {
          document.getElementById('texto-final').select();
          document.execCommand('copy');
          document.getElementById('estado-propuesta').textContent = 'Documento copiado.';
        });
    });
    document.getElementById('btn-descargar').addEventListener('click', function () {
      var blob = new Blob([document.getElementById('texto-final').value], { type: 'text/plain;charset=utf-8' });
      var enlace = document.createElement('a');
      enlace.href = URL.createObjectURL(blob);
      enlace.download = 'propuesta_ciudadana.txt';
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
    });
    document.getElementById('btn-brf-propuesta').addEventListener('click', function () {
      window.JopoiBraille.descargarBRF('Propuesta ciudadana',
        document.getElementById('texto-final').value, 'propuesta_ciudadana');
    });
    document.getElementById('btn-limpiar').addEventListener('click', function () {
      if (!confirm('Esto borrará el borrador guardado. ¿Desea continuar?')) return;
      localStorage.removeItem(BORRADOR_CLAVE);
      CAMPOS.forEach(function (c) {
        var campo = document.getElementById('campo-' + c);
        if (campo) campo.value = '';
      });
      document.getElementById('documento-final').hidden = true;
      document.getElementById('estado-propuesta').textContent = 'Borrador eliminado. Puede empezar de nuevo.';
    });
  });
}());
