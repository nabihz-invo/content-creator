/** Read-side data hooks. Reads go straight to Postgres through RLS; writes that start workflows use lib/api.ts. */
import {
  type Analysis,
  type Answers,
  type Brief,
  OVERVIEW_GROUPS,
  type ProjectStatus,
  type Questionnaire,
  type Script,
} from "@cc/shared";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type {
  Brand,
  BrandAsset,
  ContentProject,
  InputSource,
  Tag,
  WorkflowEvent,
  WorkflowJob,
} from "@/types/db";
import { supabase } from "./supabase";

export const PAGE_SIZE = 25;

export interface ProjectFilters {
  search?: string;
  statusGroup?: keyof typeof OVERVIEW_GROUPS | "";
  source?: InputSource | "";
  brandId?: string;
  tagId?: string;
  page?: number;
}

export type ProjectListRow = Pick<
  ContentProject,
  | "id"
  | "title"
  | "original_idea"
  | "input_source"
  | "source_url"
  | "status"
  | "brand_id"
  | "duplicate_of"
  | "submitted_at"
  | "content_type"
> & { brands: { name: string } | null; project_tags: { tags: Tag }[] };

export function useProjects(workspaceId: string | null, filters: ProjectFilters) {
  return useQuery({
    queryKey: ["projects", workspaceId, filters],
    enabled: !!workspaceId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const page = filters.page ?? 0;
      const tagJoin = filters.tagId
        ? "project_tags!inner(tags(id, name, color))"
        : "project_tags(tags(id, name, color))";
      let q = supabase
        .from("content_projects")
        .select(
          `id, title, original_idea, input_source, source_url, status, brand_id, duplicate_of, submitted_at, content_type, brands(name), ${tagJoin}`,
          { count: "exact" },
        )
        .eq("workspace_id", workspaceId!)
        .order("submitted_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      if (filters.search?.trim())
        q = q.textSearch("search", filters.search.trim(), { type: "websearch", config: "simple" });
      if (filters.statusGroup) q = q.in("status", [...OVERVIEW_GROUPS[filters.statusGroup]!]);
      if (filters.source) q = q.eq("input_source", filters.source);
      if (filters.brandId) q = q.eq("brand_id", filters.brandId);
      if (filters.tagId) q = q.eq("project_tags.tag_id", filters.tagId);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as unknown as ProjectListRow[], count: count ?? 0 };
    },
  });
}

export function useStatusCounts(workspaceId: string | null) {
  return useQuery({
    queryKey: ["status-counts", workspaceId],
    enabled: !!workspaceId,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_status_counts")
        .select("status, count")
        .eq("workspace_id", workspaceId!);
      if (error) throw error;
      const byStatus = Object.fromEntries((data ?? []).map((r) => [r.status, r.count])) as Partial<
        Record<ProjectStatus, number>
      >;
      const groups = Object.fromEntries(
        Object.entries(OVERVIEW_GROUPS).map(([g, statuses]) => [
          g,
          statuses.reduce((n, s) => n + (byStatus[s] ?? 0), 0),
        ]),
      ) as Record<keyof typeof OVERVIEW_GROUPS, number>;
      return { byStatus, groups };
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    enabled: !!id,
    // Follow the pipeline live while the system is working on the project.
    refetchInterval: (q) =>
      q.state.data && WORKING_STATUSES.has((q.state.data as { status: string }).status)
        ? 2500
        : 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_projects")
        .select("*, brands(id, name), project_tags(tags(id, name, color))")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as
        | (ContentProject & {
            brands: { id: string; name: string } | null;
            project_tags: { tags: Tag }[];
          })
        | null;
    },
  });
}

export function useProjectEvents(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-events", projectId],
    enabled: !!projectId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_events")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as WorkflowEvent[];
    },
  });
}

export function useProjectJobs(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-jobs", projectId],
    enabled: !!projectId,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_jobs")
        .select(
          "id, project_id, stage, kind, status, attempts, max_attempts, error_details, next_run_at, started_at, completed_at, created_at",
        )
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as WorkflowJob[];
    },
  });
}

