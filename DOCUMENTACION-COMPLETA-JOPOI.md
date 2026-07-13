# JOPÓI. Documentación completa del proyecto y de la plataforma

> Documento maestro: qué es JOPÓI, qué se construyó, cómo funciona por dentro, qué tecnología usa y qué estándares cumple.
> Sirve para tres cosas: responder preguntas técnicas de evaluadores y donantes, permitir que otra organización replique la plataforma, y dejar constancia de las decisiones de diseño y sus razones.

---

## 1. Qué es JOPÓI

**Jopói** es una palabra guaraní: intercambio recíproco, dar con las dos manos abiertas esperando recibir de vuelta.

JOPÓI es una **infraestructura cívica digital de código abierto** que permite a la juventud, y en primer lugar a las personas ciegas, neurodivergentes y con baja visión, **leer las leyes de su región y presentar propuestas formales al parlamento sin intermediarios**.

Nace en Santa Cruz, Bolivia, para dialogar con la Asamblea Legislativa Departamental, y está diseñada desde el primer día para que cualquier organización del mundo la clone y lance su propia democracia accesible **editando un solo archivo** (`plataforma/js/config.js`).

### El problema que ataca

Un parlamento publica sus leyes en PDF escaneado. Un PDF escaneado es una imagen: para un lector de pantalla no contiene una sola letra. La persona ciega no tiene "dificultad" para leer la ley; tiene **cero acceso** a la ley. El mismo documento, con jerga jurídica y párrafos de 300 palabras, expulsa también a las personas neurodivergentes y con discapacidad intelectual. La barrera no está en el cuerpo de la persona: está en el formato del Estado.

### La filosofía: Reciprocidad Democrática

Rechazamos la inclusión como caridad. La plataforma **no le pide a la persona que se adapte al sistema: obliga al sistema a hablar** en voz, en braille, en Lectura Fácil y en pictogramas.

El orden de prioridad del diseño es irrompible y ningún cambio puede invertirlo:

1. **Personas sin capacidad visual** (lector de pantalla y línea braille).
2. **Personas neurodivergentes** (bloques cortos, Lectura Fácil, cero distracciones).
3. **Personas con baja visión** (alto contraste, letra grande, espaciado amplio).

La reciprocidad es literal y bidireccional: la ley entra en formato accesible **hacia** la persona (feed, voz, braille, lectura fácil) y la propuesta de la persona sale en formato formal **hacia** la institución (documento de propuesta ciudadana con base legal citada). No es una app de lectura: es un canal de ida y vuelta.

---

## 2. Qué se construyó (módulos)

| Módulo | Archivo | Qué resuelve |
|---|---|---|
| **Feed legislativo** | `index.html` + `js/feed.js` | Leyes y proyectos en texto puro, cronológicos, con buscador dictable por voz |
| **Lector de documentos** | `documento.html` + `js/documento.js` | Bloques cortos, voz por bloque, resaltado de lectura, marco legal del derecho a la información al pie |
| **Motor braille** | `js/braille.js` | Braille español grado 1 en pantalla, exportación `.BRF` para impresora braille y **guía de regleta y punzón** para transcripción manual |
| **Portal OCR** | `ocr.html` + `js/ocr.js` | PDFs escaneados y fotos se convierten en texto accesible **dentro del dispositivo**; el documento nunca sale a un servidor |
| **Conversor a braille** | `convertir.html` + `js/convertir.js` | Cualquier texto, PDF o imagen se convierte a braille: descarga `.BRF` o guía de regleta |
| **Modo Simplificado** | `js/lectura-facil.js` | Lectura Fácil según norma UNE 153101, con glosario cívico de jerga legal |
| **Pictogramas** | `js/pictogramas.js` | Banco propio SVG offline + ARASAAC (más de 12.500 pictogramas, CC BY-NC-SA) |
| **Propuestas cívicas** | `propuestas.html` + `js/propuestas.js` | Formulario guiado paso a paso, dictado por voz en cada campo, genera documento formal y lo envía por correo o WhatsApp |
| **Voz (TTS)** | `js/tts.js` | Lee en voz alta cualquier texto de la plataforma, eligiendo automáticamente la voz más natural del dispositivo |
| **Dictado (STT)** | `js/stt.js` | Añade un botón de micrófono a **cada** campo de texto de la plataforma, de forma automática |
| **Middleware de texto** | `js/middleware.js` | Expande abreviaturas (Art., C.P.E.) y corrige lenguaje con @ o x que rompe los lectores de pantalla |
| **Núcleo de accesibilidad** | `js/a11y.js` | Barra de herramientas en todas las páginas, perfiles sensoriales, atajos de teclado, registro del service worker |
| **Perfil sensorial** | `ajustes.html` + `js/ajustes.js` | La persona elige su perfil una vez y toda la plataforma se adapta |
| **PWA offline** | `sw.js` + `manifest.webmanifest` | Todo funciona sin conexión después de la primera visita; los borradores nunca se pierden |

