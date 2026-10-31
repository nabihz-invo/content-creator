/**
 * Final render (ADR-0008 §3): the workspace is served from a local static
 * server; every other request is aborted. Each output is a fresh page at the
 * exact configured size (device scale 1), captured once fonts, images and the
 * creative's own readiness hook are done.
 */
import { createRequire } from "node:module";
import type { ContentSpec } from "@cc/shared";
import { serveDir } from "@cc/creative-worker/static-server";
import type { RenderedFile } from "./validate.ts";

const require = createRequire(import.meta.url);

export interface RenderOutcome {
  files: RenderedFile[];
  errors: string[];
  blockedRequests: string[];
}

export function outputsFor(
  spec: ContentSpec,
): { name: string; query: string; slideIndex: number | null }[] {
  if (spec.format === "carousel")
    return spec.slides.map((s) => ({
      name: `slide-${String(s.index).padStart(2, "0")}`,
      query: `?slide=${s.index}`,
      slideIndex: s.index,
    }));
  if (spec.format === "static") return [{ name: "post", query: "", slideIndex: null }];
  throw new Error(`format ${spec.format} is rendered by the video renderer (Phase 5)`);
}

export async function renderWorkspace(
  dir: string,
  spec: ContentSpec,
  opts: { timeoutMs: number; onProgress?: (done: number, total: number) => void },
): Promise<RenderOutcome> {
  const { chromium } = require("playwright") as typeof import("playwright");
  const server = await serveDir(dir);
  const browser = await chromium.launch({
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--disable-background-networking",
    ],
  });
  const errors: string[] = [];
  const blocked: string[] = [];
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
    const outputs = outputsFor(spec);
    const files: RenderedFile[] = [];
    for (const [i, o] of outputs.entries()) {
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(`${o.name}: ${e.message}`));
      page.on("console", (m) => m.type() === "error" && errors.push(`${o.name}: ${m.text()}`));
      page.on("popup", (p) => void p.close());
      await page.goto(`${server.url}/index.html${o.query}`, {
        waitUntil: "load",
        timeout: opts.timeoutMs,
      });
      await page.waitForFunction(
        () =>
          (window as unknown as { __ready?: boolean }).__ready === true &&
          document.fonts.status === "loaded" &&
          [...document.images].every((img) => img.complete),
        null,
        { timeout: opts.timeoutMs },
      );
      // Two frames so the last layout/paint after readiness is on screen.
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
      );
      files.push({
        name: o.name,
        slideIndex: o.slideIndex,
        png: await page.screenshot({ type: "png", animations: "disabled", caret: "hide" }),
      });
      await page.close();
      opts.onProgress?.(i + 1, outputs.length);
    }
    return { files, errors, blockedRequests: blocked };
  } finally {
    await browser.close();
    await server.close();
  }
}
