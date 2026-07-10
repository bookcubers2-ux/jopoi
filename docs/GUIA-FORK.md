# Guía de fork: lance JOPÓI en su región o país

JOPÓI fue diseñada para replicarse. No necesita saber programar para los pasos 1 a 4; para el 5 y 6 conviene apoyo técnico básico.

## Paso 1. Copie el repositorio

Haga fork en GitHub (o descargue la carpeta). Todo lo que necesita está en `plataforma/`: no hay base de datos, no hay servidor, no hay compilación.

## Paso 2. Configure su instancia (un solo archivo)

Edite `plataforma/js/config.js`:

```js
nombreInstancia: 'JOPÓI Nairobi',
region: 'Nairobi, Kenia',
parlamento: 'Nairobi City County Assembly',
idioma: 'en',
vozIdioma: 'en-KE',
dictadoIdioma: 'en-KE',
correoInstitucion: 'clerk@nairobiassembly.go.ke',
whatsappInstitucion: '254700000000',
marcoLegal: ['Persons with Disabilities Act (Kenya, 2003)', 'CRPD, articles 9, 21 and 29']
```

## Paso 3. Cargue sus documentos legislativos

Reemplace el contenido de `plataforma/data/leyes.json`. Cada documento es un objeto:

```json
{
  "id": "identificador-unico",
  "titulo": "Nombre completo de la ley o proyecto",
  "tipo": "Ley departamental",
  "estado": "vigente",
  "fecha": "2026-01-15",
  "temas": ["agua", "salud"],
  "resumen": "Una o dos oraciones claras.",
  "texto": "Artículo 1. ... (texto completo, párrafos separados por línea en blanco)",
  "lecturaFacil": ["Oración corta.", "Otra oración corta."],
  "fuente": "Gaceta oficial correspondiente"
}
```

Reglas de oro:

- `lecturaFacil` debe redactarse siguiendo la norma UNE 153101 y, siempre que sea posible, **validarse con personas con discapacidad intelectual**. Si el campo no existe, la plataforma genera un resumen automático de respaldo y lo dice honestamente.
- Marque con `"demo": true` cualquier documento de ejemplo, para que la plataforma avise que no es un expediente real.

## Paso 4. Traduzca (si su idioma no es el español)

- Copie `plataforma/i18n/es.json` como plantilla de claves.
- Traduzca las páginas HTML (los textos están escritos directamente en el marcado para que los lectores de pantalla nunca dependan de JavaScript).
- Cambie `lang="es"` en cada HTML al código de su idioma: los lectores de pantalla eligen la voz según ese atributo.
- Para lenguas originarias sin voz sintética disponible: la plataforma seguirá mostrando el texto; documente la limitación y busque hablantes para validar las traducciones. Nunca use traducción automática sin validación comunitaria.

## Paso 5. Publique gratis

Cualquiera de estas opciones sirve y cuesta cero:

- **GitHub Pages**: Settings, Pages, servir la carpeta `plataforma/`.
- **Netlify o Cloudflare Pages**: arrastre la carpeta `plataforma/`.

Requisito único: HTTPS (las tres opciones lo dan solas). Sin HTTPS no funcionan el service worker (modo offline) ni el micrófono.

## Paso 6. Opcional: active la Lectura Fácil con inteligencia artificial

Por defecto el Modo Simplificado usa: primero la versión humana del JSON, luego un motor local de reglas. Si quiere resúmenes con IA generativa:

1. Cree una función serverless (Cloudflare Workers y Netlify Functions tienen nivel gratuito) que reciba `{titulo, texto}` y devuelva `{"vinetas": ["...", "..."]}`.
2. Dentro de esa función llame a la API de su proveedor de IA (por ejemplo, la API de Claude) con una instrucción de Lectura Fácil según UNE 153101. La clave de la API vive en el servidor, nunca en el navegador.
3. Ponga la URL en `config.js`, campo `apiLecturaFacil`.

La plataforma marcará esos resúmenes como "generados con inteligencia artificial, pendientes de validación humana". Esa honestidad no es negociable.

## Paso 7. Valide con la comunidad

Antes del lanzamiento público:

- Pruebe la plataforma completa con al menos una persona usuaria de NVDA o de línea braille, una persona con baja visión y una persona con discapacidad intelectual o neurodivergente.
- Imprima un .BRF exportado en una impresora braille real y pida a una persona lectora de braille que lo revise.
- Ajuste el glosario cívico (`js/lectura-facil.js`) con los términos legales propios de su país.

## Qué NO debe romper al modificar

- La paleta verde #004d00 y blanco puede cambiarse por la de su organización, pero el contraste resultante debe mantenerse en 7 a 1 o más.
- Nada de animaciones, carruseles ni ventanas emergentes.
- Ningún texto informativo puede existir solo como imagen.
- Todo elemento interactivo debe poder usarse solo con teclado.
