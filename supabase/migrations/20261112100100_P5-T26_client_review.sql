-- P5-T26: client accounts.
-- A client is a workspace member with role 'client', linked to one or several brands. They see only
-- the posts of their brands that the team approved (ready to publish, scheduled, published), through
-- client_posts() (title, date, status, captions, their decision), the pages/files of those posts, and the comments clients wrote on them. They can approve a
-- post, request changes (sends it back to the team, like the owner's "Request changes") or comment.
--
-- How: every "any member" check (is_member / has_brand_access / can_access_workspace_text without a
-- role list) now leaves clients out, so every existing policy and RPC stops at them by default; then
-- a few client-only policies open exactly what the calendar needs. RPCs and the API already list
-- their roles explicitly, so 'client' is refused everywhere it isn't named.
--
-- The 'client' value comes from the previous migration. Nothing here casts the literal to the enum
-- (roles are compared as text, and plpgsql bodies are only checked when they run), so this file also
-- loads in the same transaction as that one.

-- ---------------------------------------------------------------------------
-- Generic member checks: clients are not "any member"
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
      and (case when p_roles is null then m.role::text <> 'client' else m.role = any (p_roles) end)
  );
$$;

create or replace function private.has_brand_access(
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
      and (case when p_roles is null then m.role::text <> 'client' else m.role = any (p_roles) end)
      and (m.role = 'admin' or exists (
        select 1 from public.brand_members bm
        where bm.brand_id = p_brand_id and bm.user_id = m.user_id
      ))
  );
$$;

create or replace function private.can_access_workspace_text(p_workspace_id text, p_roles public.member_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id::text = p_workspace_id
      and m.user_id = (select auth.uid())
      and (case when p_roles is null then m.role::text <> 'client' else m.role = any (p_roles) end)
  );
$$;

-- ---------------------------------------------------------------------------
-- What a client may see
-- ---------------------------------------------------------------------------

-- A post is shown to clients once the team approved it, until it is cancelled. A post the client sent
-- back stays visible (marked "changes requested") until the team re-uploads it; it comes back when the
-- team approves the new version.
create function public.client_visible(p public.content_projects)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p.source_metadata ->> 'origin', '') = 'content_plan_import'
    and p.status::text not in ('cancelled', 'failed')
    and (
      (p.source_metadata -> 'review' ->> 'status' = 'approved'
        and p.status::text in ('ready_to_publish', 'scheduled', 'publishing', 'published'))
      or (p.source_metadata -> 'client_review' ->> 'status' = 'changes_requested'
        and p.source_metadata -> 'review' ->> 'status' = 'changes_requested')
    )
    and exists (select 1 from public.imported_media m where m.project_id = p.id);
$$;
revoke all on function public.client_visible(public.content_projects) from public, anon;
grant execute on function public.client_visible(public.content_projects) to authenticated, service_role;

-- The signed-in user is a client somewhere. Used as `(select private.is_any_client())` in front of the
-- client policies: evaluated once per query, so the team's queries skip the per-row client checks.
create function private.is_any_client()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.workspace_members m where m.user_id = (select auth.uid()) and m.role::text = 'client');
$$;

-- The signed-in user is a client of this workspace.
create function private.is_client_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id and m.user_id = (select auth.uid()) and m.role::text = 'client'
  );
$$;

-- The signed-in user is a client linked to this brand.
create function private.is_client_of_brand(p_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.brands b
    join public.workspace_members m on m.workspace_id = b.workspace_id
      and m.user_id = (select auth.uid()) and m.role::text = 'client'
    join public.brand_members bm on bm.brand_id = b.id and bm.user_id = m.user_id
    where b.id = p_brand_id
  );
$$;

create function private.is_client_of_brand_text(p_brand_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.brands b where b.id::text = p_brand_id and private.is_client_of_brand(b.id));
$$;

-- The signed-in user is a client who may see this post.
create function private.client_can_see(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.content_projects p
    where p.id = p_project_id and private.is_client_of_brand(p.brand_id) and public.client_visible(p)
  );
$$;

create function private.client_can_see_text(p_project_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.content_projects p where p.id::text = p_project_id and private.client_can_see(p.id));
$$;

