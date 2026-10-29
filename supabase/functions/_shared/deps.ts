import type { AuthVerifier } from "./auth.ts";
import type { Sql } from "./db.ts";
import type { Dispatcher } from "./n8n.ts";
import type { StoragePort } from "./storage.ts";

/** Everything a handler needs; tests inject fakes for auth, dispatch, storage, and network. */
export interface Deps {
  sql: Sql;
  auth: AuthVerifier;
  dispatcher: Dispatcher;
  storage: StoragePort;
  config: {
    crmUrl: string;
    allowedOrigins: string[];
    n8nWebhookSecret: string | null;
    telegramWebhookSecret: string | null;
  };
  /** Network access for URL extraction (injectable for tests). */
  net?: {
    fetch: typeof fetch;
    resolve: (host: string) => Promise<string[]>;
  };
}
