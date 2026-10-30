/**
 * Deterministic steps around the AI stages (ADR-0006):
 *  - composeQuestionnaire: catalog + AI suggestions + brand defaults → form
 *  - enforceApprovedConfig: approved answers always win over the AI brief
 *  - checkScript: structural checks the schema can't express (retry feedback)
 */
import type {
  AnalysisStageOutput,
  Brief,
  CarouselScript,
  CustomQuestionOut,
  Script,
  StaticScript,
  VideoScript,
} from "./ai-schemas.ts";
import { CATALOG, CATALOG_GROUPS, CATALOG_VERSION } from "./config-catalog.ts";
import {
  type Answers,
  type AnswerValue,
  isAiDecide,
  type Question,
  type Questionnaire,
  type Suggestion,
  validateValue,
} from "./questionnaire.ts";

export interface BrandContext {
  name: string;
  default_language: string;
  settings: {
    voice?: { tone?: string; personality?: string; do?: string[]; dont?: string[] };
    palette?: { name: string; hex: string; role?: string }[];
    typography?: { heading_font?: string; body_font?: string; rules?: string };
    audiences?: { id: string; name: string; description?: string }[];
    platform_rules?: Record<string, string>;
    cta?: { default?: string; preferred?: string[] };
    claims?: { permitted?: string[]; prohibited?: string[]; requires_verification?: string[] };
  };
}

const FROM_BRAND = { en: "From the brand settings.", ar: "من إعدادات العلامة التجارية." };

