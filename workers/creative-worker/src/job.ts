/**
 * One creative job (ADR-0007): inputs from Postgres → content spec → workspace
 * → generator → validation → thumbnails → Git commit → preview upload →
 * save_creative_version (completes the job).
 */
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import type postgres from "postgres";
import {
  type Brief,
  buildContentSpec,
  buildCreativePrompt,
  type ContentSpec,
  type Script,
} from "@cc/shared";
import { captureWorkspace } from "./capture.ts";
import { validateWorkspace } from "./check.mjs";
import { type Generator, GeneratorError } from "./generators.ts";
import type { SourceStore } from "./source-store.ts";
import { type Storage, uploadDir } from "./storage.ts";
import { assembleWorkspace, NOT_SOURCE } from "./workspace.ts";

export interface JobDeps {
  sql: postgres.Sql;
  storage: Storage;
  source: SourceStore;
  generator: Generator;
  repoDisplayUrl: string;
  workDir: string;
  log: (msg: string, extra?: Record<string, unknown>) => void;
}

export interface CreativeJob {
  id: string;
  project_id: string;
  input_reference: {
    script_id: string;
    base_creative_version_id?: string;
    approval_id?: string;
    fresh?: boolean;
  };
}

export class JobError extends Error {
  readonly retryable: boolean;
  readonly code: string;
  constructor(message: string, retryable: boolean, code = "creative_failed") {
    super(message);
    this.retryable = retryable;
    this.code = code;
  }
}

/** Files that belong to the creative's own source (vendored fonts/libraries are reproducible and not committed). */
export const isCommitted = (path: string) =>
  !NOT_SOURCE(path) &&
  !path.startsWith("fonts/") &&
  !path.startsWith("vendor/") &&
  !path.startsWith(".home/");

