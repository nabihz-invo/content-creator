-- P5-T24: users see and change only the brands they are linked to; admins see every brand.
begin;
\ir _helpers.sql
select plan(33);

select tests.create_user('bm-admin@example.com') as admin \gset
select tests.create_user('bm-stacko@example.com') as stacko_ed \gset
select tests.create_user('bm-both@example.com') as both_ed \gset
select tests.create_user('bm-none@example.com') as none_ed \gset
select tests.create_user('bm-rev@example.com') as reviewer \gset
select tests.create_user('bm-new@example.com') as newcomer \gset
select tests.workspace_of(:'admin') as ws \gset

insert into public.brands (workspace_id, name) values (:'ws', 'BM Stacko') returning id as stacko \gset
insert into public.brands (workspace_id, name) values (:'ws', 'BM Aiphin') returning id as aiphin \gset

insert into public.workspace_members (workspace_id, user_id, role) values
  (:'ws', :'stacko_ed', 'editor'), (:'ws', :'both_ed', 'editor'), (:'ws', :'none_ed', 'editor'), (:'ws', :'reviewer', 'reviewer');
insert into public.brand_members (brand_id, user_id) values
  (:'stacko', :'stacko_ed'), (:'stacko', :'both_ed'), (:'aiphin', :'both_ed'), (:'stacko', :'reviewer');

create function tests.new_in(p_ws uuid, p_actor uuid, p_idea text, p_brand uuid)
returns jsonb language sql security definer set search_path = '' as $$
  select public.create_project(p_ws, p_actor,
    jsonb_build_object('original_idea', p_idea, 'input_source', 'manual', 'brand_id', p_brand),
    encode(extensions.digest(p_idea, 'sha256'), 'hex'), false, null, false);
$$;
grant execute on function tests.new_in(uuid, uuid, text, uuid) to authenticated;

select (tests.new_in(:'ws', :'admin', 'BM stacko post', :'stacko') ->> 'project_id') as p_stacko \gset
select (tests.new_in(:'ws', :'admin', 'BM aiphin post', :'aiphin') ->> 'project_id') as p_aiphin \gset
select (tests.new_in(:'ws', :'admin', 'BM no brand', null) ->> 'project_id') as p_none \gset
insert into public.library_items (brand_id, code, kind, title) values (:'aiphin', 'BG-901', 'background', 'Aiphin only');
insert into public.import_batches (id, workspace_id, brand_id, file_name, field_mapping, total_rows)
  values ('00000000-0000-4000-8000-0000000000a1', :'ws', :'aiphin', 'a.csv', '{}', 0);

-- An editor linked to one brand
select tests.as_user(:'stacko_ed');
select results_eq($$select name from public.brands where name like 'BM %' order by name$$,
  array['BM Stacko'], 'one-brand editor sees only that brand');
select is((select count(*)::int from public.content_projects where id = :'p_stacko'), 1, 'sees own brand project');
select is((select count(*)::int from public.content_projects where id = :'p_aiphin'), 0, 'other brand project hidden');
select is((select count(*)::int from public.content_projects where id = :'p_none'), 0, 'project with no brand hidden');
select is((select count(*)::int from public.library_items where code = 'BG-901'), 0, 'other brand library hidden');
select is((select count(*)::int from public.brand_settings_history where brand_id = :'aiphin'), 0, 'other brand settings history hidden');
select is((select count(*)::int from public.brand_settings_history where brand_id = :'stacko'), 1, 'own brand settings history visible');
select is((select count(*)::int from public.import_batches where brand_id = :'aiphin'), 0, 'other brand import hidden');
select ok(not private.can_access_brand(:'aiphin'), 'other brand files blocked');
select ok(private.can_access_brand(:'stacko'), 'own brand files allowed');
select ok(not private.can_access_project_text(:'p_aiphin'), 'other brand previews and media blocked');
select ok(not private.can_access_import_text(:'ws', '00000000-0000-4000-8000-0000000000a1'), 'other brand CSV blocked');

update public.content_projects set title = 'hacked' where id = :'p_aiphin';
select tests.reset_role();
select isnt((select title from public.content_projects where id = :'p_aiphin'), 'hacked', 'cannot edit other brand project');

