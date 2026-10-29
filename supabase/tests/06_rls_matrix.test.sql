-- Role matrix across every exposed table: non-members see nothing, anon has
-- no access at all, and artifact tables are read-only for every user role.
begin;
\ir _helpers.sql
select plan(36);

select tests.create_user('admin@example.com') as admin \gset
select tests.create_user('editor@example.com') as editor \gset
select tests.create_user('reviewer@example.com') as reviewer \gset
select tests.create_user('outsider@example.com') as outsider \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'editor', 'editor');
select tests.add_member(:'ws', :'reviewer', 'reviewer');
select tests.new_project(:'ws', :'admin', 'rls idea') as p \gset
insert into scripts (project_id, version, content, content_hash) values (:'p', 1, '{}', repeat('1', 64));

-- RLS is enabled on every table in public
select is_empty($$select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity$$, 'RLS is enabled on every public table');

-- Outsider sees nothing anywhere
select tests.as_user(:'outsider');
select is((select count(*)::int from content_projects), 0, 'outsider: projects');
select is((select count(*)::int from workflow_jobs), 0, 'outsider: jobs');
select is((select count(*)::int from workflow_events), 0, 'outsider: events');
select is((select count(*)::int from scripts), 0, 'outsider: scripts');
select is((select count(*)::int from project_status_counts), 0, 'outsider: status counts view');
select tests.reset_role();

-- Members see project data
select tests.as_user(:'reviewer');
select is((select count(*)::int from content_projects), 1, 'reviewer: projects');
select is((select count(*)::int from workflow_jobs), 1, 'reviewer: jobs');
select ok((select count(*)::int from workflow_events) >= 3, 'reviewer: events');
select is((select count(*)::int from scripts), 1, 'reviewer: scripts');
select is((select sum(count)::int from project_status_counts), 1, 'reviewer: status counts view');
select tests.reset_role();

-- Artifact tables are read-only for every user role (writes go through the API)
select tests.as_user(:'admin');
select throws_ok(format($$insert into %I (project_id) values (%L)$$, t, :'p'), '42501', null, 'admin cannot insert into ' || t)
from unnest(array['questionnaires', 'questionnaire_answers', 'content_briefs', 'scripts', 'creative_versions',
                  'render_jobs', 'media_assets', 'approvals', 'publishing_jobs', 'workflow_jobs', 'workflow_events',
                  'project_analyses']) as t;
select throws_ok(format($$insert into content_projects (workspace_id, title, original_idea, input_source, dedupe_hash) values (%L, 't', 'i', 'manual', %L)$$, :'ws', repeat('e', 64)),
  '42501', null, 'projects are created through the API only');
select throws_ok($$select * from idempotency_keys$$, '42501', null, 'idempotency keys are private');
select tests.reset_role();

-- Service-only RPCs
select tests.as_user(:'admin');
select throws_ok(format($$select %s$$, f), '42501', null, 'authenticated cannot call ' || split_part(f, '(', 1))
from unnest(array[
  format('transition_project(%L, ''cancelled'')', :'p'),
  format('create_job(%L, ''analysis'', ''n8n'', ''x'')', :'p'),
  'recover_jobs()',
  format('create_project(%L, %L, ''{}'', %L)', :'ws', :'admin', repeat('f', 64)),
  format('log_event(%L, ''x'')', :'p')
]) as f;
select tests.reset_role();

-- Anonymous has no table access
select tests.as_anon();
select throws_ok(format($$select 1 from %I limit 1$$, t), '42501', null, 'anon cannot read ' || t)
from unnest(array['content_projects', 'brands', 'workspaces', 'profiles']) as t;
select tests.reset_role();

-- Editors manage tags, reviewers cannot
select tests.as_user(:'editor');
select lives_ok(format($$insert into tags (workspace_id, name) values (%L, 'launch')$$, :'ws'), 'editor can create tags');
select tests.reset_role();
select tests.as_user(:'reviewer');
select throws_ok(format($$insert into tags (workspace_id, name) values (%L, 'nope')$$, :'ws'), '42501', null, 'reviewer cannot create tags');
select tests.reset_role();

select * from finish();
rollback;
