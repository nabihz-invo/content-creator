-- P1-T05: versioned artifact tables, approvals, publishing, integrations config.
-- Rules (docs/WORKFLOW.md §5): versions are immutable, approvals are insert-only,
-- artifacts are never deleted.

-- ---------------------------------------------------------------------------
-- Generic immutability guard.
--   TG_ARGV[0]: comma-separated columns that may still change (e.g. 'status')
--   TG_ARGV[1]: comma-separated statuses during which ANY column may change
--               (e.g. 'generating' while a worker fills in results). Optional.
-- ---------------------------------------------------------------------------
create or replace function private.guard_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  mutable_cols text[] := string_to_array(coalesce(tg_argv[0], ''), ',');
  open_statuses text[] := string_to_array(coalesce(nullif(tg_argv[1], ''), ''), ',');
  old_j jsonb;
  new_j jsonb;
  col text;
begin
  if tg_op = 'DELETE' then
    raise exception '% rows are never deleted', tg_table_name using errcode = 'insufficient_privilege';
  end if;
  old_j := to_jsonb(old);
  new_j := to_jsonb(new);
  if open_statuses is not null and cardinality(open_statuses) > 0
     and (old_j ->> 'status') = any (open_statuses) then
    return new;
  end if;
  foreach col in array mutable_cols || array['updated_at'] loop
    old_j := old_j - col;
    new_j := new_j - col;
  end loop;
  if old_j is distinct from new_j then
    raise exception '% row % is immutable (status %); create a new version instead',
      tg_table_name, old.id, coalesce(to_jsonb(old) ->> 'status', 'n/a')
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

-- Approved rows may only move on to superseded/outdated.
create or replace function private.guard_status_flow()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'approved' and new.status not in ('approved', 'superseded', 'outdated') then
    raise exception '% row % is approved; it can only become superseded/outdated', tg_table_name, old.id
      using errcode = 'insufficient_privilege';
  end if;
  if old.status in ('superseded', 'outdated', 'rejected') and new.status <> old.status then
    raise exception '% row % is % (final)', tg_table_name, old.id, old.status
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Questionnaires and answers
-- ---------------------------------------------------------------------------
create table public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete restrict,
  version integer not null check (version >= 1),
  kind text not null default 'initial' check (kind in ('initial', 'clarification')),
  questions jsonb not null check (jsonb_typeof(questions) = 'object'),
  status text not null default 'awaiting_answers'
    check (status in ('awaiting_answers', 'answered', 'superseded')),
  analysis_id uuid references public.project_analyses (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (project_id, version)
);
create trigger questionnaires_immutable before update or delete on public.questionnaires
  for each row execute function private.guard_immutable('status');

create table public.questionnaire_answers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete restrict,
  questionnaire_id uuid not null references public.questionnaires (id) on delete restrict,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  is_draft boolean not null default true,
  submitted_by uuid references auth.users (id) on delete set null,
  submitted_at timestamptz,
  status text not null default 'current' check (status in ('current', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_draft or submitted_at is not null)
);
create index questionnaire_answers_q_idx on public.questionnaire_answers (questionnaire_id);
-- At most one draft per questionnaire; submitted answers are immutable.
create unique index questionnaire_answers_one_draft on public.questionnaire_answers (questionnaire_id) where is_draft;
create or replace function private.guard_answers()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_draft then return old; end if;
    raise exception 'submitted answers are never deleted' using errcode = 'insufficient_privilege';
  end if;
  if not old.is_draft and (new.answers is distinct from old.answers or new.is_draft
                           or new.questionnaire_id <> old.questionnaire_id) then
    raise exception 'submitted answers are immutable; submit a new set' using errcode = 'insufficient_privilege';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger questionnaire_answers_guard before update or delete on public.questionnaire_answers
  for each row execute function private.guard_answers();

-- ---------------------------------------------------------------------------
-- Briefs
-- ---------------------------------------------------------------------------
create table public.content_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete restrict,
  answers_id uuid references public.questionnaire_answers (id) on delete restrict,
  version integer not null check (version >= 1),
  brief jsonb not null check (jsonb_typeof(brief) = 'object'),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  validation_status text not null check (validation_status in ('valid', 'needs_clarification', 'invalid')),
  validation_details jsonb,
  status text not null default 'current' check (status in ('current', 'superseded')),
  created_at timestamptz not null default now(),
  unique (project_id, version)
);
create trigger content_briefs_immutable before update or delete on public.content_briefs
  for each row execute function private.guard_immutable('status');

