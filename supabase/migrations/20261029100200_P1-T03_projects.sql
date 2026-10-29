-- P1-T03: content projects, analyses, tags, CSV import batches.
-- Status machine mirrors packages/shared/src/status.ts (kept in sync by a test).

create type public.project_status as enum (
  'new', 'analyzing', 'awaiting_answers', 'validating_answers', 'needs_clarification',
  'generating_script', 'script_in_review', 'generating_creative', 'creative_in_review',
  'rendering', 'media_in_review', 'ready_to_publish', 'scheduled', 'publishing',
  'published', 'failed', 'cancelled'
);

create type public.pipeline_stage as enum (
  'intake', 'analysis', 'questionnaire', 'brief', 'script', 'script_review',
  'creative', 'creative_review', 'render', 'media_review', 'publish'
);

create type public.input_source as enum ('manual', 'telegram', 'csv', 'url');
create type public.content_type as enum ('static', 'carousel', 'video');

-- ---------------------------------------------------------------------------
-- Allowed status transitions (data, not code, so they can be inspected/tested)
-- ---------------------------------------------------------------------------
create table public.project_status_transitions (
  from_status public.project_status not null,
  to_status public.project_status not null,
  trigger_description text not null,
  primary key (from_status, to_status)
);

-- BEGIN GENERATED TRANSITIONS (packages/shared/scripts/transitions-sql.ts)
insert into public.project_status_transitions (from_status, to_status, trigger_description) values
  ('new', 'analyzing', 'analysis job created'),
  ('analyzing', 'awaiting_answers', 'questionnaire saved'),
  ('awaiting_answers', 'analyzing', 'analysis re-run requested'),
  ('awaiting_answers', 'validating_answers', 'answers submitted'),
  ('validating_answers', 'needs_clarification', 'contradictions or missing essentials'),
  ('needs_clarification', 'validating_answers', 'clarification answers submitted'),
  ('validating_answers', 'generating_script', 'brief valid'),
  ('generating_script', 'script_in_review', 'script version saved'),
  ('script_in_review', 'generating_script', 'changes requested, regenerate'),
  ('script_in_review', 'script_in_review', 'manual edit saved as new version'),
  ('script_in_review', 'generating_creative', 'script approved'),
  ('generating_creative', 'creative_in_review', 'creative version recorded'),
  ('creative_in_review', 'generating_creative', 'creative changes requested'),
  ('creative_in_review', 'script_in_review', 'sent back to script'),
  ('creative_in_review', 'rendering', 'creative approved, render job created'),
  ('rendering', 'media_in_review', 'render succeeded and validated'),
  ('media_in_review', 'rendering', 'rerender requested'),
  ('media_in_review', 'generating_creative', 'returned to creative editing'),
  ('media_in_review', 'ready_to_publish', 'media approved'),
  ('ready_to_publish', 'scheduled', 'publishing scheduled, provider confirmed'),
  ('ready_to_publish', 'publishing', 'publish now'),
  ('scheduled', 'publishing', 'schedule fired'),
  ('publishing', 'published', 'provider confirmed publication'),
  ('ready_to_publish', 'published', 'manual publication confirmed by user'),
  ('publishing', 'ready_to_publish', 'publish failed, retryable'),
  ('validating_answers', 'awaiting_answers', 'questionnaire resubmitted'),
  ('needs_clarification', 'awaiting_answers', 'questionnaire resubmitted'),
  ('generating_script', 'awaiting_answers', 'questionnaire resubmitted'),
  ('script_in_review', 'awaiting_answers', 'questionnaire resubmitted'),
  ('generating_creative', 'awaiting_answers', 'questionnaire resubmitted'),
  ('creative_in_review', 'awaiting_answers', 'questionnaire resubmitted'),
  ('rendering', 'awaiting_answers', 'questionnaire resubmitted'),
  ('media_in_review', 'awaiting_answers', 'questionnaire resubmitted'),
  ('new', 'failed', 'job needs attention'),
  ('new', 'cancelled', 'cancelled by user'),
  ('analyzing', 'failed', 'job needs attention'),
  ('analyzing', 'cancelled', 'cancelled by user'),
  ('awaiting_answers', 'failed', 'job needs attention'),
  ('awaiting_answers', 'cancelled', 'cancelled by user'),
  ('validating_answers', 'failed', 'job needs attention'),
  ('validating_answers', 'cancelled', 'cancelled by user'),
  ('needs_clarification', 'failed', 'job needs attention'),
  ('needs_clarification', 'cancelled', 'cancelled by user'),
  ('generating_script', 'failed', 'job needs attention'),
  ('generating_script', 'cancelled', 'cancelled by user'),
  ('script_in_review', 'failed', 'job needs attention'),
  ('script_in_review', 'cancelled', 'cancelled by user'),
  ('generating_creative', 'failed', 'job needs attention'),
  ('generating_creative', 'cancelled', 'cancelled by user'),
  ('creative_in_review', 'failed', 'job needs attention'),
  ('creative_in_review', 'cancelled', 'cancelled by user'),
  ('rendering', 'failed', 'job needs attention'),
  ('rendering', 'cancelled', 'cancelled by user'),
  ('media_in_review', 'failed', 'job needs attention'),
  ('media_in_review', 'cancelled', 'cancelled by user'),
  ('ready_to_publish', 'failed', 'job needs attention'),
  ('ready_to_publish', 'cancelled', 'cancelled by user'),
  ('scheduled', 'failed', 'job needs attention'),
  ('scheduled', 'cancelled', 'cancelled by user'),
  ('publishing', 'failed', 'job needs attention'),
  ('publishing', 'cancelled', 'cancelled by user'),
  ('failed', 'cancelled', 'cancelled by user'),
  ('failed', 'new', 'admin retry'),
  ('failed', 'analyzing', 'admin retry'),
  ('failed', 'awaiting_answers', 'admin retry'),
  ('failed', 'validating_answers', 'admin retry'),
  ('failed', 'needs_clarification', 'admin retry'),
  ('failed', 'generating_script', 'admin retry'),
  ('failed', 'script_in_review', 'admin retry'),
  ('failed', 'generating_creative', 'admin retry'),
  ('failed', 'creative_in_review', 'admin retry'),
  ('failed', 'rendering', 'admin retry'),
  ('failed', 'media_in_review', 'admin retry'),
  ('failed', 'ready_to_publish', 'admin retry'),
  ('failed', 'scheduled', 'admin retry'),
  ('failed', 'publishing', 'admin retry');
