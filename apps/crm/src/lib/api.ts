/**
 * Client for the `api` Edge Function (docs/API.md). Every call carries the
 * user's JWT; mutating calls get an Idempotency-Key so a retried click never
 * creates a second project.
 */
import type { Answers } from "@cc/shared";
import { API_URL, supabase } from "./supabase";

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.message);
  }
  get code() {
    return this.body.code;
  }
}

async function token(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiRequest<T>(
  path: string,
  init: { method?: string; json?: unknown; form?: FormData; idempotencyKey?: string } = {},
): Promise<T> {
  const headers = new Headers();
  const jwt = await token();
  if (jwt) headers.set("authorization", `Bearer ${jwt}`);
  if (init.idempotencyKey) headers.set("idempotency-key", init.idempotencyKey);
  let body: BodyInit | undefined;
  if (init.json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(init.json);
  } else if (init.form) {
    body = init.form;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: init.method ?? "POST", headers, body });
  } catch {
    throw new ApiError(0, { code: "network", message: "Network error — check your connection." });
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const err = (data as { error?: ApiErrorBody } | null)?.error;
    throw new ApiError(
      res.status,
      err ?? { code: "internal", message: `Request failed (${res.status})` },
    );
  }
  return data as T;
}

export interface CreateProjectInput {
  workspace_id?: string;
  title?: string;
  original_idea?: string;
  source_url?: string;
  brand_id?: string;
  content_type?: "static" | "carousel" | "video";
  language?: string;
  tags?: string[];
  allow_duplicate?: boolean;
}

export interface CreateProjectResult {
  project_id: string;
  created: boolean;
  replayed: boolean;
  duplicate_of: string | null;
  status: string;
  job_id: string | null;
}

export interface CsvImportResult {
  import_batch_id: string | null;
  dry_run: boolean;
  headers: string[];
  totals: { rows: number; created: number; duplicate: number; failed: number; valid: number };
  rows: {
    row: number;
    status: "created" | "duplicate" | "failed" | "valid";
    project_id?: string;
    duplicate_of?: string;
    error?: string;
  }[];
}

export const api = {
  createProject: (input: CreateProjectInput, idempotencyKey: string) =>
    apiRequest<CreateProjectResult>("/content-projects", { json: input, idempotencyKey }),

  importCsv: (input: {
    file: File;
    mapping: Record<string, string>;
    workspaceId?: string;
    brandId?: string;
    dryRun?: boolean;
  }) => {
    const form = new FormData();
    form.set("file", input.file);
    form.set("mapping", JSON.stringify(input.mapping));
    if (input.workspaceId) form.set("workspace_id", input.workspaceId);
    if (input.brandId) form.set("brand_id", input.brandId);
    if (input.dryRun) form.set("dry_run", "true");
    return apiRequest<CsvImportResult>("/imports/csv", { form });
  },

  analyze: (projectId: string) =>
    apiRequest<{ job_id: string; status: string; retried: boolean }>(
      `/content-projects/${projectId}/analyze`,
      { json: {} },
    ),

  submitConfiguration: (
    projectId: string,
    input: { questionnaire_id: string; answers: Answers; draft?: boolean },
  ) =>
    apiRequest<{ status?: string; saved?: boolean; job_id?: string }>(
      `/content-projects/${projectId}/questionnaire/submit`,
      { json: input },
    ),

  regenerateScript: (projectId: string, instructions: string) =>
    apiRequest<{ job_id: string; status: string }>(
      `/content-projects/${projectId}/scripts/generate`,
      { json: { instructions } },
    ),

  editScript: (projectId: string, baseScriptId: string, content: unknown, idempotencyKey: string) =>
    apiRequest<{ script_id: string; version: number }>(`/content-projects/${projectId}/scripts`, {
      json: { base_script_id: baseScriptId, content },
      idempotencyKey,
    }),

  previewUrl: (creativeVersionId: string) =>
    apiRequest<{ url: string; base: string; expires_at: string }>(
      `/creative-versions/${creativeVersionId}/preview`,
      { method: "GET" },
    ),

  decide: (input: {
    artifact_type: "script" | "creative_version";
    artifact_id: string;
    artifact_version: number;
    artifact_hash: string;
    decision: "approved" | "changes_requested" | "rejected";
    comment?: string;
  }) => apiRequest<{ approval_id: string; status: string }>("/approvals", { json: input }),

  telegramLinkCode: () =>
    apiRequest<{ code: string; expires_in_seconds: number; instructions: string }>(
      "/telegram/link-code",
    ),
};