---

## 3. La parte técnica

### 3.1 Arquitectura general

**PWA estática, JavaScript puro (vanilla), sin paso de compilación, sin framework, sin dependencias de build.**

No hay React, ni Next.js, ni Vue, ni Webpack, ni npm install obligatorio. El HTML que se sirve **es** el HTML final. Se publica subiendo la carpeta `plataforma/` a cualquier hosting estático.

Esto no es una limitación de recursos: es una decisión de accesibilidad y de sostenibilidad, con cuatro razones documentadas:

1. **Los lectores de pantalla no esperan hidrataciones.** Con un framework, el lector de pantalla puede anunciar un DOM que cambia debajo de él. Aquí el DOM ya está.
2. **Una ONG sin equipo técnico puede publicarla en GitHub Pages en una tarde.** Cero build, cero pipeline, cero conocimiento de Node.
3. **Menos dependencias = menos superficie de fallo** en contextos de baja conectividad y equipos antiguos.
4. **Todo el procesamiento pesado corre en el dispositivo:** soberanía de datos y costo cero por uso.

```
Navegador de la persona
├── HTML semántico (landmarks, encabezados jerárquicos, aria-live)
├── CSS bicolor sin animaciones
└── Motores JS (sin dependencias, cargados como <script>)
    ├── middleware.js   -> TODO texto pasa por aquí antes de leerse o imprimirse
    ├── braille.js      -> traducción + .BRF + guía de regleta
    ├── tts.js          -> voz (Web Speech API)
    ├── stt.js          -> dictado (Web Speech API)
    ├── lectura-facil.js-> simplificación en 3 niveles
    ├── pictogramas.js  -> banco local SVG + ARASAAC
    └── a11y.js         -> barra, perfiles, service worker
```

Bibliotecas externas: solo dos, cargadas **bajo demanda desde CDN** y solo en el módulo OCR (Tesseract.js y pdf.js). El resto de la plataforma funciona sin ellas.

### 3.2 Motor braille (desarrollo propio, sin liblouis)

`plataforma/js/braille.js`. 306 líneas, cero dependencias, funciona en navegador y en Node.

- **Signografía:** braille español grado 1 (integral), según la tradición de la ONCE y la Comisión Braille Española. Incluye vocales acentuadas (á = 12356, é = 2346, í = 34, ó = 346, ú = 23456), ü = 1256, ñ = 12456, y los signos de apertura de interrogación y exclamación.
- **Signo de número** (puntos 3456) antes de toda cifra, con la serie a-j; el punto y la coma dentro de una cifra (1.500) no cortan el número.
- **Signo de mayúscula** (puntos 46).
- **Doble salida:** Braille ASCII (para el archivo) y braille Unicode U+2800 (para mostrarlo en pantalla y que una línea braille conectada lo lea).
- **Exportación `.BRF`** (Braille Ready Format) conforme a la especificación de la Library of Congress (fdd000551): páginas de **40 celdas por línea y 25 líneas**, codificadas en Braille ASCII norteamericano, con salto de página mediante Form Feed. Es el formato que aceptan las impresoras braille (embossers) y las líneas braille del mundo entero. El ajuste de línea nunca corta palabras.