/** Catalog values that come straight from saved brand settings. */
export function brandDefaults(brand: BrandContext | null): Record<string, string> {
  if (!brand) return {};
  const s = brand.settings ?? {};
  const out: Record<string, string> = {};
  if (s.voice?.tone?.trim()) out.q_tone = s.voice.tone.trim();
  const accent =
    s.palette?.find((c) => /accent|primary|highlight/i.test(c.role ?? "")) ?? s.palette?.[0];
  if (accent && /^#[0-9a-fA-F]{6}$/.test(accent.hex)) out.q_accent_color = accent.hex.toLowerCase();
  if (s.cta?.default?.trim()) out.q_cta = s.cta.default.trim();
  if (brand.default_language === "ar" || brand.default_language === "en")
    out.q_language = brand.default_language;
  if (s.audiences?.length) {
    out.q_audience = s.audiences
      .map((a) => (a.description ? `${a.name}: ${a.description}` : a.name))
      .join("\n")
      .slice(0, 400);
  }
  return out;
}

function toAnswer(v: string | string[] | null): AnswerValue | undefined {
  if (v === null) return undefined;
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return String(v).trim();
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/^q_custom_/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

/** Turns AI custom questions into safe Question objects (ids unique, choices only with options). */
export function customQuestions(
  input: CustomQuestionOut[],
  taken: Set<string>,
  max = 5,
): Question[] {
  const out: Question[] = [];
  for (const cq of input) {
    if (out.length >= max) break;
    let id = `q_custom_${slug(cq.id) || "item"}`;
    for (let i = 2; taken.has(id); i++) id = `q_custom_${slug(cq.id) || "item"}_${i}`;
    const choices = cq.type === "select" || cq.type === "radio" || cq.type === "checkbox";
    const options = choices
      ? cq.options
          .filter((o, i, all) => o.value.trim() && all.findIndex((x) => x.value === o.value) === i)
          .slice(0, 8)
      : [];
    const type = choices && options.length < 2 ? "text" : cq.type;
    const q: Question = {
      id,
      group: "details",
      label: cq.label,
      explanation: cq.explanation,
      type,
      required: cq.required,
      options: type === "text" || type === "textarea" ? undefined : options,
      validation: { max_length: type === "textarea" ? 1200 : 300 },
      allow_ai_decide: !cq.required,
      custom: true,
    };
    const value = toAnswer(cq.suggested_value);
    if (value !== undefined && validateValue({ ...q, required: true }, value) === null) {
      q.suggested = {
        value: value as string | string[],
        rationale: cq.rationale,
        confidence: "medium",
        source: "ai",
      };
    }
    taken.add(id);
    out.push(q);
  }
  return out;
}

/**
 * Builds the configuration form shown for review. AI suggestions that don't
 * fit a question (unknown option, bad color, too long…) are dropped; brand
 * settings fill what the AI left open. Required questions are never skipped.
 */
export function composeQuestionnaire(
  ai: AnalysisStageOutput,
  brand: BrandContext | null,
): Questionnaire {
  const skip = new Set(ai.skip);
  const defaults = brandDefaults(brand);
  const byId = new Map(ai.suggestions.map((s) => [s.question_id, s]));
  const questions: Question[] = [];

  for (const base of CATALOG) {
    if (skip.has(base.id) && !base.required) continue;
    const q: Question = { ...base, suggested: null };
    const s = byId.get(base.id);
    const aiValue = s ? toAnswer(s.value) : undefined;
    let suggestion: Suggestion | null = null;
    if (
      s &&
      aiValue !== undefined &&
      validateValue({ ...q, required: true }, aiValue) === null &&
      !isAiDecide(aiValue)
    ) {
      suggestion = {
        value: aiValue as string | string[],
        rationale: s.rationale,
        confidence: s.confidence,
        source: "ai",
      };
    } else if (
      defaults[base.id] !== undefined &&
      validateValue({ ...q, required: true }, defaults[base.id]) === null
    ) {
      suggestion = {
        value: defaults[base.id]!,
        rationale: FROM_BRAND,
        confidence: "high",
        source: "brand",
      };
    }
    q.suggested = suggestion;
    questions.push(q);
  }

  const taken = new Set(questions.map((q) => q.id));
  questions.push(...customQuestions(ai.custom_questions, taken));

  return {
    schema_version: 1,
    catalog_version: CATALOG_VERSION,
    kind: "initial",
    groups: CATALOG_GROUPS.filter((g) => questions.some((q) => q.group === g.id)),
    questions,
  };
}

/** A clarification round: only the brief stage's questions. */
export function composeClarification(questions: CustomQuestionOut[]): Questionnaire {
  const qs = customQuestions(questions, new Set(), 5).map((q) => ({
    ...q,
    allow_ai_decide: false,
  }));
  return {
    schema_version: 1,
    catalog_version: CATALOG_VERSION,
    kind: "clarification",
    groups: CATALOG_GROUPS.filter((g) => g.id === "details"),
    questions: qs,
  };
}

const str = (a: Answers, id: string): string | undefined => {
  const v = a[id];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
};
const list = (a: Answers, id: string): string[] | undefined => {
  const v = a[id];
  return Array.isArray(v) && v.length ? v : undefined;
};
const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);

/**
 * The user approved these answers; the AI brief may only fill what was left to
 * it ("Let AI decide" or unanswered optional questions).
 */
export function enforceApprovedConfig(brief: Brief, answers: Answers): Brief {
  const b: Brief = structuredClone(brief);
  const fmt = str(answers, "q_format");
  if (fmt === "static" || fmt === "carousel" || fmt === "video") b.content_type = fmt;
  const lang = str(answers, "q_language");
  if (lang === "ar" || lang === "en" || lang === "bilingual") b.language = lang;
  const platforms = list(answers, "q_platforms");
  if (platforms) b.platforms = platforms as Brief["platforms"];
  const ar = str(answers, "q_aspect_ratio");
  if (ar) b.aspect_ratio = ar as Brief["aspect_ratio"];
  const objective = str(answers, "q_objective");
  if (objective) b.objective = objective as Brief["objective"];
  const audience = str(answers, "q_audience");
  if (audience) b.audience = audience;
  const tone = str(answers, "q_tone");
  if (tone) b.tone = tone;
  const hook = str(answers, "q_hook");
  if (hook) b.hook = hook;
  const beats = str(answers, "q_scene_beats");
  if (beats) b.narrative_beats = lines(beats);
  const facts = str(answers, "q_key_facts");
  if (facts) b.facts_to_include = lines(facts);

  if (b.content_type === "video") {
    const d = Number(str(answers, "q_duration"));
    if (Number.isFinite(d) && d > 0) b.duration_seconds = d;
    b.duration_seconds ??= 30;
    b.slide_count = null;
  } else if (b.content_type === "carousel") {
    const n = Number(str(answers, "q_slide_count"));
    if (Number.isFinite(n) && n > 0) b.slide_count = n;
    b.slide_count ??= 6;
    b.duration_seconds = null;
  } else {
    b.duration_seconds = null;
    b.slide_count = null;
  }

  const style = str(answers, "q_visual_style");
  if (style) b.visual.style = style as Brief["visual"]["style"];
  const custom = str(answers, "q_visual_style_custom");
  if (custom) b.visual.style_notes = custom;
  const mode = str(answers, "q_color_mode");
  if (mode === "dark" || mode === "light") b.visual.color_mode = mode;
  const accent = str(answers, "q_accent_color");
  if (accent) b.visual.accent_color = accent.toLowerCase();
  if (b.content_type === "video") {
    const cam = str(answers, "q_camera_style");
    if (cam) b.visual.camera_style = cam as Brief["visual"]["camera_style"];
    const fx = str(answers, "q_post_fx");
    if (fx) b.visual.post_fx = fx as Brief["visual"]["post_fx"];
    const density = str(answers, "q_text_density");
    if (density) b.visual.text_density = density as Brief["visual"]["text_density"];
    const vo = str(answers, "q_voiceover");
    if (vo) b.audio.voiceover = vo as Brief["audio"]["voiceover"];
    const music = str(answers, "q_music_mood");
    if (music) b.audio.music_mood = music;
  } else {
    b.visual.camera_style = null;
    b.visual.post_fx = null;
    b.visual.text_density = null;
    b.audio = { voiceover: null, music_mood: null };
  }

  const cta = str(answers, "q_cta");
  if (cta) b.cta.text = cta;
  const url = str(answers, "q_cta_url");
  if (url) b.cta.url = url;
  const tags = str(answers, "q_hashtags");
  if (tags) {
    b.hashtags = tags
      .split(/[\s,،]+/)
      .map((t) => t.replace(/^#*/, ""))
      .filter(Boolean)
      .map((t) => `#${t}`)
      .slice(0, 15);
  }
  return b;
}

/** Structural problems in a generated script; empty when fine. Fed back to the model on retry. */
export function checkScript(script: Script, brief: Brief): string[] {
  const problems: string[] = [];
  if (brief.content_type === "video") {
    const v = script as VideoScript;
    if (!Array.isArray(v.scenes)) return ["scenes missing"];
    const total = brief.duration_seconds ?? v.total_duration_s;
    if (Math.abs(v.total_duration_s - total) > 0.01)
      problems.push(`total_duration_s must be ${total}, got ${v.total_duration_s}`);
    let t = 0;
    v.scenes.forEach((s, i) => {
      if (s.index !== i + 1) problems.push(`scene ${i + 1}: index must be ${i + 1}`);
      if (Math.abs(s.start_s - t) > 0.01)
        problems.push(`scene ${i + 1}: start_s must be ${t} (scenes must be contiguous)`);
      if (s.end_s <= s.start_s) problems.push(`scene ${i + 1}: end_s must be after start_s`);
      if (s.end_s - s.start_s < 1.5) problems.push(`scene ${i + 1}: shorter than 1.5 s`);
      t = s.end_s;
    });
    if (Math.abs(t - total) > 0.01)
      problems.push(`last scene must end at ${total}s, ends at ${t}s`);
  } else if (brief.content_type === "carousel") {
    const c = script as CarouselScript;
    if (!Array.isArray(c.slides)) return ["slides missing"];
    if (brief.slide_count && c.slides.length !== brief.slide_count)
      problems.push(`must have exactly ${brief.slide_count} slides, has ${c.slides.length}`);
    c.slides.forEach((s, i) => {
      if (s.index !== i + 1) problems.push(`slide ${i + 1}: index must be ${i + 1}`);
    });
    if (c.slides[0]?.role !== "cover") problems.push("first slide must have role cover");
    if (c.slides.at(-1)?.role !== "cta") problems.push("last slide must have role cta");
  } else {
    const s = script as StaticScript;
    if (!s.headline?.trim()) problems.push("headline is empty");
  }
  if (!script.caption?.trim()) problems.push("caption is empty");
  return problems;
}
