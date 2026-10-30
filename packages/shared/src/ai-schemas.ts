/**
 * JSON Schemas for every AI stage output (ADR-0006).
 *
 * Written to be compatible with Claude structured outputs: every object is
 * closed (`additionalProperties: false`) and lists all properties as required
 * (optional values are `anyOf [T, null]`). Length/range limits are kept here for
 * our own ajv validation and stripped by `toApiSchema()` before sending, since
 * the API does not accept them.
 */
import {
  CAMERA_STYLES,
  CATALOG_IDS,
  POST_FX,
  VISUAL_STYLES,
  ASPECT_RATIOS,
} from "./config-catalog.ts";

export type JsonSchema = Record<string, unknown>;

const str = (description?: string, extra: JsonSchema = {}): JsonSchema => ({
  type: "string",
  ...(description ? { description } : {}),
  ...extra,
});
const num = (description?: string): JsonSchema => ({
  type: "number",
  ...(description ? { description } : {}),
});
const int = (description?: string, extra: JsonSchema = {}): JsonSchema => ({
  type: "integer",
  ...(description ? { description } : {}),
  ...extra,
});
const bool = (description?: string): JsonSchema => ({
  type: "boolean",
  ...(description ? { description } : {}),
});
const en = (values: readonly string[], description?: string): JsonSchema => ({
  type: "string",
  enum: [...values],
  ...(description ? { description } : {}),
});
const arr = (items: JsonSchema, description?: string, extra: JsonSchema = {}): JsonSchema => ({
  type: "array",
  items,
  ...(description ? { description } : {}),
  ...extra,
});
const nullable = (s: JsonSchema): JsonSchema => ({ anyOf: [s, { type: "null" }] });
const obj = (properties: Record<string, JsonSchema>, description?: string): JsonSchema => ({
  type: "object",
  ...(description ? { description } : {}),
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const localized = (description?: string, max = 600): JsonSchema =>
  obj(
    {
      en: str("English", { maxLength: max }),
      ar: str("Modern Standard Arabic", { maxLength: max }),
    },
    description,
  );

const answerValue = (description?: string): JsonSchema => ({
  anyOf: [
    { type: "string", maxLength: 1500 },
    arr({ type: "string", maxLength: 200 }, undefined, { maxItems: 12 }),
    { type: "null" },
  ],
  ...(description ? { description } : {}),
});

const OBJECTIVES = ["awareness", "engagement", "education", "conversion", "announcement"] as const;
const FORMATS = ["static", "carousel", "video"] as const;
const LANGS = ["ar", "en", "bilingual"] as const;
const PLATFORMS = ["instagram", "tiktok", "linkedin", "x", "facebook", "youtube"] as const;
const CONFIDENCE = ["high", "medium", "low"] as const;

/** A question the AI adds for information the catalog doesn't cover. */
export const customQuestionSchema = obj({
  id: str("snake_case id starting with q_custom_", { pattern: "^q_custom_[a-z0-9_]{2,40}$" }),
  label: localized("Short question label", 160),
  explanation: nullable(localized("Why this is needed", 300)),
  type: en(["text", "textarea", "select", "radio", "checkbox"]),
  required: bool("True only if the content cannot be written without it"),
  options: arr(
    obj({ value: str(undefined, { maxLength: 60 }), label: localized(undefined, 120) }),
    "Choices for select/radio/checkbox; empty otherwise",
    { maxItems: 8 },
  ),
  suggested_value: answerValue("Best guess, or null when it truly cannot be inferred"),
  rationale: localized("Why this suggestion", 300),
});

// ── Stage 2/3: analysis + proposed configuration ────────────────────────────
export const analysisStageSchema = obj({
  analysis: obj({
    topic: str("Short topic label", { maxLength: 120 }),
    summary: localized("Two-sentence summary of the idea", 500),
    objective: en(OBJECTIVES),
    audience: str("Who this is for", { maxLength: 400 }),
    proposed_format: en(FORMATS),
    format_rationale: localized("Why this format fits", 400),
    language: en(LANGS),
    platforms: arr(obj({ platform: en(PLATFORMS), suitability: num("0..1") }), undefined, {
      maxItems: 6,
    }),
    brand_relevance: obj({ score: num("0..1"), notes: str(undefined, { maxLength: 400 }) }),
    known_facts: arr(
      obj({ key: str(undefined, { maxLength: 80 }), value: str(undefined, { maxLength: 400 }) }),
      "Facts stated in the idea or source",
      { maxItems: 15 },
    ),
    missing_information: arr(localized(undefined, 300), "Essential facts that are missing", {
      maxItems: 8,
    }),
    claims_to_verify: arr(
      obj({ claim: str(undefined, { maxLength: 300 }), reason: localized(undefined, 300) }),
      undefined,
      { maxItems: 8 },
    ),
    risk_flags: arr(localized(undefined, 300), "Brand-safety or prohibited-claim risks", {
      maxItems: 6,
    }),
  }),
  suggestions: arr(
    obj({
      question_id: en(CATALOG_IDS),
      value: answerValue("Value in the question's option values (for choices) or free text"),
      rationale: localized("One short sentence: why", 300),
      confidence: en(CONFIDENCE),
    }),
    "Proposed answers for catalog questions",
    { maxItems: CATALOG_IDS.length },
  ),
  skip: arr(en(CATALOG_IDS), "Optional catalog questions that are irrelevant for this idea", {
    maxItems: CATALOG_IDS.length,
  }),
  custom_questions: arr(
    customQuestionSchema,
    "Only for essential information the catalog does not cover",
    { maxItems: 5 },
  ),
});

// ── Stage 4: brief (or clarification request) ───────────────────────────────
export const briefSchema = obj({
  title: str(undefined, { maxLength: 120 }),
  key_message: str(undefined, { maxLength: 400 }),
  supporting_points: arr(str(undefined, { maxLength: 300 }), undefined, { maxItems: 8 }),
  audience: str(undefined, { maxLength: 400 }),
  objective: en(OBJECTIVES),
  tone: str(undefined, { maxLength: 160 }),
  content_type: en(FORMATS),
  language: en(LANGS),
  platforms: arr(en(PLATFORMS), undefined, { maxItems: 6 }),
  aspect_ratio: en(ASPECT_RATIOS),
  duration_seconds: nullable(int(undefined, { minimum: 5, maximum: 120 })),
  slide_count: nullable(int(undefined, { minimum: 2, maximum: 12 })),
  hook: str(undefined, { maxLength: 200 }),
  narrative_beats: arr(
    str(undefined, { maxLength: 300 }),
    "Ordered beats; one per scene or slide",
    { maxItems: 12 },
  ),
  facts_to_include: arr(str(undefined, { maxLength: 300 }), undefined, { maxItems: 10 }),
  claims_requiring_verification: arr(str(undefined, { maxLength: 300 }), undefined, {
    maxItems: 8,
  }),
  prohibited_claims: arr(str(undefined, { maxLength: 300 }), undefined, { maxItems: 10 }),
  visual: obj({
    style: en(VISUAL_STYLES),
    style_notes: str(undefined, { maxLength: 600 }),
    color_mode: en(["dark", "light"]),
    accent_color: str("#RRGGBB", { pattern: "^#[0-9a-fA-F]{6}$" }),
    camera_style: nullable(en(CAMERA_STYLES)),
    post_fx: nullable(en(POST_FX)),
    text_density: nullable(en(["minimal", "balanced", "rich"])),
  }),
  audio: obj({
    voiceover: nullable(en(["none", "ai_voice", "own_voice"])),
    music_mood: nullable(str(undefined, { maxLength: 60 })),
  }),
  cta: obj({
    text: str(undefined, { maxLength: 120 }),
    url: nullable(str(undefined, { maxLength: 2048 })),
  }),
  hashtags: arr(str(undefined, { maxLength: 60 }), undefined, { maxItems: 15 }),
  assumptions: arr(
    obj({
      question_id: str(undefined, { maxLength: 60 }),
      value: str(undefined, { maxLength: 400 }),
      reason: str(undefined, { maxLength: 300 }),
    }),
    'Every value decided by AI ("Let AI decide") or inferred',
    { maxItems: 20 },
  ),
});

export const briefStageSchema = obj({
  status: en(["ready", "needs_clarification"]),
  contradictions: arr(localized(undefined, 300), "Conflicting answers, if any", { maxItems: 6 }),
  clarification_questions: arr(customQuestionSchema, "Only when essential facts are missing", {
    maxItems: 5,
  }),
  brief: nullable(briefSchema),
});

// ── Stage 5: scripts ────────────────────────────────────────────────────────
const scriptCommon = {
  title: str(undefined, { maxLength: 120 }),
  language: en(LANGS),
  caption: str("Post caption in the content language", { maxLength: 2200 }),
  hashtags: arr(str(undefined, { maxLength: 60 }), undefined, { maxItems: 15 }),
};

export const videoScriptSchema = obj({
  ...scriptCommon,
  total_duration_s: num("Must equal the brief duration"),
  hook: str("What happens in the first 1-2 seconds", { maxLength: 300 }),
  scenes: arr(
    obj({
      index: int(),
      start_s: num(),
      end_s: num(),
      purpose: str("Narrative role of the scene", { maxLength: 200 }),
      on_screen_text: str("Overlay text, short; empty string for none", { maxLength: 160 }),
      voiceover: nullable(str(undefined, { maxLength: 400 })),
      visual: str("What the 3D scene shows: objects, materials, motion", { maxLength: 600 }),
      camera: obj({
        move: str("e.g. slow orbit right, dolly in, swoop down", { maxLength: 160 }),
        start_position: arr(num(), "[x,y,z]", { minItems: 3, maxItems: 3 }),
        end_position: arr(num(), "[x,y,z]", { minItems: 3, maxItems: 3 }),
        look_at: arr(num(), "[x,y,z]", { minItems: 3, maxItems: 3 }),
        easing: en(["linear", "easeInOutCubic", "easeOutExpo", "easeInOutSine"]),
      }),
      transition_out: str(undefined, { maxLength: 160 }),
      sound: str(undefined, { maxLength: 200 }),
    }),
    undefined,
    { minItems: 2, maxItems: 12 },
  ),
  closing_cta: str(undefined, { maxLength: 200 }),
  music_direction: str(undefined, { maxLength: 300 }),
});

export const carouselScriptSchema = obj({
  ...scriptCommon,
  slides: arr(
    obj({
      index: int(),
      role: en(["cover", "body", "cta"]),
      headline: str(undefined, { maxLength: 120 }),
      supporting_text: str(undefined, { maxLength: 400 }),
      visual: str(undefined, { maxLength: 500 }),
    }),
    undefined,
    { minItems: 2, maxItems: 12 },
  ),
  cta: str(undefined, { maxLength: 120 }),
});

export const staticScriptSchema = obj({
  ...scriptCommon,
  headline: str(undefined, { maxLength: 120 }),
  body: str(undefined, { maxLength: 600 }),
  visual_composition: str(undefined, { maxLength: 800 }),
  cta: str(undefined, { maxLength: 120 }),
});

export const SCRIPT_SCHEMAS = {
  video: videoScriptSchema,
  carousel: carouselScriptSchema,
  static: staticScriptSchema,
} as const;

const API_UNSUPPORTED = new Set([
  "minLength",
  "maxLength",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  "minItems",
  "maxItems",
  "pattern",
  "$schema",
  "$id",
]);

/** Copy of a schema without keywords the structured-outputs API rejects. */
export function toApiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toApiSchema);
  if (schema && typeof schema === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(schema)) {
      if (API_UNSUPPORTED.has(k)) continue;
      // Inside `properties`, keys are property names, not keywords.
      out[k] =
        k === "properties"
          ? Object.fromEntries(Object.entries(v as object).map(([pk, pv]) => [pk, toApiSchema(pv)]))
          : toApiSchema(v);
    }
    return out;
  }
  return schema;
}

