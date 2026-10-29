/** Read-side data hooks. Reads go straight to Postgres through RLS; writes that start workflows use lib/api.ts. */
import { OVERVIEW_GROUPS, type ProjectStatus } from "@cc/shared";
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
