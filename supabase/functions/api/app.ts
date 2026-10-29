/**
 * `api` Edge Function: authenticated endpoints from docs/API.md.
 * Deployed at /functions/v1/api/*; the router's base path is /api.
 */
import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { requireUser, requireWorkspaceRole } from "../_shared/auth.ts";
import {
  type CsvImportRequest,
  CSV_MAX_BYTES,
  decodeCsv,
  importCsv,
} from "../_shared/csv-import.ts";
import type { Deps } from "../_shared/deps.ts";
import { ApiError, fromDbError } from "../_shared/errors.ts";
import { withIdempotency } from "../_shared/idempotency.ts";
import { intakeIdea } from "../_shared/intake.ts";
import { verifySignature } from "../_shared/n8n.ts";
import { enforceRateLimit } from "../_shared/ratelimit.ts";
import { defaultNet, fetchAndExtract } from "../_shared/url-extract.ts";
import { validate } from "../_shared/validate.ts";

interface CreateProjectBody {
  workspace_id?: string;
  title?: string;
  original_idea?: string;
  source_url?: string;
  brand_id?: string;
  content_type?: "static" | "carousel" | "video";
  language?: string;
  tags?: string[];
  allow_duplicate?: boolean;
  auto_analyze?: boolean;
}

async function jsonBody(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new ApiError("validation_failed", "body must be valid JSON");
  }
}

