-- P5-T20: idea review. Pending ideas (status `new`, not an imported post with finished files) are
-- reviewed one card at a time in the CRM: approve (starts the pipeline, existing /analyze), decline
-- (cancelled with a reason, history kept so the idea is not proposed again), details, and comments.
-- Comments are notes for the agent: it reads the open ones in its next session, revises the idea and
-- answers with address_idea_comment(), which closes the comment and keeps the old text in the history.

create table public.idea_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete cascade,
  author_id uuid default auth.uid() references auth.users (id) on delete set null,
  body text not null check (length(trim(body)) between 1 and 4000),
  status text not null default 'open' check (status in ('open', 'addressed')),
  response text check (response is null or length(response) <= 4000),
  addressed_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'addressed') = (addressed_at is not null))
);
create index idea_comments_project_idx on public.idea_comments (project_id, created_at);
create index idea_comments_open_idx on public.idea_comments (created_at) where status = 'open';

alter table public.idea_comments enable row level security;
create policy idea_comments_select on public.idea_comments for select to authenticated
  using (exists (select 1 from public.content_projects p where p.id = project_id and private.is_member(p.workspace_id)));
-- Every member (reviewers too) can leave a note on an idea; only as themselves, only open ones.
create policy idea_comments_insert on public.idea_comments for insert to authenticated
  with check (
    author_id = auth.uid() and status = 'open' and response is null and addressed_at is null
    and exists (select 1 from public.content_projects p where p.id = project_id and private.is_member(p.workspace_id))
  );
revoke all on public.idea_comments from anon;
revoke update, delete on public.idea_comments from authenticated;
grant select, insert on public.idea_comments to authenticated;

-- Every comment is in the project's history.
create or replace function private.log_idea_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_event(new.project_id, 'idea.comment_added',
    jsonb_build_object('comment_id', new.id, 'body', left(new.body, 500)), new.author_id);
  return null;
end;
$$;
create trigger idea_comments_log after insert on public.idea_comments
  for each row execute function private.log_idea_comment();

-- Decline a pending idea: cancelled with the reason (kept, so the same idea is not imported again).
create or replace function public.decline_idea(p_actor_id uuid, p_project_id uuid, p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  why text := coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'Declined in idea review');
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  if proj.status <> 'new' then
    raise exception 'invalid_transition: this idea is % and is no longer pending', proj.status
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  if proj.source_metadata ? 'finished' then
    raise exception 'validation_failed: a post with finished files is reviewed on its page'
      using errcode = 'P0001', hint = 'validation_failed';
  end if;
  update public.content_projects
  set source_metadata = source_metadata
    || jsonb_build_object('declined', jsonb_build_object('reason', left(why, 2000), 'by', p_actor_id, 'at', now()))
  where id = proj.id;
  perform public.transition_project(proj.id, 'cancelled', p_actor_id,
    jsonb_build_object('reason', left(why, 2000), 'declined', true), 'new');
  perform public.log_event(proj.id, 'idea.declined', jsonb_build_object('reason', left(why, 2000)), p_actor_id);
  return jsonb_build_object('project_id', proj.id, 'status', 'cancelled');
end;
$$;

-- The agent answers a comment. It can revise the pending idea's title and/or text at the same time;
-- the previous text goes into the history event. Run with the service role (scripts/ideas/feedback.mjs).
create or replace function public.address_idea_comment(
  p_comment_id uuid,
  p_response text,
  p_title text default null,
  p_original_idea text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.idea_comments;
  proj public.content_projects;
  revised boolean := nullif(trim(coalesce(p_title, '')), '') is not null
    or nullif(trim(coalesce(p_original_idea, '')), '') is not null;
begin
  select * into c from public.idea_comments where id = p_comment_id for update;
  if not found then
    raise exception 'not_found: comment %', p_comment_id using errcode = 'P0001', hint = 'not_found';
  end if;
  if c.status <> 'open' then
    raise exception 'validation_failed: this comment is already addressed' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if length(trim(coalesce(p_response, ''))) < 3 then
    raise exception 'validation_failed: say what was changed' using errcode = 'P0001', hint = 'validation_failed';
  end if;

  select * into proj from public.content_projects where id = c.project_id for update;
  if revised then
    if proj.status <> 'new' then
      raise exception 'invalid_transition: the idea is % and can no longer be edited here', proj.status
        using errcode = 'P0001', hint = 'invalid_transition';
    end if;
    perform public.log_event(proj.id, 'idea.revised', jsonb_build_object(
      'comment_id', c.id,
      'previous_title', proj.title,
      'previous_idea', proj.original_idea));
    update public.content_projects
    set title = coalesce(nullif(trim(p_title), ''), title),
        original_idea = coalesce(nullif(trim(p_original_idea), ''), original_idea)
    where id = proj.id;
  end if;

  update public.idea_comments
  set status = 'addressed', response = trim(p_response), addressed_at = now()
  where id = c.id;
  perform public.log_event(proj.id, 'idea.comment_addressed',
    jsonb_build_object('comment_id', c.id, 'response', left(trim(p_response), 500), 'revised', revised));
  return jsonb_build_object('comment_id', c.id, 'project_id', proj.id, 'revised', revised);
end;
$$;

revoke all on function private.log_idea_comment() from public;
revoke all on function public.decline_idea(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.address_idea_comment(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.decline_idea(uuid, uuid, text) to service_role;
grant execute on function public.address_idea_comment(uuid, text, text, text) to service_role;
