-- P5-T25: finished posts are reviewed as HTML, not as PNG.
--   * A post's pages (one per slide and language) are stored as small self-contained HTML files:
--     imported_media rows with kind 'html' (slide_index 1…n, also for a single image post).
--   * The pages do not carry their pictures. Every file a page uses (photo, background, screen,
--     logo, font, map sprite) is stored once per brand and shared by every post: a file already in
--     the brand library (same checksum) is reused, any other file is kept in html_assets under
--     brand-assets/<brand>/html-assets/<sha256>/<name>. Pages point at them with
--     @@asset:<brand-assets path>@@ tokens that the CRM (and the local renderer) swap for signed URLs.
--   * Review is unchanged (P5-T17/T18): a changed page resets the review, and the approved pages are
--     exactly the rows present at approval. The PNG / MP4 are rendered locally from the approved
--     pages (scripts/html/render-approved.mjs); nothing heavy is uploaded.

alter table public.imported_media drop constraint imported_media_kind_check;
alter table public.imported_media add constraint imported_media_kind_check
  check (kind in ('image', 'carousel_slide', 'video', 'cover', 'document', 'html'));
alter table public.imported_media drop constraint imported_media_check;
alter table public.imported_media add constraint imported_media_slide_check
  check ((kind in ('carousel_slide', 'html')) = (slide_index is not null));

create table public.html_assets (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size >= 0),
  -- where the file lives in the content kit (assets/…, studio/…), for the local renderer and audits
  source_path text,
  created_at timestamptz not null default now(),
  unique (brand_id, checksum),
  check (split_part(storage_path, '/', 1) = brand_id::text and split_part(storage_path, '/', 2) = 'html-assets')
);
create index html_assets_brand_idx on public.html_assets (brand_id);

create trigger html_assets_storage_cleanup after delete on public.html_assets
  for each row execute function private.queue_row_storage_delete('brand-assets');

alter table public.html_assets enable row level security;
create policy html_assets_select on public.html_assets for select to authenticated
  using (private.can_access_brand(brand_id::text));
revoke insert, update, delete on public.html_assets from authenticated;
grant select on public.html_assets to authenticated;
grant all on public.html_assets to service_role;

-- Files no page points at any more (pages replaced or deleted). The publish script removes them.
create or replace function public.unused_html_assets(p_brand_id uuid)
returns table (id uuid, storage_path text, file_size bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.storage_path, a.file_size
  from public.html_assets a
  where a.brand_id = p_brand_id
    and not exists (
      select 1 from public.imported_media m
      where m.kind = 'html' and m.storage_path is not null
        and m.metadata -> 'assets' ? a.storage_path
    );
$$;
revoke all on function public.unused_html_assets(uuid) from public, anon, authenticated;
grant execute on function public.unused_html_assets(uuid) to service_role;
