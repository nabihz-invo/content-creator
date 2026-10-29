/**
 * Prints the SQL VALUES block for project_status_transitions from the
 * TypeScript status machine. Paste between the GENERATED markers when a new
 * migration changes the table:  pnpm --filter @cc/shared transitions:sql
 */
import { TRANSITIONS } from "../src/status.ts";

export function transitionsSql(): string {
  const rows = TRANSITIONS.map(
    (t) => `  ('${t.from}', '${t.to}', '${t.trigger.replace(/'/g, "''")}')`,
  );
  return (
    "insert into public.project_status_transitions (from_status, to_status, trigger_description) values\n" +
    rows.join(",\n") +
    ";"
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(transitionsSql());
}
