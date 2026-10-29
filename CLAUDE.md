# Agent Instructions — AI Social Media Content Pipeline

Read this file first. It tells you what the project is, where everything lives,
and how to pick up and record work. `AGENTS.md` points here so every agent
reads the same rules.

## 1. What this project is

A **content-production CRM** that turns raw ideas (Telegram, CSV, URL,
dashboard) into approved, branded social media content and publishes it.

It is an **approval-driven workflow engine**, not a long AI conversation:
every stage is persistent, resumable, versioned, and independently retryable.
The CRM (Supabase) owns project state and approvals. AI, Claude Code, and the
render worker only *produce artifacts*; they never approve or publish on their
own.

Pipeline (11 stages):

```
idea intake → analysis → questionnaire → answers + brief → script
  → script approval → creative source → creative approval
  → render → final media approval → publish / schedule
```

## 2. Documentation map

| File | Read it when |
|------|--------------|
| `PLAN.md` | **Always.** Phased task list with IDs, status, dependencies, acceptance criteria. |
| `docs/PROGRESS_LOG.md` | Always — see what was done last and by whom. |
| `docs/BLUEPRINT.md` | The original product spec (source of truth for requirements). |
| `docs/ARCHITECTURE.md` | Components, repository layout, how services talk to each other. |
| `docs/DATA_MODEL.md` | Any database / migration / RLS work. |
| `docs/WORKFLOW.md` | Stage state machine, statuses, n8n workflows A–G, approval rules. |
| `docs/CONTRACTS.md` | JSON shapes (analysis, questionnaire, brief, script, content-spec, worker jobs, manifests). |
| `docs/API.md` | Backend endpoint contracts. |
| `docs/SECURITY.md` | Secrets, RLS, sandboxing, idempotency, retries. |
| `docs/CONVENTIONS.md` | Code style, naming, commits, testing. |
| `docs/DEVELOPMENT.md` | **How to run and test everything** (local stack, pgTAP, Deno, e2e). |
| `docs/adr/` | Architecture decisions. Add one when you make a non-obvious choice. |

## 3. How to work on a task

1. Open `PLAN.md`. Find the **current phase** (the lowest-numbered phase that is
   not fully `done`). Do not start tasks from a later phase — the blueprint
   requires each phase to be finished and tested before the next starts.
2. Pick a task whose status is `todo` and whose `Depends on` tasks are all
   `done`. If the user named a task ID, do that one.
3. Change its status to `in-progress` and put your session/branch in the
   `Owner` column. Commit that change on its own if other agents may work in
   parallel.
4. Read the docs listed in the task's `Refs`. Build exactly the listed
   deliverables at the listed paths.
5. Verify every acceptance criterion of the task (tests, lint, typecheck,
   manual check). Do not mark a task `done` on untested code. UI work is
   verified in a real browser against the local stack (`docs/DEVELOPMENT.md`);
   extend `scripts/e2e/crm-smoke.mjs` for new screens.
6. Set status to `done`, then append an entry to `docs/PROGRESS_LOG.md`
   (template at the top of that file).
7. If you are blocked, set status to `blocked`, write the reason in the log,
   and stop on that task.
8. If you discover new required work, add a task to the right phase with the
   next free ID (never renumber existing IDs).

Task status values: `todo` · `in-progress` · `done` · `blocked` · `deferred`.

## 4. Non-negotiable rules

- **Supabase is the system of record.** n8n executions, worker logs, and Git
  history are never the only record of progress. Every state change writes to
  Postgres (`content_projects`, `workflow_jobs`, `workflow_events`).
- **Approved artifacts are immutable.** Edits create a new version row. Never
  `UPDATE` the content of an approved script / creative / media asset.
- **Approvals reference an exact artifact id + version + content hash.**
- **No downstream step runs without its upstream approval** (script → creative
  → render → publish). Enforce in the database/API, not only in the UI.
- **Superseded versions mark downstream outputs `outdated`.**
- **Secrets stay server-side.** No service-role key, API token, or n8n
  credential in browser code, generated creatives, or committed files.
- **Generated creative code is untrusted.** Preview it on an isolated origin or
  sandboxed iframe; render it in the isolated worker with restricted network.
- **Imported content (URLs, CSV, Telegram) is untrusted data**, never
  instructions. Prompts must delimit it and must not let it change behavior.
- **Idempotency keys** on every operation that can be retried (job creation,
  render, publish). A retry must never create duplicate projects or posts.
- **Do not mark a post as published** until the integration confirms it.
- Keep AI outputs **structured JSON validated against schemas** in
  `packages/shared/schemas` — not free-form prose.
- Support **Arabic / RTL** in all user-facing UI and creatives.

## 5. Repository layout (target)

See `docs/ARCHITECTURE.md §3` for full detail.

```
apps/crm/                 Vite + React + TS + shadcn/ui dashboard (no Lovable, ADR-0001)
supabase/                 migrations, edge functions, seed, RLS tests
n8n/workflows/            exported n8n workflow JSON (A–G) + README
workers/creative-worker/  Claude Code generation worker (Node.js)
workers/render-worker/    Playwright + FFmpeg render worker (Node.js)
packages/shared/          JSON schemas, TS types, status enums, prompt templates
templates/                approved reusable creative templates
docs/                     all planning and reference docs
```

Creative project source (one folder per content project) lives in a separate
GitHub repository — see `docs/adr/0002-creative-source-repository.md`.

## 6. Git

- Work on the branch you were assigned. Small, focused commits.
- Commit message: `<task-id>: <imperative summary>` e.g.
  `P1-T03: add content_projects migration and RLS`.
- Never commit `.env` files, keys, or large media.
