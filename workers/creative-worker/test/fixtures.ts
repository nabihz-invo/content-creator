import {
  buildContentSpec,
  type ContentSpec,
  enforceApprovedConfig,
  fakeBrief,
  fakeScript,
} from "@cc/shared";

export const brand = {
  name: "Noor Café",
  default_language: "ar",
  settings: {
    palette: [
      { name: "Espresso", hex: "#3B2417", role: "background" },
      { name: "Saffron", hex: "#E8A33D", role: "accent" },
    ],
    typography: { heading_font: "Tajawal", body_font: "IBM Plex Sans Arabic" },
  },
};

export function specFor(
  format: "static" | "carousel" | "video",
  style: string,
  language: "ar" | "en",
  mode: "dark" | "light" = "dark",
): ContentSpec {
  const answers: Record<string, string> = {
    q_format: format,
    q_visual_style: style,
    q_language: language,
    q_color_mode: mode,
    q_accent_color: "#E8A33D",
    q_aspect_ratio: format === "video" ? "9:16" : format === "carousel" ? "4:5" : "1:1",
    q_duration: "8",
    q_slide_count: "4",
    q_post_fx: "cinematic",
    q_scene_beats:
      language === "ar"
        ? "ليلة باردة في الشارع\nكوب دافئ يضيء المشهد\nزورونا هذا الأسبوع"
        : "A cold night street\nA glowing warm cup\nVisit us this weekend",
    q_hook: language === "ar" ? "مشروبات الشتاء وصلت" : "Winter drinks are here",
    q_cta: language === "ar" ? "زورونا اليوم" : "Visit us today",
  };
  const brief = enforceApprovedConfig(
    fakeBrief({ idea: "x", answers, clarification_answered: true, brand_prohibited: [] }).brief!,
    answers,
  );
  brief.key_message =
    language === "ar"
      ? "اثنان بسعر واحد طوال عطلة نهاية الأسبوع في نور كافيه"
      : "Two winter drinks for the price of one, all weekend at Noor Café";
  const script = fakeScript(brief);
  return buildContentSpec({
    projectId: "test-project",
    creativeVersion: 1,
    brief,
    script,
    scriptMeta: { id: "s", version: 1, content_hash: "a".repeat(64) },
    brand,
  });
}
