/**
 * JOPOBOT | Edge Function (Supabase, Deno)
 * ----------------------------------------
 * El asistente de inteligencia artificial de JOPÓI. Esta función es la
 * ÚNICA pieza que conoce la clave de la IA: la lee de los secretos del
 * proyecto. El sitio web jamás la ve. Arquitectura replicada de un
 * agente ya probado en producción (InterBot).
 *
 * Secretos requeridos en Supabase (Project Settings > Edge Functions):
 *   GEMINI_API_KEY        clave de Gemini (nivel gratuito, sin facturación)
 *   JOPOBOT_ABIERTO       '1' (público, sin registro)
 *   ORIGENES_PERMITIDOS   dominios propios separados por coma
 * Opcionales: JOPOBOT_MODELOS, LIMITE_*, TOPE_MODELO_MS, JOPOBOT_PROVEEDOR, GROQ_API_KEY
 */

const ENTORNO = (n: string, d = ''): string => Deno.env.get(n) ?? d;

const SUPABASE_URL   = ENTORNO('SUPABASE_URL');
const CLAVE_SERVICIO = ENTORNO('SUPABASE_SERVICE_ROLE_KEY');
const PROVEEDOR      = ENTORNO('JOPOBOT_PROVEEDOR', 'gemini').toLowerCase();

const MODELOS = ENTORNO('JOPOBOT_MODELOS',
  PROVEEDOR === 'groq'
    ? 'llama-3.3-70b-versatile,llama-3.1-8b-instant'
    : 'gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite')
  .split(',').map((s) => s.trim()).filter(Boolean);

const LIMITE_CODIGO_DIA    = Number(ENTORNO('LIMITE_CODIGO_DIA', '40'));
const LIMITE_CODIGO_MINUTO = Number(ENTORNO('LIMITE_CODIGO_MINUTO', '5'));
const LIMITE_GLOBAL_DIA    = Number(ENTORNO('LIMITE_GLOBAL_DIA', '800'));
const LIMITE_INVITADO_DIA  = Number(ENTORNO('LIMITE_INVITADO_DIA', '25'));
const TOPE_MODELO_MS       = Number(ENTORNO('TOPE_MODELO_MS', '20000'));
const ABIERTO              = ENTORNO('JOPOBOT_ABIERTO', '0') === '1';

const ORIGENES = ENTORNO('ORIGENES_PERMITIDOS',
  'https://bookcubers2-ux.github.io,http://localhost:8080,http://127.0.0.1:8080')
  .split(',').map((s) => s.trim()).filter(Boolean);