-- The comment's author is a client of the post's workspace (clients see clients' comments only, not
-- the team's internal notes).
create function private.is_client_author(p_author uuid, p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.content_projects p
    join public.workspace_members m on m.workspace_id = p.workspace_id and m.user_id = p_author
    where p.id = p_project_id and m.role::text = 'client'
  );
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'private.is_any_client()', 'private.is_client_member(uuid)', 'private.is_client_of_brand(uuid)', 'private.is_client_of_brand_text(text)',
    'private.client_can_see(uuid)', 'private.client_can_see_text(text)', 'private.is_client_author(uuid, uuid)'
  ] loop
    execute format('revoke all on function %s from public', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Client-only policies (added to the existing ones; policies are OR-ed)
-- ---------------------------------------------------------------------------
create policy workspaces_select_client on public.workspaces for select to authenticated
  using ((select private.is_any_client()) and private.is_client_member(id));
-- Their own membership row, so the CRM knows their role (they don't see the rest of the team).
create policy members_select_self on public.workspace_members for select to authenticated
  using (user_id = (select auth.uid()));
create policy brands_select_client on public.brands for select to authenticated
  using ((select private.is_any_client()) and private.is_client_of_brand(id));
create policy imported_media_select_client on public.imported_media for select to authenticated
  using ((select private.is_any_client()) and private.client_can_see(project_id));
create policy idea_comments_select_client on public.idea_comments for select to authenticated
  using ((select private.is_any_client()) and private.client_can_see(project_id) and private.is_client_author(author_id, project_id));
create policy idea_comments_insert_client on public.idea_comments for insert to authenticated
  with check (
    author_id = (select auth.uid()) and status = 'open' and response is null and addressed_at is null
    and private.client_can_see(project_id)
  );

-- Posts themselves are not readable as rows (they hold the idea text, plan notes and the team's review
-- note); clients get only these fields.
create function public.client_posts(p_workspace_id uuid)
returns table (
  id uuid,
  title text,
  publish_date text,
  status text,
  content_type text,
  format text,
  captions jsonb,
  hashtags text,
  client_review jsonb,
  team_approved_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.title, p.source_metadata ->> 'publish_date', p.status::text, p.content_type::text,
         p.source_metadata ->> 'format', p.source_metadata -> 'finished' -> 'captions',
         p.source_metadata -> 'finished' ->> 'hashtags', p.source_metadata -> 'client_review',
         case when p.source_metadata -> 'review' ->> 'status' = 'approved'
              then (p.source_metadata -> 'review' ->> 'at')::timestamptz end
  from public.content_projects p
  where p.workspace_id = p_workspace_id and (select private.is_any_client()) and private.client_can_see(p.id)
  order by p.source_metadata ->> 'publish_date' nulls last, p.title;
$$;
revoke all on function public.client_posts(uuid) from public, anon;
grant execute on function public.client_posts(uuid) to authenticated, service_role;

-- Pages and files of the posts they see, and their brand's shared picture/font files (P5-T25 pages
-- point at brand-assets paths).
create policy project_media_objects_read_client on storage.objects for select to authenticated
  using (bucket_id in ('previews', 'media') and (select private.is_any_client()) and private.client_can_see_text((storage.foldername(name))[1]));
create policy brand_assets_objects_read_client on storage.objects for select to authenticated
  using (bucket_id = 'brand-assets' and (select private.is_any_client()) and private.is_client_of_brand_text((storage.foldername(name))[1]));

-- Profiles: a client sees only their own; the team still sees the client's.
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.workspace_members mine
      join public.workspace_members theirs on theirs.workspace_id = mine.workspace_id
      where mine.user_id = (select auth.uid()) and mine.role::text <> 'client' and theirs.user_id = profiles.id
    )
  );

