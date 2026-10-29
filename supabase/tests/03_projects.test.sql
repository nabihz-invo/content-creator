begin;
\ir _helpers.sql
select plan(22);

select tests.create_user('admin@example.com') as admin \gset
select tests.create_user('reviewer@example.com') as reviewer \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');

-- create_project: creates, queues analysis, moves to analyzing
select create_project(:'ws', :'admin',
  '{"original_idea": "Launch post for our new app", "input_source": "manual"}', repeat('a', 64)) as r1 \gset
select is((:'r1'::jsonb ->> 'created')::boolean, true, 'create_project creates a project');
select is(:'r1'::jsonb ->> 'status', 'analyzing', 'new project is queued for analysis');
select (:'r1'::jsonb ->> 'project_id') as p1 \gset
select is((select count(*)::int from workflow_jobs where project_id = :'p1' and stage = 'analysis'), 1, 'one analysis job is created');
select is((select title from content_projects where id = :'p1'), 'Launch post for our new app', 'title defaults to the first line of the idea');
select results_eq(format($$select event_type from workflow_events where project_id = %L order by created_at, event_type$$, :'p1'),
  $$values ('job.created'), ('project.created'), ('status.changed')$$, 'creation is fully audited');

-- dedupe
select create_project(:'ws', :'admin', '{"original_idea": "same idea", "input_source": "manual"}', repeat('a', 64)) as r2 \gset
select is((:'r2'::jsonb ->> 'created')::boolean, false, 'a duplicate idea does not create a project');
select is(:'r2'::jsonb ->> 'duplicate_of', :'p1', 'the duplicate points at the existing project');
select create_project(:'ws', :'admin', '{"original_idea": "same idea", "input_source": "manual"}', repeat('a', 64), true) as r3 \gset
select is(:'r3'::jsonb ->> 'duplicate_of', :'p1', 'allow_duplicate creates a project linked to the original');

-- source idempotency (telegram replays)
select create_project(:'ws', :'admin', '{"original_idea": "tg idea", "input_source": "telegram"}', repeat('b', 64), false, 'telegram:1001') as r4 \gset
select create_project(:'ws', :'admin', '{"original_idea": "tg idea", "input_source": "telegram"}', repeat('b', 64), false, 'telegram:1001') as r5 \gset
select is(:'r5'::jsonb ->> 'project_id', :'r4'::jsonb ->> 'project_id', 'replayed submissions return the same project');
select is((:'r5'::jsonb ->> 'replayed')::boolean, true, 'replay is reported');
select is((select count(*)::int from content_projects where source_idempotency_key = 'telegram:1001'), 1, 'replay creates nothing');

-- authorization & validation inside the RPC
select throws_ok(format($$select create_project(%L, %L, '{"original_idea": "x", "input_source": "manual"}', %L)$$, :'ws', :'reviewer', repeat('c', 64)),
  'P0001', null, 'reviewers cannot create projects');
select throws_ok(format($$select create_project(%L, %L, '{"input_source": "manual"}', %L)$$, :'ws', :'admin', repeat('d', 64)),
  'P0001', null, 'idea or URL is required');

-- status guard
select throws_ok(format($$update content_projects set status = 'published' where id = %L$$, :'p1'),
  '42501', null, 'status cannot be updated directly, even by the table owner');
select throws_ok(format($$select transition_project(%L, 'script_in_review')$$, :'p1'),
  'P0001', null, 'transition_project rejects transitions not in the table');
select throws_ok(format($$select transition_project(%L, 'awaiting_answers', null, '{}', 'new')$$, :'p1'),
  'P0001', null, 'expected_from guards against concurrent transitions');
select is((transition_project(:'p1', 'awaiting_answers')).current_stage, 'questionnaire'::pipeline_stage, 'transition updates current_stage');

-- failure + admin retry returns to the same status only
select transition_project(:'p1', 'failed');
select is((select failed_from_status from content_projects where id = :'p1'), 'awaiting_answers'::project_status, 'failed remembers where it failed');
select throws_ok(format($$select transition_project(%L, 'analyzing')$$, :'p1'),
  'P0001', null, 'retry cannot jump to a different status');
select is((transition_project(:'p1', 'awaiting_answers')).failed_from_status, null, 'retry returns to the failed-from status');

-- users: read via RLS, limited column updates
select tests.as_user(:'reviewer');
select is((select count(*)::int from content_projects), 3, 'members can read projects');
select is_empty(format($$update content_projects set title = 'x' where id = %L returning id$$, :'p1'),
  'reviewers cannot edit projects');
select tests.reset_role();

select * from finish();
rollback;
