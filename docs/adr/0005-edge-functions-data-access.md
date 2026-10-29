# 0005 — Edge Functions: direct Postgres access, own auth, inline Telegram replies

**Status:** accepted (P1-T07)

## Context
Edge Functions must authorize users, run multi-step writes atomically (create
project + tags + job + events), and be testable without the full Supabase
stack (cloud agents can only run the Postgres image).

## Decision
- Two functions: `api` (Hono router under `/api/*`) and `telegram-webhook`.
  Gateway `verify_jwt = false`; each request is authenticated in code:
  user JWT via `supabase.auth.getClaims()`, Telegram secret-token header, or
  n8n HMAC (`X-CC-Signature`).
- Data access uses the `postgres` driver over `SUPABASE_DB_URL` (transaction
  pooler, `prepare: false`). All state changes go through the security-definer
  RPCs; handlers check workspace role before calling them.
- Dependencies (auth verifier, n8n dispatcher, storage, network) are injected,
  so `deno test` runs handlers against the real schema with fakes for the rest.
- Shared TS + JSON Schemas are vendored into `_shared/vendor` (`pnpm sync:edge`)
  because Supabase bundles only `supabase/functions/`; a Vitest test fails on drift.
- Telegram replies are returned as the webhook response
  (`{"method":"sendMessage",…}`), so intake needs no bot token and no n8n hop.
  n8n Workflow A is therefore not needed for intake; n8n still sends
  notifications (it holds the bot token).
- n8n dispatch is fire-and-forget after commit; a failed dispatch leaves the
  job `queued` and Workflow R re-dispatches it.

## Consequences
- RLS is not what protects these code paths — explicit role checks and
  service-only RPCs are. pgTAP tests cover the RPCs; Deno tests cover the
  handlers' role checks.
- If PostgREST-based access is preferred later, only `_shared/db.ts` call
  sites change; contracts stay the same.
