begin;
\ir _helpers.sql
select plan(19);

select tests.create_user('admin@example.com') as admin \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.new_project(:'ws', :'admin', 'job test idea', false) as p \gset

-- create_job is idempotent
select (create_job(:'p', 'analysis', 'n8n', 'k1')).id as j1 \gset
select is((create_job(:'p', 'analysis', 'n8n', 'k1')).id, :'j1'::uuid, 'same idempotency key returns the same job');
select is((select count(*)::int from workflow_jobs where idempotency_key = 'k1'), 1, 'no duplicate job rows');

-- claim
select is((select count(*)::int from claim_job('render_worker', 'w1')), 0, 'no job of another kind is claimed');
select is((select id from claim_job('n8n', 'w1')), :'j1'::uuid, 'worker claims the queued job');
select is((select status from workflow_jobs where id = :'j1'), 'running'::job_status, 'claimed job is running');
select is((select attempts from workflow_jobs where id = :'j1'), 1, 'claim counts an attempt');
select is((select count(*)::int from claim_job('n8n', 'w2')), 0, 'a running job with a live lease is not handed out twice');
select ok(heartbeat_job(:'j1', 'w1', 40), 'owner can heartbeat');
select ok(not heartbeat_job(:'j1', 'w2'), 'another worker cannot heartbeat');

-- retryable failure → backoff
select fail_job(:'j1', '{"code": "timeout"}', true, 'w1');
select is((select status from workflow_jobs where id = :'j1'), 'queued'::job_status, 'retryable failure requeues');
select ok((select next_run_at > now() + interval '50 seconds' from workflow_jobs where id = :'j1'), 'requeued job waits for backoff');
select is((select count(*)::int from claim_job('n8n', 'w1')), 0, 'job is not claimable before its backoff');

-- expired lease is recovered
update workflow_jobs set next_run_at = now() where id = :'j1';
select claim_job('n8n', 'w1');
update workflow_jobs set lease_expires_at = now() - interval '1 second' where id = :'j1';
select is(recover_jobs() ->> 'requeued', '1', 'recover_jobs requeues expired leases');

-- permanent failure → needs_attention → project failed
select claim_job('n8n', 'w3');
select fail_job(:'j1', '{"code": "auth"}', false, 'w3');
select is((select status from workflow_jobs where id = :'j1'), 'needs_attention'::job_status, 'permanent failure needs attention');
select is((select status from content_projects where id = :'p'), 'failed'::project_status, 'project is marked failed');

-- admin retry restores the project
select retry_job(:'j1', :'admin');
select is((select status from content_projects where id = :'p'), 'new'::project_status, 'retry_job restores the project status');
select is((select status from workflow_jobs where id = :'j1'), 'queued'::job_status, 'retried job is queued with fresh attempts');

-- complete is idempotent
select claim_job('n8n', 'w4');
select complete_job(:'j1', '{"ok": true}', 'w4');
select lives_ok(format($$select complete_job(%L, '{}')$$, :'j1'), 'completing twice is harmless');

-- users cannot call queue RPCs
select tests.as_user(:'admin');
select throws_ok($$select claim_job('n8n', 'evil')$$, '42501', null, 'authenticated users cannot claim jobs');
select tests.reset_role();

select * from finish();
rollback;
