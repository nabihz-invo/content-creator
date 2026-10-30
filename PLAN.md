# Implementation Plan

This is the single tracker for **what to build and what is already built**.
Agents: follow the procedure in `CLAUDE.md §3`. Update the `Status` and
`Owner` columns here, and log finished work in `docs/PROGRESS_LOG.md`.

**Status values:** `todo` · `in-progress` · `done` · `blocked` · `deferred`
**Rule:** finish and test a phase (its last `…-VERIFY` task is `done`) before
starting the next one (blueprint §14).

## Phase board

| Phase | Goal | Release | Status |
|-------|------|---------|--------|
| P0 | Foundation: repo, tooling, shared package, decisions | initial | done |
| P1 | Database, auth, brand settings, dashboard, intake | initial | done |
| P2 | AI configuration (approved by user), brief, script generation, approvals | initial | done |
| P3 | GitHub + Claude Code creative worker, isolated preview, creative versioning | initial | done (P3-T08 is an owner action) |
| P4 | PNG + carousel rendering, media library, final approval, manual publishing prep | initial | todo |
| P5 | Video rendering, FFmpeg validation, resumable renders, voice notes | second | todo |
| P6 | Buffer publishing, scheduling, calendar, retries, monitoring | second | todo |
| P7 | Later enhancements (teams, analytics, repurposing, …) | later | deferred |

---

## P0 — Foundation

| ID | Task | Status | Depends on | Owner |
|----|------|--------|-----------|-------|
| P0-T01 | Monorepo scaffold and CI | done | — | claude/sweet-rubin-5q9utc |
| P0-T02 | Shared package skeleton (status enums, transitions, hashing) | done | P0-T01 | claude/sweet-rubin-5q9utc |
| P0-T03 | Decide frontend repo layout (ADR-0001) | done | — | claude/sweet-rubin-5q9utc |
| P0-T04 | Local Supabase project init | done | P0-T01 | claude/sweet-rubin-5q9utc |
| P0-T05 | n8n integration conventions + credentials inventory | done | — | claude/sweet-rubin-5q9utc |
| P0-VERIFY | Phase 0 verification | done | P0-T01…T05 | claude/sweet-rubin-5q9utc |

**P0-T01 Monorepo scaffold and CI**
- Deliverables: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, ESLint/Prettier config, `.gitignore` (env, media, node_modules), `.editorconfig`, `.github/workflows/ci.yml` (install, lint, typecheck, test, secret scan).
- Acceptance: `pnpm install && pnpm lint && pnpm typecheck && pnpm test` pass on an empty workspace; CI green.
- Refs: `docs/ARCHITECTURE.md §3`, `docs/CONVENTIONS.md`.

**P0-T02 Shared package skeleton**
- Deliverables: `packages/shared/src/status.ts` (project status enum, stage keys, transition table from `WORKFLOW.md §3`, `canTransition()`), `src/hash.ts` (canonical JSON + SHA-256), `schemas/` folder with README, Vitest tests.
- Acceptance: tests cover every allowed transition and reject a sample of disallowed ones; hash is stable regardless of key order.
- Refs: `docs/WORKFLOW.md §2–3`, `docs/CONTRACTS.md`.

**P0-T03 Decide frontend repo layout**
- Decision: no Lovable; Vite CRM in `apps/crm/` built by agents. See `docs/adr/0001-monorepo-layout.md` (accepted).

**P0-T04 Local Supabase project init**
- Deliverables: `supabase/config.toml`, `supabase/seed.sql` (empty placeholder), `supabase/README.md` (start/reset/test commands), root scripts `db:start`, `db:reset`, `db:test`.
- Acceptance: `supabase start` + `supabase db reset` succeed locally.

**P0-T05 n8n integration conventions**
- Deliverables: `n8n/README.md` — how to import/export workflows, credential names (no values), webhook URL pattern, HMAC signing scheme (`X-Signature: sha256=<hmac(body)>`, timestamp header, 5-min window), environment variables.
- Acceptance: document reviewed; Edge Function and n8n sides can be implemented from it independently.
- Refs: `docs/ARCHITECTURE.md §4, §6`.

**P0-VERIFY** — all P0 acceptance criteria re-checked; phase board updated.

---

## P1 — Database, auth, brand settings, dashboard, intake

