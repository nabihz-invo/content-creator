-- P5-T15: finished media for content imported from a content plan, and the storage rules:
--   1. upload as little as possible (a post that is already live is recorded with its link, no file);
--   2. deleting a row deletes its stored file;
--   3. once a language version is live, its files can be released: the file is removed and the row
--      keeps the live post's link.
-- Supabase does not allow deleting storage objects from SQL, so rows queue their paths in
-- private.storage_deletions and the API removes them through the Storage API (and retries from
-- the recovery cron).

-- ---------------------------------------------------------------------------
-- Storage cleanup queue
-- ---------------------------------------------------------------------------
create table private.storage_deletions (
  id bigint generated always as identity primary key,
  bucket text not null,
  path text not null,
  reason text not null,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  done_at timestamptz
);
create unique index storage_deletions_pending on private.storage_deletions (bucket, path) where done_at is null;

create or replace function private.queue_storage_delete(p_bucket text, p_path text, p_reason text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.storage_deletions (bucket, path, reason)
  select p_bucket, p_path, p_reason
  where p_path is not null
  on conflict (bucket, path) where done_at is null do nothing;
$$;

-- Trigger: a row's file is queued for removal when the row is deleted or its storage_path changes
-- (replaced by a new version, or released). TG_ARGV[0] is the bucket.
create or replace function private.queue_row_storage_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform private.queue_storage_delete(tg_argv[0], old.storage_path, tg_table_name || ' deleted');
    return old;
  end if;
  if old.storage_path is not null and old.storage_path is distinct from new.storage_path then
    perform private.queue_storage_delete(tg_argv[0], old.storage_path, tg_table_name || ' file replaced or released');
  end if;
  return new;
end;
$$;

create trigger brand_assets_storage_cleanup after delete on public.brand_assets
  for each row execute function private.queue_row_storage_delete('brand-assets');

-- Workers / the API take pending paths, remove them with the Storage API, then report back.
create or replace function public.claim_storage_deletions(p_limit integer default 100)
returns table (id bigint, bucket text, path text)
language sql
security definer
set search_path = ''
as $$
  update private.storage_deletions d
  set attempts = d.attempts + 1
  where d.id in (
    select s.id from private.storage_deletions s
    where s.done_at is null and s.attempts < 10
    order by s.id
    limit greatest(1, least(p_limit, 1000))
    for update skip locked
  )
  returning d.id, d.bucket, d.path;
$$;

create or replace function public.finish_storage_deletions(p_done bigint[], p_failed jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  n_done integer;
begin
  update private.storage_deletions set done_at = now(), last_error = null
  where id = any (coalesce(p_done, '{}')) and done_at is null;
  get diagnostics n_done = row_count;
  -- p_failed: { "<id>": "error message" }
  update private.storage_deletions d set last_error = left(f.value, 500)
  from jsonb_each_text(coalesce(p_failed, '{}'::jsonb)) f
  where d.id = f.key::bigint;
  return jsonb_build_object('done', n_done,
    'pending', (select count(*) from private.storage_deletions where done_at is null));
end;
$$;

revoke all on function private.queue_storage_delete(text, text, text) from public;
revoke all on function public.claim_storage_deletions(integer) from public, anon, authenticated;
revoke all on function public.finish_storage_deletions(bigint[], jsonb) from public, anon, authenticated;
grant execute on function public.claim_storage_deletions(integer) to service_role;
grant execute on function public.finish_storage_deletions(bigint[], jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Imported media
-- ---------------------------------------------------------------------------
-- media/<project_id>/imported/<language|x>/<checksum8>-<file> (read by members through the
-- existing project_media_objects_read policy).
create table public.imported_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete cascade,
  language text check (language in ('en', 'ar')),
  kind text not null check (kind in ('image', 'carousel_slide', 'video', 'cover', 'document')),
  slide_index integer check (slide_index >= 1),
  file_name text not null check (length(file_name) between 1 and 200),
  storage_path text unique,
  mime_type text not null,
  file_size bigint not null check (file_size >= 0),
  width integer check (width > 0),
  height integer check (height > 0),
  duration numeric(10, 3) check (duration >= 0),
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  live_url text check (live_url ~ '^https://\S+$'),
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'carousel_slide') = (slide_index is not null)),
  -- Either the file is stored, or it was released: the live link replaces it, or (P5-T17) the
  -- approved post was downloaded and the link is added once it is posted.
  check ((storage_path is null) = (released_at is not null))
);
create unique index imported_media_slot on public.imported_media
  (project_id, coalesce(language, ''), kind, coalesce(slide_index, 0));
create index imported_media_project_idx on public.imported_media (project_id);

create trigger imported_media_updated_at before update on public.imported_media
  for each row execute function private.set_updated_at();
