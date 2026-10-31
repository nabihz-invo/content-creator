-- Phase 4: render jobs, media manifests, final media approval, publishing preparation.
begin;
\ir _helpers.sql
select plan(41);

select tests.create_user('radmin@example.com') as admin \gset
select tests.create_user('rreviewer@example.com') as reviewer \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');

-- Fast-forward a project to an approved carousel creative (3 slides, 1080×1350).
create function pg_temp.approved_creative(p_ws uuid, p_admin uuid, p_reviewer uuid, p_format text, p_slides int)
returns jsonb language plpgsql as $$
declare
  p uuid; b uuid; s uuid; j uuid; cv uuid; cfg jsonb; r jsonb;
begin
  p := tests.new_project(p_ws, p_admin, 'render idea ' || gen_random_uuid(), false);
  insert into content_briefs (project_id, version, brief, content_hash, validation_status) values (p, 1, '{}', repeat('b', 64), 'valid') returning id into b;
  perform set_config('cc.in_transition', 'on', true);
  update content_projects set status = 'script_in_review', current_stage = 'script_review' where id = p;
  perform set_config('cc.in_transition', 'off', true);
  insert into scripts (project_id, brief_id, version, content, content_hash) values (p, b, 1, '{}', repeat('1', 64)) returning id into s;
  j := (record_approval(p_reviewer, 'script', s, 1, repeat('1', 64), 'approved') ->> 'next_job_id')::uuid;
  perform claim_job('creative_worker', 'cw');
  cfg := jsonb_build_object('format', p_format, 'width', 1080, 'height', case when p_format = 'carousel' then 1350 else 1080 end,
    'thumbnails', (select coalesce(jsonb_agg(jsonb_build_object('name', 'slide-' || i)), '[]') from generate_series(1, p_slides) i));
  cv := (save_creative_version(j, p, s, 1, 1, 'https://github.com/org/content-creatives', repeat('a', 40), 'projects/x/v1',
    'previews/x/creative-v1/', cfg, repeat('c', 64), null, 'template') ->> 'creative_version_id')::uuid;
  r := record_approval(p_reviewer, 'creative_version', cv, 1, repeat('c', 64), 'approved');
  return jsonb_build_object('project', p, 'script', s, 'creative', cv, 'job', r ->> 'next_job_id');
end;
$$;

create function pg_temp.slides(p_project uuid, p_render uuid, p_n int, p_h int default 1350)
returns jsonb language sql as $$
  select jsonb_agg(jsonb_build_object('asset_type', 'carousel_slide', 'slide_index', i,
    'storage_path', p_project || '/render-' || p_render || '/slide-' || lpad(i::text, 2, '0') || '.png',
    'mime_type', 'image/png', 'file_size', 1000 + i, 'width', 1080, 'height', p_h, 'checksum', repeat(i::text, 64)))
  from generate_series(1, p_n) i;
$$;

select pg_temp.approved_creative(:'ws', :'admin', :'reviewer', 'carousel', 3) as c \gset
select (:'c'::jsonb ->> 'project') as p, (:'c'::jsonb ->> 'creative') as cv, (:'c'::jsonb ->> 'job') as job1 \gset
select id as r1 from render_jobs where workflow_job_id = :'job1' \gset

-- queue_render
select is((select output_type::text || ' v' || version || ' ' || status from render_jobs where id = :'r1'), 'carousel v1 queued', 'creative approval queues render v1 for a carousel');
select is((select configuration ->> 'width' || 'x' || (configuration ->> 'height') || '/' || (configuration ->> 'slides') from render_jobs where id = :'r1'), '1080x1350/3', 'render job records the expected size and slide count');
select is((select status from content_projects where id = :'p'), 'rendering'::project_status, 'project is rendering');
select is(queue_render(:'p', :'cv', :'admin', 'render:' || :'cv') ->> 'created', 'false', 'queue_render is idempotent by key');

-- A Phase 4 worker never claims an mp4 job.
select pg_temp.approved_creative(:'ws', :'admin', :'reviewer', 'video', 4) as v \gset
select is((select output_type::text from render_jobs where project_id = (:'v'::jsonb ->> 'project')::uuid), 'mp4', 'video creatives queue mp4 renders');
select is((select count(*)::int from claim_render_job('w-mp4-less', 60, array['png']::render_output_type[])), 0, 'no png job to claim');
select is((select id from claim_render_job('w1', 60, array['png', 'carousel']::render_output_type[])), :'job1'::uuid, 'the png/carousel worker claims the carousel job, not the mp4 one');
select is((select status || '/' || attempts from render_jobs where id = :'r1'), 'running/1', 'claim marks the render running (synced from the workflow job)');
select heartbeat_job(:'job1', 'w1', 40, 60);
select is((select progress from render_jobs where id = :'r1'), 40, 'progress is synced');

