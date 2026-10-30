-- Phase 2 flow: analysis → configuration approval → brief (with clarification) → script → approvals.
begin;
\ir _helpers.sql
select plan(42);

select tests.create_user('admin@example.com') as admin \gset
select tests.create_user('reviewer@example.com') as reviewer \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');
select tests.new_project(:'ws', :'admin', 'stage flow idea') as p \gset
select id as analysis_job from workflow_jobs where project_id = :'p' and stage = 'analysis' \gset

-- start_job claims exactly once
select is((start_job(:'analysis_job', 'w1')).status, 'running'::job_status, 'start_job claims a queued job');
select is((start_job(:'analysis_job', 'w2')).id, null, 'a second delivery of the same job is a no-op');

-- save_analysis creates analysis + questionnaire, completes the job, moves to review
select save_analysis(:'analysis_job', :'p', '{"proposed_format":"video","objective":"awareness","language":"ar"}',
  '{"schema_version":1,"questions":[]}', 'claude-opus-5-5', 'analysis.v1') as r \gset
select (:'r'::jsonb ->> 'questionnaire_id') as q1 \gset
select is((select status from content_projects where id = :'p'), 'awaiting_answers'::project_status, 'project waits for the configuration review');
select is((select status from workflow_jobs where id = :'analysis_job'), 'succeeded'::job_status, 'analysis job completed atomically');
select is((select content_type from content_projects where id = :'p'), 'video'::content_type, 'proposed format fills the empty content type');
select throws_ok(format($$select save_analysis(%L, %L, '{}', '{}', 'm', 'v')$$, :'analysis_job', :'p'), 'P0001', null,
  'a replayed analysis cannot write a second version');
select is((select count(*)::int from workflow_jobs where project_id = :'p' and stage in ('brief', 'script')), 0,
  'no brief or script job exists before the configuration is approved');

-- drafts
select lives_ok(format($$select save_answers_draft(%L, %L, '{"q_format":"video"}', %L)$$, :'p', :'q1', :'admin'), 'editor saves a draft');
select lives_ok(format($$select save_answers_draft(%L, %L, '{"q_format":"static"}', %L)$$, :'p', :'q1', :'admin'), 'saving again updates the same draft');
select is((select count(*)::int from questionnaire_answers where questionnaire_id = :'q1' and is_draft), 1, 'one draft per questionnaire');
select throws_ok(format($$select save_answers_draft(%L, %L, '{}', %L)$$, :'p', :'q1', :'reviewer'), 'P0001', null, 'reviewers cannot edit the configuration');

-- approving the configuration
select throws_ok(format($$select submit_answers(%L, %L, '{}', %L, %L)$$, :'p', :'q1', repeat('a', 64), :'reviewer'), 'P0001', null,
  'reviewers cannot approve the configuration');
select submit_answers(:'p', :'q1', '{"q_format":"video"}', repeat('a', 64), :'admin') as s \gset
select (:'s'::jsonb ->> 'answers_id') as ans1 \gset
select (:'s'::jsonb ->> 'job_id') as brief_job \gset
select is((select status from content_projects where id = :'p'), 'validating_answers'::project_status, 'approval starts the brief');
select is((select count(*)::int from questionnaire_answers where questionnaire_id = :'q1' and is_draft), 0, 'the draft is consumed');
select results_eq(format($$select stage::text, artifact_type, artifact_id, decision::text from approvals where project_id = %L$$, :'p'),
  format($$values ('config', 'questionnaire_answers', %L::uuid, 'approved')$$, :'ans1'), 'the configuration approval is recorded');
select throws_ok(format($$update questionnaire_answers set answers = '{}' where id = %L$$, :'ans1'), '42501', null, 'approved answers are immutable');

-- brief asks for clarification
select start_job(:'brief_job', 'w1');
select save_brief(:'brief_job', :'p', :'ans1', null, repeat('b', 64), 'needs_clarification', '{"contradictions":[]}',
  '{"schema_version":1,"kind":"clarification","questions":[]}', 'm', 'brief.v1') as b \gset
select (:'b'::jsonb ->> 'questionnaire_id') as qc \gset
select is((select status from content_projects where id = :'p'), 'needs_clarification'::project_status, 'missing facts pause the project');
select is((select count(*)::int from workflow_jobs where project_id = :'p' and stage = 'script'), 0, 'still no script job while information is missing');
select throws_ok(format($$select submit_answers(%L, %L, '{}', %L, %L)$$, :'p', :'qc', repeat('c', 64), :'reviewer'), 'P0001', null,
  'reviewers cannot answer clarification questions');
select submit_answers(:'p', :'qc', '{"q_custom_city":"Riyadh"}', repeat('c', 64), :'admin') as s2 \gset
select is((select status from content_projects where id = :'p'), 'validating_answers'::project_status, 'clarification answers restart the brief');

