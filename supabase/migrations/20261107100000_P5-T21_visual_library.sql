-- P5-T21: the visual library in the CRM. One catalog entry per code (BG-xx photo backgrounds,
-- GFX-xx graphic backgrounds, PI-xx post images) with the prompt, how/where/when to use it and its
-- status; the files stay in brand_assets (metadata.code = the entry's code, metadata.variant =
-- 'final' or 'raw'). New entries start as a prompt (to_generate); the owner generates the image
-- outside, uploads it (generated), checks it (approved). Agents use only approved/ready entries.
-- Replaces the Background Library / Post Images sheets as the source of truth (imported once).

create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  code text not null check (code ~ '^(BG|GFX|PI)-[0-9]{2,3}$'),
  kind text not null check (kind in ('background', 'graphic', 'post_image')),
  status text not null default 'to_generate'
    check (status in ('to_generate', 'generated', 'approved', 'ready', 'retired')),
  title text not null check (length(trim(title)) between 1 and 300),
  collection text,          -- Set (Office, Presentation…) or theme / feature
  pillar text,
  aspect text,
  reference text,           -- "Generate from (reference image)"
  prompt text,
  negative_prompt text,
  placeholders text,        -- green placeholders → real screen to place (SCR-xx / SIGN-xx)
  use_for text,             -- where to use it
  when_to_use text,         -- agent guide
  fits_posts text,
  story text,
  text_space text,
  on_image_text text,
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, code),
  check ((kind = 'background' and code like 'BG-%') or (kind = 'graphic' and code like 'GFX-%')
      or (kind = 'post_image' and code like 'PI-%'))
);
create index library_items_brand_idx on public.library_items (brand_id, kind, status);
create index brand_assets_code_idx on public.brand_assets (brand_id, (metadata ->> 'code'))
  where metadata ? 'code';

create trigger library_items_updated_at before update on public.library_items
  for each row execute function private.set_updated_at();

alter table public.library_items enable row level security;
create policy library_items_select on public.library_items for select to authenticated
  using (exists (select 1 from public.brands b where b.id = brand_id and private.is_member(b.workspace_id)));
create policy library_items_insert on public.library_items for insert to authenticated
  with check (exists (select 1 from public.brands b where b.id = brand_id
    and private.is_member(b.workspace_id, array['admin', 'editor']::public.member_role[])));
create policy library_items_update on public.library_items for update to authenticated
  using (exists (select 1 from public.brands b where b.id = brand_id
    and private.is_member(b.workspace_id, array['admin', 'editor']::public.member_role[])))
  with check (exists (select 1 from public.brands b where b.id = brand_id
    and private.is_member(b.workspace_id, array['admin', 'editor']::public.member_role[])));
revoke all on public.library_items from anon;
revoke update, delete on public.library_items from authenticated;
grant select, insert on public.library_items to authenticated;
-- The code, kind and brand are fixed once created; everything else can be edited.
grant update (status, title, collection, pillar, aspect, reference, prompt, negative_prompt, placeholders,
  use_for, when_to_use, fits_posts, story, text_space, on_image_text, notes) on public.library_items to authenticated;

create or replace function private.library_role(p_item public.library_items, p_actor uuid, p_roles public.member_role[])
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.member_role;
begin
  select private.member_role(b.workspace_id, p_actor) into r from public.brands b where b.id = p_item.brand_id;
  if r is null or not (r = any (p_roles)) then
    raise exception 'forbidden: requires %', p_roles using errcode = 'P0001', hint = 'forbidden';
  end if;
end;
$$;