create trigger imported_media_storage_cleanup after update or delete on public.imported_media
  for each row execute function private.queue_row_storage_delete('media');

alter table public.imported_media enable row level security;
create policy imported_media_select on public.imported_media for select to authenticated
  using (exists (select 1 from public.content_projects p where p.id = project_id and private.is_member(p.workspace_id)));
revoke insert, update, delete on public.imported_media from authenticated;

-- The live link for one language version: its own link, or one shared by both languages.
-- Projects closed before P5-T15 only have source_metadata.published (treated as both).
create or replace function private.imported_live_url(p_meta jsonb, p_language text)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    p_meta -> 'published_links' -> coalesce(p_language, 'both') ->> 'url',
    p_meta -> 'published_links' -> 'both' ->> 'url',
    case when p_language is null then
      (select l.value ->> 'url' from jsonb_each(coalesce(p_meta -> 'published_links', '{}'::jsonb)) l order by l.key limit 1)
    end,
    case when p_meta -> 'published_links' is null then p_meta -> 'published' ->> 'url' end
  );
$$;

-- ---------------------------------------------------------------------------
-- Live links per language (replaces the P4-T10 single-link version)
-- ---------------------------------------------------------------------------
drop function public.mark_imported_published(uuid, uuid, text, timestamptz);

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
  if proj.status not in ('new', 'published') then
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
    -- a pre-P5-T15 single link becomes the "both" entry
    || jsonb_build_object('published_links',
         coalesce(source_metadata -> 'published_links',
                  case when source_metadata ? 'published' then jsonb_build_object('both', source_metadata -> 'published') else '{}'::jsonb end)
         || jsonb_build_object(lang, link))
    || case when source_metadata ? 'published' then '{}'::jsonb else jsonb_build_object('published', link) end
  where id = proj.id;

  if proj.status = 'new' then
    perform public.transition_project(proj.id, 'published', p_actor_id,
      jsonb_build_object('external', true, 'url', p_published_url, 'language', lang), 'new');
  end if;
  perform public.log_event(proj.id, 'publishing.published_externally', link || jsonb_build_object('language', lang), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'status', 'published', 'language', lang,
    'published_url', p_published_url, 'replayed', false);
end;
$$;

revoke all on function public.mark_imported_published(uuid, uuid, text, timestamptz, text) from public, anon, authenticated;
grant execute on function public.mark_imported_published(uuid, uuid, text, timestamptz, text) to service_role;

