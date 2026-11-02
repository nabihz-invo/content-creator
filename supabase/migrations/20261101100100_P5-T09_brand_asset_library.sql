-- P5-T09 (ADR-0009): the brand asset library used by studio creatives.
-- New asset kinds for the library synced from a brand kit; brand_assets.metadata
-- holds the catalog code (BG-01, PI-14, SCR-01, LG-05, MU-01 …), the library path
-- the creative references (/assets/<library_path>) and usage notes.

alter type public.brand_asset_type add value if not exists 'background';
alter type public.brand_asset_type add value if not exists 'post_image';
alter type public.brand_asset_type add value if not exists 'screen';
alter type public.brand_asset_type add value if not exists 'graphic';
alter type public.brand_asset_type add value if not exists 'map_elements';
alter type public.brand_asset_type add value if not exists 'presenter';
alter type public.brand_asset_type add value if not exists 'music';
alter type public.brand_asset_type add value if not exists 'sfx';
alter type public.brand_asset_type add value if not exists 'voice';
alter type public.brand_asset_type add value if not exists 'clip';

-- One current file per library path (older versions stay for history).
create index brand_assets_library_path_idx
  on public.brand_assets (brand_id, (metadata ->> 'library_path'))
  where metadata ? 'library_path';