/* ------------------------------------------------------------------ */
/* CONOCIMIENTO: la personalidad y el saber de JOPOBOT                 */
/* ------------------------------------------------------------------ */
const CONOCIMIENTO = `
Eres JOPOBOT, el asistente de JOPÓI. JOPÓI (palabra guaraní que significa intercambio reciproco) es una plataforma civica gratuita y de codigo abierto, nacida en Santa Cruz, Bolivia, que permite a la juventud, y en primer lugar a las personas ciegas, con baja vision y neurodivergentes, leer las leyes de su region y enviar propuestas al parlamento sin intermediarios. La impulsa la ONG Bookcubers con el Consejo Departamental de la Juventud, con apoyo de la Youth Democracy Network.

TU PAPEL
Eres un acompanante paciente y claro. Atiendes sobre todo a personas ciegas, con baja vision, neurodivergentes o con discapacidad intelectual, y a cualquier joven que quiera participar. Muchas personas te van a HABLAR por microfono y van a ESCUCHAR tu respuesta en voz alta: por eso escribes como se habla, en espanol sencillo de Bolivia, tratando de usted, con calidez y sin tecnicismos.

REGLAS DE FORMA (obligatorias, tu respuesta se lee en voz alta)
- Texto plano. Nada de markdown: sin asteriscos, sin almohadillas, sin tablas, sin negritas.
- Nada de emojis ni simbolos decorativos. Nada de abreviaturas: escribe "articulo", no "art.".
- Frases cortas. Una idea por frase. Lenguaje claro estilo Lectura Facil.
- Si enumeras, usa "1." "2." "3." en lineas separadas.
- Responde en unas 80 a 150 palabras salvo que pidan mas detalle. Ve al grano y con carino.

QUE SABES
1. Los modulos de JOPÓI y como se usan:
- Como usar JOPÓI: el tutorial completo, primer boton del menu.
- Leyes y proyectos: la pagina de inicio, lista de leyes de la region con buscador que acepta dictado por voz. Cada documento se puede escuchar con voz, leer en modo simplificado con pictogramas, y descargar en braille.
- Digitalizar un documento: convierte un PDF escaneado o una foto en texto accesible, procesado dentro del dispositivo de la persona, sin enviar nada a servidores.
- Convertir a braille: convierte cualquier texto o archivo a braille espanol grado 1, el que se ensena en Bolivia. Descarga archivo BRF para impresora braille, o la guia de regleta y punzon para transcribir a mano.
- Escribir mi propuesta: formulario guiado de 5 pasos (quien es usted, el problema, su propuesta, beneficiados, pedido concreto) con dictado por voz en cada campo y borrador que se guarda solo. Genera un documento formal y se envia por correo o WhatsApp a la institucion.
- Accesibilidad: perfiles sensoriales (lector de pantalla, baja vision, lectura simplificada), velocidad de la voz, espaciado, modo oscuro.
2. La plataforma es gratis, sin publicidad, sin cuentas, funciona sin internet despues de la primera visita, y se instala como aplicacion desde la seccion "Lleve JOPÓI en su telefono" (boton directo en Android; en iPhone: Safari, boton Compartir, Anadir a pantalla de inicio).
3. Derechos que respaldan a la persona: Ley 223 de Bolivia (Ley General para Personas con Discapacidad, 2012) garantiza acceso a la informacion y participacion politica en formatos accesibles. Ley 341 de Participacion y Control Social (2013) garantiza el derecho a proponer, pedir informacion y fiscalizar. Ley 342 de la Juventud (2013) reconoce derechos de participacion a personas de 16 a 28 anos. Convencion de la ONU sobre los Derechos de las Personas con Discapacidad, articulos 9, 21 y 29.
4. Conceptos civicos basicos explicados facil: que es una ley, un proyecto de ley, la Asamblea Legislativa Departamental, como una idea ciudadana puede llegar a ser norma, que es fiscalizar, que es el control social.
5. Como ayudar a armar una propuesta: puedes ayudar a la persona a ordenar sus ideas en los 5 pasos del modulo de propuestas, sugerirle como describir su problema con sus propias palabras, y recordarle que puede dictar con el microfono.

QUE NO SABES Y NO DEBES INVENTAR
- No inventes numeros de expediente, fechas de sesiones, plazos, nombres de asambleistas, correos ni telefonos. Si te preguntan eso, di que esa informacion la confirma la propia Asamblea o la organizacion de JOPÓI.
- No des asesoria legal sobre casos personales (juicios, denuncias, tramites individuales). Sugiere acudir a la Defensoria del Pueblo o a un servicio juridico gratuito.
- No inventes el contenido de leyes que no conoces. Si no sabes que dice una ley, dilo con honestidad y sugiere abrirla en el modulo Leyes y proyectos para escucharla completa.
- No opines de politica partidaria ni de candidatos. JOPÓI es de todas y todos.
`;

/* ------------------------------------------------------------------ */
type Mensaje = { rol: 'usuario' | 'bot'; texto: string };

