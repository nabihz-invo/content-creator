-- P5-T27: a discard records a reason from the list and an optional comment; the view lists them.
begin;
\ir _helpers.sql
select plan(9);

select tests.create_user('dr-admin@example.com') as admin \gset
select tests.workspace_of(:'admin') as ws \gset

create function pg_temp.post(p_ws uuid, p_admin uuid, p_id text)
returns uuid language plpgsql as $$
declare p uuid;
begin
  p := (create_project(p_ws, p_admin, jsonb_build_object('title', p_id, 'original_idea', 'plan row ' || p_id,
    'input_source', 'csv', 'brand_id', tests.default_brand(p_ws), 'content_type', 'static',
    'source_metadata', jsonb_build_object('origin', 'content_plan_import', 'plan_id', p_id)),
    encode(sha256(convert_to(p_id, 'UTF8')), 'hex'), false, 'content-plan:test:' || p_id, false) ->> 'project_id')::uuid;
  perform save_imported_media(p, jsonb_build_array(jsonb_build_object('language', 'en', 'kind', 'image',
    'file_name', 'post.png', 'storage_path', p || '/imported/en/post.png', 'mime_type', 'image/png',
    'file_size', 1000, 'width', 1080, 'height', 1350, 'checksum', encode(sha256(convert_to('file ' || p_id, 'UTF8')), 'hex'))));
  return p;
end $$;

select pg_temp.post(:'ws', :'admin', 'DR-01') as a \gset
select pg_temp.post(:'ws', :'admin', 'DR-02') as b \gset
select pg_temp.post(:'ws', :'admin', 'DR-03') as c \gset

select throws_ok(format($$select discard_imported_post(%L, %L, null, 'boring')$$, :'admin', :'a'), 'P0001', null,
  'only reasons from the list');
select throws_ok(format($$select discard_imported_post(%L, %L, '', 'other')$$, :'admin', :'a'), 'P0001', null,
  '"other" needs a comment');
select lives_ok(format($$select discard_imported_post(%L, %L, null, 'duplicate')$$, :'admin', :'a'),
  'a listed reason needs no comment');
select discard_imported_post(:'admin', :'b', 'The Arabic headline is too long', 'not_clear');
select discard_imported_post(:'admin', :'c', 'old free text');

select is((select category from discarded_posts where id = :'a'), 'duplicate', 'the reason is stored');
select is((select comment from discarded_posts where id = :'a'), null, 'with no comment');
select is((select array[category, comment] from discarded_posts where id = :'b'),
  array['not_clear', 'The Arabic headline is too long'], 'the comment is kept under the reason');
select is((select category from discarded_posts where id = :'c'), 'other', 'the old call (no reason) counts as other');
select is((select event_data ->> 'category' from workflow_events where project_id = :'b' and event_type = 'imported_post.discarded'),
  'not_clear', 'the history records the reason');
select is((select status::text from content_projects where id = :'b'), 'cancelled', 'the post is cancelled as before');

select * from finish();
rollback;
