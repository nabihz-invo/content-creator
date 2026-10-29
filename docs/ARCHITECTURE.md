# Architecture

## 1. Principles

1. **Supabase owns state.** Every project, version, job, approval, and event is
   a Postgres row. Anything else (n8n execution history, worker logs, Git) is
   secondary and reconstructible from the database.
2. **Stages are small, durable steps.** Each stage reads its inputs from the
   database, writes a new versioned output, and moves the project to the next
   status. Any stage can be retried in isolation.
3. **Producers vs. deciders.** AI models, Claude Code, and the render worker
   *produce* artifacts. Only authenticated humans (through the CRM / API)
   *decide* (approve, reject, publish).
4. **Untrusted by default.** Imported text, AI output, and generated code are
   validated against schemas and executed only inside sandboxes.

## 2. Component diagram

```
              ┌────────────────────────────── Users ─────────────────────────────┐
              │                                                                   │
        Telegram bot                     CRM (Vite / React)             Isolated preview origin
              │                          │  supabase-js (anon key + JWT)        (sandboxed iframe)
              ▼                          ▼                                       ▲
   ┌──────────────────────────────── Supabase ───────────────────────────────┐  │
   │  Edge Functions (/api/*)  ── validate, authorize, write rows, enqueue   │  │
   │  Postgres (system of record, RLS)  ◄── workflow_jobs / render_jobs queue│  │
   │  Storage buckets: brand-assets, imports, previews, media                │──┘
   │  Auth (users, roles)                                                    │
   └───────────┬──────────────────────────────▲──────────────────────────────┘
               │ signed webhook (job id)       │ service-role writes / RPC
               ▼                               │
        ┌───────────── n8n (self-hosted) ──────┴─────┐
        │ Workflows A–G: intake, analyze, answers,   │──► AI model APIs (analysis,
        │ script, creative, render, publish          │     questionnaire, brief, script)
        │ notifications (Telegram), retries          │──► Buffer API (publishing)
        └───────┬────────────────────────┬───────────┘
                │ enqueue job row         │ enqueue job row
                ▼                         ▼
     ┌──────── creative-worker ───────┐  ┌──────── render-worker ────────┐
     │ claims job (SKIP LOCKED)       │  │ claims job (SKIP LOCKED)      │
     │ isolated workdir + git clone   │  │ Playwright + FFmpeg           │
     │ Claude Code ← content-spec     │  │ restricted network, temp disk │
     │ lint/validate, commit, preview │  │ validate, checksum, upload    │
     └──────────┬─────────────────────┘  └───────────────────────────────┘
                ▼
       GitHub: creative source repo (one folder per project/version)
```

## 3. Repository layout

This repository is a monorepo. Paths are fixed so agents can find things.

```
.
├── CLAUDE.md / AGENTS.md / README.md / PLAN.md
├── docs/                         planning + reference docs, ADRs, progress log
├── apps/
│   └── crm/                      Vite app (React + TS + shadcn/ui + Tailwind)    
│       ├── src/
│       │   ├── pages/            Overview, Inbox, Projects, ProjectDetail, Brands,
│       │   │                     Questionnaire, ScriptEditor, CreativeStudio,
│       │   │                     MediaLibrary, Calendar, WorkflowMonitor, Settings
│       │   ├── components/       shared UI (status badges, version picker, approval bar)
│       │   ├── features/         feature modules (one folder per dashboard module)
│       │   ├── lib/              supabase client, api client, i18n, rtl helpers
│       │   └── types/            re-exports from packages/shared
│       └── package.json
├── supabase/
│   ├── config.toml
│   ├── migrations/               timestamped SQL: tables, enums, indexes, RLS, RPCs
│   ├── functions/                Edge Functions (ADR-0005)
│   │   ├── _shared/              auth, db, validation, idempotency, rate limit, n8n client,
│   │   │                         intake, csv-import, url-extract, vendor/ (synced from packages/shared)
│   │   ├── api/                  Hono router for every /api/* endpoint (app.ts + index.ts)
│   │   ├── telegram-webhook/     Telegram intake with inline replies
│   │   └── tests/                Deno tests against the local database
│   ├── seed.sql                  demo brand + admin role
│   └── tests/                    pgTAP tests for RLS, constraints, state transitions
├── n8n/
│   ├── workflows/                A-intake.json … G-publishing.json (exported)
│   ├── prompts/ → packages/shared/prompts
│   └── README.md                 import instructions, required credentials (names only)
├── workers/
│   ├── common/                   job claim/heartbeat/complete, storage upload, logger
│   ├── creative-worker/          Claude Code generation worker
│   └── render-worker/            Playwright + FFmpeg render worker (Dockerfile)
├── packages/
│   └── shared/
│       ├── schemas/              JSON Schemas (analysis, questionnaire, answers,
│       │                         brief, script.{video,carousel,static}, content-spec,
│       │                         worker-job, worker-result, media-manifest, publish-package)
│       ├── src/                  TS types generated from schemas, status enums,
│       │                         transition table, validators (ajv / zod)
│       └── prompts/              versioned prompt templates for every AI stage
├── templates/                    approved reusable creative templates (HTML/CSS/Three.js)
└── .github/workflows/            CI: lint, typecheck, unit tests, SQL tests
```