/** Order-independent hash of a file tree: sha256 over sorted "path\0sha256(content)" lines. */
export function treeHash(dir: string, files: string[]): string {
  const lines = [...files].sort().map(
    (f) =>
      `${f}\0${createHash("sha256")
        .update(readFileSync(join(dir, f)))
        .digest("hex")}`,
  );
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

async function loadInputs(sql: postgres.Sql, job: CreativeJob) {
  const [row] = await sql<
    {
      script_id: string;
      script_version: number;
      script_hash: string;
      script: Script;
      brief: Brief;
      brand_name: string | null;
      brand_language: string | null;
      brand_settings: Record<string, unknown> | null;
      settings_version: number | null;
      next_version: number;
    }[]
  >`
    select s.id as script_id, s.version as script_version, s.content_hash as script_hash, s.content as script,
           b.brief, br.name as brand_name, br.default_language as brand_language, br.brand_settings, br.settings_version,
           (select coalesce(max(version), 0) + 1 from public.creative_versions where project_id = s.project_id) as next_version
    from public.scripts s
    join public.content_briefs b on b.id = s.brief_id
    join public.content_projects p on p.id = s.project_id
    left join public.brands br on br.id = p.brand_id
    where s.id = ${job.input_reference.script_id} and s.project_id = ${job.project_id} and s.status = 'approved'`;
  if (!row)
    throw new JobError("the approved script for this job no longer exists", false, "obsolete");

  let revisionNotes: string | null = null;
  if (job.input_reference.approval_id && !job.input_reference.fresh) {
    const [a] = await sql<
      { comment: string | null }[]
    >`select comment from public.approvals where id = ${job.input_reference.approval_id}`;
    revisionNotes = a?.comment ?? null;
  }
  let base: { commit_sha: string; source_path: string; version: number } | null = null;
  if (job.input_reference.base_creative_version_id && !job.input_reference.fresh) {
    const [b] = await sql<{ commit_sha: string; source_path: string; version: number }[]>`
      select commit_sha, source_path, version from public.creative_versions where id = ${job.input_reference.base_creative_version_id}`;
    base = b ?? null;
  }
  const brand = row.brand_name
    ? {
        name: row.brand_name,
        default_language: row.brand_language ?? "en",
        settings: (row.brand_settings ?? {}) as never,
      }
    : null;
  return { ...row, brand, revisionNotes, base };
}

export async function processCreativeJob(deps: JobDeps, job: CreativeJob, signal?: AbortSignal) {
  const { sql, log } = deps;
  const input = await loadInputs(sql, job);
  const version = input.next_version;
  const spec: ContentSpec = buildContentSpec({
    projectId: job.project_id,
    creativeVersion: version,
    brief: input.brief,
    script: input.script,
    scriptMeta: {
      id: input.script_id,
      version: input.script_version,
      content_hash: input.script_hash,
    },
    brand: input.brand,
    revisionNotes: input.revisionNotes,
  });
  const creative = buildCreativePrompt({
    brief: input.brief,
    script: input.script,
    brand: input.brand,
  });

  mkdirSync(deps.workDir, { recursive: true });
  const scratch = mkdtempSync(join(deps.workDir, `job-${job.id.slice(0, 8)}-`));
  const ws = join(scratch, "ws");
  try {
    let previousDir: string | null = null;
    if (input.base) {
      previousDir = join(scratch, "previous");
      await deps.source.checkout({
        workDir: scratch,
        sha: input.base.commit_sha,
        path: input.base.source_path,
        dest: previousDir,
      });
    }
    assembleWorkspace(ws, spec, { previousDir });
    log("workspace ready", { version, format: spec.format, revision: Boolean(input.base) });

    const genInput = {
      dir: ws,
      systemPrompt: creative.prompt,
      revisionNotes: input.revisionNotes,
      isRevision: Boolean(input.base),
      signal,
    };
    let gen = await deps.generator.generate(genInput);
    let check = validateWorkspace(ws, { format: spec.format });
    if (!check.ok && deps.generator.name === "claude-code") {
      // One fix-up round with the checker's findings.
      log("checker rejected the first pass; asking for fixes", { errors: check.errors.length });
      gen = await deps.generator.generate({
        ...genInput,
        fixErrors: check.errors.map((e) => `${e.file}${e.line ? `:${e.line}` : ""} ${e.message}`),
      });
      check = validateWorkspace(ws, { format: spec.format });
    }
    if (!check.ok) {
      throw new JobError(
        `generated code failed validation: ${check.errors
          .slice(0, 5)
          .map((e) => `${e.file}: ${e.message}`)
          .join("; ")}`,
        false,
        "validation_failed",
      );
    }
    // The shared runtime, fonts and vendored code are refreshed from the trusted template, whatever the generator did to them.
    assembleWorkspaceRuntime(ws, spec);

    const capture = await captureWorkspace(ws, spec);
    if (capture.errors.length)
      throw new JobError(
        `the creative throws in the browser: ${capture.errors.slice(0, 3).join("; ")}`,
        false,
        "runtime_error",
      );
    if (capture.blockedRequests.length)
      throw new JobError(
        `the creative tried to reach the network: ${capture.blockedRequests.slice(0, 3).join(", ")}`,
        false,
        "network_attempt",
      );

    const allFiles = validateWorkspace(ws, { format: spec.format }).files.map((f) => f.path);
    const committed = allFiles.filter(isCommitted);
    const hash = treeHash(ws, committed);
    const commit = await deps.source.commitVersion({
      workDir: scratch,
      files: committed,
      sourceDir: ws,
      projectId: job.project_id,
      version,
      message: `project ${job.project_id} creative v${version}\n\nscript v${input.script_version} (${input.script_hash.slice(0, 12)}), generator ${gen.generator}${input.revisionNotes ? `\n\nRevision notes:\n${input.revisionNotes}` : ""}`,
    });
    log("committed", { sha: commit.sha, path: commit.path });

    const prefix = `${job.project_id}/creative-v${version}/`;
    await uploadDir(deps.storage, "previews", prefix, ws, allFiles);
    const thumbs: string[] = [];
    for (const s of capture.shots) {
      const path = `${prefix}_thumbs/${s.name}.png`;
      await deps.storage.upload("previews", path, s.png, "image/png");
      thumbs.push(path);
    }

    const configuration = {
      format: spec.format,
      width: spec.width,
      height: spec.height,
      duration_s: spec.duration_s,
      style: spec.style,
      language: spec.language,
      prompt_version: creative.version,
      entry: "index.html",
      files: allFiles.map((p) => ({ path: p, committed: committed.includes(p) })),
      thumbnails: capture.shots.map((s, i) => ({ name: s.name, query: s.query, path: thumbs[i] })),
      checks: { ok: true, files: check.files.length, bytes: check.totalBytes },
      generator: {
        name: gen.generator,
        summary: gen.summary,
        cost_usd: gen.costUsd,
        turns: gen.turns,
      },
      base_version: input.base?.version ?? null,
    };
    const [{ r }] = (await sql`
      select public.save_creative_version(${job.id}, ${job.project_id}, ${input.script_id}, ${version}, ${input.settings_version},
        ${deps.repoDisplayUrl}, ${commit.sha}, ${commit.path}, ${prefix}, ${sql.json(configuration as never)}, ${hash},
        ${input.revisionNotes}, ${gen.generator}) as r`) as unknown as [
      { r: { creative_version_id: string; version: number; status: string } },
    ];
    return { ...r, commit_sha: commit.sha, thumbnails: thumbs.length };
  } catch (err) {
    if (err instanceof GeneratorError)
      throw new JobError(err.message, err.retryable, "generator_failed");
    throw err;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/** Re-copies the trusted runtime pieces (lib/, fonts/, vendor/) over whatever the generator left. */
function assembleWorkspaceRuntime(dir: string, spec: ContentSpec) {
  const tmp = mkdtempSync(join(dir, "..", "rt-"));
  assembleWorkspace(tmp, spec);
  for (const sub of ["lib", "fonts", ...(spec.format === "video" ? ["vendor"] : [])]) {
    rmSync(join(dir, sub), { recursive: true, force: true });
    cpSync(join(tmp, sub), join(dir, sub), { recursive: true });
  }
  rmSync(tmp, { recursive: true, force: true });
}
