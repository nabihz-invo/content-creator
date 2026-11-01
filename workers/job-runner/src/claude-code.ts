/**
 * Answers the API's model requests with Claude Code on this PC (ADR-0011), signed in with the
 * owner's Claude subscription (CLAUDE_CODE_OAUTH_TOKEN from `claude setup-token`), not an API key.
 *
 * A request is the exact Messages API call the stage would have made (system prompt, conversation,
 * output schema, model, effort). Claude Code runs it with no tools, in an empty temporary folder,
 * and the reply is stored as a Messages API response, so the stage's own checks decide if it is
 * good (a failed check comes back as a new request with the problems listed).
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface AiRequest {
  id: string;
  job_id: string;
  stage: string;
  params: {
    model: string;
    system?: { text: string }[] | string;
    messages: { role: "user" | "assistant"; content: string | { type: string; text?: string }[] }[];
    output_config?: { effort?: string; format?: { schema?: unknown } };
  };
}

export interface ClaudeCodeConfig {
  bin: string;
  oauthToken: string;
  timeoutMs: number;
}

const text = (c: AiRequest["params"]["messages"][number]["content"]) =>
  typeof c === "string"
    ? c
    : c
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("");

/** The conversation as one prompt; earlier turns (a retry after failed checks) are quoted first. */
export function promptOf(params: AiRequest["params"]): string {
  const msgs = params.messages;
  const last = text(msgs[msgs.length - 1]!.content);
  const earlier = msgs
    .slice(0, -1)
    .map(
      (m) =>
        `<${m.role === "assistant" ? "your_previous_answer" : "request"}>\n${text(m.content)}\n</${m.role === "assistant" ? "your_previous_answer" : "request"}>`,
    )
    .join("\n\n");
  const schema = params.output_config?.format?.schema;
  return [
    earlier && `Earlier in this task:\n\n${earlier}\n\nNow:`,
    last,
    schema &&
      `Return only one JSON object (no Markdown, no text around it) that is valid against this JSON Schema:\n${JSON.stringify(schema)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The JSON object in a reply, without Markdown fences or text around it. */
export function extractJson(s: string): string {
  const t = s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  return a >= 0 && b > a ? t.slice(a, b + 1) : t;
}

/** What Windows programs need beyond PATH/HOME, kept inside the temporary home. */
function windowsEnv(home: string): Record<string, string> {
  const tmp = join(home, "tmp");
  mkdirSync(tmp, { recursive: true });
  const pass = (k: string) => (process.env[k] ? { [k]: process.env[k]! } : {});
  return {
    ...pass("SystemRoot"),
    ...pass("SystemDrive"),
    ...pass("ComSpec"),
    ...pass("PATHEXT"),
    ...pass("CLAUDE_CODE_GIT_BASH_PATH"),
    USERPROFILE: home,
    APPDATA: join(home, "AppData", "Roaming"),
    LOCALAPPDATA: join(home, "AppData", "Local"),
    TEMP: tmp,
    TMP: tmp,
  };
}

/** Runs one request; resolves to a Messages API response, or throws with the reason. */
export async function answer(req: AiRequest, cfg: ClaudeCodeConfig) {
  const p = req.params;
  const dir = mkdtempSync(join(tmpdir(), "cc-ai-"));
  try {
    const system =
      typeof p.system === "string" ? p.system : (p.system ?? []).map((b) => b.text).join("\n\n");
    const systemFile = join(dir, "system.md");
    writeFileSync(systemFile, system);
    const args = [
      "-p",
      "--output-format",
      "json",
      "--model",
      p.model,
      ...(p.output_config?.effort ? ["--effort", p.output_config.effort] : []),
      "--system-prompt-file",
      systemFile,
      "--tools",
      "",
      "--strict-mcp-config",
      "--setting-sources",
      "project",
      "--no-session-persistence",
    ];
    const home = join(dir, ".home");
    mkdirSync(home, { recursive: true });
    const out = await new Promise<{
      code: number | null;
      stdout: string;
      stderr: string;
      timedOut: boolean;
    }>((resolve, reject) => {
      const child = spawn(cfg.bin, args, {
        cwd: dir,
        env: {
          PATH: process.env.PATH ?? "/usr/bin:/bin",
          HOME: home,
          CLAUDE_CODE_OAUTH_TOKEN: cfg.oauthToken,
          CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
          ...(process.platform === "win32" ? windowsEnv(home) : {}),
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const timer = setTimeout(() => ((timedOut = true), child.kill("SIGKILL")), cfg.timeoutMs);
      child.stdout.on("data", (d) => (stdout += d));
      child.stderr.on("data", (d) => (stderr += d));
      child.on("error", reject);
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ code, stdout, stderr, timedOut });
      });
      child.stdin.on("error", () => {});
      child.stdin.end(promptOf(p));
    });
    if (out.timedOut) throw new Error(`Claude Code timed out after ${cfg.timeoutMs / 1000}s`);
    let r: {
      is_error?: boolean;
      result?: string;
      subtype?: string;
      usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number };
    } = {};
    try {
      r = JSON.parse(out.stdout.trim().split("\n").at(-1) ?? "{}");
    } catch {
      throw new Error(
        `Claude Code returned no JSON (exit ${out.code}): ${out.stderr.slice(0, 400)}`,
      );
    }
    if (out.code !== 0 || r.is_error || !r.result)
      throw new Error(
        `Claude Code failed (${r.subtype ?? `exit ${out.code}`}): ${(r.result ?? out.stderr).slice(0, 400)}`,
      );
    return {
      id: `cc_${req.id}`,
      type: "message",
      role: "assistant",
      model: p.model,
      content: [{ type: "text", text: extractJson(r.result), citations: null }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: {
        input_tokens: r.usage?.input_tokens ?? 0,
        output_tokens: r.usage?.output_tokens ?? 0,
        cache_read_input_tokens: r.usage?.cache_read_input_tokens ?? 0,
      },
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
