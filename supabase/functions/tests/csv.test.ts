import { assert, assertEquals, assertThrows } from "@std/assert";
import { createApp } from "../api/app.ts";
import { decodeCsv, parseCsv } from "../_shared/csv-import.ts";
import { stripFormula } from "../_shared/sanitize.ts";
import { authed, createUser, makeDeps, sql, unique } from "./helpers.ts";

const BASE = "http://localhost/api";

function upload(
  app: ReturnType<typeof createApp>,
  userId: string,
  csv: string | Uint8Array,
  fields: Record<string, string>,
) {
  const form = new FormData();
  form.set("file", new File([csv as BlobPart], "ideas.csv", { type: "text/csv" }));
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return app.request(`${BASE}/imports/csv`, authed(userId, { method: "POST", body: form }));
}

Deno.test("CSV helpers", async (t) => {
  await t.step("formula injection is neutralized", () => {
    assertEquals(stripFormula('=HYPERLINK("x")'), 'HYPERLINK("x")');
    assertEquals(stripFormula("+@=cmd"), "cmd");
    assertEquals(stripFormula("-cmd"), "cmd");
    assertEquals(stripFormula("- bullet point"), "- bullet point");
    assertEquals(stripFormula("-5 tips"), "-5 tips");
  });
  await t.step("decodes UTF-8 with BOM and legacy Windows-1256 Arabic", () => {
    assertEquals(
      decodeCsv(new TextEncoder().encode("\uFEFFidea\nمرحبا")).replace(/^\uFEFF/, ""),
      "idea\nمرحبا",
    );
    // "مرحبا" in Windows-1256
    const cp1256 = new Uint8Array([0x69, 0x64, 0x65, 0x61, 0x0a, 0xe3, 0xd1, 0xcd, 0xc8, 0xc7]);
    assertEquals(decodeCsv(cp1256), "idea\nمرحبا");
  });
  await t.step("skips blank lines and enforces the row limit", () => {
    assertEquals(parseCsv("a,b\n\n1,2\n").rows, [{ row: 3, cells: { a: "1", b: "2" } }]);
    // a quoted multi-line cell is one spreadsheet row
    assertEquals(
      parseCsv('a\r\n"x\n\ny"\r\n\r\nz').rows.map((r) => r.row),
      [2, 4],
    );
    assertThrows(() => parseCsv("a\n" + "x\n".repeat(1001)));
  });
});

Deno.test("POST /api/imports/csv", async (t) => {
  const deps = makeDeps();
  const app = createApp(deps);
  const admin = await createUser("csv");
  const brandName = `Acme ${unique()}`;
  await sql`insert into public.brands (workspace_id, name) values (${admin.workspaceId}, ${brandName})`;
  const u = unique();
  const csv = [
    "Idea,Link,Brand,Tags,Format",
    `"Eid campaign, part 1 ${u}",,${brandName},"eid; campaign",carousel`,
    `,https://example.com/article-${u},,,`,
    `=CMD() dangerous ${u},,,,`,
    `Eid campaign, part 1 ${u},,,,`, // unquoted comma shifts " part 1…" into Link → invalid URL
    `"Eid campaign, part 1 ${u}",,,,`, // duplicate of row 2
    `,,,,`, // blank → skipped
    `Unknown brand ${u},,Nope Inc,,`,
    `Bad format ${u},,,,reel`,
  ].join("\n");
  const mapping = JSON.stringify({
    idea: "Idea",
    url: "Link",
    brand: "Brand",
    tags: "Tags",
    content_type: "Format",
  });

  let batchId = "";
  await t.step("imports rows and reports created / duplicate / failed", async () => {
    const res = await upload(app, admin.id, csv, { mapping });
    assertEquals(res.status, 200);
    const body = await res.json();
    batchId = body.import_batch_id;
    assertEquals(body.totals, { rows: 7, created: 3, duplicate: 1, failed: 3, valid: 0 });
    const byRow = Object.fromEntries(body.rows.map((r: { row: number }) => [r.row, r]));
    assertEquals(byRow[2].status, "created");
    assert(byRow[5].error.includes("source_url"), "shifted column fails URL validation");
    assertEquals(byRow[6].status, "duplicate");
    assertEquals(byRow[7], undefined, "blank row is skipped but keeps numbering");
    assertEquals(byRow[6].duplicate_of, byRow[2].project_id);
    assert(byRow[8].error.includes("unknown brand"));
    assert(byRow[9].error.includes("unknown content type"));

    const [p] =
      await sql`select original_idea, brand_id, content_type, import_batch_id, source_idempotency_key
                          from public.content_projects where id = ${byRow[4].project_id}`;
    assertEquals(p!.original_idea, `CMD() dangerous ${u}`, "formula prefix stripped");
    assertEquals(p!.import_batch_id, batchId);
    assertEquals(p!.source_idempotency_key, `csv:${batchId}:4`);

    const [b] = await sql`select status, created_count, duplicate_count, failed_count, storage_path
                          from public.import_batches where id = ${batchId}`;
    assertEquals(
      [b!.status, b!.created_count, b!.duplicate_count, b!.failed_count],
      ["completed", 3, 1, 3],
    );
    assertEquals(deps.uploads[0]?.bucket, "imports");
    assert(String(b!.storage_path).startsWith(`${admin.workspaceId}/${batchId}/`));
    assertEquals(deps.dispatched.length, 3, "one analysis dispatch per created project");
  });

  await t.step("re-importing the same file creates no new projects", async () => {
    const res = await upload(app, admin.id, csv, { mapping });
    const body = await res.json();
    assertEquals(body.totals.created, 0);
    assertEquals(body.totals.duplicate, 4);
    assertEquals(body.totals.failed, 3);
  });

  await t.step("dry run validates without writing", async () => {
    const before =
      await sql`select count(*)::int as n from public.content_projects where workspace_id = ${admin.workspaceId}`;
    const res = await upload(app, admin.id, `Idea\nfresh ${unique()}\n`, {
      mapping: JSON.stringify({ idea: "Idea" }),
      dry_run: "true",
    });
    const body = await res.json();
    assertEquals(body.dry_run, true);
    assertEquals(body.totals.valid, 1);
    const after =
      await sql`select count(*)::int as n from public.content_projects where workspace_id = ${admin.workspaceId}`;
    assertEquals(after[0]!.n, before[0]!.n);
  });

  await t.step("mapping must reference existing columns", async () => {
    const res = await upload(app, admin.id, "Idea\nx\n", {
      mapping: JSON.stringify({ idea: "Concept" }),
    });
    assertEquals(res.status, 422);
    assertEquals((await res.json()).error.details.missing, ["Concept"]);
  });

  await t.step("mapping needs idea or url", async () => {
    const res = await upload(app, admin.id, "Idea\nx\n", {
      mapping: JSON.stringify({ title: "Idea" }),
    });
    assertEquals(res.status, 422);
  });
});

Deno.test({ name: "close db", sanitizeOps: false, sanitizeResources: false, fn: () => sql.end() });
