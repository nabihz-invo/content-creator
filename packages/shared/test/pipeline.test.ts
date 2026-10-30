import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import {
  analysisStageSchema,
  briefStageSchema,
  carouselScriptSchema,
  staticScriptSchema,
  toApiSchema,
  videoScriptSchema,
} from "../src/ai-schemas.ts";
import { CATALOG, dimensionsFor } from "../src/config-catalog.ts";
import { fakeAnalysis, fakeBrief, fakeScript } from "../src/fake-ai.ts";
import {
  brandDefaults,
  checkScript,
  composeClarification,
  composeQuestionnaire,
  enforceApprovedConfig,
} from "../src/pipeline.ts";
import {
  type Answers,
  isVisible,
  suggestedAnswers,
  validateAnswers,
} from "../src/questionnaire.ts";

const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
const brand = {
  name: "Noor",
  default_language: "ar",
  settings: {
    voice: { tone: "Warm and witty" },
    palette: [
      { name: "Espresso", hex: "#3B2417", role: "background" },
      { name: "Saffron", hex: "#E8A33D", role: "accent" },
    ],
    cta: { default: "Visit us today" },
    audiences: [{ id: "a", name: "Coffee lovers", description: "Riyadh, 20-35" }],
    claims: { prohibited: ["best coffee in the world"] },
  },
};

describe("catalog", () => {
  it("has unique ids and valid show_if references", () => {
    const ids = CATALOG.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of CATALOG) if (q.show_if) expect(ids).toContain(q.show_if.question);
    for (const q of CATALOG)
      if (["select", "radio", "checkbox"].includes(q.type))
        expect(q.options?.length).toBeGreaterThan(1);
  });
  it("maps aspect ratios to render sizes", () => {
    expect(dimensionsFor("9:16")).toEqual({ width: 1080, height: 1920 });
    expect(dimensionsFor("16:9")).toEqual({ width: 1920, height: 1080 });
  });
});

describe("schemas", () => {
  it("are strict-compatible: every object closed and fully required", () => {
    const walk = (s: unknown) => {
      if (Array.isArray(s)) return s.forEach(walk);
      if (!s || typeof s !== "object") return;
      const o = s as Record<string, unknown>;
      if (o.type === "object") {
        expect(o.additionalProperties).toBe(false);
        expect(Object.keys(o.properties as object).sort()).toEqual(
          [...(o.required as string[])].sort(),
        );
      }
      Object.values(o).forEach(walk);
    };
    [
      analysisStageSchema,
      briefStageSchema,
      videoScriptSchema,
      carouselScriptSchema,
      staticScriptSchema,
    ].forEach(walk);
  });
  it("toApiSchema strips unsupported keywords but keeps property names", () => {
    const api = JSON.stringify(toApiSchema(analysisStageSchema));
    expect(api).not.toMatch(/"(maxLength|minLength|maxItems|minItems|pattern|minimum|maximum)"/);
    expect(api).toContain('"question_id"');
  });
  it("fake outputs validate against the schemas", () => {
    const a = fakeAnalysis({
      idea: "Ramadan offer video for our cafe",
      title: "Ramadan",
      content_type: null,
    });
    expect(ajv.validate(analysisStageSchema, a), JSON.stringify(ajv.errors)).toBe(true);
    const b = fakeBrief({
      idea: "x",
      answers: {},
      clarification_answered: false,
      brand_prohibited: [],
    });
    expect(ajv.validate(briefStageSchema, b), JSON.stringify(ajv.errors)).toBe(true);
  });
});

