-- P1-T08: atomic project creation used by every intake channel
-- (dashboard, CSV, Telegram, URL). Dedupe + insert + analysis job + events
-- happen in one transaction so a retried request can't half-create a project.

create or replace function public.create_project(
  p_workspace_id uuid,
  p_actor_id uuid,
  p_record jsonb,
  p_dedupe_hash text,
  p_allow_duplicate boolean default false,
  p_source_key text default null,
  p_auto_analyze boolean default true,
  p_import_batch_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  role public.member_role;
  existing public.content_projects;
  proj public.content_projects;
  job public.workflow_jobs;
  idea text := nullif(trim(p_record ->> 'original_idea'), '');
  url text := nullif(trim(p_record ->> 'source_url'), '');
  brand uuid := nullif(p_record ->> 'brand_id', '')::uuid;
  title text := nullif(trim(p_record ->> 'title'), '');
  dup_of uuid;
begin
  role := private.member_role(p_workspace_id, p_actor_id);
  if role is null or role not in ('admin', 'editor') then
    raise exception 'forbidden: user % cannot create projects in workspace %', p_actor_id, p_workspace_id
      using errcode = 'P0001', hint = 'forbidden';
  end if;

  if idea is null and url is null then
    raise exception 'validation_failed: original_idea or source_url is required'
      using errcode = 'P0001', hint = 'validation_failed';
  end if;

  if brand is not null and not exists (
    select 1 from public.brands b where b.id = brand and b.workspace_id = p_workspace_id and b.archived_at is null
  ) then
    raise exception 'validation_failed: brand % is not in this workspace', brand
      using errcode = 'P0001', hint = 'validation_failed';
  end if;

  -- Replay of the same external submission → same project.
  if p_source_key is not null then
    select * into existing from public.content_projects where source_idempotency_key = p_source_key;
    if found then
      return jsonb_build_object('project_id', existing.id, 'created', false, 'replayed', true,
                                'duplicate_of', existing.duplicate_of, 'status', existing.status, 'job_id', null);
    end if;
  end if;

  -- Serialize creators of the same idea within the workspace.
  perform pg_advisory_xact_lock(hashtextextended(p_workspace_id::text || ':' || p_dedupe_hash, 0));

  select * into existing from public.content_projects
  where workspace_id = p_workspace_id and dedupe_hash = p_dedupe_hash and status <> 'cancelled'
  order by created_at
  limit 1;

  if found then
    dup_of := existing.id;
  end if;

  if dup_of is not null and not p_allow_duplicate then
    return jsonb_build_object('project_id', existing.id, 'created', false, 'replayed', false,
                              'duplicate_of', existing.id, 'status', existing.status, 'job_id', null);
  end if;

  if title is null then
    title := left(coalesce(split_part(idea, E'\n', 1), url), 120);
  end if;

  insert into public.content_projects (
    workspace_id, brand_id, owner_id, title, original_idea, input_source, source_url,
    source_reference, source_metadata, source_idempotency_key, content_type, language,
    dedupe_hash, duplicate_of, import_batch_id, submitted_at
  ) values (
    p_workspace_id, brand, p_actor_id, title, coalesce(idea, url),
    (p_record ->> 'input_source')::public.input_source, url,
    p_record ->> 'source_reference', coalesce(p_record -> 'source_metadata', '{}'::jsonb), p_source_key,
    nullif(p_record ->> 'content_type', '')::public.content_type, nullif(p_record ->> 'language', ''),
    p_dedupe_hash, dup_of, p_import_batch_id,
    coalesce((p_record ->> 'submitted_at')::timestamptz, now())
  )
  returning * into proj;

  perform public.log_event(proj.id, 'project.created',
    jsonb_build_object('input_source', proj.input_source, 'source_reference', proj.source_reference,
                       'duplicate_of', proj.duplicate_of, 'import_batch_id', p_import_batch_id),
    p_actor_id);

  if p_auto_analyze then
    job := public.create_job(proj.id, 'analysis', 'n8n', 'analysis:' || proj.id || ':1',
                             jsonb_build_object('project_id', proj.id), p_actor_id);
    proj := public.transition_project(proj.id, 'analyzing', p_actor_id, '{}'::jsonb, 'new', job.id);
  end if;

  return jsonb_build_object('project_id', proj.id, 'created', true, 'replayed', false,
                            'duplicate_of', proj.duplicate_of, 'status', proj.status, 'job_id', job.id);
end;
$$;

revoke all on function public.create_project(uuid, uuid, jsonb, text, boolean, text, boolean, uuid) from public, anon, authenticated;
grant execute on function public.create_project(uuid, uuid, jsonb, text, boolean, text, boolean, uuid) to service_role;
