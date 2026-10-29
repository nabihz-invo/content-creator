import type { Sql } from "./db.ts";
import { ApiError } from "./errors.ts";

export async function enforceRateLimit(sql: Sql, key: string, limit: number, windowSeconds = 60) {
  const [row] = await sql<
    { ok: boolean }[]
  >`select public.hit_rate_limit(${key}, ${limit}, ${windowSeconds}) as ok`;
  if (!row?.ok) {
    throw new ApiError("rate_limited", "too many requests", {
      limit,
      window_seconds: windowSeconds,
    });
  }
}
