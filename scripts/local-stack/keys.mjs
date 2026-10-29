// Prints local-only anon / service_role JWTs (HS256) for the dev stack.
// The secret is the well-known Supabase local default — never use in production.
import { createHmac } from "node:crypto";

export const JWT_SECRET = "super-secret-jwt-token-with-at-least-32-characters-long";

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
export function sign(payload) {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64(payload);
  const sig = createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

const exp = Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 3600;
export const ANON_KEY = sign({ iss: "supabase-local", role: "anon", exp });
export const SERVICE_ROLE_KEY = sign({ iss: "supabase-local", role: "service_role", exp });

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(
    `JWT_SECRET=${JWT_SECRET}\nANON_KEY=${ANON_KEY}\nSERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}`,
  );
}
