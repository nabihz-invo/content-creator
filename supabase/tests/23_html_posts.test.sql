-- P5-T25: finished posts as HTML pages; shared page files; review reset; cleanup of unused files.
begin;
\ir _helpers.sql
select plan(13);

select tests.create_user('html-admin@example.com') as admin \gset
select tests.create_user('html-out@example.com') as outsider \gset
select tests.workspace_of(:'admin') as ws \gset
select tests.default_brand(:'ws') as brand \gset
select tests.new_project(:'ws', :'admin', 'HTML post', false) as post \gset
update content_projects set brand_id = :'brand',
  source_metadata = source_metadata || '{"origin": "content_plan_import", "plan_id": "HTM-01"}' where id = :'post';

-- pages are kind 'html' with a slide number; other kinds keep their rule
select lives_ok($$
  insert into public.imported_media (project_id, language, kind, slide_index, file_name, storage_path, mime_type, file_size, checksum, metadata)
  values ('$$ || :'post' || $$', 'en', 'html', 1, 'slide-01.html', '$$ || :'post' || $$/html/en/aaaa-slide-01.html', 'text/html', 10, repeat('a', 64),
          jsonb_build_object('assets', jsonb_build_array('$$ || :'brand' || $$/html-assets/' || repeat('b', 64) || '/x.jpg')))
$$, 'an html page row can be stored');
select throws_ok($$
  insert into public.imported_media (project_id, language, kind, file_name, storage_path, mime_type, file_size, checksum)
  values ('$$ || :'post' || $$', 'ar', 'html', 'slide.html', 'x/ar.html', 'text/html', 10, repeat('a', 64))
$$, '23514', null, 'an html page needs its slide number');
select throws_ok($$
  insert into public.imported_media (project_id, language, kind, slide_index, file_name, storage_path, mime_type, file_size, checksum)
  values ('$$ || :'post' || $$', 'ar', 'image', 1, 'p.png', 'x/p.png', 'image/png', 10, repeat('a', 64))
$$, '23514', null, 'a single image still has no slide number');

-- save_imported_media takes html pages, and a changed page resets the review
update content_projects set source_metadata = source_metadata || '{"review": {"status": "approved"}}' where id = :'post';
select is((public.save_imported_media(:'post', jsonb_build_array(jsonb_build_object(
  'language', 'en', 'kind', 'html', 'slide_index', 1, 'file_name', 'slide-01.html',
  'storage_path', :'post' || '/html/en/cccc-slide-01.html', 'mime_type', 'text/html', 'file_size', 12,
  'checksum', repeat('c', 64), 'metadata', '{}'::jsonb))) ->> 'replaced')::int, 1, 'save_imported_media replaces a changed page');
select ok(not (select source_metadata ? 'review' from content_projects where id = :'post'), 'a changed page resets the review');
select is((select count(*)::int from private.storage_deletions where path = :'post' || '/html/en/aaaa-slide-01.html' and done_at is null),
  1, 'the replaced page file is queued for removal');

-- shared page files
select lives_ok($$
  insert into public.html_assets (brand_id, checksum, storage_path, mime_type, file_size, source_path)
  values ('$$ || :'brand' || $$', repeat('b', 64), '$$ || :'brand' || $$/html-assets/' || repeat('b', 64) || '/x.jpg', 'image/jpeg', 100, 'assets/x.jpg')
$$, 'a shared page file is recorded');
select throws_ok($$
  insert into public.html_assets (brand_id, checksum, storage_path, mime_type, file_size)
  values ('$$ || :'brand' || $$', repeat('d', 64), 'other/' || repeat('d', 64) || '/y.jpg', 'image/jpeg', 1)
$$, '23514', null, 'shared files live under <brand>/html-assets/');
select throws_ok($$
  insert into public.html_assets (brand_id, checksum, storage_path, mime_type, file_size)
  values ('$$ || :'brand' || $$', repeat('b', 64), '$$ || :'brand' || $$/html-assets/' || repeat('b', 64) || '/z.jpg', 'image/jpeg', 1)
$$, '23505', null, 'one copy per file and brand');

select is((select count(*)::int from public.unused_html_assets(:'brand')), 1, 'a file no page points at is unused');
update public.imported_media set metadata = jsonb_build_object('assets', jsonb_build_array(:'brand' || '/html-assets/' || repeat('b', 64) || '/x.jpg'))
  where project_id = :'post' and kind = 'html';
select is((select count(*)::int from public.unused_html_assets(:'brand')), 0, 'a file a page points at is in use');

-- RLS: members of the brand read the shared files, outsiders do not, nobody writes them
select tests.as_user(:'admin');
select is((select count(*)::int from public.html_assets), 1, 'members see the brand''s shared files');
select tests.as_user(:'outsider');
select is((select count(*)::int from public.html_assets), 0, 'outsiders see none');
select tests.reset_role();

select * from finish();
rollback;
