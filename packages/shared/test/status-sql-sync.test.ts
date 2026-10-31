import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PROJECT_STATUSES, TRANSITIONS } from "../src/status.ts";

const MIGRATIONS = join(__dirname, "../../../supabase/migrations");

function migrationsSql(): string {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS, f), "utf8"))
    .join("\n");
}

describe("status machine ↔ SQL", () => {
  const sql = migrationsSql();

  it("project_status enum matches", () => {
    const m = sql.match(/create type public\.project_status as enum \(([\s\S]*?)\);/);
    expect(m).not.toBeNull();
    const values = [...m![1]!.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
    expect(values).toEqual([...PROJECT_STATUSES]);
  });

  it("project_status_transitions rows match TRANSITIONS", () => {
    const block = sql.match(
      /-- BEGIN GENERATED TRANSITIONS[\s\S]*?\n([\s\S]*?)-- END GENERATED TRANSITIONS/,
    );
    expect(block).not.toBeNull();
    // Later migrations add rows in "-- BEGIN ADDED TRANSITIONS" blocks.
    const added = [
      ...sql.matchAll(/-- BEGIN ADDED TRANSITIONS[\s\S]*?\n([\s\S]*?)-- END ADDED TRANSITIONS/g),
    ]
      .map((m) => m[1])
      .join("\n");
    const rows = [...`${block![1]!}\n${added}`.matchAll(/\('([a-z_]+)', '([a-z_]+)', '/g)].map(
      (x) => `${x[1]}>${x[2]}`,
    );
    const expected = TRANSITIONS.map((t) => `${t.from}>${t.to}`);
    expect(new Set(rows)).toEqual(new Set(expected));
    expect(rows.length).toBe(expected.length);
  });
});
