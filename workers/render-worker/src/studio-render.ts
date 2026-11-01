/**
 * Studio creatives (ADR-0009, CONTRACTS §10): one page, one output per language.
 * Video: every frame is drawn with window.__render.seek(t) and piped to FFmpeg;
 * the audio (music, voice, allowed UI sounds) is mixed here, never by the page.
 * Carousel / static: the page's named stills, one PNG per slide and language.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, normalize, sep } from "node:path";
import type { ContentSpec } from "@cc/shared";
import { studioFrames, type StudioTimeline } from "@cc/creative-worker/capture";
import { serveDir } from "@cc/creative-worker/static-server";

const require = createRequire(import.meta.url);

export interface StudioFile {
  name: string;
  language: "en" | "ar";
  kind: "png" | "mp4";
  slideIndex: number | null;
  data: Buffer;
  durationS: number | null;
}

export interface StudioOutcome {
  files: StudioFile[];
  errors: string[];
  blockedRequests: string[];
  notes: string[];
}

interface AudioCfg {
  voice?: string;
  voiceAt?: number;
  voiceVolume?: number;
  music?: string;
  musicVolume?: number;
  musicStart?: number;
  fadeOut?: number;
  duck?: boolean;
  lufs?: number;
  sfxVolume?: number;
}

/** A page-relative or /absolute audio path → a file inside the workspace, or null. */
export function resolveInWorkspace(dir: string, p: unknown): string | null {
  if (typeof p !== "string" || !p.startsWith("/")) return null;
  const f = normalize(join(dir, decodeURIComponent(p)));
  if (!f.startsWith(normalize(dir) + sep) || !existsSync(f)) return null;
  return f;
}

/** FFmpeg inputs and filter graph for the mix (ported from the Stacko Studio renderer). */
export function audioGraph(
  dir: string,
  audio: AudioCfg | null,
  sfx: { name: string; t: number; vol?: number }[],
  allow: string[],
  durationS: number,
): { inputs: string[]; filter: string | null; notes: string[]; dropped: string[] } {
  const A = audio ?? {};
  const inputs: string[] = [];
  const filters: string[] = [];
  const mixes: string[] = [];
  const notes: string[] = [];
  let ai = 1;
  const voice = resolveInWorkspace(dir, A.voice);
  const music = resolveInWorkspace(dir, A.music);
  if (A.voice && !voice) notes.push(`voice file not in the workspace: ${A.voice}`);
  if (A.music && !music) notes.push(`music file not in the workspace: ${A.music}`);
  if (voice) {
    inputs.push("-i", voice);
    const ms = Math.round((A.voiceAt ?? 0) * 1000);
    filters.push(
      `[${ai}:a]${ms > 0 ? `adelay=${ms}|${ms},` : ""}volume=${A.voiceVolume ?? 1},aresample=48000[v0]`,
    );
    mixes.push("v");
    ai++;
  }
  if (music) {
    inputs.push("-stream_loop", "-1", "-i", music);
    const fo = A.fadeOut ?? 1.2;
    filters.push(
      `[${ai}:a]atrim=start=${A.musicStart ?? 0},asetpts=PTS-STARTPTS,atrim=duration=${durationS},volume=${A.musicVolume ?? 0.18},afade=t=in:d=0.4,afade=t=out:st=${Math.max(0, durationS - fo)}:d=${fo},aresample=48000[m0]`,
    );
    if (voice && A.duck !== false)
      filters.push(
        "[v0]asplit=2[v][vk]",
        "[m0][vk]sidechaincompress=threshold=0.04:ratio=9:attack=15:release=350[m]",
      );
    else filters.push("[m0]anull[m]");
    mixes.push("m");
    ai++;
  }
  if (voice && !filters.some((f) => f.includes("[v0]asplit"))) filters.push("[v0]anull[v]");
  const dropped = [...new Set(sfx.filter((c) => !allow.includes(c.name)).map((c) => c.name))];
  let k = 0;
  for (const c of sfx) {
    if (!allow.includes(c.name) || c.t < 0 || c.t > durationS) continue;
    const f = ["mp3", "wav", "m4a", "ogg"]
      .map((x) => resolveInWorkspace(dir, `/assets/audio/sfx/${c.name}.${x}`))
      .find(Boolean);
    if (!f) continue;
    inputs.push("-i", f);
    const ms = Math.round(c.t * 1000);
    filters.push(
      `[${ai}:a]adelay=${ms}|${ms},volume=${(c.vol ?? 1) * (A.sfxVolume ?? 0.55)},aresample=48000[s${k}]`,
    );
    mixes.push(`s${k}`);
    ai++;
    k++;
  }
  if (!mixes.length) return { inputs, filter: null, notes, dropped };
  filters.push(
    `${mixes.map((m) => `[${m}]`).join("")}amix=inputs=${mixes.length}:normalize=0:dropout_transition=0,loudnorm=I=${A.lufs ?? -16}:TP=-1.5:LRA=11,alimiter=limit=0.95,atrim=duration=${durationS}[aout]`,
  );
  return { inputs, filter: filters.join(";"), notes, dropped };
}

