# JOPÓI. Democracia accesible

**Jopói** (guaraní: intercambio recíproco) es una infraestructura cívica digital de código abierto que permite a la juventud, y en primer lugar a las personas ciegas, neurodivergentes y con baja visión, leer las leyes de su región y presentar propuestas formales al parlamento sin intermediarios.

Nace en Santa Cruz, Bolivia, para dialogar con la Asamblea Legislativa Departamental, y está diseñada para que cualquier organización del mundo la clone y lance su propia democracia accesible editando **un solo archivo**.

## Filosofía: Reciprocidad Democrática

Rechazamos la inclusión como caridad. La plataforma no le pide a la persona que se adapte al sistema: obliga al sistema a hablar en voz, en braille, en Lectura Fácil y en pictogramas. El orden de prioridad del diseño es irrompible:

1. Personas sin capacidad visual (lector de pantalla y línea braille).
2. Personas neurodivergentes (bloques cortos, Lectura Fácil, cero distracciones).
3. Personas con baja visión (alto contraste, letra grande, espaciado amplio).

## Qué hace

| Módulo | Qué resuelve |
|---|---|
| Feed legislativo | Leyes y proyectos en texto puro, cronológicos, con buscador dictable por voz |
| Lector de documentos | Bloques cortos, voz por bloque, resaltado de lectura, marco legal del derecho a la información |
| Motor braille | Braille español grado 1 en pantalla y exportación .BRF (40 celdas x 25 líneas) para impresora o línea braille |
| Portal OCR | PDFs escaneados y fotos se convierten en texto accesible DENTRO del dispositivo (Tesseract.js): el documento nunca sale a un servidor |
| Convertir a braille | Cualquier texto, PDF o imagen se convierte a braille boliviano: descarga .BRF para impresora braille o GUÍA DE REGLETA Y PUNZÓN (celdas en espejo y en orden de marcado) para transcribir a mano con una regleta de 10 dólares, sin saber braille |
| Modo Simplificado | Lectura Fácil según las pautas de la norma UNE 153101, con glosario cívico y pictogramas (banco propio offline + ARASAAC) |
| Propuestas cívicas | Formulario guiado con dictado por voz en cada campo; genera un documento formal y lo envía por correo o WhatsApp |
| Middleware de texto | Expande abreviaturas (Art., C.P.E.) y corrige lenguaje con @ o x que rompe los lectores de pantalla |
| PWA offline | Todo funciona sin conexión después de la primera visita; los borradores nunca se pierden |

## Cómo ejecutarla

Es una PWA estática **sin paso de compilación**. Tres opciones:

```bash
# Opción 1: con Node
npx http-server plataforma

# Opción 2: con Python
cd plataforma && python -m http.server 8080

# Opción 3: publicar gratis
# Suba la carpeta plataforma/ a GitHub Pages, Netlify o Cloudflare Pages. Listo.
```

Después abra `http://localhost:8080`. Para probar el núcleo lógico:

```bash
node plataforma/test/test-nucleo.js
```

## Cómo lanzar JOPÓI en su región o país

Edite `plataforma/js/config.js` (nombre, parlamento, correos, idioma) y reemplace `plataforma/data/leyes.json` con los documentos de su región. Guía completa en [docs/GUIA-FORK.md](docs/GUIA-FORK.md).

## Estándares que sigue

- WCAG 2.2, con contraste 10.9 a 1 (supera el nivel AAA de 7 a 1) en toda la interfaz.
- Norma UNE 153101:2018 EX de Lectura Fácil.
- Braille Ready Format (BRF) según la especificación de la Library of Congress.
- Signografía braille española grado 1 (tradición ONCE y Comisión Braille Española).
- Ley boliviana 223 (discapacidad), Ley 341 (participación) y CDPD de la ONU, artículos 9, 21 y 29, como marco de exigibilidad.

## Estructura

```
JOPOI/
├── README.md                  <- este archivo
├── PROMPT-MAESTRO-JOPOI-V2.md <- el prompt de ingeniería mejorado
├── docs/
│   ├── GUIA-FORK.md           <- cómo replicar en otro país
│   └── ACCESIBILIDAD.md       <- decisiones y lista de verificación
└── plataforma/                <- la aplicación completa (publicable tal cual)
    ├── index.html             <- feed legislativo
    ├── documento.html         <- lector accesible
    ├── ocr.html               <- digitalizador de documentos
    ├── convertir.html         <- conversor a braille (BRF + guía de regleta)
    ├── propuestas.html        <- redacción de propuestas
    ├── ajustes.html           <- perfil sensorial
    ├── acerca.html            <- filosofía y derechos
    ├── css/jopoi.css          <- paleta verde #004d00 y blanco, sin animaciones
    ├── js/                    <- motores (braille, voz, OCR, lectura fácil...)
    ├── data/leyes.json        <- los documentos legislativos de la instancia
    ├── i18n/                  <- diccionarios es, en, gn (guaraní)
    ├── test/test-nucleo.js    <- pruebas de los motores
    ├── sw.js                  <- funcionamiento sin conexión
    └── manifest.webmanifest   <- instalable como aplicación
```

## Licencia

MIT. Úselo, cámbielo, tradúzcalo. La democracia accesible no tiene dueño.
