# Backend API Contracts

Implemented as two Supabase Edge Functions (ADR-0005):

- `api` — Hono router; every path below lives under it:
  `https://<ref>.supabase.co/functions/v1/api/content-projects` etc.
- `telegram-webhook` — `https://<ref>.supabase.co/functions/v1/telegram-webhook`.

The CRM wraps them in `apps/crm/src/lib/api.ts`. Request schemas:
`packages/shared/schemas/api/*.schema.json`.

## Common rules

- **Auth:** `Authorization: Bearer <user JWT>` (except Telegram webhook, which
  uses `X-Telegram-Bot-Api-Secret-Token`).
- **Authorization:** role checked via `workspace_members`; see table below.
- **Validation:** request body validated against schemas in
  `packages/shared/schemas`; 422 with `{ error: { code, message, details } }` on failure.
- **Idempotency:** mutating endpoints accept `Idempotency-Key` header. Same key
  + same body → same stored response; same key + different body → 409.
- **Rate limits:** per user per endpoint (default 60/min; generation endpoints 10/min).
- **Errors:** `{ "error": { "code": "string", "message": "string", "details": {} } }`.
  Codes: `unauthorized`, `forbidden`, `validation_failed`, `not_found`,
  `invalid_transition`, `approval_required`, `hash_mismatch`, `duplicate`,
  `idempotency_conflict`, `rate_limited`, `internal`.

| Endpoint | Roles |
|----------|-------|
| POST /api/content-projects | admin, editor |
| POST /api/imports/csv | admin, editor |
| POST /api/webhooks/telegram | Telegram secret + linked `profiles.telegram_user_id` |
| POST /api/content-projects/{id}/analyze | admin, editor |
| POST /api/content-projects/{id}/questionnaire/submit | admin, editor |
| POST /api/content-projects/{id}/scripts/generate | admin, editor |
| POST /api/approvals | admin, editor, reviewer |
| POST /api/content-projects/{id}/creative/generate | admin, editor |
| POST /api/render-jobs | admin, editor |
| GET /api/render-jobs/{id} | any member |
| POST /api/publishing-jobs | admin, editor (with publish permission) |
| POST /api/telegram/link-code | any signed-in user |
| POST /api/internal/url-extract | n8n (HMAC `X-CC-Signature`) |

## Endpoints

### POST /api/content-projects  (implemented P1-T08)
Body (`create-project.request.schema.json`): `original_idea` and/or `source_url`, optional `workspace_id`, `title`, `brand_id`, `content_type`, `language`, `tags`, `allow_duplicate`, `auto_analyze` — i.e. the intake record (`CONTRACTS.md §1`) minus server fields.
`201 { project_id, status: "analyzing", duplicate_of: null }`;
`200 { project_id: <existing>, duplicate_of: <existing> }` when `dedupe_hash` matches and `allow_duplicate` is not set.

### POST /api/imports/csv  (implemented P1-T09)
`multipart/form-data`: `file` (≤ 5 MB, ≤ 1000 rows), `mapping` JSON
(`{ "idea": "Column A", "url": "Link", "brand": "Brand", "tags": "Tags" }`), `brand_id?`, `dry_run?`.
`200 { import_batch_id, dry_run, headers, totals: { rows, created, failed, duplicate, valid }, rows: [{ row, status: created|failed|duplicate|valid, project_id?, duplicate_of?, error? }] }`.
`row` is the spreadsheet row number (header = 1; blank rows skipped but counted).
Mapping keys: `idea`, `url`, `title`, `brand` (matched by name), `tags` (`,;|`-separated), `content_type`, `language`.
CSV cells are sanitized (leading `= + @` and `-`-before-non-digit stripped); UTF-8 (BOM ok) or Windows-1256.
Each row uses source key `csv:<batch>:<row>`. The file is stored at `imports/<workspace>/<batch>/<file>`.

### POST /telegram-webhook  (implemented P1-T10)
Telegram Update body; header `X-Telegram-Bot-Api-Secret-Token` must match.
Private chats only. The reply is the HTTP response (`{"method":"sendMessage",…}`).
- `/link <code>` (or `/start <code>`) links the Telegram account to a CRM user.
- Unlinked users get linking instructions; replies are Arabic when the profile locale is `ar`.
- Text → `telegram` intake; the first URL becomes `source_url`; a bare link → `url` intake.
- Photo with caption → caption is the idea, photo `file_id` kept in `source_metadata`.
- Voice/audio → "not supported yet" (Phase 5).
- Idempotency: `telegram:<update_id>`; a replay returns the same project.

### POST /api/telegram/link-code  (implemented P1-T10)
`200 { code, expires_in_seconds: 900, instructions }` — 8-char one-time code.

### POST /api/internal/url-extract  (implemented P1-T11)
Called by n8n Workflow B. HMAC-signed body `{ project_id }`. Fetches the
project's `source_url` with SSRF protection (public IPs only on every redirect,
10 s, 2 MB, HTML/text), stores `{ title, description, language, text,
truncated, final_url, fetched_at }` under `source_metadata.extracted`, and logs
`source.extracted` / `source.extract_failed`.

### POST /api/content-projects/{id}/analyze
Re-queues analysis (allowed from `new`, `failed`, or to regenerate the questionnaire).
`202 { job_id, status: "analyzing" }`.

### POST /api/content-projects/{id}/questionnaire/submit
Body: `{ questionnaire_id, answers, draft: bool }`. Draft → saves only (`200`).
Final → validates required/conditional/validation rules server-side; `422 { missing: [question_id] }` if incomplete; else `202 { job_id, status: "validating_answers" }`.

### POST /api/content-projects/{id}/scripts/generate
Body: `{ brief_id?, regenerate_sections?: ["hook","scenes[2]"], instructions?: string }`.
Requires a `valid` brief. `202 { job_id }`. Manual edits use
`POST /api/content-projects/{id}/scripts` `{ base_script_id, content }` → new version `201 { script_id, version, content_hash }`.

### POST /api/approvals
Body: `{ artifact_type: script|creative_version|media_manifest|publishing_job, artifact_id, artifact_version, artifact_hash, decision: approved|changes_requested|rejected, comment?, return_to?: script|creative }`.
`201 { approval_id, project_status }`; `409 hash_mismatch` if the artifact changed; `409 invalid_transition` if not in review.

### POST /api/content-projects/{id}/creative/generate
Body: `{ script_id, template_id?, revision_notes? }`. Requires the script to be approved. `202 { job_id, creative_version: n }`.

### POST /api/render-jobs
Body: `{ creative_version_id, output_type: png|carousel|mp4, configuration? }` + `Idempotency-Key`.
Requires approved creative. `202 { render_job_id, status: "queued" }`.

### GET /api/render-jobs/{id}
`200 { id, status, progress, attempts, error_details, outputs: [media_asset], manifest? }`.

### POST /api/publishing-jobs
Body: publishing package (`CONTRACTS.md §9`). Requires `approval_id` to be an
approved media approval whose `manifest_hash` matches. Validates platform
constraints. Initial release: creates job with status `ready` and returns a
download bundle URL (manual publishing). Phase 6: submits to Buffer.
`202 { publishing_job_id, status }`.
