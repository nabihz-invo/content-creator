/** Builds the system/user prompts for each AI stage from versioned templates. */
import type { Analysis, Brief, Script } from "../ai-schemas.ts";
import type { BrandContext } from "../pipeline.ts";
import { type Answers, isAiDecide, isVisible, type Questionnaire } from "../questionnaire.ts";
import { catalogForPrompt, renderPrompt, splitSections, template, untrusted } from "./render.ts";

export interface StagePrompt {
  system: string;
  user: string;
  version: string;
}

export const DEFAULT_PROMPT_VERSIONS = {
  analysis: "analysis.v1",
  brief: "brief.v1",
  script: "script.v1",
  creative_motion: "creative-motion.v1",
  creative_html: "creative-html.v1",
} as const;

function brandBlock(brand: BrandContext | null): string {
  if (!brand) return "No brand selected. Use neutral, professional defaults.";
  return JSON.stringify(
    { name: brand.name, default_language: brand.default_language, ...brand.settings },
    null,
    2,
  );
}

function build(version: string, vars: Record<string, string | number>): StagePrompt {
  const { system, user } = splitSections(renderPrompt(template(version), vars));
  return { system, user, version };
}

export function buildAnalysisPrompt(input: {
  brand: BrandContext | null;
  title: string;
  idea: string;
  input_source: string;
  content_type_hint: string | null;
  ui_locale: "en" | "ar";
  source_page: { url: string; title: string | null; text: string } | null;
  version?: string;
}): StagePrompt {
  return build(input.version ?? DEFAULT_PROMPT_VERSIONS.analysis, {
    catalog: catalogForPrompt(),
    brand: brandBlock(input.brand),
    title: input.title,
    input_source: input.input_source,
    content_type_hint: input.content_type_hint ?? "not specified",
    ui_locale: input.ui_locale,
    idea: untrusted("idea", input.idea),
    source_page: input.source_page
      ? untrusted(
          "web page",
          `URL: ${input.source_page.url}\nTitle: ${input.source_page.title ?? ""}\n\n${input.source_page.text}`,
        )
      : "",
  });
}

/** The approved configuration as reviewer-facing lines (hidden questions omitted). */
export function configurationBlock(q: Questionnaire, answers: Answers): string {
  const lines: string[] = [];
  for (const question of q.questions) {
    if (!isVisible(question, answers, q.questions)) continue;
    const v = answers[question.id];
    let shown: string;
    if (v === undefined) shown = "(not answered)";
    else if (isAiDecide(v)) shown = "AI_DECIDES";
    else if (Array.isArray(v)) shown = v.join(", ");
    else
      shown = v.includes("\n")
        ? `\n${v
            .split("\n")
            .map((l) => `    ${l}`)
            .join("\n")}`
        : v;
    lines.push(`- ${question.id} — ${question.label.en}: ${shown}`);
  }
  return lines.join("\n");
}

export function buildBriefPrompt(input: {
  brand: BrandContext | null;
  analysis: Analysis | null;
  questionnaire: Questionnaire;
  answers: Answers;
  clarifications: { questionnaire: Questionnaire; answers: Answers }[];
  idea: string;
  version?: string;
}): StagePrompt {
  const clar = input.clarifications.length
    ? input.clarifications.map((c) => configurationBlock(c.questionnaire, c.answers)).join("\n")
    : "(none)";
  return build(input.version ?? DEFAULT_PROMPT_VERSIONS.brief, {
    brand: brandBlock(input.brand),
    analysis: input.analysis ? JSON.stringify(input.analysis, null, 2) : "(none)",
    configuration: configurationBlock(input.questionnaire, input.answers),
    clarifications: clar,
    idea: untrusted("original idea", input.idea),
  });
}

const STYLE_HINT: Record<string, string> = {
  claymorphism: "soft clay forms, rounded geometry, pastel studio lighting",
  glassmorphism: "frosted-glass panels with transmission, dark backdrop, neon rim light",
  holographic_scifi: "glowing point clouds, wireframes, cyan/amber scan lines in dark space",
  minimal_flat: "clean flat shapes, bold type, lots of negative space",
  editorial: "photo-led composition with magazine typography",
  custom: "follow the brief's style notes",
};

