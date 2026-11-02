// Manual smoke check: opens a creative version's preview through the running preview server in
// headless Chromium and reports failed requests, page errors and readiness.
//   node workers/preview-server/test/preview-smoke.mjs <project_id> <version> <out.png>
// Needs PREVIEW_SIGNING_SECRET (workers/.env) and Playwright (NODE_PATH).
import { createRequire } from "node:module";
import { signPreviewToken } from "@cc/shared";

const [, , project, version, out] = process.argv;
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const token = await signPreviewToken(process.env.PREVIEW_SIGNING_SECRET, {
  p: `${project}/creative-v${version}/`,
  e: Math.floor(Date.now() / 1000) + 600,
});
const url = `http://localhost:${process.env.PORT ?? 54400}/p/${token}/index.html`;
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
const failed = [];
page.on("requestfailed", (r) => failed.push(`${r.url().replace(token, "<t>")} ${r.failure()?.errorText}`));
page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url().replace(token, "<t>")}`));
page.on("pageerror", (e) => failed.push(`pageerror ${e.message}`));
await page.goto(url, { waitUntil: "load" });
const ready = await page
  .waitForFunction(() => window.__ready === true, null, { timeout: 30000 })
  .then(() => true)
  .catch(() => false);
await page.screenshot({ path: out });
console.log(JSON.stringify({ ready, failed: failed.slice(0, 15) }, null, 1));
await browser.close();