export async function renderStudio(
  dir: string,
  spec: ContentSpec,
  opts: {
    timeoutMs: number;
    ffmpeg: string;
    crf?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<StudioOutcome> {
  const studio = spec.studio;
  if (!studio) throw new Error("not a studio creative");
  const { chromium } = require("playwright") as typeof import("playwright");
  const server = await serveDir(dir);
  const browser = await chromium.launch({
    args: [
      "--autoplay-policy=no-user-gesture-required",
      "--font-render-hinting=none",
      "--disable-background-networking",
      // WebGL for 3D scenes (sm-three.js) on machines without a GPU.
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const errors: string[] = [];
  const blocked: string[] = [];
  const notes: string[] = [];
  const files: StudioFile[] = [];
  try {
    const context = await browser.newContext({
      viewport: { width: spec.width, height: spec.height },
      deviceScaleFactor: 1,
      serviceWorkers: "block",
      acceptDownloads: false,
    });
    await context.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith(`${server.url}/`) || url.startsWith("data:") || url.startsWith("blob:"))
        return route.continue();
      blocked.push(url);
      return route.abort("blockedbyclient");
    });
    const langs = studio.languages;
    for (const [li, lang] of langs.entries()) {
      const tag = lang.toUpperCase();
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(`${tag}: ${e.message}`));
      page.on("console", (m) => m.type() === "error" && errors.push(`${tag}: ${m.text()}`));
      page.on("popup", (p) => void p.close());
      await page.goto(`${server.url}/index.html?render=1&lang=${lang}`, {
        waitUntil: "load",
        timeout: opts.timeoutMs,
      });
      await page.waitForFunction(
        () => (window as unknown as { __ready?: boolean }).__ready === true,
        null,
        { timeout: opts.timeoutMs },
      );
      const tl = (await page.evaluate(() => {
        const r = (window as unknown as { __render: StudioTimeline }).__render;
        return {
          duration: r.duration,
          fps: r.fps,
          width: r.width,
          height: r.height,
          scenes: r.scenes,
          stills: r.stills,
          cover: r.cover,
          audio: r.audio,
          sfx: r.sfx,
        };
      })) as Omit<StudioTimeline, "seek">;
      if (tl.width !== spec.width || tl.height !== spec.height)
        throw new Error(
          `${tag}: the page is ${tl.width}×${tl.height}, the spec ${spec.width}×${spec.height}`,
        );
      const seek = (t: number) =>
        page.evaluate(
          (x) => (window as unknown as { __render: StudioTimeline }).__render.seek(x),
          t,
        );
      const shot = (type: "png" | "jpeg") =>
        page.screenshot({
          type,
          ...(type === "jpeg" ? { quality: 94 } : {}),
          clip: { x: 0, y: 0, width: spec.width, height: spec.height },
        });

      if (spec.format !== "video") {
        const frames = studioFrames(spec, tl);
        for (const [i, f] of frames.entries()) {
          await seek(f.t);
          files.push({
            name: `${spec.format === "static" ? "post" : `slide-${String(i + 1).padStart(2, "0")}`}_${tag}`,
            language: lang,
            kind: "png",
            slideIndex: spec.format === "carousel" ? i + 1 : null,
            data: await shot("png"),
            durationS: null,
          });
        }
        opts.onProgress?.(li + 1, langs.length);
        await page.close();
        continue;
      }

      const fps = tl.fps;
      const n = Math.max(1, Math.round(tl.duration * fps));
      const durationS = n / fps;
      const mix = audioGraph(dir, tl.audio as AudioCfg | null, tl.sfx, studio.sfx_allow, durationS);
      notes.push(...mix.notes.map((x) => `${tag}: ${x}`));
      if (mix.dropped.length)
        notes.push(
          `${tag}: dropped non-UI sound cues (music-driven transitions): ${mix.dropped.join(", ")}`,
        );
      const tmp = mkdtempSync(join(tmpdir(), "studio-mp4-"));
      const out = join(tmp, "out.mp4");
      const args = [
        "-y",
        "-f",
        "image2pipe",
        "-framerate",
        String(fps),
        "-c:v",
        "mjpeg",
        "-i",
        "-",
        ...mix.inputs,
        "-map",
        "0:v",
        ...(mix.filter
          ? ["-filter_complex", mix.filter, "-map", "[aout]", "-c:a", "aac", "-b:a", "192k"]
          : []),
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        String(opts.crf ?? 18),
        "-pix_fmt",
        "yuv420p",
        "-r",
        String(fps),
        "-g",
        String(fps * 2),
        "-movflags",
        "+faststart",
        "-t",
        String(durationS),
        out,
      ];
      const proc = spawn(opts.ffmpeg, args, { stdio: ["pipe", "ignore", "pipe"] });
      let ferr = "";
      proc.stderr.on("data", (d) => {
        ferr = (ferr + d).slice(-6000);
      });
      const done = new Promise<void>((res, rej) =>
        proc.on("close", (c) =>
          c === 0 ? res() : rej(new Error(`ffmpeg failed: ${ferr.slice(-1500)}`)),
        ),
      );
      try {
        for (let i = 0; i < n; i++) {
          await seek(i / fps);
          const buf = await shot("jpeg");
          if (!proc.stdin.write(buf)) await new Promise((r) => proc.stdin.once("drain", r));
          if (i % fps === 0) opts.onProgress?.(li * n + i, langs.length * n);
        }
        proc.stdin.end();
        await done;
        files.push({
          name: `video_${tag}`,
          language: lang,
          kind: "mp4",
          slideIndex: null,
          data: readFileSync(out),
          durationS,
        });
      } finally {
        if (proc.exitCode === null) proc.kill();
        rmSync(tmp, { recursive: true, force: true });
      }
      opts.onProgress?.((li + 1) * n, langs.length * n);
      await page.close();
    }
    return { files, errors, blockedRequests: blocked, notes };
  } finally {
    await browser.close();
    await server.close();
  }
}
