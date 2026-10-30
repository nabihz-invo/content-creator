import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { captureWorkspace } from "../src/capture.ts";
import { validateWorkspace } from "../src/check.mjs";
import { assembleWorkspace } from "../src/workspace.ts";
import { specFor } from "./fixtures.ts";

const OUT = process.env.TEMPLATE_SHOTS ?? null; // set to a directory to keep screenshots

const CASES: [
  format: "static" | "carousel" | "video",
  style: string,
  lang: "ar" | "en",
  mode: "dark" | "light",
][] = [
  ["static", "claymorphism", "ar", "light"],
  ["static", "glassmorphism", "en", "dark"],
  ["static", "holographic_scifi", "ar", "dark"],
  ["static", "minimal_flat", "en", "light"],
  ["static", "editorial", "ar", "light"],
  ["carousel", "claymorphism", "en", "light"],
  ["carousel", "glassmorphism", "ar", "dark"],
  ["video", "glassmorphism", "ar", "dark"],
  ["video", "claymorphism", "en", "light"],
  ["video", "holographic_scifi", "en", "dark"],
];

for (const [format, style, lang, mode] of CASES) {
  test(`${format} / ${style} / ${lang} renders cleanly offline`, { timeout: 180_000 }, async () => {
    const dir = mkdtempSync(join(tmpdir(), "cc-ws-"));
    const spec = specFor(format, style, lang, mode);
    assembleWorkspace(dir, spec);
    const check = validateWorkspace(dir, { format });
    assert.deepEqual(check.errors, [], "starter template passes the validator");
    const r = await captureWorkspace(dir, spec);
    assert.deepEqual(r.errors, [], "no page errors");
    assert.deepEqual(r.blockedRequests, [], "no network requests");
    const expected =
      format === "carousel" ? spec.slides.length : format === "video" ? spec.scenes.length : 1;
    assert.equal(r.shots.length, expected);
    for (const s of r.shots) assert.ok(s.png.length > 10_000, `${s.name} is not blank`);
    if (OUT) {
      mkdirSync(OUT, { recursive: true });
      for (const s of r.shots)
        writeFileSync(join(OUT, `${format}-${style}-${lang}-${s.name}.png`), s.png);
    }
  });
}