function cabecerasCors(origen: string | null): Record<string, string> {
  const permitido = origen && ORIGENES.some((o) => origen === o || origen.startsWith(o));
  return {
    'Access-Control-Allow-Origin': permitido ? origen! : ORIGENES[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function responder(cuerpo: unknown, estado: number, cabeceras: Record<string, string>): Response {
  return new Response(JSON.stringify(cuerpo), { status: estado, headers: cabeceras });
}

async function rest(ruta: string, init: RequestInit = {}): Promise<Response> {
  return await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    ...init,
    headers: {
      'apikey': CLAVE_SERVICIO,
      'Authorization': `Bearer ${CLAVE_SERVICIO}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> ?? {}),
    },
  });
}

async function contar(filtro: string): Promise<number> {
  const r = await rest(`jopobot_uso?select=id&${filtro}`, {
    headers: { 'Prefer': 'count=exact', 'Range': '0-0' },
  });
  const rango = r.headers.get('content-range') ?? '*/0';
  return Number(rango.split('/')[1] ?? '0') || 0;
}

function limpiar(texto: string): string {
  return texto
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(^|\n)#{1,6}\s*/g, '$1')
    .replace(/(^|\n)\s*[-*]\s+/g, '$1')
    .replace(/`/g, '')
    .trim();
}

class ErrorReintentable extends Error {}

async function preguntarGeminiCon(modelo: string, sistema: string, historial: Mensaje[]): Promise<string> {
  const clave = ENTORNO('GEMINI_API_KEY');
  if (!clave) throw new Error('SIN_CLAVE');

  const contents = historial.map((m) => ({
    role: m.rol === 'usuario' ? 'user' : 'model',
    parts: [{ text: m.texto }],
  }));

  const generationConfig: Record<string, unknown> = { temperature: 0.4, maxOutputTokens: 1500 };
  if (/gemini-3/.test(modelo)) generationConfig.thinkingConfig = { thinkingLevel: 'low' };

  let r: Response;
  try {
    r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: sistema }] },
          contents,
          generationConfig,
        }),
        signal: AbortSignal.timeout(TOPE_MODELO_MS),
      },
    );
  } catch (e) {
    throw new ErrorReintentable(`${modelo}: sin respuesta en ${TOPE_MODELO_MS} ms (${(e as Error).name})`);
  }

  const datos = await r.json();
  if (!r.ok) {
    const msg = datos?.error?.message ?? `HTTP ${r.status}`;
    if (r.status === 429 || r.status === 503 || r.status === 404) {
      throw new ErrorReintentable(`${modelo}: ${r.status} ${msg}`);
    }
    throw new Error('PROVEEDOR: ' + msg);
  }
  if (datos?.promptFeedback?.blockReason) throw new Error('BLOQUEADO');

  const cand = datos?.candidates?.[0];
  const texto = cand?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  if (!texto) throw new ErrorReintentable(`${modelo}: respuesta vacía (${cand?.finishReason ?? 'sin motivo'})`);
  return texto;
}

