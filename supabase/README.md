# Supabase

- `migrations/` — ordered SQL migrations (`<timestamp>_<task-id>_<summary>.sql`).
  Never edit a migration that has been applied to a shared environment; add a new one.
- `tests/` — pgTAP tests, one file per area (`NN_<area>.test.sql`). Each file
  runs inside `begin … rollback`.
- `functions/` — Edge Functions (Deno). `_shared/` holds auth, validation,
  idempotency, errors, and the n8n client.
- `seed.sql` — local development seed.

## Local database

```bash
pnpm db:test     # fresh DB, apply migrations + seed, run all pgTAP tests
pnpm db:reset    # fresh DB with migrations + seed (port 54322)
pnpm db:stop
bash scripts/db.sh psql -c "select ..."
```

`scripts/db.sh` runs the official `supabase/postgres` image, which contains
the same `auth` / `storage` schemas, roles (`anon`, `authenticated`,
`service_role`) and extensions as hosted Supabase. The full CLI stack
(`npx supabase start`, `npx supabase test db`) also works where its images are
reachable.

## Testing as a user inside pgTAP

Each test file starts with `begin; \ir _helpers.sql` and ends with `rollback;`.
`_helpers.sql` provides:

```sql
select tests.create_user('a@example.com');      -- auth user (+ profile + admin workspace via trigger)
select tests.workspace_of(uid);  select tests.add_member(ws, uid, 'editor');
select tests.as_user(uid);  select tests.as_service();  select tests.as_anon();  select tests.reset_role();
select tests.new_project(ws, uid, 'idea text', auto_analyze);
```

`scripts/db-platform-shim.sql` adds storage columns the bare image lacks
(the Storage API adds them in real deployments). It is never a migration.
