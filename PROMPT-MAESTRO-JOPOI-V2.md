# PROMPT MAESTRO DE INGENIERÍA V2: PLATAFORMA JOPÓI

> Versión mejorada del prompt original. Los cambios respecto a la V1 están marcados con **[MEJORA]** y explicados al final. Esta V2 ya está implementada en la carpeta `plataforma/`.

**Rol asignado:** Tech Lead, Arquitecto de Software Full-Stack Senior y Experto Mundial en Accesibilidad Web (WCAG 2.2, Diseño Universal y Tecnologías Asistivas).

**Objetivo:** Diseñar y desarrollar la arquitectura completa, el código base y la interfaz de la **Plataforma JOPÓI**.

---

## 1. CONTEXTO, FILOSOFÍA Y ESCALABILIDAD

**JOPÓI** (guaraní: intercambio recíproco) es una infraestructura cívica digital soberana, apoyada por YDN. Permite a jóvenes interactuar directamente con los parlamentos (Asamblea Legislativa Departamental de Santa Cruz, Bolivia) sin intermediarios. Rechazamos la inclusión como caridad; operamos bajo la **Reciprocidad Democrática**: el sistema se adapta al ciudadano.

- **Código abierto y replicable:** 100 por ciento open source (licencia MIT). **[MEJORA]** Toda la configuración regional vive en UN solo archivo (`js/config.js`) y los datos legislativos en UN solo JSON (`data/leyes.json`): el fork completo se hace sin tocar los motores.
- **Arquitectura offline-first:** PWA con service worker; todo funciona sin conexión tras la primera visita. **[MEJORA]** Cero paso de compilación: HTML, CSS y JavaScript puros, publicables gratis en GitHub Pages. En contextos de baja conectividad y ONGs sin equipo técnico, cada dependencia eliminada es sostenibilidad ganada.
- **[MEJORA] Procesamiento local antes que APIs de terceros:** el OCR corre en el navegador (Tesseract.js) y la voz usa las voces neuronales del propio dispositivo. Las APIs externas son opcionales y enchufables, nunca obligatorias: costo cero por defecto y soberanía de datos (los documentos de la ciudadanía no viajan a servidores ajenos).
- **i18n:** estructura de diccionarios `i18n/es.json`, `en.json`, `gn.json` (guaraní). **[MEJORA]** Regla explícita: las lenguas originarias se traducen y validan con hablantes de las comunidades, jamás con traducción automática.
- **[MEJORA] Marco de exigibilidad legal:** cada documento muestra al pie las normas que garantizan el derecho a esa información (Ley 223 de Bolivia, Ley 341, CDPD artículos 9, 21 y 29). La plataforma no pide inclusión: la exige con la ley en la mano, y da a las instituciones el argumento de cumplimiento normativo.

## 2. PRIORIDAD ESTRICTA DEL PÚBLICO OBJETIVO

Jerarquía irrompible: 1) ceguera total, 2) neurodivergencia, 3) baja visión. **[MEJORA]** Se materializa en perfiles sensoriales de un solo toque (página de ajustes): la persona declara su perfil una vez y toda la plataforma se reconfigura y lo recuerda en el dispositivo.

## 3. MÓDULOS

### MÓDULO 1: Decodificador Legislativo y Motor Braille (CRÍTICO)
- DOM semántico con ARIA impecable, compatible con líneas braille.
- Exportación .BRF (40 celdas x 25 líneas, Braille ASCII, especificación de la Library of Congress). **[MEJORA]** Signografía braille ESPAÑOLA grado 1 (vocales acentuadas, ñ, signo de mayúscula de puntos 4-6), no la inglesa: un .brf con signografía incorrecta es ilegible para quien lee braille en español. **[MEJORA]** Vista previa braille Unicode en pantalla para que docentes y familias videntes verifiquen el resultado.

### MÓDULO 2: Portal OCR
- La persona sube PDF o foto; el texto se extrae, se limpia con el middleware y entra al decodificador (voz, braille, lectura fácil). **[MEJORA]** El OCR es 100 por ciento local (Tesseract.js + pdf.js en el navegador): privacidad por arquitectura y costo cero. **[MEJORA]** El texto extraído es editable y dictable antes de usarse: el OCR nunca es perfecto y la persona tiene la última palabra.

### MÓDULO 3: Feed Legislativo Departamental
- Lista cronológica, texto puro, un clic al documento. **[MEJORA]** Buscador con dictado por voz, indicador de conexión, caché local de los documentos y etiquetas claras de estado ("Ley vigente" o "Proyecto en debate") que también distinguen los documentos de demostración.

### MÓDULO 4: Redacción de Propuestas Cívicas
- **[MEJORA]** Formulario guiado en 5 pasos (quién, problema, propuesta, beneficiarios, pedido concreto): reduce la carga cognitiva y elimina la barrera del "no sé redactar como abogado". La plataforma genera el documento formal con fecha, destinatario e invocación de la Ley 341.
- **[MEJORA]** Salidas múltiples: correo (mailto), WhatsApp (el canal real de Bolivia), copiar, .txt y .brf. Borrador con autoguardado local: un corte de luz no borra la voz de nadie.

### MÓDULO 5: Motor de Simplificación Cognitiva y Apoyo Visual
- **[MEJORA]** Tres niveles con honestidad declarada, siguiendo la norma UNE 153101:2018 EX (la primera norma técnica mundial de Lectura Fácil):
  1. Versión redactada y validada por humanos (incluida en los datos): la única que la norma considera Lectura Fácil plena.
  2. API de IA generativa opcional y enchufable, etiquetada "pendiente de validación humana".
  3. Motor local de reglas (offline): acorta oraciones, reemplaza jerga, produce viñetas.
