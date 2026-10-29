/**
 * Canonical JSON + SHA-256 hashing. Uses Web Crypto so the same code runs in
 * the browser, Node >= 20, and Deno (Edge Functions).
 */

/** Deterministic JSON: object keys sorted, no whitespace, `undefined` dropped. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => (v === undefined ? null : sortDeep(v)));
  if (value !== null && typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) out[key] = sortDeep(v);
    }
    return out;
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new TypeError("canonicalJson: non-finite numbers are not allowed");
  }
  return value;
}

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** content_hash for JSON artifacts (scripts, briefs, manifests…). */
export function contentHash(value: unknown): Promise<string> {
  return sha256Hex(canonicalJson(value));
}

/**
 * Normalizes idea text for duplicate detection: Unicode NFKC, lowercase,
 * Arabic diacritics/tatweel removed, whitespace collapsed.
 */
export function normalizeIdeaText(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strips tracking params / fragments and lowercases host for URL dedupe. */
export function normalizeUrl(raw: string): string {
  const u = new URL(raw.trim());
  u.hash = "";
  u.hostname = u.hostname.toLowerCase();
  for (const key of [...u.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_|igshid$|si$)/i.test(key)) u.searchParams.delete(key);
  }
  if (u.pathname.length > 1 && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
  return u.toString();
}

/** dedupe_hash for content_projects. */
export function dedupeHash(idea: string | null | undefined, url: string | null | undefined) {
  const parts = [idea ? normalizeIdeaText(idea) : "", url ? normalizeUrl(url) : ""];
  return sha256Hex(parts.join("\n"));
}
