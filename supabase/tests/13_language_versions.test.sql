-- P5-T12: studio creatives render one complete output per language version.
begin;
\ir _helpers.sql
select plan(14);

select tests.create_user('ladmin@example.com') as admin \gset
select tests.create_user('lreviewer@example.com') as reviewer \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');

-- An approved studio creative (EN + AR) of the given format; thumbnails = slides × languages.
create function pg_temp.approved_studio(p_ws uuid, p_admin uuid, p_reviewer uuid, p_format text, p_slides int)
returns jsonb language plpgsql as $$
declare
  p uuid; b uuid; s uuid; j uuid; cv uuid; cfg jsonb; r jsonb;
begin
  p := tests.new_project(p_ws, p_admin, 'studio idea ' || gen_random_uuid(), false);
  insert into content_briefs (project_id, version, brief, content_hash, validation_status) values (p, 1, '{}', repeat('b', 64), 'valid') returning id into b;
  perform set_config('cc.in_transition', 'on', true);
  update content_projects set status = 'script_in_review', current_stage = 'script_review' where id = p;
  perform set_config('cc.in_transition', 'off', true);
  insert into scripts (project_id, brief_id, version, content, content_hash) values (p, b, 1, '{}', repeat('1', 64)) returning id into s;
  j := (record_approval(p_reviewer, 'script', s, 1, repeat('1', 64), 'approved') ->> 'next_job_id')::uuid;
  perform claim_job('creative_worker', 'cw');
  cfg := jsonb_build_object('format', p_format, 'width', 1080, 'height', case when p_format = 'carousel' then 1350 else 1920 end,
    'studio', jsonb_build_object('engine', 'studio-1', 'languages', jsonb_build_array('en', 'ar')),
    'thumbnails', (select coalesce(jsonb_agg(jsonb_build_object('name', 'slide-' || i)), '[]') from generate_series(1, p_slides * 2) i));
  cv := (save_creative_version(j, p, s, 1, 1, 'https://github.com/org/content-creatives', repeat('a', 40), 'projects/x/v1',
    'previews/x/creative-v1/', cfg, repeat('c', 64), null, 'template') ->> 'creative_version_id')::uuid;
  r := record_approval(p_reviewer, 'creative_version', cv, 1, repeat('c', 64), 'approved');
  return jsonb_build_object('project', p, 'creative', cv, 'job', r ->> 'next_job_id');
end;
$$;

create function pg_temp.slides(p_project uuid, p_render uuid, p_n int, p_lang text)
returns jsonb language sql as $$
  select jsonb_agg(jsonb_build_object('asset_type', 'carousel_slide', 'slide_index', i, 'language', p_lang,
    'storage_path', p_project || '/render-' || p_render || '/slide-' || lpad(i::text, 2, '0') || '_' || upper(coalesce(p_lang, 'x')) || '.png',
    'mime_type', 'image/png', 'file_size', 1000 + i, 'width', 1080, 'height', 1350,
    'checksum', encode(sha256(convert_to(coalesce(p_lang, '') || i, 'UTF8')), 'hex')))
  from generate_series(1, p_n) i;
$$;

create function pg_temp.video(p_project uuid, p_render uuid, p_lang text, p_name text default 'video')
returns jsonb language sql as $$
  select jsonb_build_object('asset_type', 'mp4', 'language', p_lang,
    'storage_path', p_project || '/render-' || p_render || '/' || p_name || '_' || upper(p_lang) || '.mp4',
    'mime_type', 'video/mp4', 'file_size', 500000, 'width', 1080, 'height', 1920, 'duration', 12.4,
    'checksum', encode(sha256(convert_to(p_name || p_lang, 'UTF8')), 'hex'));
$$;

