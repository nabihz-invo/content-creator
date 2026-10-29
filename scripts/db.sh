#!/usr/bin/env bash
# Local database harness.
#
# Default mode runs the official `supabase/postgres` image (it already ships the
# auth/storage schemas, Supabase roles and pgTAP), applies supabase/migrations
# in order as the `postgres` role exactly like `supabase db reset`, loads
# seed.sql, and runs pgTAP tests in supabase/tests.
#
# If you have the full Supabase CLI stack available, `supabase start` /
# `supabase db reset` / `supabase test db` work too; this script just doesn't
# need the ~15 extra containers.
#
# Usage: scripts/db.sh start|stop|reset|test|psql
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="${DB_IMAGE:-supabase/postgres:17.6.1.011}"
NAME="${DB_CONTAINER:-cc-db}"
PORT="${DB_PORT:-54322}"
export PGPASSWORD="${DB_PASSWORD:-postgres}"
PSQL=(psql -h 127.0.0.1 -p "$PORT" -U postgres -d postgres -X -q -v ON_ERROR_STOP=1)

wait_ready() {
  for _ in $(seq 1 60); do
    if "${PSQL[@]}" -c "select 1" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  echo "database did not become ready" >&2
  docker logs "$NAME" | tail -20 >&2
  return 1
}

start() {
  if docker ps --format '{{.Names}}' | grep -qx "$NAME"; then return 0; fi
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker run -d --name "$NAME" -e POSTGRES_PASSWORD="$PGPASSWORD" -p "$PORT:5432" "$IMAGE" >/dev/null
  wait_ready
  # The image's init scripts restart the server once; wait for the second boot.
  sleep 3
  wait_ready
}

stop() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }

migrate() {
  shopt -s nullglob
  for f in "$ROOT"/supabase/migrations/*.sql; do
    echo "  migrate $(basename "$f")"
    "${PSQL[@]}" -f "$f"
  done
  if [[ -f "$ROOT/supabase/seed.sql" ]]; then
    echo "  seed"
    "${PSQL[@]}" -f "$ROOT/supabase/seed.sql"
  fi
}

reset() {
  stop
  start
  migrate
}

run_tests() {
  shopt -s nullglob
  local failed=0 total=0 out
  "${PSQL[@]}" -c "create extension if not exists pgtap with schema extensions" >/dev/null
  for f in "$ROOT"/supabase/tests/*.sql; do
    total=$((total + 1))
    if ! out=$("${PSQL[@]}" -t -A -f "$f" 2>&1); then
      echo "FAIL $(basename "$f") (error)"; echo "$out" | sed 's/^/    /'; failed=$((failed + 1)); continue
    fi
    if grep -qE '^not ok|Looks like' <<<"$out"; then
      echo "FAIL $(basename "$f")"; grep -E '^not ok|^#' <<<"$out" | sed 's/^/    /'; failed=$((failed + 1))
    else
      echo "ok   $(basename "$f") ($(grep -c '^ok' <<<"$out") assertions)"
    fi
  done
  echo "$((total - failed))/$total test files passed"
  [[ $failed -eq 0 ]]
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  reset) reset ;;
  test) reset && run_tests ;;
  test-only) run_tests ;;
  psql) shift; "${PSQL[@]}" "$@" ;;
  *) echo "usage: $0 start|stop|reset|test|test-only|psql" >&2; exit 2 ;;
esac
