begin;
\ir _helpers.sql
select plan(8);

select tests.create_user('tg@example.com') as u \gset
select tests.create_user('tg2@example.com') as u2 \gset

select create_telegram_link_code(:'u') as code \gset
select matches(:'code'::text, '^[A-Z0-9]{8}$', 'link codes are 8 uppercase characters');
select is(consume_telegram_link_code(lower(:'code'), 555), :'u'::uuid, 'a valid code links the account (case-insensitive)');
select is((select telegram_user_id from profiles where id = :'u'), 555::bigint, 'telegram id stored on the profile');
select is(consume_telegram_link_code(:'code', 555), null, 'a code works only once');

select create_telegram_link_code(:'u2') as code2 \gset
select consume_telegram_link_code(:'code2', 555);
select is((select telegram_user_id from profiles where id = :'u'), null, 'relinking moves the telegram id to the new user');

select create_telegram_link_code(:'u') as code3 \gset
update telegram_link_codes set expires_at = now() - interval '1 minute' where code = :'code3';
select is(consume_telegram_link_code(:'code3', 1), null, 'expired codes are rejected');

select ok(hit_rate_limit('k', 2) and hit_rate_limit('k', 2), 'calls within the limit pass');
select ok(not hit_rate_limit('k', 2), 'the call over the limit is rejected');

select * from finish();
rollback;