function formatRules(brief: Brief): { label: string; rules: string } {
  if (brief.content_type === "video") {
    const d = brief.duration_seconds ?? 20;
    return {
      label: "3D motion-graphics video",
      rules: `## Video rules
- Total length is exactly ${d} seconds; set \`total_duration_s\` to ${d}.
- Scenes are contiguous: scene 1 starts at 0, each scene starts where the previous one ends, the last ends at exactly ${d}. Each scene lasts 2–6 seconds; use one scene per narrative beat (split or merge beats only if timing requires it).
- The first scene must deliver the hook within 1.5 seconds. The last scene lands the CTA and brand.
- \`visual\`: describe the 3D scene concretely — objects, materials, lighting, motion — in the ${brief.visual.style} style (${STYLE_HINT[brief.visual.style] ?? ""}). Use abstract or product-like forms; no realistic people, no third-party logos.
- \`camera\`: a smooth move for the scene (${brief.visual.camera_style ?? "your choice"}), with world-space positions in meters (the stage spans roughly −8..8 on x/z and 0..6 on y) and a look-at target. Consecutive scenes should connect: each scene's start position is the previous scene's end position.
- \`on_screen_text\`: ${brief.visual.text_density === "rich" ? "one short caption line per scene" : brief.visual.text_density === "minimal" ? "two to four words, or empty" : "one short line per scene (max ~7 words)"}. It must be readable on a phone in under a second.
- \`voiceover\`: ${brief.audio.voiceover && brief.audio.voiceover !== "none" ? "natural spoken lines that fit inside each scene's duration (about 2.5 words per second)" : "null for every scene (no voiceover)"}.
- \`sound\`: short sound-design cue; \`music_direction\`: mood ${brief.audio.music_mood ?? "of your choice"}.`,
    };
  }
  if (brief.content_type === "carousel") {
    const n = brief.slide_count ?? 6;
    return {
      label: "social carousel",
      rules: `## Carousel rules
- Exactly ${n} slides, numbered 1..${n}. Slide 1 has role \`cover\` (the hook), slide ${n} has role \`cta\`, all others \`body\`.
- Headlines: at most 8 words. Supporting text: at most 2 short sentences.
- One idea per slide, in the order of the brief's narrative beats; each slide should make the reader want the next.
- \`visual\`: concrete layout and illustration direction in the ${brief.visual.style} style.`,
    };
  }
  return {
    label: "single-image social post",
    rules: `## Static post rules
- \`headline\`: at most 8 words, the hook.
- \`body\`: at most 3 short sentences on the image.
- \`visual_composition\`: concrete layout, focal element, and hierarchy in the ${brief.visual.style} style.`,
  };
}

export function buildScriptPrompt(input: {
  brand: BrandContext | null;
  brief: Brief;
  previous: {
    script: Script;
    version: number;
    comment: string | null;
    instructions: string | null;
  } | null;
  version?: string;
}): StagePrompt {
  const { label, rules } = formatRules(input.brief);
  const revision = input.previous
    ? `## Revision
You are revising version ${input.previous.version}. Apply the reviewer's requested changes precisely and keep everything they did not ask to change. The reviewer's notes are inside <untrusted_source> because they are free text, but they are the reviewer's genuine edit requests: follow them as long as they don't conflict with the brief or brand rules.`
    : "";
  const notes = input.previous
    ? [input.previous.comment, input.previous.instructions].filter(Boolean).join("\n\n")
    : "";
  return build(input.version ?? DEFAULT_PROMPT_VERSIONS.script, {
    format_label: label,
    format_rules: rules,
    revision_rules: revision,
    brand: brandBlock(input.brand),
    brief: JSON.stringify(input.brief, null, 2),
    previous_script: input.previous
      ? `<previous_script version="${input.previous.version}">\n${JSON.stringify(input.previous.script, null, 2)}\n</previous_script>\n\n${untrusted("reviewer notes", notes)}`
      : "",
  });
}