-- ---------------------------------------------------------------------------
-- Scripts
-- ---------------------------------------------------------------------------
create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete restrict,
  brief_id uuid references public.content_briefs (id) on delete restrict,
  parent_script_id uuid references public.scripts (id) on delete restrict,
  version integer not null check (version >= 1),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  origin text not null default 'ai' check (origin in ('ai', 'manual_edit', 'section_regeneration')),
  status text not null default 'in_review'
    check (status in ('in_review', 'changes_requested', 'approved', 'rejected', 'superseded')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, version)
);
create index scripts_project_idx on public.scripts (project_id, version desc);
create trigger scripts_immutable before update or delete on public.scripts
  for each row execute function private.guard_immutable('status');
create trigger scripts_status_flow before update on public.scripts
  for each row execute function private.guard_status_flow();

-- ---------------------------------------------------------------------------
-- Creative versions
-- ---------------------------------------------------------------------------
create table public.creative_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete restrict,
  script_id uuid not null references public.scripts (id) on delete restrict,
  brand_settings_version integer,
  version integer not null check (version >= 1),
  repository_url text,
  commit_sha text check (commit_sha is null or commit_sha ~ '^[0-9a-f]{40}$'),
  source_path text,
  preview_path text,
  configuration jsonb not null default '{}'::jsonb,
  content_hash text check (content_hash is null or content_hash ~ '^[0-9a-f]{64}$'),
  revision_notes text,
  status text not null default 'generating'
    check (status in ('generating', 'in_review', 'changes_requested', 'approved', 'rejected', 'superseded', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, version),
  -- Anything past generation must be traceable to a Git revision.
  check (status in ('generating', 'failed') or (commit_sha is not null and content_hash is not null and preview_path is not null))
);
create index creative_versions_script_idx on public.creative_versions (script_id);
create trigger creative_versions_immutable before update or delete on public.creative_versions
  for each row execute function private.guard_immutable('status', 'generating');
create trigger creative_versions_status_flow before update on public.creative_versions
  for each row execute function private.guard_status_flow();

-- ---------------------------------------------------------------------------
-- Render jobs and media
-- ---------------------------------------------------------------------------
create type public.render_output_type as enum ('png', 'carousel', 'mp4');

create table public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete restrict,
  creative_version_id uuid not null references public.creative_versions (id) on delete restrict,
  workflow_job_id uuid references public.workflow_jobs (id) on delete restrict,
  output_type public.render_output_type not null,
  configuration jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'outdated')),
  progress integer not null default 0 check (progress between 0 and 100),
  attempts integer not null default 0,
  idempotency_key text not null unique,
  error_details jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index render_jobs_creative_idx on public.render_jobs (creative_version_id);
create index render_jobs_project_idx on public.render_jobs (project_id, created_at desc);
create trigger render_jobs_updated_at before update on public.render_jobs
  for each row execute function private.set_updated_at();
create trigger render_jobs_no_delete before delete on public.render_jobs
  for each row execute function private.forbid_mutation();

create type public.media_asset_type as enum ('png', 'carousel_slide', 'mp4', 'thumbnail', 'contact_sheet', 'manifest');

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete restrict,
  render_job_id uuid not null references public.render_jobs (id) on delete restrict,
  creative_version_id uuid not null references public.creative_versions (id) on delete restrict,
  asset_type public.media_asset_type not null,
  slide_index integer check (slide_index >= 1),
  storage_path text not null unique,
  mime_type text not null,
  file_size bigint not null check (file_size >= 0),
  width integer check (width > 0),
  height integer check (height > 0),
  duration numeric(10, 3) check (duration >= 0),
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'outdated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((asset_type = 'carousel_slide') = (slide_index is not null))
);
create index media_assets_render_idx on public.media_assets (render_job_id);
create index media_assets_project_idx on public.media_assets (project_id, created_at desc);
create unique index media_assets_slide_unique on public.media_assets (render_job_id, slide_index) where slide_index is not null;
create trigger media_assets_immutable before update or delete on public.media_assets
  for each row execute function private.guard_immutable('status');
create trigger media_assets_status_flow before update on public.media_assets
  for each row execute function private.guard_status_flow();

-- ---------------------------------------------------------------------------
-- Approvals (insert-only; written by record_approval() in P2-T08)
-- ---------------------------------------------------------------------------
create type public.approval_stage as enum ('script', 'creative', 'media', 'publish');
create type public.approval_decision as enum ('approved', 'changes_requested', 'rejected');

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete restrict,
  stage public.approval_stage not null,
  artifact_type text not null check (artifact_type in ('script', 'creative_version', 'media_manifest', 'publishing_job')),
  artifact_id uuid not null,
  artifact_version integer not null,
  artifact_hash text not null check (artifact_hash ~ '^[0-9a-f]{64}$'),
  decision public.approval_decision not null,
  comment text,
  reviewer_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now()
);
create index approvals_artifact_idx on public.approvals (artifact_type, artifact_id);
create index approvals_project_idx on public.approvals (project_id, created_at);
create trigger approvals_insert_only before update or delete on public.approvals
  for each row execute function private.forbid_mutation();