-- save_render validation
select throws_ok(format($$select save_render(%L, 'w1', %L, %L)$$, :'job1', :'r1', pg_temp.slides(:'p', :'r1', 3, 1080)), 'P0001', null,
  'slides with the wrong height are refused');
select throws_ok(format($$select save_render(%L, 'w1', %L, %L)$$, :'job1', :'r1', pg_temp.slides(:'p', :'r1', 2)), 'P0001', null,
  'a missing slide is refused');
select throws_ok(format($$select save_render(%L, 'w1', %L, %L)$$, :'job1', :'r1',
  jsonb_build_array(jsonb_build_object('asset_type', 'carousel_slide', 'slide_index', 1, 'storage_path', 'other/place.png',
    'mime_type', 'image/png', 'file_size', 1, 'width', 1080, 'height', 1350, 'checksum', repeat('a', 64)))), 'P0001', null,
  'files outside the render folder are refused');
select throws_ok(format($$select save_render(%L, 'w2', %L, %L)$$, :'job1', :'r1', pg_temp.slides(:'p', :'r1', 3)), 'P0001', null,
  'another worker cannot save');
select save_render(:'job1', 'w1', :'r1', pg_temp.slides(:'p', :'r1', 3)) as s1 \gset
select is((select status from content_projects where id = :'p'), 'media_in_review'::project_status, 'rendered media goes to review');
select is((select status from workflow_jobs where id = :'job1'), 'succeeded'::job_status, 'render job completed atomically');
select is((select manifest_hash from render_jobs where id = :'r1'),
  (select encode(sha256(convert_to((manifest - 'manifest_hash')::text, 'UTF8')), 'hex') from render_jobs where id = :'r1'),
  'manifest hash is the sha256 of the canonical manifest');
select is((select jsonb_array_length(manifest -> 'items') || ':' || (manifest -> 'items' -> 2 ->> 'order') from render_jobs where id = :'r1'), '3:3', 'manifest lists the slides in order');
select is((select manifest ->> 'commit_sha' from render_jobs where id = :'r1'), repeat('a', 40), 'manifest traces the Git commit');
select throws_ok(format($$update render_jobs set manifest = '{}' where id = %L$$, :'r1'), '42501', null, 'a finished render is frozen');
select throws_ok(format($$update media_assets set checksum = %L where render_job_id = %L and slide_index = 1$$, repeat('f', 64), :'r1'), '42501', null,
  'media files are immutable');
select (:'s1'::jsonb ->> 'manifest_hash') as h1 \gset

-- Final approval: stale hash, outsiders, return_to rules
select throws_ok(format($$select record_approval(%L, 'media_manifest', %L, 1, %L, 'approved')$$, :'reviewer', :'r1', repeat('0', 64)), 'P0001', null,
  'a stale manifest hash is refused');
select throws_ok(format($$select record_approval(%L, 'media_manifest', %L, 1, %L, 'approved')$$, gen_random_uuid(), :'r1', :'h1'), 'P0001', null,
  'outsiders cannot approve media');
select throws_ok(format($$select record_approval(%L, 'media_manifest', %L, 1, %L, 'approved', null, 'render')$$, :'reviewer', :'r1', :'h1'), 'P0001', null,
  'return_to only applies to change requests');

-- Rerender → v2; v1 becomes outdated when v2 is saved
select record_approval(:'reviewer', 'media_manifest', :'r1', 1, :'h1', 'changes_requested', 'Slide 2 is cropped', 'render') as rr \gset
select is((select string_agg(distinct status, ',') from media_assets where render_job_id = :'r1'), 'rejected', 'rerender rejects the reviewed files');
select is((select status from content_projects where id = :'p'), 'rendering'::project_status, 'rerender moves back to rendering');
select id as r2 from render_jobs where workflow_job_id = (:'rr'::jsonb ->> 'next_job_id')::uuid \gset
select is((select version || ':' || creative_version_id from render_jobs where id = :'r2'), '2:' || :'cv', 'render v2 of the same creative');
select claim_render_job('w1', 60, array['carousel']::render_output_type[]);
select save_render((:'rr'::jsonb ->> 'next_job_id')::uuid, 'w1', :'r2', pg_temp.slides(:'p', :'r2', 3)) as s2 \gset
select is((select status from render_jobs where id = :'r1'), 'outdated', 'v1 render is outdated once v2 exists');

