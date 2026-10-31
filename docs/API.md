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
| POST /api/content-projects/{id}/scripts | admin, editor |
| POST /api/internal/run-job, /api/internal/recover | n8n (HMAC) |
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

### POST /api/content-projects/{id}/analyze  (implemented P2-T07)
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

## Phase 2 (implemented, ADR-0006)

All project endpoints check the caller's role in the project's workspace **before** validating input (404 for foreign projects).

- `POST /api/content-projects/{id}/analyze` → `202 { job_id, status, retried }`. Allowed for `new`, `awaiting_answers` (re-run), or `failed` during analysis (retries the failed job).
- `POST /api/content-projects/{id}/questionnaire/submit` — body `{ questionnaire_id, answers, draft? }` (`questionnaire-submit.request.schema.json`). `draft: true` saves only. Otherwise the shared `validateAnswers()` runs (visibility, required, options, `ai_decide` rules); errors → `422 { details.fields: { q_id: code } }`. Success records the **configuration approval** and returns `202 { answers_id, approval_id, job_id, status: "validating_answers", content_hash }`. Resubmitting an approved configuration supersedes the brief/scripts and cancels queued downstream jobs.
- `POST /api/content-projects/{id}/scripts/generate` — `{ instructions }` → new AI version from the one in review (`202`).
- `POST /api/content-projects/{id}/scripts` — `{ base_script_id, content }` manual edit → validated against the format schema and timing/slide checks → new version (`201`, `Idempotency-Key` supported).
- `POST /api/approvals` — `{ artifact_type: "script", artifact_id, artifact_version, artifact_hash, decision, comment? }`. Stale version/hash → `409 hash_mismatch`; `changes_requested` needs a comment and queues an AI revision; `approved` queues the creative job; `rejected` cancels the project. Reviewers may decide; only editors/admins edit.
- `POST /api/internal/run-job` (HMAC) — `{ job_id }`; runs analysis / brief / script stages (background on Supabase, `202`). Other stages → `{ accepted: false }`. Replays are no-ops.
- `POST /api/internal/recover` (HMAC) — Workflow R: `recover_jobs()` + re-dispatch queued jobs older than 2 minutes.

## Phase 3 (implemented, ADR-0007)

Creative generation is not an HTTP call: approving a script queues a
`creative_worker` job that the creative worker claims from Postgres.

- `POST /api/approvals` with `artifact_type: "creative_version"` — same body and
  errors as for scripts. `approved` → queues a `render_worker` job, project
  `rendering`; `changes_requested` (comment required) → revision job built on
  that version's committed source; `rejected` → a fresh direction from the
  approved script. Stale version / hash → `409 hash_mismatch`.
- `GET /api/creative-versions/{id}/preview` (any project member) →
  `200 { url, base, expires_at }`: a 30-minute HMAC-signed URL on the preview origin
  (`PREVIEW_ORIGIN`, secret `PREVIEW_SIGNING_SECRET`) scoped to
  `<project>/creative-v<n>/`. The CRM loads it in an iframe with
  `sandbox="allow-scripts"` only.
- Preview origin (`workers/preview-server`): `GET /p/{token}/{path}`. Expired,
  forged or out-of-prefix tokens → `403`; unknown file types → `415`. Every
  response carries `connect-src 'none'`, `frame-ancestors <CRM origins>`,
  `nosniff`, `no-referrer`, and `Access-Control-Allow-Origin: *` (the sandbox
  has an opaque origin and module scripts / fonts are CORS requests; access is
  still gated by the token, never by cookies).

## Phase 4 (implemented, ADR-0008)

- `POST /api/approvals` with `artifact_type: "media_manifest"`, `artifact_id` = render job id, `artifact_version` = render version, `artifact_hash` = `manifest_hash`. `changes_requested` takes `return_to: "render"` (default; rerender the same creative) or `"creative"` (revise the creative with the comment as notes); `rejected` starts a fresh creative direction; `approved` → `ready_to_publish`.
- `POST /api/render-jobs` — `{ creative_version_id }` + **required** `Idempotency-Key`; editors; the creative must be approved and the project `rendering` (after a failed/cancelled render) or `media_in_review` (manual rerender, outdates the pending files). `202 { render_job_id, job_id, version, output_type, status: "queued", replayed }`.
- `GET /api/render-jobs/{id}` — members; `{ status, progress, attempts, error_details, manifest, manifest_hash, outputs: [media_asset] }`.
- `POST /api/publishing-jobs` — `{ project_id, approval_id, platform, caption, hashtags?, link? }` + **required** `Idempotency-Key`; editors. The approval must be an approved media manifest whose render is still current (`409 approval_required` otherwise). Platform rules (`packages/shared/src/platform-rules.ts`: output types, aspect ratios, item counts, caption length, hashtag count/shape, https link) → `422 { details.fields, details.issues }`. `201 { publishing_job_id, status: "ready" }`; a retry with the same key → `200` with the same id.
- `GET /api/publishing-jobs/{id}/bundle` — members; `application/zip`: `01-slide-01.png …` in manifest order (each file's sha256 is checked against the manifest first; a mismatch → `500`, nothing is sent), `caption.txt`, `hashtags.txt`, `link.txt`, `manifest.json`.
- `POST /api/publishing-jobs/{id}/mark-published` — `{ published_url }` (https); editors; job `ready → published`, project `ready_to_publish → published`.
- `POST /api/jobs/{id}/retry` · `POST /api/jobs/{id}/cancel` — workspace admins (workflow monitor). Retrying an n8n job re-dispatches it immediately.