- **[MEJORA]** Glosario cívico automático: detecta términos como "derogar" o "fiscalizar" y los explica en palabras comunes.
- **[MEJORA]** Pictogramas de ARASAAC (el estándar mundial de comunicación aumentativa, más de 12.500 pictogramas, licencia gratuita) más un banco propio de SVG bicolor offline, en lugar de imágenes generadas por IA: un pictograma convencional y estable ancla significado; una imagen distinta cada vez, no.

## 4. HERRAMIENTAS DE ACCESIBILIDAD INTEGRADAS

- **TTS omnipresente:** botón "leer esta página" en todas las páginas y botón por bloque en los documentos, con resaltado sincronizado de lo que se está leyendo. **[MEJORA]** Selección automática de la voz más natural del dispositivo (puntuando voces neuronales y es-BO primero) y velocidad regulable persistente; API neuronal externa enchufable por configuración.
- **STT universal:** **[MEJORA]** el botón de micrófono se inyecta automáticamente en TODO campo de texto presente y futuro; con mensajes de estado accesibles (aria-live) y aviso claro cuando el navegador no lo soporta.
- **[MEJORA] Atajos de teclado globales** (Alt+1 a Alt+4 y Alt+0 para leer en voz alta), anunciados en el pie de cada página y en ajustes.

## 5. DISEÑO E INTERFAZ

- Paleta exclusiva verde oscuro #004d00 y blanco #FFFFFF. **[MEJORA]** Contraste medido: 10.9 a 1 (AAA). Modo oscuro que solo invierte el par, sin introducir colores nuevos. Ningún estado se comunica solo con color.
- **[MEJORA]** Tipografía Atkinson Hyperlegible (diseñada por el Braille Institute para baja visión) con respaldo del sistema; base 20 píxeles, escalable a 44 desde la barra, espaciado de línea, letra y palabra regulables (WCAG 1.4.12).
- Bloques cortos con pausa visual para texto largo; alt text reflejado como tooltip; minimalismo extremo: cero pop-ups, cero animaciones (regla CSS global), cero carruseles.
- **[MEJORA]** Objetivos táctiles de 48 píxeles y foco visible de 4 píxeles en todo elemento interactivo (WCAG 2.2).

## 6. MIDDLEWARE DE PROCESAMIENTO DE TEXTO

Igual que la V1 (expansión de abreviaturas y corrección de lenguaje con @ y x), con estas precisiones **[MEJORA]**:
- Diccionario boliviano: C.P.E., A.L.D., D.S., G.A.M., G.A.D., más tratamientos y abreviaturas de redacción legislativa.
- El corrector genérico no toca palabras legítimas con x ("rayos x", "examen").
- Los números con separador de miles no rompen el signo numérico braille.
- Cubierto por pruebas automatizadas (`test/test-nucleo.js`) para que ningún fork lo rompa sin enterarse.

## 7. SALIDA IMPLEMENTADA

1. **Arquitectura:** PWA estática modular (ver `docs/ACCESIBILIDAD.md` y `README.md`).
2. **Componentes:** 6 páginas + 14 módulos JS con responsabilidad única.
3. **Código crítico real:** `js/braille.js` (BRF + signografía española), `js/ocr.js` (OCR local + voz), `js/middleware.js` (abreviaturas + inclusivo), `js/stt.js` (dictado universal), `js/lectura-facil.js` (3 niveles + glosario), `js/pictogramas.js` (ARASAAC + banco offline).
4. **Estilos:** `css/jopoi.css` con la paleta, la tipografía y las pausas de bloque.
5. **[MEJORA] Pruebas y validación:** pruebas unitarias del núcleo, smoke test de todas las páginas y lista de verificación humana pre-publicación (NVDA, braille impreso, modo avión, zoom 200 por ciento).

---

## RESUMEN DE MEJORAS INCORPORADAS SOBRE LA V1

| # | Mejora | Por qué importa |
|---|---|---|
| 1 | Cero compilación (HTML/CSS/JS puro) en vez de Next.js | Fork y publicación gratis en una tarde para cualquier ONG del mundo; menos fallos en baja conectividad |
| 2 | OCR local en el navegador en vez de API de terceros | Privacidad por arquitectura, costo cero por documento, funciona en la práctica sin backend |
| 3 | Signografía braille española grado 1 explícita | Un BRF con tabla inglesa es ilegible en español; este detalle decide si el módulo sirve o no |
| 4 | Lectura Fácil anclada a la norma UNE 153101 con 3 niveles y honestidad declarada | Cumple el estándar real del campo; la validación humana nunca se finge |
| 5 | Pictogramas ARASAAC + banco SVG offline en vez de generación por IA | Estándar mundial validado, gratuito, estable y cacheable sin conexión |
| 6 | Marco legal exigible al pie de cada documento (Ley 223, Ley 341, CDPD) | Convierte la plataforma de herramienta de ayuda en instrumento de exigencia de derechos |
| 7 | Perfiles sensoriales de un toque | La adaptación se hace una vez, no en cada página |
| 8 | Propuestas guiadas en 5 pasos + salida por WhatsApp y correo | WhatsApp es el canal cívico real en Bolivia; el paso a paso elimina la barrera del lenguaje legal |
| 9 | Autoguardado local de borradores e indicador de conexión | Resiliencia real ante cortes de luz e internet |
| 10 | Atajos de teclado, objetivos de 48 px, foco de 4 px, WCAG 2.2 | Actualiza el listón de la V1 (WCAG 2.1) al estándar vigente |
| 11 | Pruebas automatizadas + lista de verificación humana | La accesibilidad se verifica, no se declara |
| 12 | Regla de validación comunitaria para guaraní y lenguas originarias | Evita el extractivismo lingüístico de la traducción automática |
