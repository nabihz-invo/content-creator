-- P5-T12 (ADR-0009): one creative, one rendered output per language version.
-- Studio creatives render an English and an Arabic version from one page; the
-- render job records which languages it must produce, every media asset carries
-- its language, and save_render() requires one complete set of files per
-- language (one MP4 / PNG, or slides 1…n). The manifest lists every version, so
-- one final approval covers both. Single-language creatives keep language null.

alter table public.media_assets
  add column language text check (language in ('en', 'ar'));

drop index public.media_assets_slide_unique;
create unique index media_assets_slide_unique
  on public.media_assets (render_job_id, coalesce(language, ''), slide_index)
  where slide_index is not null;

-- ---------------------------------------------------------------------------
-- queue_render: + configuration.languages (from the creative's studio settings);
-- slides = thumbnails per language.
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
  langs jsonb;
  n_langs integer;
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

  langs := cv.configuration -> 'studio' -> 'languages';
  if jsonb_typeof(langs) is distinct from 'array' or jsonb_array_length(langs) = 0 then
    langs := null;
  end if;
  n_langs := coalesce(jsonb_array_length(langs), 1);

  select coalesce(max(version), 0) + 1 into next_version from public.render_jobs where project_id = p_project_id;
  insert into public.render_jobs (project_id, creative_version_id, output_type, configuration, idempotency_key, version, created_by)
  values (p_project_id, cv.id, out_type,
    jsonb_build_object('width', (cv.configuration ->> 'width')::int, 'height', (cv.configuration ->> 'height')::int,
      'format', cv.configuration ->> 'format', 'duration_s', cv.configuration -> 'duration_s',
      'slides', coalesce(jsonb_array_length(cv.configuration -> 'thumbnails'), 0) / n_langs,
      'languages', langs,
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

-- ---------------------------------------------------------------------------
-- save_render: language-aware. p_assets items may carry "language" ('en'|'ar').
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
  g record;
  primary_type public.media_asset_type;
  n_primary integer := 0;
  n_groups integer := 0;
  expected_w integer;
  expected_h integer;
  expected_slides integer;
  langs text[];
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
  expected_slides := coalesce((rj.configuration ->> 'slides')::int, 0);
  prefix := rj.project_id || '/render-' || rj.id || '/';
  if jsonb_typeof(rj.configuration -> 'languages') = 'array' then
    select array_agg(x) into langs from jsonb_array_elements_text(rj.configuration -> 'languages') x;
  end if;

  for a in select * from jsonb_array_elements(p_assets) loop
    if not starts_with(a ->> 'storage_path', prefix) then
      raise exception 'validation_failed: % is outside %', a ->> 'storage_path', prefix using errcode = 'P0001', hint = 'validation_failed';
    end if;
    if (a ->> 'language') is not null and (langs is null or not ((a ->> 'language') = any (langs))) then
      raise exception 'validation_failed: % has language %, the render expects %', a ->> 'storage_path', a ->> 'language',
        coalesce(array_to_string(langs, ', '), 'none') using errcode = 'P0001', hint = 'validation_failed';
    end if;
    if (a ->> 'asset_type')::public.media_asset_type = primary_type then
      if langs is not null and (a ->> 'language') is null then
        raise exception 'validation_failed: % has no language version', a ->> 'storage_path' using errcode = 'P0001', hint = 'validation_failed';
      end if;
      if (a ->> 'width')::int is distinct from expected_w or (a ->> 'height')::int is distinct from expected_h then
        raise exception 'validation_failed: % is %x%, expected %x%', a ->> 'storage_path', a ->> 'width', a ->> 'height', expected_w, expected_h
          using errcode = 'P0001', hint = 'validation_failed';
      end if;
    end if;
    insert into public.media_assets (project_id, render_job_id, creative_version_id, asset_type, slide_index, language,
      storage_path, mime_type, file_size, width, height, duration, checksum, metadata)
    values (rj.project_id, rj.id, rj.creative_version_id, (a ->> 'asset_type')::public.media_asset_type,
      (a ->> 'slide_index')::int, a ->> 'language', a ->> 'storage_path', a ->> 'mime_type', (a ->> 'file_size')::bigint,
      (a ->> 'width')::int, (a ->> 'height')::int, (a ->> 'duration')::numeric, a ->> 'checksum',
      coalesce(a -> 'metadata', '{}'::jsonb));
  end loop;

  -- One complete set of primary files per language version.
  for g in
    select coalesce(language, '') as lang, count(*)::int as n, max(slide_index) as max_slide
    from public.media_assets where render_job_id = rj.id and asset_type = primary_type
    group by 1
  loop
    n_groups := n_groups + 1;
    n_primary := n_primary + g.n;
    if rj.output_type <> 'carousel' and g.n <> 1 then
      raise exception 'validation_failed: expected one % file per version, got % (%)', primary_type, g.n, nullif(g.lang, '')
        using errcode = 'P0001', hint = 'validation_failed';
    end if;
    if rj.output_type = 'carousel' then
      if g.max_slide <> g.n then
        raise exception 'validation_failed: carousel slides are not numbered 1…% (%)', g.n, nullif(g.lang, '')
          using errcode = 'P0001', hint = 'validation_failed';
      end if;
      if expected_slides > 0 and g.n <> expected_slides then
        raise exception 'validation_failed: % slides rendered (%), the creative has %', g.n, nullif(g.lang, ''), expected_slides
          using errcode = 'P0001', hint = 'validation_failed';
      end if;
    end if;
  end loop;
  if n_groups = 0 then
    raise exception 'validation_failed: expected one % file, got 0', primary_type using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if n_groups <> coalesce(cardinality(langs), 1) then
    raise exception 'validation_failed: % language version(s) rendered, expected %', n_groups, array_to_string(langs, ', ')
      using errcode = 'P0001', hint = 'validation_failed';
  end if;

  select jsonb_agg(jsonb_build_object(
           'media_asset_id', m.id, 'language', m.language, 'order', coalesce(m.slide_index, 1),
           'storage_path', m.storage_path, 'mime_type', m.mime_type, 'width', m.width, 'height', m.height,
           'duration', m.duration, 'file_size', m.file_size, 'checksum', m.checksum)
         order by coalesce(m.language, ''), coalesce(m.slide_index, 1))
    into items
  from public.media_assets m
  where m.render_job_id = rj.id and m.asset_type = primary_type;

  v_manifest := jsonb_build_object(
    'project_id', rj.project_id, 'creative_version_id', rj.creative_version_id, 'creative_version', cv.version,
    'commit_sha', cv.commit_sha, 'render_job_id', rj.id, 'render_version', rj.version,
    'output_type', rj.output_type, 'languages', to_jsonb(langs), 'items', items);
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
