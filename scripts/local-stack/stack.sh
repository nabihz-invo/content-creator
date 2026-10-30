#!/usr/bin/env bash
# Local Supabase-compatible stack for development and end-to-end tests:
#   Postgres (supabase/postgres) + GoTrue + PostgREST + Storage API (Docker)
#   + Node gateway on :54321 + Edge Functions under Deno (:8000 api, :8001 telegram).
#   + a local n8n stand-in (:5678) that runs pipeline jobs and logs notifications.
# AI: AI_PROVIDER=fake by default (no tokens). Use real Claude with
#     AI_PROVIDER=anthropic ANTHROPIC_API_KEY=... scripts/local-stack/stack.sh up
# Usage: scripts/local-stack/stack.sh up | down | status | env
# After `up`: CRM env is printed; run `pnpm --filter @cc/crm dev`.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HERE="$ROOT/scripts/local-stack"
RUN="$ROOT/tmp/local-stack"
NET=cc-net
export PGPASSWORD=postgres
eval "$(node "$HERE/keys.mjs")"

wait_http() {
  for _ in $(seq 1 90); do curl -fsS -o /dev/null "$1" 2>/dev/null && return 0; sleep 1; done
  echo "timeout waiting for $1" >&2; return 1
}

up() {
  mkdir -p "$RUN"
  docker network inspect $NET >/dev/null 2>&1 || docker network create $NET >/dev/null
  # Fresh database (no platform shim: the Storage API migrates its own schema here).
  docker rm -f cc-db cc-auth cc-rest cc-storage >/dev/null 2>&1 || true
  docker run -d --name cc-db --network $NET -p 54322:5432 -e POSTGRES_PASSWORD=postgres supabase/postgres:17.6.1.011 >/dev/null
  for _ in $(seq 1 60); do psql -h 127.0.0.1 -p 54322 -U postgres -c 'select 1' >/dev/null 2>&1 && break; sleep 1; done
  sleep 3
  for _ in $(seq 1 60); do psql -h 127.0.0.1 -p 54322 -U postgres -c 'select 1' >/dev/null 2>&1 && break; sleep 1; done

  # Service roles need passwords to log in (the Supabase CLI does the same).
  psql -h 127.0.0.1 -p 54322 -U supabase_admin -d postgres -X -q -v ON_ERROR_STOP=1 -c \
    "alter role supabase_auth_admin with password 'postgres'; alter role supabase_storage_admin with password 'postgres'; alter role authenticator with password 'postgres';"

  docker run -d --name cc-auth --network $NET -p 9999:9999 \
    -e GOTRUE_API_HOST=0.0.0.0 -e GOTRUE_API_PORT=9999 -e API_EXTERNAL_URL=http://127.0.0.1:54321/auth/v1 \
    -e GOTRUE_DB_DRIVER=postgres -e GOTRUE_DB_DATABASE_URL="postgres://supabase_auth_admin:postgres@cc-db:5432/postgres" \
    -e GOTRUE_SITE_URL=http://127.0.0.1:5173 -e GOTRUE_URI_ALLOW_LIST="http://127.0.0.1:5173,http://localhost:5173" \
    -e GOTRUE_JWT_SECRET="$JWT_SECRET" -e GOTRUE_JWT_EXP=3600 -e GOTRUE_JWT_AUD=authenticated \
    -e GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated -e GOTRUE_JWT_ADMIN_ROLES=service_role \
    -e GOTRUE_EXTERNAL_EMAIL_ENABLED=true -e GOTRUE_MAILER_AUTOCONFIRM=true -e GOTRUE_DISABLE_SIGNUP=false \
    -e GOTRUE_SMTP_HOST=localhost -e GOTRUE_SMTP_PORT=2500 -e GOTRUE_SMTP_ADMIN_EMAIL=admin@example.com \
    supabase/gotrue:v2.180.0 >/dev/null

  docker run -d --name cc-storage --network $NET -p 5000:5000 \
    -e ANON_KEY="$ANON_KEY" -e SERVICE_KEY="$SERVICE_ROLE_KEY" -e AUTH_JWT_SECRET="$JWT_SECRET" -e PGRST_JWT_SECRET="$JWT_SECRET" \
    -e DATABASE_URL="postgres://supabase_storage_admin:postgres@cc-db:5432/postgres" -e POSTGREST_URL=http://cc-rest:3000 \
    -e STORAGE_BACKEND=file -e FILE_STORAGE_BACKEND_PATH=/var/lib/storage -e FILE_SIZE_LIMIT=52428800 \
    -e TENANT_ID=stub -e REGION=local -e GLOBAL_S3_BUCKET=stub -e ENABLE_IMAGE_TRANSFORMATION=false \
    supabase/storage-api:v1.28.0 >/dev/null

  wait_http http://127.0.0.1:9999/health
  wait_http http://127.0.0.1:5000/status

  # Our migrations + seed, as the postgres role (same as `supabase db reset`).
  for f in "$ROOT"/supabase/migrations/*.sql; do psql -h 127.0.0.1 -p 54322 -U postgres -X -q -v ON_ERROR_STOP=1 -f "$f"; done
  psql -h 127.0.0.1 -p 54322 -U postgres -X -q -v ON_ERROR_STOP=1 -f "$ROOT/supabase/seed.sql"

  docker run -d --name cc-rest --network $NET -p 3000:3000 \
    -e PGRST_DB_URI="postgres://authenticator:postgres@cc-db:5432/postgres" -e PGRST_DB_SCHEMAS=public,storage,graphql_public \
    -e PGRST_DB_ANON_ROLE=anon -e PGRST_JWT_SECRET="$JWT_SECRET" -e PGRST_DB_USE_LEGACY_GUCS=false \
    -e PGRST_APP_SETTINGS_JWT_SECRET="$JWT_SECRET" -e PGRST_APP_SETTINGS_JWT_EXP=3600 \
    postgrest/postgrest:v13.0.7 >/dev/null
  wait_http http://127.0.0.1:3000/

  # Gateway + Edge Functions
  pkill -f "local-stack/gateway.mjs" 2>/dev/null || true
  pkill -f "deno run -A (api|telegram-webhook)/index.ts" 2>/dev/null || true
  setsid node "$HERE/gateway.mjs" </dev/null >"$RUN/gateway.log" 2>&1 &
  pkill -f "local-stack/n8n-shim.mjs" 2>/dev/null || true
  N8N_WEBHOOK_SECRET=local-n8n-secret setsid node "$HERE/n8n-shim.mjs" </dev/null >"$RUN/n8n-shim.log" 2>&1 &
  local fenv=(SUPABASE_DB_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres SUPABASE_URL=http://127.0.0.1:54321
              SUPABASE_ANON_KEY="$ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY" CRM_URL=http://127.0.0.1:5173
              CRM_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173
              TELEGRAM_WEBHOOK_SECRET=local-telegram-secret N8N_WEBHOOK_SECRET=local-n8n-secret
              N8N_BASE_URL=http://127.0.0.1:5678 AI_PROVIDER="${AI_PROVIDER:-fake}" ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}")
  (cd "$ROOT/supabase/functions" && env "${fenv[@]}" PORT=8000 setsid deno run -A api/index.ts </dev/null >"$RUN/api.log" 2>&1 &)
  (cd "$ROOT/supabase/functions" && env "${fenv[@]}" PORT=8001 setsid deno run -A telegram-webhook/index.ts </dev/null >"$RUN/telegram.log" 2>&1 &)
  wait_http http://127.0.0.1:54321/functions/v1/api/health
  echo "stack is up"
  env_out
}

env_out() {
  echo "VITE_SUPABASE_URL=http://127.0.0.1:54321"
  echo "VITE_SUPABASE_ANON_KEY=$ANON_KEY"
  echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
}

down() {
  pkill -f "local-stack/gateway.mjs" 2>/dev/null || true
  pkill -f "local-stack/n8n-shim.mjs" 2>/dev/null || true
  pkill -f "deno run -A (api|telegram-webhook)/index.ts" 2>/dev/null || true
  docker rm -f cc-db cc-auth cc-rest cc-storage >/dev/null 2>&1 || true
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  env) env_out ;;
  status) docker ps --filter name=cc- --format '{{.Names}}\t{{.Status}}'; curl -fsS http://127.0.0.1:54321/functions/v1/api/health && echo ;;
  *) echo "usage: $0 up|down|status|env" >&2; exit 2 ;;
esac