-- ---------------------------------------------------------------------------
-- Register finished files (the import script uploads first, then calls this)
-- ---------------------------------------------------------------------------
-- p_items: [{ language, kind, slide_index, file_name, storage_path|null, mime_type, file_size,
--             width, height, duration, checksum, metadata }]
-- A null storage_path means "not uploaded": allowed only when that version is already live, and the
-- row is recorded as released with the live link. A slot whose checksum is unchanged is left alone;
-- a changed file replaces the row's file (the old one is queued for removal).
-- p_finished: { captions: { en, ar }, hashtags, source } merged into source_metadata.finished.
create or replace function public.save_imported_media(p_project_id uuid, p_items jsonb, p_finished jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  it jsonb;
  cur public.imported_media;
  lang text;
  live text;
  n_new integer := 0;
  n_replaced integer := 0;
  n_same integer := 0;
  n_link_only integer := 0;
begin
  select * into proj from public.content_projects where id = p_project_id for update;
  if proj.id is null then
    raise exception 'not_found: project not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  if coalesce(proj.source_metadata ->> 'origin', '') <> 'content_plan_import' then
    raise exception 'validation_failed: finished media can only be attached to imported content'
      using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if jsonb_typeof(coalesce(p_items, 'null'::jsonb)) <> 'array' then
    raise exception 'validation_failed: items must be an array' using errcode = 'P0001', hint = 'validation_failed';
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    lang := nullif(it ->> 'language', '');
    if it ->> 'storage_path' is not null and split_part(it ->> 'storage_path', '/', 1) <> proj.id::text then
      raise exception 'validation_failed: % must be stored under the project folder', it ->> 'file_name'
        using errcode = 'P0001', hint = 'validation_failed';
    end if;
    live := private.imported_live_url(proj.source_metadata, lang);
    if it ->> 'storage_path' is null and live is null then
      raise exception 'validation_failed: % was not uploaded and its version has no live link', it ->> 'file_name'
        using errcode = 'P0001', hint = 'validation_failed';
    end if;

    select * into cur from public.imported_media m
    where m.project_id = proj.id and coalesce(m.language, '') = coalesce(lang, '')
      and m.kind = it ->> 'kind' and coalesce(m.slide_index, 0) = coalesce((it ->> 'slide_index')::int, 0);

    if cur.id is not null and cur.checksum = it ->> 'checksum' then
      n_same := n_same + 1;
      continue;
    end if;

    if cur.id is null then
      insert into public.imported_media (project_id, language, kind, slide_index, file_name, storage_path, mime_type,
        file_size, width, height, duration, checksum, metadata, live_url, released_at)
      values (proj.id, lang, it ->> 'kind', (it ->> 'slide_index')::int, it ->> 'file_name', it ->> 'storage_path',
        it ->> 'mime_type', (it ->> 'file_size')::bigint, (it ->> 'width')::int, (it ->> 'height')::int,
        (it ->> 'duration')::numeric, it ->> 'checksum', coalesce(it -> 'metadata', '{}'::jsonb),
        live, case when it ->> 'storage_path' is null then now() end);
      n_new := n_new + 1;
    else
      update public.imported_media set
        file_name = it ->> 'file_name', storage_path = it ->> 'storage_path', mime_type = it ->> 'mime_type',
        file_size = (it ->> 'file_size')::bigint, width = (it ->> 'width')::int, height = (it ->> 'height')::int,
        duration = (it ->> 'duration')::numeric, checksum = it ->> 'checksum',
        metadata = coalesce(it -> 'metadata', '{}'::jsonb), live_url = live,
        released_at = case when it ->> 'storage_path' is null then now() end
      where id = cur.id;
      n_replaced := n_replaced + 1;
    end if;
    if it ->> 'storage_path' is null then
      n_link_only := n_link_only + 1;
    end if;
  end loop;

  if p_finished is not null then
    update public.content_projects
    set source_metadata = source_metadata || jsonb_build_object('finished',
      coalesce(source_metadata -> 'finished', '{}'::jsonb) || p_finished)
    where id = proj.id;
  end if;
  if n_new + n_replaced > 0 then
    perform public.log_event(proj.id, 'imported_media.saved',
      jsonb_build_object('new', n_new, 'replaced', n_replaced, 'link_only', n_link_only), null);
  end if;
  return jsonb_build_object('project_id', proj.id, 'new', n_new, 'replaced', n_replaced,
    'unchanged', n_same, 'link_only', n_link_only);
end;
$$;

revoke all on function public.save_imported_media(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_imported_media(uuid, jsonb, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Free storage once a version is live / delete a file
-- ---------------------------------------------------------------------------
-- Releases the stored files of one language version (or every version that has a live link when
-- p_language is null). The rows stay, pointing at the live post.
create or replace function public.release_imported_media(p_actor_id uuid, p_project_id uuid, p_language text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  n integer := 0;
  bytes bigint := 0;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  if p_language is not null and p_language not in ('en', 'ar') then
    raise exception 'validation_failed: language must be en or ar' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if p_language is not null and private.imported_live_url(proj.source_metadata, p_language) is null then
    raise exception 'validation_failed: the % version has no live link yet', p_language
      using errcode = 'P0001', hint = 'validation_failed';
  end if;

  with released as (
    update public.imported_media m
    set storage_path = null, released_at = now(),
        live_url = private.imported_live_url(proj.source_metadata, m.language)
    where m.project_id = proj.id and m.storage_path is not null
      and (p_language is null or m.language = p_language or m.language is null)
      and private.imported_live_url(proj.source_metadata, m.language) is not null
    returning m.file_size
  )
  select count(*), coalesce(sum(file_size), 0) into n, bytes from released;

  if n > 0 then
    perform public.log_event(proj.id, 'imported_media.released',
      jsonb_build_object('language', p_language, 'files', n, 'bytes', bytes), p_actor_id);
  end if;
  return jsonb_build_object('project_id', proj.id, 'released', n, 'bytes', bytes);
end;
$$;

create or replace function public.delete_imported_media(p_actor_id uuid, p_media_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.imported_media;
begin
  select * into m from public.imported_media where id = p_media_id;
  if m.id is null then
    raise exception 'not_found: file not found' using errcode = 'P0001', hint = 'not_found';
  end if;
  perform private.require_role(m.project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  delete from public.imported_media where id = m.id;
  perform public.log_event(m.project_id, 'imported_media.deleted',
    jsonb_build_object('file', m.file_name, 'language', m.language, 'stored', m.storage_path is not null), p_actor_id);
  return jsonb_build_object('id', m.id, 'project_id', m.project_id, 'deleted', true);
end;
$$;

revoke all on function public.release_imported_media(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.delete_imported_media(uuid, uuid) from public, anon, authenticated;
grant execute on function public.release_imported_media(uuid, uuid, text) to service_role;
grant execute on function public.delete_imported_media(uuid, uuid) to service_role;
