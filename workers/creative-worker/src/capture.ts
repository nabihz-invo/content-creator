/**
 * Headless capture of a workspace: loads it from a local static server with
 * every other request blocked, waits for window.__ready, and screenshots.
 */
import { createRequire } from "node:module";
import type { ContentSpec } from "@cc/shared";
import { serveDir } from "./static-server.ts";

const require = createRequire(import.meta.url);

export interface Shot {
  name: string;
  query: string;
  png: Buffer;
}

export interface CaptureResult {
  shots: Shot[];
  errors: string[];
  blockedRequests: string[];
}

/** Which stills to capture: every slide, the middle of every scene, or the single post. */
export function shotList(spec: ContentSpec): { name: string; query: string }[] {
  if (spec.format === "carousel")
    return spec.slides.map((s) => ({
      name: `slide-${String(s.index).padStart(2, "0")}`,
      query: `?slide=${s.index}`,
    }));
  if (spec.format === "video") {
    return spec.scenes.map((s) => ({
      name: `scene-${String(s.index).padStart(2, "0")}`,
      query: `?t=${((s.start_s + s.end_s) / 2).toFixed(2)}`,
    }));
  }
  return [{ name: "post", query: "" }];
}

/** window.__render of a studio page (docs/CONTRACTS.md §10). */
export interface StudioTimeline {
  duration: number;
  fps: number;
  width: number;
  height: number;
  scenes: { start: number; end: number; name: string }[];
  stills: { name: string; t: number }[];
  cover: number | null;
  audio: Record<string, unknown> | null;
  sfx: { name: string; t: number; vol?: number }[];
  seek: (t: number) => Promise<void>;
}

/** Carousel/static: the page's named stills (one per slide); video: the middle of every scene. */
export function studioFrames(
  spec: Pick<ContentSpec, "format">,
  tl: Pick<StudioTimeline, "duration" | "scenes" | "stills">,
): { name: string; t: number }[] {
  if (spec.format === "video")
    return tl.scenes.map((s, i) => ({
      name: `scene-${String(i + 1).padStart(2, "0")}`,
      t: (s.start + s.end) / 2,
    }));
  const stills = tl.stills.length
    ? tl.stills
    : [
        {
          name: spec.format === "static" ? "post" : "slide-01",
          t: Math.max(0, tl.duration - 0.05),
        },
      ];
  return spec.format === "static"
    ? stills.slice(0, 1).map((s) => ({ ...s, name: "post" }))
    : stills;
}

export async function captureWorkspace(
  dir: string,
  spec: ContentSpec,
  opts: { timeoutMs?: number; scale?: number } = {},
): Promise<CaptureResult> {
  const { chromium } = require("playwright") as typeof import("playwright");
  const server = await serveDir(dir);
  const browser = await chromium.launch({
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  const errors: string[] = [];
  const blocked: string[] = [];
  try {
    const context = await browser.newContext({
      viewport: { width: spec.width, height: spec.height },
      deviceScaleFactor: opts.scale ?? 1,
      javaScriptEnabled: true,
      serviceWorkers: "block",
    });
    // Network off: only the local workspace server is reachable.
    await context.route("**/*", (route) => {
      const url = route.request().url();
      if (url.startsWith(server.url) || url.startsWith("data:") || url.startsWith("blob:"))
        return route.continue();
      blocked.push(url);
      return route.abort();
    });
    const shots: Shot[] = [];
    if (spec.studio) {
      // Studio pages (ADR-0009): one load per language version, frames chosen from the page's own timeline.
      for (const lang of spec.studio.languages) {
        const page = await context.newPage();
        const tag = lang.toUpperCase();
        page.on("pageerror", (e) => errors.push(`${tag}: ${e.message}`));
        page.on("console", (m) => m.type() === "error" && errors.push(`${tag}: ${m.text()}`));
        await page.goto(`${server.url}/index.html?render=1&lang=${lang}`, {
          waitUntil: "load",
          timeout: opts.timeoutMs ?? 60_000,
        });
        await page.waitForFunction(
          () => (window as unknown as { __ready?: boolean }).__ready === true,
          null,
          { timeout: opts.timeoutMs ?? 60_000 },
        );
        const tl = (await page.evaluate(() => {
          const r = (window as unknown as { __render: StudioTimeline }).__render;
          return { duration: r.duration, scenes: r.scenes, stills: r.stills };
        })) as Pick<StudioTimeline, "duration" | "scenes" | "stills">;
        for (const f of studioFrames(spec, tl)) {
          await page.evaluate(
            (t) => (window as unknown as { __render: StudioTimeline }).__render.seek(t),
            f.t,
          );
          shots.push({
            name: `${f.name}_${tag}`,
            query: `?render=1&lang=${lang}&t=${f.t.toFixed(3)}`,
            png: await page.screenshot({ type: "png" }),
          });
        }
        await page.close();
      }
      return { shots, errors, blockedRequests: blocked };
    }
    for (const s of shotList(spec)) {
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(`${s.name}: ${e.message}`));
      page.on("console", (m) => m.type() === "error" && errors.push(`${s.name}: ${m.text()}`));
      const query = spec.format === "video" ? `${s.query}&still=1` : s.query;
      await page.goto(`${server.url}/index.html${query}`, {
        waitUntil: "load",
        timeout: opts.timeoutMs ?? 60_000,
      });
      await page.waitForFunction(
        () => (window as unknown as { __ready?: boolean }).__ready === true,
        null,
        { timeout: opts.timeoutMs ?? 60_000 },
      );
      shots.push({ name: s.name, query: s.query, png: await page.screenshot({ type: "png" }) });
      await page.close();
    }
    return { shots, errors, blockedRequests: blocked };
  } finally {
    await browser.close();
    await server.close();
  }
}
