/**
 * Deterministic creative prompt for Phase 3 (ADR-0006 §6): the system
 * instruction handed to Claude Code, rendered from the approved brief and
 * approved script plus the brand snapshot. No model call — the same inputs
 * always give the same prompt, so it can be reviewed and versioned.
 */
import type { Brief, CarouselScript, Script, StaticScript, VideoScript } from "./ai-schemas.ts";
import { dimensionsFor } from "./config-catalog.ts";
import type { BrandContext } from "./pipeline.ts";
import { renderPrompt, template } from "./prompts/render.ts";
import { DEFAULT_PROMPT_VERSIONS } from "./prompts/stages.ts";

const STYLE: Record<string, { label: string; direction: string }> = {
  claymorphism: {
    label: "Soft Claymorphism",
    direction:
      "Rounded, slightly squashed clay forms with subsurface-like soft shading, pastel tones, soft studio lighting, gentle ambient occlusion, matte surfaces.",
  },
  glassmorphism: {
    label: "Glassmorphism",
    direction:
      "Frosted glass panels with physical transmission and roughness, dark background, vibrant neon accents, fresnel rims catching the key light.",
  },
  holographic_scifi: {
    label: "Holographic Sci-Fi",
    direction:
      "Dark space, glowing point clouds and wireframes, cyan/amber scan lines, additive particle sweeps, noise dissolves with glowing edges.",
  },
  minimal_flat: {
    label: "Minimal Flat 3D",
    direction:
      "Simple geometric primitives with flat or lightly shaded materials, bold color blocking, lots of negative space, crisp silhouettes.",
  },
  editorial: {
    label: "Editorial",
    direction:
      "Magazine-like composition: large typography, framed image planes floating in 3D, restrained motion, elegant serif/sans pairing.",
  },
  custom: { label: "Custom", direction: "Follow the brand direction below precisely." },
};

const CAMERA: Record<string, string> = {
  smooth_orbit: "smooth orbits around the hero object",
  dolly_push: "dolly push-ins that move closer between scenes",
  swoop_reveal: "swooping fly-throughs with dramatic reveals",
  static_drift: "mostly still framing with subtle drift",
};

const POST_FX: Record<string, string> = {
  clean:
    "half-float HDR render target, 4× MSAA, ACES filmic tone mapping. No bloom, grain, or aberration.",
  cinematic:
    "half-float HDR render target, 4× MSAA, UnrealBloomPass with a high threshold so only glowing edges bloom, ACES filmic tone mapping, then a custom shader pass adding subtle film grain, a soft vignette, and slight chromatic aberration.",
  bold: "half-float HDR render target, 4× MSAA, strong UnrealBloomPass on emissive accents, ACES tone mapping with lifted contrast, then a shader pass with visible chromatic aberration, light grain, and a vignette.",
};

const LANGUAGE: Record<string, { label: string; dir: "rtl" | "ltr"; lang: string; rules: string }> =
  {
    ar: {
      label: "Arabic",
      dir: "rtl",
      lang: "ar",
      rules:
        "Arabic is right-to-left: set `ctx.direction = 'rtl'`, right-align inside the safe area, use a bundled Arabic font (e.g. IBM Plex Sans Arabic or Noto Sans Arabic), never add letter-spacing (it breaks joined letters), and verify on stills that letters connect and diacritics are not clipped.",
    },
    en: {
      label: "English",
      dir: "ltr",
      lang: "en",
      rules: "Left-to-right, sentence case, tight but readable tracking.",
    },
    bilingual: {
      label: "Arabic + English",
      dir: "rtl",
      lang: "ar",
      rules:
        "Arabic line first (right-to-left, `ctx.direction = 'rtl'`, bundled Arabic font, no letter-spacing), English line below it in a smaller size (left-to-right). Verify Arabic letters connect.",
    },
  };

export interface CreativePrompt {
  format: "video" | "carousel" | "static";
  version: string;
  width: number;
  height: number;
  prompt: string;
}

function palette(brand: BrandContext | null): string {
  const p = brand?.settings.palette ?? [];
  return p.length
    ? p.map((c) => `${c.name} ${c.hex}${c.role ? ` (${c.role})` : ""}`).join(", ")
    : "derive a harmonious palette from the accent";
}

function fonts(brand: BrandContext | null, language: string): string {
  const t = brand?.settings.typography;
  const arabic = language === "en" ? "" : " with IBM Plex Sans Arabic for Arabic text";
  if (t?.heading_font || t?.body_font)
    return `${t.heading_font ?? t.body_font} for headings, ${t.body_font ?? t.heading_font} for body${arabic}`;
  return `SF Pro Display / Inter for Latin${arabic}`;
}

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(2).replace(/0+$/, ""));
const vec = (v: number[]) => `(${v.map(fmt).join(", ")})`;

