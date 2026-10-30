-- P2-T04: stage RPCs for analysis → configuration approval → brief → script → script approval.
-- Each save_* function also completes its job in the same transaction, so a
-- replayed job can never write a second version.

alter table public.approvals drop constraint approvals_artifact_type_check;
alter table public.approvals add constraint approvals_artifact_type_check
  check (artifact_type in ('questionnaire_answers', 'script', 'creative_version', 'media_manifest', 'publishing_job'));

alter table public.questionnaire_answers add column content_hash text check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$');
alter table public.questionnaire_answers add constraint questionnaire_answers_submitted_hash
  check (is_draft or content_hash is not null) not valid;

-- Stage outputs keep the model and prompt that produced them.
alter table public.content_briefs add column model text, add column prompt_version text;
alter table public.scripts add column model text, add column prompt_version text;

-- ---------------------------------------------------------------------------
-- Helpers
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
  return proj;
end;
$$;

create or replace function private.lock_project(p_project_id uuid, p_expected public.project_status[])
returns public.content_projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
begin
  select * into proj from public.content_projects where id = p_project_id for update;
  if not found then
    raise exception 'not_found: project %', p_project_id using errcode = 'P0001', hint = 'not_found';
  end if;
  if not (proj.status = any (p_expected)) then
    raise exception 'invalid_transition: project % is %, expected one of %', p_project_id, proj.status, p_expected
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  return proj;
end;
$$;

-- ---------------------------------------------------------------------------
-- start_job: claim one specific job (n8n delivers job ids). Returns null when
-- the job is not runnable (finished, cancelled, leased by someone else, or
-- waiting for its backoff) — callers treat that as "nothing to do".
-- ---------------------------------------------------------------------------
create or replace function public.start_job(p_job_id uuid, p_worker_id text, p_lease_seconds integer default 600)
returns public.workflow_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.workflow_jobs;
begin
  update public.workflow_jobs j
  set status = 'running', locked_by = p_worker_id, attempts = j.attempts + 1,
      lease_expires_at = now() + make_interval(secs => p_lease_seconds), started_at = coalesce(j.started_at, now())
  where j.id = p_job_id
    and ((j.status = 'queued' and j.next_run_at <= now())
      or (j.status = 'running' and j.lease_expires_at < now() and j.attempts < j.max_attempts))
  returning * into job;
  if found then
    perform public.log_event(job.project_id, 'job.claimed', jsonb_build_object('worker', p_worker_id, 'stage', job.stage), null, job.id);
    return job;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Outdated cascade (docs/WORKFLOW.md §5)
