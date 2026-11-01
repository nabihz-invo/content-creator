-- P5-T17: reviewing finished imported posts, so only clean data stays.
--   approve           → download the version (zip) → free its storage (the link is added once posted)
--   request changes   → a note says what to fix; re-uploading changed files puts the post back in review
--   discard           → every file and its storage are removed and the project is cancelled (history kept)
-- The review lives in content_projects.source_metadata.review:
--   { status: approved | changes_requested, note, by, at, downloaded: { en|ar|all: at } }

-- A changed or new file means the reviewed version is gone: back to review, downloads reset.
create or replace function private.reset_imported_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.checksum is distinct from old.checksum then
    update public.content_projects
    set source_metadata = source_metadata - 'review'
    where id = new.project_id and source_metadata ? 'review';
  end if;
  return null;
end;
$$;

create trigger imported_media_reset_review after insert or update of checksum on public.imported_media
  for each row execute function private.reset_imported_review();

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
  if proj.status = 'cancelled' then
    raise exception 'invalid_transition: this post was discarded' using errcode = 'P0001', hint = 'invalid_transition';
  end if;

  review := jsonb_build_object('status', p_decision, 'note', nullif(trim(coalesce(p_note, '')), ''),
    'by', p_actor_id, 'at', now(), 'downloaded', '{}'::jsonb);
  update public.content_projects
  set source_metadata = source_metadata || jsonb_build_object('review', review)
  where id = proj.id;
  perform public.log_event(proj.id, 'imported_review.' || p_decision,
    jsonb_build_object('note', review -> 'note'), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'review', review);
end;
$$;

-- The API calls this after it built the zip of an approved version (p_language null = all files).
create or replace function public.record_imported_download(p_actor_id uuid, p_project_id uuid, p_language text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  slot text := coalesce(p_language, 'all');
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor', 'reviewer']::public.member_role[]);
  if proj.source_metadata -> 'review' ->> 'status' is distinct from 'approved' then
    raise exception 'approval_required: approve the post before downloading it to free its storage'
      using errcode = 'P0001', hint = 'approval_required';
  end if;
  update public.content_projects
  set source_metadata = jsonb_set(source_metadata, array['review', 'downloaded', slot], to_jsonb(now()), true)
  where id = proj.id;
  perform public.log_event(proj.id, 'imported_media.downloaded', jsonb_build_object('language', p_language), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'downloaded', slot);
end;
$$;

-- Release (replaces the P5-T15 version): a version can be freed when it is live, or when the post
-- is approved and that version (or everything) was downloaded since the approval.
create or replace function public.release_imported_media(p_actor_id uuid, p_project_id uuid, p_language text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  approved boolean;
  dl jsonb;
  n integer := 0;
  bytes bigint := 0;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  if p_language is not null and p_language not in ('en', 'ar') then
    raise exception 'validation_failed: language must be en or ar' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  approved := proj.source_metadata -> 'review' ->> 'status' = 'approved';
  dl := coalesce(proj.source_metadata -> 'review' -> 'downloaded', '{}'::jsonb);

  with releasable as (
    select m.id, private.imported_live_url(proj.source_metadata, m.language) as live
    from public.imported_media m
    where m.project_id = proj.id and m.storage_path is not null
      and (p_language is null or m.language = p_language or m.language is null)
  ), released as (
    update public.imported_media m
    set storage_path = null, released_at = now(), live_url = r.live,
        metadata = m.metadata || case when r.live is null then jsonb_build_object('kept_locally', true) else '{}'::jsonb end
    from releasable r
    where m.id = r.id
      and (r.live is not null
           or (approved and (dl ? 'all' or dl ? coalesce(m.language, 'all')
                             or (m.language is null and dl ?| array['en', 'ar']))))
    returning m.file_size
  )
  select count(*), coalesce(sum(file_size), 0) into n, bytes from released;

  if n = 0 and exists (select 1 from public.imported_media m where m.project_id = proj.id and m.storage_path is not null
                         and (p_language is null or m.language = p_language)) then
    raise exception 'validation_failed: approve and download the post first, or add its live link'
      using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if n > 0 then
    perform public.log_event(proj.id, 'imported_media.released',
      jsonb_build_object('language', p_language, 'files', n, 'bytes', bytes), p_actor_id);
  end if;
  return jsonb_build_object('project_id', proj.id, 'released', n, 'bytes', bytes);
end;
$$;

-- Discard: remove every file (their storage is queued by the delete trigger) and cancel the project.
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
  if proj.status not in ('new', 'cancelled') then
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
  if proj.status = 'new' then
    perform public.transition_project(proj.id, 'cancelled', p_actor_id,
      jsonb_build_object('reason', trim(p_reason), 'discarded', true), 'new');
  end if;
  perform public.log_event(proj.id, 'imported_post.discarded',
    jsonb_build_object('reason', trim(p_reason), 'files', n, 'bytes', bytes), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'files', n, 'bytes', bytes, 'status', 'cancelled');
end;
$$;

-- A link added after the files were downloaded and freed is copied onto those rows.
create or replace function private.fill_released_links()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source_metadata -> 'published_links' is distinct from old.source_metadata -> 'published_links' then
    update public.imported_media m
    set live_url = private.imported_live_url(new.source_metadata, m.language)
    where m.project_id = new.id and m.storage_path is null and m.live_url is null
      and private.imported_live_url(new.source_metadata, m.language) is not null;
  end if;
  return null;
end;
$$;

create trigger content_projects_fill_released_links after update of source_metadata on public.content_projects
  for each row execute function private.fill_released_links();

revoke all on function public.review_imported_post(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.record_imported_download(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.discard_imported_post(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.review_imported_post(uuid, uuid, text, text) to service_role;
grant execute on function public.record_imported_download(uuid, uuid, text) to service_role;
grant execute on function public.discard_imported_post(uuid, uuid, text) to service_role;
