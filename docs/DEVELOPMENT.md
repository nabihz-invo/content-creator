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
| Creative worker | `pnpm --filter @cc/creative-worker test` · `test:render` · `test:integration` | validator + generator contract + git store · every template × style × language in headless Chromium (offline) · full jobs (spec → git commit → preview upload → `save_creative_version`, revision from v1) against the DB on :54322 |
| Render worker | `pnpm --filter @cc/render-worker test` · `test:integration` | PNG decoder + render validation · real jobs: creative → approval → render (Chromium, network off) → manifest; tampered source refused |
| Preview server | `pnpm --filter @cc/preview-server test` | signed tokens (expired / forged / out-of-prefix refused), CSP, CORS, no cookies |
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

Phase 3–4 services also start: the **render worker** (PNG + carousel; see
`workers/render-worker/README.md`), the **creative worker** (generator `template` by
default; set `CREATIVE_GENERATOR=claude-code ANTHROPIC_API_KEY=...` with the
`claude` CLI installed to let Claude Code write the creative) and the
**preview origin** on `:54400`. Creative source is committed to a local bare
repository at `tmp/creatives.git` (`git -C tmp/creatives.git log --stat`).
Playwright for thumbnails is resolved from `NODE_PATH` (defaults to
`npm root -g`). See `workers/creative-worker/README.md`.

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
mobile layout. Phase 2: AI configuration review → brief → script versions and
approval. Phase 3: waits for the creative worker, checks the preview iframe is
`sandbox="allow-scripts"` on the separate origin with a locked-down CSP, that a
forged token is refused and the creative cannot reach the CRM document,
requests changes (v2 built from v1's source), approves (→ `rendering`; the
video waits for the Phase 5 renderer), and checks the Creative studio list.
Phase 4: a carousel goes through the render worker; the reviewer sees the real
1080×1350 PNGs, rerenders (render 2, render 1 outdated), approves; the
publishing package is checked against platform rules, the zip is downloaded
and verified with `unzip -t`, the post is marked published; then the media
library filters and the workflow monitor's cancel/retry. Screenshots land in `docs/screenshots/`. Any browser console
error fails the run.

## Telegram (real bot)

```bash
TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... SUPABASE_URL=https://<ref>.supabase.co \
  scripts/telegram-set-webhook.sh
```

## Deploying (hosted Supabase)

Full guide (workers, preview origin, creatives repository token): `DEPLOYMENT.md`.

```bash
npx supabase link --project-ref <ref>
npx supabase db push
npx supabase secrets set --env-file supabase/functions/.env   # see .env.example
npx supabase functions deploy api
npx supabase functions deploy telegram-webhook
```