// ── TypeScript types for the outputs ────────────────────────────────────────
export interface LocalizedText {
  en: string;
  ar: string;
}
export type AiAnswerValue = string | string[] | null;

export interface CustomQuestionOut {
  id: string;
  label: LocalizedText;
  explanation: LocalizedText | null;
  type: "text" | "textarea" | "select" | "radio" | "checkbox";
  required: boolean;
  options: { value: string; label: LocalizedText }[];
  suggested_value: AiAnswerValue;
  rationale: LocalizedText;
}

export interface Analysis {
  topic: string;
  summary: LocalizedText;
  objective: (typeof OBJECTIVES)[number];
  audience: string;
  proposed_format: (typeof FORMATS)[number];
  format_rationale: LocalizedText;
  language: (typeof LANGS)[number];
  platforms: { platform: (typeof PLATFORMS)[number]; suitability: number }[];
  brand_relevance: { score: number; notes: string };
  known_facts: { key: string; value: string }[];
  missing_information: LocalizedText[];
  claims_to_verify: { claim: string; reason: LocalizedText }[];
  risk_flags: LocalizedText[];
}

export interface AnalysisStageOutput {
  analysis: Analysis;
  suggestions: {
    question_id: string;
    value: AiAnswerValue;
    rationale: LocalizedText;
    confidence: "high" | "medium" | "low";
  }[];
  skip: string[];
  custom_questions: CustomQuestionOut[];
}

