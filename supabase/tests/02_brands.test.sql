begin;
\ir _helpers.sql
select plan(11);

select tests.create_user('admin@example.com') as admin \gset
select tests.create_user('editor@example.com') as editor \gset
select tests.create_user('outsider@example.com') as outsider \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'editor', 'editor');

select tests.as_user(:'admin');
insert into brands (workspace_id, name, default_language, brand_settings)
values (:'ws', 'Acme', 'ar', '{"voice": "friendly"}') returning id as brand \gset
select is((select settings_version from brands where id = :'brand'), 1, 'new brand starts at settings version 1');

update brands set brand_settings = '{"voice": "bold"}' where id = :'brand';
select is((select settings_version from brands where id = :'brand'), 2, 'changing settings bumps the version');
update brands set description = 'desc' where id = :'brand';
select is((select settings_version from brands where id = :'brand'), 2, 'changing other fields keeps the version');
select results_eq(
  format($$select version, settings ->> 'voice' from brand_settings_history where brand_id = %L order by version$$, :'brand'),
  $$values (1, 'friendly'), (2, 'bold')$$,
  'every settings version is kept in history');
select throws_ok(format($$update brands set settings_version = 9 where id = %L$$, :'brand'),
  '42501', null, 'settings_version cannot be set by hand');
select tests.reset_role();

select throws_ok(format($$update brand_settings_history set settings = '{}' where brand_id = %L$$, :'brand'),
  '42501', null, 'brand history is immutable even for the owner role');

-- Editors read but cannot write brands
select tests.as_user(:'editor');
select is((select count(*)::int from brands), 1, 'editors can read brands of their workspace');
select is_empty(format($$update brands set name = 'Hacked' where id = %L returning id$$, :'brand'),
  'editors cannot update brands (RLS filters the row)');
select throws_ok(format($$insert into brands (workspace_id, name) values (%L, 'Other')$$, :'ws'),
  '42501', null, 'editors cannot create brands');
select tests.reset_role();

select tests.as_user(:'outsider');
select is((select count(*)::int from brands), 0, 'outsiders see no brands');
select is((select count(*)::int from brand_settings_history), 0, 'outsiders see no brand history');
select tests.reset_role();

select * from finish();
rollback;
