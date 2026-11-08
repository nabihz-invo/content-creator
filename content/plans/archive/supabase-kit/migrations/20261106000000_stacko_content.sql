-- Stacko content studio: approved ideas → HTML posts → PNG exports
-- Tables: stacko_posts (one row per post or carousel) and stacko_assets (image prompts and source images)

create table if not exists public.stacko_posts (
  id               text primary key,                 -- e.g. 'WHY-3', 'LCH-00', 'NOV-09'
  campaign         text,                             -- e.g. 'Launch · What/Why/Who/How'
  pillar           text,                             -- e.g. 'Visibility', 'Control', 'Automation', 'Conversion'
  question         text check (question in ('what','why','who','how')),  -- launch framework, optional
  format           text not null default 'static' check (format in ('static','carousel','story','square')),
  theme            text not null default 'auto' check (theme in ('dark','light','auto')),
  languages        text not null default 'en' check (languages in ('en','ar','en+ar')),
  layout           text,                             -- archetype from the skill, e.g. 'A8 Product in scene'
  headline         text,
  headline_ar      text,
  support_line     text,
  support_line_ar  text,
  slides           jsonb,                            -- carousels: [{n, headline, headline_ar, support, support_ar, image_assets:[...]}]
  image_assets     text[] default '{}',              -- asset ids from stacko_assets
  caption          text,
  caption_ar       text,
  hashtags         text,
  design_notes     text,                             -- what the idea needs (from the planner)
  status           text not null default 'idea' check (status in (
                     'idea',              -- not approved yet: Claude ignores it
                     'approved',          -- idea approved: Claude designs it
                     'waiting_for_assets',-- Claude requested images (see stacko_assets.status = 'requested')
                     'in_design',
                     'design_review',     -- HTML + preview PNG ready for review
                     'changes_requested', -- reviewer left review_comments: Claude revises
                     'design_approved',   -- reviewer approved the design: Claude exports
                     'exported',          -- final PNG(s) + bundled HTML saved
                     'scheduled','posted','archived')),
  review_comments  text,                             -- reviewer feedback; Claude clears it after applying
  html_files       text[] default '{}',              -- e.g. {'posts/WHY-3.html','posts/WHY-3-AR.html'}
  preview_files    text[] default '{}',              -- previews/*.png
  png_files        text[] default '{}',              -- exports/*.png
  png_urls         text[] default '{}',              -- public URLs in storage bucket 'stacko-posts' (optional)
  platform         text check (platform in ('instagram','linkedin','both')),
  scheduled_at     timestamptz,
  posted_at        timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.stacko_assets (
  id           text primary key,                     -- e.g. 'LCH-08', 'SRC-MAP'
  kind         text not null default 'prompt' check (kind in ('prompt','source')),
  description  text,
  aspect       text default '4:5 vertical',
  prompt       text,                                 -- full image prompt sent to the human (kind = 'prompt')
  file_path    text,                                 -- e.g. 'assets/images/LCH-08.jpg'
  status       text not null default 'requested' check (status in ('requested','received','rejected')),
  used_in      text[] default '{}',                  -- post ids
  usage_notes  text,
  requested_for text,                                -- post id that triggered the request
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.stacko_touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists stacko_posts_touch on public.stacko_posts;
create trigger stacko_posts_touch before update on public.stacko_posts for each row execute function public.stacko_touch_updated_at();
drop trigger if exists stacko_assets_touch on public.stacko_assets;
create trigger stacko_assets_touch before update on public.stacko_assets for each row execute function public.stacko_touch_updated_at();

create index if not exists stacko_posts_status_idx on public.stacko_posts (status);

-- Private by default: only the service role (Claude Code via MCP / server key) and authenticated team members.
alter table public.stacko_posts enable row level security;
alter table public.stacko_assets enable row level security;
drop policy if exists "team read/write posts" on public.stacko_posts;
create policy "team read/write posts" on public.stacko_posts for all to authenticated using (true) with check (true);
drop policy if exists "team read/write assets" on public.stacko_assets;
create policy "team read/write assets" on public.stacko_assets for all to authenticated using (true) with check (true);

-- Optional: public bucket for exported PNGs
insert into storage.buckets (id, name, public) values ('stacko-posts', 'stacko-posts', true)
on conflict (id) do nothing;
