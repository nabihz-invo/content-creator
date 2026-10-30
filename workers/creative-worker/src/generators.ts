/**
 * Generators turn an assembled workspace into the finished creative (ADR-0007 §3).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { run } from "./exec.ts";

export interface GenerateInput {
  dir: string;
  /** Deterministic creative prompt (buildCreativePrompt) — appended to the system prompt. */
  systemPrompt: string;
  revisionNotes: string | null;
  isRevision: boolean;
  /** Validator findings from a previous pass, for a fix-up round. */
  fixErrors?: string[];
  signal?: AbortSignal;
}

export interface GenerateResult {
  generator: "template" | "claude-code";
  summary: string;
  costUsd: number | null;
  turns: number | null;
}

export interface Generator {
  name: "template" | "claude-code";
  generate(input: GenerateInput): Promise<GenerateResult>;
}

/** The starter template rendered from the spec as-is (dev, CI, fallback). */
export const templateGenerator: Generator = {
  name: "template",
  generate: () =>
    Promise.resolve({
      generator: "template",
      summary: "Starter template rendered from the content spec.",
      costUsd: null,
      turns: null,
    }),
};

export class GeneratorError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

export const ALLOWED_TOOLS = [
  "Read",
  "Write",
  "Edit",
  "MultiEdit",
  "Glob",
  "Grep",
  "Bash(node check.mjs)",
];
export const DISALLOWED_TOOLS = ["WebFetch", "WebSearch"];

export function taskPrompt(input: GenerateInput): string {
  const lines = input.isRevision
    ? [
        "Revise the creative in this directory. It is the previously reviewed version.",
        "Apply the reviewer's notes below precisely and keep everything they did not ask to change.",
        "",
        "<reviewer_notes>",
        input.revisionNotes ?? "(no notes)",
        "</reviewer_notes>",
      ]
    : [
        "Build the creative described in your system instructions in this directory.",
        "Start from the working starter files (index.html, main.js, styles.css) and make it showreel quality.",
      ];
  if (input.fixErrors?.length) {
    lines.push(
      "",
      "The checker rejected the last attempt. Fix every finding:",
      ...input.fixErrors.map((e) => `- ${e}`),
    );
  }
  lines.push(
    "",
    "Follow CLAUDE.md. Read copy and timing from spec.js. Finish by running `node check.mjs` until it prints OK.",
  );
  return lines.join("\n");
}

export function claudeCodeArgs(
  input: GenerateInput,
  cfg: { model: string; effort: string; budgetUsd: number },
): string[] {
  return [
    "-p",
    taskPrompt(input),
    "--output-format",
    "json",
    "--model",
    cfg.model,
    "--effort",
    cfg.effort,
    "--append-system-prompt",
    input.systemPrompt,
    "--permission-mode",
    "dontAsk",
    "--allowedTools",
    ALLOWED_TOOLS.join(","), // commas: "Bash(node check.mjs)" contains a space
    "--disallowedTools",
    DISALLOWED_TOOLS.join(","),
    "--strict-mcp-config",
    "--setting-sources",
    "project",
    "--no-session-persistence",
    "--max-budget-usd",
    String(cfg.budgetUsd),
  ];
}

/**
 * Claude Code, headless, inside the workspace. The process gets an empty
 * environment except PATH, a private HOME, and its own API key — never
 * database, storage, or Git credentials.
 */
export function claudeCodeGenerator(cfg: {
  bin: string;
  apiKey: string;
  model: string;
  effort: string;
  budgetUsd: number;
  timeoutMs: number;
}): Generator {
  return {
    name: "claude-code",
    async generate(input) {
      const home = join(input.dir, ".home");
      mkdirSync(home, { recursive: true });
      const r = await run(cfg.bin, claudeCodeArgs(input, cfg), {
        cwd: input.dir,
        env: {
          PATH: process.env.PATH ?? "/usr/bin:/bin",
          HOME: home,
          ANTHROPIC_API_KEY: cfg.apiKey,
          CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: "1",
        },
        timeoutMs: cfg.timeoutMs,
        signal: input.signal,
      });
      if (r.aborted) throw new GeneratorError("generation cancelled", false);
      if (r.timedOut)
        throw new GeneratorError(`Claude Code timed out after ${cfg.timeoutMs / 1000}s`, true);
      let out: {
        is_error?: boolean;
        result?: string;
        total_cost_usd?: number;
        num_turns?: number;
        subtype?: string;
      } = {};
      try {
        out = JSON.parse(r.stdout.trim().split("\n").at(-1) ?? "{}");
      } catch {
        throw new GeneratorError(
          `Claude Code returned no JSON (exit ${r.code}): ${r.stderr.slice(0, 500)}`,
          true,
        );
      }
      if (r.code !== 0 || out.is_error) {
        throw new GeneratorError(
          `Claude Code failed (${out.subtype ?? `exit ${r.code}`}): ${(out.result ?? r.stderr).slice(0, 500)}`,
          out.subtype !== "error_max_budget_usd",
        );
      }
      return {
        generator: "claude-code",
        summary: (out.result ?? "").slice(0, 2000),
        costUsd: out.total_cost_usd ?? null,
        turns: out.num_turns ?? null,
      };
    },
  };
}
