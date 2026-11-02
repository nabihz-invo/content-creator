-- P5-T17: approve → download → free storage; request changes → re-upload resets the review; discard removes everything.
begin;
\ir _helpers.sql
select plan(20);

select tests.create_user('ir-admin@example.com') as admin \gset
select tests.create_user('ir-rev@example.com') as reviewer \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');

create function pg_temp.imported(p_ws uuid, p_admin uuid, p_id text)
returns uuid language sql as $$
  select (create_project(p_ws, p_admin, jsonb_build_object('title', p_id, 'original_idea', 'plan row ' || p_id,
    'input_source', 'csv', 'content_type', 'carousel',
    'source_metadata', jsonb_build_object('origin', 'content_plan_import', 'plan_id', p_id)),
    encode(sha256(convert_to(p_id, 'UTF8')), 'hex'), false, 'content-plan:test:' || p_id, false) ->> 'project_id')::uuid;
$$;
create function pg_temp.slide(p uuid, lang text, i int, sum text)
returns jsonb language sql as $$
  select jsonb_build_object('language', lang, 'kind', 'carousel_slide', 'slide_index', i, 'file_name', 'slide-0' || i || '.png',
    'storage_path', p || '/imported/' || lang || '/' || sum || '-slide-' || i || '.png', 'mime_type', 'image/png',
    'file_size', 1000, 'width', 1080, 'height', 1350, 'checksum', rpad(sum, 64, '0'));
$$;

select pg_temp.imported(:'ws', :'admin', 'EDU-01') as p \gset
select save_imported_media(:'p', jsonb_build_array(pg_temp.slide(:'p', 'en', 1, 'e1'), pg_temp.slide(:'p', 'en', 2, 'e2'),
  pg_temp.slide(:'p', 'ar', 1, 'a1'), pg_temp.slide(:'p', 'ar', 2, 'a2')));

-- Review
select throws_ok(format($$select review_imported_post(%L, %L, 'changes_requested', '')$$, :'reviewer', :'p'), 'P0001', null,
  'requesting changes needs a note');
select throws_ok(format($$select review_imported_post(%L, %L, 'maybe')$$, :'reviewer', :'p'), 'P0001', null,
  'only approve or request changes');
select review_imported_post(:'reviewer', :'p', 'changes_requested', 'Slide 2: the Arabic headline is cut off');
select is((select source_metadata -> 'review' ->> 'status' from content_projects where id = :'p'), 'changes_requested',
  'reviewers can request changes');
select save_imported_media(:'p', jsonb_build_array(pg_temp.slide(:'p', 'ar', 2, 'b2')));
select ok((select not (source_metadata ? 'review') from content_projects where id = :'p'), 're-uploading a fixed file puts the post back in review');

-- Approve → download → free storage
select throws_ok(format($$select record_imported_download(%L, %L)$$, :'admin', :'p'), 'P0001', null,
  'downloading to free storage needs an approval');
select review_imported_post(:'reviewer', :'p', 'approved');
select is((select source_metadata -> 'review' ->> 'status' from content_projects where id = :'p'), 'approved', 'the post is approved');
select save_imported_media(:'p', jsonb_build_array(pg_temp.slide(:'p', 'ar', 1, 'a1')));
select is((select source_metadata -> 'review' ->> 'status' from content_projects where id = :'p'), 'approved',
  're-running the import with unchanged files keeps the approval');
select throws_ok(format($$select release_imported_media(%L, %L, 'en')$$, :'admin', :'p'), 'P0001', null,
  'an approved version is not freed before it is downloaded');
select record_imported_download(:'admin', :'p', 'en');
select is(release_imported_media(:'admin', :'p', 'en') ->> 'released', '2', 'the downloaded English version is freed');
select is((select count(*)::int from imported_media where project_id = :'p' and language = 'en'
  and storage_path is null and live_url is null and (metadata ->> 'kept_locally')::boolean), 2,
  'freed rows are marked as kept locally until the link is added');
select is((select count(*)::int from imported_media where project_id = :'p' and language = 'ar' and storage_path is not null), 2,
  'the Arabic version is still stored');
select is((select count(*)::int from private.storage_deletions where path like :'p' || '/imported/en/%' and done_at is null), 2,
  'the English files are queued for removal');
select mark_imported_published(:'admin', :'p', 'https://www.instagram.com/p/edu01-en', null, 'en');
select is((select count(*)::int from imported_media where project_id = :'p' and language = 'en' and live_url = 'https://www.instagram.com/p/edu01-en'), 2,
  'adding the live link later fills the freed rows');
select throws_ok(format($$select release_imported_media(%L, %L)$$, :'reviewer', :'p'), 'P0001', null,
  'reviewers do not free storage');

-- Discard
select pg_temp.imported(:'ws', :'admin', 'EDU-02') as d \gset
select save_imported_media(:'d', jsonb_build_array(pg_temp.slide(:'d', 'en', 1, 'f1'), pg_temp.slide(:'d', 'ar', 1, 'c1')));
select throws_ok(format($$select discard_imported_post(%L, %L, '')$$, :'admin', :'d'), 'P0001', null, 'discarding needs a reason');
select throws_ok(format($$select discard_imported_post(%L, %L, 'off brand')$$, :'reviewer', :'d'), 'P0001', null,
  'reviewers cannot discard');
select is(discard_imported_post(:'admin', :'d', 'Off brand, will be redone in the studio') ->> 'files', '2', 'every file is removed');
select is((select status from content_projects where id = :'d'), 'cancelled'::project_status, 'the project is cancelled');
select is((select count(*)::int from private.storage_deletions where path like :'d' || '/%' and done_at is null), 2,
  'and all its stored files are queued for removal');
select throws_ok(format($$select mark_imported_published(%L, %L, 'https://instagram.com/p/x')$$, :'admin', :'d'), 'P0001', null,
  'a discarded post cannot be published');

select * from finish();
rollback;
