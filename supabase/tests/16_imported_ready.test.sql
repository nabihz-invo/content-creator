-- P5-T18: approved imported posts are ready to publish, go back to new on changes, and carry a publish date.
begin;
\ir _helpers.sql
select plan(11);

select tests.create_user('rd-admin@example.com') as admin \gset
select tests.create_user('rd-rev@example.com') as reviewer \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');

create function pg_temp.imported(p_ws uuid, p_admin uuid, p_id text)
returns uuid language sql as $$
  select (create_project(p_ws, p_admin, jsonb_build_object('title', p_id, 'original_idea', 'plan row ' || p_id,
    'input_source', 'csv', 'content_type', 'video',
    'source_metadata', jsonb_build_object('origin', 'content_plan_import', 'plan_id', p_id)),
    encode(sha256(convert_to(p_id, 'UTF8')), 'hex'), false, 'content-plan:test:' || p_id, false) ->> 'project_id')::uuid;
$$;
create function pg_temp.video(p uuid, sum text)
returns jsonb language sql as $$
  select jsonb_build_object('language', 'en', 'kind', 'video', 'file_name', 'reel.mp4',
    'storage_path', p || '/imported/en/' || sum || '-reel.mp4', 'mime_type', 'video/mp4',
    'file_size', 5000, 'duration', 29.5, 'checksum', rpad(sum, 64, '0'));
$$;

select pg_temp.imported(:'ws', :'admin', 'EDU-26') as p \gset
select save_imported_media(:'p', jsonb_build_array(pg_temp.video(:'p', 'a1')));

select review_imported_post(:'reviewer', :'p', 'approved');
select is((select status::text from content_projects where id = :'p'), 'ready_to_publish', 'approving moves the post to ready to publish');
select review_imported_post(:'reviewer', :'p', 'changes_requested', 'Animate the screenshots');
select is((select status::text from content_projects where id = :'p'), 'new', 'requesting changes puts it back to new');
select review_imported_post(:'reviewer', :'p', 'approved');
select save_imported_media(:'p', jsonb_build_array(pg_temp.video(:'p', 'b2')));
select is((select status::text from content_projects where id = :'p'), 'new', 'a changed file puts an approved post back to new');
select ok((select not (source_metadata ? 'review') from content_projects where id = :'p'), '…and back in review');

select review_imported_post(:'reviewer', :'p', 'approved');
select mark_imported_published(:'admin', :'p', 'https://www.instagram.com/reel/edu26', null, 'en');
select is((select status::text from content_projects where id = :'p'), 'published', 'the live link publishes a ready post');
select throws_ok(format($$select review_imported_post(%L, %L, 'approved')$$, :'reviewer', :'p'), 'P0001', null,
  'a published post is no longer reviewed');

-- Discard an approved post
select pg_temp.imported(:'ws', :'admin', 'EDU-27') as d \gset
select save_imported_media(:'d', jsonb_build_array(pg_temp.video(:'d', 'c3')));
select review_imported_post(:'reviewer', :'d', 'approved');
select is(discard_imported_post(:'admin', :'d', 'not needed any more') ->> 'status', 'cancelled', 'an approved post can be discarded');

-- Publish date
select set_publish_date(:'admin', :'d', '2026-11-12');
select is((select source_metadata ->> 'publish_date' from content_projects where id = :'d'), '2026-11-12', 'editors set the publish date');
select set_publish_date(:'admin', :'d', null);
select ok((select not (source_metadata ? 'publish_date') from content_projects where id = :'d'), 'a null date clears it');
select throws_ok(format($$select set_publish_date(%L, %L, '2026-11-12')$$, :'reviewer', :'d'), 'P0001', null,
  'reviewers do not change the date');
select ok(exists (select 1 from project_status_transitions where from_status = 'ready_to_publish' and to_status = 'new'),
  'the way back to new is a declared transition');

select * from finish();
rollback;
