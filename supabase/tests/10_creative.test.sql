-- Phase 3: creative versions and creative approvals.
begin;
\ir _helpers.sql
select plan(20);

select tests.create_user('cadmin@example.com') as admin \gset
select tests.create_user('creviewer@example.com') as reviewer \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');
select tests.new_project(:'ws', :'admin', 'creative idea', false) as p \gset

-- Fast-forward to an approved script.
insert into content_briefs (project_id, version, brief, content_hash, validation_status) values (:'p', 1, '{}', repeat('b', 64), 'valid') returning id as brief \gset
select set_config('cc.in_transition', 'on', true);
update content_projects set status = 'script_in_review', current_stage = 'script_review' where id = :'p';
select set_config('cc.in_transition', 'off', true);
insert into scripts (project_id, brief_id, version, content, content_hash) values (:'p', :'brief', 1, '{}', repeat('1', 64)) returning id as s1 \gset
select record_approval(:'reviewer', 'script', :'s1', 1, repeat('1', 64), 'approved') as a \gset
select is((select kind from workflow_jobs where id = (:'a'::jsonb ->> 'next_job_id')::uuid), 'creative_worker'::job_kind, 'script approval queues work for the creative worker');
select (:'a'::jsonb ->> 'next_job_id') as job1 \gset

-- Worker claims and saves v1
select is((select id from claim_job('creative_worker', 'cw1')), :'job1'::uuid, 'the creative worker claims the job');
select throws_ok(format($$select save_creative_version(%L, %L, %L, 1, 1, 'repo', null, 'projects/x/v1', 'previews/x', '{}', %L, null, 'template')$$,
  :'job1', :'p', :'s1', repeat('c', 64)), '23514', null, 'a creative without a commit SHA is refused');
select save_creative_version(:'job1', :'p', :'s1', 1, 1, 'https://github.com/org/content-creatives', repeat('a', 40),
  'projects/x/v1', 'previews/x/creative-v1/', '{"files":[]}', repeat('c', 64), null, 'template') as r \gset
select (:'r'::jsonb ->> 'creative_version_id') as c1 \gset
select is((select status from content_projects where id = :'p'), 'creative_in_review'::project_status, 'creative v1 is in review');
select is((select status from workflow_jobs where id = :'job1'), 'succeeded'::job_status, 'creative job completed atomically');
select throws_ok(format($$select save_creative_version(%L, %L, %L, 2, 1, 'r', %L, 'p', 'v', '{}', %L, null, 'template')$$,
  :'job1', :'p', :'s1', repeat('a', 40), repeat('d', 64)), 'P0001', null, 'a replayed job cannot save another version');
select throws_ok(format($$update creative_versions set commit_sha = %L where id = %L$$, repeat('b', 40), :'c1'), '42501', null,
  'the source reference of a version is frozen');

-- Approvals: stale hash, changes requested → revision job from v1
select throws_ok(format($$select record_approval(%L, 'creative_version', %L, 1, %L, 'approved')$$, :'reviewer', :'c1', repeat('0', 64)), 'P0001', null,
  'a stale creative hash is refused');
select record_approval(:'reviewer', 'creative_version', :'c1', 1, repeat('c', 64), 'changes_requested', 'Bigger headline') as cr \gset
select is((select status from creative_versions where id = :'c1'), 'changes_requested', 'v1 marked changes_requested');
select is((select status from content_projects where id = :'p'), 'generating_creative'::project_status, 'back to generation');
select (:'cr'::jsonb ->> 'next_job_id') as job2 \gset
select is((select input_reference ->> 'base_creative_version_id' from workflow_jobs where id = :'job2'), :'c1', 'revision starts from v1');

-- v2, rejected → fresh job
select claim_job('creative_worker', 'cw1');
select save_creative_version(:'job2', :'p', :'s1', 2, 1, 'r', repeat('b', 40), 'projects/x/v2', 'previews/x/creative-v2/', '{}', repeat('e', 64), 'Bigger headline', 'template') as r2 \gset
select (:'r2'::jsonb ->> 'creative_version_id') as c2 \gset
select is((select status from creative_versions where id = :'c1'), 'superseded', 'v1 superseded by v2');
select record_approval(:'reviewer', 'creative_version', :'c2', 2, repeat('e', 64), 'rejected') as rj \gset
select is((select status from creative_versions where id = :'c2'), 'rejected', 'v2 rejected');
select is((select (input_reference ->> 'fresh')::boolean from workflow_jobs where id = (:'rj'::jsonb ->> 'next_job_id')::uuid), true, 'rejection starts a fresh generation');

-- v3 approved → render job
select (:'rj'::jsonb ->> 'next_job_id') as job3 \gset
select claim_job('creative_worker', 'cw1');
select save_creative_version(:'job3', :'p', :'s1', 3, 1, 'r', repeat('c', 40), 'projects/x/v3', 'previews/x/creative-v3/', '{}', repeat('f', 64), null, 'claude-code') as r3 \gset
select (:'r3'::jsonb ->> 'creative_version_id') as c3 \gset
select throws_ok(format($$select record_approval(%L, 'creative_version', %L, 3, %L, 'approved')$$, gen_random_uuid(), :'c3', repeat('f', 64)), 'P0001', null,
  'outsiders cannot approve');
select record_approval(:'reviewer', 'creative_version', :'c3', 3, repeat('f', 64), 'approved', 'Ship it') as ok \gset
select is((select status from creative_versions where id = :'c3'), 'approved', 'v3 approved');
select is((select status from content_projects where id = :'p'), 'rendering'::project_status, 'creative approval moves to rendering');
select is((select kind::text || ':' || stage::text from workflow_jobs where id = (:'ok'::jsonb ->> 'next_job_id')::uuid), 'render_worker:render', 'a render job is queued for Phase 4');
select is((select status || ':' || commit_sha from creative_versions where id = :'c1'), 'superseded:' || repeat('a', 40), 'v1 keeps its own commit');
select is((select count(*)::int from approvals where project_id = :'p' and stage = 'creative'), 3, 'every creative decision is recorded');

select * from finish();
rollback;
