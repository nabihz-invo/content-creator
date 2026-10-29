begin;
\ir _helpers.sql
select plan(12);

select tests.create_user('alice@example.com') as alice \gset
select tests.create_user('bob@example.com') as bob \gset
select tests.workspace_of(:'alice') as ws_a \gset
select tests.workspace_of(:'bob') as ws_b \gset

-- Signup bootstrap
select ok(exists (select 1 from profiles where id = :'alice'), 'signup creates a profile');
select is((select role from workspace_members where workspace_id = :'ws_a' and user_id = :'alice'),
  'admin'::member_role, 'signup creates a personal workspace with the user as admin');

-- Isolation between workspaces
select tests.as_user(:'alice');
select is((select count(*)::int from workspaces), 1, 'a user only sees their own workspaces');
select is((select count(*)::int from profiles), 1, 'a user only sees profiles of co-members');
select tests.reset_role();

-- Admin adds bob as reviewer; now they see each other
select tests.add_member(:'ws_a', :'bob', 'reviewer');
select tests.as_user(:'bob');
select is((select count(*)::int from workspaces), 2, 'a member sees shared workspaces');
select is((select count(*)::int from profiles), 2, 'co-members see each other''s profiles');
select throws_ok(
  format($$insert into workspace_members (workspace_id, user_id, role) values (%L, %L, 'admin')$$, :'ws_a', :'bob'),
  '42501', null, 'a reviewer cannot change membership');
select tests.reset_role();

-- Profile column grants
select tests.as_user(:'alice');
select lives_ok($$update profiles set display_name = 'Alice', locale = 'ar' where id = auth.uid()$$,
  'a user can edit their display name and locale');
select throws_ok($$update profiles set telegram_user_id = 42 where id = auth.uid()$$,
  '42501', null, 'a user cannot link a telegram id directly');
select is((select count(*)::int from workspace_members where workspace_id = :'ws_b'), 0,
  'membership of foreign workspaces is invisible');
select tests.reset_role();

-- Last admin cannot leave
select throws_ok(format($$delete from workspace_members where workspace_id = %L and user_id = %L$$, :'ws_a', :'alice'),
  '23514', null, 'the last admin cannot be removed');
select lives_ok(format($$update workspace_members set role = 'admin' where workspace_id = %L and user_id = %L$$, :'ws_a', :'bob'),
  'a second admin can be added');

select * from finish();
rollback;