-- brief ready → script job
select (:'s2'::jsonb ->> 'job_id') as brief_job2 \gset
select start_job(:'brief_job2', 'w1');
select save_brief(:'brief_job2', :'p', :'ans1', '{"title":"t"}', repeat('d', 64), 'valid', null, null, 'm', 'brief.v1') as b2 \gset
select (:'b2'::jsonb ->> 'brief_id') as brief_id \gset
select (:'b2'::jsonb ->> 'next_job_id') as script_job \gset
select is((select status from content_projects where id = :'p'), 'generating_script'::project_status, 'valid brief queues the script');
select is((select count(*)::int from content_briefs where project_id = :'p' and status = 'current'), 1, 'only the latest brief is current');

-- script v1
select start_job(:'script_job', 'w1');
select save_script(:'script_job', :'p', :'brief_id', '{"title":"v1"}', repeat('1', 64), 'ai', null, null, 'm', 'script.v1') as sc \gset
select (:'sc'::jsonb ->> 'script_id') as s1 \gset
select is((select status from content_projects where id = :'p'), 'script_in_review'::project_status, 'script v1 is in review');

-- approvals: stale hash, reviewer changes
select throws_ok(format($$select record_approval(%L, 'script', %L, 1, %L, 'approved')$$, :'reviewer', :'s1', repeat('9', 64)), 'P0001', null,
  'approving with a stale hash fails');
select throws_ok(format($$select record_approval(%L, 'script', %L, 1, %L, 'changes_requested', '  ')$$, :'reviewer', :'s1', repeat('1', 64)), 'P0001', null,
  'requesting changes needs a comment');
select record_approval(:'reviewer', 'script', :'s1', 1, repeat('1', 64), 'changes_requested', 'Shorter hook') as ap \gset
select is((select status from scripts where id = :'s1'), 'changes_requested', 'v1 is marked changes_requested');
select is((select status from content_projects where id = :'p'), 'generating_script'::project_status, 'changes go back to the writer');
select ok((select input_reference ? 'approval_id' from workflow_jobs where id = (:'ap'::jsonb ->> 'next_job_id')::uuid), 'the revision job carries the review comment');

-- script v2 (AI revision) then manual edit v3
select (:'ap'::jsonb ->> 'next_job_id') as rev_job \gset
select start_job(:'rev_job', 'w1');
select save_script(:'rev_job', :'p', :'brief_id', '{"title":"v2"}', repeat('2', 64), 'ai', :'s1', null, 'm', 'script.v1') as sc2 \gset
select (:'sc2'::jsonb ->> 'script_id') as s2 \gset
select throws_ok(format($$select save_script(null, %L, %L, '{}', %L, 'manual_edit', %L, %L, null, null)$$, :'p', :'brief_id', repeat('3', 64), :'s2', :'reviewer'), 'P0001', null,
  'reviewers cannot edit scripts');
select save_script(null, :'p', :'brief_id', '{"title":"v3"}', repeat('3', 64), 'manual_edit', :'s2', :'admin', null, null) as sc3 \gset
select (:'sc3'::jsonb ->> 'script_id') as s3 \gset
select is((select status from scripts where id = :'s2'), 'superseded', 'a manual edit supersedes the version in review');
select is((select version from scripts where id = :'s3'), 3, 'manual edit creates version 3');
select throws_ok(format($$select record_approval(%L, 'script', %L, 2, %L, 'approved')$$, :'reviewer', :'s2', repeat('2', 64)), 'P0001', null,
  'a superseded version cannot be approved');

-- approve v3
select record_approval(:'reviewer', 'script', :'s3', 3, repeat('3', 64), 'approved', 'Great') as ap3 \gset
select is((select status from scripts where id = :'s3'), 'approved', 'v3 approved');
select is((select status || ':' || (content->>'title') from scripts where id = :'s1'), 'superseded:v1', 'approving v3 leaves v1 as it was (superseded by v2, content intact)');
select is((select status from content_projects where id = :'p'), 'generating_creative'::project_status, 'approval unlocks creative generation');
select is((select count(*)::int from workflow_jobs where project_id = :'p' and stage = 'creative' and status = 'queued'), 1, 'creative job queued');
select throws_ok(format($$update scripts set content = '{}' where id = %L$$, :'s3'), '42501', null, 'the approved script is immutable');

-- resubmitting the configuration makes downstream work outdated
select save_answers_draft(:'p', :'q1', '{"q_format":"carousel"}', :'admin');
select submit_answers(:'p', :'q1', '{"q_format":"carousel"}', repeat('e', 64), :'admin') as sub3 \gset
select is((select status from scripts where id = :'s3'), 'superseded', 'the approved script is superseded by the new configuration');
select is((select status from workflow_jobs where project_id = :'p' and stage = 'creative'), 'cancelled'::job_status, 'queued creative work is cancelled');
select is((select status from questionnaires where id = :'qc'), 'superseded', 'old clarification rounds are closed');
select is((select count(*)::int from approvals where project_id = :'p' and stage = 'config'), 3, 'every configuration approval is kept');
select is((select status from content_projects where id = :'p'), 'validating_answers'::project_status, 'the new configuration goes to the brief');

select * from finish();
rollback;
