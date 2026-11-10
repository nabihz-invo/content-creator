-- P5-T24: each user is linked to one or several brands.
-- Admins see every brand in their workspace. Editors and reviewers see only the brands they are
-- linked to, enforced here (RLS, RPC role checks, storage). A project with no brand is admin-only.

create table public.brand_members (
  brand_id uuid not null references public.brands (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (brand_id, user_id)
);
create index brand_members_user_idx on public.brand_members (user_id);

-- ---------------------------------------------------------------------------
-- The access check everything else uses
-- ---------------------------------------------------------------------------
create function private.has_brand_access(
  p_workspace_id uuid,
  p_brand_id uuid,
  p_roles public.member_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = (select auth.uid())
      and (p_roles is null or m.role = any (p_roles))
      and (m.role = 'admin' or exists (
        select 1 from public.brand_members bm
        where bm.brand_id = p_brand_id and bm.user_id = m.user_id
      ))
  );
$$;
revoke all on function private.has_brand_access(uuid, uuid, public.member_role[]) from public;
grant execute on function private.has_brand_access(uuid, uuid, public.member_role[]) to authenticated, service_role;

create or replace function private.can_access_brand(p_brand_id text, p_roles public.member_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.brands b
    where b.id::text = p_brand_id and private.has_brand_access(b.workspace_id, b.id, p_roles)
  );
$$;

create or replace function private.can_access_project(p_project_id uuid, p_roles public.member_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.content_projects p
    where p.id = p_project_id and private.has_brand_access(p.workspace_id, p.brand_id, p_roles)
  );
$$;

create or replace function private.can_access_project_text(p_project_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.content_projects p
    where p.id::text = p_project_id and private.has_brand_access(p.workspace_id, p.brand_id)
  );
$$;

-- imports/<workspace_id>/<import_batch_id>/<file>
create function private.can_access_import_text(p_workspace_id text, p_batch_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_access_workspace_text(p_workspace_id, array['admin']::public.member_role[])
    or exists (
      select 1 from public.import_batches ib
      where ib.id::text = p_batch_id
        and ib.workspace_id::text = p_workspace_id
        and private.has_brand_access(ib.workspace_id, ib.brand_id)
    );
$$;
revoke all on function private.can_access_import_text(text, text) from public;
grant execute on function private.can_access_import_text(text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Role checks inside RPCs (they run as definer, so RLS doesn't protect them)
-- ---------------------------------------------------------------------------
create or replace function private.require_role(p_project_id uuid, p_user_id uuid, p_roles public.member_role[])
returns public.content_projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  r public.member_role;
begin
  select * into proj from public.content_projects where id = p_project_id for update;
  if not found then
    raise exception 'not_found: project %', p_project_id using errcode = 'P0001', hint = 'not_found';
  end if;
  r := private.member_role(proj.workspace_id, p_user_id);
  if r is null or not (r = any (p_roles)) then
    raise exception 'forbidden: requires %', p_roles using errcode = 'P0001', hint = 'forbidden';
  end if;
  -- Another brand's project looks like it doesn't exist.
  if r <> 'admin' and not exists (
    select 1 from public.brand_members bm where bm.brand_id = proj.brand_id and bm.user_id = p_user_id
  ) then
    raise exception 'not_found: project %', p_project_id using errcode = 'P0001', hint = 'not_found';
  end if;
  return proj;
end;
$$;

create or replace function private.library_role(p_item public.library_items, p_actor uuid, p_roles public.member_role[])
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.member_role;
begin
  select private.member_role(b.workspace_id, p_actor) into r from public.brands b where b.id = p_item.brand_id;
  if r is null or not (r = any (p_roles)) or (r <> 'admin' and not exists (
    select 1 from public.brand_members bm where bm.brand_id = p_item.brand_id and bm.user_id = p_actor
  )) then
    raise exception 'forbidden: requires %', p_roles using errcode = 'P0001', hint = 'forbidden';
  end if;
end;
$$;

-- Same as P1-T08, plus: non-admins may only create under their own brands (one linked brand is used
-- automatically), and duplicates are detected within a brand, so two brands can share an idea.
create or replace function public.create_project(
  p_workspace_id uuid,
  p_actor_id uuid,
  p_record jsonb,
  p_dedupe_hash text,
  p_allow_duplicate boolean default false,
  p_source_key text default null,
  p_auto_analyze boolean default true,
  p_import_batch_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  role public.member_role;
  existing public.content_projects;
  proj public.content_projects;
  job public.workflow_jobs;
  idea text := nullif(trim(p_record ->> 'original_idea'), '');
  url text := nullif(trim(p_record ->> 'source_url'), '');
  brand uuid := nullif(p_record ->> 'brand_id', '')::uuid;
  title text := nullif(trim(p_record ->> 'title'), '');
  dup_of uuid;
  linked_count integer;
  linked_brand uuid;
begin
  role := private.member_role(p_workspace_id, p_actor_id);
  if role is null or role not in ('admin', 'editor') then
    raise exception 'forbidden: user % cannot create projects in workspace %', p_actor_id, p_workspace_id
      using errcode = 'P0001', hint = 'forbidden';
  end if;

  if idea is null and url is null then
    raise exception 'validation_failed: original_idea or source_url is required'
      using errcode = 'P0001', hint = 'validation_failed';
  end if;

  if brand is not null and not exists (
    select 1 from public.brands b where b.id = brand and b.workspace_id = p_workspace_id and b.archived_at is null
  ) then
    raise exception 'validation_failed: brand % is not in this workspace', brand
      using errcode = 'P0001', hint = 'validation_failed';
  end if;

  if role <> 'admin' then
    select count(*), min(b.id::text)::uuid into linked_count, linked_brand
    from public.brand_members bm
    join public.brands b on b.id = bm.brand_id
    where bm.user_id = p_actor_id and b.workspace_id = p_workspace_id and b.archived_at is null;

    if linked_count = 0 then
      raise exception 'forbidden: user % has no brand in workspace %', p_actor_id, p_workspace_id
        using errcode = 'P0001', hint = 'forbidden';
    end if;
    if brand is null and linked_count > 1 then
      raise exception 'brand_required: choose a brand for this idea'
        using errcode = 'P0001', hint = 'validation_failed';
    end if;
    if brand is null then
      brand := linked_brand;
    elsif not exists (
      select 1 from public.brand_members bm where bm.brand_id = brand and bm.user_id = p_actor_id
    ) then
      raise exception 'forbidden: user % is not linked to brand %', p_actor_id, brand
        using errcode = 'P0001', hint = 'forbidden';
    end if;
  end if;

  -- Replay of the same external submission → same project.
  if p_source_key is not null then
    select * into existing from public.content_projects where source_idempotency_key = p_source_key;
    if found then
      return jsonb_build_object('project_id', existing.id, 'created', false, 'replayed', true,
                                'duplicate_of', existing.duplicate_of, 'status', existing.status, 'job_id', null);
    end if;
  end if;

  -- Serialize creators of the same idea within the brand.
  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text || ':' || coalesce(brand::text, '') || ':' || p_dedupe_hash, 0));

  select * into existing from public.content_projects
  where workspace_id = p_workspace_id and brand_id is not distinct from brand
    and dedupe_hash = p_dedupe_hash and status <> 'cancelled'
  order by created_at
  limit 1;

  if found then
    dup_of := existing.id;
  end if;

  if dup_of is not null and not p_allow_duplicate then
    return jsonb_build_object('project_id', existing.id, 'created', false, 'replayed', false,
                              'duplicate_of', existing.id, 'status', existing.status, 'job_id', null);
  end if;

  if title is null then
    title := left(coalesce(split_part(idea, E'\n', 1), url), 120);
  end if;

  insert into public.content_projects (
    workspace_id, brand_id, owner_id, title, original_idea, input_source, source_url,
    source_reference, source_metadata, source_idempotency_key, content_type, language,
    dedupe_hash, duplicate_of, import_batch_id, submitted_at
  ) values (
    p_workspace_id, brand, p_actor_id, title, coalesce(idea, url),
    (p_record ->> 'input_source')::public.input_source, url,
    p_record ->> 'source_reference', coalesce(p_record -> 'source_metadata', '{}'::jsonb), p_source_key,
    nullif(p_record ->> 'content_type', '')::public.content_type, nullif(p_record ->> 'language', ''),
    p_dedupe_hash, dup_of, p_import_batch_id,
    coalesce((p_record ->> 'submitted_at')::timestamptz, now())
  )
  returning * into proj;

  perform public.log_event(proj.id, 'project.created',
    jsonb_build_object('input_source', proj.input_source, 'source_reference', proj.source_reference,
                       'duplicate_of', proj.duplicate_of, 'import_batch_id', p_import_batch_id),
    p_actor_id);

  if p_auto_analyze then
    job := public.create_job(proj.id, 'analysis', 'n8n', 'analysis:' || proj.id || ':1',
                             jsonb_build_object('project_id', proj.id), p_actor_id);
    proj := public.transition_project(proj.id, 'analyzing', p_actor_id, '{}'::jsonb, 'new', job.id);
  end if;

  return jsonb_build_object('project_id', proj.id, 'created', true, 'replayed', false,
                            'duplicate_of', proj.duplicate_of, 'status', proj.status, 'job_id', job.id);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.brand_members enable row level security;
revoke all on public.brand_members from anon;
revoke update on public.brand_members from authenticated;
grant select, insert, delete on public.brand_members to authenticated;

create policy brand_members_select on public.brand_members for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.brands b
               where b.id = brand_id and private.is_member(b.workspace_id, array['admin']::public.member_role[]))
  );
-- Only an admin links people, and only people who are already in the brand's workspace.
create policy brand_members_insert_admin on public.brand_members for insert to authenticated
  with check (exists (
    select 1 from public.brands b
    join public.workspace_members m on m.workspace_id = b.workspace_id and m.user_id = brand_members.user_id
    where b.id = brand_id and private.is_member(b.workspace_id, array['admin']::public.member_role[])
  ));
create policy brand_members_delete_admin on public.brand_members for delete to authenticated
  using (exists (select 1 from public.brands b
                 where b.id = brand_id and private.is_member(b.workspace_id, array['admin']::public.member_role[])));

drop policy brands_select on public.brands;
create policy brands_select on public.brands for select to authenticated
  using (private.has_brand_access(workspace_id, id));

drop policy brand_history_select on public.brand_settings_history;
create policy brand_history_select on public.brand_settings_history for select to authenticated
  using (private.can_access_brand(brand_id::text));

drop policy brand_assets_select on public.brand_assets;
create policy brand_assets_select on public.brand_assets for select to authenticated
  using (private.can_access_brand(brand_id::text));

drop policy library_items_select on public.library_items;
create policy library_items_select on public.library_items for select to authenticated
  using (private.can_access_brand(brand_id::text));
drop policy library_items_insert on public.library_items;
create policy library_items_insert on public.library_items for insert to authenticated
  with check (private.can_access_brand(brand_id::text, array['admin', 'editor']::public.member_role[]));
drop policy library_items_update on public.library_items;
create policy library_items_update on public.library_items for update to authenticated
  using (private.can_access_brand(brand_id::text, array['admin', 'editor']::public.member_role[]))
  with check (private.can_access_brand(brand_id::text, array['admin', 'editor']::public.member_role[]));

drop policy projects_select on public.content_projects;
create policy projects_select on public.content_projects for select to authenticated
  using (private.has_brand_access(workspace_id, brand_id));
-- The check also stops an editor moving a project to a brand they aren't linked to.
drop policy projects_update_editor on public.content_projects;
create policy projects_update_editor on public.content_projects for update to authenticated
  using (private.has_brand_access(workspace_id, brand_id, array['admin', 'editor']::public.member_role[]))
  with check (private.has_brand_access(workspace_id, brand_id, array['admin', 'editor']::public.member_role[]));

drop policy idea_comments_select on public.idea_comments;
create policy idea_comments_select on public.idea_comments for select to authenticated
  using (private.can_access_project(project_id));
drop policy idea_comments_insert on public.idea_comments;
create policy idea_comments_insert on public.idea_comments for insert to authenticated
  with check (
    author_id = auth.uid() and status = 'open' and response is null and addressed_at is null
    and private.can_access_project(project_id)
  );

drop policy imported_media_select on public.imported_media;
create policy imported_media_select on public.imported_media for select to authenticated
  using (private.can_access_project(project_id));

drop policy import_batches_select on public.import_batches;
create policy import_batches_select on public.import_batches for select to authenticated
  using (private.has_brand_access(workspace_id, brand_id));

drop policy imports_objects_read on storage.objects;
create policy imports_objects_read on storage.objects for select to authenticated
  using (
    bucket_id = 'imports'
    and private.can_access_import_text((storage.foldername(name))[1], (storage.foldername(name))[2])
  );

-- ---------------------------------------------------------------------------
-- Managing the team from the CRM (admins only)
-- ---------------------------------------------------------------------------
create function public.list_workspace_members(p_workspace_id uuid)
returns table (user_id uuid, email text, display_name text, role public.member_role, brand_ids uuid[])
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_member(p_workspace_id, array['admin']::public.member_role[]) then
    raise exception 'forbidden: admins only' using errcode = 'P0001', hint = 'forbidden';
  end if;
  return query
    select m.user_id, u.email::text, p.display_name, m.role,
           array(select bm.brand_id from public.brand_members bm
                 join public.brands b on b.id = bm.brand_id
                 where bm.user_id = m.user_id and b.workspace_id = p_workspace_id)
    from public.workspace_members m
    join auth.users u on u.id = m.user_id
    left join public.profiles p on p.id = m.user_id
    where m.workspace_id = p_workspace_id
    order by m.created_at;
end;
$$;
revoke all on function public.list_workspace_members(uuid) from public;
grant execute on function public.list_workspace_members(uuid) to authenticated, service_role;

-- The person signs in to the CRM once (that creates the account), then an admin adds them by email.
create function public.add_workspace_member(p_workspace_id uuid, p_email text, p_role public.member_role)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  if not private.is_member(p_workspace_id, array['admin']::public.member_role[]) then
    raise exception 'forbidden: admins only' using errcode = 'P0001', hint = 'forbidden';
  end if;
  select u.id into uid from auth.users u where lower(u.email) = lower(trim(p_email));
  if uid is null then
    raise exception 'no_account: % has not signed in yet', trim(p_email) using errcode = 'P0001', hint = 'not_found';
  end if;
  if exists (select 1 from public.workspace_members m where m.workspace_id = p_workspace_id and m.user_id = uid) then
    raise exception 'already_member: % is already in this workspace', trim(p_email) using errcode = 'P0001', hint = 'duplicate';
  end if;
  insert into public.workspace_members (workspace_id, user_id, role) values (p_workspace_id, uid, p_role);
  return uid;
end;
$$;
revoke all on function public.add_workspace_member(uuid, text, public.member_role) from public;
grant execute on function public.add_workspace_member(uuid, text, public.member_role) to authenticated, service_role;

-- Leaving a workspace drops that person's brand links in it.
create function private.remove_member_brands()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.brand_members bm
  using public.brands b
  where bm.brand_id = b.id and bm.user_id = old.user_id and b.workspace_id = old.workspace_id;
  return null;
end;
$$;
create trigger workspace_members_remove_brands
  after delete on public.workspace_members
  for each row execute function private.remove_member_brands();
