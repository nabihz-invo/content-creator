begin;
\ir _helpers.sql
select plan(3);
select tests.create_user('notify@example.com') as u \gset
select tests.workspace_of(:'u') as ws \gset
update profiles set telegram_user_id = 4242, locale = 'ar' where id = :'u';
select tests.new_project(:'ws', :'u', 'notify idea', false) as p \gset
select is(notification_target(:'p') ->> 'telegram_user_id', '4242', 'returns the owner telegram id');
select is(notification_target(:'p') ->> 'locale', 'ar', 'returns the owner locale');
select tests.as_user(:'u');
select throws_ok(format($$select notification_target(%L)$$, :'p'), '42501', null, 'users cannot call it');
select tests.reset_role();
select * from finish();
rollback;
