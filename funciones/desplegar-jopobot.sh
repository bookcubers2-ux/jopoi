#!/usr/bin/env bash
# JOPOBOT | Despliegue de la Edge Function en Supabase
# ----------------------------------------------------
# Uso (Git Bash o Linux):
#   export SUPABASE_ACCESS_TOKEN="sbp_..."   # supabase.com/dashboard/account/tokens
#   export PROJECT_REF="referencia"          # referencia del proyecto Supabase
#   export GEMINI_API_KEY="clave"            # aistudio.google.com/apikey (nivel gratuito)
#   bash desplegar-jopobot.sh
#
# Ninguna clave vive en este archivo ni en el repositorio: todas se
# pasan por variables de entorno y quedan como secretos en Supabase.
set -euo pipefail

: "${SUPABASE_ACCESS_TOKEN:?falta SUPABASE_ACCESS_TOKEN}"
: "${PROJECT_REF:?falta PROJECT_REF}"
: "${GEMINI_API_KEY:?falta GEMINI_API_KEY}"

API="https://api.supabase.com/v1/projects/$PROJECT_REF"
AQUI="$(cd "$(dirname "$0")" && pwd)"
ORIGENES="${ORIGENES_PERMITIDOS:-https://bookcubers2-ux.github.io,http://localhost:8080,http://127.0.0.1:8080}"

echo "1. Creando la tabla de uso (jopobot_uso) con RLS..."
SQL='create table if not exists public.jopobot_uso (id bigserial primary key, codigo text not null, creado_en timestamptz not null default now()); create index if not exists idx_jopobot_uso_codigo_fecha on public.jopobot_uso (codigo, creado_en); create index if not exists idx_jopobot_uso_fecha on public.jopobot_uso (creado_en); alter table public.jopobot_uso enable row level security;'
curl -sS -X POST "$API/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d "{\"query\": \"$SQL\"}" > /dev/null && echo "   tabla lista"

echo "2. Guardando los secretos..."
curl -sS -X POST "$API/secrets" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d "[
    {\"name\":\"GEMINI_API_KEY\",\"value\":\"$GEMINI_API_KEY\"},
    {\"name\":\"JOPOBOT_ABIERTO\",\"value\":\"1\"},
    {\"name\":\"ORIGENES_PERMITIDOS\",\"value\":\"$ORIGENES\"}
  ]" > /dev/null && echo "   secretos guardados"

echo "3. Desplegando la funcion jopobot..."
# El código va como JSON: se arma con Node para escapar sin errores.
node -e "
const fs = require('fs');
const body = {
  slug: 'jopobot', name: 'jopobot', verify_jwt: false,
  body: fs.readFileSync(process.argv[1], 'utf8')
};
fs.writeFileSync(process.argv[2], JSON.stringify(body));
" "$AQUI/jopobot/index.ts" "$AQUI/jopobot-despliegue.json"

HTTP=$(curl -sS -o "$AQUI/jopobot-respuesta.json" -w "%{http_code}" -X POST "$API/functions" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  --data-binary @"$AQUI/jopobot-despliegue.json")
if [ "$HTTP" = "409" ] || [ "$HTTP" = "400" ]; then
  echo "   la funcion ya existia: actualizando..."
  HTTP=$(curl -sS -o "$AQUI/jopobot-respuesta.json" -w "%{http_code}" -X PATCH "$API/functions/jopobot" \
    -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
    --data-binary @"$AQUI/jopobot-despliegue.json")
fi
rm -f "$AQUI/jopobot-despliegue.json"
[ "$HTTP" = "200" ] || [ "$HTTP" = "201" ] || { echo "ERROR HTTP $HTTP:"; cat "$AQUI/jopobot-respuesta.json"; exit 1; }
rm -f "$AQUI/jopobot-respuesta.json"
echo "   funcion desplegada"

echo "4. Esperando a que la funcion quede activa..."
sleep 8

echo "5. Prueba de humo..."
ANON="${SUPABASE_ANON:-}"
if [ -n "$ANON" ]; then
  curl -sS -X POST "https://$PROJECT_REF.supabase.co/functions/v1/jopobot" \
    -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    -H "Content-Type: application/json" -H "Origin: https://bookcubers2-ux.github.io" \
    -d '{"codigo":"INV-PRUEBA","mensajes":[{"rol":"usuario","texto":"Hola JOPOBOT, ¿qué es JOPÓI?"}]}'
  echo
else
  echo "   (exporta SUPABASE_ANON para correr la prueba de humo)"
fi
echo "Listo. JOPOBOT desplegado."
