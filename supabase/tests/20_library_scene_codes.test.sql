-- P5-T22: scene / concept / seasonal codes are post images.
begin;
\ir _helpers.sql
select plan(5);
select tests.create_user('vs-admin@example.com') as admin \gset
select tests.workspace_of(:'admin') as ws \gset
insert into brands (workspace_id, name) values (:'ws', 'VS brand') returning id as brand \gset
select tests.as_user(:'admin');
select lives_ok(format($$insert into library_items (brand_id, code, kind, title) values (%L, 'SC-01', 'post_image', 'Van'), (%L, 'OB-01', 'post_image', 'Hourglass'), (%L, 'SE-01', 'post_image', 'Rush'), (%L, 'UI-01', 'post_image', 'Phone frame'), (%L, 'PR-01', 'post_image', 'Presenter')$$, :'brand', :'brand', :'brand', :'brand', :'brand'),
  'SC, OB, SE, UI and PR codes are post images');
select throws_ok(format($$insert into library_items (brand_id, code, kind, title) values (%L, 'SC-02', 'background', 'x')$$, :'brand'),
  '23514', null, 'a scene is not a background');
select throws_ok(format($$insert into library_items (brand_id, code, kind, title) values (%L, 'XX-01', 'post_image', 'x')$$, :'brand'),
  '23514', null, 'unknown prefixes are refused');
select lives_ok(format($$insert into library_items (brand_id, code, kind, title) values (%L, 'PI-99', 'post_image', 'x')$$, :'brand'),
  'PI codes still work');
select throws_ok(format($$insert into library_items (brand_id, code, kind, title) values (%L, 'UI-02', 'graphic', 'x')$$, :'brand'),
  '23514', null, 'a device frame is not a graphic');
select tests.reset_role();
select * from finish();
rollback;
