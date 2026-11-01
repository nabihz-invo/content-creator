-- P5-T18: an approved imported post is "ready to publish" (it stayed "new" after approval), it goes
-- back to "new" when changes are requested or its files change, and every project can carry a
-- planned publish date (source_metadata.publish_date, YYYY-MM-DD) that also names its downloads.

insert into public.project_status_transitions (from_status, to_status, trigger_description) values
  ('new', 'ready_to_publish', 'imported post approved'),
  ('ready_to_publish', 'new', 'imported post sent back for changes')
on conflict do nothing;

-- Back to review when a file changes (replaces the P5-T17 trigger function).
create or replace function private.reset_imported_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
begin
  if tg_op = 'INSERT' or new.checksum is distinct from old.checksum then
    update public.content_projects
    set source_metadata = source_metadata - 'review'
    where id = new.project_id and source_metadata ? 'review'
    returning * into proj;
    if proj.status = 'ready_to_publish' then
      perform public.transition_project(proj.id, 'new', null,
        jsonb_build_object('reason', 'finished files changed'), 'ready_to_publish');
    end if;
  end if;
  return null;
end;
$$;

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
  set source_metadata = source_metadata || jsonb_build_object('review', review)
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

-- Discard also works on an approved (ready to publish) imported post.
create or replace function public.discard_imported_post(p_actor_id uuid, p_project_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  n integer;
  bytes bigint;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  if coalesce(proj.source_metadata ->> 'origin', '') <> 'content_plan_import' then
    raise exception 'validation_failed: only imported content can be discarded here' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'validation_failed: give a reason' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if proj.status not in ('new', 'ready_to_publish', 'cancelled') then
    raise exception 'invalid_transition: this post is % and cannot be discarded', proj.status
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;

  with gone as (
    delete from public.imported_media where project_id = proj.id
    returning coalesce(case when storage_path is not null then file_size end, 0) as stored
  )
  select count(*), coalesce(sum(stored), 0) into n, bytes from gone;

  update public.content_projects
  set source_metadata = (source_metadata - 'review' - 'finished')
    || jsonb_build_object('discarded', jsonb_build_object('reason', trim(p_reason), 'by', p_actor_id, 'at', now()))
  where id = proj.id;
  if proj.status in ('new', 'ready_to_publish') then
    perform public.transition_project(proj.id, 'cancelled', p_actor_id,
      jsonb_build_object('reason', trim(p_reason), 'discarded', true), proj.status);
  end if;
  perform public.log_event(proj.id, 'imported_post.discarded',
    jsonb_build_object('reason', trim(p_reason), 'files', n, 'bytes', bytes), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'files', n, 'bytes', bytes, 'status', 'cancelled');
end;
$$;

-- The live link closes an imported post from "new" or "ready to publish".
create or replace function public.mark_imported_published(
  p_actor_id uuid,
  p_project_id uuid,
  p_published_url text,
  p_published_at timestamptz default null,
  p_language text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  lang text := coalesce(p_language, 'both');
  link jsonb;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  if coalesce(proj.source_metadata ->> 'origin', '') <> 'content_plan_import' then
    raise exception 'approval_required: only content imported from a content plan can be marked published without the pipeline'
      using errcode = 'P0001', hint = 'approval_required';
  end if;
  if coalesce(p_published_url, '') !~ '^https://[^\s]+$' then
    raise exception 'validation_failed: the post URL must be an https link' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if lang not in ('en', 'ar', 'both') then
    raise exception 'validation_failed: language must be en, ar or both' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if proj.status not in ('new', 'ready_to_publish', 'published') then
    raise exception 'invalid_transition: this project is in the pipeline (%); publish it through its publishing package', proj.status
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  if proj.source_metadata -> 'published_links' -> lang ->> 'url' = p_published_url
     or (lang = 'both' and proj.source_metadata -> 'published_links' is null
         and proj.source_metadata -> 'published' ->> 'url' = p_published_url) then
    return jsonb_build_object('project_id', proj.id, 'status', proj.status, 'language', lang,
      'published_url', p_published_url, 'replayed', true);
  end if;

  link := jsonb_build_object('url', p_published_url, 'at', coalesce(p_published_at, now()), 'confirmed_by', p_actor_id);
  update public.content_projects
  set source_metadata = source_metadata
    || jsonb_build_object('published_links',
         coalesce(source_metadata -> 'published_links',
                  case when source_metadata ? 'published' then jsonb_build_object('both', source_metadata -> 'published') else '{}'::jsonb end)
         || jsonb_build_object(lang, link))
    || case when source_metadata ? 'published' then '{}'::jsonb else jsonb_build_object('published', link) end
  where id = proj.id;

  if proj.status in ('new', 'ready_to_publish') then
    perform public.transition_project(proj.id, 'published', p_actor_id,
      jsonb_build_object('external', true, 'url', p_published_url, 'language', lang), proj.status);
  end if;
  perform public.log_event(proj.id, 'publishing.published_externally', link || jsonb_build_object('language', lang), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'status', 'published', 'language', lang,
    'published_url', p_published_url, 'replayed', false);
end;
$$;

-- Planned publish date of any project (editors); null clears it.
create or replace function public.set_publish_date(p_actor_id uuid, p_project_id uuid, p_date date)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  update public.content_projects
  set source_metadata = case when p_date is null then source_metadata - 'publish_date'
                             else source_metadata || jsonb_build_object('publish_date', to_char(p_date, 'YYYY-MM-DD')) end
  where id = proj.id;
  perform public.log_event(proj.id, 'project.publish_date', jsonb_build_object('date', p_date), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'publish_date', p_date);
end;
$$;

revoke all on function public.set_publish_date(uuid, uuid, date) from public, anon, authenticated;
grant execute on function public.set_publish_date(uuid, uuid, date) to service_role;

-- Posts approved before this migration move to "ready to publish" now.
do $$
declare
  p record;
begin
  for p in
    select id from public.content_projects
    where status = 'new' and source_metadata ->> 'origin' = 'content_plan_import'
      and source_metadata -> 'review' ->> 'status' = 'approved'
  loop
    perform public.transition_project(p.id, 'ready_to_publish', null,
      jsonb_build_object('imported_review', 'approved', 'backfill', true), 'new');
  end loop;
end;
$$;
