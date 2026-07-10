/**
 * JOPÓI | Configuración de la instancia
 * -------------------------------------
 * Este es el ÚNICO archivo que una organización debe editar para
 * lanzar su propia instancia de JOPÓI en otra región u otro país.
 * Todo lo demás (motores de braille, voz, OCR, lectura fácil) es común.
 */
window.JOPOI_CONFIG = {
  // Identidad de la instancia
  nombreInstancia: 'JOPÓI Santa Cruz',
  region: 'Santa Cruz, Bolivia',
  parlamento: 'Asamblea Legislativa Departamental de Santa Cruz',

  // Idioma por defecto: 'es' (español), 'gn' (guaraní, en construcción), 'en' (inglés)
  idioma: 'es',

  // Voz: configuración regional para síntesis y dictado
  vozIdioma: 'es-BO',        // se degrada a es-419 o es-ES si no existe
  dictadoIdioma: 'es-BO',

  // Destinos institucionales de las propuestas ciudadanas
  correoInstitucion: 'ventanilla@aldscz.gob.bo',   // EDITAR: correo real de la institución
  whatsappInstitucion: '',                          // opcional: número con código de país, sin signos

  // API opcional de Lectura Fácil con IA (función serverless propia).
  // Vacío = se usa el motor local offline. Ver docs/GUIA-FORK.md.
  apiLecturaFacil: '',

  // API opcional de voz neuronal (TTS). Vacío = voces del navegador,
  // eligiendo automáticamente la más natural disponible.
  apiVozNeuronal: '',

  // Pictogramas ARASAAC (https://arasaac.org, licencia CC BY-NC-SA).
  // Se buscan en línea y se guardan en caché para uso sin conexión.
  arasaacApi: 'https://api.arasaac.org/v1/pictograms',
  arasaacImagen: 'https://static.arasaac.org/pictograms',

  // Marco legal que la instancia invoca (se muestra al pie de cada documento)
  marcoLegal: [
    'Ley número 223, Ley General para Personas con Discapacidad (Bolivia, 2012)',
    'Convención sobre los Derechos de las Personas con Discapacidad, artículos 9, 21 y 29 (Naciones Unidas)'
  ]
};