| ID | Task | Status | Depends on | Owner |
|----|------|--------|-----------|-------|
| P1-T01 | Migration: tenancy, profiles, roles, helpers | done | P0-T04 | claude/sweet-rubin-5q9utc |
| P1-T02 | Migration: brands, brand history, brand assets, storage buckets | done | P1-T01 | claude/sweet-rubin-5q9utc |
| P1-T03 | Migration: content_projects, analyses, tags, import_batches | done | P1-T02 | claude/sweet-rubin-5q9utc |
| P1-T04 | Migration: workflow_jobs/events, idempotency, job + transition RPCs | done | P1-T03, P0-T02 | claude/sweet-rubin-5q9utc |
| P1-T05 | Migration: artifact tables (questionnaires → publishing_jobs, approvals) + immutability triggers | done | P1-T04 | claude/sweet-rubin-5q9utc |
| P1-T06 | RLS policies + pgTAP tests | done | P1-T05 | claude/sweet-rubin-5q9utc |
| P1-T07 | Edge Functions shared lib | done | P1-T04, P0-T05 | claude/sweet-rubin-5q9utc |
| P1-T08 | `POST /api/content-projects` with dedupe | done | P1-T07 | claude/sweet-rubin-5q9utc |
| P1-T09 | `POST /api/imports/csv` | done | P1-T08 | claude/sweet-rubin-5q9utc |
| P1-T10 | `POST /api/webhooks/telegram` (text + URL) | done | P1-T08 | claude/sweet-rubin-5q9utc |
| P1-T11 | Safe URL fetch + text extraction | done | P1-T07 | claude/sweet-rubin-5q9utc |
| P1-T12 | Intake replies + Telegram webhook setup (Workflow A folded into Edge Functions, ADR-0005) | done | P1-T10, P1-T11 | claude/sweet-rubin-5q9utc |
| P1-T13 | CRM scaffold: auth, layout, i18n/RTL, API client | done | P0-T03, P1-T06 | claude/sweet-rubin-5q9utc |
| P1-T14 | CRM Brand manager | done | P1-T13 | claude/sweet-rubin-5q9utc |
| P1-T15 | CRM Idea inbox (manual, CSV mapping, list/search/tags, duplicates) | done | P1-T13, P1-T09 | claude/sweet-rubin-5q9utc |
| P1-T16 | CRM Overview dashboard | done | P1-T13 | claude/sweet-rubin-5q9utc |
| P1-T17 | CRM Project detail shell + event timeline | done | P1-T13 | claude/sweet-rubin-5q9utc |
| P1-VERIFY | Phase 1 end-to-end verification | done | P1-T01…T17 | claude/sweet-rubin-5q9utc |

**P1-T01** — `profiles`, `workspaces`, `workspace_members` (role enum admin/editor/reviewer), `set_updated_at()` trigger, `is_member(workspace_id, roles[])`, auto-create profile + personal workspace on signup. Acceptance: new user gets a workspace with role admin. Refs: `DATA_MODEL.md §2, §6`.

**P1-T02** — `brands` (+`settings_version`), `brand_settings_history`, `brand_assets`, Storage buckets `brand-assets`, `imports`, `previews`, `media` with policies. Acceptance: updating `brand_settings` bumps version and writes history row (trigger). Refs: `DATA_MODEL.md §3, §7`.

**P1-T03** — `content_projects` with status/stage enums, `dedupe_hash` unique partial index, full-text index; `project_analyses`; `tags`, `project_tags`; `import_batches`. Refs: `DATA_MODEL.md §3–4`, `WORKFLOW.md §2`.

**P1-T04** — `workflow_jobs`, `workflow_events`, `idempotency_keys`; RPCs `transition_project`, `create_job`, `claim_job`, `heartbeat_job`, `complete_job`, `fail_job`. Transition table in SQL must match `packages/shared/src/status.ts` (add a test that compares them). Acceptance: pgTAP — invalid transition raises; duplicate idempotency key returns existing job; two concurrent claims never get the same job; failed retryable job gets backoff `next_run_at`. Refs: `DATA_MODEL.md §5`, `ADR-0003`.

**P1-T05** — `questionnaires`, `questionnaire_answers`, `content_briefs`, `scripts`, `creative_versions`, `render_jobs`, `media_assets`, `approvals`, `publishing_jobs`, `connected_accounts`, `ai_settings`. Unique `(project_id, version)`; triggers: block content updates on approved rows, block UPDATE/DELETE on `approvals` and `workflow_events`. Acceptance: pgTAP proves immutability. Refs: `DATA_MODEL.md §3`.

**P1-T06** — RLS on all tables per `DATA_MODEL.md §6`. pgTAP tests per role (admin/editor/reviewer/non-member). Acceptance: non-member sees nothing; reviewer cannot write brands or drafts; nobody can insert approvals directly.

