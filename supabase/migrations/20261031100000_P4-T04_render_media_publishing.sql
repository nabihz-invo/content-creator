-- P4 (ADR-0008): render jobs, media assets and manifests, final media approval,
-- manual publishing preparation.

-- ---------------------------------------------------------------------------
-- Render jobs: per-project version, manifest built by save_render().
-- ---------------------------------------------------------------------------
alter table public.render_jobs add column version integer;
update public.render_jobs r set version = s.n
from (select id, row_number() over (partition by project_id order by created_at) as n from public.render_jobs) s
where s.id = r.id;
alter table public.render_jobs alter column version set not null;
alter table public.render_jobs add constraint render_jobs_version_positive check (version >= 1);
alter table public.render_jobs add constraint render_jobs_project_version unique (project_id, version);
alter table public.render_jobs add column manifest jsonb;
alter table public.render_jobs add column manifest_hash text check (manifest_hash ~ '^[0-9a-f]{64}$');
-- A succeeded render always has its manifest; only succeeded (or later outdated) renders have one.
alter table public.render_jobs add constraint render_jobs_manifest_consistent check (
  (manifest is null) = (manifest_hash is null)
  and (status <> 'succeeded' or manifest is not null)
  and (manifest is null or status in ('succeeded', 'outdated')));
create unique index render_jobs_workflow_job_idx on public.render_jobs (workflow_job_id) where workflow_job_id is not null;

-- While a render is open anything may change; a finished render is frozen except for its status.
create trigger render_jobs_immutable before update on public.render_jobs
  for each row execute function private.guard_immutable('status', 'queued,running,failed,cancelled');

create or replace function private.guard_render_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'succeeded' and new.status not in ('succeeded', 'outdated') then
    raise exception 'render job % succeeded; it can only become outdated', old.id using errcode = 'insufficient_privilege';
  end if;
  if old.status = 'outdated' and new.status <> 'outdated' then
    raise exception 'render job % is outdated (final)', old.id using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
create trigger render_jobs_status_flow before update on public.render_jobs
  for each row execute function private.guard_render_status();

-- The workflow job drives the render job's live state (claimed, retried, failed, cancelled, progress).
create or replace function private.sync_render_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind <> 'render_worker' then
    return new;
  end if;
  update public.render_jobs r
  set status = case new.status
                 when 'running' then 'running'
                 when 'queued' then 'queued'
                 when 'needs_attention' then 'failed'
                 when 'failed' then 'failed'
                 when 'cancelled' then 'cancelled'
                 else r.status
               end,
      attempts = new.attempts,
      progress = case when new.status = 'running' then coalesce(new.progress, r.progress) else r.progress end,
      started_at = case when new.status = 'running' then coalesce(r.started_at, now()) else r.started_at end,
      error_details = case when new.status in ('needs_attention', 'failed', 'queued') then new.error_details else r.error_details end,
      completed_at = case when new.status in ('needs_attention', 'cancelled') then now() else r.completed_at end
  where r.workflow_job_id = new.id and r.status not in ('succeeded', 'outdated');
  return new;
end;
$$;
create trigger workflow_jobs_sync_render after update on public.workflow_jobs
  for each row when (old.status is distinct from new.status or old.progress is distinct from new.progress)
  execute function private.sync_render_job();