**Modo regleta y punzón** (`generarGuiaRegleta`): la innovación que ninguna biblioteca estándar ofrece. Con una regleta se escribe **por el reverso del papel**, así que al darlo vuelta los puntos quedan en el orden correcto. Eso obliga a escribir cada celda en **espejo horizontal** (el punto 1 pasa a ser el 4, el 2 el 5, el 3 el 6) y en orden invertido (de derecha a izquierda). El motor genera una guía de texto plano que entrega, para cada línea: la **vista de lectura** (cómo quedará el papel al darlo vuelta) y la **secuencia de escritura** celda por celda, con los puntos ya convertidos al espejo.

Resultado: una persona que **no sabe braille** puede transcribir una ley a braille con una regleta de 10 dólares y papel de 120 gramos, siguiendo instrucciones numeradas. Esto desacopla el acceso al braille del acceso a una impresora braille de miles de dólares.

### 3.3 Voz: síntesis (TTS) y dictado (STT)

Ambos usan la **Web Speech API nativa del navegador**. Cero API de pago, cero costo por uso, cero envío del texto de la persona a un servidor de terceros.

**TTS (`js/tts.js`):** Los sistemas operativos modernos (Windows 11, Android, iOS) ya traen voces neuronales en español de calidad casi humana. El motor las **puntúa y elige la mejor automáticamente** con la heurística `puntuarVoz`:

- +50 si el idioma coincide con el configurado (`es-BO` por defecto).
- +30 si es es-419, es-US o es-MX (español latinoamericano).
- +20 si es cualquier variante de español.
- +25 si el nombre declara `natural`, `neural`, `online`, `premium` o `enhanced` (señal de voz neuronal frente a voz robótica antigua).
- +5 si es una voz remota (suelen ser neuronales).

Además resuelve tres problemas reales de la Web Speech API: fragmenta los textos largos en bloques de 260 caracteres (Chrome corta las emisiones de más de unos 15 segundos), espera 120 ms tras `cancel()` antes de `speak()` (si no, la voz se pierde en silencio en Chrome), y resalta visualmente el bloque que está leyendo (apoyo simultáneo para baja visión y neurodivergencia).

El campo `apiVozNeuronal` en `config.js` queda listo como enchufe opcional para una API neuronal externa, pero está **vacío por diseño**: la voz del sistema operativo es gratuita, funciona sin conexión y no expone el texto de nadie.

**STT (`js/stt.js`):** usa `SpeechRecognition`. Recorre el DOM y añade automáticamente un **botón de micrófono a cada `textarea`, `input[type=text]` e `input[type=search]`** de toda la plataforma. La persona dicta y el texto se escribe solo. Si el navegador no lo soporta (Firefox aún no), el botón lo comunica de forma accesible en lugar de fallar en silencio.

### 3.4 OCR: Tesseract.js dentro del dispositivo

`plataforma/js/ocr.js`. Las instituciones publican las leyes como PDF escaneado, es decir, como imagen invisible para un lector de pantalla. Aquí la ciudadanía sube el archivo y el texto se extrae **con Tesseract.js en el propio navegador**.

- **PDF:** `pdf.js` dibuja cada página en un `<canvas>` a escala 2 y la pasa al OCR (límite prudente de 30 páginas por memoria).
- **Imagen** (foto de una gaceta, captura de pantalla): va directo al OCR con el modelo de español (`spa`).
- El texto extraído se limpia (se reunen los guiones de corte de línea), pasa por el middleware y se abre en el lector accesible con voz, braille y todo.

**Por qué local y no una API de OCR en la nube:** un PDF puede contener datos personales o una denuncia sensible. Con OCR en el navegador el documento **nunca viaja a un servidor**: privacidad por arquitectura, no por promesa. Y el costo por documento es cero, condición de sostenibilidad para una plataforma sin fines de lucro.

### 3.5 Middleware de texto: el filtro obligatorio

`plataforma/js/middleware.js`. **Todo** texto que entra a la plataforma (feed, OCR, base de datos, propuestas) pasa por este filtro **antes** de llegar al lector de pantalla, al motor de voz o al motor braille. Hace tres cosas:

1. **Expande abreviaturas** para que la voz no deletree. `Art. 5` se convierte en `Artículo 5`; `C.P.E.` en `Constitución Política del Estado`; `D.S. Nº 1893` en `Decreto Supremo número 1893`. Incluye siglas jurídicas bolivianas (A.L.D., G.A.M., G.A.D., R.M.) y abreviaturas de redacción legislativa (Inc., Num., Cap., Tít., Párr., Disp.).
2. **Corrige el lenguaje con @ y x.** Un lector de pantalla lee "tod@s" como "tod arroba ese": lo vuelve incomprensible. El middleware lo reemplaza por dobletes explícitos que sí se pronuncian ("todas y todos", "las y los", "niñas y niños"), con un diccionario de casos frecuentes más un patrón genérico de respaldo. Hay una prueba explícita de que no rompe palabras con x legítima ("rayos x" queda intacto).
3. **Fragmenta el texto largo en bloques** de máximo 320 caracteres sin cortar oraciones, respetando los párrafos originales. Es la estructura que hace legible un texto legal para una persona neurodivergente.

### 3.6 Lectura Fácil: tres niveles, la máquina nunca sustituye a la persona

`plataforma/js/lectura-facil.js`. Sigue la norma **UNE 153101:2018 EX**, la primera norma técnica mundial de Lectura Fácil: oraciones cortas, una idea por oración, palabras frecuentes, glosario, viñetas.

La norma **exige validación con personas usuarias reales**. Por eso el motor tiene una jerarquía honesta de tres niveles:

1. **Versión validada:** si el documento trae una versión de Lectura Fácil redactada y validada por personas con discapacidad intelectual, se muestra esa. La máquina nunca reemplaza la validación humana.
2. **API de IA (opcional):** si el administrador configuró un endpoint en `config.js` (por ejemplo una función serverless que llama a la API de Claude), se pide ahí la simplificación, y el resultado se muestra **marcado como pendiente de validación humana**.
3. **Motor local de respaldo (offline):** reglas deterministas que acortan oraciones, cortan los conectores largos en punto y aparte, y reemplazan jerga por lenguaje común ("con la finalidad de" pasa a "para", "coadyuvar" a "ayudar", "precautelar" a "proteger", "suscribir" a "firmar"). Siempre disponible, incluso sin internet.

**Glosario cívico:** un diccionario de 26 términos de jerga legal traducidos a palabras comunes ("fiscalizar" = "vigilar y controlar el trabajo de las autoridades"; "quórum" = "cantidad mínima de personas para poder votar"; "ajustes razonables" = "cambios necesarios para que una persona con discapacidad participe en igualdad"). El motor detecta cuáles aparecen en el documento y los explica al pie.

### 3.7 Pictogramas: dos capas

`plataforma/js/pictogramas.js`.

1. **Sin conexión (siempre funciona):** banco propio de 17 pictogramas SVG bicolor (verde oscuro y blanco) dibujados dentro del archivo, con un diccionario de sinónimos que mapea el vocabulario legislativo real a los temas (ley, votar, árbol, agua, educación, salud, dinero, transporte, casa, trabajo, personas, hablar, documento, joven, justicia, internet, accesibilidad). Cada uno lleva `role="img"`, `aria-label` y `<title>`.
2. **Con conexión:** pictogramas de **ARASAAC** (arasaac.org), el banco mundial de comunicación aumentativa: más de 12.500 pictogramas, 25 idiomas, licencia gratuita CC BY-NC-SA. El service worker los guarda en caché para que la próxima vez existan sin internet.

**Por qué ARASAAC y no imágenes generadas por IA:** un pictograma estable y convencional, diseñado y validado por profesionales, **ancla significado**. Una imagen generada distinta cada vez, no. La consistencia es la función.

### 3.8 Propuestas cívicas: el canal de vuelta

`plataforma/js/propuestas.js`. Formulario guiado, una pregunta a la vez (reduce la carga cognitiva), con dictado por voz en cada campo. Seis campos: nombre, comunidad, problema, propuesta, beneficiarios, pedido concreto.

- **Autoguardado en `localStorage` en cada tecla.** Si se corta la luz o el internet, no se pierde nada. Este es un requisito de contexto boliviano, no un lujo.
- Al generar, arma un **documento formal de propuesta ciudadana** con encabezado institucional, fecha en letras, destinatario (el parlamento configurado) y un cierre que **invoca la base legal**: el derecho a la participación reconocido por la Constitución y por la Ley 341 de Participación y Control Social, con solicitud de respuesta formal.
- Salidas: enviar por **correo** (`mailto:` con asunto y cuerpo prellenados al correo institucional configurado), enviar por **WhatsApp** (`wa.me`), copiar al portapapeles, descargar como `.txt`, o **descargar en braille `.BRF`**.

