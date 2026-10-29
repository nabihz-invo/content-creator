# n8n Workflows

Workflows A–G and R (see `docs/WORKFLOW.md §4`) run on the existing
self-hosted n8n. Each one is exported to `n8n/workflows/<letter>-<name>.json`
and committed; the JSON in Git is the source of truth.

## Import / export

```bash
# export from a running n8n (CLI inside the n8n container)
n8n export:workflow --id=<id> --output=n8n/workflows/B-analyze-question.json --pretty

# import into n8n
n8n import:workflow --input=n8n/workflows/B-analyze-question.json
```

Before committing an export: strip `credentials.*.id` values that point to a
specific instance only if they differ between environments (credential
**names** below are stable), and make sure no secret values are embedded.

## Credentials (names only — values live in n8n)

| Credential name | Type | Used by |
|-----------------|------|---------|
| `cc-supabase-service` | HTTP Header Auth (`apikey` + `Authorization: Bearer <service_role>`) | all |
| `cc-webhook-hmac` | Generic secret (`N8N_WEBHOOK_SECRET`) | all webhook triggers |
| `cc-ai-anthropic` | Anthropic API | B, C, D |
| `cc-telegram-bot` | Telegram API | A, notifications |
| `cc-buffer` | HTTP Header Auth | G |

## Environment variables (n8n)

| Variable | Meaning |
|----------|---------|
| `CC_SUPABASE_URL` | `https://<project>.supabase.co` |
| `CC_CRM_URL` | CRM base URL for deep links in notifications |
| `N8N_WEBHOOK_SECRET` | shared HMAC secret (same value as Edge Function secret) |

## Calling convention: Edge Function → n8n

Every workflow starts from a webhook that receives **only a job reference**,
never the data itself:

```
POST {N8N_BASE_URL}/webhook/cc/<workflow>        e.g. /webhook/cc/analyze
Content-Type: application/json
X-CC-Timestamp: <unix seconds>
X-CC-Signature: sha256=<hex hmac>

{ "job_id": "<uuid>", "project_id": "<uuid>", "stage": "analysis" }
```

- `hmac = HMAC_SHA256(N8N_WEBHOOK_SECRET, "<timestamp>.<raw body>")`.
- The first node verifies the signature (Crypto node) and rejects requests
  whose timestamp is more than 300 s from now.
- Workflow slugs: `intake`, `analyze`, `answers`, `script`, `creative`,
  `render`, `publish`.

Implementation on the Edge Function side: `supabase/functions/_shared/n8n.ts`.

## Calling convention: n8n → Supabase

n8n never writes tables directly. It calls RPCs with the service role:

```
POST {CC_SUPABASE_URL}/rest/v1/rpc/<function>
apikey: <service_role>
Authorization: Bearer <service_role>
```

Core RPCs: `transition_project`, `create_job`, `complete_job`, `fail_job`,
plus stage-specific save functions added in Phase 2 (see
`docs/DATA_MODEL.md §5`).

## Workflow skeleton (every workflow)

1. Webhook → verify HMAC.
2. Load the job (`workflow_jobs`) — exit quietly unless `queued`/`running`
   (idempotent re-delivery).
3. Load inputs it references; check the project is still in the expected
   status, else `complete_job` with `{ skipped: true }`.
4. Do the work. Validate AI output against `packages/shared/schemas`.
5. Save via RPC, `complete_job`, transition, notify.
6. Error branch → `fail_job(job_id, error, retryable)`.
