# Data Model

Postgres in Supabase is the system of record. Migrations live in
`supabase/migrations/`; enums and the transition table are mirrored in
`packages/shared/src/status.ts` and must stay in sync.

## 1. Conventions

- Primary keys: `id uuid primary key default gen_random_uuid()`.
- Every table has `created_at timestamptz not null default now()`. Mutable
  tables also have `updated_at` maintained by a shared `set_updated_at()`
  trigger.
- Foreign keys use `on delete restrict` for artifacts (history must survive)
  and `on delete cascade` only for pure child rows (e.g. answers of a draft).
- JSONB columns that hold AI/contract data are validated in the API layer
  against `packages/shared/schemas`; the DB adds `jsonb_typeof` checks.
- Versioned artifacts have `unique (project_id, version)` and a
  `content_hash text not null` (SHA-256 of canonical JSON / file bytes).
- Binary files live in Storage. Rows hold `storage_path`, `mime_type`,
  `file_size`, `checksum`.
- Every row that belongs to a project carries `project_id` for RLS.

## 2. Supporting tables (added beyond the blueprint)

These are needed to implement the blueprint's roles, multi-user readiness,
CSV reporting, and idempotency.

| Table | Purpose |
|-------|---------|
| `profiles` | `id = auth.users.id`, display_name, locale, telegram_user_id |
| `workspaces` | tenant boundary (one row for personal use; enables teams later) |
| `workspace_members` | `workspace_id, user_id, role` (`admin` · `editor` · `reviewer`) |
| `connected_accounts` | publishing accounts: platform, external account id, display name, status. Tokens are **not** stored here (server-side secrets / n8n credentials). |
| `import_batches` | CSV import: file path, field mapping, totals (`created`, `failed`, `duplicate`), row-level report JSONB |
| `idempotency_keys` | `key, scope, request_hash, response JSONB, created_at` — dedupes API retries |
| `ai_settings` | per-workspace model + prompt version per stage (admin-managed) |
| `tags`, `project_tags` | inbox tagging |

`brands` and `content_projects` get a `workspace_id` column.

## 3. Blueprint tables

### brands
`id, workspace_id, name, description, default_language, brand_settings jsonb, settings_version int, created_at, updated_at`

`brand_settings` holds voice/tone, palette, typography rules, audience
profiles, platform design rules, CTA preferences, claims
(`permitted` / `prohibited` / `requires_verification`). Every change bumps
`settings_version` and inserts a snapshot into `brand_settings_history`
(`brand_id, version, settings jsonb`) so a creative can reference the exact
brand version it was built with.

### brand_assets
`id, brand_id, asset_type (logo|font|reference_image|template|other), storage_path, metadata jsonb, version, created_at`

### content_projects
`id, workspace_id, brand_id, owner_id, title, original_idea, input_source (manual|telegram|csv|url), source_url, source_metadata jsonb, content_type (static|carousel|video), objective, audience, language, status, current_stage, dedupe_hash, import_batch_id, created_at, updated_at`

- `dedupe_hash` = SHA-256 of normalized idea text + source_url; unique per
  workspace (partial index excluding cancelled) → duplicate detection.
- `status` and `current_stage` use enums from `docs/WORKFLOW.md §2`.
- The analysis result is stored in `project_analyses (id, project_id, version, analysis jsonb, created_at)`.

### questionnaires
`id, project_id, version, questions jsonb, status (draft|awaiting_answers|answered|superseded), created_at`

### questionnaire_answers
`id, project_id, questionnaire_id, answers jsonb, is_draft bool, submitted_by, submitted_at`

### content_briefs
`id, project_id, version, brief jsonb, validation_status (valid|needs_clarification|invalid), created_at`

### scripts
`id, project_id, brief_id, version, content jsonb, content_hash, status (draft|in_review|changes_requested|approved|rejected|superseded), parent_script_id, created_at, created_by`

### creative_versions
`id, project_id, script_id, brand_settings_version, version, repository_url, commit_sha, source_path, preview_path, configuration jsonb, content_hash, status (generating|in_review|changes_requested|approved|rejected|superseded|failed), created_at`

### render_jobs
`id, project_id, creative_version_id, output_type (png|carousel|mp4), configuration jsonb, status (queued|running|succeeded|failed|cancelled|outdated), progress int 0–100, attempts, idempotency_key unique, error_details jsonb, started_at, completed_at`