**P1-T07** — `supabase/functions/_shared/`: JWT auth + role lookup, schema validation (ajv with `packages/shared/schemas`), error envelope, idempotency middleware, rate limiter, signed n8n webhook client. Acceptance: unit tests for each middleware. Refs: `API.md` common rules.

**P1-T08** — create project from manual idea: normalize, compute `dedupe_hash`, insert, create `analysis` job, event, call n8n. Duplicate → return existing. Acceptance: Deno tests for create, duplicate, validation error, unauthorized. Refs: `API.md`, `CONTRACTS.md §1`.

**P1-T09** — CSV import with mapping, dry-run, formula-injection sanitizing, per-row report, idempotency by `batch_id:row`. Acceptance: fixture CSV with valid, invalid, duplicate rows yields correct totals; re-running the same batch creates no new projects (blueprint §13).

**P1-T10** — verify Telegram secret header, map `from.id` → `profiles.telegram_user_id`, text/URL → project via same service as T08, idempotency key `telegram:<update_id>`. Voice → reply "not yet supported" (Phase 5). Acceptance: replayed update does not duplicate.

**P1-T11** — server-side fetcher: http/https only, DNS-resolve + block private ranges, 10 s timeout, 2 MB cap, readability-style text extraction, stores `fetched_title`, `extracted_text` in `source_metadata`. Acceptance: tests for SSRF block list, oversize, non-HTML. Refs: `SECURITY.md`.

**P1-T12** — Superseded by ADR-0005: the `telegram-webhook` function replies inline with the project link; `scripts/telegram-set-webhook.sh` registers the webhook. No n8n Workflow A. Acceptance: Telegram text and URL each create a project (blueprint §13) — covered by `supabase/functions/tests/telegram.test.ts`.

**P1-T13** — Vite + React app (`apps/crm`): Supabase auth (email magic link), app shell with nav for all modules A–J (placeholders ok), `en`/`ar` i18n, RTL switching, `lib/api.ts`, generated DB types. Acceptance: login works; switching to Arabic flips layout.

**P1-T14** — Brand manager: CRUD brand, settings form (voice, palette, typography, audiences, platform rules, CTA, claims), asset upload (logos, fonts, references) with versioning. Acceptance: settings history visible; assets stored under correct path.

**P1-T15** — Idea inbox: manual form, URL submission, CSV upload with column-mapping UI and import report, list with search/filter by status/source/brand/tag, tagging, duplicate badge, bulk "analyze".

**P1-T16** — Overview: counts per status group (blueprint §4A) via a SQL view `project_status_counts`; failed/attention list.

**P1-T17** — Project page shell: header (status, stage, brand), tabs for Idea / Questionnaire / Brief / Scripts / Creative / Media / Publishing / History; History renders `workflow_events`.

**P1-VERIFY** — Manual + automated: an idea from dashboard, CSV, Telegram text, and Telegram URL each creates exactly one project; CSV report correct; all tests green; RLS tests green.

---

## P2 — AI configuration, brief, script, approvals (ADR-0006)

Flow: idea → **AI analysis proposes a filled configuration** → user reviews,
edits and **approves the configuration** → AI brief (asks for clarification
only if essential facts are missing) → AI script → script approval. The
approved configuration also drives the deterministic creative prompt for
Phase 3 (3D motion graphics / HTML).

| ID | Task | Status | Depends on | Owner |
|----|------|--------|-----------|-------|
| P2-T01 | Configuration catalog, JSON schemas, shared answer validator | done | P0-T02 | claude/sweet-rubin-5q9utc |
| P2-T02 | Prompt templates v1 (analysis, brief, script) + renderer + `ai_settings` defaults | done | P2-T01 | claude/sweet-rubin-5q9utc |
| P2-T03 | Creative prompt builder (motion graphics + HTML) from approved config/script | done | P2-T01 | claude/sweet-rubin-5q9utc |
| P2-T04 | DB: stage RPCs, config approval, `record_approval`, outdated cascade + pgTAP | done | P1-T05 | claude/sweet-rubin-5q9utc |
| P2-T05 | LLM client (Anthropic SDK, structured outputs, fallbacks, validation retry) + fake provider | done | P2-T01 | claude/sweet-rubin-5q9utc |
| P2-T06 | Stage executors + `/internal/run-job` + `/internal/recover` | done | P2-T02, P2-T04, P2-T05 | claude/sweet-rubin-5q9utc |
| P2-T07 | API: analyze, questionnaire submit (draft/approve), scripts generate/edit, approvals | done | P2-T04 | claude/sweet-rubin-5q9utc |
| P2-T08 | n8n workflow exports (stage runner, notify, recovery) + local n8n shim | done | P2-T06 | claude/sweet-rubin-5q9utc |
| P2-T09 | CRM: AI configuration review + analysis summary + brief view | done | P2-T07 | claude/sweet-rubin-5q9utc |
| P2-T10 | CRM: script review, versions, edit, regenerate, approvals, creative prompt preview | done | P2-T07, P2-T03 | claude/sweet-rubin-5q9utc |
| P2-T11 | Inbox bulk "analyze" + overview wording | done | P2-T07 | claude/sweet-rubin-5q9utc |
| P2-T12 | Scene-level inline comments + section regeneration | todo | P2-T10 | |
| P2-VERIFY | Phase 2 end-to-end verification | done | P2-T01…T11 | claude/sweet-rubin-5q9utc |

