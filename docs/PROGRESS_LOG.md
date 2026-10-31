# Progress Log

Newest entry first. Append one entry per finished (or blocked) task.

Template:

```
## YYYY-MM-DD — <TASK-ID> <task title> — <done | blocked>
- Agent/branch: <session or branch>
- Changes: <files / migrations / workflows added or changed>
- Verification: <tests run, results, manual checks>
- Notes / follow-ups: <new tasks added, open questions, blockers>
```

---

## 2026-10-31 — Handoff: deployment guide, work continues locally in Claude Code
- Agent/branch: claude/sweet-rubin-5q9utc → merged into `main`
- Changes: `docs/DEPLOYMENT.md` (what runs where; creatives repository token — fine-grained, that repository only, Contents read/write, set only as `CREATIVES_REPO_URL` in the workers' environment; how to run the creative worker, render worker and preview origin; Supabase secrets; order of operations); `workers/.env.example`; `supabase/functions/.env.example` gained `AI_PROVIDER`, `ANTHROPIC_API_KEY`, `PREVIEW_ORIGIN`, `PREVIEW_SIGNING_SECRET`; CLAUDE.md doc map links the guide.
- State: Phases 0–4 done (initial release). P3-T08 in progress — the owner created the creatives repository; token and deployment pending (follow `docs/DEPLOYMENT.md`).
- For the next agent (local Claude Code):
  1. Read `CLAUDE.md`, then `PLAN.md`. The current phase is **P5 (video rendering)**; start with `P5-T01`.
  2. Run everything locally with `docs/DEVELOPMENT.md` (`pnpm stack:up`, `pnpm verify`, `scripts/db.sh test`, Deno tests, worker tests, `pnpm e2e`). The Docker daemon must be running.
  3. Real Claude in the local stack: `AI_PROVIDER=anthropic ANTHROPIC_API_KEY=… CREATIVE_GENERATOR=claude-code pnpm stack:up` (needs the `claude` CLI on PATH). Never commit keys or tokens; `.env` files are git-ignored.
  4. Open items: P5 tasks; P2-T12 (scene-level comments, optional); verify the render-worker Dockerfile build, real n8n notifications, and real Claude Code generation once keys are available.

## 2026-10-31 — Phase 4 (P4-T01…T09, P4-VERIFY) rendering, final media approval, publishing preparation — done
- Agent/branch: claude/sweet-rubin-5q9utc
- Design: ADR-0008 — `workers/render-worker` renders the approved creative from its exact Git commit (tree hash must equal the approved `content_hash`), in Chromium with every non-local request aborted, at the exact configured size; PNGs are decoded and validated (dimensions, not blank, ≤ 8 MB, carousel slides 1…n, none identical) before upload. Postgres builds the media manifest and its sha256 hash in `save_render()`; final approval names render version + manifest hash. Publishing packages (manual posting) are checked against platform rules and downloaded as a zip whose files are re-verified against the manifest checksums. Video (mp4) renders queue for the Phase 5 worker.
- Changes: migration `20261031100000` (render versions/manifests, frozen renders, workflow→render status sync, `queue_render`, `claim_render_job`, `save_render`, `request_render`, media decisions in `record_approval` with `return_to`, outdated cascade on new creatives/renders, `create_publishing_job`, `mark_published_manually`) + pgTAP `11_render_media`; `workers/render-worker` (renderer, PNG decoder, validator, loop with progress, Dockerfile, README); creative-worker package exports + signed `notify` webhook (creative_ready, media_ready, needs_attention) and n8n messages; shared `platform-rules.ts`, `zip.ts`; API `render-jobs`, `publishing-jobs` (+ bundle, mark-published), `jobs/:id/retry|cancel`, approvals `return_to`; CRM Media tab, Publishing tab, Media library, Workflow monitor (en/ar); local stack + CI run the render worker.
- Verification: `pnpm verify` clean (shared 60 tests, CRM 12, render worker 5, creative worker 8, preview server 2, n8n 5); pgTAP 11 files / 230 assertions; Deno 24 tests / 55 steps; creative worker render 10 + integration 2; render worker integration 2 (real Chromium carousel + static renders against the DB, tampered source refused); browser e2e 63/63 checks, zero console errors; screenshots 17–20.
- Blueprint §13 acceptance (initial system):
  - Every intake channel creates a project — dashboard/CSV/Telegram/URL (P1 Deno tests + e2e). ✅
  - CSV imports report created / failed / duplicate rows (Deno + e2e). ✅
  - The AI produces a valid questionnaire with the brand's settings (P2 tests, brand accent locked). ✅
  - The project waits for submitted answers; missing required answers block progression (pgTAP 08, e2e "approval is blocked…"). ✅
  - Script versions are edited and approved independently (pgTAP, e2e v1→v3). ✅
  - Creative source is traceable to its Git revision (commit per version; render manifest carries `commit_sha`; render refuses a source whose hash differs). ✅
  - The CRM shows the preview and the media assets (sandboxed preview; Media tab shows the actual PNGs). ✅
  - PNGs and carousel slides render at the configured dimensions (decoded PNG checks in the worker, `save_render` re-checks, e2e reads 1080×1350 from the image). ✅
  - Rendered files are validated before final approval (worker validator + DB checks; failures are permanent and visible). ✅
  - Approved artifacts cannot change silently (immutability triggers on scripts/creatives/renders/media; pgTAP 42501 checks). ✅
  - Publishing cannot proceed without the required approval (`create_publishing_job` + publishing guard trigger; pgTAP, Deno 409, e2e). ✅
  - A failed job can be retried without duplicate projects or posts (idempotency keys on projects, renders, publishing packages; retry_job; Deno + e2e monitor). ✅
  - Critical transitions and approval decisions are auditable (`workflow_events`, insert-only `approvals`; History tab). ✅
  - Credentials and generated code are isolated (service role server-side only; preview origin + sandbox; render network off; Claude Code tool allow-list). ✅
- Bugs found while testing: none in the new code paths beyond fixture gaps (creative fixtures without format/dimensions are now refused by `queue_render`, which is the intended behaviour).
- Not verified here: building/running `workers/render-worker/Dockerfile` (Docker Hub is rate-limited in this sandbox), real n8n delivery of the new notifications (the local shim logs them), and real Claude Code generation (no API key).
- Owner actions still open: P3-T08 (creatives repository + token, deploy the creative worker, preview origin and render worker).
- Next: Phase 5 (video rendering: `mp4` output type in the render worker, FFmpeg validation, resumable renders).

## 2026-10-30 — Phase 3 (P3-T01…T07, P3-VERIFY) creative worker, Git-traced source, isolated preview — done
- Agent/branch: claude/sweet-rubin-5q9utc
- Design: ADR-0007 — a Node worker claims `creative_worker` jobs from Postgres, assembles a workspace (starter template + trusted runtime + fonts + vendored Three.js + `spec.js` + workspace `CLAUDE.md` + `check.mjs`), runs a generator (`template`, or **Claude Code** headless with a whitelisted tool set, no web tools, private HOME and a budget cap), validates the output (one Claude fix-up round), restores the trusted runtime, renders stills offline in Playwright with the network blocked, commits each version to Git at `projects/<id>/v<n>`, uploads the preview bundle, and records it with `save_creative_version`.
- Changes: `packages/shared` (`buildContentSpec`, colour resolution/contrast, preview tokens + CSP); `templates/` (static post, carousel, deterministic 3D motion with `window.__render.seek(t)`, five visual styles, Arabic/RTL); migration `20261030100300` (creative RPCs; creative approvals → render job / revision / fresh direction; script approval queues the worker) + pgTAP `10_creative`; `workers/creative-worker`; `workers/preview-server` (separate origin, signed paths, strict CSP); API `GET /creative-versions/:id/preview` and creative approvals; CRM creative tab (sandboxed preview scaled to fit, versions, slides, stills, commit, checks, revision notes, approve / request changes / new direction) and Creative studio page; stack + CI run the worker suites.
- Verification: `pnpm verify` clean; pgTAP 10 files (189 assertions); Deno 22 tests / 45 steps; worker unit 8, template renders 10 (every template × style × language, offline), integration 2 (full job + revision against the DB); preview server 2; browser e2e all checks pass including the Phase 3 flow (sandbox attribute, separate origin, CSP, forged token 403, creative cannot touch the CRM document, v2 revision from v1 source, approval → rendering, studio list), zero console errors. Screenshots 14–16.
- Bugs found and fixed by e2e: module scripts/fonts in the opaque-origin sandbox were CORS-blocked (preview origin now sends `Access-Control-Allow-Origin: *`; access is still token-gated); worker crashed initializing the repo when its work dir did not exist yet; `stack.sh` never stopped old worker/preview processes (relative launch path); creative list stayed empty after the worker finished (not refreshed on status change); approving the creative jumped to the Idea tab.
- Not verified here: the `claude-code` generator against the real CLI (no API key in the sandbox; the invocation contract is tested with a stub CLI) and pushing to GitHub.
- Owner action (P3-T08): create the creatives repository and a fine-grained token, set `CREATIVES_REPO_URL`, deploy the worker and the preview origin.
- Next: P4-T01.

## 2026-10-30 — Phase 2 (P2-T01…T11, P2-VERIFY) AI configuration → brief → script → approvals — done
- Agent/branch: claude/sweet-rubin-5q9utc
- Design: ADR-0006 — the AI analyzes each idea and **proposes a complete production configuration** (catalog of stable questions built around the 3D motion-graphics prompt architecture: format, aspect ratio, visual style, 3–5 beats, accent colour, camera, post-FX, text density, voiceover, duration…); the user reviews/edits/approves it (recorded as a `config` approval); only then the brief and script are written. The creative prompt for Claude Code is rendered deterministically from the approved config + brand + script.
- Changes: `packages/shared` (config catalog, questionnaire validator, strict AI schemas + `toApiSchema`, `composeQuestionnaire`/`enforceApprovedConfig`/`checkScript`, versioned prompt templates with untrusted wrapping, `buildCreativePrompt`, fake AI provider); migrations `20261030100000–100200` (stage RPCs, approvals, outdated cascade, notification target); Edge Functions (`llm.ts` with official SDK, structured outputs, effort, `fallbacks: "default"`, validation retry; stage executors; Phase 2 endpoints; run-job/recover); n8n stage-runner + recovery exports with Code-node tests; local n8n shim; CRM configuration review, brief, script reviewer (versions, edit, regenerate, approve/request changes/reject, history), creative prompt view, inbox bulk analyze; `docs/examples/` rendered prompts.
- Verification: `pnpm verify` (lint, format, typecheck, unit tests: shared 46, CRM 12, n8n 5); pgTAP 9 files / 169 assertions; Deno 20 tests / 42 steps (full pipeline through HTTP incl. clarification, stale hash, replay, recovery); browser e2e 37/37 checks against the local stack, zero console errors.
- Bugs found and fixed while testing: authorization ran after validation (reviewer got 422 instead of 403); AI accent suggestion overrode the brand accent (brand identity now locked); Prettier rewrote generated files (now ignored); jobs card went stale after status changes.
- Not verified here: real Claude calls (no API key in the sandbox; the request shape is unit-tested against the SDK types) and a real n8n instance (Docker Hub rate-limited; workflow Code nodes are executed in tests).
- Next: P3-T01 (creative source repository) — or P2-T12 if inline scene comments are wanted first.

## 2026-10-29 — P1-T13…T17, P1-VERIFY CRM + Phase 1 verification — done
- Agent/branch: claude/sweet-rubin-5q9utc
- Changes: `apps/crm` (Vite + React 19 + TS + Tailwind v4 + hand-vendored shadcn-style components, TanStack Query, react-router 7): magic-link auth, app shell with sidebar/mobile drawer, light/dark theme, full en/ar i18n with RTL (preference saved to the profile); Overview (status groups, recent ideas, attention list); Idea inbox (search, status/source/brand/tag filters, pagination, desktop table + mobile cards, duplicate badges); New-idea dialog (idempotency key per draft, duplicate prompt with "create anyway"); CSV import dialog (client preview, EN/AR header auto-mapping, dry-run check, report); Project page (pipeline stepper, idea + extracted link content, audit timeline, jobs, inline title edit); Brand manager (identity, voice, palette, typography, audiences, platform rules, CTA/claims, checksummed versioned asset uploads, settings history); Settings (profile, language, Telegram link code). `scripts/local-stack` (Postgres + GoTrue + PostgREST + Storage + gateway + Deno functions) and `scripts/e2e/crm-smoke.mjs`; `docs/DEVELOPMENT.md`; CI e2e job.
- Verification: `pnpm lint/format:check/typecheck` clean; unit tests 23 (shared) + 12 (crm); Deno 12 tests / 32 steps; pgTAP 7 files / 124 assertions; e2e smoke 20/20 checks in Chromium against the full local stack, zero console errors; screenshots in `docs/screenshots/`.
- Bugs found and fixed by e2e: vendor chunk split broke React load order; ambiguous accessible names on the asset upload; CSV dry-run didn't predict duplicates (now checks existing projects and in-file repeats); header language toggle wasn't persisted to the profile; `stack.sh` didn't stop old Deno processes.
- Notes / follow-ups: shadcn registry is blocked by the sandbox network, so UI primitives are vendored by hand (same API). Inbox bulk "analyze" moved to P2-T04 (needs the analyze endpoint). Phase 1 acceptance (blueprint §13 intake items) met: every intake channel creates exactly one project; CSV reports created/failed/duplicate. Next: P2-T01.

## 2026-10-29 — P1-T01…T12 Database + intake backend — done
- Agent/branch: claude/sweet-rubin-5q9utc
- Changes: migrations `20261029100000`–`100600` (tenancy, brands + settings history + storage, projects + DB-enforced status machine, Postgres job queue RPCs, immutable artifact tables, `create_project`, rate limits + Telegram link codes); pgTAP suite `supabase/tests/01–07`; Edge Functions `api` (content-projects, imports/csv, telegram/link-code, internal/url-extract) and `telegram-webhook`, with `_shared` (auth, db, validate, idempotency, rate limit, n8n HMAC, intake, CSV, SSRF-safe extraction); JSON Schemas for intake and API requests; ADR-0005; `scripts/telegram-set-webhook.sh`; CI runs pgTAP + Deno tests on one DB.
- Verification: `pnpm db:test` → 7/7 files, 124 assertions; `deno task check` (typecheck + lint) clean; `deno task test` → 12 tests / 32 steps pass (create/dedupe/idempotency/roles, CSV created-duplicate-failed report + re-import + dry run, Telegram link/intake/replay/Arabic/roles, SSRF block list + redirects + size caps); `pnpm lint`, `format:check`, `typecheck`, `test` (23) pass.
- Notes / follow-ups: n8n Workflow A is folded into Edge Functions (ADR-0005). Workflow R must re-dispatch `queued` n8n jobs whose dispatch was lost (noted in WORKFLOW.md for P2-T12). CSV row numbers are spreadsheet rows (blank rows counted). Next: P1-T13 (CRM scaffold).

## 2026-10-29 — P0 Foundation (P0-T01…T05, P0-VERIFY) — done
- Agent/branch: claude/sweet-rubin-5q9utc
- Changes: pnpm monorepo (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, ESLint flat config, Prettier, `.editorconfig`, `.gitignore`), CI (`.github/workflows/ci.yml`: node, database, edge-functions, gitleaks); `packages/shared` with status machine (`src/status.ts`) and canonical hashing / dedupe helpers (`src/hash.ts`); `supabase/config.toml` + `scripts/db.sh` harness (official `supabase/postgres:17` image, migrations, seed, pgTAP runner); `n8n/README.md` (credential names, HMAC calling convention); ADR-0001 accepted: no Lovable, Vite CRM in `apps/crm`.
- Verification: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` (20 tests) pass; `scripts/db.sh reset` boots Postgres 17.6 with auth/storage schemas.
- Notes / follow-ups: WORKFLOW.md §3 gained two transitions (`awaiting_answers → analyzing` for re-analysis, `ready_to_publish → published` for manual publication in the initial release). The full `supabase start` stack can't pull images in the cloud sandbox; the harness covers DB work. Next: P1-T01.

## 2026-10-29 — PLAN — Project planning documents — done
- Agent/branch: claude/sweet-rubin-5q9utc
- Changes: CLAUDE.md, AGENTS.md, README.md, PLAN.md, docs/ (BLUEPRINT, ARCHITECTURE, DATA_MODEL, WORKFLOW, CONTRACTS, API, SECURITY, CONVENTIONS, adr/0001–0004).
- Verification: n/a (documentation only).
- Notes / follow-ups: P0-T03 needs a decision from the user on the Lovable repo layout. Next task: P0-T01.
