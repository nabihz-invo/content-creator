-- P1-T04: workflow jobs (Postgres-backed queue, ADR-0003), audit events,
-- idempotency keys, and the RPCs that are the only way to move state.

create type public.job_kind as enum ('n8n', 'creative_worker', 'render_worker', 'publish');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'needs_attention', 'cancelled');

create table public.workflow_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.content_projects (id) on delete restrict,
  stage public.pipeline_stage not null,
  kind public.job_kind not null,
  idempotency_key text not null unique,
  status public.job_status not null default 'queued',
  attempts integer not null default 0 check (attempts >= 0),
  max_attempts integer not null default 3 check (max_attempts between 1 and 20),
  locked_by text,
  lease_expires_at timestamptz,
  next_run_at timestamptz not null default now(),
  progress integer check (progress between 0 and 100),
  input_reference jsonb not null default '{}'::jsonb,
  output_reference jsonb,
  error_details jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workflow_jobs_claim_idx on public.workflow_jobs (kind, status, next_run_at);
create index workflow_jobs_project_idx on public.workflow_jobs (project_id, created_at desc);
create index workflow_jobs_attention_idx on public.workflow_jobs (status) where status in ('failed', 'needs_attention');
create trigger workflow_jobs_updated_at before update on public.workflow_jobs
  for each row execute function private.set_updated_at();

create table public.workflow_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.content_projects (id) on delete restrict,
  workflow_job_id uuid references public.workflow_jobs (id) on delete restrict,
  event_type text not null check (event_type ~ '^[a-z][a-z0-9_.]*$'),
  event_data jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index workflow_events_project_idx on public.workflow_events (project_id, created_at);
create index workflow_events_job_idx on public.workflow_events (workflow_job_id);
create trigger workflow_events_insert_only before update or delete on public.workflow_events
  for each row execute function private.forbid_mutation();