-- END GENERATED TRANSITIONS

create or replace function public.stage_for_status(p_status public.project_status)
returns public.pipeline_stage
language sql
immutable
set search_path = ''
as $$
  select case p_status
    when 'new' then 'intake'
    when 'analyzing' then 'analysis'
    when 'awaiting_answers' then 'questionnaire'
    when 'validating_answers' then 'brief'
    when 'needs_clarification' then 'brief'
    when 'generating_script' then 'script'
    when 'script_in_review' then 'script_review'
    when 'generating_creative' then 'creative'
    when 'creative_in_review' then 'creative_review'
    when 'rendering' then 'render'
    when 'media_in_review' then 'media_review'
    when 'ready_to_publish' then 'publish'
    when 'scheduled' then 'publish'
    when 'publishing' then 'publish'
    when 'published' then 'publish'
    else null
  end::public.pipeline_stage;
$$;
grant execute on function public.stage_for_status(public.project_status) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Import batches (CSV)
-- ---------------------------------------------------------------------------
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  brand_id uuid references public.brands (id) on delete restrict,
  file_name text not null,
  storage_path text,
  field_mapping jsonb not null default '{}'::jsonb,
  status text not null default 'processing' check (status in ('processing', 'completed', 'failed')),
  total_rows integer not null default 0,
  created_count integer not null default 0,
  failed_count integer not null default 0,
  duplicate_count integer not null default 0,
  report jsonb not null default '[]'::jsonb check (jsonb_typeof(report) = 'array'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index import_batches_workspace_idx on public.import_batches (workspace_id, created_at desc);
create trigger import_batches_updated_at before update on public.import_batches
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Content projects
-- ---------------------------------------------------------------------------
create table public.content_projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  brand_id uuid references public.brands (id) on delete restrict,
  owner_id uuid references auth.users (id) on delete set null,
  title text not null check (length(trim(title)) between 1 and 200),
  original_idea text not null check (length(original_idea) between 1 and 20000),
  input_source public.input_source not null,
  source_url text check (source_url is null or source_url ~* '^https?://'),
  source_reference text,
  source_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(source_metadata) = 'object'),
  -- Unique per external submission (e.g. telegram:<update_id>, csv:<batch>:<row>)
  -- so retried deliveries never create a second project.
  source_idempotency_key text unique,
  content_type public.content_type,
  objective text,
  audience text,
  language text,
  status public.project_status not null default 'new',
  current_stage public.pipeline_stage not null default 'intake',
  -- Status the project was in when it moved to `failed`; admin retry returns there.
  failed_from_status public.project_status,
  dedupe_hash text not null check (dedupe_hash ~ '^[0-9a-f]{64}$'),
  duplicate_of uuid references public.content_projects (id) on delete set null,
  import_batch_id uuid references public.import_batches (id) on delete set null,
  search tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(original_idea, '') || ' ' || coalesce(source_url, ''))
  ) stored,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_projects_ws_status_idx on public.content_projects (workspace_id, status);