function scenePlan(script: VideoScript): string {
  return script.scenes
    .map((s) => {
      const lines = [
        `**Scene ${s.index} — ${fmt(s.start_s)}s to ${fmt(s.end_s)}s: ${s.purpose}**`,
        `  - Visual: ${s.visual}`,
        `  - Camera: ${s.camera.move}; from ${vec(s.camera.start_position)} to ${vec(s.camera.end_position)}, looking at ${vec(s.camera.look_at)}, easing ${s.camera.easing}.`,
        `  - On-screen text: ${s.on_screen_text ? `"${s.on_screen_text}"` : "none"}`,
      ];
      if (s.voiceover) lines.push(`  - Voiceover (timing reference): "${s.voiceover}"`);
      lines.push(`  - Transition out: ${s.transition_out}. Sound: ${s.sound}.`);
      return lines.join("\n");
    })
    .join("\n\n");
}

export function buildCreativePrompt(input: {
  brief: Brief;
  script: Script;
  brand: BrandContext | null;
  version?: string;
}): CreativePrompt {
  const { brief, brand } = input;
  const { width, height } = dimensionsFor(brief.aspect_ratio);
  const style = STYLE[brief.visual.style] ?? STYLE.custom!;
  const lang = LANGUAGE[brief.language] ?? LANGUAGE.en!;

  if (brief.content_type === "video") {
    const script = input.script as VideoScript;
    const duration = script.total_duration_s;
    const version = input.version ?? DEFAULT_PROMPT_VERSIONS.creative_motion;
    const audio =
      brief.audio.voiceover && brief.audio.voiceover !== "none"
        ? `Voiceover (${brief.audio.voiceover === "ai_voice" ? "generated separately" : "recorded by the client"}) will be mixed in post; leave visual room for it. Music: ${script.music_direction}.`
        : `No voiceover — the visuals and on-screen text carry the story. Music direction for the post mix: ${script.music_direction}.`;
    const prompt = renderPrompt(template(version), {
      brand_name: brand?.name ?? "the client",
      width,
      height,
      aspect_ratio: brief.aspect_ratio,
      duration: fmt(duration),
      frames: Math.round(duration * 60),
      style_label: style.label,
      style_direction: style.direction,
      style_notes: brief.visual.style_notes || "—",
      color_mode: brief.visual.color_mode === "dark" ? "dark" : "light",
      palette: palette(brand),
      accent_color: brief.visual.accent_color,
      camera_label: CAMERA[brief.visual.camera_style ?? "smooth_orbit"] ?? "smooth moves",
      scene_plan: scenePlan(script),
      language_label: lang.label,
      text_direction_rules: lang.rules,
      text_density: brief.visual.text_density ?? "balanced",
      fonts: fonts(brand, brief.language),
      post_fx_pipeline: POST_FX[brief.visual.post_fx ?? "cinematic"]!,
      audio,
      key_message: brief.key_message,
      hook: script.hook,
      cta: script.closing_cta,
    });
    return { format: "video", version, width, height, prompt };
  }

  const version = input.version ?? DEFAULT_PROMPT_VERSIONS.creative_html;
  let contentPlan: string;
  let unitLabel: string;
  let unitsRule: string;
  if (brief.content_type === "carousel") {
    const c = input.script as CarouselScript;
    unitLabel = "slide";
    unitsRule = `Build ${c.slides.length} slides as separate pages addressable with \`?slide=N\` (1-based), sharing one design system so the set feels continuous.`;
    contentPlan = c.slides
      .map(
        (s) =>
          `**Slide ${s.index} (${s.role})**\n  - Headline: "${s.headline}"\n  - Text: "${s.supporting_text}"\n  - Visual: ${s.visual}`,
      )
      .join("\n\n");
  } else {
    const s = input.script as StaticScript;
    unitLabel = "image";
    unitsRule = "A single page.";
    contentPlan = `- Headline: "${s.headline}"\n- Body: "${s.body}"\n- CTA: "${s.cta}"\n- Composition: ${s.visual_composition}`;
  }
  const prompt = renderPrompt(template(version), {
    format_label: brief.content_type === "carousel" ? "carousel" : "single-image post",
    brand_name: brand?.name ?? "the client",
    width,
    height,
    aspect_ratio: brief.aspect_ratio,
    unit_label: unitLabel,
    units_rule: unitsRule,
    dir: lang.dir,
    lang: lang.lang,
    style_label: style.label,
    style_direction: style.direction,
    style_notes: brief.visual.style_notes || "—",
    color_mode: brief.visual.color_mode,
    palette: palette(brand),
    accent_color: brief.visual.accent_color,
    fonts: fonts(brand, brief.language),
    content_plan: contentPlan,
  });
  return { format: brief.content_type, version, width, height, prompt };
}
