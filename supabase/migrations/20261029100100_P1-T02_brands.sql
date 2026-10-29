-- P1-T02: brands, brand settings history, brand assets, storage buckets.
-- See docs/DATA_MODEL.md §3 (brands, brand_assets), §7 (storage layout).

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 120),
  description text,
  default_language text not null default 'en' check (default_language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  brand_settings jsonb not null default '{}'::jsonb check (jsonb_typeof(brand_settings) = 'object'),
  settings_version integer not null default 1 check (settings_version >= 1),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);
create index brands_workspace_idx on public.brands (workspace_id);

-- Every brand_settings value that was ever current, so creatives can
-- reference the exact brand configuration they were generated with.
create table public.brand_settings_history (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  version integer not null,
  settings jsonb not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (brand_id, version)
);

create type public.brand_asset_type as enum ('logo', 'font', 'reference_image', 'template', 'other');

create table public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  asset_type public.brand_asset_type not null,
  name text not null check (length(trim(name)) between 1 and 200),
  storage_path text not null unique,
  mime_type text,
  file_size bigint check (file_size >= 0),
  checksum text check (checksum ~ '^[0-9a-f]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version >= 1),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (brand_id, asset_type, name, version)
);
create index brand_assets_brand_idx on public.brand_assets (brand_id);

create trigger brands_updated_at before update on public.brands
  for each row execute function private.set_updated_at();

-- Bump settings_version whenever brand_settings changes; record history.
create or replace function private.brand_settings_versioning()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.brand_settings is distinct from old.brand_settings then
      new.settings_version := old.settings_version + 1;
    else
      new.settings_version := old.settings_version;
    end if;
  else
    new.settings_version := 1;
  end if;
  return new;
end;
$$;

create or replace function private.brand_settings_snapshot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.settings_version <> old.settings_version then
    insert into public.brand_settings_history (brand_id, version, settings, created_by)
    values (new.id, new.settings_version, new.brand_settings, auth.uid());
  end if;
  return null;
end;
$$;

create trigger brands_settings_version before insert or update on public.brands
  for each row execute function private.brand_settings_versioning();
create trigger brands_settings_snapshot after insert or update on public.brands
  for each row execute function private.brand_settings_snapshot();
create trigger brand_settings_history_immutable before update or delete on public.brand_settings_history
  for each row execute function private.forbid_mutation();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.brands enable row level security;
alter table public.brand_settings_history enable row level security;
alter table public.brand_assets enable row level security;

create policy brands_select on public.brands for select to authenticated
  using (private.is_member(workspace_id));
create policy brands_insert_admin on public.brands for insert to authenticated
  with check (private.is_member(workspace_id, array['admin']::public.member_role[]));
create policy brands_update_admin on public.brands for update to authenticated
  using (private.is_member(workspace_id, array['admin']::public.member_role[]))
  with check (private.is_member(workspace_id, array['admin']::public.member_role[]));
-- No delete: brands are archived (archived_at) so history stays intact.
revoke delete on public.brands from authenticated;
revoke update on public.brands from authenticated;
grant update (name, description, default_language, brand_settings, archived_at) on public.brands to authenticated;

create policy brand_history_select on public.brand_settings_history for select to authenticated
  using (exists (select 1 from public.brands b where b.id = brand_id and private.is_member(b.workspace_id)));
revoke insert, update, delete on public.brand_settings_history from authenticated;

create policy brand_assets_select on public.brand_assets for select to authenticated
  using (exists (select 1 from public.brands b where b.id = brand_id and private.is_member(b.workspace_id)));
create policy brand_assets_insert_admin on public.brand_assets for insert to authenticated
  with check (exists (
    select 1 from public.brands b
    where b.id = brand_id
      and private.is_member(b.workspace_id, array['admin']::public.member_role[])
      -- path must live under the brand's folder: <brand_id>/...
      and split_part(storage_path, '/', 1) = brand_id::text
  ));
revoke update, delete on public.brand_assets from authenticated;

-- ---------------------------------------------------------------------------
-- Storage buckets (all private; read through signed URLs)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values
  ('brand-assets', 'brand-assets', false),
  ('imports', 'imports', false),
  ('previews', 'previews', false),
  ('media', 'media', false)
on conflict (id) do nothing;

-- brand-assets/<brand_id>/<asset_type>/<version>/<file>
create or replace function private.can_access_brand(p_brand_id text, p_roles public.member_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.brands b
    where b.id::text = p_brand_id and private.is_member(b.workspace_id, p_roles)
  );
$$;
revoke all on function private.can_access_brand(text, public.member_role[]) from public;
grant execute on function private.can_access_brand(text, public.member_role[]) to authenticated;

create policy brand_assets_objects_read on storage.objects for select to authenticated
  using (bucket_id = 'brand-assets' and private.can_access_brand((storage.foldername(name))[1]));
create policy brand_assets_objects_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'brand-assets'
    and private.can_access_brand((storage.foldername(name))[1], array['admin']::public.member_role[])
  );