### 3.9 Núcleo de accesibilidad y perfiles sensoriales

`plataforma/js/a11y.js`.

- **Barra de accesibilidad en todas las páginas:** reducir y aumentar letra, espaciado amplio, modo oscuro, "leer esta página en voz alta", detener la voz.
- **Perfiles sensoriales:** la persona elige su perfil **una sola vez** y toda la plataforma se adapta.
  - *Ceguera:* la plataforma ya es semántica de origen; no necesita más.
  - *Baja visión:* escala 1.4, espaciado amplio, tema oscuro.
  - *Neurodivergencia:* espaciado amplio y apertura automática de los documentos en Modo Simplificado.
- **Preferencias persistentes** en `localStorage`, aplicadas **antes del primer pintado** para evitar destellos.
- **Atajos de teclado globales:** Alt+1 feed, Alt+2 OCR, Alt+3 propuestas, Alt+4 ajustes, Alt+0 leer la página en voz alta.
- El texto alternativo de cada imagen se refleja como tooltip visible (apoyo para baja visión).

### 3.10 Funcionamiento sin conexión (PWA)

`plataforma/sw.js`, service worker versión `jopoi-v4`.

- **Precarga al instalar:** las 7 páginas, el CSS, los 12 archivos JS, los datos legislativos, los iconos y el manifiesto.
- **Datos legislativos (`/data/`):** *red primero, caché de respaldo*. Con internet se ven las leyes nuevas; sin internet, las guardadas.
- **Archivos de la plataforma:** *red primero, caché de respaldo*. Así toda actualización del código llega de inmediato y la caché solo entra en acción cuando no hay conexión.
- **Recursos externos** (CDN de OCR, imágenes de ARASAAC): *caché primero*, porque no cambian y así quedan disponibles sin conexión.
- `manifest.webmanifest` la hace **instalable como aplicación** en el teléfono, con icono maskable.

### 3.11 Diseño visual

`plataforma/css/jopoi.css`. Paleta estricta de dos colores: **verde #004d00 y blanco**.

- **Contraste 10.9 a 1**, muy por encima del nivel AAA de WCAG (7 a 1).
- Al ser bicolor estricto, **ningún estado depende del color**: los estados se marcan con relleno, borde, subrayado y texto. Una persona con daltonismo no pierde información.
- **Cero animaciones** (regla CSS global con `!important`).
- Una sola columna. Letra base de 20 píxeles, escalable hasta 44 desde la barra. Foco visible de 4 píxeles. Objetivos táctiles de 48 píxeles.

### 3.12 Internacionalización

`plataforma/i18n/`: diccionarios `es.json` (español), `en.json` (inglés) y `gn.json` (guaraní).

El guaraní está **explícitamente pendiente de trabajo con hablantes**, y el archivo lo dice: nada de traducción automática sin validación comunitaria. La misma regla que gobierna la Lectura Fácil gobierna el idioma.

---

## 4. Pruebas

`plataforma/test/test-nucleo.js`. Se ejecuta con `node plataforma/test/test-nucleo.js`, sin instalar nada.

Cubre los tres módulos con lógica pura:

- **Middleware:** expansión de Art., C.P.E., D.S., Nº; corrección de tod@s, lxs, niñ@s; ausencia de arrobas residuales; **no romper "rayos x"**; fragmentación sin cortar oraciones.
- **Braille:** "braille" produce el ASCII `BRAILLE`; "b" produce `⠃` en Unicode; la mayúscula produce el signo correspondiente; el número produce el signo `#` y usa la serie a-j; la **ó** española da puntos 346; la **ñ** española da puntos 12456; ninguna línea del `.BRF` supera 40 celdas; hay salto de página cada 25 líneas.
- **Modo regleta:** los pares espejo conocidos del braille se verifican uno por uno (e↔i, d↔f, h↔j); el espejo doble vuelve al original; la envoltura a 28 celdas respeta el límite; la guía invierte el orden y espeja las celdas.
- **Lectura fácil:** produce viñetas; simplifica "con la finalidad de"; detecta jerga en el glosario; marca el origen local con su aviso; **prefiere la versión humana validada** cuando existe.