create table public.idempotency_keys (
  scope text not null,
  key text not null check (length(key) between 1 and 255),
  user_id uuid references auth.users (id) on delete cascade,
  request_hash text not null,
  status_code integer,
  response jsonb,
  created_at timestamptz not null default now(),
  primary key (scope, key)
);
create index idempotency_keys_created_idx on public.idempotency_keys (created_at);

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create or replace function public.log_event(
  p_project_id uuid,
  p_event_type text,
  p_event_data jsonb default '{}'::jsonb,
  p_actor_id uuid default null,
  p_job_id uuid default null
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  insert into public.workflow_events (project_id, workflow_job_id, event_type, event_data, actor_id)
  values (p_project_id, p_job_id, p_event_type, coalesce(p_event_data, '{}'::jsonb), p_actor_id)
  returning id;
$$;

-- ---------------------------------------------------------------------------
-- transition_project: the only way to change content_projects.status
-- ---------------------------------------------------------------------------
create or replace function public.transition_project(
  p_project_id uuid,
  p_to public.project_status,
  p_actor_id uuid default null,
  p_event_data jsonb default '{}'::jsonb,
  p_expected_from public.project_status default null,
  p_job_id uuid default null
)
returns public.content_projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  from_status public.project_status;
  trig text;
begin
  select * into proj from public.content_projects where id = p_project_id for update;
  if not found then
    raise exception 'project % not found', p_project_id using errcode = 'no_data_found';
  end if;

  if p_expected_from is not null and proj.status <> p_expected_from then
    raise exception 'invalid_transition: project % is %, expected %', p_project_id, proj.status, p_expected_from
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;

  select t.trigger_description into trig
  from public.project_status_transitions t
  where t.from_status = proj.status and t.to_status = p_to;
  if not found then
    raise exception 'invalid_transition: % -> % is not allowed', proj.status, p_to
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;

  -- Admin retry may only return to the status the project failed in.
  if proj.status = 'failed' and p_to <> 'cancelled'
     and proj.failed_from_status is not null and p_to <> proj.failed_from_status then
    raise exception 'invalid_transition: failed project can only be retried into %', proj.failed_from_status
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;

  from_status := proj.status;
  perform set_config('cc.in_transition', 'on', true);
  update public.content_projects
  set status = p_to,
      current_stage = coalesce(public.stage_for_status(p_to), proj.current_stage),
      failed_from_status = case
        when p_to = 'failed' then proj.status
        when proj.status = 'failed' then null
        else proj.failed_from_status
      end
  where id = p_project_id
  returning * into proj;
  perform set_config('cc.in_transition', 'off', true);

  perform public.log_event(
    p_project_id,
    'status.changed',
    coalesce(p_event_data, '{}'::jsonb)
      || jsonb_build_object('from', from_status, 'to', p_to, 'trigger', trig),
    p_actor_id,
    p_job_id
  );
  return proj;
end;
$$;

-- ---------------------------------------------------------------------------
-- Job queue
-- ---------------------------------------------------------------------------

-- Insert a job, or return the existing one for the same idempotency key.
create or replace function public.create_job(
  p_project_id uuid,
  p_stage public.pipeline_stage,
  p_kind public.job_kind,
  p_idempotency_key text,
  p_input jsonb default '{}'::jsonb,
  p_actor_id uuid default null,
  p_max_attempts integer default 3,
  p_run_at timestamptz default now()
)
returns public.workflow_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.workflow_jobs;
begin
  insert into public.workflow_jobs (project_id, stage, kind, idempotency_key, input_reference, created_by, max_attempts, next_run_at)
  values (p_project_id, p_stage, p_kind, p_idempotency_key, coalesce(p_input, '{}'::jsonb), p_actor_id, p_max_attempts, p_run_at)
  on conflict (idempotency_key) do nothing
  returning * into job;

  if found then
    perform public.log_event(p_project_id, 'job.created',
      jsonb_build_object('stage', p_stage, 'kind', p_kind), p_actor_id, job.id);
  else
    select * into job from public.workflow_jobs where idempotency_key = p_idempotency_key;
  end if;
  return job;
end;
$$;

-- Claim the next runnable job of a kind. FOR UPDATE SKIP LOCKED guarantees two
-- workers never receive the same job. Jobs whose lease expired are reclaimed
-- while they still have attempts left.
create or replace function public.claim_job(
  p_kind public.job_kind,
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns setof public.workflow_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  job_id uuid;
begin
  select j.id into job_id
  from public.workflow_jobs j
  where j.kind = p_kind
    and (
      (j.status = 'queued' and j.next_run_at <= now())
      or (j.status = 'running' and j.lease_expires_at < now() and j.attempts < j.max_attempts)
    )
  order by j.next_run_at, j.created_at
  for update skip locked
  limit 1;

  if job_id is null then
    return;
  end if;

  return query
  update public.workflow_jobs j
  set status = 'running',
      locked_by = p_worker_id,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      attempts = j.attempts + 1,
      started_at = coalesce(j.started_at, now())
  where j.id = job_id
  returning j.*;

  perform public.log_event((select project_id from public.workflow_jobs where id = job_id),
    'job.claimed', jsonb_build_object('worker', p_worker_id), null, job_id);
end;
$$;

-- Extend the lease. Returns false when the worker no longer owns the job
-- (cancelled, reclaimed, finished) so it can stop work.
create or replace function public.heartbeat_job(
  p_job_id uuid,
  p_worker_id text,
  p_progress integer default null,
  p_lease_seconds integer default 300
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.workflow_jobs
  set lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      progress = coalesce(p_progress, progress)
  where id = p_job_id and status = 'running' and locked_by = p_worker_id;
  return found;
end;
$$;

create or replace function public.complete_job(
  p_job_id uuid,
  p_output jsonb default '{}'::jsonb,
  p_worker_id text default null
)
returns public.workflow_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.workflow_jobs;
begin
  select * into job from public.workflow_jobs where id = p_job_id for update;
  if not found then
    raise exception 'job % not found', p_job_id using errcode = 'no_data_found';
  end if;
  if job.status = 'succeeded' then
    return job; -- idempotent
  end if;
  if job.status not in ('queued', 'running') then
    raise exception 'job % is %, cannot complete', p_job_id, job.status using errcode = 'P0001', hint = 'invalid_job_state';
  end if;
  if p_worker_id is not null and job.locked_by is distinct from p_worker_id then
    raise exception 'job % is locked by another worker', p_job_id using errcode = 'P0001', hint = 'lease_lost';
  end if;

  update public.workflow_jobs
  set status = 'succeeded', output_reference = coalesce(p_output, '{}'::jsonb), progress = 100,
      completed_at = now(), lease_expires_at = null, error_details = null
  where id = p_job_id
  returning * into job;

  perform public.log_event(job.project_id, 'job.succeeded', jsonb_build_object('stage', job.stage), null, job.id);
  return job;
end;
$$;

-- Backoff for retryable failures: 1 min, 5 min, 25 min, ... (capped at 6 h).
create or replace function public.job_backoff(p_attempts integer)
returns interval
language sql
immutable
set search_path = ''
as $$
  select make_interval(secs => least(60 * power(5, greatest(p_attempts, 1) - 1), 21600));
$$;

create or replace function public.fail_job(
  p_job_id uuid,
  p_error jsonb,
  p_retryable boolean default true,
  p_worker_id text default null
)
returns public.workflow_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.workflow_jobs;
  proj_status public.project_status;
begin
  select * into job from public.workflow_jobs where id = p_job_id for update;
  if not found then
    raise exception 'job % not found', p_job_id using errcode = 'no_data_found';
  end if;
  if job.status in ('succeeded', 'cancelled', 'needs_attention') then
    return job; -- terminal; ignore late failures
  end if;
  if p_worker_id is not null and job.locked_by is distinct from p_worker_id then
    raise exception 'job % is locked by another worker', p_job_id using errcode = 'P0001', hint = 'lease_lost';
  end if;

  if p_retryable and job.attempts < job.max_attempts then
    update public.workflow_jobs
    set status = 'queued', error_details = p_error, locked_by = null, lease_expires_at = null,
        next_run_at = now() + public.job_backoff(job.attempts)
    where id = p_job_id
    returning * into job;
    perform public.log_event(job.project_id, 'job.retry_scheduled',
      jsonb_build_object('attempts', job.attempts, 'next_run_at', job.next_run_at, 'error', p_error), null, job.id);
  else
    update public.workflow_jobs
    set status = 'needs_attention', error_details = p_error, locked_by = null, lease_expires_at = null,
        completed_at = now()
    where id = p_job_id
    returning * into job;
    perform public.log_event(job.project_id, 'job.needs_attention',
      jsonb_build_object('attempts', job.attempts, 'retryable', p_retryable, 'error', p_error), null, job.id);

    if job.project_id is not null then
      select status into proj_status from public.content_projects where id = job.project_id;
      if proj_status not in ('failed', 'published', 'cancelled') then
        perform public.transition_project(job.project_id, 'failed', null,
          jsonb_build_object('job_id', job.id, 'stage', job.stage), null, job.id);
      end if;
    end if;
  end if;
  return job;
end;
$$;

create or replace function public.cancel_job(p_job_id uuid, p_actor_id uuid default null)
returns public.workflow_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.workflow_jobs;
begin
  update public.workflow_jobs
  set status = 'cancelled', completed_at = now(), lease_expires_at = null
  where id = p_job_id and status in ('queued', 'running', 'failed', 'needs_attention')
  returning * into job;
  if found then
    perform public.log_event(job.project_id, 'job.cancelled', '{}'::jsonb, p_actor_id, job.id);
  else
    select * into job from public.workflow_jobs where id = p_job_id;
  end if;
  return job;
end;
$$;

-- Manual retry of a job that needs attention (admin action from the monitor).
create or replace function public.retry_job(p_job_id uuid, p_actor_id uuid default null)
returns public.workflow_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.workflow_jobs;
  proj public.content_projects;
begin
  update public.workflow_jobs
  set status = 'queued', attempts = 0, next_run_at = now(), locked_by = null,
      lease_expires_at = null, completed_at = null
  where id = p_job_id and status in ('needs_attention', 'failed', 'cancelled')
  returning * into job;
  if not found then
    raise exception 'job % cannot be retried in its current state', p_job_id using errcode = 'P0001', hint = 'invalid_job_state';
  end if;
  perform public.log_event(job.project_id, 'job.retried', '{}'::jsonb, p_actor_id, job.id);

  if job.project_id is not null then
    select * into proj from public.content_projects where id = job.project_id;
    if proj.status = 'failed' and proj.failed_from_status is not null then
      perform public.transition_project(job.project_id, proj.failed_from_status, p_actor_id,
        jsonb_build_object('job_id', job.id), 'failed', job.id);
    end if;
  end if;
  return job;
end;
$$;

-- Workflow R: reclaim expired leases and escalate exhausted jobs.
create or replace function public.recover_jobs()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  requeued integer := 0;
  escalated integer := 0;
  j record;
begin
  for j in
    select id, attempts, max_attempts from public.workflow_jobs
    where status = 'running' and lease_expires_at < now()
    for update skip locked
  loop
    if j.attempts >= j.max_attempts then
      perform public.fail_job(j.id, jsonb_build_object('code', 'lease_expired', 'message', 'worker lease expired'), false);
      escalated := escalated + 1;
    else
      update public.workflow_jobs
      set status = 'queued', locked_by = null, lease_expires_at = null, next_run_at = now()
      where id = j.id;
      perform public.log_event((select project_id from public.workflow_jobs where id = j.id),
        'job.lease_expired', '{}'::jsonb, null, j.id);
      requeued := requeued + 1;
    end if;
  end loop;
  return jsonb_build_object('requeued', requeued, 'escalated', escalated);
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges: queue/state RPCs are server-side only (Edge Functions, n8n, workers).
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.log_event(uuid, text, jsonb, uuid, uuid)',
    'public.transition_project(uuid, public.project_status, uuid, jsonb, public.project_status, uuid)',
    'public.create_job(uuid, public.pipeline_stage, public.job_kind, text, jsonb, uuid, integer, timestamptz)',
    'public.claim_job(public.job_kind, text, integer)',
    'public.heartbeat_job(uuid, text, integer, integer)',
    'public.complete_job(uuid, jsonb, text)',
    'public.fail_job(uuid, jsonb, boolean, text)',
    'public.cancel_job(uuid, uuid)',
    'public.retry_job(uuid, uuid)',
    'public.recover_jobs()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.workflow_jobs enable row level security;
alter table public.workflow_events enable row level security;
alter table public.idempotency_keys enable row level security;

create policy jobs_select on public.workflow_jobs for select to authenticated
  using (project_id is not null and private.can_access_project(project_id));
revoke insert, update, delete on public.workflow_jobs from authenticated;

create policy events_select on public.workflow_events for select to authenticated
  using (project_id is not null and private.can_access_project(project_id));
revoke insert, update, delete on public.workflow_events from authenticated;

-- idempotency_keys: service role only (no policies for authenticated).
revoke all on public.idempotency_keys from authenticated;
