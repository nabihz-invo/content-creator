import type { Sql } from "./db.ts";
import { ApiError } from "./errors.ts";
import { canonicalJson, sha256Hex } from "./vendor/src/hash.ts";

export interface StoredResponse {
  status: number;
  body: unknown;
}

/**
 * Runs `fn` at most once per (scope, key). A repeated request with the same
 * body gets the stored response; the same key with a different body is a 409.
 * Without a key, `fn` simply runs.
 */
export async function withIdempotency(
  sql: Sql,
  opts: { scope: string; key: string | null; userId: string | null; request: unknown },
  fn: () => Promise<StoredResponse>,
): Promise<StoredResponse & { replayed: boolean }> {
  if (!opts.key) return { ...(await fn()), replayed: false };
  if (opts.key.length > 255) throw new ApiError("validation_failed", "Idempotency-Key too long");

  const requestHash = await sha256Hex(canonicalJson(opts.request ?? null));
  const claimed = await sql<{ key: string }[]>`
    insert into public.idempotency_keys (scope, key, user_id, request_hash)
    values (${opts.scope}, ${opts.key}, ${opts.userId}, ${requestHash})
    on conflict (scope, key) do nothing
    returning key`;

  if (claimed.length === 0) {
    const [row] = await sql<
      { request_hash: string; status_code: number | null; response: unknown }[]
    >`
      select request_hash, status_code, response from public.idempotency_keys
      where scope = ${opts.scope} and key = ${opts.key}`;
    if (!row || row.request_hash !== requestHash) {
      throw new ApiError(
        "idempotency_conflict",
        "Idempotency-Key was used with a different request",
      );
    }
    if (row.status_code === null) {
      throw new ApiError(
        "idempotency_conflict",
        "a request with this Idempotency-Key is in progress",
      );
    }
    return { status: row.status_code, body: row.response, replayed: true };
  }

  try {
    const res = await fn();
    await sql`
      update public.idempotency_keys set status_code = ${res.status}, response = ${sql.json(res.body as never)}
      where scope = ${opts.scope} and key = ${opts.key}`;
    return { ...res, replayed: false };
  } catch (err) {
    // Release the key so the client can retry after a failure.
    await sql`delete from public.idempotency_keys where scope = ${opts.scope} and key = ${opts.key}`;
    throw err;
  }
}
