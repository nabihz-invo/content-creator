/**
 * One render job (ADR-0008): approved creative at its commit → integrity check
 * → vendored files → validator → isolated render → PNG validation → upload →
 * save_render (manifest built and hashed by Postgres; completes the job).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import type postgres from "postgres";
import type { ContentSpec } from "@cc/shared";
import { validateWorkspace } from "@cc/creative-worker/check";
import type { SourceStore } from "@cc/creative-worker/source-store";
import type { Storage } from "@cc/creative-worker/storage";
import { listFiles, treeHash } from "@cc/creative-worker/tree";
import { addVendoredFiles } from "@cc/creative-worker/workspace";
import { renderWorkspace } from "./render.ts";
import { validateRender } from "./validate.ts";

export interface RenderDeps {
  sql: postgres.Sql;
  storage: Storage;
  source: SourceStore;
  workDir: string;
  workerId: string;
  pageTimeoutMs: number;
  maxPngBytes: number;
  minLumaStddev: number;
  log: (msg: string, extra?: Record<string, unknown>) => void;
  progress?: (pct: number) => void;
}

export interface RenderJobRow {
  id: string;
  project_id: string;
  input_reference: { render_job_id: string; creative_version_id: string; output_type: string };
}

export class RenderError extends Error {
  readonly retryable: boolean;
  readonly code: string;
  constructor(message: string, retryable: boolean, code = "render_failed") {
    super(message);
    this.retryable = retryable;
    this.code = code;
  }
}

/** spec.js is `window.__SPEC = <JSON>;` (with `<` escaped as <, which JSON.parse reads back). */
export function parseSpecScript(text: string): ContentSpec {
  const m = text.match(/^window\.__SPEC = ([\s\S]*);\s*$/);
  if (!m) throw new RenderError("spec.js is not in the expected form", false, "source_invalid");
  return JSON.parse(m[1]!) as ContentSpec;
}

async function loadInputs(sql: postgres.Sql, job: RenderJobRow) {
  const [row] = await sql<
    {
      render_id: string;
      render_status: string;
      output_type: "png" | "carousel" | "mp4";
      configuration: { width: number; height: number; slides?: number };
      cv_status: string;
      cv_version: number;
      commit_sha: string;
      source_path: string;
      content_hash: string;
    }[]
  >`
    select r.id as render_id, r.status as render_status, r.output_type::text as output_type, r.configuration,
           c.status as cv_status, c.version as cv_version, c.commit_sha, c.source_path, c.content_hash
    from public.render_jobs r
    join public.creative_versions c on c.id = r.creative_version_id
    where r.id = ${job.input_reference.render_job_id} and r.workflow_job_id = ${job.id}`;
  if (!row) throw new RenderError("render job not found", false, "obsolete");
  if (row.render_status !== "running" || row.cv_status !== "approved")
    throw new RenderError(
      `render is ${row.render_status}, creative v${row.cv_version} is ${row.cv_status}`,
      false,
      "obsolete",
    );
  if (row.output_type === "mp4")
    throw new RenderError("video rendering arrives in Phase 5", false, "unsupported_output");
  return { ...row, output_type: row.output_type as "png" | "carousel" };
}

export async function processRenderJob(deps: RenderDeps, job: RenderJobRow) {
  const { sql, log } = deps;
  const input = await loadInputs(sql, job);
  mkdirSync(deps.workDir, { recursive: true });
  const scratch = mkdtempSync(join(deps.workDir, `render-${job.id.slice(0, 8)}-`));
  const ws = join(scratch, "ws");
  try {
    // 1. The exact approved source, verified against the approved hash.
    await deps.source.checkout({
      workDir: scratch,
      sha: input.commit_sha,
      path: input.source_path,
      dest: ws,
    });
    const actual = treeHash(ws, listFiles(ws));
    if (actual !== input.content_hash)
      throw new RenderError(
        `source at ${input.commit_sha.slice(0, 12)} does not match the approved creative (hash ${actual.slice(0, 12)} ≠ ${input.content_hash.slice(0, 12)})`,
        false,
        "source_mismatch",
      );
    const spec = parseSpecScript(readFileSync(join(ws, "spec.js"), "utf8"));
    if (spec.width !== input.configuration.width || spec.height !== input.configuration.height)
      throw new RenderError(
        "spec dimensions differ from the render configuration",
        false,
        "source_invalid",
      );
    addVendoredFiles(ws, spec);

    // 2. Re-check the code before executing it (defence in depth).
    const check = validateWorkspace(ws, { format: spec.format });
    if (!check.ok)
      throw new RenderError(
        `source failed validation: ${check.errors
          .slice(0, 3)
          .map((e) => `${e.file}: ${e.message}`)
          .join("; ")}`,
        false,
        "source_invalid",
      );
    log("source verified", {
      sha: input.commit_sha,
      files: check.files.length,
      format: spec.format,
    });

    // 3. Render with the network off.
    const out = await renderWorkspace(ws, spec, {
      timeoutMs: deps.pageTimeoutMs,
      onProgress: (done, total) => deps.progress?.(Math.round((done / total) * 80)),
    });
    if (out.errors.length)
      throw new RenderError(
        `the creative throws while rendering: ${out.errors.slice(0, 3).join("; ")}`,
        false,
        "runtime_error",
      );
    if (out.blockedRequests.length)
      throw new RenderError(
        `the creative tried to reach the network: ${out.blockedRequests.slice(0, 3).join(", ")}`,
        false,
        "network_attempt",
      );

    // 4. Validate the actual files.
    const v = validateRender(out.files, {
      outputType: input.output_type,
      width: input.configuration.width,
      height: input.configuration.height,
      slides: input.output_type === "carousel" ? spec.slides.length : undefined,
      maxBytes: deps.maxPngBytes,
      minStddev: deps.minLumaStddev,
    });
    if (!v.ok)
      throw new RenderError(
        `rendered files failed validation: ${v.errors.join("; ")}`,
        false,
        "validation_failed",
      );

    // 5. Upload (overwrites a partial upload from an earlier attempt), then record.
    const prefix = `${job.project_id}/render-${input.render_id}/`;
    const assets = [];
    for (const f of v.files) {
      const path = `${prefix}${f.name}.png`;
      await deps.storage.upload("media", path, f.png, "image/png");
      assets.push({
        asset_type: input.output_type === "carousel" ? "carousel_slide" : "png",
        slide_index: f.slideIndex,
        storage_path: path,
        mime_type: "image/png",
        file_size: f.png.length,
        width: f.width,
        height: f.height,
        checksum: f.checksum,
        metadata: {
          luma_mean: Math.round(f.luma.mean),
          luma_stddev: Number(f.luma.stddev.toFixed(2)),
        },
      });
    }
    deps.progress?.(95);
    const [{ r }] = (await sql`
      select public.save_render(${job.id}, ${deps.workerId}, ${input.render_id}, ${sql.json(assets as never)}) as r`) as unknown as [
      { r: { render_job_id: string; version: number; manifest_hash: string; files: number } },
    ];
    return r;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}
