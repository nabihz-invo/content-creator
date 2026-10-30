/**
 * Short-lived preview tokens (ADR-0007 §6). The API signs a token for one
 * creative version's storage prefix; the preview server verifies it and only
 * serves files under that prefix. Web Crypto: works in Deno and Node.
 */

export interface PreviewClaims {
  /** Storage prefix inside the previews bucket, e.g. "<project>/creative-v2/". */
  p: string;
  /** Expiry, unix seconds. */
  e: number;
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function signPreviewToken(secret: string, claims: PreviewClaims): Promise<string> {
  if (!/^[0-9a-f-]{36}\/creative-v\d+\/$/.test(claims.p)) throw new Error("invalid preview prefix");
  const body = b64url(enc.encode(JSON.stringify(claims)));
  return `${body}.${b64url(await hmac(secret, body))}`;
}

/** Returns the claims, or null for a malformed, forged, or expired token. */
export async function verifyPreviewToken(
  secret: string,
  token: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<PreviewClaims | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = b64url(await hmac(secret, body));
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(body))) as PreviewClaims;
    if (typeof claims.p !== "string" || typeof claims.e !== "number" || claims.e < nowSeconds)
      return null;
    return claims;
  } catch {
    return null;
  }
}

/** Content-Security-Policy for preview responses: local assets only, no network, embeddable by the CRM only. */
export function previewCsp(frameAncestors: string[]): string {
  return [
    "default-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' data: blob:",
    "connect-src 'none'",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    `frame-ancestors ${frameAncestors.length ? frameAncestors.join(" ") : "'none'"}`,
  ].join("; ");
}
