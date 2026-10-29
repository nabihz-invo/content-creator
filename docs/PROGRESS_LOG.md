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
