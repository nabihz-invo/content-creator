# JSON Schemas

Draft 2020-12 JSON Schemas — the source of truth for every structured payload
(docs/CONTRACTS.md describes intent). Validated with ajv in Edge Functions,
workers, n8n (via Edge Function helpers), and the CRM.

- `*.schema.json` — domain contracts (AI outputs, manifests, jobs).
- `api/*.schema.json` — HTTP request bodies.

Edge Functions get a copy under `supabase/functions/_shared/vendor/`
(`pnpm sync:edge`); a test fails if the copy drifts.