select tests.as_user(:'stacko_ed');
select throws_ok(format($$update public.content_projects set brand_id = %L where id = %L$$, :'aiphin', :'p_stacko'),
  '42501', null, 'cannot move a project to another brand');
select throws_ok(format($$insert into public.brand_members (brand_id, user_id) values (%L, %L)$$, :'aiphin', :'stacko_ed'),
  '42501', null, 'cannot link self to a brand');
select tests.reset_role();

-- RPCs run as definer, so they need their own check
select throws_ok(format($$select public.decline_idea(%L, %L, 'x')$$, :'stacko_ed', :'p_aiphin'),
  'P0001', null, 'RPC treats other brand project as missing');
select throws_ok(format($$select public.request_analysis(%L, %L)$$, :'p_none', :'stacko_ed'),
  'P0001', null, 'RPC refuses a project with no brand');

-- Creating ideas
select results_eq(format($$select brand_id from public.content_projects where id = %L$$,
  tests.new_in(:'ws', :'stacko_ed', 'BM auto brand', null) ->> 'project_id'),
  array[:'stacko'::uuid], 'one linked brand is used automatically');
select throws_ok(format($$select tests.new_in(%L, %L, 'BM wrong brand', %L)$$, :'ws', :'stacko_ed', :'aiphin'),
  'P0001', null, 'cannot create under another brand');
select throws_ok(format($$select tests.new_in(%L, %L, 'BM several', null)$$, :'ws', :'both_ed'),
  'P0001', 'brand_required: choose a brand for this idea', 'several brands must choose one');
select throws_ok(format($$select tests.new_in(%L, %L, 'BM nothing', null)$$, :'ws', :'none_ed'),
  'P0001', null, 'no linked brand cannot create');

select ok((tests.new_in(:'ws', :'admin', 'BM shared idea', :'stacko') ->> 'created')::boolean, 'idea created under first brand');
select ok((tests.new_in(:'ws', :'admin', 'BM shared idea', :'aiphin') ->> 'created')::boolean, 'same idea is no conflict under second brand');
select ok(not (tests.new_in(:'ws', :'admin', 'BM shared idea', :'aiphin') ->> 'created')::boolean, 'still a duplicate inside one brand');

-- Several brands, reviewer, no brand, admin
select tests.as_user(:'both_ed');
select is((select count(*)::int from public.brands where name like 'BM %'), 2, 'two-brand editor sees both');
select tests.as_user(:'reviewer');
select is((select count(*)::int from public.content_projects where id = :'p_aiphin'), 0, 'reviewer limited too');
select tests.as_user(:'none_ed');
select is((select count(*)::int from public.brands where name like 'BM %'), 0, 'no linked brand sees no brands');
select tests.as_user(:'admin');
select is((select count(*)::int from public.content_projects where id in (:'p_stacko', :'p_aiphin', :'p_none')), 3, 'admin sees every project');
select tests.reset_role();

-- Managing the team
select tests.as_user(:'stacko_ed');
select throws_ok(format($$select * from public.list_workspace_members(%L)$$, :'ws'), 'P0001', null, 'editor cannot list members');
select tests.as_user(:'admin');
select is((select array_length(brand_ids, 1) from public.list_workspace_members(:'ws') where email = 'bm-both@example.com'), 2, 'list shows linked brands');
select throws_ok(format($$select public.add_workspace_member(%L, 'nobody@example.com', 'editor')$$, :'ws'),
  'P0001', 'no_account: nobody@example.com has not signed in yet', 'email without an account is refused');
select is(public.add_workspace_member(:'ws', 'BM-NEW@example.com', 'editor'), :'newcomer'::uuid, 'admin adds a member by email');
insert into public.brand_members (brand_id, user_id) values (:'aiphin', :'newcomer');
delete from public.workspace_members where workspace_id = :'ws' and user_id = :'newcomer';
select tests.reset_role();
select is((select count(*)::int from public.brand_members where user_id = :'newcomer'), 0, 'removing a member drops their brand links');

select * from finish();
rollback;
