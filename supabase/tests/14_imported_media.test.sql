-- P5-T15: finished media for imported content; links per language; storage released or removed with its row.
begin;
\ir _helpers.sql
select plan(24);

select tests.create_user('im-admin@example.com') as admin \gset
select tests.create_user('im-rev@example.com') as reviewer \gset
select tests.create_user('im-out@example.com') as outsider \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');

select (create_project(:'ws', :'admin', jsonb_build_object('title', 'EDU-69 · checklist', 'original_idea', 'plan row EDU-69',
  'input_source', 'csv', 'content_type', 'carousel',
  'source_metadata', jsonb_build_object('origin', 'content_plan_import', 'plan_id', 'EDU-69')),
  repeat('a', 64), false, 'content-plan:test:EDU-69', false) ->> 'project_id') as p \gset
select (create_project(:'ws', :'admin', jsonb_build_object('title', 'NOV-10 · reel', 'original_idea', 'plan row NOV-10',
  'input_source', 'csv', 'content_type', 'video',
  'source_metadata', jsonb_build_object('origin', 'content_plan_import', 'plan_id', 'NOV-10')),
  repeat('b', 64), false, 'content-plan:test:NOV-10', false) ->> 'project_id') as live \gset
select tests.new_project(:'ws', :'admin', 'a normal idea', false) as normal \gset

create function pg_temp.slide(p uuid, lang text, i int, sum text, stored boolean default true)
returns jsonb language sql as $$
  select jsonb_build_object('language', lang, 'kind', 'carousel_slide', 'slide_index', i,
    'file_name', 'slide-' || lpad(i::text, 2, '0') || '.png',
    'storage_path', case when stored then p || '/imported/' || lang || '/' || left(sum, 8) || '-slide-' || i || '.png' end,
    'mime_type', 'image/png', 'file_size', 1000 * i, 'width', 1080, 'height', 1350,
    'checksum', rpad(sum, 64, '0'));
$$;

-- Registering files
select throws_ok(format($$select save_imported_media(%L, %L)$$, :'normal', jsonb_build_array(pg_temp.slide(:'normal', 'en', 1, 'aa'))),
  'P0001', null, 'files can only be attached to imported content');
select throws_ok(format($$select save_imported_media(%L, %L)$$, :'p', jsonb_build_array(pg_temp.slide(:'live', 'en', 1, 'aa'))),
  'P0001', null, 'a file must be stored under its own project folder');
select throws_ok(format($$select save_imported_media(%L, %L)$$, :'p', jsonb_build_array(pg_temp.slide(:'p', 'en', 1, 'aa', false))),
  'P0001', null, 'a file that was not uploaded needs a live link');

select is(save_imported_media(:'p', jsonb_build_array(
    pg_temp.slide(:'p', 'en', 1, 'e1'), pg_temp.slide(:'p', 'en', 2, 'e2'),
    pg_temp.slide(:'p', 'ar', 1, 'a1'), pg_temp.slide(:'p', 'ar', 2, 'a2')),
  '{"captions": {"en": "Hello", "ar": "مرحبا"}, "hashtags": "#stock"}') ->> 'new', '4', 'EN and AR slides are saved');
select is((select string_agg(language || slide_index, ',' order by language, slide_index) from imported_media where project_id = :'p'),
  'ar1,ar2,en1,en2', 'each slide keeps its language and order');
select is((select source_metadata -> 'finished' -> 'captions' ->> 'ar' from content_projects where id = :'p'), 'مرحبا',
  'captions are stored as text on the project');
select is(save_imported_media(:'p', jsonb_build_array(pg_temp.slide(:'p', 'en', 1, 'e1'))) ->> 'unchanged', '1',
  're-importing an unchanged file does nothing');

select (select storage_path from imported_media where project_id = :'p' and language = 'en' and slide_index = 2) as old_en2 \gset
select is(save_imported_media(:'p', jsonb_build_array(pg_temp.slide(:'p', 'en', 2, 'f2'))) ->> 'replaced', '1',
  'a changed file replaces the slot');
select is((select count(*)::int from private.storage_deletions where path = :'old_en2' and done_at is null), 1,
  'the replaced file is queued for removal');

-- Links per language
select throws_ok(format($$select release_imported_media(%L, %L, 'en')$$, :'admin', :'p'), 'P0001', null,
  'storage cannot be released before the version is live');
select throws_ok(format($$select mark_imported_published(%L, %L, 'https://www.instagram.com/p/en1', null, 'fr')$$, :'admin', :'p'),
  'P0001', null, 'the link language must be en, ar or both');
select mark_imported_published(:'admin', :'p', 'https://www.instagram.com/p/en1', null, 'en');
select is((select status from content_projects where id = :'p'), 'published'::project_status, 'the first live link publishes the project');
select is(mark_imported_published(:'admin', :'p', 'https://www.instagram.com/p/ar1', null, 'ar') ->> 'replayed', 'false',
  'the Arabic link is added to the published project');
select is((select count(*)::int from content_projects, jsonb_object_keys(source_metadata -> 'published_links') where id = :'p'), 2,
  'both links are kept');

-- Releasing storage
select throws_ok(format($$select release_imported_media(%L, %L)$$, :'reviewer', :'p'), 'P0001', null,
  'reviewers cannot release storage');
select is(release_imported_media(:'admin', :'p', 'en') ->> 'released', '2', 'the English files are released');
select is((select count(*)::int from imported_media where project_id = :'p' and language = 'en'
  and storage_path is null and live_url = 'https://www.instagram.com/p/en1'), 2, 'released rows point at the live post');
select is((select count(*)::int from imported_media where project_id = :'p' and language = 'ar' and storage_path is not null), 2,
  'the Arabic files are still stored');
select is((select count(*)::int from private.storage_deletions where path like :'p' || '/imported/en/%' and done_at is null), 3,
  'the released English files (and the replaced one) are queued for removal');

-- Already live before import: recorded with the link only, nothing uploaded
select mark_imported_published(:'admin', :'live', 'https://www.instagram.com/reel/xyz');
select is(save_imported_media(:'live', jsonb_build_array(jsonb_build_object('language', 'en', 'kind', 'video',
  'file_name', 'NOV-10_reel.mp4', 'storage_path', null, 'mime_type', 'video/mp4', 'file_size', 5620216,
  'duration', 31.2, 'checksum', repeat('c', 64)))) ->> 'link_only', '1', 'a live post is recorded without uploading it');

-- Deleting removes the stored file
select id as ar1 from imported_media where project_id = :'p' and language = 'ar' and slide_index = 1 \gset
select storage_path as ar1_path from imported_media where id = :'ar1' \gset
select throws_ok(format($$select delete_imported_media(%L, %L)$$, :'outsider', :'ar1'), 'P0001', null,
  'outsiders cannot delete files');
select delete_imported_media(:'admin', :'ar1');
select is((select count(*)::int from private.storage_deletions where path = :'ar1_path' and done_at is null), 1,
  'deleting a row queues its file for removal');

-- The cleanup queue
select is((select count(*)::int from claim_storage_deletions(100)), 4, 'the API claims every pending path');
select is(finish_storage_deletions((select array_agg(id) from private.storage_deletions where done_at is null)) ->> 'pending', '0',
  'and marks them done once removed');

select * from finish();
rollback;