-- Carousel, EN + AR
select pg_temp.approved_studio(:'ws', :'admin', :'reviewer', 'carousel', 2) as c \gset
select (:'c'::jsonb ->> 'project') as p, (:'c'::jsonb ->> 'job') as job1 \gset
select id as r1 from render_jobs where workflow_job_id = :'job1' \gset
select is((select (configuration ->> 'slides') || ' ' || (configuration -> 'languages')::text from render_jobs where id = :'r1'),
  '2 ["en", "ar"]', 'the render job expects 2 slides in each of EN and AR');
select is((select id from claim_render_job('w1', 60, array['carousel']::render_output_type[])), :'job1'::uuid, 'the worker claims it');

select throws_ok(format($$select save_render(%L, 'w1', %L, %L)$$, :'job1', :'r1', pg_temp.slides(:'p', :'r1', 2, 'en')), 'P0001', null,
  'a missing language version is refused');
select throws_ok(format($$select save_render(%L, 'w1', %L, %L)$$, :'job1', :'r1',
  pg_temp.slides(:'p', :'r1', 2, 'en') || pg_temp.slides(:'p', :'r1', 1, 'ar')), 'P0001', null,
  'an incomplete language version is refused');
select throws_ok(format($$select save_render(%L, 'w1', %L, %L)$$, :'job1', :'r1',
  pg_temp.slides(:'p', :'r1', 2, 'en') || pg_temp.slides(:'p', :'r1', 2, null)), 'P0001', null,
  'slides without a language are refused when the render expects versions');
select throws_ok(format($$select save_render(%L, 'w1', %L, %L)$$, :'job1', :'r1',
  pg_temp.slides(:'p', :'r1', 2, 'en') || replace(pg_temp.slides(:'p', :'r1', 2, 'ar')::text, '"ar"', '"fr"')::jsonb), 'P0001', null,
  'a language the render does not expect is refused');

select save_render(:'job1', 'w1', :'r1', pg_temp.slides(:'p', :'r1', 2, 'en') || pg_temp.slides(:'p', :'r1', 2, 'ar')) as s1 \gset
select is((:'s1'::jsonb ->> 'files')::int, 4, 'both versions are saved (4 slides)');
select is((select manifest -> 'languages' from render_jobs where id = :'r1'), '["en", "ar"]'::jsonb, 'the manifest lists the languages');
select is((select string_agg((i ->> 'language') || (i ->> 'order'), ',') from render_jobs, jsonb_array_elements(manifest -> 'items') i where id = :'r1'),
  'ar1,ar2,en1,en2', 'manifest items are grouped by language, slides in order');
select is((select count(*)::int from media_assets where render_job_id = :'r1' and language = 'ar'), 2, 'media assets carry their language');

-- Video, EN + AR: one MP4 per version
select pg_temp.approved_studio(:'ws', :'admin', :'reviewer', 'video', 3) as v \gset
select (:'v'::jsonb ->> 'project') as vp, (:'v'::jsonb ->> 'job') as job2 \gset
select id as r2 from render_jobs where workflow_job_id = :'job2' \gset
select is((select id from claim_render_job('w2', 60, array['mp4']::render_output_type[])), :'job2'::uuid, 'an mp4 worker claims the studio video');
select throws_ok(format($$select save_render(%L, 'w2', %L, %L)$$, :'job2', :'r2',
  jsonb_build_array(pg_temp.video(:'vp', :'r2', 'en'), pg_temp.video(:'vp', :'r2', 'en', 'second'), pg_temp.video(:'vp', :'r2', 'ar'))), 'P0001', null,
  'two videos for one version are refused');
select save_render(:'job2', 'w2', :'r2', jsonb_build_array(pg_temp.video(:'vp', :'r2', 'en'), pg_temp.video(:'vp', :'r2', 'ar'))) as s2 \gset
select is((:'s2'::jsonb ->> 'files')::int, 2, 'one MP4 per language version');
select is((select string_agg((i ->> 'language') || ':' || (i ->> 'duration'), ',') from render_jobs, jsonb_array_elements(manifest -> 'items') i where id = :'r2'),
  'ar:12.4,en:12.4', 'the video manifest carries language and duration');

select * from finish();
rollback;
