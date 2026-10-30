-- P3-T04 (ADR-0007): creative versions from the worker, and creative approvals.
-- record_approval is redefined to (a) queue creative work for the creative
-- worker instead of n8n and (b) handle creative versions.

-- Creative versions record which job produced them and the validation report.
alter table public.creative_versions add column workflow_job_id uuid references public.workflow_jobs (id) on delete restrict;
alter table public.creative_versions add column generator text check (generator in ('template', 'claude-code'));

create or replace function public.save_creative_version(
  p_job_id uuid,
  p_project_id uuid,
  p_script_id uuid,
  p_version integer,
  p_brand_settings_version integer,
  p_repository_url text,
  p_commit_sha text,
  p_source_path text,
  p_preview_path text,
  p_configuration jsonb,
  p_content_hash text,
  p_revision_notes text,
  p_generator text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cv_id uuid;
begin
  perform private.lock_project(p_project_id, array['generating_creative']::public.project_status[]);
  if not exists (select 1 from public.scripts where id = p_script_id and project_id = p_project_id and status = 'approved') then
    raise exception 'approval_required: creative source needs the approved script' using errcode = 'P0001', hint = 'approval_required';
  end if;
  update public.creative_versions set status = 'superseded'
  where project_id = p_project_id and status in ('in_review', 'changes_requested');
  insert into public.creative_versions (
    project_id, script_id, brand_settings_version, version, repository_url, commit_sha, source_path, preview_path,
    configuration, content_hash, revision_notes, status, workflow_job_id, generator
  ) values (
    p_project_id, p_script_id, p_brand_settings_version, p_version, p_repository_url, p_commit_sha, p_source_path, p_preview_path,
    coalesce(p_configuration, '{}'::jsonb), p_content_hash, p_revision_notes, 'in_review', p_job_id, p_generator
  )
  returning id into cv_id;
  perform public.transition_project(p_project_id, 'creative_in_review', null,
    jsonb_build_object('creative_version_id', cv_id, 'version', p_version, 'commit_sha', p_commit_sha), 'generating_creative', p_job_id);
  perform public.complete_job(p_job_id, jsonb_build_object('creative_version_id', cv_id, 'version', p_version, 'commit_sha', p_commit_sha));
  return jsonb_build_object('creative_version_id', cv_id, 'version', p_version, 'status', 'creative_in_review');
end;
$$;

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
  cv public.creative_versions;
  proj public.content_projects;
  appr_id uuid;
  job public.workflow_jobs;
  new_status public.project_status;
begin
  if p_decision = 'changes_requested' and coalesce(trim(p_comment), '') = '' then
    raise exception 'validation_failed: describe the changes you want' using errcode = 'P0001', hint = 'validation_failed';
  end if;

  if p_artifact_type = 'script' then
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
    insert into public.approvals (project_id, stage, artifact_type, artifact_id, artifact_version, artifact_hash, decision, comment, reviewer_id)
    values (s.project_id, 'script', 'script', s.id, s.version, s.content_hash, p_decision, nullif(trim(p_comment), ''), p_actor_id)
    returning id into appr_id;

    if p_decision = 'approved' then
      update public.scripts set status = 'approved' where id = s.id;
      job := public.create_job(s.project_id, 'creative', 'creative_worker', 'creative:' || s.id,
        jsonb_build_object('script_id', s.id), p_actor_id);
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
  end if;

  if p_artifact_type = 'creative_version' then
    select * into cv from public.creative_versions where id = p_artifact_id for update;
    if not found then
      raise exception 'not_found: creative version %', p_artifact_id using errcode = 'P0001', hint = 'not_found';
    end if;
    proj := private.require_role(cv.project_id, p_actor_id, array['admin', 'editor', 'reviewer']::public.member_role[]);
    if cv.version <> p_artifact_version or cv.content_hash is distinct from p_artifact_hash then
      raise exception 'hash_mismatch: creative % changed (version %, hash %)', cv.id, cv.version, cv.content_hash
        using errcode = 'P0001', hint = 'hash_mismatch';
    end if;
    if cv.status <> 'in_review' or proj.status <> 'creative_in_review' then
      raise exception 'invalid_transition: creative v% is %, project is %', cv.version, cv.status, proj.status
        using errcode = 'P0001', hint = 'invalid_transition';
    end if;
    insert into public.approvals (project_id, stage, artifact_type, artifact_id, artifact_version, artifact_hash, decision, comment, reviewer_id)
    values (cv.project_id, 'creative', 'creative_version', cv.id, cv.version, cv.content_hash, p_decision, nullif(trim(p_comment), ''), p_actor_id)
    returning id into appr_id;

    if p_decision = 'approved' then
      update public.creative_versions set status = 'approved' where id = cv.id;
      -- Phase 4's render worker picks this up.
      job := public.create_job(cv.project_id, 'render', 'render_worker', 'render:' || cv.id,
        jsonb_build_object('creative_version_id', cv.id), p_actor_id);
      new_status := 'rendering';
    elsif p_decision = 'changes_requested' then
      update public.creative_versions set status = 'changes_requested' where id = cv.id;
      job := public.create_job(cv.project_id, 'creative', 'creative_worker', 'creative-revision:' || appr_id,
        jsonb_build_object('script_id', cv.script_id, 'base_creative_version_id', cv.id, 'approval_id', appr_id), p_actor_id);
      new_status := 'generating_creative';
    else
      -- Rejected: discard this direction and generate a fresh one from the approved script.
      update public.creative_versions set status = 'rejected' where id = cv.id;
      job := public.create_job(cv.project_id, 'creative', 'creative_worker', 'creative-fresh:' || appr_id,
        jsonb_build_object('script_id', cv.script_id, 'approval_id', appr_id, 'fresh', true), p_actor_id);
      new_status := 'generating_creative';
    end if;
    perform public.transition_project(cv.project_id, new_status, p_actor_id,
      jsonb_build_object('approval_id', appr_id, 'decision', p_decision, 'creative_version', cv.version), 'creative_in_review', job.id);
    return jsonb_build_object('approval_id', appr_id, 'status', new_status, 'next_job_id', job.id);
  end if;

  raise exception 'validation_failed: approvals for % are not available yet', p_artifact_type
    using errcode = 'P0001', hint = 'validation_failed';
end;
$$;

-- generating_creative → generating_creative is not a status change; rejected
-- creatives restart generation through the creative_in_review → generating_creative transition.

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.save_creative_version(uuid, uuid, uuid, integer, integer, text, text, text, text, jsonb, text, text, text)',
    'public.record_approval(uuid, text, uuid, integer, text, public.approval_decision, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;
