import { describe, expect, it } from "vitest";
import { buildContentSpec, contrastRatio, resolveColors, specScript } from "../src/content-spec.ts";
import { fakeBrief, fakeScript } from "../src/fake-ai.ts";
import { enforceApprovedConfig } from "../src/pipeline.ts";

const brand = {
  name: "Noor Café",
  default_language: "ar",
  settings: {
    palette: [
      { name: "Espresso", hex: "#3B2417", role: "background" },
      { name: "Saffron", hex: "#E8A33D", role: "accent" },
    ],
    typography: { heading_font: "Tajawal" },
  },
};
const meta = { id: "s1", version: 3, content_hash: "a".repeat(64) };

function briefFor(answers: Record<string, string>) {
  return enforceApprovedConfig(
    fakeBrief({ idea: "x", answers, clarification_answered: true, brand_prohibited: [] }).brief!,
    answers,
  );
}

describe("content spec", () => {
  it("video: size, timing, direction, scenes with camera keyframes", () => {
    const brief = briefFor({
      q_format: "video",
      q_duration: "15",
      q_aspect_ratio: "9:16",
      q_language: "ar",
      q_color_mode: "dark",
      q_accent_color: "#E8A33D",
    });
    const spec = buildContentSpec({
      projectId: "p",
      creativeVersion: 2,
      brief,
      script: fakeScript(brief),
      scriptMeta: meta,
      brand,
    });
    expect(spec).toMatchObject({
      format: "video",
      width: 1080,
      height: 1920,
      fps: 60,
      duration_s: 15,
      direction: "rtl",
      creative_version: 2,
    });
    expect(spec.scenes.length).toBeGreaterThan(1);
    expect(spec.scenes[0]!.camera.start).toHaveLength(3);
    expect(spec.colors).toMatchObject({ background: "#3b2417", accent: "#e8a33d" });
    expect(spec.brand.fonts).toEqual({ heading: "Tajawal", body: "Inter" });
    expect(spec.source).toEqual({
      script_id: "s1",
      script_version: 3,
      script_hash: "a".repeat(64),
    });
  });

  it("carousel and static", () => {
    const c = briefFor({
      q_format: "carousel",
      q_slide_count: "5",
      q_aspect_ratio: "4:5",
      q_language: "en",
      q_color_mode: "light",
    });
    const cs = buildContentSpec({
      projectId: "p",
      creativeVersion: 1,
      brief: c,
      script: fakeScript(c),
      scriptMeta: meta,
      brand: null,
    });
    expect(cs).toMatchObject({
      format: "carousel",
      width: 1080,
      height: 1350,
      fps: null,
      direction: "ltr",
    });
    expect(cs.slides.map((s) => s.role)).toEqual(["cover", "body", "body", "body", "cta"]);
    const s = briefFor({ q_format: "static", q_aspect_ratio: "1:1" });
    const ss = buildContentSpec({
      projectId: "p",
      creativeVersion: 1,
      brief: s,
      script: fakeScript(s),
      scriptMeta: meta,
      brand: null,
    });
    expect(ss.post?.headline).toBeTruthy();
  });

  it("colors follow the color mode and stay readable", () => {
    const light = briefFor({ q_format: "static", q_color_mode: "light" });
    const c = resolveColors(light, brand);
    expect(c.background).not.toBe("#3b2417"); // a dark brand background is not used for a light design
    expect(contrastRatio(c.text, c.background)).toBeGreaterThanOrEqual(4.5);
  });

  it("spec.js escapes '<' so copy cannot close a script tag", () => {
    const brief = briefFor({ q_format: "static" });
    const script = { ...fakeScript(brief), caption: "</script><script>alert(1)</script>" };
    const js = specScript(
      buildContentSpec({
        projectId: "p",
        creativeVersion: 1,
        brief,
        script,
        scriptMeta: meta,
        brand: null,
      }),
    );
    expect(js).not.toContain("</script>");
    expect(js.startsWith("window.__SPEC = ")).toBe(true);
  });
});
