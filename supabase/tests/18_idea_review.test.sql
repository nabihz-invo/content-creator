-- P5-T20: idea review — comments for the agent, decline, agent's answer with a revision.
begin;
\ir _helpers.sql
select plan(16);

select tests.create_user('ir-admin@example.com') as admin \gset
select tests.create_user('ir-rev@example.com') as reviewer \gset
select tests.create_user('ir-out@example.com') as outsider \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');

select tests.new_project(:'ws', :'admin', 'Idea: show the low-stock alert in a 15 s reel', false) as p \gset
select tests.new_project(:'ws', :'admin', 'Idea: a carousel about cycle counts', false) as d \gset

-- Comments through RLS
select tests.as_user(:'reviewer');
select lives_ok(format($$insert into idea_comments (project_id, body) values (%L, 'Use the Arabic hook first')$$, :'p'),
  'a member (reviewer too) adds a comment as themselves');
select throws_ok(format($$insert into idea_comments (project_id, author_id, body) values (%L, %L, 'x')$$, :'p', :'admin'),
  '42501', null, 'not in someone else''s name');
select throws_ok(format($$insert into idea_comments (project_id, body, status, addressed_at) values (%L, 'x', 'addressed', now())$$, :'p'),
  '42501', null, 'members cannot close comments');
select throws_ok(format($$update idea_comments set status = 'addressed', addressed_at = now() where project_id = %L$$, :'p'),
  '42501', null, 'members cannot update comments');
select is((select count(*)::int from idea_comments where project_id = :'p'), 1, 'members read the comments');
select tests.reset_role();

select tests.as_user(:'outsider');
select is((select count(*)::int from idea_comments), 0, 'outsiders see no comments');
select throws_ok(format($$insert into idea_comments (project_id, body) values (%L, 'hi')$$, :'p'),
  '42501', null, 'outsiders cannot comment');
select tests.reset_role();

select ok(exists (select 1 from workflow_events where project_id = :'p' and event_type = 'idea.comment_added'),
  'the comment is in the history');

-- The agent answers and revises the idea
select id as c from idea_comments where project_id = :'p' \gset
select throws_ok(format($$select address_idea_comment(%L, '')$$, :'c'), 'P0001', null, 'an answer is required');
select is(address_idea_comment(:'c', 'Hook now opens in Arabic', null, 'Idea: Arabic hook, then the low-stock alert') ->> 'revised',
  'true', 'the agent answers and revises');
select is((select original_idea from content_projects where id = :'p'), 'Idea: Arabic hook, then the low-stock alert', 'the idea text is updated');
select is((select event_data ->> 'previous_idea' from workflow_events where project_id = :'p' and event_type = 'idea.revised'),
  'Idea: show the low-stock alert in a 15 s reel', 'the previous text is kept in the history');
select throws_ok(format($$select address_idea_comment(%L, 'again')$$, :'c'), 'P0001', null, 'a comment is addressed once');

-- Decline
select throws_ok(format($$select decline_idea(%L, %L, 'no')$$, :'reviewer', :'d'), 'P0001', null, 'reviewers cannot decline');
select is(decline_idea(:'admin', :'d') ->> 'status', 'cancelled', 'an editor declines a pending idea (default reason)');
select throws_ok(format($$select decline_idea(%L, %L, 'again')$$, :'admin', :'d'), 'P0001', null,
  'a declined idea is no longer pending');

select * from finish();
rollback;
