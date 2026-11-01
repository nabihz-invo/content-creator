-- P5-T19: a stage waiting for Claude Code parks its job; the runner claims the request, answers it,
-- and the job wakes up without having spent an attempt.
begin;
\ir _helpers.sql
select plan(10);

select tests.create_user('relay-admin@example.com') as admin \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.new_project(:'ws', :'admin', 'relay test idea', false) as p \gset
select (create_job(:'p', 'analysis', 'n8n', 'relay-1')).id as j \gset

select start_job(:'j', 'edge:test');
insert into ai_requests (job_id, key, stage, params) values (:'j', 'k-1', 'analysis', '{"model":"claude-opus-5-5"}');
select defer_job(:'j', 'edge:test');
select is((select status::text from workflow_jobs where id = :'j'), 'queued', 'the waiting job goes back to the queue');
select is((select attempts from workflow_jobs where id = :'j'), 0, '…without spending an attempt');
select ok((select next_run_at > now() + interval '1 day' from workflow_jobs where id = :'j'), '…and sleeps until its reply arrives');
select ok(exists (select 1 from workflow_events where workflow_job_id = :'j' and event_type = 'job.waiting_for_ai'), 'the wait is in the history');

select (claim_ai_request('runner-1')).id as r \gset
select is((select status from ai_requests where id = :'r'), 'running', 'the runner claims the request');
select is((select count(*)::int from claim_ai_request('runner-2')), 0, 'a claimed request is not handed out twice');

select finish_ai_request(:'r', '{"content":[{"type":"text","text":"{}"}]}', null);
select is((select status from ai_requests where id = :'r'), 'done', 'the reply is stored');
select ok((select next_run_at <= now() from workflow_jobs where id = :'j'), 'the reply wakes the job');

insert into ai_requests (job_id, key, stage, params) values (:'j', 'k-2', 'analysis', '{}');
select (claim_ai_request('runner-1')).id as r2 \gset
select finish_ai_request(:'r2', null, 'Claude Code failed');
select is((select status || ':' || error from ai_requests where id = :'r2'), 'failed:Claude Code failed', 'a failure is stored for the stage to report');

select is(has_table_privilege('authenticated', 'public.ai_requests', 'select'), false, 'users cannot read model requests');

select * from finish();
rollback;
