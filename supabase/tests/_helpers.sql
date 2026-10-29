-- Shared pgTAP helpers. Included by each test file with `\ir _helpers.sql`
set search_path = public, extensions, tests;
-- inside its transaction, so everything here is rolled back afterwards.
create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

-- Creates an auth user (the signup trigger creates profile + personal workspace).
create or replace function tests.create_user(p_email text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
  values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
          jsonb_build_object('display_name', split_part(p_email, '@', 1)), now(), now());
  return uid;
end $$;

create or replace function tests.workspace_of(p_user uuid)
returns uuid language sql security definer set search_path = '' as $$
  select w.id from public.workspaces w where w.created_by = p_user order by w.created_at limit 1;
$$;

create or replace function tests.add_member(p_workspace uuid, p_user uuid, p_role public.member_role)
returns void language sql security definer set search_path = '' as $$
  insert into public.workspace_members (workspace_id, user_id, role) values (p_workspace, p_user, p_role);
$$;

-- Act as a signed-in user / the service role / anonymous. Call tests.reset_role() to return to postgres.
create or replace function tests.as_user(p_user uuid)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_user::text, true); -- legacy auth.uid() in the bare image
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  execute 'set local role authenticated';
end $$;

create or replace function tests.as_service()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', 'service_role', true);
  execute 'set local role service_role';
end $$;

create or replace function tests.as_anon()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', 'anon', true);
  execute 'set local role anon';
end $$;

create or replace function tests.reset_role()
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.role', '', true);
  execute 'reset role';
end $$;

-- Creates a project through the real RPC (as service role semantics) and returns its id.
create or replace function tests.new_project(p_workspace uuid, p_actor uuid, p_idea text, p_auto boolean default true)
returns uuid language plpgsql security definer set search_path = '' as $$
begin
  return (public.create_project(
    p_workspace, p_actor,
    jsonb_build_object('original_idea', p_idea, 'input_source', 'manual'),
    encode(extensions.digest(p_idea, 'sha256'), 'hex'),
    false, null, p_auto
  ) ->> 'project_id')::uuid;
end $$;

grant execute on all functions in schema tests to anon, authenticated, service_role;
