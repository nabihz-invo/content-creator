# Workflow, State Machine, and Approval Rules

## 1. Stages

| # | Stage key | Produces | Gate |
|---|-----------|----------|------|
| 1 | `intake` | `content_projects` row | — |
| 2 | `analysis` | `project_analyses` | — |
| 3 | `questionnaire` | `questionnaires` | waits for user answers |
| 4 | `brief` | `questionnaire_answers`, `content_briefs` | blocks on missing required info |
| 5 | `script` | `scripts` version | — |
| 6 | `script_review` | `approvals` | **human approval** |
| 7 | `creative` | `creative_versions` (+ GitHub commit, preview) | — |
| 8 | `creative_review` | `approvals` | **human approval** |
| 9 | `render` | `render_jobs`, `media_assets` | — |
| 10 | `media_review` | `approvals` | **human approval** |
| 11 | `publish` | `publishing_jobs` | requires media approval |

## 2. Project status enum

`content_projects.status` (single source of truth for "where is this project"):

```
new
analyzing
awaiting_answers
validating_answers
needs_clarification
generating_script
script_in_review
generating_creative
creative_in_review
rendering
media_in_review
ready_to_publish
scheduled
publishing
published
failed            -- a job hit needs_attention; see workflow monitor
cancelled
```

`current_stage` = the stage key from §1 (used for grouping in the Overview).

## 3. Allowed transitions

Only `transition_project()` may change status. It rejects anything not in this
table. (Mirror: `packages/shared/src/status.ts`.)

| From | To | Trigger |
|------|----|---------|
| new | analyzing | analysis job created (auto after intake, or `/analyze`) |
| analyzing | awaiting_answers | questionnaire saved |
| awaiting_answers | analyzing | analysis re-run requested |
| awaiting_answers | validating_answers | answers submitted |
| validating_answers | needs_clarification | contradictions / missing essentials |
| needs_clarification | validating_answers | clarification answers submitted |
| validating_answers | generating_script | brief valid |
| generating_script | script_in_review | script version saved |
| script_in_review | generating_script | changes requested → regenerate |
| script_in_review | script_in_review | manual edit saved (new version) |
| script_in_review | generating_creative | script approved |
| generating_creative | creative_in_review | creative version + preview recorded |
| creative_in_review | generating_creative | changes requested |
| creative_in_review | script_in_review | reviewer sends back to script |
| creative_in_review | rendering | creative approved + render job created |
| rendering | media_in_review | render succeeded + validated |
| media_in_review | rendering | rerender requested |
| media_in_review | generating_creative | return to creative editing |
| media_in_review | ready_to_publish | media approved |
| ready_to_publish | scheduled | publishing job scheduled (provider confirmed) |
| ready_to_publish / scheduled | publishing | publish now / schedule fired |
| publishing | published | **provider confirmed** |
| ready_to_publish | published | user confirms a **manual** publication (records URL) |
| publishing | ready_to_publish | publish failed, retryable after review |
| any non-terminal | failed | job reached `needs_attention` |
| failed | (previous status) | admin retry |
| any non-terminal | cancelled | user cancel |
| validating_answers … media_in_review | awaiting_answers | user edits & resubmits questionnaire (downstream outdated) |

Phase 1–4 (initial release) stop at `ready_to_publish` with **manual
download + publishing preparation**; automated `scheduled / publishing /
published` arrive in Phase 6.

## 4. n8n workflows

Each workflow is a separate export in `n8n/workflows/`. Every workflow:
starts from `{ job_id }`, loads state from Supabase, checks the job is still
`queued`/`running` and the project is still in the expected status (otherwise
exits quietly — idempotent), writes outputs via RPC, calls `complete_job` or
`fail_job`, and notifies.

| ID | Name | Trigger | Steps |
|----|------|---------|-------|
| A | Intake | — | **Implemented in Edge Functions, not n8n** (ADR-0005): `/api/content-projects`, `/api/imports/csv`, `telegram-webhook` validate → normalize → dedupe → `create_project()` → dispatch `analyze` → reply |
| B | Analyze & question | job `analysis` | load brand settings → fetch/extract URL (untrusted) → AI analysis → validate `analysis.schema` → AI questionnaire → validate `questionnaire.schema` → save → status `awaiting_answers` → notify |
| C | Answer submission | job `brief` | validate answers → required check → contradiction / missing-facts AI check → either `needs_clarification` (append clarification questions as new questionnaire version) or generate brief → validate → save → create script job |
| D | Script generation | job `script` | load brief + brand → AI script (by content_type) → validate schema + required sections → hash → save version → `script_in_review` → notify reviewer |
| E | Creative generation (folded into the creative worker, ADR-0007) | job `creative` | build `content-spec` → insert `creative_worker` job → (worker runs) → on completion: record creative version → `creative_in_review` → notify |
| F | Rendering | job `render` | **Folded into the render worker + RPCs (ADR-0008):** creative approval → `queue_render()` → worker claims by output type → checkout at commit + hash check → render → validate → `save_render()` (media rows, manifest, `media_in_review`) → `media_ready` notification |
| G | Publishing | job `publish` | validate package vs approval manifest → verify account → Buffer submit/schedule → store external IDs → status by provider response → notify |
| R | Recovery cron | every 5 min | `recover_jobs()`; re-dispatch `n8n` jobs still `queued` > 2 min after `next_run_at` (lost dispatch); notify admin of `needs_attention` |

Retry policy: transient errors (HTTP 429/5xx, timeouts) → `fail_job(retryable=true)`
with exponential backoff (1m, 5m, 25m); schema-invalid AI output → retry
once with the validation error appended to the prompt, then `needs_attention`;
permanent errors (4xx auth, policy) → `needs_attention` immediately.

## 5. Approval and revision rules

1. An approval row references `artifact_type`, `artifact_id`, `artifact_version`,
   `artifact_hash`, `reviewer_id`, timestamp.
2. Approving sets the artifact's status to `approved`; it is then immutable
   (trigger blocks updates to content columns of approved rows).
3. Any edit produces a **new version row**; the previous row stays.
4. Requesting changes returns the project to the editing stage per §3.
5. **Outdated cascade** — when a newer version of an artifact is created or an
   upstream artifact is superseded, mark everything built on the old one:
   - new questionnaire answers → brief/scripts/creatives/renders/media from older ones → `superseded`/`outdated`
   - new script version → creative_versions of older scripts → `superseded`; their render_jobs/media → `outdated`
   - new creative version → render_jobs/media of older creatives → `outdated`
   - outdated media can never be attached to a publishing job.
6. Publishing uses only the media manifest of an `approved` media approval.
7. Producers (AI, Claude Code, workers) never call `record_approval`. The RPC
   requires an authenticated human JWT with `admin`/`editor`/`reviewer` role.

## 6. Notifications

Telegram message (and in-app badge) on: questionnaire ready, clarification
needed, script ready for review, creative ready, media ready, published,
job needs attention. Messages contain a deep link to the CRM, never the
artifact itself.
