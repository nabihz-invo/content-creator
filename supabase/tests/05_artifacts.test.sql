begin;
\ir _helpers.sql
select plan(16);

select tests.create_user('admin@example.com') as admin \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.new_project(:'ws', :'admin', 'artifact idea', false) as p \gset

-- Scripts are immutable versions
insert into scripts (project_id, version, content, content_hash)
values (:'p', 1, '{"hook": "v1"}', repeat('1', 64)) returning id as s1 \gset
select throws_ok(format($$update scripts set content = '{"hook": "edited"}' where id = %L$$, :'s1'),
  '42501', null, 'script content can never be edited in place');
select lives_ok(format($$update scripts set status = 'approved' where id = %L$$, :'s1'), 'script status can move forward');
select throws_ok(format($$update scripts set status = 'in_review' where id = %L$$, :'s1'),
  '42501', null, 'an approved script cannot go back to review');
select lives_ok(format($$update scripts set status = 'superseded' where id = %L$$, :'s1'), 'an approved script can be superseded');
select throws_ok(format($$delete from scripts where id = %L$$, :'s1'), '42501', null, 'scripts are never deleted');
select throws_ok(format($$insert into scripts (project_id, version, content, content_hash) values (%L, 1, '{}', %L)$$, :'p', repeat('2', 64)),
  '23505', null, 'version numbers are unique per project');

-- Creative versions: open while generating, then frozen
insert into scripts (project_id, version, content, content_hash) values (:'p', 2, '{"hook": "v2"}', repeat('3', 64)) returning id as s2 \gset
insert into creative_versions (project_id, script_id, version) values (:'p', :'s2', 1) returning id as c1 \gset
select throws_ok(format($$update creative_versions set status = 'in_review' where id = %L$$, :'c1'),
  '23514', null, 'a creative cannot leave generation without commit, hash and preview');
select lives_ok(format($$update creative_versions set commit_sha = %L, content_hash = %L, preview_path = 'previews/x', status = 'in_review' where id = %L$$,
  repeat('a', 40), repeat('b', 64), :'c1'), 'the worker fills in results while generating');
select throws_ok(format($$update creative_versions set commit_sha = %L where id = %L$$, repeat('c', 40), :'c1'),
  '42501', null, 'creative source reference is frozen after generation');

-- Approvals are insert-only
insert into approvals (project_id, stage, artifact_type, artifact_id, artifact_version, artifact_hash, decision, reviewer_id)
values (:'p', 'script', 'script', :'s2', 2, repeat('3', 64), 'approved', :'admin') returning id as a1 \gset
select throws_ok(format($$update approvals set decision = 'rejected' where id = %L$$, :'a1'), '42501', null, 'approvals cannot be changed');
select throws_ok(format($$delete from approvals where id = %L$$, :'a1'), '42501', null, 'approvals cannot be deleted');

-- Publishing requires an approved media manifest with a matching hash
select throws_ok(format($$insert into publishing_jobs (project_id, approval_id, media_manifest, manifest_hash, platform, idempotency_key)
  values (%L, %L, '{}', %L, 'instagram', 'pub-1')$$, :'p', :'a1', repeat('3', 64)),
  'P0001', null, 'a script approval cannot be used to publish');
insert into approvals (project_id, stage, artifact_type, artifact_id, artifact_version, artifact_hash, decision, reviewer_id)
values (:'p', 'media', 'media_manifest', gen_random_uuid(), 1, repeat('m', 0) || repeat('9', 64), 'approved', :'admin') returning id as a2 \gset
select throws_ok(format($$insert into publishing_jobs (project_id, approval_id, media_manifest, manifest_hash, platform, idempotency_key)
  values (%L, %L, '{}', %L, 'instagram', 'pub-2')$$, :'p', :'a2', repeat('8', 64)),
  'P0001', null, 'the manifest hash must match the approved one');
select lives_ok(format($$insert into publishing_jobs (project_id, approval_id, media_manifest, manifest_hash, platform, idempotency_key)
  values (%L, %L, '{"items": []}', %L, 'instagram', 'pub-3')$$, :'p', :'a2', repeat('9', 64)),
  'publishing with the approved manifest is allowed');
select throws_ok($$update publishing_jobs set media_manifest = '{"items": [1]}' where idempotency_key = 'pub-3'$$,
  '42501', null, 'the manifest of a publishing job cannot be swapped');
select throws_ok($$update publishing_jobs set status = 'published' where idempotency_key = 'pub-3'$$,
  '23514', null, 'published requires an actual publication time');

select * from finish();
rollback;
