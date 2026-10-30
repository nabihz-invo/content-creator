# Development Guide

How to run, test, and verify the project locally (or in a cloud agent sandbox).

## Prerequisites
Node ≥ 20 with pnpm 10, Deno 2, Docker, `psql`. Playwright + Chromium for the e2e smoke test.

```bash
pnpm install
```

## Fast checks (run before every commit)

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test
```

| Suite | Command | What it covers |
|-------|---------|----------------|
| Shared + CRM unit tests | `pnpm test` | status machine, hashing, TS↔SQL transition sync, edge vendor sync, i18n parity, CSV mapping, UI helpers |
| Database (pgTAP) | `pnpm db:test` | migrations apply cleanly; RLS matrix; status machine; job queue; immutability; RPCs |
| Edge Functions | `cd supabase/functions && deno task check && deno task test` | typecheck + lint; handlers against the real schema (needs a DB on :54322 — run `pnpm db:reset` or the stack first) |
| End-to-end | see below | the CRM in a real browser against the full local stack |

After changing `packages/shared/src` or `packages/shared/schemas`, run
`pnpm sync:edge` (a test fails if you forget).

## Local stack (full Supabase-compatible backend)

`scripts/local-stack/stack.sh` runs, from Docker Hub images:
Postgres (`supabase/postgres:17`), GoTrue, PostgREST, Storage API, plus a Node
gateway on `:54321` with Supabase's routes (`/auth/v1`, `/rest/v1`,
`/storage/v1`, `/functions/v1/*`) and both Edge Functions under Deno.

```bash
pnpm stack:up            # fresh DB + migrations; prints VITE_* env values
eval "$(bash scripts/local-stack/stack.sh env)"
export VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY
pnpm dev:crm             # http://localhost:5173
pnpm stack:down
```

The stack includes `n8n-shim.mjs` (stands in for n8n), so ideas flow through
analysis → configuration review → brief → script on their own. AI runs with
the deterministic fake provider by default; to use Claude:

```bash
AI_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-... pnpm stack:up
```

Notifications are written to `tmp/local-stack/notifications.log`.
Regenerate prompt examples: `node --experimental-strip-types scripts/examples/render-prompts.ts`.

Logs: `tmp/local-stack/*.log`. Keys are local-only (well-known dev JWT secret).
Sign-in emails are not delivered locally; create users via the GoTrue admin
API (see `scripts/e2e/crm-smoke.mjs`) — new users get a workspace automatically.

Note: `pnpm db:test` and the stack share the container name `cc-db` and port
54322; running one replaces the other.

## End-to-end smoke test

```bash
pnpm stack:up
eval "$(bash scripts/local-stack/stack.sh env)" && export VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY
pnpm --filter @cc/crm build && (cd apps/crm && npx vite preview --port 4173 --host 127.0.0.1 &)
pnpm e2e
```

It creates a user, then through the UI: edits a brand (settings versioning,
asset upload), adds ideas (dedupe, link-only), imports a CSV (auto-mapping,
dry-run duplicates, formula stripping, report), searches, switches to Arabic
(RTL, persisted preference), creates a Telegram link code, and checks the
mobile layout. Screenshots land in `docs/screenshots/`. Any browser console
error fails the run.

## Telegram (real bot)

```bash
TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... SUPABASE_URL=https://<ref>.supabase.co \
  scripts/telegram-set-webhook.sh
```

## Deploying (hosted Supabase)

```bash
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase secrets set --env-file supabase/functions/.env   # see .env.example
npx supabase functions deploy api
npx supabase functions deploy telegram-webhook
```