---

## 5. Estándares que cumple

- **WCAG 2.2**, con contraste 10.9 a 1 (supera el nivel AAA de 7 a 1) en toda la interfaz.
- **UNE 153101:2018 EX** de Lectura Fácil.
- **Braille Ready Format (BRF)** según la especificación de la Library of Congress (fdd000551).
- **Signografía braille española grado 1** (tradición ONCE y Comisión Braille Española).
- **Ley boliviana 223** (Ley General para Personas con Discapacidad, 2012), **Ley 341** (Participación y Control Social) y la **Convención sobre los Derechos de las Personas con Discapacidad de la ONU, artículos 9, 21 y 29**, como marco de exigibilidad citado al pie de cada documento y dentro de cada propuesta ciudadana.

**Lista de verificación antes de cada publicación:**

- [ ] Navegar toda la plataforma solo con Tab, Enter y flechas.
- [ ] Recorrerla completa con NVDA (gratuito) y confirmar que cada control se anuncia con nombre y estado.
- [ ] Zoom del navegador al 200 por ciento: sin pérdida de contenido ni desplazamiento horizontal.
- [ ] Exportar un `.BRF` y abrirlo en un visor braille (o imprimirlo) para revisar la signografía.
- [ ] Modo avión: el feed, el lector, las propuestas y los ajustes deben seguir funcionando.
- [ ] Pasar el validador automático (axe DevTools o Lighthouse, meta 100 en accesibilidad), sabiendo que lo automático solo detecta una parte: **la prueba con personas reales manda**.

---

## 6. Cómo se ejecuta y cómo se publica

Es una PWA estática **sin paso de compilación**.

```bash
# Opción 1: con Node
npx http-server plataforma

# Opción 2: con Python
cd plataforma && python -m http.server 8080

# Opción 3: el servidor local incluido
node servidor-local.js
```

Después se abre `http://localhost:8080`. Para probar el núcleo lógico:

```bash
node plataforma/test/test-nucleo.js
```

**Publicación:** subir la carpeta `plataforma/` a GitHub Pages, Netlify, Cloudflare Pages o Vercel. El repositorio incluye:

- `vercel.json`, que apunta a `plataforma/` como directorio de salida y fuerza `Cache-Control: no-cache` sobre `sw.js` (para que una actualización del service worker llegue siempre).
- `.github/workflows/publicar-pages.yml`, que publica automáticamente en GitHub Pages.

---

## 7. Cómo replicarla en otra región o país

Ese es el punto entero del proyecto. Se editan **dos archivos**:

1. **`plataforma/js/config.js`**, el único archivo que una organización debe tocar:
   - `nombreInstancia`, `region`, `parlamento`.
   - `idioma` ('es', 'en', 'gn').
   - `vozIdioma` y `dictadoIdioma` (por defecto `es-BO`; degrada solo a es-419 o es-ES si no existe).
   - `correoInstitucion` y `whatsappInstitucion`: los destinos reales de las propuestas ciudadanas.
   - `apiLecturaFacil` y `apiVozNeuronal`: opcionales, vacíos por defecto.
   - `marcoLegal`: las leyes que **esa** instancia invoca. En Bolivia son la Ley 223 y la CDPD; en otro país serán otras.
2. **`plataforma/data/leyes.json`**: los documentos legislativos de esa región.

Guía completa en `docs/GUIA-FORK.md`. Licencia **MIT**: úselo, cámbielo, tradúzcalo.

---

## 8. Limitaciones conocidas (honestas)

Documentarlas es parte de la credibilidad del proyecto. No se ocultan.

