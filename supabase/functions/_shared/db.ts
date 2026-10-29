/**
 * Direct Postgres access (ADR-0005). Edge Functions connect with
 * SUPABASE_DB_URL; all writes go through security-definer RPCs, and every
 * request is authorized in code before touching data.
 */
import postgres from "postgres";

export type Sql = postgres.Sql;
export type TxSql = postgres.TransactionSql;

let shared: Sql | null = null;

export function connect(url: string): Sql {
  if (!shared) {
    shared = postgres(url, {
      max: 3,
      idle_timeout: 20,
      prepare: false, // required behind the Supabase transaction pooler
      transform: { undefined: null },
    });
  }
  return shared;
}
