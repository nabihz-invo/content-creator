-- P5-T27: discarding a post records a reason from a fixed list plus an optional comment, so the
-- reasons can be analysed later (view public.discarded_posts).
-- source_metadata.discarded = { category, reason (the comment, may be null), by, at }.
-- Older discards (free text only) are sorted into the list once, below; their text stays as the comment.

create function public.discard_categories()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['duplicate', 'not_useful', 'not_clear', 'design', 'screens', 'audience', 'missing_asset', 'on_hold', 'other'];
$$;
grant execute on function public.discard_categories() to authenticated, service_role;

drop function public.discard_imported_post(uuid, uuid, text);

-- p_category null keeps the old behaviour (free text, at least 3 characters), so an API that doesn't
-- send it yet still works. With a category the comment is optional, except for 'other'.
create function public.discard_imported_post(p_actor_id uuid, p_project_id uuid, p_reason text, p_category text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  n integer;
  bytes bigint;
  note text := nullif(trim(coalesce(p_reason, '')), '');
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  if coalesce(proj.source_metadata ->> 'origin', '') <> 'content_plan_import' then
    raise exception 'validation_failed: only imported content can be discarded here' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if p_category is not null and not (p_category = any (public.discard_categories())) then
    raise exception 'validation_failed: unknown reason %', p_category using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if (p_category is null or p_category = 'other') and length(coalesce(note, '')) < 3 then
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
  set source_metadata = (source_metadata - 'review' - 'finished' - 'client_review')
    || jsonb_build_object('discarded', jsonb_build_object('category', coalesce(p_category, 'other'), 'reason', note,
                                                          'by', p_actor_id, 'at', now()))
  where id = proj.id;
  if proj.status in ('new', 'ready_to_publish') then
    perform public.transition_project(proj.id, 'cancelled', p_actor_id,
      jsonb_build_object('reason', note, 'category', coalesce(p_category, 'other'), 'discarded', true), proj.status);
  end if;
  perform public.log_event(proj.id, 'imported_post.discarded',
    jsonb_build_object('category', coalesce(p_category, 'other'), 'reason', note, 'files', n, 'bytes', bytes), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'files', n, 'bytes', bytes, 'status', 'cancelled');
end;
$$;
revoke all on function public.discard_imported_post(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.discard_imported_post(uuid, uuid, text, text) to service_role;

-- One-time: sort the earlier free-text reasons (109 posts on 2026-11-12) into the list.
update public.content_projects
set source_metadata = jsonb_set(source_metadata, '{discarded,category}', to_jsonb(
  case
    when r ~ 'dup' then 'duplicate'
    when r ~ 'screenshot|map' then 'screens'
    when r ~ 'empty' then 'design'
    when r ~ 'hold|later' then 'on_hold'
    when r ~ 'audience|market' then 'audience'
    when r ~ 'icon|flag' then 'missing_asset'
    when r ~ 'clear' then 'not_clear'
    when r ~ 'use?fu|uesful|weak|no need|not good|interactive|short' then 'not_useful'
    else 'other'
  end))
from (select id as pid, lower(coalesce(source_metadata -> 'discarded' ->> 'reason', '')) as r from public.content_projects) x
where x.pid = content_projects.id
  and content_projects.source_metadata ? 'discarded'
  and not (content_projects.source_metadata -> 'discarded' ? 'category');

-- For analysis: every discarded post with its reason. security_invoker, so the team's RLS applies
-- (clients can't read post rows).
create view public.discarded_posts
with (security_invoker = true) as
  select p.id, p.workspace_id, p.brand_id, b.name as brand,
         p.source_metadata ->> 'plan_id' as plan_id, p.title, p.content_type::text as content_type,
         p.source_metadata ->> 'format' as format,
         p.source_metadata -> 'discarded' ->> 'category' as category,
         p.source_metadata -> 'discarded' ->> 'reason' as comment,
         (p.source_metadata -> 'discarded' ->> 'at')::timestamptz as discarded_at,
         (p.source_metadata -> 'discarded' ->> 'by')::uuid as discarded_by
  from public.content_projects p
  left join public.brands b on b.id = p.brand_id
  where p.source_metadata ? 'discarded';
revoke all on public.discarded_posts from anon;
grant select on public.discarded_posts to authenticated, service_role;