**P2-T01** — `packages/shared/src/config-catalog.ts` (stable question IDs, bilingual labels, options, `show_if` per format, brand-default mapping); schemas `analysis-stage.output`, `questionnaire`, `answers`, `brief-stage.output`, `script.{video,carousel,static}`; `validateAnswers()` (visibility, required, options, validation) shared by API and CRM. Acceptance: unit tests for conditional visibility, required checks, option validation, AI-decide.

**P2-T02** — `packages/shared/prompts/*.v1.md` → generated `templates.generated.ts`; renderer with `<untrusted_source>` wrapping; analysis prompt selects/pre-fills the catalog; brief prompt detects contradictions and asks only essential clarifications; script prompt per format (video = scene plan with timestamps, camera, overlays). Acceptance: render tests; injection text stays inside the untrusted block.

**P2-T03** — `buildCreativePrompt({config, brief, script, brand})`: motion-graphics architect instruction (deterministic `t`, resolution from aspect ratio, style/shader system, camera keyframes from scenes, 2D overlay with RTL Arabic support, post-processing, self-verification) and HTML/CSS instruction for static/carousel. Acceptance: snapshot-style tests for each format.

**P2-T04** — migration: `start_job`, `save_analysis`, `save_answers_draft`, `submit_answers` (config approval row), `save_brief` (clarification path), `save_script`, `record_approval`, `mark_downstream_outdated`; `approvals.stage` gains `config`. Acceptance (pgTAP): script job never exists while answers are unsubmitted; stale hash → error; resubmitting answers supersedes downstream scripts; approval of v2 leaves v1 untouched; reviewer can approve, cannot edit.

**P2-T05** — `_shared/llm.ts`: SDK client, `output_config.format` with a strict-compatible schema, `effort` per stage, `fallbacks: "default"`, refusal/max_tokens handling, ajv validation + one retry with errors; `fake` provider. Acceptance: Deno tests with a mocked SDK response path and the fake provider.

**P2-T06** — executors for `analysis`, `brief`, `script` stages; background execution; complete/fail with retry classification; dispatch next job; `/internal/recover` re-dispatches lost jobs. Acceptance: Deno tests run the whole chain with the fake provider; replayed run-job is a no-op.

**P2-T07** — endpoints per `docs/API.md`. Acceptance: missing required answer → 422 and status unchanged; reviewer cannot submit config or edit scripts; approval with stale hash → 409.

**P2-T08** — `n8n/workflows/*.json` (thin: webhook → HMAC → run-job; notify; recovery cron) + `scripts/local-stack/n8n-shim.mjs` so the local stack runs the pipeline without n8n.

**P2-T09** — questionnaire tab becomes "AI configuration": analysis summary (topic, proposed format and why, missing info, claims to verify), grouped form pre-filled with AI suggestions (badge + rationale + confidence), brand defaults, "Let AI decide", conditional fields, save draft, approve; clarification round; brief tab.

**P2-T10** — script tab: version list, per-format view (scene timeline / slides / post), edit → new version, regenerate with instructions, approve / request changes / reject (bound to version + hash), approval history; creative prompt preview for the approved script.

**P2-T11** — inbox bulk-select "Analyze" for `new`/`failed` projects; overview "Configurations awaiting review".

**P2-T12** (follow-up, todo) — Inline comments on individual scenes/slides and per-section regeneration (blueprint §4F); P2 ships whole-script comments and regeneration.

