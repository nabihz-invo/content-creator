/**
 * Shared intake path for every channel (docs/WORKFLOW.md §1, Stage 1):
 * normalize → validate → dedupe hash → create_project() → tags → dispatch.
 */
import type { Sql } from "./db.ts";
import { fromDbError } from "./errors.ts";
import type { Dispatcher } from "./n8n.ts";
import { cleanText } from "./sanitize.ts";
import { validate } from "./validate.ts";
import { dedupeHash } from "./vendor/src/hash.ts";

export interface IntakeRecord {
  input_source: "manual" | "telegram" | "csv" | "url";
  title?: string;
  original_idea?: string;
  source_url?: string;
  source_reference?: string;
  source_metadata?: Record<string, unknown>;
  brand_id?: string;
  content_type?: "static" | "carousel" | "video";
  language?: string;
  submitted_at?: string;
  tags?: string[];
}

export interface IntakeOptions {
  workspaceId: string;
  actorId: string;
  allowDuplicate?: boolean;
  /** Unique per external submission, e.g. telegram:<update_id>. */
  sourceKey?: string | null;
  autoAnalyze?: boolean;
  importBatchId?: string | null;
}

export interface IntakeResult {
  project_id: string;
  created: boolean;
  replayed: boolean;
  duplicate_of: string | null;
  status: string;
  job_id: string | null;
}

export function normalizeRecord(raw: IntakeRecord): IntakeRecord {
  const rec: IntakeRecord = { ...raw };
  if (rec.original_idea !== undefined) {
    const idea = cleanText(rec.original_idea);
    if (idea) rec.original_idea = idea;
    else delete rec.original_idea;
  }
  if (rec.title !== undefined) {
    const title = cleanText(rec.title, 200).replace(/\n+/g, " ");
    if (title) rec.title = title;
    else delete rec.title;
  }
  if (rec.source_url !== undefined) {
    const url = rec.source_url.trim();
    if (url) rec.source_url = url;
    else delete rec.source_url;
  }
  if (rec.tags) {
    rec.tags = [...new Set(rec.tags.map((t) => cleanText(t, 50).toLowerCase()).filter(Boolean))];
  }
  return rec;
}

export async function intakeIdea(
  sql: Sql,
  dispatcher: Dispatcher,
  raw: IntakeRecord,
  opts: IntakeOptions,
): Promise<IntakeResult> {
  const record = validate<IntakeRecord>("intakeRecord", normalizeRecord(raw));
  const hash = await dedupeHash(record.original_idea, record.source_url);
  const { tags, ...rpcRecord } = record;

  let result: IntakeResult;
  try {
    result = (await sql.begin(async (tx) => {
      const [row] = await tx<{ r: IntakeResult }[]>`
        select public.create_project(
          ${opts.workspaceId}, ${opts.actorId}, ${tx.json(rpcRecord as never)}, ${hash},
          ${opts.allowDuplicate ?? false}, ${opts.sourceKey ?? null}, ${opts.autoAnalyze ?? true},
          ${opts.importBatchId ?? null}
        ) as r`;
      const r = row!.r;
      if (r.created && tags?.length) {
        await tx`
          insert into public.tags (workspace_id, name)
          select ${opts.workspaceId}, unnest(${tags}::text[])
          on conflict (workspace_id, name) do nothing`;
        await tx`
          insert into public.project_tags (project_id, tag_id)
          select ${r.project_id}, id from public.tags
          where workspace_id = ${opts.workspaceId} and name = any(${tags}::text[])
          on conflict do nothing`;
      }
      return r;
    })) as IntakeResult;
  } catch (err) {
    throw fromDbError(err);
  }

  if (result.created && result.job_id) {
    await dispatcher.dispatch("analyze", {
      job_id: result.job_id,
      project_id: result.project_id,
      stage: "analysis",
    });
  }
  return result;
}