-- ---------------------------------------------------------------------------
create or replace function public.mark_downstream_outdated(p_project_id uuid, p_from text, p_actor_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  j record;
begin
  if p_from = 'answers' then
    update public.content_briefs set status = 'superseded' where project_id = p_project_id and status = 'current';
    update public.scripts set status = 'superseded'
      where project_id = p_project_id and status in ('in_review', 'changes_requested', 'approved');
  end if;
  if p_from in ('answers', 'script') then
    update public.creative_versions set status = 'superseded'
      where project_id = p_project_id and status in ('in_review', 'changes_requested', 'approved');
    update public.creative_versions set status = 'failed' where project_id = p_project_id and status = 'generating';
    update public.render_jobs set status = 'outdated' where project_id = p_project_id and status not in ('outdated', 'cancelled');
    update public.media_assets set status = 'outdated' where project_id = p_project_id and status <> 'outdated';
  end if;
  -- Work queued for the old inputs must not run.
  for j in
    select id from public.workflow_jobs
    where project_id = p_project_id and status in ('queued', 'running', 'failed')
      and stage in ('brief', 'script', 'creative', 'render', 'publish')
  loop
    perform public.cancel_job(j.id, p_actor_id);
  end loop;
  perform public.log_event(p_project_id, 'artifacts.outdated', jsonb_build_object('from', p_from), p_actor_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Analysis → configuration proposal
-- ---------------------------------------------------------------------------
create or replace function public.request_analysis(p_project_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  job public.workflow_jobs;
  n integer;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  if proj.status = 'failed' and proj.failed_from_status in ('new', 'analyzing') then
    select * into job from public.workflow_jobs
    where project_id = p_project_id and stage = 'analysis' and status = 'needs_attention'
    order by created_at desc limit 1;
    if found then
      job := public.retry_job(job.id, p_actor_id);
      return jsonb_build_object('job_id', job.id, 'status', (select status from public.content_projects where id = p_project_id), 'retried', true);
    end if;
  end if;
  if proj.status not in ('new', 'awaiting_answers') then
    raise exception 'invalid_transition: analysis can be requested for new projects or before the configuration is approved (project is %)', proj.status
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  select count(*) + 1 into n from public.workflow_jobs where project_id = p_project_id and stage = 'analysis';
  job := public.create_job(p_project_id, 'analysis', 'n8n', 'analysis:' || p_project_id || ':' || n,
                           jsonb_build_object('project_id', p_project_id), p_actor_id);
  perform public.transition_project(p_project_id, 'analyzing', p_actor_id, '{}'::jsonb, proj.status, job.id);
  return jsonb_build_object('job_id', job.id, 'status', 'analyzing', 'retried', false);
end;
$$;

create or replace function public.save_analysis(
  p_job_id uuid,
  p_project_id uuid,
  p_analysis jsonb,
  p_questionnaire jsonb,
  p_model text,
  p_prompt_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  a_id uuid;
  q_id uuid;
  a_version integer;
  q_version integer;
begin
  proj := private.lock_project(p_project_id, array['analyzing']::public.project_status[]);
  select coalesce(max(version), 0) + 1 into a_version from public.project_analyses where project_id = p_project_id;
  insert into public.project_analyses (project_id, version, analysis, model, prompt_version)
  values (p_project_id, a_version, p_analysis, p_model, p_prompt_version)
  returning id into a_id;

  update public.questionnaires set status = 'superseded'
  where project_id = p_project_id and status in ('awaiting_answers', 'answered');
  delete from public.questionnaire_answers a
  using public.questionnaires q
  where a.questionnaire_id = q.id and q.project_id = p_project_id and a.is_draft;

  select coalesce(max(version), 0) + 1 into q_version from public.questionnaires where project_id = p_project_id;
  insert into public.questionnaires (project_id, version, kind, questions, status, analysis_id)
  values (p_project_id, q_version, 'initial', p_questionnaire, 'awaiting_answers', a_id)
  returning id into q_id;

  -- Fill descriptive fields the submitter left empty (shown in the inbox).
  update public.content_projects
  set content_type = coalesce(content_type, nullif(p_analysis ->> 'proposed_format', '')::public.content_type),
      objective = coalesce(objective, p_analysis ->> 'objective'),
      language = coalesce(language, p_analysis ->> 'language')
  where id = p_project_id;

  perform public.transition_project(p_project_id, 'awaiting_answers', null,
    jsonb_build_object('questionnaire_id', q_id, 'analysis_id', a_id), 'analyzing', p_job_id);
  perform public.complete_job(p_job_id, jsonb_build_object('analysis_id', a_id, 'questionnaire_id', q_id));
  return jsonb_build_object('analysis_id', a_id, 'questionnaire_id', q_id, 'questionnaire_version', q_version);
end;
$$;

-- ---------------------------------------------------------------------------
-- Configuration review: drafts and approval
-- ---------------------------------------------------------------------------
create or replace function public.save_answers_draft(p_project_id uuid, p_questionnaire_id uuid, p_answers jsonb, p_actor_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  q public.questionnaires;
  draft_id uuid;
begin
  perform private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  select * into q from public.questionnaires where id = p_questionnaire_id and project_id = p_project_id;
  if not found or q.status = 'superseded' then
    raise exception 'invalid_transition: questionnaire is not open' using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  insert into public.questionnaire_answers (project_id, questionnaire_id, answers, is_draft, submitted_by)
  values (p_project_id, p_questionnaire_id, p_answers, true, p_actor_id)
  on conflict (questionnaire_id) where is_draft do update set answers = excluded.answers, submitted_by = excluded.submitted_by
  returning id into draft_id;
  return draft_id;
end;
$$;

create or replace function public.submit_answers(
  p_project_id uuid,
  p_questionnaire_id uuid,
  p_answers jsonb,
  p_content_hash text,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  q public.questionnaires;
  latest_version integer;
  ans_id uuid;
  appr_id uuid;
  job public.workflow_jobs;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  select * into q from public.questionnaires where id = p_questionnaire_id and project_id = p_project_id;
  if not found or q.status = 'superseded' then
    raise exception 'invalid_transition: questionnaire is not open' using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  select max(version) into latest_version from public.questionnaires where project_id = p_project_id and kind = q.kind;
  if q.version <> latest_version then
    raise exception 'invalid_transition: a newer questionnaire exists' using errcode = 'P0001', hint = 'invalid_transition';
  end if;

  if q.kind = 'clarification' then
    if proj.status <> 'needs_clarification' then
      raise exception 'invalid_transition: no clarification is pending (project is %)', proj.status
        using errcode = 'P0001', hint = 'invalid_transition';
    end if;
  elsif proj.status <> 'awaiting_answers' then
    -- Editing an already approved configuration: everything built on it becomes outdated.
    if proj.status not in ('validating_answers', 'needs_clarification', 'generating_script', 'script_in_review',
                           'generating_creative', 'creative_in_review', 'rendering', 'media_in_review') then
      raise exception 'invalid_transition: the configuration can no longer be changed (project is %)', proj.status
        using errcode = 'P0001', hint = 'invalid_transition';
    end if;
    perform public.transition_project(p_project_id, 'awaiting_answers', p_actor_id,
      jsonb_build_object('reason', 'configuration resubmitted'), proj.status);
    perform public.mark_downstream_outdated(p_project_id, 'answers', p_actor_id);
    -- Clarification rounds belonged to the old configuration.
    update public.questionnaires set status = 'superseded' where project_id = p_project_id and kind = 'clarification';
  end if;

  delete from public.questionnaire_answers where questionnaire_id = p_questionnaire_id and is_draft;
  update public.questionnaire_answers set status = 'superseded'
  where questionnaire_id = p_questionnaire_id and not is_draft and status = 'current';
  insert into public.questionnaire_answers (project_id, questionnaire_id, answers, is_draft, submitted_by, submitted_at, content_hash)
  values (p_project_id, p_questionnaire_id, p_answers, false, p_actor_id, now(), p_content_hash)
  returning id into ans_id;
  update public.questionnaires set status = 'answered' where id = p_questionnaire_id;

  insert into public.approvals (project_id, stage, artifact_type, artifact_id, artifact_version, artifact_hash, decision, reviewer_id)
  values (p_project_id, 'config', 'questionnaire_answers', ans_id, q.version, p_content_hash, 'approved', p_actor_id)
  returning id into appr_id;

  job := public.create_job(p_project_id, 'brief', 'n8n', 'brief:' || ans_id, jsonb_build_object('answers_id', ans_id), p_actor_id);
  perform public.transition_project(p_project_id, 'validating_answers', p_actor_id,
    jsonb_build_object('answers_id', ans_id, 'approval_id', appr_id, 'kind', q.kind),
    (select status from public.content_projects where id = p_project_id), job.id);
  return jsonb_build_object('answers_id', ans_id, 'approval_id', appr_id, 'job_id', job.id, 'status', 'validating_answers');
end;
$$;

-- ---------------------------------------------------------------------------
-- Brief (or a clarification round)
-- ---------------------------------------------------------------------------
create or replace function public.save_brief(
  p_job_id uuid,
  p_project_id uuid,
  p_answers_id uuid,
  p_brief jsonb,
  p_content_hash text,
  p_validation_status text,
  p_details jsonb,
  p_clarification jsonb,
  p_model text,
  p_prompt_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  b_id uuid;
  b_version integer;
  q_id uuid;
  q_version integer;
  job public.workflow_jobs;
begin
  perform private.lock_project(p_project_id, array['validating_answers']::public.project_status[]);
  update public.content_briefs set status = 'superseded' where project_id = p_project_id and status = 'current';
  select coalesce(max(version), 0) + 1 into b_version from public.content_briefs where project_id = p_project_id;
  insert into public.content_briefs (project_id, answers_id, version, brief, content_hash, validation_status, validation_details, model, prompt_version)
  values (p_project_id, p_answers_id, b_version, coalesce(p_brief, '{}'::jsonb), p_content_hash, p_validation_status, p_details, p_model, p_prompt_version)
  returning id into b_id;

  if p_validation_status = 'valid' then
    job := public.create_job(p_project_id, 'script', 'n8n', 'script:' || b_id, jsonb_build_object('brief_id', b_id));
    perform public.transition_project(p_project_id, 'generating_script', null, jsonb_build_object('brief_id', b_id), 'validating_answers', p_job_id);
    perform public.complete_job(p_job_id, jsonb_build_object('brief_id', b_id, 'next_job_id', job.id));
    return jsonb_build_object('brief_id', b_id, 'next_job_id', job.id, 'status', 'generating_script');
  elsif p_validation_status = 'needs_clarification' and p_clarification is not null then
    select coalesce(max(version), 0) + 1 into q_version from public.questionnaires where project_id = p_project_id;
    insert into public.questionnaires (project_id, version, kind, questions, status)
    values (p_project_id, q_version, 'clarification', p_clarification, 'awaiting_answers')
    returning id into q_id;
    perform public.transition_project(p_project_id, 'needs_clarification', null,
      jsonb_build_object('brief_id', b_id, 'questionnaire_id', q_id), 'validating_answers', p_job_id);
    perform public.complete_job(p_job_id, jsonb_build_object('brief_id', b_id, 'questionnaire_id', q_id));
    return jsonb_build_object('brief_id', b_id, 'questionnaire_id', q_id, 'status', 'needs_clarification');
  end if;
  raise exception 'validation_failed: brief status % needs %', p_validation_status,
    case when p_validation_status = 'needs_clarification' then 'clarification questions' else 'a valid brief' end
    using errcode = 'P0001', hint = 'validation_failed';
end;
$$;

-- ---------------------------------------------------------------------------
-- Scripts
-- ---------------------------------------------------------------------------
create or replace function public.save_script(
  p_job_id uuid,
  p_project_id uuid,
  p_brief_id uuid,
  p_content jsonb,
  p_content_hash text,
  p_origin text,
  p_parent_script_id uuid,
  p_actor_id uuid,
  p_model text,
  p_prompt_version text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  parent public.scripts;
  s_id uuid;
  s_version integer;
begin
  if p_origin = 'manual_edit' then
    proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
    if proj.status <> 'script_in_review' then
      raise exception 'invalid_transition: scripts can be edited while in review (project is %)', proj.status
        using errcode = 'P0001', hint = 'invalid_transition';
    end if;
    select * into parent from public.scripts where id = p_parent_script_id and project_id = p_project_id;
    if not found or parent.status <> 'in_review' then
      raise exception 'invalid_transition: only the script version in review can be edited' using errcode = 'P0001', hint = 'invalid_transition';
    end if;
  else
    proj := private.lock_project(p_project_id, array['generating_script']::public.project_status[]);
  end if;

  update public.scripts set status = 'superseded'
  where project_id = p_project_id and status in ('in_review', 'changes_requested');
  select coalesce(max(version), 0) + 1 into s_version from public.scripts where project_id = p_project_id;
  insert into public.scripts (project_id, brief_id, parent_script_id, version, content, content_hash, origin, status, created_by, model, prompt_version)
  values (p_project_id, p_brief_id, p_parent_script_id, s_version, p_content, p_content_hash, p_origin, 'in_review', p_actor_id, p_model, p_prompt_version)
  returning id into s_id;

  perform public.transition_project(p_project_id, 'script_in_review', p_actor_id,
    jsonb_build_object('script_id', s_id, 'version', s_version, 'origin', p_origin), proj.status, p_job_id);
  if p_job_id is not null then
    perform public.complete_job(p_job_id, jsonb_build_object('script_id', s_id, 'version', s_version));
  end if;
  return jsonb_build_object('script_id', s_id, 'version', s_version, 'status', 'script_in_review');
end;
$$;

create or replace function public.request_script_regeneration(p_project_id uuid, p_actor_id uuid, p_instructions text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  s public.scripts;
  job public.workflow_jobs;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  if proj.status <> 'script_in_review' then
    raise exception 'invalid_transition: project is %', proj.status using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  select * into s from public.scripts where project_id = p_project_id and status = 'in_review' order by version desc limit 1;
  job := public.create_job(p_project_id, 'script', 'n8n', 'script-regen:' || s.id || ':' || gen_random_uuid(),
    jsonb_build_object('brief_id', s.brief_id, 'base_script_id', s.id, 'instructions', p_instructions), p_actor_id);
  update public.scripts set status = 'changes_requested' where id = s.id;
  perform public.transition_project(p_project_id, 'generating_script', p_actor_id,
    jsonb_build_object('base_script_id', s.id, 'regenerate', true), 'script_in_review', job.id);
  return jsonb_build_object('job_id', job.id, 'status', 'generating_script');
end;
$$;

-- ---------------------------------------------------------------------------
-- Approvals (docs/WORKFLOW.md §5). Phase 2 handles scripts; creative and media
-- approvals arrive with their phases.
-- ---------------------------------------------------------------------------
create or replace function public.record_approval(
  p_actor_id uuid,
  p_artifact_type text,
  p_artifact_id uuid,
  p_artifact_version integer,
  p_artifact_hash text,
  p_decision public.approval_decision,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.scripts;
  proj public.content_projects;
  appr_id uuid;
  job public.workflow_jobs;
  new_status public.project_status;
begin
  if p_artifact_type <> 'script' then
    raise exception 'validation_failed: approvals for % are not available yet', p_artifact_type
      using errcode = 'P0001', hint = 'validation_failed';
  end if;
  select * into s from public.scripts where id = p_artifact_id for update;
  if not found then
    raise exception 'not_found: script %', p_artifact_id using errcode = 'P0001', hint = 'not_found';
  end if;
  proj := private.require_role(s.project_id, p_actor_id, array['admin', 'editor', 'reviewer']::public.member_role[]);
  if s.version <> p_artifact_version or s.content_hash <> p_artifact_hash then
    raise exception 'hash_mismatch: script % changed (version %, hash %)', s.id, s.version, s.content_hash
      using errcode = 'P0001', hint = 'hash_mismatch';
  end if;
  if s.status <> 'in_review' or proj.status <> 'script_in_review' then
    raise exception 'invalid_transition: script v% is %, project is %', s.version, s.status, proj.status
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  if p_decision = 'changes_requested' and coalesce(trim(p_comment), '') = '' then
    raise exception 'validation_failed: describe the changes you want' using errcode = 'P0001', hint = 'validation_failed';
  end if;

  insert into public.approvals (project_id, stage, artifact_type, artifact_id, artifact_version, artifact_hash, decision, comment, reviewer_id)
  values (s.project_id, 'script', 'script', s.id, s.version, s.content_hash, p_decision, nullif(trim(p_comment), ''), p_actor_id)
  returning id into appr_id;

  if p_decision = 'approved' then
    update public.scripts set status = 'approved' where id = s.id;
    job := public.create_job(s.project_id, 'creative', 'n8n', 'creative:' || s.id, jsonb_build_object('script_id', s.id), p_actor_id);
    new_status := 'generating_creative';
  elsif p_decision = 'changes_requested' then
    update public.scripts set status = 'changes_requested' where id = s.id;
    job := public.create_job(s.project_id, 'script', 'n8n', 'script-revision:' || appr_id,
      jsonb_build_object('brief_id', s.brief_id, 'base_script_id', s.id, 'approval_id', appr_id), p_actor_id);
    new_status := 'generating_script';
  else
    update public.scripts set status = 'rejected' where id = s.id;
    new_status := 'cancelled';
  end if;
  perform public.transition_project(s.project_id, new_status, p_actor_id,
    jsonb_build_object('approval_id', appr_id, 'decision', p_decision, 'script_version', s.version), 'script_in_review', job.id);
  return jsonb_build_object('approval_id', appr_id, 'status', new_status, 'next_job_id', job.id);
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges: service role only (the API verifies the user and passes p_actor_id).
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.start_job(uuid, text, integer)',
    'public.mark_downstream_outdated(uuid, text, uuid)',
    'public.request_analysis(uuid, uuid)',
    'public.save_analysis(uuid, uuid, jsonb, jsonb, text, text)',
    'public.save_answers_draft(uuid, uuid, jsonb, uuid)',
    'public.submit_answers(uuid, uuid, jsonb, text, uuid)',
    'public.save_brief(uuid, uuid, uuid, jsonb, text, text, jsonb, jsonb, text, text)',
    'public.save_script(uuid, uuid, uuid, jsonb, text, text, uuid, uuid, text, text)',
    'public.request_script_regeneration(uuid, uuid, text)',
    'public.record_approval(uuid, text, uuid, integer, text, public.approval_decision, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;
revoke all on function private.require_role(uuid, uuid, public.member_role[]) from public;
revoke all on function private.lock_project(uuid, public.project_status[]) from public;
