/** Row types for the tables the CRM reads (see supabase/migrations). */
import type { ProjectStatus, Stage } from "@cc/shared";

export type MemberRole = "admin" | "editor" | "reviewer";
export type InputSource = "manual" | "telegram" | "csv" | "url";
export type ContentType = "static" | "carousel" | "video";

export interface Profile {
  id: string;
  display_name: string | null;
  locale: "en" | "ar";
  telegram_user_id: number | null;
}

export interface Workspace {
  id: string;
  name: string;
}

export interface WorkspaceMembership {
  workspace_id: string;
  role: MemberRole;
  workspaces: Workspace;
}

export interface Brand {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  default_language: string;
  brand_settings: BrandSettings;
  settings_version: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandSettings {
  voice?: { tone?: string; personality?: string; do?: string[]; dont?: string[] };
  palette?: { name: string; hex: string; role?: string }[];
  typography?: { heading_font?: string; body_font?: string; rules?: string };
  audiences?: { id: string; name: string; description?: string }[];
  platform_rules?: Record<string, string>;
  cta?: { default?: string; preferred?: string[] };
  claims?: { permitted?: string[]; prohibited?: string[]; requires_verification?: string[] };
  languages?: string[];
}

export interface BrandAsset {
  id: string;
  brand_id: string;
  asset_type: "logo" | "font" | "reference_image" | "template" | "other";
  name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  checksum: string | null;
  version: number;
  created_at: string;
}

export interface ContentProject {
  id: string;
  workspace_id: string;
  brand_id: string | null;
  owner_id: string | null;
  title: string;
  original_idea: string;
  input_source: InputSource;
  source_url: string | null;
  source_reference: string | null;
  source_metadata: Record<string, unknown> & {
    extracted?: {
      title: string | null;
      description: string | null;
      text: string;
      final_url: string;
      fetched_at: string;
    };
    /** Rows imported from an existing content plan (P4-T10). */
    origin?: string;
    plan_id?: string;
    plan_status?: string | null;
    publish_date?: string | null;
    format?: string | null;
    sheet?: string;
    source_file?: string;
    published?: { url: string; at: string; confirmed_by: string };
  };
  content_type: ContentType | null;
  objective: string | null;
  audience: string | null;
  language: string | null;
  status: ProjectStatus;
  current_stage: Stage;
  failed_from_status: ProjectStatus | null;
  duplicate_of: string | null;
  import_batch_id: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowEvent {
  id: string;
  project_id: string | null;
  workflow_job_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}

export interface WorkflowJob {
  id: string;
  project_id: string | null;
  stage: Stage;
  kind: string;
  status: "queued" | "running" | "succeeded" | "failed" | "needs_attention" | "cancelled";
  attempts: number;
  max_attempts: number;
  error_details: Record<string, unknown> | null;
  next_run_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
}
