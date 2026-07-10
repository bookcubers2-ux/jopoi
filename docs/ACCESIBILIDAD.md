# Decisiones de accesibilidad de JOPÓI

Este documento explica el porqué de cada decisión, para que quien haga fork no rompa lo esencial sin darse cuenta.

## Jerarquía de diseño (irrompible)

1. **Ceguera total.** El HTML es semántico de origen: encabezados jerárquicos, landmarks (`header`, `nav`, `main`, `footer`), enlaces de salto, `aria-live` para todo cambio de estado, `aria-pressed` en los conmutadores, foco gestionado al abrir paneles. Una línea braille conectada al lector de pantalla lee TODO el contenido sin configurar nada, porque no hay texto en imágenes ni controles sin nombre.
2. **Neurodivergencia.** Cero animaciones (regla CSS global con `!important`), una sola columna, bloques de máximo 320 caracteres con borde y pausa visual, formulario de propuestas paso a paso, Modo Simplificado con viñetas y pictogramas.
3. **Baja visión.** Letra base de 20 píxeles escalable hasta 44 desde la barra (persistente), espaciado configurable según WCAG 1.4.12, tema oscuro que solo invierte el par verde y blanco, foco visible de 4 píxeles, objetivos táctiles de 48 píxeles.

## Por qué verde #004d00 y blanco

Contraste 10.9 a 1, por encima del nivel AAA (7 a 1). Al ser bicolor estricto, ningún estado depende del color: los estados se marcan con relleno, borde, subrayado y texto.

## Por qué PWA sin compilación (y no Next.js)

- Una ONG sin equipo técnico puede publicarla en GitHub Pages en una tarde.
- Menos dependencias significa menos mantenimiento y menos superficie de fallo en contextos de baja conectividad.
- El HTML servido ya es el HTML final: los lectores de pantalla no esperan hidrataciones ni sufren cambios de DOM tardíos.
- Todo el procesamiento pesado (OCR) corre en el dispositivo: soberanía de datos y costo cero por uso.

## Por qué el OCR es local (Tesseract.js)

Un PDF puede contener datos personales o denuncias sensibles. Con OCR en el navegador, el documento nunca viaja a un servidor: privacidad por arquitectura, no por promesa. Además el costo por documento es cero, condición de sostenibilidad para una plataforma sin fines de lucro.

## Por qué ARASAAC y no imágenes generadas por IA

ARASAAC es el banco de pictogramas de comunicación aumentativa más usado del mundo (más de 12.500 pictogramas, 25 idiomas, licencia gratuita CC BY-NC-SA), diseñado y validado por profesionales. Un pictograma estable y convencional ancla significado; una imagen generada distinta cada vez, no. La plataforma además incluye un banco propio de pictogramas SVG bicolor que funciona sin conexión.

## Por qué la Lectura Fácil tiene tres niveles

La norma UNE 153101 exige validación con personas usuarias reales. Por eso el orden es: versión humana del JSON primero, API de IA después (marcada como pendiente de validación), motor local de reglas como respaldo offline. La máquina asiste; no sustituye la validación humana.

## Voz: por qué Web Speech API con selección inteligente

Los sistemas operativos modernos (Windows 11, Android, iOS) traen voces neuronales en español de calidad casi humana. `tts.js` las puntúa y elige la mejor automáticamente, priorizando es-BO y es-419, y descartando las voces robóticas antiguas cuando hay mejores. Ventaja: costo cero, funcionamiento offline y sin enviar el texto a terceros. El campo `apiVozNeuronal` de config.js queda listo para enchufar una API neuronal si la instancia la necesita.

## Lista de verificación antes de cada publicación

- [ ] Navegar toda la plataforma solo con Tab, Enter y flechas.
- [ ] Recorrerla completa con NVDA (gratuito) y confirmar que cada control se anuncia con nombre y estado.
- [ ] Zoom del navegador al 200 por ciento: sin pérdida de contenido ni desplazamiento horizontal.
- [ ] Exportar un .BRF y abrirlo en un visor braille (o imprimirlo) para revisar la signografía.
- [ ] Modo avión: el feed, el lector, las propuestas y los ajustes deben seguir funcionando.
- [ ] Pasar el validador automático (axe DevTools o Lighthouse, meta 100 en accesibilidad) sabiendo que lo automático solo detecta una parte: la prueba con personas reales manda.

## Limitaciones conocidas (honestas)

- El braille exportado es grado 1 (integral). La estenografía española (grado 2) requiere una tabla de contracciones que está en la hoja de ruta; para textos legales, el grado 1 es legible y correcto.
- El dictado por voz depende del navegador (Chrome y Edge lo soportan; Firefox aún no) y requiere conexión en la mayoría de los casos.
- Las voces del navegador varían según el dispositivo: en equipos antiguos la voz puede sonar menos natural.
- La traducción guaraní está pendiente de trabajo con hablantes; el archivo i18n/gn.json existe para ese propósito y explica la regla: nada de traducción automática sin validación comunitaria.
