-- P5-T23: every project falls in exactly one inbox stage, and counts follow RLS.
begin;
\ir _helpers.sql
select plan(16);

select tests.create_user('st-admin@example.com') as admin \gset
select tests.create_user('st-out@example.com') as outsider \gset
select tests.workspace_of(:'admin') as ws \gset

create function tests.set_status(p_id uuid, p_status public.project_status)
returns void language plpgsql as $$
begin
  perform set_config('cc.in_transition', 'on', true);
  update public.content_projects set status = p_status where id = p_id;
  perform set_config('cc.in_transition', 'off', true);
end $$;

create function tests.add_file(p_id uuid)
returns void language sql as $$
  insert into public.imported_media (project_id, kind, file_name, storage_path, mime_type, file_size, checksum)
  values (p_id, 'image', 'post.png', 'test/' || p_id || '.png', 'image/png', 1, repeat('a', 64));
$$;

create function tests.add_approval(p_id uuid, p_user uuid, p_decision public.approval_decision)
returns void language sql as $$
  insert into public.approvals (project_id, stage, artifact_type, artifact_id, artifact_version, artifact_hash, decision, reviewer_id)
  values (p_id, 'script', 'script', gen_random_uuid(), 1, repeat('a', 64), p_decision, p_user);
$$;

create function tests.stage_of(p_id uuid)
returns text language sql as $$
  select public.inbox_stage(p) from public.content_projects p where p.id = p_id;
$$;

select tests.new_project(:'ws', :'admin', 'Stage: raw idea', false) as raw \gset
select is(tests.stage_of(:'raw'), 'new', 'a raw idea is new');

select tests.new_project(:'ws', :'admin', 'Stage: finished post', false) as post \gset
select tests.add_file(:'post');
select is(tests.stage_of(:'post'), 'content', 'a new project with finished files is content to approve');

select tests.new_project(:'ws', :'admin', 'Stage: commented idea', false) as noted \gset
insert into idea_comments (project_id, author_id, body) values (:'noted', :'admin', 'Change the hook') returning id as note \gset
select is(tests.stage_of(:'noted'), 'declined', 'an open note sends it to declined');
update idea_comments set status = 'addressed', addressed_at = now() where id = :'note';
select is(tests.stage_of(:'noted'), 'new', 'an answered note brings it back');

select tests.new_project(:'ws', :'admin', 'Stage: sent back post', false) as back \gset
select tests.add_file(:'back');
update content_projects set source_metadata = source_metadata || '{"review": {"status": "changes_requested"}}' where id = :'back';
select is(tests.stage_of(:'back'), 'declined', 'a post sent back is declined');

select tests.new_project(:'ws', :'admin', 'Stage: pipeline', false) as pipe \gset
select tests.set_status(:'pipe', 'generating_script');
select is(tests.stage_of(:'pipe'), 'content', 'first generation is content');
select tests.add_approval(:'pipe', :'admin', 'changes_requested');
select is(tests.stage_of(:'pipe'), 'declined', 'regenerating after changes requested is declined');
select tests.set_status(:'pipe', 'script_in_review');
select is(tests.stage_of(:'pipe'), 'content', 'the new version back in review returns to content');

select tests.set_status(:'pipe', 'media_in_review');
select is(tests.stage_of(:'pipe'), 'media', 'media in review is media');
select tests.set_status(:'pipe', 'scheduled');
select is(tests.stage_of(:'pipe'), 'ready', 'scheduled is ready');
select tests.set_status(:'pipe', 'published');
select is(tests.stage_of(:'pipe'), 'published', 'published is published');
select tests.set_status(:'pipe', 'failed');
select is(tests.stage_of(:'pipe'), 'failed', 'failed stays outside the flow');

select tests.as_user(:'admin');
select is(
  (select jsonb_object_agg(stage, total) from inbox_stage_counts(:'ws')),
  '{"new": 2, "content": 1, "declined": 1, "failed": 1}'::jsonb,
  'a member gets the counts per stage'
);
select is(
  (select inbox_stage from (select inbox_stage(p) as inbox_stage from content_projects p where p.id = :'raw') s),
  'new',
  'a member can read the stage'
);
select tests.reset_role();

select tests.as_user(:'outsider');
select is((select count(*)::int from inbox_stage_counts(:'ws')), 0, 'outsiders get no counts');
select tests.reset_role();

select tests.as_anon();
select throws_ok(format($$select * from inbox_stage_counts(%L)$$, :'ws'), '42501', null, 'anonymous cannot call it');
select tests.reset_role();

select * from finish();
rollback;