-- ---------------------------------------------------------------------------
-- queue_render: one render job (+ its worker job) for an approved creative.
-- ---------------------------------------------------------------------------
create or replace function public.queue_render(
  p_project_id uuid,
  p_creative_version_id uuid,
  p_actor_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cv public.creative_versions;
  rj public.render_jobs;
  job public.workflow_jobs;
  out_type public.render_output_type;
  next_version integer;
begin
  select * into rj from public.render_jobs where idempotency_key = p_idempotency_key;
  if found then
    if rj.project_id <> p_project_id then
      raise exception 'idempotency_conflict: key belongs to another project' using errcode = 'P0001', hint = 'idempotency_conflict';
    end if;
    return jsonb_build_object('render_job_id', rj.id, 'job_id', rj.workflow_job_id, 'version', rj.version,
      'output_type', rj.output_type, 'created', false);
  end if;

  select * into cv from public.creative_versions where id = p_creative_version_id;
  if not found or cv.project_id <> p_project_id then
    raise exception 'not_found: creative version %', p_creative_version_id using errcode = 'P0001', hint = 'not_found';
  end if;
  if cv.status <> 'approved' then
    raise exception 'approval_required: rendering needs the approved creative (v% is %)', cv.version, cv.status
      using errcode = 'P0001', hint = 'approval_required';
  end if;
  out_type := case cv.configuration ->> 'format'
                when 'static' then 'png'
                when 'carousel' then 'carousel'
                when 'video' then 'mp4'
              end;
  if out_type is null or (cv.configuration ->> 'width') is null or (cv.configuration ->> 'height') is null then
    raise exception 'validation_failed: creative v% has no format/dimensions', cv.version using errcode = 'P0001', hint = 'validation_failed';
  end if;

  select coalesce(max(version), 0) + 1 into next_version from public.render_jobs where project_id = p_project_id;
  insert into public.render_jobs (project_id, creative_version_id, output_type, configuration, idempotency_key, version, created_by)
  values (p_project_id, cv.id, out_type,
    jsonb_build_object('width', (cv.configuration ->> 'width')::int, 'height', (cv.configuration ->> 'height')::int,
      'format', cv.configuration ->> 'format', 'duration_s', cv.configuration -> 'duration_s',
      'slides', coalesce(jsonb_array_length(cv.configuration -> 'thumbnails'), 0),
      'creative_version', cv.version, 'commit_sha', cv.commit_sha),
    p_idempotency_key, next_version, p_actor_id)
  returning * into rj;
  job := public.create_job(p_project_id, 'render', 'render_worker', 'render-job:' || rj.id,
    jsonb_build_object('render_job_id', rj.id, 'creative_version_id', cv.id, 'output_type', out_type), p_actor_id);
  update public.render_jobs set workflow_job_id = job.id where id = rj.id;
  perform public.log_event(p_project_id, 'render.queued',
    jsonb_build_object('render_job_id', rj.id, 'version', next_version, 'output_type', out_type, 'creative_version', cv.version),
    p_actor_id, job.id);
  return jsonb_build_object('render_job_id', rj.id, 'job_id', job.id, 'version', next_version, 'output_type', out_type, 'created', true);
end;
$$;

-- Claim the next render job whose output type this worker supports (Phase 4: png, carousel).
create or replace function public.claim_render_job(
  p_worker_id text,
  p_lease_seconds integer,
  p_output_types public.render_output_type[]
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
  join public.render_jobs r on r.workflow_job_id = j.id
  where j.kind = 'render_worker'
    and r.output_type = any (p_output_types)
    and (
      (j.status = 'queued' and j.next_run_at <= now())
      or (j.status = 'running' and j.lease_expires_at < now() and j.attempts < j.max_attempts)
    )
  order by j.next_run_at, j.created_at
  for update of j skip locked
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

-- ---------------------------------------------------------------------------
-- save_render: validated files from the worker → media assets + manifest.
-- p_assets: [{ asset_type, slide_index, storage_path, mime_type, file_size, width, height, checksum, metadata }]
-- ---------------------------------------------------------------------------
create or replace function public.save_render(
  p_job_id uuid,
  p_worker_id text,
  p_render_job_id uuid,
  p_assets jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rj public.render_jobs;
  cv public.creative_versions;
  a jsonb;
  primary_type public.media_asset_type;
  n_primary integer;
  expected_w integer;
  expected_h integer;
  items jsonb;
  v_manifest jsonb;
  m_hash text;
  prefix text;
begin
  select * into rj from public.render_jobs where id = p_render_job_id for update;
  if not found or rj.workflow_job_id is distinct from p_job_id then
    raise exception 'not_found: render job % for job %', p_render_job_id, p_job_id using errcode = 'P0001', hint = 'not_found';
  end if;
  perform private.lock_project(rj.project_id, array['rendering']::public.project_status[]);
  if rj.status <> 'running' then
    raise exception 'invalid_job_state: render job % is %', rj.id, rj.status using errcode = 'P0001', hint = 'invalid_job_state';
  end if;
  select * into cv from public.creative_versions where id = rj.creative_version_id;
  if cv.status <> 'approved' then
    raise exception 'approval_required: creative v% is no longer approved', cv.version using errcode = 'P0001', hint = 'approval_required';
  end if;
  if jsonb_typeof(p_assets) <> 'array' or jsonb_array_length(p_assets) = 0 then
    raise exception 'validation_failed: no rendered files' using errcode = 'P0001', hint = 'validation_failed';
  end if;

  primary_type := case rj.output_type when 'png' then 'png' when 'carousel' then 'carousel_slide' else 'mp4' end;
  expected_w := (rj.configuration ->> 'width')::int;
  expected_h := (rj.configuration ->> 'height')::int;
  prefix := rj.project_id || '/render-' || rj.id || '/';

  for a in select * from jsonb_array_elements(p_assets) loop
    if not starts_with(a ->> 'storage_path', prefix) then
      raise exception 'validation_failed: % is outside %', a ->> 'storage_path', prefix using errcode = 'P0001', hint = 'validation_failed';
    end if;
    if (a ->> 'asset_type')::public.media_asset_type = primary_type
       and ((a ->> 'width')::int is distinct from expected_w or (a ->> 'height')::int is distinct from expected_h) then
      raise exception 'validation_failed: % is %x%, expected %x%', a ->> 'storage_path', a ->> 'width', a ->> 'height', expected_w, expected_h
        using errcode = 'P0001', hint = 'validation_failed';
    end if;
    insert into public.media_assets (project_id, render_job_id, creative_version_id, asset_type, slide_index, storage_path,
      mime_type, file_size, width, height, duration, checksum, metadata)
    values (rj.project_id, rj.id, rj.creative_version_id, (a ->> 'asset_type')::public.media_asset_type,
      (a ->> 'slide_index')::int, a ->> 'storage_path', a ->> 'mime_type', (a ->> 'file_size')::bigint,
      (a ->> 'width')::int, (a ->> 'height')::int, (a ->> 'duration')::numeric, a ->> 'checksum',
      coalesce(a -> 'metadata', '{}'::jsonb));
  end loop;

  select count(*) into n_primary from public.media_assets where render_job_id = rj.id and asset_type = primary_type;
  if n_primary = 0 or (rj.output_type <> 'carousel' and n_primary <> 1) then
    raise exception 'validation_failed: expected one % file, got %', primary_type, n_primary using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if rj.output_type = 'carousel' then
    if (select max(slide_index) from public.media_assets where render_job_id = rj.id and asset_type = 'carousel_slide') <> n_primary then
      raise exception 'validation_failed: carousel slides are not numbered 1…%', n_primary using errcode = 'P0001', hint = 'validation_failed';
    end if;
    if coalesce((rj.configuration ->> 'slides')::int, 0) > 0 and n_primary <> (rj.configuration ->> 'slides')::int then
      raise exception 'validation_failed: % slides rendered, the creative has %', n_primary, rj.configuration ->> 'slides'
        using errcode = 'P0001', hint = 'validation_failed';
    end if;
  end if;

  select jsonb_agg(jsonb_build_object(
           'media_asset_id', m.id, 'order', coalesce(m.slide_index, 1), 'storage_path', m.storage_path,
           'mime_type', m.mime_type, 'width', m.width, 'height', m.height, 'file_size', m.file_size, 'checksum', m.checksum)
         order by coalesce(m.slide_index, 1))
    into items
  from public.media_assets m
  where m.render_job_id = rj.id and m.asset_type = primary_type;

  v_manifest := jsonb_build_object(
    'project_id', rj.project_id, 'creative_version_id', rj.creative_version_id, 'creative_version', cv.version,
    'commit_sha', cv.commit_sha, 'render_job_id', rj.id, 'render_version', rj.version,
    'output_type', rj.output_type, 'items', items);
  m_hash := encode(sha256(convert_to(v_manifest::text, 'UTF8')), 'hex');

  update public.render_jobs
  set status = 'succeeded', progress = 100, manifest = v_manifest || jsonb_build_object('manifest_hash', m_hash),
      manifest_hash = m_hash, completed_at = now(), error_details = null
  where id = rj.id;

  -- Older renders of this project can no longer be reviewed or published.
  update public.media_assets set status = 'outdated'
  where project_id = rj.project_id and render_job_id <> rj.id and status in ('pending_review', 'approved');
  update public.render_jobs set status = 'outdated'
  where project_id = rj.project_id and id <> rj.id and status = 'succeeded';

  perform public.transition_project(rj.project_id, 'media_in_review', null,
    jsonb_build_object('render_job_id', rj.id, 'render_version', rj.version, 'manifest_hash', m_hash, 'files', n_primary),
    'rendering', p_job_id);
  perform public.complete_job(p_job_id, jsonb_build_object('render_job_id', rj.id, 'manifest_hash', m_hash), p_worker_id);
  return jsonb_build_object('render_job_id', rj.id, 'version', rj.version, 'manifest_hash', m_hash, 'files', n_primary,
    'status', 'media_in_review');
end;
$$;

-- Editors can queue a render of the approved creative (after a cancelled/failed render, or to re-render from review).
create or replace function public.request_render(
  p_actor_id uuid,
  p_creative_version_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cv public.creative_versions;
  proj public.content_projects;
  existing public.render_jobs;
  r jsonb;
begin
  select * into cv from public.creative_versions where id = p_creative_version_id;
  if not found then
    raise exception 'not_found: creative version %', p_creative_version_id using errcode = 'P0001', hint = 'not_found';
  end if;
  proj := private.require_role(cv.project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  select * into existing from public.render_jobs where idempotency_key = p_idempotency_key;
  if found then
    return public.queue_render(cv.project_id, cv.id, p_actor_id, p_idempotency_key);
  end if;
  if proj.status not in ('rendering', 'media_in_review') then
    raise exception 'invalid_transition: project is %; render from creative approval or media review', proj.status
      using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  if exists (select 1 from public.render_jobs where project_id = cv.project_id and status in ('queued', 'running')) then
    raise exception 'invalid_transition: a render is already in progress' using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  r := public.queue_render(cv.project_id, cv.id, p_actor_id, p_idempotency_key);
  if proj.status = 'media_in_review' then
    update public.media_assets set status = 'outdated' where project_id = cv.project_id and status = 'pending_review';
    update public.render_jobs set status = 'outdated' where project_id = cv.project_id and status = 'succeeded';
    perform public.transition_project(cv.project_id, 'rendering', p_actor_id,
      jsonb_build_object('render_job_id', r ->> 'render_job_id', 'reason', 'manual rerender'), 'media_in_review', (r ->> 'job_id')::uuid);
  end if;
  return r;
end;
$$;

-- ---------------------------------------------------------------------------
-- A new creative version makes older creatives and their renders outdated.
-- (Redefines P3's save_creative_version: adds the outdated cascade.)
-- ---------------------------------------------------------------------------
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
  where project_id = p_project_id and status in ('in_review', 'changes_requested', 'approved');
  update public.render_jobs set status = 'outdated'
  where project_id = p_project_id and status = 'succeeded';
  update public.media_assets set status = 'outdated'
  where project_id = p_project_id and status in ('pending_review', 'approved');
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

-- ---------------------------------------------------------------------------
-- record_approval: + final media (media_manifest) and p_return_to.
-- ---------------------------------------------------------------------------
drop function public.record_approval(uuid, text, uuid, integer, text, public.approval_decision, text);

create function public.record_approval(
  p_actor_id uuid,
  p_artifact_type text,
  p_artifact_id uuid,
  p_artifact_version integer,
  p_artifact_hash text,
  p_decision public.approval_decision,
  p_comment text default null,
  p_return_to text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.scripts;
  cv public.creative_versions;
  rj public.render_jobs;
  proj public.content_projects;
  appr_id uuid;
  job public.workflow_jobs;
  job_id uuid;
  r jsonb;
  new_status public.project_status;
begin
  if p_decision = 'changes_requested' and coalesce(trim(p_comment), '') = '' then
    raise exception 'validation_failed: describe the changes you want' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if p_return_to is not null and (p_artifact_type <> 'media_manifest' or p_decision <> 'changes_requested'
     or p_return_to not in ('render', 'creative')) then
    raise exception 'validation_failed: return_to applies to media changes only (render|creative)' using errcode = 'P0001', hint = 'validation_failed';
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
      r := public.queue_render(cv.project_id, cv.id, p_actor_id, 'render:' || cv.id);
      job_id := (r ->> 'job_id')::uuid;
      new_status := 'rendering';
    elsif p_decision = 'changes_requested' then
      update public.creative_versions set status = 'changes_requested' where id = cv.id;
      job := public.create_job(cv.project_id, 'creative', 'creative_worker', 'creative-revision:' || appr_id,
        jsonb_build_object('script_id', cv.script_id, 'base_creative_version_id', cv.id, 'approval_id', appr_id), p_actor_id);
      job_id := job.id;
      new_status := 'generating_creative';
    else
      update public.creative_versions set status = 'rejected' where id = cv.id;
      job := public.create_job(cv.project_id, 'creative', 'creative_worker', 'creative-fresh:' || appr_id,
        jsonb_build_object('script_id', cv.script_id, 'approval_id', appr_id, 'fresh', true), p_actor_id);
      job_id := job.id;
      new_status := 'generating_creative';
    end if;
    perform public.transition_project(cv.project_id, new_status, p_actor_id,
      jsonb_build_object('approval_id', appr_id, 'decision', p_decision, 'creative_version', cv.version), 'creative_in_review', job_id);
    return jsonb_build_object('approval_id', appr_id, 'status', new_status, 'next_job_id', job_id);
  end if;

  if p_artifact_type = 'media_manifest' then
    select * into rj from public.render_jobs where id = p_artifact_id for update;
    if not found then
      raise exception 'not_found: render %', p_artifact_id using errcode = 'P0001', hint = 'not_found';
    end if;
    proj := private.require_role(rj.project_id, p_actor_id, array['admin', 'editor', 'reviewer']::public.member_role[]);
    if rj.version <> p_artifact_version or rj.manifest_hash is distinct from p_artifact_hash then
      raise exception 'hash_mismatch: render % changed (version %, manifest %)', rj.id, rj.version, rj.manifest_hash
        using errcode = 'P0001', hint = 'hash_mismatch';
    end if;
    if rj.status <> 'succeeded' or proj.status <> 'media_in_review'
       or exists (select 1 from public.media_assets where render_job_id = rj.id and status <> 'pending_review') then
      raise exception 'invalid_transition: render v% is %, project is %', rj.version, rj.status, proj.status
        using errcode = 'P0001', hint = 'invalid_transition';
    end if;
    select * into cv from public.creative_versions where id = rj.creative_version_id;
    insert into public.approvals (project_id, stage, artifact_type, artifact_id, artifact_version, artifact_hash, decision, comment, reviewer_id)
    values (rj.project_id, 'media', 'media_manifest', rj.id, rj.version, rj.manifest_hash, p_decision, nullif(trim(p_comment), ''), p_actor_id)
    returning id into appr_id;

    if p_decision = 'approved' then
      update public.media_assets set status = 'approved' where render_job_id = rj.id;
      new_status := 'ready_to_publish';
    else
      update public.media_assets set status = 'rejected' where render_job_id = rj.id;
      if p_decision = 'changes_requested' and coalesce(p_return_to, 'render') = 'render' then
        r := public.queue_render(rj.project_id, rj.creative_version_id, p_actor_id, 'rerender:' || appr_id);
        job_id := (r ->> 'job_id')::uuid;
        new_status := 'rendering';
      elsif p_decision = 'changes_requested' then
        job := public.create_job(rj.project_id, 'creative', 'creative_worker', 'creative-revision:' || appr_id,
          jsonb_build_object('script_id', cv.script_id, 'base_creative_version_id', cv.id, 'approval_id', appr_id), p_actor_id);
        job_id := job.id;
        new_status := 'generating_creative';
      else
        job := public.create_job(rj.project_id, 'creative', 'creative_worker', 'creative-fresh:' || appr_id,
          jsonb_build_object('script_id', cv.script_id, 'approval_id', appr_id, 'fresh', true), p_actor_id);
        job_id := job.id;
        new_status := 'generating_creative';
      end if;
    end if;
    perform public.transition_project(rj.project_id, new_status, p_actor_id,
      jsonb_build_object('approval_id', appr_id, 'decision', p_decision, 'render_version', rj.version,
        'manifest_hash', rj.manifest_hash, 'return_to', p_return_to), 'media_in_review', job_id);
    return jsonb_build_object('approval_id', appr_id, 'status', new_status, 'next_job_id', job_id);
  end if;

  raise exception 'validation_failed: approvals for % are not available yet', p_artifact_type
    using errcode = 'P0001', hint = 'validation_failed';
end;
$$;

-- ---------------------------------------------------------------------------
-- Publishing preparation (manual posting in the initial release).
-- ---------------------------------------------------------------------------
create or replace function public.create_publishing_job(
  p_actor_id uuid,
  p_project_id uuid,
  p_approval_id uuid,
  p_platform text,
  p_caption text,
  p_hashtags text[],
  p_link text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  proj public.content_projects;
  appr public.approvals;
  rj public.render_jobs;
  pj public.publishing_jobs;
begin
  proj := private.require_role(p_project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  select * into pj from public.publishing_jobs where idempotency_key = p_idempotency_key;
  if found then
    if pj.project_id <> p_project_id then
      raise exception 'idempotency_conflict: key belongs to another project' using errcode = 'P0001', hint = 'idempotency_conflict';
    end if;
    return jsonb_build_object('publishing_job_id', pj.id, 'status', pj.status, 'created', false);
  end if;
  if proj.status not in ('ready_to_publish', 'published') then
    raise exception 'approval_required: project is %, media must be approved first', proj.status
      using errcode = 'P0001', hint = 'approval_required';
  end if;
  select * into appr from public.approvals where id = p_approval_id;
  if not found or appr.project_id <> p_project_id or appr.stage <> 'media' or appr.decision <> 'approved'
     or appr.artifact_type <> 'media_manifest' then
    raise exception 'approval_required: an approved media manifest of this project is required'
      using errcode = 'P0001', hint = 'approval_required';
  end if;
  select * into rj from public.render_jobs where id = appr.artifact_id;
  if rj.status <> 'succeeded' or rj.manifest_hash <> appr.artifact_hash then
    raise exception 'approval_required: the approved media is outdated' using errcode = 'P0001', hint = 'approval_required';
  end if;
  if p_link is not null and p_link !~ '^https://' then
    raise exception 'validation_failed: link must be https' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  insert into public.publishing_jobs (project_id, approval_id, media_manifest, manifest_hash, platform, caption, hashtags,
    link, status, idempotency_key, created_by)
  values (p_project_id, appr.id, rj.manifest, rj.manifest_hash, p_platform, p_caption, coalesce(p_hashtags, '{}'),
    p_link, 'ready', p_idempotency_key, p_actor_id)
  returning * into pj;
  perform public.log_event(p_project_id, 'publishing.prepared',
    jsonb_build_object('publishing_job_id', pj.id, 'platform', p_platform, 'manifest_hash', rj.manifest_hash), p_actor_id);
  return jsonb_build_object('publishing_job_id', pj.id, 'status', pj.status, 'created', true);
end;
$$;

-- The user confirms they posted it by hand; the URL is the proof (WORKFLOW.md §3).
create or replace function public.mark_published_manually(
  p_actor_id uuid,
  p_publishing_job_id uuid,
  p_published_url text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  pj public.publishing_jobs;
  proj public.content_projects;
begin
  select * into pj from public.publishing_jobs where id = p_publishing_job_id for update;
  if not found then
    raise exception 'not_found: publishing job %', p_publishing_job_id using errcode = 'P0001', hint = 'not_found';
  end if;
  proj := private.require_role(pj.project_id, p_actor_id, array['admin', 'editor']::public.member_role[]);
  if pj.status = 'published' then
    return jsonb_build_object('publishing_job_id', pj.id, 'status', pj.status, 'project_status', proj.status);
  end if;
  if pj.status <> 'ready' then
    raise exception 'invalid_transition: publishing job is %', pj.status using errcode = 'P0001', hint = 'invalid_transition';
  end if;
  if coalesce(p_published_url, '') !~ '^https://[^\s]+$' then
    raise exception 'validation_failed: the post URL must be an https link' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  update public.publishing_jobs
  set status = 'published', published_url = p_published_url, published_at = now(),
      provider_response = jsonb_build_object('manual', true, 'confirmed_by', p_actor_id)
  where id = pj.id;
  perform public.log_event(pj.project_id, 'publishing.published_manually',
    jsonb_build_object('publishing_job_id', pj.id, 'platform', pj.platform, 'url', p_published_url), p_actor_id);
  if proj.status = 'ready_to_publish' then
    perform public.transition_project(pj.project_id, 'published', p_actor_id,
      jsonb_build_object('publishing_job_id', pj.id, 'manual', true), 'ready_to_publish');
  end if;
  return jsonb_build_object('publishing_job_id', pj.id, 'status', 'published',
    'project_status', (select status from public.content_projects where id = pj.project_id));
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges: server-side only.
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.queue_render(uuid, uuid, uuid, text)',
    'public.claim_render_job(text, integer, public.render_output_type[])',
    'public.save_render(uuid, text, uuid, jsonb)',
    'public.request_render(uuid, uuid, text)',
    'public.save_creative_version(uuid, uuid, uuid, integer, integer, text, text, text, text, jsonb, text, text, text)',
    'public.record_approval(uuid, text, uuid, integer, text, public.approval_decision, text, text)',
    'public.create_publishing_job(uuid, uuid, uuid, text, text, text[], text, text)',
    'public.mark_published_manually(uuid, uuid, text)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;