### media_assets
`id, project_id, render_job_id, creative_version_id, asset_type (png|carousel_slide|mp4|thumbnail|contact_sheet|manifest), slide_index, storage_path, mime_type, file_size, width, height, duration, checksum, metadata jsonb, status (pending_review|approved|rejected|outdated), created_at`

Carousel order: `slide_index` + a `manifest` asset (see `CONTRACTS.md §8`).

### approvals
`id, project_id, stage (script|creative|media|publish), artifact_type, artifact_id, artifact_version, artifact_hash, decision (approved|changes_requested|rejected), comment, reviewer_id, created_at`

- Insert-only (no UPDATE/DELETE policy; trigger rejects updates).
- `artifact_hash` must equal the artifact's current `content_hash`
  (checked in the `record_approval` RPC) — protects against approving a
  version that changed underneath.

### publishing_jobs
`id, project_id, media_manifest jsonb, approval_id, platform, connected_account_id, caption, hashtags text[], link, scheduled_at, status (draft|ready|scheduled|publishing|published|failed|cancelled), idempotency_key unique, external_post_id, published_url, published_at, provider_response jsonb, error_details jsonb, created_at, updated_at`

`approval_id` must reference an `approved` media approval for the same
manifest — enforced by constraint trigger.

### workflow_jobs
`id, project_id, stage, kind (n8n|creative_worker|render_worker|publish), idempotency_key unique, status (queued|running|succeeded|failed|needs_attention|cancelled), attempts, max_attempts default 3, locked_by, lease_expires_at, next_run_at, input_reference jsonb, output_reference jsonb, error_details jsonb, started_at, completed_at, created_at`

### workflow_events
`id, project_id, workflow_job_id, event_type, event_data jsonb, actor_id (null = system), created_at` — insert-only audit log.

## 4. Key indexes

- `content_projects (workspace_id, status)`, `(workspace_id, created_at desc)`, unique `(workspace_id, dedupe_hash)` where status <> 'cancelled'.
- `(project_id, version)` unique on every versioned table.
- `workflow_jobs (kind, status, next_run_at)` for claiming; `(project_id)`.
- `render_jobs (creative_version_id)`, `media_assets (render_job_id)`, `approvals (artifact_type, artifact_id)`.
- `publishing_jobs (status, scheduled_at)`.
- Full-text: `content_projects` GIN on `to_tsvector('simple', title || ' ' || original_idea)`.

## 5. RPCs (security definer, called by API / n8n / workers)

| Function | Caller | Purpose |
|----------|--------|---------|
| `transition_project(project_id, to_status, actor, event_data)` | API, n8n | Validates against transition table, updates status, writes event. Only path that changes `status`. |
| `record_approval(...)` | API | Checks role, artifact hash, stage; inserts approval; transitions project; marks superseded/outdated downstream. |
| `create_job(project_id, stage, kind, idempotency_key, input)` | API, n8n | Insert-or-return-existing by idempotency key. |
| `claim_job(kind, worker_id, lease_seconds)` | workers | `FOR UPDATE SKIP LOCKED`, sets lease, increments attempts. |
| `heartbeat_job(job_id, worker_id, progress)` | workers | Extends lease. |
| `complete_job(job_id, output)` / `fail_job(job_id, error, retryable)` | workers, n8n | Final state; retryable failures get `next_run_at` with backoff; over `max_attempts` → `needs_attention`. |
| `mark_downstream_outdated(artifact_type, artifact_id)` | internal | Cascade rule from `WORKFLOW.md §5`. (P2-T08) |
| `create_project(workspace, actor, record, dedupe_hash, allow_duplicate, source_key, auto_analyze, import_batch)` | API | Atomic intake: role check, source-key replay, advisory-locked dedupe, insert, `analysis` job, `new → analyzing`. Returns `{project_id, created, replayed, duplicate_of, status, job_id}`. |
| `cancel_job(job, actor)` / `retry_job(job, actor)` | API (monitor) | Cancel; or requeue a `needs_attention` job and return a `failed` project to `failed_from_status`. |
| `recover_jobs()` | n8n Workflow R | Requeue expired leases, escalate exhausted ones. |
| `log_event(project, type, data, actor, job)` | API, n8n | Append to `workflow_events`. |

All of the above are `security definer`, `search_path = ''`, executable by
`service_role` only (Edge Functions authorize the user first). User-callable
RPCs (e.g. `record_approval`) derive the actor from `auth.uid()`.

