import type { Sql } from "./db.ts";
import type { StoragePort } from "./storage.ts";

/**
 * Removes the files the database queued for deletion (deleted rows, replaced or released files;
 * P5-T15). Supabase does not allow deleting storage objects from SQL, so rows queue their paths
 * and this removes them through the Storage API. Called right after a delete/release and by the
 * recovery cron, which retries anything that failed.
 */
export async function purgeStorage(
  sql: Sql,
  storage: StoragePort,
  limit = 200,
): Promise<{ removed: number; failed: number; pending: number }> {
  const rows = await sql<{ id: string; bucket: string; path: string }[]>`
    select id::text, bucket, path from public.claim_storage_deletions(${limit})`;
  const byBucket = new Map<string, { id: string; path: string }[]>();
  for (const r of rows) byBucket.set(r.bucket, [...(byBucket.get(r.bucket) ?? []), r]);

  const done: string[] = [];
  const failed: Record<string, string> = {};
  for (const [bucket, items] of byBucket) {
    try {
      await storage.remove(
        bucket,
        items.map((i) => i.path),
      );
      done.push(...items.map((i) => i.id));
    } catch (e) {
      for (const i of items) failed[i.id] = e instanceof Error ? e.message : String(e);
    }
  }
  const [{ r }] = (await sql`
    select public.finish_storage_deletions(${done}::bigint[], ${sql.json(failed as never)}) as r`) as unknown as [
    { r: { done: number; pending: number } },
  ];
  return { removed: done.length, failed: Object.keys(failed).length, pending: r.pending };
}
