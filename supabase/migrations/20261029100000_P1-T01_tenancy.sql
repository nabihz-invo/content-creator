-- P1-T01: tenancy, profiles, roles, shared helpers.
-- See docs/DATA_MODEL.md §1–2, §6.

-- ---------------------------------------------------------------------------
-- Privilege hygiene
-- ---------------------------------------------------------------------------
-- Supabase grants everything in `public` to anon/authenticated by default.
-- This app has no anonymous access, and RPCs must opt in to being callable.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated, public;

-- Helpers used by RLS policies and triggers live in `private`, which is not
-- exposed through the Data API.
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Generic triggers
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Rejects UPDATE/DELETE: used for insert-only audit tables.
create or replace function private.forbid_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% on % is not allowed (insert-only table)', tg_op, tg_table_name
    using errcode = 'insufficient_privilege';
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles and tables
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('admin', 'editor', 'reviewer');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'en' check (locale in ('en', 'ar')),
  telegram_user_id bigint unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members (user_id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Membership helpers (security definer so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------
create or replace function private.is_member(
  p_workspace_id uuid,
  p_roles public.member_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = (select auth.uid())
      and (p_roles is null or m.role = any (p_roles))
  );
$$;

create or replace function private.member_role(p_workspace_id uuid, p_user_id uuid)
returns public.member_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role from public.workspace_members m
  where m.workspace_id = p_workspace_id and m.user_id = p_user_id;
$$;

revoke all on function private.is_member(uuid, public.member_role[]) from public;
revoke all on function private.member_role(uuid, uuid) from public;
grant execute on function private.is_member(uuid, public.member_role[]) to authenticated, service_role;
grant execute on function private.member_role(uuid, uuid) to service_role;

-- A workspace must always keep at least one admin.
create or replace function private.keep_one_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ws uuid := coalesce(old.workspace_id, new.workspace_id);
begin
  if old.role = 'admin'
     and (tg_op = 'DELETE' or new.role <> 'admin')
     and exists (select 1 from public.workspaces w where w.id = ws)
     and not exists (
       select 1 from public.workspace_members m
       where m.workspace_id = ws and m.role = 'admin' and m.user_id <> old.user_id
     ) then
    raise exception 'workspace % must keep at least one admin', ws using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger workspace_members_keep_admin
  before update or delete on public.workspace_members
  for each row execute function private.keep_one_admin();

-- ---------------------------------------------------------------------------
-- New user bootstrap: profile + personal workspace (admin).
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws_id uuid;
  name text := coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1));
begin
  insert into public.profiles (id, display_name) values (new.id, name);
  insert into public.workspaces (name, created_by)
    values (coalesce(name, 'My') || '''s workspace', new.id)
    returning id into ws_id;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws_id, new.id, 'admin');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

-- Profiles: yourself, plus people you share a workspace with.
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.workspace_members mine
      join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
      where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
    )
  );
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- telegram_user_id is linked through a verified server flow, not by the user.
revoke insert, update, delete on public.profiles from authenticated;
grant update (display_name, locale) on public.profiles to authenticated;

create policy workspaces_select on public.workspaces for select to authenticated
  using (private.is_member(id));
create policy workspaces_update_admin on public.workspaces for update to authenticated
  using (private.is_member(id, array['admin']::public.member_role[]))
  with check (private.is_member(id, array['admin']::public.member_role[]));
revoke insert, delete on public.workspaces from authenticated;
revoke update on public.workspaces from authenticated;
grant update (name) on public.workspaces to authenticated;

create policy members_select on public.workspace_members for select to authenticated
  using (private.is_member(workspace_id));
create policy members_insert_admin on public.workspace_members for insert to authenticated
  with check (private.is_member(workspace_id, array['admin']::public.member_role[]));
create policy members_update_admin on public.workspace_members for update to authenticated
  using (private.is_member(workspace_id, array['admin']::public.member_role[]))
  with check (private.is_member(workspace_id, array['admin']::public.member_role[]));
create policy members_delete_admin on public.workspace_members for delete to authenticated
  using (private.is_member(workspace_id, array['admin']::public.member_role[]));
