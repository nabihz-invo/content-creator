---
name: handoff-checklist-plan
description: Where the developer-handoff gap plan stands (phases 1-3 done, 4-7 left) and where its notes live
metadata:
  type: project
---

The product owner's "developer handoff checklist" (map, stock, movements, Telegram, invoice AI, roles, audit, alerts, AR/EN, import, ERP track) was audited against the build on 2026-10-27. Phases 1 (history, shipment screens), 2 (10,000 SKUs) and 3 (the nine roles) are done and committed in `app/` (fb3fe1a, not pushed). Phases 4 (notifications), 5 (transfers/shipments polish), 6 (operations/docs/live AI run) and 7 (ERP) are left.

**Why:** the website promises these features; the plan closes the gap between promise and build.

**How to apply:** resume from `app/docs/PLAN.md`, section "Handoff checklist: what is left". The plan and the Supabase project (`app/supabase/`: migrations, tests, seeds, functions) now live inside the `app` git repo; the workspace-root `supabase/` only needs to hold the untracked `.env.local`. Secrets are read by `app/supabase/lib/env.js`. Run `npm ci` in `app/supabase/` before the e2e tests.
