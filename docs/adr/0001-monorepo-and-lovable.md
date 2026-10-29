# 0001 — Monorepo and Lovable frontend location

**Status:** proposed (decide in P0-T03)

## Context
Lovable's two-way GitHub sync works on the repository it is connected to and
expects the app at the repository root. The rest of the system (Supabase
migrations, Edge Functions, n8n exports, workers, shared schemas) belongs in
one place so agents can change contracts and their consumers together.

## Options
- **A. Separate frontend repo** (`content-creator-crm`) connected to Lovable;
  this repo holds everything else. Shared types are published from
  `packages/shared` (git dependency or copied by a sync script).
- **B. Monorepo, Lovable at root** — the Vite app lives at the repo root and
  backend folders sit beside it. Simple for Lovable, messier workspace layout.
- **C. Monorepo `apps/crm`** — Lovable used only to bootstrap; afterwards the
  CRM is developed in `apps/crm` by agents without Lovable sync.

## Recommendation
**C** if Lovable is only needed to bootstrap the UI; **A** if the user wants
to keep editing visually in Lovable. Plan docs assume `apps/crm/`; if A is
chosen, update `ARCHITECTURE.md §3` and the P1 CRM tasks' paths.

## Consequences
Fixes where CRM tasks write code and how shared types reach the frontend.
