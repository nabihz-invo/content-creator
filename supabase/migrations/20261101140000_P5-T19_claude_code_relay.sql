-- P5-T19 (ADR-0011): AI stages answered by Claude Code on the owner's PC (their Claude subscription),
-- not by the Anthropic API. The api function writes each model request here and parks its job;
-- the job runner claims the request, runs Claude Code, stores the reply and wakes the job, which then
-- replays the stage: the same prompts, schema checks and save_* RPCs as before.

create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.workflow_jobs (id) on delete cascade,
  -- sha256 of (job, attempt, request): the replay finds its reply by recomputing it
  key text not null unique,
  stage text not null,
  params jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed')),
  response jsonb,
  error text,
  locked_by text,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at timestamptz,
  check ((status = 'done') = (response is not null))
);
create index ai_requests_open on public.ai_requests (created_at) where status in ('pending', 'running');

alter table public.ai_requests enable row level security;
revoke all on public.ai_requests from anon, authenticated;

-- The stage is waiting for Claude Code: give the job back without spending an attempt; it sleeps
-- until its reply arrives (finish_ai_request wakes it).
create or replace function public.defer_job(p_job_id uuid, p_worker_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  j public.workflow_jobs;
begin
  update public.workflow_jobs
  set status = 'queued', locked_by = null, lease_expires_at = null,
      attempts = greatest(attempts - 1, 0), next_run_at = now() + interval '30 days'
  where id = p_job_id and status = 'running' and locked_by = p_worker_id
  returning * into j;
  if found then
    perform public.log_event(j.project_id, 'job.waiting_for_ai', jsonb_build_object('stage', j.stage), null, j.id);
  end if;
end;
$$;

-- Oldest open request; one left "running" for 20 minutes (the PC slept, the runner crashed) is taken again.
create or replace function public.claim_ai_request(p_worker_id text)
returns setof public.ai_requests
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.ai_requests r
  set status = 'running', locked_by = p_worker_id, attempts = r.attempts + 1, updated_at = now()
  where r.id = (
    select id from public.ai_requests
    where status = 'pending' or (status = 'running' and updated_at < now() - interval '20 minutes')
    order by created_at
    limit 1
    for update skip locked)
  returning r.*;
end;
$$;

-- Stores the reply (or the failure) and wakes the parked job so the stage replays now.
create or replace function public.finish_ai_request(p_id uuid, p_response jsonb, p_error text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.ai_requests;
begin
  update public.ai_requests
  set status = case when p_response is not null then 'done' else 'failed' end,
      response = p_response, error = left(p_error, 2000), updated_at = now(), done_at = now()
  where id = p_id and status = 'running'
  returning * into r;
  if found then
    update public.workflow_jobs set next_run_at = now()
    where id = r.job_id and status = 'queued';
  end if;
end;
$$;

revoke all on function public.defer_job(uuid, text) from public, anon, authenticated;
revoke all on function public.claim_ai_request(text) from public, anon, authenticated;
revoke all on function public.finish_ai_request(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.defer_job(uuid, text) to service_role;
grant execute on function public.claim_ai_request(text) to service_role;
grant execute on function public.finish_ai_request(uuid, jsonb, text) to service_role;
grant select, insert, update on public.ai_requests to service_role;
