#!/usr/bin/env bash
# Run SQL on the hosted CRM database through the pooler.
#   bash scripts/sql.sh "select 1"
#   bash scripts/sql.sh -f file.sql
# Reads SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD from supabase/.env.local (never in git).
set -euo pipefail
cd "$(dirname "$0")/.."
value() { grep -E "^$1=" supabase/.env.local | head -1 | cut -d= -f2- | tr -d '"\r'; }
PSQL=$(command -v psql || echo "/c/Program Files/PostgreSQL/17/bin/psql.exe")
export PGPASSWORD="$(value SUPABASE_DB_PASSWORD)" PGSSLMODE=require
if [ "${1:-}" = "-f" ]; then ARGS=(-f "$2"); else ARGS=(-c "$1"); fi
"$PSQL" -h "${SUPABASE_POOLER_HOST:-aws-0-eu-west-1.pooler.supabase.com}" -p 5432 \
  -U "postgres.$(value SUPABASE_PROJECT_REF)" -d postgres -v ON_ERROR_STOP=1 -X "${ARGS[@]}"