- **El braille exportado es grado 1 (integral).** La estenografía española (grado 2) requiere una tabla de contracciones que está en la hoja de ruta. Para textos legales, el grado 1 es legible y correcto.
- **El dictado por voz depende del navegador.** Chrome y Edge lo soportan; Firefox aún no. Requiere conexión en la mayoría de los casos.
- **Las voces del navegador varían según el dispositivo.** En equipos antiguos la voz puede sonar menos natural. Es el precio de no cobrar por API y de no enviar el texto de nadie a un tercero.
- **La traducción al guaraní está pendiente** de trabajo con hablantes. El archivo `i18n/gn.json` existe para ese propósito y explica la regla: nada de traducción automática sin validación comunitaria.
- **El OCR tiene un límite de 30 páginas por documento**, impuesto por la memoria disponible en un teléfono de gama media.

---

## 9. Estructura del repositorio

```
JOPOI/
├── README.md                       <- presentación del proyecto
├── DOCUMENTACION-COMPLETA-JOPOI.md <- este archivo
├── PROMPT-MAESTRO-JOPOI-V2.md      <- el prompt de ingeniería mejorado
├── LICENSE                         <- MIT
├── vercel.json                     <- despliegue en Vercel
├── servidor-local.js               <- servidor de desarrollo sin dependencias
├── .github/workflows/
│   └── publicar-pages.yml          <- despliegue automático en GitHub Pages
├── docs/
│   ├── GUIA-FORK.md                <- cómo replicar en otro país
│   └── ACCESIBILIDAD.md            <- decisiones, razones y lista de verificación
├── FOTOS/                          <- evidencia (COSP 19, preparación, sesiones espejo)
└── plataforma/                     <- la aplicación completa (publicable tal cual)
    ├── index.html                  <- feed legislativo
    ├── documento.html              <- lector accesible
    ├── ocr.html                    <- digitalizador de documentos
    ├── convertir.html              <- conversor a braille (BRF + guía de regleta)
    ├── propuestas.html             <- redacción de propuestas
    ├── ajustes.html                <- perfil sensorial
    ├── acerca.html                 <- filosofía y derechos
    ├── css/jopoi.css               <- paleta verde #004d00 y blanco, sin animaciones
    ├── js/                         <- los motores
    │   ├── config.js               <- EL ÚNICO ARCHIVO A EDITAR PARA REPLICAR
    │   ├── middleware.js           <- filtro obligatorio de todo texto
    │   ├── braille.js              <- traducción, .BRF, guía de regleta
    │   ├── tts.js                  <- voz
    │   ├── stt.js                  <- dictado
    │   ├── lectura-facil.js        <- simplificación en 3 niveles
    │   ├── pictogramas.js          <- banco local + ARASAAC
    │   ├── a11y.js                 <- barra, perfiles, atajos, service worker
    │   ├── feed.js, documento.js, ocr.js, convertir.js, propuestas.js, ajustes.js
    ├── data/leyes.json             <- los documentos legislativos de la instancia
    ├── i18n/                       <- diccionarios es, en, gn (guaraní)
    ├── test/test-nucleo.js         <- pruebas de los motores
    ├── img/                        <- iconos SVG
    ├── sw.js                       <- funcionamiento sin conexión
    └── manifest.webmanifest        <- instalable como aplicación
```

---

## 10. Resumen para evaluadores técnicos

Si alguien pregunta **"¿qué hay realmente detrás de JOPÓI?"**, la respuesta en cinco líneas:

1. **Braille:** motor propio en JavaScript (`braille.js`), signografía española grado 1, exportación `.BRF` conforme a la Library of Congress, más un modo de regleta y punzón con celdas espejadas que ninguna biblioteca estándar ofrece. **No usa liblouis.**
2. **Voz:** Web Speech API nativa del navegador (`SpeechSynthesis`), con una heurística de puntuación que elige automáticamente la voz neuronal más natural del dispositivo, priorizando es-BO. **No usa Polly, Azure ni Google TTS.** Costo cero, funciona offline, no envía el texto de nadie a un tercero.
3. **OCR:** Tesseract.js más pdf.js, corriendo **dentro del navegador**. El documento nunca sale del dispositivo.
4. **Aplicación:** PWA estática de JavaScript puro, **sin framework y sin paso de compilación**, servida como archivos estáticos. Es una decisión de accesibilidad, no una limitación.
5. **Todo lo anterior es gratuito, offline y auditable.** Licencia MIT. La democracia accesible no tiene dueño.