export function createApp(deps: Deps) {
  const { sql } = deps;
  const app = new Hono().basePath("/api");

  app.use(
    "*",
    cors({
      origin: (origin) => (deps.config.allowedOrigins.includes(origin) ? origin : null),
      allowHeaders: ["authorization", "content-type", "idempotency-key", "x-client-info", "apikey"],
      allowMethods: ["GET", "POST", "OPTIONS"],
      maxAge: 600,
    }),
  );

  app.onError((err, c) => {
    const e = fromDbError(err);
    return c.json(e.toJSON(), e.status as 400);
  });
  app.notFound((c) => c.json(new ApiError("not_found", "no such endpoint").toJSON(), 404));

  app.get("/health", (c) => c.json({ ok: true }));

  // POST /api/content-projects — manual idea / URL from the dashboard
  app.post("/content-projects", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    await enforceRateLimit(sql, `user:${userId}:create-project`, 60);
    const body = validate<CreateProjectBody>("createProject", await jsonBody(c));
    const { workspaceId } = await requireWorkspaceRole(sql, userId, body.workspace_id, [
      "admin",
      "editor",
    ]);

    const res = await withIdempotency(
      sql,
      {
        scope: `create-project:${userId}`,
        key: c.req.header("idempotency-key") ?? null,
        userId,
        request: body,
      },
      async () => {
        const r = await intakeIdea(
          sql,
          deps.dispatcher,
          {
            input_source: body.original_idea ? "manual" : "url",
            title: body.title,
            original_idea: body.original_idea,
            source_url: body.source_url,
            brand_id: body.brand_id,
            content_type: body.content_type,
            language: body.language,
            tags: body.tags,
          },
          {
            workspaceId,
            actorId: userId,
            allowDuplicate: body.allow_duplicate,
            autoAnalyze: body.auto_analyze,
          },
        );
        return { status: r.created ? 201 : 200, body: r };
      },
    );
    return c.json(res.body as Record<string, unknown>, res.status as 200);
  });

  // POST /api/imports/csv — multipart: file, mapping (JSON), workspace_id?, brand_id?, dry_run?, auto_analyze?
  app.post("/imports/csv", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    await enforceRateLimit(sql, `user:${userId}:csv-import`, 10);

    let form: FormData;
    try {
      form = await c.req.formData();
    } catch {
      throw new ApiError("validation_failed", "expected multipart/form-data");
    }
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("validation_failed", "file is required");
    if (file.size > CSV_MAX_BYTES)
      throw new ApiError("payload_too_large", "CSV is larger than 5 MB");

    let mapping: unknown;
    try {
      mapping = JSON.parse(String(form.get("mapping") ?? ""));
    } catch {
      throw new ApiError("validation_failed", "mapping must be a JSON object");
    }
    const bool = (name: string) => {
      const v = form.get(name);
      return v === null ? undefined : v === "true" || v === "1";
    };
    const request = validate<CsvImportRequest>("csvImport", {
      mapping,
      ...(form.get("workspace_id") ? { workspace_id: String(form.get("workspace_id")) } : {}),
      ...(form.get("brand_id") ? { brand_id: String(form.get("brand_id")) } : {}),
      ...(bool("dry_run") !== undefined ? { dry_run: bool("dry_run") } : {}),
      ...(bool("auto_analyze") !== undefined ? { auto_analyze: bool("auto_analyze") } : {}),
    });
    const { workspaceId } = await requireWorkspaceRole(sql, userId, request.workspace_id, [
      "admin",
      "editor",
    ]);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const batchId = crypto.randomUUID();
    const fileName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120) || "import.csv";

    let storagePath: string | null = null;
    if (!request.dry_run) {
      storagePath = `${workspaceId}/${batchId}/${fileName}`;
      try {
        await deps.storage.upload("imports", storagePath, bytes, "text/csv");
      } catch (err) {
        console.warn("csv upload failed; continuing without stored copy", err);
        storagePath = null;
      }
    }

    const result = await importCsv(sql, deps.dispatcher, {
      workspaceId,
      actorId: userId,
      fileName,
      text: decodeCsv(bytes),
      request,
      batchId,
      storagePath,
    });
    return c.json(result, 200);
  });

  // POST /api/telegram/link-code — one-time code for `/link <code>` in the bot
  app.post("/telegram/link-code", async (c) => {
    const userId = await requireUser(c.req.raw, deps.auth);
    await enforceRateLimit(sql, `user:${userId}:tg-link`, 5);
    const [row] = await sql<
      { code: string }[]
    >`select public.create_telegram_link_code(${userId}) as code`;
    return c.json({
      code: row!.code,
      expires_in_seconds: 900,
      instructions: `Send "/link ${row!.code}" to the bot.`,
    });
  });

  // POST /api/internal/url-extract — called by n8n Workflow B (HMAC-signed)
  app.post("/internal/url-extract", async (c) => {
    const raw = await c.req.text();
    const secret = deps.config.n8nWebhookSecret;
    if (
      !secret ||
      !(await verifySignature(
        secret,
        c.req.header("x-cc-timestamp") ?? null,
        c.req.header("x-cc-signature") ?? null,
        raw,
      ))
    ) {
      throw new ApiError("unauthorized", "invalid signature");
    }
    let body: { project_id?: string };
    try {
      body = JSON.parse(raw);
    } catch {
      throw new ApiError("validation_failed", "body must be valid JSON");
    }
    if (!body.project_id || !/^[0-9a-f-]{36}$/i.test(body.project_id)) {
      throw new ApiError("validation_failed", "project_id is required");
    }
    const [project] = await sql<{ id: string; source_url: string | null }[]>`
      select id, source_url from public.content_projects where id = ${body.project_id}`;
    if (!project) throw new ApiError("not_found", "project not found");
    if (!project.source_url)
      return c.json({ project_id: project.id, extracted: null, reason: "no source_url" });

    try {
      const extracted = await fetchAndExtract(project.source_url, deps.net ?? defaultNet);
      await sql`
        update public.content_projects
        set source_metadata = source_metadata || ${sql.json({ extracted: { ...extracted, fetched_at: new Date().toISOString() } } as never)}
        where id = ${project.id}`;
      await sql`select public.log_event(${project.id}, 'source.extracted',
        ${sql.json({ final_url: extracted.final_url, chars: extracted.text.length, truncated: extracted.truncated } as never)})`;
      return c.json({ project_id: project.id, extracted });
    } catch (err) {
      const e = fromDbError(err);
      await sql`select public.log_event(${project.id}, 'source.extract_failed',
        ${sql.json({ code: e.code, message: e.message } as never)})`;
      throw e;
    }
  });

  return app;
}