create index content_projects_ws_created_idx on public.content_projects (workspace_id, created_at desc);
create index content_projects_dedupe_idx on public.content_projects (workspace_id, dedupe_hash);
create index content_projects_brand_idx on public.content_projects (brand_id);
create index content_projects_search_idx on public.content_projects using gin (search);

create trigger content_projects_updated_at before update on public.content_projects
  for each row execute function private.set_updated_at();

-- status/current_stage may only change inside transition_project().
create or replace function private.guard_project_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.status is distinct from old.status
      or new.current_stage is distinct from old.current_stage
      or new.failed_from_status is distinct from old.failed_from_status)
     and coalesce(current_setting('cc.in_transition', true), '') <> 'on' then
    raise exception 'content_projects.status can only change through transition_project()'
      using errcode = 'insufficient_privilege';
  end if;
  if new.workspace_id is distinct from old.workspace_id then
    raise exception 'content_projects.workspace_id is immutable' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
create trigger content_projects_guard_status before update on public.content_projects
  for each row execute function private.guard_project_status();

create or replace function private.guard_project_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'new' then
    raise exception 'projects must be created with status new' using errcode = 'check_violation';
  end if;
  new.current_stage := 'intake';
  return new;
end;
$$;
create trigger content_projects_guard_insert before insert on public.content_projects
  for each row execute function private.guard_project_insert();

-- Access helper for all project-scoped tables.
create or replace function private.can_access_project(p_project_id uuid, p_roles public.member_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.content_projects p
    where p.id = p_project_id and private.is_member(p.workspace_id, p_roles)
  );
$$;
revoke all on function private.can_access_project(uuid, public.member_role[]) from public;
grant execute on function private.can_access_project(uuid, public.member_role[]) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Analyses (structured AI output, versioned)
-- ---------------------------------------------------------------------------
create table public.project_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete restrict,
  version integer not null check (version >= 1),
  analysis jsonb not null check (jsonb_typeof(analysis) = 'object'),
  model text,
  prompt_version text,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);
create trigger project_analyses_immutable before update or delete on public.project_analyses
  for each row execute function private.forbid_mutation();

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 50),
  color text,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table public.project_tags (
  project_id uuid not null references public.content_projects (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, tag_id)
);
create index project_tags_tag_idx on public.project_tags (tag_id);

-- Tag and project must belong to the same workspace.
create or replace function private.check_project_tag_workspace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.content_projects p join public.tags t on t.workspace_id = p.workspace_id
    where p.id = new.project_id and t.id = new.tag_id
  ) then
    raise exception 'tag and project belong to different workspaces' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger project_tags_same_workspace before insert or update on public.project_tags
  for each row execute function private.check_project_tag_workspace();