export function useAttentionJobs(workspaceId: string | null) {
  return useQuery({
    queryKey: ["attention", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_jobs")
        .select(
          "id, stage, status, attempts, error_details, created_at, project_id, content_projects!inner(title, workspace_id)",
        )
        .in("status", ["needs_attention"])
        .eq("content_projects.workspace_id", workspaceId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as (WorkflowJob & { content_projects: { title: string } })[];
    },
  });
}

export function useBrands(workspaceId: string | null) {
  return useQuery({
    queryKey: ["brands", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .eq("workspace_id", workspaceId!)
        .is("archived_at", null)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Brand[];
    },
  });
}

export function useBrand(id: string | undefined) {
  return useQuery({
    queryKey: ["brand", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as Brand | null;
    },
  });
}

export function useBrandAssets(brandId: string | undefined) {
  return useQuery({
    queryKey: ["brand-assets", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_assets")
        .select("*")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as BrandAsset[];
    },
  });
}

export function useBrandHistory(brandId: string | undefined) {
  return useQuery({
    queryKey: ["brand-history", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_settings_history")
        .select("id, version, settings, created_at")
        .eq("brand_id", brandId!)
        .order("version", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTags(workspaceId: string | null) {
  return useQuery({
    queryKey: ["tags", workspaceId],
    enabled: !!workspaceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, color")
        .eq("workspace_id", workspaceId!)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Tag[];
    },
  });
}

// ── Phase 2: configuration, brief, scripts, approvals ──────────────────────

/** Poll faster while the system is working on a project. */
export const WORKING_STATUSES = new Set([
  "analyzing",
  "validating_answers",
  "generating_script",
  "generating_creative",
  "rendering",
  "publishing",
]);

export interface QuestionnaireRow {
  id: string;
  version: number;
  kind: "initial" | "clarification";
  status: "awaiting_answers" | "answered" | "superseded";
  questions: Questionnaire;
  analysis_id: string | null;
  created_at: string;
  questionnaire_answers: {
    id: string;
    answers: Answers;
    is_draft: boolean;
    status: string;
    submitted_at: string | null;
  }[];
}

export function useQuestionnaires(projectId: string | undefined, poll = false) {
  return useQuery({
    queryKey: ["questionnaires", projectId],
    enabled: !!projectId,
    refetchInterval: poll ? 2500 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questionnaires")
        .select(
          "id, version, kind, status, questions, analysis_id, created_at, questionnaire_answers(id, answers, is_draft, status, submitted_at)",
        )
        .eq("project_id", projectId!)
        .neq("status", "superseded")
        .order("version", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as QuestionnaireRow[];
    },
  });
}

export function useAnalysis(analysisId: string | null | undefined) {
  return useQuery({
    queryKey: ["analysis", analysisId],
    enabled: !!analysisId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_analyses")
        .select("id, version, analysis, model, created_at")
        .eq("id", analysisId!)
        .maybeSingle();
      if (error) throw error;
      return data as {
        id: string;
        version: number;
        analysis: Analysis;
        model: string | null;
        created_at: string;
      } | null;
    },
  });
}

export interface BriefRow {
  id: string;
  version: number;
  brief: Brief;
  validation_status: "valid" | "needs_clarification" | "invalid";
  validation_details: { contradictions?: { en: string; ar: string }[] } | null;
  created_at: string;
}

export function useCurrentBrief(projectId: string | undefined, poll = false) {
  return useQuery({
    queryKey: ["brief", projectId],
    enabled: !!projectId,
    refetchInterval: poll ? 2500 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_briefs")
        .select("id, version, brief, validation_status, validation_details, created_at")
        .eq("project_id", projectId!)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as BriefRow | null;
    },
  });
}

export interface ScriptRow {
  id: string;
  version: number;
  brief_id: string;
  content: Script;
  content_hash: string;
  origin: "ai" | "manual_edit" | "section_regeneration";
  status: "in_review" | "changes_requested" | "approved" | "rejected" | "superseded";
  model: string | null;
  created_at: string;
}

export function useScripts(projectId: string | undefined, poll = false) {
  return useQuery({
    queryKey: ["scripts", projectId],
    enabled: !!projectId,
    refetchInterval: poll ? 2500 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scripts")
        .select("id, version, brief_id, content, content_hash, origin, status, model, created_at")
        .eq("project_id", projectId!)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ScriptRow[];
    },
  });
}

export interface ApprovalRow {
  id: string;
  stage: "config" | "script" | "creative" | "media" | "publish";
  artifact_type: string;
  artifact_id: string;
  artifact_version: number;
  decision: "approved" | "changes_requested" | "rejected";
  comment: string | null;
  reviewer_id: string;
  created_at: string;
}

export function useApprovals(projectId: string | undefined) {
  return useQuery({
    queryKey: ["approvals", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approvals")
        .select(
          "id, stage, artifact_type, artifact_id, artifact_version, decision, comment, reviewer_id, created_at",
        )
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApprovalRow[];
    },
  });
}

// ── Phase 3: creative versions ──────────────────────────────────────────────
export interface CreativeVersionRow {
  id: string;
  version: number;
  script_id: string;
  status:
    | "generating"
    | "in_review"
    | "changes_requested"
    | "approved"
    | "rejected"
    | "superseded"
    | "failed";
  repository_url: string | null;
  commit_sha: string | null;
  source_path: string | null;
  preview_path: string | null;
  content_hash: string | null;
  revision_notes: string | null;
  generator: "template" | "claude-code" | null;
  created_at: string;
  configuration: {
    format?: "static" | "carousel" | "video";
    width?: number;
    height?: number;
    duration_s?: number | null;
    style?: string;
    files?: { path: string; committed: boolean }[];
    thumbnails?: { name: string; query: string; path: string }[];
    checks?: { ok: boolean; files: number; bytes: number };
    generator?: { name: string; summary: string; cost_usd: number | null; turns: number | null };
    base_version?: number | null;
  };
}

export function useCreativeVersions(projectId: string | undefined, poll = false) {
  return useQuery({
    queryKey: ["creatives", projectId],
    enabled: !!projectId,
    refetchInterval: poll ? 2500 : false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_versions")
        .select(
          "id, version, script_id, status, repository_url, commit_sha, source_path, preview_path, content_hash, revision_notes, generator, created_at, configuration",
        )
        .eq("project_id", projectId!)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CreativeVersionRow[];
    },
  });
}

/** Signed URLs for thumbnails in the private previews bucket (RLS: project members). */
export function useSignedUrls(paths: string[]) {
  return useQuery({
    queryKey: ["signed", paths],
    enabled: paths.length > 0,
    staleTime: 50 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("previews").createSignedUrls(paths, 3600);
      if (error) throw error;
      return Object.fromEntries(
        (data ?? []).flatMap((d) =>
          d.path && d.signedUrl ? [[d.path, d.signedUrl] as const] : [],
        ),
      ) as Record<string, string>;
    },
  });
}

export interface StudioRow {
  id: string;
  title: string;
  status: ContentProject["status"];
  updated_at: string;
  creative_versions: {
    id: string;
    version: number;
    status: string;
    configuration: CreativeVersionRow["configuration"];
  }[];
}

/** Projects with creative work in progress or waiting for review. */
export function useStudioProjects(workspaceId: string | null) {
  return useQuery({
    queryKey: ["studio", workspaceId],
    enabled: !!workspaceId,
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_projects")
        .select(
          "id, title, status, updated_at, creative_versions(id, version, status, configuration)",
        )
        .eq("workspace_id", workspaceId!)
        .in("status", ["generating_creative", "creative_in_review", "rendering"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as StudioRow[];
    },
  });
}
