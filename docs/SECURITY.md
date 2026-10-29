# Security and Reliability

Checklist every task touching the relevant area must satisfy. Reviewers: reject
changes that violate any item.

## Secrets
- Service-role key, AI keys, GitHub token, Telegram token, Buffer token: server
  side only (Edge Function secrets, n8n credentials, worker env). See
  `ARCHITECTURE.md §6`.
- Commit only `.env.example` with variable names. CI runs a secret scanner.
- Creative workspaces are created with an **empty environment** — Claude Code's
  own key is passed to the Claude Code process only, never written into the
  workspace, `package.json` scripts, or generated files.

## Database
- RLS enabled on every table in `public`; default deny. pgTAP tests prove each
  role's access (`supabase/tests/rls_*.sql`).
- Status changes only through `transition_project`; approvals only through
  `record_approval`; both `security definer` with explicit `search_path`.
- Approved rows immutable (triggers). `approvals` and `workflow_events`
  insert-only.

## Untrusted input
- CSV: size/row limits, encoding detection, formula-injection escaping, per-row
  validation, never execute.
- URLs: fetch server-side with timeout (10 s), size cap (2 MB), allow only
  http/https, block private/link-local IP ranges (SSRF), strip scripts, keep
  text only.
- AI prompts wrap external content in clearly delimited `<untrusted_source>`
  blocks with an instruction that it is data. AI output is schema-validated;
  it cannot trigger actions — only the workflow decides next steps.
- Telegram: verify secret token header; accept only linked users.

## Generated code
- Creative worker runs Claude Code in a disposable container/workdir with:
  no Supabase/service credentials, network allowlist (Anthropic API, GitHub,
  npm registry only), CPU/memory/time limits.
- Before commit: static checks — no external URLs except allowlisted font/CDN
  hosts bundled locally, no `fetch`/`XMLHttpRequest`/`WebSocket`/`eval`/`import()`
  of remote code, file count and size limits. Failure → job fails, not committed.
- Render worker: Playwright with network **disabled** except `file://` /
  local static server; per-job timeout, max frames, max output size; temp dir
  wiped after each job; runs as non-root.
- Previews: separate origin + `sandbox="allow-scripts"` iframe + CSP
  `connect-src 'none'` (see `ARCHITECTURE.md §5`).

## Reliability
- Idempotency keys on project creation from external sources (Telegram
  `update_id`, CSV `batch_id:row`), job creation, render, publish.
- Retries with exponential backoff for transient errors; `needs_attention`
  after `max_attempts` or on permanent errors; admin retry/cancel from the
  workflow monitor.
- Leases + heartbeats on worker jobs; recovery cron requeues expired leases.
- SHA-256 checksums on every uploaded file; verified before approval and before
  publishing.
- Cancellation: sets job `cancelled`; workers check between steps and stop.
- Audit: every transition and decision → `workflow_events` / `approvals`.