> The CRM is written directly by agents — no Lovable (see
> `docs/adr/0001-monorepo-layout.md`).

### Creative source repository

Generated creative source lives in a **separate** GitHub repo (default name
`content-creatives`) so generated code never mixes with platform code:

```
projects/<project_id>/v<creative_version>/
  content-spec.json
  script.json
  scenes/
  src/index.html  styles.css  main.js
  assets/          (small assets only; large media → Storage)
  render/render.js validate.js
  package.json
```

Each creative version = one commit; `creative_versions.commit_sha` records it.
See `docs/adr/0002-creative-source-repository.md`.

## 4. Request and job flow

1. **Client action** (CRM button, Telegram message, CSV upload) calls an Edge
   Function (`api` or `telegram-webhook`).
2. The Edge Function authenticates the user, validates the payload against
   `packages/shared/schemas`, checks the transition is allowed, writes rows in
   one transaction (including a `workflow_jobs` row with an
   `idempotency_key`), writes a `workflow_events` row, and calls the matching
   n8n webhook with `{ job_id }` signed by an HMAC shared secret.
3. **n8n** loads the job and the inputs it references, does the stage work
   (AI calls, URL fetch, Buffer), and writes outputs back through Supabase RPCs
   using the service role. Long-running work (creative generation, rendering)
   is handed to a worker by inserting a job row.
4. **Workers** poll Postgres with `claim_job(kind, worker_id)` (uses
   `FOR UPDATE SKIP LOCKED` + lease timeout), heartbeat while running, then
   call `complete_job` / `fail_job`. Completion fires a DB webhook back to
   n8n, which runs the post-processing / notification steps.
5. A **recovery cron** (n8n schedule) requeues jobs whose lease expired and
   escalates jobs that exceeded `max_attempts` to `needs_attention`.

See `docs/adr/0003-job-queue.md`.

## 5. Preview isolation

- Previews are static files (HTML + assets, or rendered PNG/MP4) uploaded to the
  `previews` bucket and served from a **different origin** than the CRM (a
  dedicated preview domain or the Storage public URL domain — never the CRM
  domain).
- The CRM embeds them with
  `<iframe sandbox="allow-scripts" referrerpolicy="no-referrer">` — **no**
  `allow-same-origin`, no `allow-top-navigation`, no `allow-forms`.
- Preview responses carry a strict CSP: `default-src 'self' data: blob:;
  connect-src 'none'` (fonts/assets bundled), so generated code cannot call out.
- The CRM never `eval`s or injects generated HTML into its own DOM.

See `docs/adr/0004-preview-isolation.md`.

## 6. Environments and secrets

| Secret | Lives in | Never in |
|--------|----------|----------|
| Supabase anon key | CRM env (public by design) | — |
| Supabase service-role key | Edge Function secrets, n8n credentials, worker env | browser, creatives, git |
| n8n webhook HMAC secret | Edge Function secrets, n8n | browser |
| AI model API keys | n8n credentials | everywhere else |
| Anthropic key for Claude Code | creative-worker env only | generated workspace env |
| GitHub token (creatives repo, contents:write) | creative-worker env | generated workspace env |
| Telegram bot token + webhook secret | n8n / Edge Function secrets | browser |
| Buffer token | n8n credentials | browser |

Each component ships an `.env.example` listing variable **names** only.