**P2-VERIFY** — e2e: idea → AI configuration → edit + approve → brief → script v1 → changes requested → v2 → approved → creative prompt visible; audit trail complete; recovery re-dispatch works; all suites green.

---

## P3 — Creative generation (Claude Code worker), git-traced source, isolated preview (ADR-0007)

| ID | Task | Status | Depends on | Owner |
|----|------|--------|-----------|-------|
| P3-T01 | Content spec builder (shared) | done | P2-VERIFY | claude/sweet-rubin-5q9utc |
| P3-T02 | Starter templates: static post, carousel, 3D motion (Three.js) + workspace rules | done | P3-T01 | claude/sweet-rubin-5q9utc |
| P3-T03 | Generated-code validator | done | P3-T02 | claude/sweet-rubin-5q9utc |
| P3-T04 | DB: creative RPCs, creative approvals, worker job kind + pgTAP | done | P2-T04 | claude/sweet-rubin-5q9utc |
| P3-T05 | `workers/creative-worker`: job loop, workspace, generators (template / Claude Code), git source store, preview bundle, thumbnails, upload | done | P3-T01…T04 | claude/sweet-rubin-5q9utc |
| P3-T06 | `workers/preview-server` (separate origin, signed URLs, CSP) + API preview-url and creative approvals | done | P3-T04 | claude/sweet-rubin-5q9utc |
| P3-T07 | CRM creative studio (sandboxed preview, versions, slides, thumbnails, approve / request changes / regenerate) | done | P3-T05, P3-T06 | claude/sweet-rubin-5q9utc |
| P3-T08 | Creatives GitHub repository + production deployment notes (needs the owner: create repo, token) | todo | P3-T05 | |
| P3-VERIFY | Phase 3 verification | done | P3-T01…T07 | claude/sweet-rubin-5q9utc |

**P3-T01** — `buildContentSpec({ project, brief, script, brand, version, revisionNotes })`: dimensions, fps/duration, direction, palette roles, fonts, copy, units (scenes/slides/post). Acceptance: unit tests per format.

**P3-T02** — `templates/_common` (runtime: spec loading, fonts, readiness, seeded PRNG, easing, RTL text fitting), `templates/static-post`, `templates/carousel` (`?slide=N`), `templates/motion` (Three.js, deterministic `window.__render.seek(t)`, camera keyframes from scenes, 2D overlay, style-specific materials, bloom/grain per post-FX). Workspace `CLAUDE.md`. Acceptance: each template renders every visual style in headless Chromium without errors, Arabic and English.

**P3-T03** — validator: file types/sizes/count, forbidden APIs (network, eval, storage, parent/top access, `Math.random`), remote URLs, required readiness hooks. Acceptance: malicious fixtures rejected; templates pass.

**P3-T04** — `save_creative_version`, creative `record_approval` (approve → render job; changes requested → revision job; rejected → regenerate from scratch), script approval queues a `creative_worker` job. Acceptance (pgTAP): traceability fields required; stale hash refused; approval of v2 leaves v1 intact.

**P3-T05** — worker per ADR-0007. Acceptance: integration test runs a job end to end against the local stack (git commit exists, thumbnails uploaded, version in review); replay/cancel safe; Claude Code invocation contract tested with a stub CLI.

**P3-T06** — preview server + `GET /api/creative-versions/:id/preview`. Acceptance: expired/forged tokens refused; CSP blocks network; iframe cannot reach the CRM.

**P3-T07** — creative tab: sandboxed live preview scaled to fit, slide picker, version list, thumbnails, files and commit, validation report, approve / request changes / regenerate; global "Creative studio" list of creatives awaiting review. e2e.

**P3-T08** — owner action: create the `content-creatives` repository, a fine-grained token (contents:write on that repo only), set `CREATIVES_REPO_URL`; deploy worker and preview server.

## P4 — PNG & carousel rendering, media library, final approval

| ID | Task | Status | Depends on | Owner |
|----|------|--------|-----------|-------|
| P4-T01 | render-worker container + sandbox | todo | P3-T02 | |
| P4-T02 | PNG renderer + validation | todo | P4-T01 | |
| P4-T03 | Carousel renderer + manifest | todo | P4-T02 | |
| P4-T04 | `render-jobs` endpoints + n8n Workflow F | todo | P4-T03, P3-VERIFY | |
| P4-T05 | Media manifest approval + outdated marking | todo | P4-T04, P2-T08 | |
| P4-T06 | CRM Media library | todo | P4-T04 | |
| P4-T07 | CRM final media review | todo | P4-T05 | |
| P4-T08 | Manual publishing preparation (`publishing-jobs`, download bundle) | todo | P4-T05 | |
| P4-T09 | CRM Workflow monitor (retry / cancel) | todo | P2-T12 | |
| P4-VERIFY | Initial release acceptance (blueprint §13) | todo | P4-T01…T09 | |