-- Publishing needs the approved media
select throws_ok(format($$select create_publishing_job(%L, %L, %L, 'instagram', 'c', '{}', null, 'pub-1')$$, :'admin', :'p', (:'rr'::jsonb ->> 'approval_id')), 'P0001', null,
  'no publishing package before media approval');
select record_approval(:'reviewer', 'media_manifest', :'r2', 2, (:'s2'::jsonb ->> 'manifest_hash'), 'approved') as ap \gset
select is((select string_agg(distinct status, ',') from media_assets where render_job_id = :'r2'), 'approved', 'approved files are marked');
select is((select status from content_projects where id = :'p'), 'ready_to_publish'::project_status, 'approved media → ready to publish');
select throws_ok(format($$select create_publishing_job(%L, %L, %L, 'instagram', 'c', '{}', null, 'pub-r')$$, :'reviewer', :'p', (:'ap'::jsonb ->> 'approval_id')), 'P0001', null,
  'reviewers cannot prepare publishing');
select create_publishing_job(:'admin', :'p', (:'ap'::jsonb ->> 'approval_id')::uuid, 'instagram', 'Caption', '{#a,#b}', null, 'pub-1') as pj \gset
select is((select status || ':' || manifest_hash from publishing_jobs where id = (:'pj'::jsonb ->> 'publishing_job_id')::uuid), 'ready:' || (:'s2'::jsonb ->> 'manifest_hash'),
  'publishing package carries the approved manifest');
select is(create_publishing_job(:'admin', :'p', (:'ap'::jsonb ->> 'approval_id')::uuid, 'instagram', 'Caption', '{}', null, 'pub-1') ->> 'created', 'false',
  'retrying with the same key creates no second package');
select throws_ok(format($$select mark_published_manually(%L, %L, 'javascript:alert(1)')$$, :'admin', (:'pj'::jsonb ->> 'publishing_job_id')), 'P0001', null,
  'the post URL must be https');
select mark_published_manually(:'admin', (:'pj'::jsonb ->> 'publishing_job_id')::uuid, 'https://instagram.com/p/abc');
select is((select status from content_projects where id = :'p'), 'published'::project_status, 'manual confirmation publishes the project');
select is((select count(*)::int from approvals where project_id = :'p' and stage = 'media'), 2, 'both media decisions are recorded');

-- Return to creative, and rejection, on a static post
select pg_temp.approved_creative(:'ws', :'admin', :'reviewer', 'static', 1) as s \gset
select (:'s'::jsonb ->> 'project') as sp, (:'s'::jsonb ->> 'job') as sjob \gset
select id as sr from render_jobs where workflow_job_id = :'sjob' \gset
select claim_render_job('w1', 60, array['png']::render_output_type[]);
select save_render(:'sjob', 'w1', :'sr', jsonb_build_array(jsonb_build_object('asset_type', 'png',
  'storage_path', :'sp' || '/render-' || :'sr' || '/post.png', 'mime_type', 'image/png', 'file_size', 10, 'width', 1080, 'height', 1080,
  'checksum', repeat('e', 64)))) as ss \gset
select record_approval(:'reviewer', 'media_manifest', :'sr', 1, (:'ss'::jsonb ->> 'manifest_hash'), 'changes_requested', 'Logo too small', 'creative') as bc \gset
select is((select status from content_projects where id = :'sp'), 'generating_creative'::project_status, 'return to creative restarts creative generation');
select is((select input_reference ->> 'base_creative_version_id' from workflow_jobs where id = (:'bc'::jsonb ->> 'next_job_id')::uuid), (:'s'::jsonb ->> 'creative'),
  'the revision starts from the rendered creative');

-- Failure sync: a permanent render failure marks the render failed and the project failed.
select pg_temp.approved_creative(:'ws', :'admin', :'reviewer', 'static', 1) as f \gset
select claim_render_job('w1', 60, array['png']::render_output_type[]);
select fail_job((:'f'::jsonb ->> 'job')::uuid, '{"code":"validation_failed","message":"blank"}', false, 'w1');
select is((select status || ':' || (error_details ->> 'code') from render_jobs where workflow_job_id = (:'f'::jsonb ->> 'job')::uuid), 'failed:validation_failed',
  'a permanent failure is recorded on the render');
select is((select status from content_projects where id = (:'f'::jsonb ->> 'project')::uuid), 'failed'::project_status, 'and the project needs attention');
select retry_job((:'f'::jsonb ->> 'job')::uuid, :'admin');
select is((select status from render_jobs where workflow_job_id = (:'f'::jsonb ->> 'job')::uuid), 'queued', 'admin retry requeues the render');

select * from finish();
rollback;