-- ---------------------------------------------------------------------------
-- Status overview (blueprint §4A). security_invoker → RLS of the caller applies.
-- ---------------------------------------------------------------------------
create view public.project_status_counts
with (security_invoker = true) as
  select workspace_id, status, count(*)::integer as count
  from public.content_projects
  group by workspace_id, status;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.project_status_transitions enable row level security;
alter table public.import_batches enable row level security;
alter table public.content_projects enable row level security;
alter table public.project_analyses enable row level security;
alter table public.tags enable row level security;
alter table public.project_tags enable row level security;

create policy transitions_select on public.project_status_transitions for select to authenticated using (true);
revoke insert, update, delete on public.project_status_transitions from authenticated;

create policy import_batches_select on public.import_batches for select to authenticated
  using (private.is_member(workspace_id));
revoke insert, update, delete on public.import_batches from authenticated;

-- Projects are created through the API (dedupe + job creation in one
-- transaction); editors may adjust descriptive fields directly.
create policy projects_select on public.content_projects for select to authenticated
  using (private.is_member(workspace_id));
create policy projects_update_editor on public.content_projects for update to authenticated
  using (private.is_member(workspace_id, array['admin', 'editor']::public.member_role[]))
  with check (private.is_member(workspace_id, array['admin', 'editor']::public.member_role[]));
revoke insert, delete, update on public.content_projects from authenticated;
grant update (title, brand_id, content_type, objective, audience, language) on public.content_projects to authenticated;

create policy analyses_select on public.project_analyses for select to authenticated
  using (private.can_access_project(project_id));
revoke insert, update, delete on public.project_analyses from authenticated;

create policy tags_select on public.tags for select to authenticated
  using (private.is_member(workspace_id));
create policy tags_write on public.tags for insert to authenticated
  with check (private.is_member(workspace_id, array['admin', 'editor']::public.member_role[]));
create policy tags_update on public.tags for update to authenticated
  using (private.is_member(workspace_id, array['admin', 'editor']::public.member_role[]))
  with check (private.is_member(workspace_id, array['admin', 'editor']::public.member_role[]));
create policy tags_delete on public.tags for delete to authenticated
  using (private.is_member(workspace_id, array['admin', 'editor']::public.member_role[]));

create policy project_tags_select on public.project_tags for select to authenticated
  using (private.can_access_project(project_id));
create policy project_tags_insert on public.project_tags for insert to authenticated
  with check (private.can_access_project(project_id, array['admin', 'editor']::public.member_role[]));
create policy project_tags_delete on public.project_tags for delete to authenticated
  using (private.can_access_project(project_id, array['admin', 'editor']::public.member_role[]));
revoke update on public.project_tags from authenticated;

grant select on public.project_status_counts to authenticated;

-- ---------------------------------------------------------------------------
-- Storage for project-scoped buckets.
-- imports/<workspace_id>/<batch_id>/<file>       (editors upload CSVs)
-- previews/<project_id>/...  media/<project_id>/...  (workers write, members read)
-- ---------------------------------------------------------------------------
create or replace function private.can_access_workspace_text(p_workspace_id text, p_roles public.member_role[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id::text = p_workspace_id
      and m.user_id = (select auth.uid())
      and (p_roles is null or m.role = any (p_roles))
  );
$$;
create or replace function private.can_access_project_text(p_project_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.content_projects p
    where p.id::text = p_project_id and private.is_member(p.workspace_id)
  );
$$;
revoke all on function private.can_access_workspace_text(text, public.member_role[]) from public;
revoke all on function private.can_access_project_text(text) from public;
grant execute on function private.can_access_workspace_text(text, public.member_role[]) to authenticated;
grant execute on function private.can_access_project_text(text) to authenticated;

create policy imports_objects_read on storage.objects for select to authenticated
  using (bucket_id = 'imports' and private.can_access_workspace_text((storage.foldername(name))[1]));
create policy imports_objects_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'imports'
    and private.can_access_workspace_text((storage.foldername(name))[1], array['admin', 'editor']::public.member_role[])
  );
create policy project_media_objects_read on storage.objects for select to authenticated
  using (bucket_id in ('previews', 'media') and private.can_access_project_text((storage.foldername(name))[1]));