-- Records a file already uploaded to brand-assets/<brand_id>/<asset_type>/v<n>/<library_path>
-- for an entry. A background/post image has one final and one raw file: the previous one is
-- removed (its stored file is queued for deletion). A graphic can have several finals (sizes);
-- only a file at the same library path is replaced. Uploading moves `to_generate` to `generated`.
-- p_actor null = the signed-in user (CRM); the service role passes the actor (scripts).
create or replace function public.attach_library_file(
  p_item_id uuid,
  p_variant text,
  p_library_path text,
  p_storage_path text,
  p_mime_type text,
  p_file_size bigint,
  p_checksum text,
  p_actor uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  it public.library_items;
  actor uuid := coalesce(p_actor, auth.uid());
  v integer;
  aid uuid;
begin
  select * into it from public.library_items where id = p_item_id for update;
  if not found then
    raise exception 'not_found: library item %', p_item_id using errcode = 'P0001', hint = 'not_found';
  end if;
  if auth.uid() is not null and p_actor is not null and p_actor <> auth.uid() then
    raise exception 'forbidden: acting for someone else' using errcode = 'P0001', hint = 'forbidden';
  end if;
  if actor is not null then
    perform private.library_role(it, actor, array['admin', 'editor']::public.member_role[]);
  elsif coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'forbidden: sign in' using errcode = 'P0001', hint = 'forbidden';
  end if;
  if p_variant not in ('final', 'raw') then
    raise exception 'validation_failed: variant is final or raw' using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if split_part(p_storage_path, '/', 1) <> it.brand_id::text
     or split_part(p_storage_path, '/', 2) <> it.kind
     or right(p_storage_path, length(p_library_path) + 1) <> '/' || p_library_path then
    raise exception 'validation_failed: storage path must be <brand>/<kind>/v<n>/<library path>'
      using errcode = 'P0001', hint = 'validation_failed';
  end if;
  if p_checksum !~ '^[0-9a-f]{64}$' then
    raise exception 'validation_failed: checksum' using errcode = 'P0001', hint = 'validation_failed';
  end if;

  select coalesce(max(version), 0) + 1 into v from public.brand_assets
  where brand_id = it.brand_id and metadata ->> 'code' = it.code;

  delete from public.brand_assets
  where brand_id = it.brand_id and metadata ->> 'code' = it.code
    and coalesce(metadata ->> 'variant', 'final') = p_variant
    and (it.kind <> 'graphic' or p_variant = 'raw' or metadata ->> 'library_path' = p_library_path);

  insert into public.brand_assets (brand_id, asset_type, name, storage_path, mime_type, file_size, checksum, version, metadata, created_by)
  values (it.brand_id, it.kind::public.brand_asset_type, regexp_replace(p_library_path, '^.*/', ''), p_storage_path,
    p_mime_type, p_file_size, p_checksum, v,
    jsonb_strip_nulls(jsonb_build_object('code', it.code, 'variant', p_variant, 'library_path', p_library_path,
      'set', it.collection, 'aspect', it.aspect, 'use_for', it.use_for, 'when', it.when_to_use,
      'screens', it.placeholders, 'source', 'library')),
    actor)
  returning id into aid;

  if it.status = 'to_generate' then
    update public.library_items set status = 'generated' where id = it.id;
  end if;
  return aid;
end;
$$;

-- Removes one file of an entry (row + stored file).
create or replace function public.delete_library_file(p_asset_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.brand_assets;
  it public.library_items;
begin
  select * into a from public.brand_assets where id = p_asset_id;
  select * into it from public.library_items where brand_id = a.brand_id and code = a.metadata ->> 'code';
  if it.id is null then
    raise exception 'not_found: not a library file' using errcode = 'P0001', hint = 'not_found';
  end if;
  perform private.library_role(it, auth.uid(), array['admin', 'editor']::public.member_role[]);
  delete from public.brand_assets where id = a.id;
end;
$$;

-- Deletes an entry with every file of its code (admins).
create or replace function public.delete_library_item(p_item_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  it public.library_items;
  n integer;
begin
  select * into it from public.library_items where id = p_item_id;
  if not found then
    raise exception 'not_found: library item %', p_item_id using errcode = 'P0001', hint = 'not_found';
  end if;
  perform private.library_role(it, auth.uid(), array['admin']::public.member_role[]);
  delete from public.brand_assets where brand_id = it.brand_id and metadata ->> 'code' = it.code;
  get diagnostics n = row_count;
  delete from public.library_items where id = it.id;
  return n;
end;
$$;

revoke all on function private.library_role(public.library_items, uuid, public.member_role[]) from public;
revoke all on function public.attach_library_file(uuid, text, text, text, text, bigint, text, uuid) from public, anon;
revoke all on function public.delete_library_file(uuid) from public, anon;
revoke all on function public.delete_library_item(uuid) from public, anon;
grant execute on function public.attach_library_file(uuid, text, text, text, text, bigint, text, uuid) to authenticated, service_role;
grant execute on function public.delete_library_file(uuid) to authenticated;
grant execute on function public.delete_library_item(uuid) to authenticated;
