/**
 * CSV import (docs/API.md POST /api/imports/csv). Each row goes through the
 * same intake path as manual ideas, with source key csv:<batch>:<row> so a
 * re-processed batch never creates a second project for a row.
 */
import { parse } from "@std/csv";
import type { Sql } from "./db.ts";
import { ApiError } from "./errors.ts";
import { type IntakeRecord, intakeIdea, normalizeRecord } from "./intake.ts";
import type { Dispatcher } from "./n8n.ts";
import { stripFormula } from "./sanitize.ts";
import { formatErrors, validate } from "./validate.ts";
import { dedupeHash } from "./vendor/src/hash.ts";

export const CSV_MAX_BYTES = 5 * 1024 * 1024;
export const CSV_MAX_ROWS = 1000;

export type CsvField = "idea" | "url" | "title" | "brand" | "tags" | "content_type" | "language";

export interface CsvImportRequest {
  workspace_id?: string;
  brand_id?: string;
  dry_run?: boolean;
  auto_analyze?: boolean;
  mapping: Partial<Record<CsvField, string>>;
}

export interface RowReport {
  row: number;
  status: "created" | "duplicate" | "failed" | "valid";
  project_id?: string;
  duplicate_of?: string;
  error?: string;
}

/** Decodes UTF-8 (with or without BOM); falls back to Windows-1256 for legacy Arabic files. */
export function decodeCsv(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1256").decode(bytes);
  }
}

/**
 * @std/csv drops blank lines, which would shift row numbers. Turn each blank
 * line outside a quoted field into an explicit empty record (`""`) so record
 * index == spreadsheet row number.
 */
function keepBlankRecords(text: string): string {
  let out = "";
  let inQuotes = false;
  let lineStart = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (!inQuotes && lineStart && (ch === "\n" || (ch === "\r" && text[i + 1] === "\n"))) {
      out += '""';
    }
    if (ch === '"') inQuotes = !inQuotes;
    out += ch;
    lineStart = !inQuotes && ch === "\n";
  }
  return out;
}

/** Rows keep their spreadsheet row number (header = row 1); blank rows are skipped. */
export function parseCsv(text: string): {
  headers: string[];
  rows: { row: number; cells: Record<string, string> }[];
} {
  let records: string[][];
  try {
    records = parse(keepBlankRecords(text.replace(/^\uFEFF/, "")), {
      lazyQuotes: true,
    }) as string[][];
  } catch (err) {
    throw new ApiError("validation_failed", "file is not valid CSV", { reason: String(err) });
  }
  const isBlank = (r: string[]) => r.every((c) => c.trim() === "");
  const [header, ...body] = records;
  if (!header || isBlank(header))
    throw new ApiError("validation_failed", "CSV file is empty or has no header row");
  const headers = header.map((h) => h.trim());
  const rows = body
    .map((cells, i) => ({ row: i + 2, raw: cells }))
    .filter((r) => !isBlank(r.raw))
    .map(({ row, raw }) => ({
      row,
      cells: Object.fromEntries(headers.map((h, i) => [h, stripFormula((raw[i] ?? "").trim())])),
    }));
  if (rows.length > CSV_MAX_ROWS) {
    throw new ApiError(
      "payload_too_large",
      `CSV has ${rows.length} rows; the limit is ${CSV_MAX_ROWS}`,
    );
  }
  return { headers, rows };
}

const CONTENT_TYPES = new Set(["static", "carousel", "video"]);

export function rowToRecord(
  row: Record<string, string>,
  mapping: CsvImportRequest["mapping"],
  brandIdByName: Map<string, string>,
  defaultBrandId: string | undefined,
  rowNumber: number,
  batchId: string,
): IntakeRecord {
  const get = (f: CsvField) => (mapping[f] ? (row[mapping[f]!] ?? "").trim() : "");
  const rec: IntakeRecord = {
    input_source: "csv",
    source_reference: `row ${rowNumber}`,
    source_metadata: { import_batch_id: batchId, row: rowNumber },
  };
  const idea = get("idea");
  const url = get("url");
  if (idea) rec.original_idea = idea;
  if (url) rec.source_url = url;
  const title = get("title");
  if (title) rec.title = title;
  const brand = get("brand");
  if (brand) {
    const id = brandIdByName.get(brand.toLowerCase());
    if (!id) throw new ApiError("validation_failed", `unknown brand "${brand}"`);
    rec.brand_id = id;
  } else if (defaultBrandId) {
    rec.brand_id = defaultBrandId;
  }
  const ct = get("content_type").toLowerCase();
  if (ct) {
    if (!CONTENT_TYPES.has(ct))
      throw new ApiError("validation_failed", `unknown content type "${ct}"`);
    rec.content_type = ct as IntakeRecord["content_type"];
  }
  const lang = get("language").toLowerCase();
  if (lang) rec.language = lang;
  const tags = get("tags");
  if (tags)
    rec.tags = tags
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter(Boolean);
  return rec;
}

