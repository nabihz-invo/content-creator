/**
 * Creative source in Git (ADR-0002/0007): projects/<project_id>/v<version>/,
 * one commit per version. Shallow clones per job; pushes retry with rebase
 * because versions never touch the same paths.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { git } from "./exec.ts";

export interface CommitResult {
  sha: string;
  path: string;
}

export interface SourceStore {
  commitVersion(input: {
    workDir: string;
    files: string[];
    sourceDir: string;
    projectId: string;
    version: number;
    message: string;
  }): Promise<CommitResult>;
  checkout(input: { workDir: string; sha: string; path: string; dest: string }): Promise<void>;
}

const AUTHOR = [
  "-c",
  "user.name=Content Pipeline",
  "-c",
  "user.email=creative-worker@content-pipeline.local",
];

async function clone(repoUrl: string, workDir: string): Promise<string> {
  mkdirSync(workDir, { recursive: true });
  const dir = mkdtempSync(join(workDir, "repo-"));
  await git(["clone", "--depth", "1", "--no-tags", repoUrl, dir], workDir);
  // Identity for commits and for rebasing onto concurrent pushes.
  await git(["config", "user.name", "Content Pipeline"], dir);
  await git(["config", "user.email", "creative-worker@content-pipeline.local"], dir);
  return dir;
}

/** Initializes a local bare repository with a main branch (dev only). */
export async function ensureLocalRepo(repoUrl: string, workDir: string) {
  if (!repoUrl.startsWith("file://")) return;
  const path = repoUrl.slice("file://".length);
  if (existsSync(join(path, "HEAD"))) return;
  mkdirSync(path, { recursive: true });
  await git(["init", "--bare", "--initial-branch=main", path], workDir);
  const seed = mkdtempSync(join(workDir, "seed-"));
  await git(["init", "--initial-branch=main", seed], seed);
  await git([...AUTHOR, "commit", "--allow-empty", "-m", "Initialize creatives repository"], seed);
  await git(["push", path, "main"], seed);
  rmSync(seed, { recursive: true, force: true });
}

export function gitSourceStore(repoUrl: string): SourceStore {
  return {
    async commitVersion({ workDir, files, sourceDir, projectId, version, message }) {
      const repo = await clone(repoUrl, workDir);
      try {
        const rel = `projects/${projectId}/v${version}`;
        const dest = join(repo, rel);
        rmSync(dest, { recursive: true, force: true });
        mkdirSync(dest, { recursive: true });
        for (const f of files) {
          mkdirSync(join(dest, f, ".."), { recursive: true });
          cpSync(join(sourceDir, f), join(dest, f));
        }
        await git(["add", "--", rel], repo);
        await git([...AUTHOR, "commit", "-m", message], repo);
        for (let attempt = 1; ; attempt++) {
          try {
            await git(["push", "origin", "HEAD:main"], repo);
            break;
          } catch (err) {
            if (attempt >= 4) throw err;
            await git(["pull", "--rebase", "--depth", "50", "origin", "main"], repo);
          }
        }
        return { sha: await git(["rev-parse", "HEAD"], repo), path: rel };
      } finally {
        rmSync(repo, { recursive: true, force: true });
      }
    },

    async checkout({ workDir, sha, path, dest }) {
      mkdirSync(workDir, { recursive: true });
      const repo = mkdtempSync(join(workDir, "co-"));
      try {
        await git(["init", "--quiet"], repo);
        await git(["remote", "add", "origin", repoUrl], repo);
        await git(["fetch", "--depth", "1", "origin", sha], repo);
        await git(["checkout", "--quiet", "FETCH_HEAD", "--", path], repo);
        mkdirSync(dest, { recursive: true });
        for (const f of readdirSync(join(repo, path)))
          cpSync(join(repo, path, f), join(dest, f), { recursive: true });
      } finally {
        rmSync(repo, { recursive: true, force: true });
      }
    },
  };
}
