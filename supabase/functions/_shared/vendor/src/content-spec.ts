/**
 * Content spec (ADR-0007): everything a creative needs, as data. Written into
 * each workspace as `spec.js` (`window.__SPEC = …`) so templates and Claude
 * Code read one source and never fetch anything.
 */
import type { Brief, CarouselScript, Script, StaticScript, VideoScript } from "./ai-schemas.ts";
import { dimensionsFor } from "./config-catalog.ts";
import type { BrandContext } from "./pipeline.ts";

export interface SpecColors {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  palette: { name: string; hex: string; role: string }[];
}

export interface SpecScene {
  index: number;
  start_s: number;
  end_s: number;
  purpose: string;
  text: string;
  visual: string;
  camera: { start: number[]; end: number[]; look_at: number[]; easing: string; move: string };
  transition_out: string;
}

export interface SpecSlide {
  index: number;
  role: "cover" | "body" | "cta";
  headline: string;
  text: string;
  visual: string;
}

export interface ContentSpec {
  schema_version: 1;
  project_id: string;
  creative_version: number;
  format: "static" | "carousel" | "video";
  width: number;
  height: number;
  aspect_ratio: string;
  fps: number | null;
  duration_s: number | null;
  language: "ar" | "en" | "bilingual";
  direction: "rtl" | "ltr";
  brand: { name: string; fonts: { heading: string; body: string } };
  style: Brief["visual"]["style"];
  style_notes: string;
  color_mode: "dark" | "light";
  camera_style: string | null;
  post_fx: string | null;
  text_density: string | null;
  colors: SpecColors;
  copy: {
    title: string;
    hook: string;
    key_message: string;
    cta: string;
    caption: string;
    hashtags: string[];
  };
  scenes: SpecScene[];
  slides: SpecSlide[];
  post: { headline: string; body: string; composition: string } | null;
  source: { script_id: string; script_version: number; script_hash: string };
  revision_notes: string | null;
}

const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

/** Background/surface/text colors that respect the brand palette and stay readable. */
export function resolveColors(brief: Brief, brand: BrandContext | null): SpecColors {
  const palette = (brand?.settings.palette ?? [])
    .filter((c) => HEX.test(c.hex))
    .map((c) => ({ name: c.name, hex: c.hex.toLowerCase(), role: (c.role ?? "").toLowerCase() }));
  const dark = brief.visual.color_mode === "dark";
  const byRole = (re: RegExp) => palette.find((c) => re.test(c.role))?.hex;
  const darkest = [...palette].sort((a, b) => luminance(a.hex) - luminance(b.hex))[0]?.hex;
  const lightest = [...palette].sort((a, b) => luminance(b.hex) - luminance(a.hex))[0]?.hex;
  let background =
    byRole(/background|base/) ?? (dark ? darkest : lightest) ?? (dark ? "#0f1117" : "#f7f5f2");
  // The chosen mode wins over a palette background that contradicts it.
  if (dark && luminance(background) > 0.2)
    background = darkest && luminance(darkest) <= 0.2 ? darkest : "#0f1117";
  if (!dark && luminance(background) < 0.6)
    background = lightest && luminance(lightest) >= 0.6 ? lightest : "#f7f5f2";
  const text = dark ? "#f8f8f6" : "#14161c";
  const accent = HEX.test(brief.visual.accent_color)
    ? brief.visual.accent_color.toLowerCase()
    : "#4f46e5";
  return {
    background,
    surface: dark ? "#ffffff14" : "#ffffffcc",
    text: contrastRatio(text, background) >= 4.5 ? text : dark ? "#ffffff" : "#000000",
    muted: dark ? "#c9cbd3" : "#4b4f5c",
    accent,
    palette,
  };
}

export function buildContentSpec(input: {
  projectId: string;
  creativeVersion: number;
  brief: Brief;
  script: Script;
  scriptMeta: { id: string; version: number; content_hash: string };
  brand: BrandContext | null;
  revisionNotes?: string | null;
}): ContentSpec {
  const { brief, script, brand } = input;
  const { width, height } = dimensionsFor(brief.aspect_ratio);
  const typography = brand?.settings.typography;
  const spec: ContentSpec = {
    schema_version: 1,
    project_id: input.projectId,
    creative_version: input.creativeVersion,
    format: brief.content_type,
    width,
    height,
    aspect_ratio: brief.aspect_ratio,
    fps: brief.content_type === "video" ? 60 : null,
    duration_s: brief.content_type === "video" ? (script as VideoScript).total_duration_s : null,
    language: brief.language,
    direction: brief.language === "en" ? "ltr" : "rtl",
    brand: {
      name: brand?.name ?? "",
      fonts: {
        heading: typography?.heading_font?.trim() || "Inter",
        body: typography?.body_font?.trim() || "Inter",
      },
    },
    style: brief.visual.style,
    style_notes: brief.visual.style_notes,
    color_mode: brief.visual.color_mode,
    camera_style: brief.visual.camera_style,
    post_fx: brief.visual.post_fx,
    text_density: brief.visual.text_density,
    colors: resolveColors(brief, brand),
    copy: {
      title: script.title,
      hook: brief.hook,
      key_message: brief.key_message,
      cta: brief.cta.text,
      caption: script.caption,
      hashtags: script.hashtags,
    },
    scenes: [],
    slides: [],
    post: null,
    source: {
      script_id: input.scriptMeta.id,
      script_version: input.scriptMeta.version,
      script_hash: input.scriptMeta.content_hash,
    },
    revision_notes: input.revisionNotes ?? null,
  };
  if (brief.content_type === "video") {
    const v = script as VideoScript;
    spec.copy.cta = v.closing_cta || spec.copy.cta;
    spec.scenes = v.scenes.map((s) => ({
      index: s.index,
      start_s: s.start_s,
      end_s: s.end_s,
      purpose: s.purpose,
      text: s.on_screen_text,
      visual: s.visual,
      camera: {
        start: s.camera.start_position,
        end: s.camera.end_position,
        look_at: s.camera.look_at,
        easing: s.camera.easing,
        move: s.camera.move,
      },
      transition_out: s.transition_out,
    }));
  } else if (brief.content_type === "carousel") {
    const c = script as CarouselScript;
    spec.copy.cta = c.cta || spec.copy.cta;
    spec.slides = c.slides.map((s) => ({
      index: s.index,
      role: s.role,
      headline: s.headline,
      text: s.supporting_text,
      visual: s.visual,
    }));
  } else {
    const s = script as StaticScript;
    spec.copy.cta = s.cta || spec.copy.cta;
    spec.post = { headline: s.headline, body: s.body, composition: s.visual_composition };
  }
  return spec;
}

/** `spec.js` content for a workspace. `<` is escaped so copy can never close a script tag. */
export function specScript(spec: ContentSpec): string {
  return `window.__SPEC = ${JSON.stringify(spec, null, 2).replace(/</g, "\\u003c")};\n`;
}