export interface Brief {
  title: string;
  key_message: string;
  supporting_points: string[];
  audience: string;
  objective: (typeof OBJECTIVES)[number];
  tone: string;
  content_type: (typeof FORMATS)[number];
  language: (typeof LANGS)[number];
  platforms: (typeof PLATFORMS)[number][];
  aspect_ratio: (typeof ASPECT_RATIOS)[number];
  duration_seconds: number | null;
  slide_count: number | null;
  hook: string;
  narrative_beats: string[];
  facts_to_include: string[];
  claims_requiring_verification: string[];
  prohibited_claims: string[];
  visual: {
    style: (typeof VISUAL_STYLES)[number];
    style_notes: string;
    color_mode: "dark" | "light";
    accent_color: string;
    camera_style: (typeof CAMERA_STYLES)[number] | null;
    post_fx: (typeof POST_FX)[number] | null;
    text_density: "minimal" | "balanced" | "rich" | null;
  };
  audio: { voiceover: "none" | "ai_voice" | "own_voice" | null; music_mood: string | null };
  cta: { text: string; url: string | null };
  hashtags: string[];
  assumptions: { question_id: string; value: string; reason: string }[];
}

export interface BriefStageOutput {
  status: "ready" | "needs_clarification";
  contradictions: LocalizedText[];
  clarification_questions: CustomQuestionOut[];
  brief: Brief | null;
}

interface ScriptBase {
  title: string;
  language: (typeof LANGS)[number];
  caption: string;
  hashtags: string[];
}
export interface VideoScene {
  index: number;
  start_s: number;
  end_s: number;
  purpose: string;
  on_screen_text: string;
  voiceover: string | null;
  visual: string;
  camera: {
    move: string;
    start_position: number[];
    end_position: number[];
    look_at: number[];
    easing: string;
  };
  transition_out: string;
  sound: string;
}
export interface VideoScript extends ScriptBase {
  total_duration_s: number;
  hook: string;
  scenes: VideoScene[];
  closing_cta: string;
  music_direction: string;
}
export interface CarouselScript extends ScriptBase {
  slides: {
    index: number;
    role: "cover" | "body" | "cta";
    headline: string;
    supporting_text: string;
    visual: string;
  }[];
  cta: string;
}
export interface StaticScript extends ScriptBase {
  headline: string;
  body: string;
  visual_composition: string;
  cta: string;
}
export type Script = VideoScript | CarouselScript | StaticScript;