-- ---------------------------------------------------------------------------
-- Client accounts get no personal workspace
-- ---------------------------------------------------------------------------
-- The API creates a client's account with app_metadata.stacko_client = true (only the service role can
-- set app_metadata), so the client doesn't become admin of an empty workspace of their own.
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
  if coalesce(new.raw_app_meta_data ->> 'stacko_client', '') = 'true' then
    return new;
  end if;
  insert into public.workspaces (name, created_by)
    values (coalesce(name, 'My') || '''s workspace', new.id)
    returning id into ws_id;
  insert into public.workspace_members (workspace_id, user_id, role) values (ws_id, new.id, 'admin');
  return new;
end;
$$;

-- Adds an account as a client of the workspace and links its brands. Called by the API (admins only)
-- after it found or created the account.
create function public.add_workspace_client(p_actor_id uuid, p_workspace_id uuid, p_user_id uuid, p_brand_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  b uuid;
begin
  if coalesce(private.member_role(p_workspace_id, p_actor_id)::text, '') <> 'admin' then
    raise exception 'forbidden: admins only' using errcode = 'P0001', hint = 'forbidden';
  end if;
  if exists (select 1 from public.workspace_members m where m.workspace_id = p_workspace_id and m.user_id = p_user_id) then
    raise exception 'already_member: this person is already in this workspace' using errcode = 'P0001', hint = 'duplicate';
  end if;
  foreach b in array coalesce(p_brand_ids, '{}') loop
    if not exists (select 1 from public.brands x where x.id = b and x.workspace_id = p_workspace_id) then
      raise exception 'validation_failed: brand % is not in this workspace', b using errcode = 'P0001', hint = 'validation_failed';
    end if;
  end loop;
  insert into public.workspace_members (workspace_id, user_id, role) values (p_workspace_id, p_user_id, 'client');
  insert into public.brand_members (brand_id, user_id, created_by)
    select distinct x, p_user_id, p_actor_id from unnest(coalesce(p_brand_ids, '{}')) x;
  return p_user_id;
end;
$$;
revoke all on function public.add_workspace_client(uuid, uuid, uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.add_workspace_client(uuid, uuid, uuid, uuid[]) to service_role;

-- ---------------------------------------------------------------------------
-- The client's decision
-- ---------------------------------------------------------------------------
-- Approve: recorded on the post (source_metadata.client_review). Request changes: recorded, and the
-- post goes back to the team exactly like the owner's "Request changes" (review = changes_requested,
-- status ready_to_publish → new), with from = 'client' so the agent's list says who asked.
create function public.client_review_post(p_actor_id uuid, p_project_id uuid, p_decision text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  r text;
  note text := nullif(trim(coalesce(p_note, '')), '');
  decision jsonb;
begin
  select * into proj from public.content_projects where id = p_project_id for update;
  if not found then
    raise exception 'not_found: project %', p_project_id using errcode = 'P0001', hint = 'not_found';
  end if;
  r := private.member_role(proj.workspace_id, p_actor_id)::text;
  if r is distinct from 'client' then
    raise exception 'forbidden: only client accounts review here' using errcode = 'P0001', hint = 'forbidden';
  end if;
  if not exists (select 1 from public.brand_members bm where bm.brand_id = proj.brand_id and bm.user_id = p_actor_id)
     or not public.client_visible(proj) then
    raise exception 'not_found: project %', p_project_id using errcode = 'P0001', hint = 'not_found';
  end if;
  if p_decision not in ('approved', 'changes_requested') then
    raise exception 'validation_failed: decision must be approved or changes_requested' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if p_decision = 'changes_requested' and length(coalesce(note, '')) < 3 then
    raise exception 'validation_failed: say what should change' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if proj.status::text <> 'ready_to_publish' or proj.source_metadata -> 'review' ->> 'status' <> 'approved' then
    raise exception 'invalid_transition: this post is % and can no longer be reviewed', proj.status
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;

  decision := jsonb_build_object('status', p_decision, 'note', note, 'by', p_actor_id, 'at', now());
  if p_decision = 'approved' then
    update public.content_projects
    set source_metadata = source_metadata || jsonb_build_object('client_review', decision)
    where id = proj.id;
  else
    update public.content_projects
    set source_metadata = source_metadata || jsonb_build_object(
      'client_review', decision,
      'review', jsonb_build_object('status', 'changes_requested', 'note', note, 'by', p_actor_id, 'at', now(),
                                   'downloaded', '{}'::jsonb, 'from', 'client'))
    where id = proj.id;
    perform public.transition_project(proj.id, 'new', p_actor_id,
      jsonb_build_object('client_review', 'changes_requested'), 'ready_to_publish');
  end if;
  perform public.log_event(proj.id, 'client_review.' || p_decision, jsonb_build_object('note', note), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'client_review', decision);
end;
$$;
revoke all on function public.client_review_post(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.client_review_post(uuid, uuid, text, text) to service_role;

-- The team's approval of a new version asks the client again: the old client decision is dropped.
create or replace function public.review_imported_post(
  p_actor_id uuid,
  p_project_id uuid,
  p_decision text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  review jsonb;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor', 'reviewer']::public.member_role[]);
  if coalesce(proj.source_metadata ->> 'origin', '') <> 'content_plan_import' then
    raise exception 'validation_failed: only imported content is reviewed here' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if p_decision not in ('approved', 'changes_requested') then
    raise exception 'validation_failed: decision must be approved or changes_requested' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if p_decision = 'changes_requested' and length(trim(coalesce(p_note, ''))) < 3 then
    raise exception 'validation_failed: say what should change' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if not exists (select 1 from public.imported_media where project_id = proj.id) then
    raise exception 'validation_failed: there are no finished files to review' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if proj.status not in ('new', 'ready_to_publish') then
    raise exception 'invalid_transition: this post is % and can no longer be reviewed', proj.status
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;

  review := jsonb_build_object('status', p_decision, 'note', nullif(trim(coalesce(p_note, '')), ''),
    'by', p_actor_id, 'at', now(), 'downloaded', '{}'::jsonb);
  update public.content_projects
  set source_metadata = case when p_decision = 'approved' then source_metadata - 'client_review' else source_metadata end
                        || jsonb_build_object('review', review)
  where id = proj.id;
  if p_decision = 'approved' and proj.status = 'new' then
    perform public.transition_project(proj.id, 'ready_to_publish', p_actor_id,
      jsonb_build_object('imported_review', 'approved'), 'new');
  elsif p_decision = 'changes_requested' and proj.status = 'ready_to_publish' then
    perform public.transition_project(proj.id, 'new', p_actor_id,
      jsonb_build_object('imported_review', 'changes_requested'), 'ready_to_publish');
  end if;
  perform public.log_event(proj.id, 'imported_review.' || p_decision,
    jsonb_build_object('note', review -> 'note'), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'review', review);
end;
$$;