-- ---------------------------------------------------------------------------
-- Publishing
-- ---------------------------------------------------------------------------
create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  platform text not null check (platform in ('instagram', 'tiktok', 'linkedin', 'x', 'facebook', 'youtube', 'threads', 'other')),
  provider text not null default 'buffer' check (provider in ('buffer', 'direct', 'manual')),
  external_account_id text,
  display_name text not null,
  status text not null default 'active' check (status in ('active', 'disconnected', 'error')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, external_account_id)
);
create trigger connected_accounts_updated_at before update on public.connected_accounts
  for each row execute function private.set_updated_at();

create table public.publishing_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects (id) on delete restrict,
  approval_id uuid not null references public.approvals (id) on delete restrict,
  media_manifest jsonb not null check (jsonb_typeof(media_manifest) = 'object'),
  manifest_hash text not null check (manifest_hash ~ '^[0-9a-f]{64}$'),
  platform text not null,
  connected_account_id uuid references public.connected_accounts (id) on delete restrict,
  caption text,
  hashtags text[] not null default '{}',
  link text,
  scheduled_at timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'ready', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  idempotency_key text not null unique,
  external_post_id text,
  published_url text,
  published_at timestamptz,
  provider_response jsonb,
  error_details jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);
create index publishing_jobs_status_idx on public.publishing_jobs (status, scheduled_at);
create index publishing_jobs_project_idx on public.publishing_jobs (project_id);
create trigger publishing_jobs_updated_at before update on public.publishing_jobs
  for each row execute function private.set_updated_at();

-- A publishing job must point at an approved media approval for the same
-- project and manifest; the manifest it carries can never change afterwards.
create or replace function private.guard_publishing_job()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  appr public.approvals;
begin
  if tg_op = 'UPDATE' then
    if new.approval_id <> old.approval_id or new.media_manifest is distinct from old.media_manifest
       or new.manifest_hash <> old.manifest_hash or new.project_id <> old.project_id then
      raise exception 'publishing job media/approval are immutable' using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;
  select * into appr from public.approvals where id = new.approval_id;
  if appr.project_id <> new.project_id or appr.stage <> 'media' or appr.decision <> 'approved'
     or appr.artifact_type <> 'media_manifest' or appr.artifact_hash <> new.manifest_hash then
    raise exception 'approval_required: publishing needs an approved media manifest matching %', new.manifest_hash
      using errcode = 'P0001', hint = 'approval_required';
  end if;
  return new;
end;
$$;
create trigger publishing_jobs_guard before insert or update on public.publishing_jobs
  for each row execute function private.guard_publishing_job();
create trigger publishing_jobs_no_delete before delete on public.publishing_jobs
  for each row execute function private.forbid_mutation();

-- ---------------------------------------------------------------------------
-- AI settings (per workspace, per stage)
-- ---------------------------------------------------------------------------
create table public.ai_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  stage text not null check (stage in ('analysis', 'questionnaire', 'brief', 'clarification', 'script', 'creative')),
  provider text not null default 'anthropic',
  model text not null,
  prompt_version text not null,
  parameters jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, stage)
);
create trigger ai_settings_updated_at before update on public.ai_settings
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: members read; all artifact writes go through the API / RPCs.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'questionnaires', 'questionnaire_answers', 'content_briefs', 'scripts', 'creative_versions',
    'render_jobs', 'media_assets', 'approvals', 'publishing_jobs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (private.can_access_project(project_id))',
      t || '_select', t);
    execute format('revoke insert, update, delete on public.%I from authenticated', t);
  end loop;
end;
$$;

alter table public.connected_accounts enable row level security;
create policy connected_accounts_select on public.connected_accounts for select to authenticated
  using (private.is_member(workspace_id));
create policy connected_accounts_admin_insert on public.connected_accounts for insert to authenticated
  with check (private.is_member(workspace_id, array['admin']::public.member_role[]));
create policy connected_accounts_admin_update on public.connected_accounts for update to authenticated
  using (private.is_member(workspace_id, array['admin']::public.member_role[]))
  with check (private.is_member(workspace_id, array['admin']::public.member_role[]));
revoke delete on public.connected_accounts from authenticated;

alter table public.ai_settings enable row level security;
create policy ai_settings_select on public.ai_settings for select to authenticated
  using (private.is_member(workspace_id));
create policy ai_settings_admin_insert on public.ai_settings for insert to authenticated
  with check (private.is_member(workspace_id, array['admin']::public.member_role[]));
create policy ai_settings_admin_update on public.ai_settings for update to authenticated
  using (private.is_member(workspace_id, array['admin']::public.member_role[]))
  with check (private.is_member(workspace_id, array['admin']::public.member_role[]));
revoke delete on public.ai_settings from authenticated;
