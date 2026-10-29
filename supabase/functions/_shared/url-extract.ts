/**
 * SSRF-safe page fetch + text extraction (docs/SECURITY.md "Untrusted input").
 * Only http/https, public IPs only (checked on every redirect hop), 10 s
 * timeout, 2 MB cap, HTML/text only. Output is plain text: it is data for the
 * AI analysis prompt, never instructions.
 */
import { ApiError } from "./errors.ts";
import { cleanText } from "./sanitize.ts";

export const FETCH_TIMEOUT_MS = 10_000;
export const MAX_BYTES = 2 * 1024 * 1024;
export const MAX_REDIRECTS = 3;
export const MAX_TEXT = 20_000;

export interface Net {
  fetch: typeof fetch;
  resolve: (host: string) => Promise<string[]>;
}

export const defaultNet: Net = {
  fetch: (...args) => fetch(...args),
  async resolve(host) {
    const [a, aaaa] = await Promise.allSettled([
      Deno.resolveDns(host, "A"),
      Deno.resolveDns(host, "AAAA"),
    ]);
    return [
      ...(a.status === "fulfilled" ? a.value : []),
      ...(aaaa.status === "fulfilled" ? aaaa.value : []),
    ];
  },
};

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p) || Number(p) > 255) return null;
    n = n * 256 + Number(p);
  }
  return n;
}

const V4_BLOCKED: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
];

export function isPublicIp(ip: string): boolean {
  const v4 = ipv4ToInt(ip);
  if (v4 !== null) {
    return !V4_BLOCKED.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (v4 & mask) >>> 0 === (ipv4ToInt(base)! & mask) >>> 0;
    });
  }
  const v6 = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (!v6.includes(":")) return false;
  if (v6 === "::" || v6 === "::1") return false;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicIp(mapped[1]!);
  // fc00::/7 unique-local, fe80::/10 link-local, ff00::/8 multicast, 2001:db8::/32 docs, 64:ff9b::/96 NAT64
  if (/^f[cd]/.test(v6) || /^fe[89ab]/.test(v6) || /^ff/.test(v6)) return false;
  if (v6.startsWith("2001:db8:") || v6.startsWith("64:ff9b:")) return false;
  return true;
}

export async function assertPublicUrl(raw: string, net: Net): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ApiError("validation_failed", "invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiError("validation_failed", "only http(s) URLs are allowed");
  }
  if (url.username || url.password)
    throw new ApiError("validation_failed", "URLs with credentials are not allowed");
  if (url.port && !["80", "443", "8080", "8443"].includes(url.port)) {
    throw new ApiError("validation_failed", "port not allowed");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (/^localhost$|\.local$|\.internal$|\.localhost$/i.test(host)) {
    throw new ApiError("forbidden", "host not allowed");
  }
  const literal = ipv4ToInt(host) !== null || host.includes(":");
  const ips = literal ? [host] : await net.resolve(host);
  if (ips.length === 0) throw new ApiError("validation_failed", "host does not resolve");
  if (!ips.every(isPublicIp)) throw new ApiError("forbidden", "host resolves to a private address");
  return url;
}

async function readCapped(res: Response): Promise<Uint8Array> {
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) throw new ApiError("payload_too_large", "page is too large");
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new ApiError("payload_too_large", "page is too large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code =
        e[1]?.toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : "";
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${key}["']`,
    "i",
  );
  const m = html.match(re);
  return m ? decodeEntities(m[1] ?? m[2] ?? "").trim() || null : null;
}

export interface Extracted {
  final_url: string;
  title: string | null;
  description: string | null;
  language: string | null;
  text: string;
  truncated: boolean;
  content_type: string;
}

export function extractFromHtml(html: string): Omit<Extracted, "final_url" | "content_type"> {
  const title =
    metaContent(html, "og:title") ??
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      ? decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)![1]!).trim()
      : null);
  const description = metaContent(html, "og:description") ?? metaContent(html, "description");
  const language = html.match(/<html[^>]*\blang=["']?([a-zA-Z-]+)/i)?.[1]?.toLowerCase() ?? null;

  let body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(
      /<(script|style|noscript|svg|template|iframe|head|nav|footer|form)\b[\s\S]*?<\/\1>/gi,
      " ",
    );
  const main = body.match(/<(article|main)\b[^>]*>([\s\S]*?)<\/\1>/i);
  if (main) body = main[2]!;
  const text = cleanText(
    decodeEntities(
      body
        .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section)\b[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    )
      .replace(/[ \t ]+/g, " ")
      .replace(/ *\n */g, "\n"),
    MAX_TEXT + 1,
  );
  return {
    title,
    description,
    language,
    text: text.slice(0, MAX_TEXT),
    truncated: text.length > MAX_TEXT,
  };
}

export async function fetchAndExtract(raw: string, net: Net = defaultNet): Promise<Extracted> {
  let url = await assertPublicUrl(raw, net);
  for (let hop = 0; ; hop++) {
    let res: Response;
    try {
      res = await net.fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          "user-agent": "ContentCreatorBot/1.0 (+idea intake)",
          accept: "text/html,application/xhtml+xml,text/plain;q=0.9",
        },
      });
    } catch (err) {
      throw new ApiError("validation_failed", "could not fetch the page", { reason: String(err) });
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      await res.body?.cancel();
      if (hop >= MAX_REDIRECTS) throw new ApiError("validation_failed", "too many redirects");
      url = await assertPublicUrl(new URL(res.headers.get("location")!, url).toString(), net);
      continue;
    }
    if (!res.ok) {
      await res.body?.cancel();
      throw new ApiError("validation_failed", `page returned HTTP ${res.status}`);
    }
    const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!/^(text\/html|application\/xhtml\+xml|text\/plain)/.test(contentType)) {
      await res.body?.cancel();
      throw new ApiError(
        "validation_failed",
        `unsupported content type ${contentType || "unknown"}`,
      );
    }
    const bytes = await readCapped(res);
    const charset = contentType.match(/charset=([\w-]+)/)?.[1] ?? "utf-8";
    let decoded: string;
    try {
      decoded = new TextDecoder(charset).decode(bytes);
    } catch {
      decoded = new TextDecoder("utf-8").decode(bytes);
    }
    const base = contentType.startsWith("text/plain")
      ? {
          title: null,
          description: null,
          language: null,
          text: cleanText(decoded, MAX_TEXT),
          truncated: decoded.length > MAX_TEXT,
        }
      : extractFromHtml(decoded);
    return { ...base, final_url: url.toString(), content_type: contentType.split(";")[0]! };
  }
}
