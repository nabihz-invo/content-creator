---
name: content-creation-db-testing
description: "How to run content-creation pgTAP tests when local Docker can't start (Hyper-V off); db push must be run by the user"
metadata:
  node_type: memory
  type: project
  originSessionId: 69e4889b-0b75-4877-80e0-31da3d6d1746
  modified: 2026-11-01T08:04:59.993Z
---

On this Windows machine Docker Desktop cannot start its VM (WSL error `HCS_E_HYPERV_NOT_INSTALLED`, found 2026-11-01): Virtual Machine Platform or BIOS virtualization is off, so `scripts/db.sh test` can't run until the user fixes it.

Workaround used: local `C:\Program Files\PostgreSQL\17\bin\psql.exe` against the hosted Content project pooler (`postgres.tkyvfgdefhvxjwvmxzoe@aws-0-eu-west-1.pooler.supabase.com:5432`, password from `content-creation/supabase/.env.local`, PGSSLMODE=require). Each test file runs inside one transaction: `begin;` + create pgtap + `\i` the pending migrations + `\i` the test, which ends with its own rollback. Check afterwards that nothing persisted.

**Why:** the auto-mode classifier blocks `supabase db push` ("Production Deploy"), so the user runs it themselves after the verification.
**How to apply:** verify with the rolled-back run, `db push --dry-run`, then ask the user to run `npx supabase db push --linked` in content-creation. See [[content-production-pipeline]].