export async function importCsv(
  sql: Sql,
  dispatcher: Dispatcher,
  input: {
    workspaceId: string;
    actorId: string;
    fileName: string;
    text: string;
    request: CsvImportRequest;
    batchId: string;
    storagePath: string | null;
  },
) {
  const { headers, rows } = parseCsv(input.text);
  const { mapping } = input.request;
  const missing = Object.values(mapping).filter((col) => col && !headers.includes(col));
  if (missing.length) {
    throw new ApiError("validation_failed", "mapped columns are missing from the file", {
      missing,
      headers,
    });
  }

  const brands = await sql<{ id: string; name: string }[]>`
    select id, name from public.brands where workspace_id = ${input.workspaceId} and archived_at is null`;
  const brandIdByName = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));
  if (input.request.brand_id && !brands.some((b) => b.id === input.request.brand_id)) {
    throw new ApiError("validation_failed", "brand_id is not in this workspace");
  }

  const dryRun = input.request.dry_run ?? false;
  if (!dryRun) {
    await sql`
      insert into public.import_batches (id, workspace_id, brand_id, file_name, storage_path, field_mapping, total_rows, created_by)
      values (${input.batchId}, ${input.workspaceId}, ${input.request.brand_id ?? null}, ${input.fileName},
              ${input.storagePath}, ${sql.json(mapping as never)}, ${rows.length}, ${input.actorId})`;
  }

  const report: RowReport[] = [];
  // Dry runs predict duplicates the same way create_project() will detect them.
  const seenInFile = new Map<string, number>();
  for (const { row: rowNumber, cells: row } of rows) {
    try {
      const record = rowToRecord(
        row,
        mapping,
        brandIdByName,
        input.request.brand_id,
        rowNumber,
        input.batchId,
      );
      if (dryRun) {
        const rec = validate<IntakeRecord>("intakeRecord", normalizeRecord(record));
        const hash = await dedupeHash(rec.original_idea, rec.source_url);
        const [existing] = await sql<{ id: string }[]>`
          select id from public.content_projects
          where workspace_id = ${input.workspaceId} and dedupe_hash = ${hash} and status <> 'cancelled'
          order by created_at limit 1`;
        if (existing) {
          report.push({ row: rowNumber, status: "duplicate", duplicate_of: existing.id });
        } else if (seenInFile.has(hash)) {
          report.push({
            row: rowNumber,
            status: "duplicate",
            error: `same idea as row ${seenInFile.get(hash)}`,
          });
        } else {
          seenInFile.set(hash, rowNumber);
          report.push({ row: rowNumber, status: "valid" });
        }
        continue;
      }
      const r = await intakeIdea(sql, dispatcher, record, {
        workspaceId: input.workspaceId,
        actorId: input.actorId,
        sourceKey: `csv:${input.batchId}:${rowNumber}`,
        autoAnalyze: input.request.auto_analyze ?? true,
        importBatchId: input.batchId,
      });
      report.push(
        r.created
          ? { row: rowNumber, status: "created", project_id: r.project_id }
          : {
              row: rowNumber,
              status: "duplicate",
              project_id: r.project_id,
              duplicate_of: r.duplicate_of ?? undefined,
            },
      );
    } catch (err) {
      const e = err instanceof ApiError ? err : null;
      const detail = e?.details?.errors
        ? (e.details.errors as ReturnType<typeof formatErrors>)
            .map((x) => `${x.path} ${x.message}`)
            .join("; ")
        : "";
      report.push({
        row: rowNumber,
        status: "failed",
        error: e ? [e.message, detail].filter(Boolean).join(": ") : "unexpected error",
      });
      if (!e) console.error("csv row failed", rowNumber, err);
    }
  }

  const totals = {
    rows: rows.length,
    created: report.filter((r) => r.status === "created").length,
    duplicate: report.filter((r) => r.status === "duplicate").length,
    failed: report.filter((r) => r.status === "failed").length,
    valid: report.filter((r) => r.status === "valid").length,
  };

  if (!dryRun) {
    await sql`
      update public.import_batches
      set status = 'completed', created_count = ${totals.created}, failed_count = ${totals.failed},
          duplicate_count = ${totals.duplicate}, report = ${sql.json(report as never)}
      where id = ${input.batchId}`;
  }
  return {
    import_batch_id: dryRun ? null : input.batchId,
    dry_run: dryRun,
    headers,
    totals,
    rows: report,
  };
}
