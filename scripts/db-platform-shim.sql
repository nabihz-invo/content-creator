-- Local-harness only. The bare supabase/postgres image ships the storage schema
-- as it was before the Storage API service runs its own migrations. Hosted
-- Supabase (and `supabase start`) already have these columns. Never put this in
-- supabase/migrations.
alter table storage.buckets add column if not exists public boolean default false;
alter table storage.buckets add column if not exists file_size_limit bigint;
alter table storage.buckets add column if not exists allowed_mime_types text[];
alter table storage.objects add column if not exists version text;
alter table storage.objects add column if not exists owner_id text;
alter table storage.objects add column if not exists user_metadata jsonb;
