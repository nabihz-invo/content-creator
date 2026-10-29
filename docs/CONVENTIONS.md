# Conventions

## Languages and tooling
- TypeScript everywhere (strict). Node 20 LTS for workers; Deno for Edge Functions.
- Package manager: `pnpm` workspaces (`apps/*`, `workers/*`, `packages/*`).
- Lint/format: ESLint + Prettier. SQL: `sqlfluff` (postgres dialect).
- Validation: JSON Schema (ajv) as source of truth; TS types generated from
  schemas into `packages/shared/src/generated/`.

## Naming
- DB: `snake_case` tables (plural) and columns; enums as Postgres enums named
  `<thing>_status`.
- Migrations: `supabase/migrations/<YYYYMMDDHHMMSS>_<task-id>_<summary>.sql`.
- Edge Functions: kebab-case folder per endpoint group.
- n8n workflow files: `<letter>-<name>.json` (e.g. `B-analyze-question.json`).
- Prompt templates: `packages/shared/prompts/<stage>.v<N>.md`; never edit a
  released version — add `v<N+1>` and point `ai_settings` at it.
- Question IDs: `q_<snake_case>`, stable across questionnaire versions.

## Frontend
- shadcn/ui components; Tailwind logical properties (`ms-*`, `me-*`, `ps-*`)
  for RTL. `dir` set from project/brand language.
- i18n via `apps/crm/src/lib/i18n` with `en` and `ar` message files.
- Data access through typed hooks (`useProject`, `useScripts`…) over
  supabase-js + TanStack Query. Mutations that start workflows go through
  `lib/api.ts` (Edge Functions), never direct table writes.

## Testing
- SQL: pgTAP for constraints, RLS, transitions (`supabase test db`).
- Edge Functions: Deno tests with a local Supabase (`supabase start`).
- Shared: Vitest for validators, transition table, hashing.
- Workers: Vitest unit tests + one golden-file render test per output type.
- CRM: Vitest + Testing Library for key components; Playwright e2e for the
  happy path once Phase 2 lands.

## Commits
`<task-id>: <imperative summary>` — one task per commit series. Update
`PLAN.md` status and `docs/PROGRESS_LOG.md` in the final commit of a task.
