-- P4-T10: content-plan imports can be closed as published (with the link) without the pipeline; nothing else can.
begin;
\ir _helpers.sql
select plan(8);

select tests.create_user('imp-admin@example.com') as admin \gset
select tests.create_user('imp-rev@example.com') as reviewer \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');

select (create_project(:'ws', :'admin', jsonb_build_object('title', 'NOV-01 · Can you see all your warehouses?', 'original_idea', 'plan row NOV-01',
  'input_source', 'csv', 'content_type', 'video',
  'source_metadata', jsonb_build_object('origin', 'content_plan_import', 'plan_id', 'NOV-01')),
  repeat('a', 64), false, 'content-plan:test:NOV-01', false) ->> 'project_id') as imported \gset
select tests.new_project(:'ws', :'admin', 'a normal idea', false) as normal \gset

select is(create_project(:'ws', :'admin', jsonb_build_object('title', 'x', 'original_idea', 'plan row NOV-01', 'input_source', 'csv'),
  repeat('a', 64), false, 'content-plan:test:NOV-01', false) ->> 'replayed', 'true', 're-running the import does not duplicate the row');
select throws_ok(format($$select mark_imported_published(%L, %L, 'https://instagram.com/p/x')$$, :'admin', :'normal'), 'P0001', null,
  'a normal idea cannot skip the pipeline');
select throws_ok(format($$select mark_imported_published(%L, %L, 'https://instagram.com/p/x')$$, :'reviewer', :'imported'), 'P0001', null,
  'reviewers cannot mark content published');
select throws_ok(format($$select mark_imported_published(%L, %L, 'http://insecure')$$, :'admin', :'imported'), 'P0001', null,
  'the link must be https');
select mark_imported_published(:'admin', :'imported', 'https://www.instagram.com/p/abc', '2026-11-02 10:00+00');
select is((select status from content_projects where id = :'imported'), 'published'::project_status, 'imported content moves to published');
select is((select source_metadata -> 'published' ->> 'url' from content_projects where id = :'imported'), 'https://www.instagram.com/p/abc', 'the link is recorded');
select is((select count(*)::int from workflow_events where project_id = :'imported' and event_type = 'publishing.published_externally'), 1, 'and audited');
select is(mark_imported_published(:'admin', :'imported', 'https://www.instagram.com/p/abc') ->> 'replayed', 'true', 'marking twice is harmless');
select * from finish();
rollback;