describe("questionnaire", () => {
  const ai = fakeAnalysis({
    idea: "A 3D motion video explaining our new loyalty offer",
    title: "Loyalty",
    content_type: null,
  });
  const q = composeQuestionnaire(ai, brand);

  it("pre-fills from AI, then brand settings", () => {
    const byId = Object.fromEntries(q.questions.map((x) => [x.id, x]));
    expect(byId.q_format!.suggested).toMatchObject({ value: "video", source: "ai" });
    expect(byId.q_accent_color!.suggested).toMatchObject({ value: "#e8a33d", source: "brand" });
    expect(byId.q_tone!.suggested?.source).toBe("ai");
    expect(byId.q_reference_notes).toBeUndefined(); // optional + skipped
    expect(byId.q_custom_offer_end_date?.required).toBe(true);
  });

  it("drops AI suggestions that don't fit the question", () => {
    const bad = {
      ...ai,
      suggestions: [
        ...ai.suggestions.filter((s) => s.question_id !== "q_aspect_ratio"),
        {
          question_id: "q_aspect_ratio",
          value: "21:9",
          rationale: { en: "", ar: "" },
          confidence: "high" as const,
        },
      ],
    };
    const q2 = composeQuestionnaire(bad, null);
    expect(q2.questions.find((x) => x.id === "q_aspect_ratio")!.suggested).toBeNull();
  });

  it("never lets the AI skip a required question", () => {
    const q2 = composeQuestionnaire({ ...ai, skip: ["q_core_message", "q_cta"] }, null);
    expect(q2.questions.some((x) => x.id === "q_core_message")).toBe(true);
  });

  it("evaluates conditional visibility including hidden parents", () => {
    const style = q.questions.find((x) => x.id === "q_visual_style_custom")!;
    expect(isVisible(style, { q_visual_style: "custom" }, q.questions)).toBe(true);
    expect(isVisible(style, { q_visual_style: "glassmorphism" }, q.questions)).toBe(false);
    const cam = q.questions.find((x) => x.id === "q_camera_style")!;
    expect(isVisible(cam, { q_format: "static" }, q.questions)).toBe(false);
  });

  it("validates answers: required, options, ai_decide, hidden answers dropped", () => {
    const answers: Answers = { ...suggestedAnswers(q), q_custom_offer_end_date: "End of Ramadan" };
    let r = validateAnswers(q, answers);
    expect(r.errors).toEqual({});
    expect(r.valid).toBe(true);

    r = validateAnswers(q, { ...answers, q_core_message: "" });
    expect(r.errors.q_core_message).toBe("required");
    r = validateAnswers(q, { ...answers, q_aspect_ratio: "21:9" });
    expect(r.errors.q_aspect_ratio).toBe("invalid_option");
    r = validateAnswers(q, { ...answers, q_hook: { ai_decide: true } });
    expect(r.valid).toBe(true);
    r = validateAnswers(q, { ...answers, q_format: { ai_decide: true } });
    expect(r.errors.q_format).toBe("ai_decide_not_allowed");
    r = validateAnswers(q, { ...answers, q_scene_beats: "only one beat" });
    expect(r.errors.q_scene_beats).toBe("too_few");
    r = validateAnswers(q, { ...answers, q_format: "static", q_camera_style: "smooth_orbit" });
    expect(r.cleaned.q_camera_style).toBeUndefined();
    r = validateAnswers(q, { ...answers, q_evil: "x" });
    expect(r.errors.q_evil).toBe("unknown_question");
    r = validateAnswers(q, { ...answers, q_accent_color: "red" });
    expect(r.errors.q_accent_color).toBe("pattern");
  });

  it("brand defaults read voice, palette accent, CTA, language, audiences", () => {
    expect(brandDefaults(brand)).toMatchObject({
      q_tone: "Warm and witty",
      q_accent_color: "#e8a33d",
      q_cta: "Visit us today",
      q_language: "ar",
    });
  });

  it("clarification rounds contain only the new questions and no AI-decide", () => {
    const c = composeClarification(
      fakeBrief({
        idea: "[clarify]",
        answers: {},
        clarification_answered: false,
        brand_prohibited: [],
      }).clarification_questions,
    );
    expect(c.kind).toBe("clarification");
    expect(c.questions.map((x) => x.id)).toEqual(["q_custom_target_city"]);
    expect(c.questions[0]!.allow_ai_decide).toBe(false);
  });
});

describe("brief + script", () => {
  const answers: Answers = {
    q_core_message: "Our new winter menu",
    q_format: "video",
    q_duration: "15",
    q_aspect_ratio: "9:16",
    q_language: "ar",
    q_platforms: ["instagram"],
    q_visual_style: "claymorphism",
    q_accent_color: "#E8A33D",
    q_camera_style: "swoop_reveal",
    q_post_fx: "bold",
    q_scene_beats: "1. Cold street\n2. Warm cup\n3. Menu reveal",
    q_hashtags: "winter, #coffee",
    q_cta: "Visit today",
  };

  it("approved answers override the AI brief", () => {
    const ai = fakeBrief({
      idea: "x",
      answers,
      clarification_answered: true,
      brand_prohibited: [],
    }).brief!;
    const b = enforceApprovedConfig(ai, answers);
    expect(b).toMatchObject({
      content_type: "video",
      duration_seconds: 15,
      aspect_ratio: "9:16",
      language: "ar",
      slide_count: null,
    });
    expect(b.visual).toMatchObject({
      style: "claymorphism",
      accent_color: "#e8a33d",
      camera_style: "swoop_reveal",
      post_fx: "bold",
    });
    expect(b.narrative_beats).toEqual(["Cold street", "Warm cup", "Menu reveal"]);
    expect(b.hashtags).toEqual(["#winter", "#coffee"]);
  });

  it("fake scripts pass structural checks for every format; broken timing is reported", () => {
    const base = enforceApprovedConfig(
      fakeBrief({ idea: "x", answers, clarification_answered: true, brand_prohibited: [] }).brief!,
      answers,
    );
    const video = fakeScript(base);
    expect(checkScript(video, base)).toEqual([]);
    expect(new Ajv2020({ strict: false }).validate(videoScriptSchema, video)).toBe(true);
    const broken = structuredClone(video) as typeof video & { scenes: { start_s: number }[] };
    broken.scenes[1]!.start_s += 1;
    expect(checkScript(broken, base).join(" ")).toMatch(/contiguous/);

    const carouselBrief = enforceApprovedConfig(base, {
      ...answers,
      q_format: "carousel",
      q_slide_count: "5",
    });
    const carousel = fakeScript(carouselBrief);
    expect(checkScript(carousel, carouselBrief)).toEqual([]);
    const staticBrief = enforceApprovedConfig(base, { ...answers, q_format: "static" });
    expect(checkScript(fakeScript(staticBrief), staticBrief)).toEqual([]);
  });
});
