-- P5-T26: client accounts see only the posts the team approved, for their brands, and can only
-- approve, request changes or comment.
begin;
\ir _helpers.sql
select plan(34);

select tests.create_user('cl-admin@example.com') as admin \gset
-- Created the way the API creates a client account (app_metadata.stacko_client)
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, raw_app_meta_data, created_at, updated_at)
values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cl-client@example.com',
        '{"display_name": "cl-client"}', '{"stacko_client": true}', now(), now())
returning id as client \gset
select tests.workspace_of(:'admin') as ws \gset
select is((select count(*)::int from workspace_members where user_id = :'client'), 0, 'a client account gets no personal workspace');
select tests.add_member(:'ws', :'client', 'client');
-- A second brand the client is not linked to
insert into brands (workspace_id, name) values (:'ws', '__other_brand') returning id as b2 \gset

create function pg_temp.post(p_ws uuid, p_admin uuid, p_id text, p_brand uuid)
returns uuid language sql as $$
  select (create_project(p_ws, p_admin, jsonb_build_object('title', p_id, 'original_idea', 'internal plan notes ' || p_id,
    'input_source', 'csv', 'brand_id', p_brand, 'content_type', 'carousel',
    'source_metadata', jsonb_build_object('origin', 'content_plan_import', 'plan_id', p_id, 'publish_date', '2026-12-01')),
    encode(sha256(convert_to(p_id, 'UTF8')), 'hex'), false, 'content-plan:test:' || p_id, false) ->> 'project_id')::uuid;
$$;
create function pg_temp.page(p uuid, lang text, sum text)
returns jsonb language sql as $$
  select jsonb_build_object('language', lang, 'kind', 'html', 'slide_index', 1, 'file_name', 'page-01.html',
    'storage_path', p || '/html/' || lang || '/' || sum || '.html', 'mime_type', 'text/html',
    'file_size', 1000, 'width', 1080, 'height', 1350, 'checksum', rpad(sum, 64, '0'));
$$;

select pg_temp.post(:'ws', :'admin', 'CL-01', tests.default_brand(:'ws')) as p \gset
select pg_temp.post(:'ws', :'admin', 'CL-02', tests.default_brand(:'ws')) as draft \gset
select pg_temp.post(:'ws', :'admin', 'CL-03', :'b2') as foreign_post \gset
select save_imported_media(:'p', jsonb_build_array(pg_temp.page(:'p', 'en', 'e1'), pg_temp.page(:'p', 'ar', 'a1')));
select save_imported_media(:'draft', jsonb_build_array(pg_temp.page(:'draft', 'en', 'd1')));
select save_imported_media(:'foreign_post', jsonb_build_array(pg_temp.page(:'foreign_post', 'en', 'f1')));
select review_imported_post(:'admin', :'foreign_post', 'approved');
insert into idea_comments (project_id, author_id, body) values (:'p', :'admin', 'internal: check the Arabic headline');

-- Before the team approves, the client sees nothing
select tests.as_user(:'client');
select is((select count(*)::int from client_posts(:'ws')), 0, 'a client sees no post the team has not approved');
select tests.reset_role();
select review_imported_post(:'admin', :'p', 'approved');

-- What the client sees
select tests.as_user(:'client');
select is((select array_agg(id) from client_posts(:'ws')), array[:'p'::uuid], 'the client sees only the approved post of their brand');
select is((select count(*)::int from content_projects), 0, 'but not the post rows (idea text, plan notes, the team''s review note)');
select is((select count(*)::int from imported_media), 2, 'and its pages');
select is((select count(*)::int from brands), 1, 'only their brand');
select is((select count(*)::int from workspaces), 1, 'the workspace (for its name)');
select is((select count(*)::int from workspace_members), 1, 'only their own membership, not the team');
select is((select count(*)::int from profiles), 1, 'only their own profile');
select is((select count(*)::int from idea_comments), 0, 'not the team''s internal notes');
select is((select count(*)::int from workflow_events), 0, 'no workflow history');
select is((select count(*)::int from workflow_jobs), 0, 'no jobs');
select is((select count(*)::int from brand_assets), 0, 'no brand library rows');
select is((select count(*)::int from library_items), 0, 'no visual library');
select is((select count(*)::int from tags), 0, 'no tags');
select is((select count(*)::int from ai_settings), 0, 'no AI settings');
select is((select count(*)::int from inbox_stage_counts(:'ws')), 0, 'no inbox counts');
select ok(private.client_can_see_text(:'p'), 'they can read the post''s stored pages');
select ok(not private.client_can_see_text(:'draft'), 'not a draft''s');
select ok(not private.can_access_project_text(:'p'), 'the team''s storage check does not let them in');

-- Comments
insert into idea_comments (project_id, author_id, body) values (:'p', :'client', 'Can the logo be bigger?');
select is((select count(*)::int from idea_comments), 1, 'they see their own comment');
select throws_ok(format($$insert into idea_comments (project_id, author_id, body) values (%L, %L, 'hi')$$, :'draft', :'client'),
  '42501', null, 'they cannot comment on a post they cannot see');
update content_projects set title = 'changed by client' where id = :'p';
select throws_ok(format($$select add_workspace_member(%L, 'x@example.com', 'editor')$$, :'ws'), 'P0001', null,
  'they cannot add people');
select throws_ok(format($$select list_workspace_members(%L)$$, :'ws'), 'P0001', null, 'or list the team');
select tests.reset_role();
select is((select title from content_projects where id = :'p'), 'CL-01', 'they cannot edit a post');
select is((select count(*)::int from idea_comments where project_id = :'p' and status = 'open'), 2,
  'the client''s comment reaches the team as an open note');

-- Decisions (the API calls these with the signed-in user's id)
select throws_ok(format($$select review_imported_post(%L, %L, 'approved')$$, :'client', :'draft'), 'P0001', null,
  'a client cannot use the team''s review');
select throws_ok(format($$select client_review_post(%L, %L, 'approved')$$, :'admin', :'p'), 'P0001', null,
  'only clients use the client review');
select throws_ok(format($$select client_review_post(%L, %L, 'approved')$$, :'client', :'foreign_post'), 'P0001', null,
  'not on another brand''s post');
select throws_ok(format($$select client_review_post(%L, %L, 'changes_requested', '')$$, :'client', :'p'), 'P0001', null,
  'requesting changes needs a note');
select client_review_post(:'client', :'p', 'approved');
select is((select source_metadata -> 'client_review' ->> 'status' from content_projects where id = :'p'), 'approved',
  'the client approves the post');
select client_review_post(:'client', :'p', 'changes_requested', 'Use the summer photo instead');
select is((select array[status::text, source_metadata -> 'review' ->> 'status', source_metadata -> 'review' ->> 'from']
           from content_projects where id = :'p'), array['new', 'changes_requested', 'client'],
  'requesting changes sends the post back to the team, marked as from the client');
select tests.as_user(:'client');
select is((select count(*)::int from client_posts(:'ws')), 1, 'the client still sees it while it is being revised');
select tests.reset_role();
select save_imported_media(:'p', jsonb_build_array(pg_temp.page(:'p', 'en', 'e2')));
select review_imported_post(:'admin', :'p', 'approved');
select ok((select not (source_metadata ? 'client_review') from content_projects where id = :'p'),
  'the team''s approval of the new version asks the client again');

select * from finish();
rollback;