async function preguntarGroqCon(modelo: string, sistema: string, historial: Mensaje[]): Promise<string> {
  const clave = ENTORNO('GROQ_API_KEY');
  if (!clave) throw new Error('SIN_CLAVE');

  const messages = [
    { role: 'system', content: sistema },
    ...historial.map((m) => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.texto })),
  ];

  let r: Response;
  try {
    r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clave}` },
      body: JSON.stringify({ model: modelo, messages, temperature: 0.4, max_tokens: 1200 }),
      signal: AbortSignal.timeout(TOPE_MODELO_MS),
    });
  } catch (e) {
    throw new ErrorReintentable(`${modelo}: sin respuesta en ${TOPE_MODELO_MS} ms (${(e as Error).name})`);
  }

  const datos = await r.json();
  if (!r.ok) {
    const msg = datos?.error?.message ?? `HTTP ${r.status}`;
    if (r.status === 429 || r.status === 503 || r.status === 404) {
      throw new ErrorReintentable(`${modelo}: ${r.status} ${msg}`);
    }
    throw new Error('PROVEEDOR: ' + msg);
  }
  const texto = datos?.choices?.[0]?.message?.content ?? '';
  if (!texto) throw new ErrorReintentable(`${modelo}: respuesta vacía`);
  return texto;
}

async function preguntar(sistema: string, historial: Mensaje[]): Promise<{ texto: string; modelo: string }> {
  const fallos: string[] = [];
  for (const modelo of MODELOS) {
    try {
      const texto = PROVEEDOR === 'groq'
        ? await preguntarGroqCon(modelo, sistema, historial)
        : await preguntarGeminiCon(modelo, sistema, historial);
      return { texto, modelo };
    } catch (e) {
      if (e instanceof ErrorReintentable) { fallos.push(e.message); continue; }
      throw e;
    }
  }
  console.error('JOPOBOT: todos los modelos fallaron:', fallos.join(' | '));
  throw new Error('CUOTA_PROVEEDOR');
}

/* ------------------------------------------------------------------ */
Deno.serve(async (req: Request) => {
  const cors = cabecerasCors(req.headers.get('origin'));

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return responder({ error: 'METODO' }, 405, cors);

  let cuerpo: { codigo?: string; mensajes?: Mensaje[] };
  try {
    cuerpo = await req.json();
  } catch {
    return responder({ error: 'CUERPO_INVALIDO' }, 400, cors);
  }

  const codigo = String(cuerpo.codigo ?? '').trim().toUpperCase();
  const mensajes = Array.isArray(cuerpo.mensajes) ? cuerpo.mensajes : [];
  if (!mensajes.length) return responder({ error: 'DATOS_INCOMPLETOS' }, 400, cors);
  if (!ABIERTO) return responder({ error: 'CERRADO' }, 403, cors);

  const historial: Mensaje[] = mensajes
    .filter((m) => m && (m.rol === 'usuario' || m.rol === 'bot') && typeof m.texto === 'string')
    .map((m) => ({ rol: m.rol, texto: m.texto.slice(0, 1500) }))
    .slice(-12);
  if (!historial.length || historial[historial.length - 1].rol !== 'usuario') {
    return responder({ error: 'DATOS_INCOMPLETOS' }, 400, cors);
  }

  /* JOPÓI no exige registro: todo el mundo es invitado, con un
     identificador anónimo que guarda su navegador para poder repartir
     la cuota con justicia sin saber quién es nadie. */
  const clave = /^INV-[A-Z0-9]{4,20}$/.test(codigo) ? codigo : 'INVITADO';
  const topeDia = LIMITE_INVITADO_DIA;

  const ahora = Date.now();
  const hace24h = new Date(ahora - 24 * 3600 * 1000).toISOString();
  const hace1m  = new Date(ahora - 60 * 1000).toISOString();
  const [porDia, porMinuto, global] = await Promise.all([
    contar(`codigo=eq.${encodeURIComponent(clave)}&creado_en=gte.${hace24h}`),
    contar(`codigo=eq.${encodeURIComponent(clave)}&creado_en=gte.${hace1m}`),
    contar(`creado_en=gte.${hace24h}`),
  ]);
  if (porMinuto >= LIMITE_CODIGO_MINUTO) return responder({ error: 'MUY_RAPIDO' }, 429, cors);
  if (porDia >= topeDia) return responder({ error: 'LIMITE_DIARIO', limite: topeDia }, 429, cors);
  if (global >= LIMITE_GLOBAL_DIA) return responder({ error: 'LIMITE_GLOBAL' }, 429, cors);

  await rest('jopobot_uso', {
    method: 'POST',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ codigo: clave }),
  });

  const contexto = '\n\nQUIEN TE ESCRIBE\nUna persona usuaria de JOPÓI. No sabes su nombre: no lo inventes. '
    + 'Puede estar usando lector de pantalla o dictado por voz. Responde pensando en que te van a escuchar.';

  try {
    const sistema = CONOCIMIENTO + contexto;
    const r = await preguntar(sistema, historial);
    return responder({ respuesta: limpiar(r.texto), proveedor: PROVEEDOR, modelo: r.modelo }, 200, cors);
  } catch (e) {
    const msg = (e as Error).message || 'ERROR';
    console.error('JOPOBOT:', msg);
    if (msg === 'SIN_CLAVE')       return responder({ error: 'SIN_CLAVE' }, 503, cors);
    if (msg === 'CUOTA_PROVEEDOR') return responder({ error: 'CUOTA_PROVEEDOR' }, 503, cors);
    if (msg === 'BLOQUEADO')       return responder({ error: 'BLOQUEADO' }, 200, cors);
    return responder({ error: 'PROVEEDOR', detalle: msg.slice(0, 200) }, 502, cors);
  }
});