### Phase 2 RPCs (P2-T04, all service-role only; the API passes the verified user)
`start_job` (claim a specific delivered job) · `request_analysis` · `save_analysis` · `save_answers_draft` · `submit_answers` (inserts the `config` approval) · `save_brief` (valid → script job; needs_clarification → clarification questionnaire) · `save_script` (`ai` / `manual_edit`) · `request_script_regeneration` · `record_approval` (scripts) · `mark_downstream_outdated` · `notification_target`. Each `save_*` completes its job in the same transaction. `approval_stage` gained `config`; `questionnaire_answers.content_hash`; briefs/scripts record `model` and `prompt_version`.

### Phase 3 RPCs (P3-T04, ADR-0007)
`save_creative_version` (worker; supersedes earlier creatives, outdates their renders/media, completes the job) · `record_approval` for `creative_version` (approve → `queue_render`; changes → revision job from that version; reject → fresh direction). `creative_versions` gained `workflow_job_id`, `generator`.

### Phase 4 RPCs (P4, ADR-0008)
- `render_jobs` gained `version` (per project, unique), `manifest`, `manifest_hash`. Open renders (`queued/running/failed/cancelled`) may change; a `succeeded` render is frozen except `status → outdated`. A trigger on `workflow_jobs` mirrors claim / progress / retry / failure / cancel onto the render job.
- `queue_render(project, creative_version, actor, key)` — approved creative only; output type from the creative's format; expected width/height/slide count in `configuration`; creates the `render_worker` job. Idempotent by key.
- `claim_render_job(worker, lease, output_types[])` — like `claim_job`, filtered by output type (Phase 4 workers: `png`, `carousel`).
- `save_render(job, worker, render_job, assets[])` — checks paths, sizes, slide numbering/count; inserts `media_assets`; builds the manifest (`CONTRACTS.md §8`) and `manifest_hash = sha256(manifest::text)`; outdates older renders; `rendering → media_in_review`; completes the job.
- `request_render(actor, creative_version, key)` — editors; from `rendering` (after a failed/cancelled render) or `media_in_review` (manual rerender).
- `record_approval(..., p_return_to)` — `media_manifest` decisions: approve → assets `approved`, `ready_to_publish`; changes + `render` → `queue_render`; changes + `creative` → creative revision job; reject → fresh creative direction.
- `create_publishing_job(actor, project, approval, platform, caption, hashtags, link, key)` — editors; needs the approved, still-current manifest; status `ready`; idempotent.
- `mark_published_manually(actor, publishing_job, url)` — https URL; `ready → published`; `ready_to_publish → published`.

### Implemented details (P1)
- `content_projects.failed_from_status` — admin retry may only return there.
- `content_projects.source_idempotency_key` (unique) — `telegram:<update_id>`,
  `csv:<batch>:<row>`; replays return the existing project.
- A trigger rejects any change to `status` / `current_stage` outside
  `transition_project()` (it sets the transaction-local flag `cc.in_transition`).
- `private.guard_immutable(mutable_cols, open_statuses)` freezes version rows;
  `private.guard_status_flow()` keeps approved → superseded/outdated only.
- `questionnaires.kind` (`initial` / `clarification`), `scripts.origin`
  (`ai` / `manual_edit` / `section_regeneration`), `scripts.parent_script_id`.
- `creative_versions` cannot leave `generating` without `commit_sha`,
  `content_hash`, `preview_path` (traceability, blueprint §13).
- `publishing_jobs` insert requires an `approved` `media` approval of a
  `media_manifest` whose hash equals `manifest_hash`; manifest is frozen after.

## 6. RLS summary

- Helper `is_member(workspace_id, roles[])`.
- `select`: any member of the project's workspace.
- `insert/update` on editable drafts: `admin`, `editor`.
- `approvals insert`: only via `record_approval` (RPC) — direct insert denied.
- `brands`, `ai_settings`, `connected_accounts` write: `admin` only.
- `workflow_jobs`, `workflow_events`: read for members; write only service role / RPCs.
- Storage buckets: `brand-assets` (members read, admin write), `imports` (editor write), `previews` (members read via signed URL, worker write), `media` (members read via signed URL, worker write).

## 7. Storage layout

```
brand-assets/<brand_id>/<asset_type>/<version>/<filename>
imports/<workspace_id>/<import_batch_id>/<filename>.csv
previews/<project_id>/creative-v<version>/...
media/<project_id>/render-<render_job_id>/<filename>
```