**P4-T01** — `workers/render-worker/Dockerfile` (Node 20, Playwright Chromium, FFmpeg, non-root), network disabled for the browser (local static server only), per-job temp dir cleanup, concurrency + timeout config.

**P4-T02** — checkout creative at `commit_sha`, serve locally, wait for `document.fonts.ready` + images + `window.__ready`, screenshot at exact dimensions, validate (dimensions, non-blank via pixel variance, size), checksum, upload, `media_assets` rows. Acceptance: output dimensions match config (blueprint §13).

**P4-T03** — render each slide independently, consistent dimensions, order check, `manifest` asset per `CONTRACTS.md §8`.

**P4-T04** — `POST /api/render-jobs` (requires approved creative, idempotency key), `GET /api/render-jobs/{id}`; Workflow F. Acceptance: retrying same key creates no second job.

**P4-T05** — approval of `media_manifest` by `manifest_hash`; rerender / return to creative / reject paths; new creative version marks old renders `outdated`.

**P4-T06** — grid/list of assets with filters (type, project, status), dimensions, size, version, approval state, preview + signed download links.

**P4-T07** — shows actual rendered files (not HTML), slide-by-slide, checksum/dimension info, approve / rerender / back to creative / reject / download.

**P4-T08** — `POST /api/publishing-jobs` validates approval + manifest hash + platform constraints; creates job `ready`; generates zip (media in order + `caption.txt` + hashtags) for manual posting; "mark as posted manually" records URL. Acceptance: no package possible without approved media (blueprint §13).

**P4-T09** — list of `workflow_jobs` / `render_jobs` with stage, times, attempts, last error, related versions; retry/cancel for admin.

**P4-VERIFY** — run the full blueprint §13 checklist; record results in `docs/PROGRESS_LOG.md`. Initial release ready for production testing.

---

## P5 — Video rendering (second release)

| ID | Task | Status | Depends on | Owner |
|----|------|--------|-----------|-------|
| P5-T01 | Deterministic timeline contract (`window.__render.seek(t)`) | todo | P4-VERIFY | |
| P5-T02 | Three.js / animated video template | todo | P5-T01 | |
| P5-T03 | Frame capture + FFmpeg MP4 encode (+ audio track) | todo | P5-T01 | |
| P5-T04 | ffprobe validation, thumbnail, contact sheet | todo | P5-T03 | |
| P5-T05 | Resumable render jobs (frame-chunk checkpoints) | todo | P5-T03 | |
| P5-T06 | CRM video preview / playback | todo | P5-T04 | |
| P5-T07 | Telegram voice-note transcription | todo | P4-VERIFY | |
| P5-VERIFY | Phase 5 verification | todo | P5-T01…T07 | |

Key acceptance: same creative + commit renders byte-identical frames; MP4 duration/fps/dimensions/audio validated; a killed render resumes from last checkpoint; voice note creates a project from its transcript.

---

## P6 — Publishing (second release)

| ID | Task | Status | Depends on | Owner |
|----|------|--------|-----------|-------|
| P6-T01 | Connected accounts management + Buffer credentials in n8n | todo | P4-VERIFY | |
| P6-T02 | Platform constraint validators (dimensions, types, caption limits) | todo | P6-T01 | |
| P6-T03 | n8n Workflow G: submit / schedule via Buffer | todo | P6-T02 | |
| P6-T04 | Confirmation (poll/webhook); `published` only on provider confirm | todo | P6-T03 | |
| P6-T05 | Publishing error handling + retries + idempotency | todo | P6-T03 | |
| P6-T06 | CRM Publishing calendar | todo | P6-T03 | |
| P6-T07 | Additional platform integrations / direct APIs | deferred | P6-VERIFY | |
| P6-VERIFY | Phase 6 verification | todo | P6-T01…T06 | |

Key acceptance: publishing impossible without media approval; retrying a publish never double-posts; external post ID + URL + actual time stored; failures visible in calendar and monitor.

---

## P7 — Later enhancements (deferred)

Multi-user teams and client workspaces · performance analytics · recommendations
from results · automated repurposing across formats/languages · template
marketplace · campaign planning. Plan these when P6 is done.
