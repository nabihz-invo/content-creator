import { spawn } from "node:child_process";

export interface ExecResult {
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  aborted: boolean;
}

/** Runs a command without a shell; kills it on timeout or abort. */
export function run(
  cmd: string,
  args: string[],
  opts: {
    cwd?: string;
    env?: Record<string, string>;
    timeoutMs?: number;
    signal?: AbortSignal;
    input?: string;
  } = {},
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: opts.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let aborted = false;
    const kill = () => child.kill("SIGKILL");
    const timer = opts.timeoutMs
      ? setTimeout(() => ((timedOut = true), kill()), opts.timeoutMs)
      : null;
    const onAbort = () => ((aborted = true), kill());
    opts.signal?.addEventListener("abort", onAbort, { once: true });
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
      resolve({ code, stdout, stderr, timedOut, aborted });
    });
    // A child that exits before reading stdin makes the write fail with EPIPE; that is not an error here.
    child.stdin.on("error", () => {});
    child.stdin.end(opts.input ?? "");
  });
}

export async function git(args: string[], cwd: string) {
  const r = await run("git", args, {
    cwd,
    env: {
      PATH: process.env.PATH ?? "/usr/bin:/bin",
      HOME: cwd,
      GIT_TERMINAL_PROMPT: "0",
      GIT_CONFIG_NOSYSTEM: "1",
    },
    timeoutMs: 120_000,
  });
  if (r.code !== 0)
    throw new Error(
      `git ${args[0]} failed: ${(r.stderr || r.stdout).trim().replace(/\/\/[^@\s]+@/g, "//***@")}`,
    );
  return r.stdout.trim();
}
