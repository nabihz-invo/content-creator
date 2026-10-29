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

```sql
select tests.as_user('<uuid>');   -- sets role authenticated + request.jwt.claims
select tests.as_service();        -- service_role
select tests.as_anon();
```

Helpers are created by `tests/00_helpers.sql`... see that file.
