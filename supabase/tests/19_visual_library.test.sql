-- P5-T21: visual library — entries, roles, attaching files (replace + status), deletes.
begin;
\ir _helpers.sql
select plan(15);

select tests.create_user('vl-admin@example.com') as admin \gset
select tests.create_user('vl-rev@example.com') as reviewer \gset
select tests.create_user('vl-out@example.com') as outsider \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.add_member(:'ws', :'reviewer', 'reviewer');
insert into brands (workspace_id, name) values (:'ws', 'VL brand') returning id as brand \gset

-- Entries through RLS
select tests.as_user(:'admin');
select lives_ok(format($$insert into library_items (brand_id, code, kind, title, prompt) values (%L, 'BG-60', 'background', 'Warehouse aisle', 'SHOT: aisle')$$, :'brand'),
  'an admin adds a prompt entry');
select is((select status from library_items where code = 'BG-60'), 'to_generate', 'a new entry waits to be generated');
select throws_ok(format($$insert into library_items (brand_id, code, kind, title) values (%L, 'PI-60', 'background', 'x')$$, :'brand'),
  '23514', null, 'the code prefix must match the kind');
select lives_ok($$update library_items set status = 'approved', when_to_use = 'Openers' where code = 'BG-60'$$, 'editors edit and change status');
select throws_ok($$update library_items set code = 'BG-61' where code = 'BG-60'$$, '42501', null, 'the code is fixed');
select tests.reset_role();

select tests.as_user(:'reviewer');
select is((select count(*)::int from library_items), 1, 'members read the library');
update library_items set status = 'retired';
select tests.reset_role();
select is((select status from library_items where code = 'BG-60'), 'approved', 'reviewers cannot edit (RLS: no row matches)');
select tests.as_user(:'outsider');
select is((select count(*)::int from library_items), 0, 'outsiders see nothing');
select tests.reset_role();

-- Files
select id as item from library_items where code = 'BG-60' \gset
update library_items set status = 'to_generate' where id = :'item';
select tests.as_user(:'admin');
select attach_library_file(:'item', 'final', 'backgrounds/final/BG-60.png', :'brand' || '/background/v1/backgrounds/final/BG-60.png',
  'image/png', 100, repeat('a', 64)) as f1 \gset
select is((select status from library_items where id = :'item'), 'generated', 'uploading the image marks it generated');
select attach_library_file(:'item', 'final', 'backgrounds/final/BG-60.png', :'brand' || '/background/v2/backgrounds/final/BG-60.png',
  'image/png', 120, repeat('b', 64)) as f2 \gset
select is((select count(*)::int from brand_assets where metadata ->> 'code' = 'BG-60'), 1, 'a new final replaces the old one');
select tests.reset_role();
select ok(exists (select 1 from private.storage_deletions where path = :'brand' || '/background/v1/backgrounds/final/BG-60.png'),
  '…and its stored file is queued for deletion');
select tests.as_user(:'admin');
select throws_ok(format($$select attach_library_file(%L, 'final', 'backgrounds/final/BG-60.png', 'elsewhere/background/v3/backgrounds/final/BG-60.png', 'image/png', 1, %L)$$,
  :'item', repeat('c', 64)), 'P0001', null, 'files stay under the brand folder');
select tests.reset_role();

select tests.as_user(:'reviewer');
select throws_ok(format($$select attach_library_file(%L, 'raw', 'backgrounds/raw/BG-60.png', %L, 'image/png', 1, %L)$$,
  :'item', :'brand' || '/background/v3/backgrounds/raw/BG-60.png', repeat('d', 64)), 'P0001', null, 'reviewers cannot upload');
select tests.reset_role();

select tests.as_user(:'admin');
select is(delete_library_item(:'item'), 1, 'deleting an entry removes its files');
select tests.reset_role();
select ok(not exists (select 1 from brand_assets where metadata ->> 'code' = 'BG-60'), 'no file row is left');

select * from finish();
rollback;
