-- P5-T23: the Idea inbox groups projects into the owner's six stages. A stage is not stored: it is
-- worked out from what already exists, so it can never disagree with the project.
--   new       not analysed yet
--   content   analysed; the content is being prepared or waits for approval
--   media     content approved; final media being made or checked
--   declined  sent back with comments; waits for the agent, then returns to `content`
--   ready     final media approved, waiting to be posted
--   published posted
-- Plus `failed` and `cancelled`, which are outside the flow.
--
-- `inbox_stage` takes a row, so PostgREST exposes it as a computed column on content_projects
-- (select it, filter on it). Both functions run as the caller: RLS still applies.

create or replace function public.inbox_stage(p public.content_projects)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p.status in ('failed', 'cancelled', 'published') then p.status::text
    when p.status in ('ready_to_publish', 'scheduled', 'publishing') then 'ready'
    when p.status = 'new' and (
      p.source_metadata -> 'review' ->> 'status' = 'changes_requested'
      or exists (select 1 from public.idea_comments c where c.project_id = p.id and c.status = 'open')
    ) then 'declined'
    when p.status in ('generating_script', 'generating_creative', 'rendering') and (
      select a.decision from public.approvals a
      where a.project_id = p.id
      order by a.created_at desc
      limit 1
    ) = 'changes_requested' then 'declined'
    when p.status in ('rendering', 'media_in_review') then 'media'
    -- A `new` project that already has finished files is content waiting for approval, not a raw idea.
    when p.status = 'new' and not exists (
      select 1 from public.imported_media m where m.project_id = p.id
    ) then 'new'
    else 'content'
  end;
$$;

create or replace function public.inbox_stage_counts(p_workspace_id uuid)
returns table (stage text, total integer)
language sql
stable
set search_path = ''
as $$
  select public.inbox_stage(p), count(*)::integer
  from public.content_projects p
  where p.workspace_id = p_workspace_id
  group by 1;
$$;

revoke all on function public.inbox_stage(public.content_projects) from public, anon;
revoke all on function public.inbox_stage_counts(uuid) from public, anon;
grant execute on function public.inbox_stage(public.content_projects) to authenticated, service_role;
grant execute on function public.inbox_stage_counts(uuid) to authenticated, service_role;
