// Generated-code validator (ADR-0007 §4). Plain JS so the same file runs in
// the worker and inside Claude Code's workspace (`node check.mjs`).
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, sep } from "node:path";

export const LIMITS = {
  maxFiles: 300,
  maxFileBytes: 6 * 1024 * 1024,
  maxTotalBytes: 30 * 1024 * 1024,
};

const ALLOWED_EXT = new Set([
  ".html",
  ".css",
  ".js",
  ".mjs",
  ".json",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".woff2",
  ".woff",
  ".ttf",
  ".otf",
  ".md",
  ".txt",
]);
const CODE_EXT = new Set([".html", ".css", ".js", ".mjs", ".svg"]);
/** Workspace files that are tooling, not part of the creative. */
const IGNORED = new Set(["CLAUDE.md", "check.mjs"]);
/** Vendored, reviewed libraries are exempt from code rules (sizes still apply). */
const TRUSTED_PREFIXES = ["vendor/", "fonts/"];

const RULES = [
  {
    id: "network",
    re: /\b(fetch|XMLHttpRequest|WebSocket|EventSource|RTCPeerConnection)\b\s*\(|navigator\.sendBeacon|new\s+(WebSocket|EventSource|XMLHttpRequest|Worker|SharedWorker)\b/,
    message: "network APIs are not allowed",
  },
  {
    id: "eval",
    re: /\beval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*["'`]|setInterval\s*\(\s*["'`]/,
    message: "dynamic code evaluation is not allowed",
  },
  {
    id: "remote-import",
    re: /\bimport\s*\(\s*["'`]https?:|importScripts\s*\(/,
    message: "remote/dynamic imports are not allowed",
  },
  {
    id: "storage",
    re: /\b(localStorage|sessionStorage|indexedDB)\b|document\.cookie/,
    message: "browser storage and cookies are not allowed",
  },
  {
    id: "escape",
    re: /\bwindow\.(parent|top|opener)\b|\bparent\.document\b|\btop\.location\b/,
    message: "access to the embedding page is not allowed",
  },
  {
    id: "randomness",
    re: /\bMath\.random\s*\(/,
    message: "use the seeded prng() from lib/runtime.js instead of Math.random",
  },
  {
    id: "wallclock",
    re: /\bDate\.now\s*\(|\bnew\s+Date\s*\(\s*\)/,
    message: "renders must not depend on the wall clock",
  },
  {
    id: "embed",
    re: /<\s*(iframe|object|embed|frame|base)\b/i,
    message: "embedded documents and <base> are not allowed",
  },
];

// Any absolute URL except XML/SVG namespace identifiers.
const URL_RE = /\b(?:https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}[^\s"'`)]*/gi;
const URL_ALLOW = [/^https?:\/\/www\.w3\.org\//i];

function walk(dir, root = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = lstatSync(p, { throwIfNoEntry: false }); // lstat: never follow links out of the workspace
    if (!st) continue;
    if (st.isSymbolicLink()) out.push({ path: relative(root, p), size: 0, symlink: true });
    else if (st.isDirectory()) walk(p, root, out);
    else out.push({ path: relative(root, p).split(sep).join("/"), size: st.size });
  }
  return out;
}

/**
 * @param {string} dir workspace root
 * @param {{ format: "static"|"carousel"|"video" }} opts
 * @returns {{ ok: boolean, errors: {file: string, rule: string, message: string, line?: number}[], files: {path: string, size: number}[], totalBytes: number }}
 */
export function validateWorkspace(dir, opts) {
  const errors = [];
  const files = walk(dir).filter((f) => !IGNORED.has(f.path));
  const add = (file, rule, message, line) =>
    errors.push({ file, rule, message, ...(line ? { line } : {}) });

  if (files.length > LIMITS.maxFiles)
    add(".", "too-many-files", `more than ${LIMITS.maxFiles} files`);
  const total = files.reduce((n, f) => n + f.size, 0);
  if (total > LIMITS.maxTotalBytes)
    add(".", "too-large", `workspace exceeds ${LIMITS.maxTotalBytes} bytes`);

  for (const f of files) {
    if (f.symlink) {
      add(f.path, "symlink", "symbolic links are not allowed");
      continue;
    }
    const ext = extname(f.path).toLowerCase();
    if (!ALLOWED_EXT.has(ext))
      add(f.path, "file-type", `file type ${ext || "(none)"} is not allowed`);
    if (f.size > LIMITS.maxFileBytes)
      add(f.path, "file-size", `file exceeds ${LIMITS.maxFileBytes} bytes`);
    if (!CODE_EXT.has(ext) || TRUSTED_PREFIXES.some((p) => f.path.startsWith(p))) continue;
    const text = readFileSync(join(dir, f.path), "utf8");
    const lines = text.split("\n");
    lines.forEach((line, i) => {
      for (const r of RULES) if (r.re.test(line)) add(f.path, r.id, r.message, i + 1);
      for (const m of line.matchAll(URL_RE)) {
        const url = m[0].startsWith("//") ? `https:${m[0]}` : m[0];
        if (!URL_ALLOW.some((a) => a.test(url)))
          add(
            f.path,
            "remote-url",
            `remote URL ${m[0]} is not allowed; bundle the asset locally`,
            i + 1,
          );
      }
    });
  }

  const index = files.find((f) => f.path === "index.html");
  if (!index) add("index.html", "missing", "index.html is required at the workspace root");
  // The shared runtime defines markReady(); the creative's own code must call it.
  const js = files.filter(
    (f) =>
      /\.(m?js)$/.test(f.path) &&
      !TRUSTED_PREFIXES.some((p) => f.path.startsWith(p)) &&
      !f.path.startsWith("lib/"),
  );
  const allJs = js.map((f) => readFileSync(join(dir, f.path), "utf8")).join("\n");
  if (!/__ready\s*=\s*true/.test(allJs) && !/\bmarkReady\s*\(\s*\)/.test(allJs))
    add(
      ".",
      "ready-hook",
      "set window.__ready = true when the creative is fully rendered (or call markReady())",
    );
  if (opts.format === "video" && !/__render\s*=/.test(allJs))
    add(
      ".",
      "render-hook",
      "video creatives must expose window.__render = { duration, fps, seek(t) }",
    );
  if (!files.some((f) => f.path === "spec.js"))
    add("spec.js", "missing", "spec.js must stay in the workspace");

  return {
    ok: errors.length === 0,
    errors,
    files: files.map(({ path, size }) => ({ path, size })),
    totalBytes: total,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const spec =
    readFileSync(join(process.cwd(), "spec.js"), "utf8").match(/"format":\s*"(\w+)"/)?.[1] ??
    "static";
  const r = validateWorkspace(process.cwd(), { format: spec });
  if (r.ok) console.log(`OK — ${r.files.length} files, ${r.totalBytes} bytes`);
  else {
    for (const e of r.errors)
      console.log(`${e.file}${e.line ? `:${e.line}` : ""}  [${e.rule}] ${e.message}`);
    process.exitCode = 1;
  }
}
