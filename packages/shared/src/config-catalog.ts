/**
 * Production configuration catalog (ADR-0006).
 *
 * Stable question IDs that every later stage relies on (brief, script, and the
 * creative prompt builder). The AI analysis stage selects and pre-fills these;
 * it never defines labels or structure for them. Bump CATALOG_VERSION when a
 * question's meaning or options change.
 */
import type { Localized, Question, QuestionGroup } from "./questionnaire.ts";

export const CATALOG_VERSION = "v1";

const L = (en: string, ar: string): Localized => ({ en, ar });
const opt = (value: string, en: string, ar: string) => ({ value, label: L(en, ar) });

export const CATALOG_GROUPS: QuestionGroup[] = [
  { id: "goal", label: L("Goal & audience", "الهدف والجمهور") },
  { id: "format", label: L("Format & platforms", "الصيغة والمنصات") },
  { id: "story", label: L("Story & message", "القصة والرسالة") },
  { id: "visual", label: L("Visual direction", "الاتجاه البصري") },
  { id: "motion", label: L("Motion & sound", "الحركة والصوت") },
  { id: "cta", label: L("Call to action", "الدعوة لإجراء") },
  { id: "details", label: L("Additional details", "تفاصيل إضافية") },
];

const VIDEO = { question: "q_format", op: "eq", value: "video" } as const;
const MULTI_FRAME = { question: "q_format", op: "in", value: ["video", "carousel"] } as const;

export const VISUAL_STYLES = [
  "claymorphism",
  "glassmorphism",
  "holographic_scifi",
  "minimal_flat",
  "editorial",
  "custom",
] as const;
export const CAMERA_STYLES = [
  "smooth_orbit",
  "dolly_push",
  "swoop_reveal",
  "static_drift",
] as const;
export const POST_FX = ["clean", "cinematic", "bold"] as const;
export const ASPECT_RATIOS = ["9:16", "4:5", "1:1", "16:9"] as const;

export const CATALOG: Question[] = [
  // ── Goal & audience ──────────────────────────────────────────────
  {
    id: "q_core_message",
    group: "goal",
    label: L("Topic & core message", "الموضوع والرسالة الأساسية"),
    explanation: L(
      "The one thing viewers should understand or remember.",
      "الشيء الوحيد الذي يجب أن يفهمه المشاهد أو يتذكره.",
    ),
    type: "textarea",
    required: true,
    validation: { min_length: 10, max_length: 600 },
    allow_ai_decide: false,
  },
  {
    id: "q_objective",
    group: "goal",
    label: L("Objective", "الهدف"),
    type: "radio",
    required: true,
    options: [
      opt("awareness", "Awareness", "زيادة الوعي"),
      opt("engagement", "Engagement", "التفاعل"),
      opt("education", "Education", "التثقيف"),
      opt("conversion", "Conversion (sales / sign-ups)", "التحويل (مبيعات / تسجيل)"),
      opt("announcement", "Announcement / launch", "إعلان / إطلاق"),
    ],
    allow_ai_decide: true,
  },
  {
    id: "q_audience",
    group: "goal",
    label: L("Target audience", "الجمهور المستهدف"),
    explanation: L("Who it's for and what they care about.", "لمن هذا المحتوى وما الذي يهمهم."),
    type: "textarea",
    required: true,
    validation: { max_length: 400 },
    allow_ai_decide: true,
  },

  // ── Format & platforms ───────────────────────────────────────────
  {
    id: "q_format",
    group: "format",
    label: L("Format", "الصيغة"),
    type: "radio",
    required: true,
    options: [
      opt("static", "Static post", "منشور ثابت"),
      opt("carousel", "Carousel", "كاروسيل"),
      opt("video", "Motion graphics video (3D)", "فيديو موشن جرافيك (ثلاثي الأبعاد)"),
    ],
    allow_ai_decide: false,
  },
  {
    id: "q_platforms",
    group: "format",
    label: L("Platforms", "المنصات"),
    type: "checkbox",
    required: true,
    options: [
      opt("instagram", "Instagram", "إنستغرام"),
      opt("tiktok", "TikTok", "تيك توك"),
      opt("linkedin", "LinkedIn", "لينكدإن"),
      opt("x", "X", "إكس"),
      opt("facebook", "Facebook", "فيسبوك"),
      opt("youtube", "YouTube", "يوتيوب"),
    ],
    validation: { min_items: 1 },
    allow_ai_decide: false,
  },
  {
    id: "q_aspect_ratio",
    group: "format",
    label: L("Aspect ratio", "نسبة الأبعاد"),
    type: "radio",
    required: true,
    options: [
      opt("9:16", "Vertical 9:16 (Reels, Shorts, TikTok)", "عمودي 9:16 (ريلز، شورتس، تيك توك)"),
      opt("4:5", "Portrait 4:5 (feed)", "طولي 4:5 (الصفحة الرئيسية)"),
      opt("1:1", "Square 1:1", "مربع 1:1"),
      opt("16:9", "Horizontal 16:9 (YouTube, LinkedIn)", "أفقي 16:9 (يوتيوب، لينكدإن)"),
    ],
    allow_ai_decide: false,
  },
  {
    id: "q_language",
    group: "format",
    label: L("Content language", "لغة المحتوى"),
    type: "radio",
    required: true,
    options: [
      opt("ar", "Arabic", "العربية"),
      opt("en", "English", "الإنجليزية"),
      opt("bilingual", "Arabic + English", "العربية + الإنجليزية"),
    ],
    allow_ai_decide: false,
  },
  {
    id: "q_duration",
    group: "format",
    label: L("Video length (seconds)", "مدة الفيديو (ثوانٍ)"),
    type: "select",
    required: true,
    options: ["10", "15", "20", "30", "45", "60"].map((s) => opt(s, `${s} s`, `${s} ث`)),
    show_if: VIDEO,
    allow_ai_decide: true,
  },
  {
    id: "q_slide_count",
    group: "format",
    label: L("Number of slides", "عدد الشرائح"),
    type: "select",
    required: true,
    options: ["4", "5", "6", "7", "8", "9", "10"].map((s) => opt(s, s, s)),
    show_if: { question: "q_format", op: "eq", value: "carousel" },
    allow_ai_decide: true,
  },

  // ── Story & message ──────────────────────────────────────────────
  {
    id: "q_hook",
    group: "story",
    label: L("Opening hook", "الافتتاحية الجاذبة"),
    explanation: L(
      "The first line or visual that stops the scroll.",
      "أول جملة أو مشهد يوقف التمرير.",
    ),
    type: "text",
    required: false,
    validation: { max_length: 160 },
    allow_ai_decide: true,
  },
  {
    id: "q_scene_beats",
    group: "story",
    label: L("Key narrative steps (3–5)", "خطوات السرد الرئيسية (3–5)"),
    explanation: L(
      "One beat per line, in order. Each becomes a scene or slide.",
      "خطوة في كل سطر وبالترتيب. تصبح كل خطوة مشهدًا أو شريحة.",
    ),
    type: "textarea",
    required: true,
    validation: { min_lines: 3, max_lines: 10, max_length: 1200 },
    show_if: MULTI_FRAME,
    allow_ai_decide: true,
  },
  {
    id: "q_key_facts",
    group: "story",
    label: L("Facts, numbers or claims to include", "حقائق أو أرقام أو ادعاءات يجب تضمينها"),
    explanation: L(
      "Only what you can stand behind. One per line.",
      "فقط ما يمكنك إثباته. عنصر في كل سطر.",
    ),
    type: "textarea",
    required: false,
    validation: { max_length: 1200 },
    allow_ai_decide: false,
  },
  {
    id: "q_tone",
    group: "story",
    label: L("Tone of voice", "نبرة الصوت"),
    type: "text",
    required: true,
    validation: { max_length: 160 },
    allow_ai_decide: true,
  },

  // ── Visual direction ─────────────────────────────────────────────
  {
    id: "q_visual_style",
    group: "visual",
    label: L("Visual aesthetic", "الأسلوب البصري"),
    type: "radio",
    required: true,
    options: [
      opt(
        "claymorphism",
        "Claymorphism — soft studio light, pastel clay materials",
        "كلايمورفيزم — إضاءة استوديو ناعمة وخامات طينية بألوان هادئة",
      ),
      opt(
        "glassmorphism",
        "Glassmorphism — frosted glass, dark background, neon accents",
        "جلاسمورفيزم — زجاج مصنفر وخلفية داكنة ولمسات نيون",
      ),
      opt(
        "holographic_scifi",
        "Holographic sci-fi — dark space, glowing point clouds, cyan/amber lines",
        "خيال علمي هولوغرافي — فضاء داكن ونقاط متوهجة وخطوط سماوية/كهرمانية",
      ),
      opt(
        "minimal_flat",
        "Minimal flat — clean shapes, bold typography",
        "مسطح بسيط — أشكال نظيفة وخطوط عريضة",
      ),
      opt(
        "editorial",
        "Editorial — photo-led, magazine layout",
        "تحريري — قائم على الصور بتخطيط مجلة",
      ),
      opt("custom", "Custom (describe below)", "مخصص (صِفه أدناه)"),
    ],
    allow_ai_decide: true,
  },
  {
    id: "q_visual_style_custom",
    group: "visual",
    label: L("Describe the look", "صِف المظهر"),
    type: "textarea",
    required: true,
    validation: { min_length: 10, max_length: 600 },
    show_if: { question: "q_visual_style", op: "eq", value: "custom" },
    allow_ai_decide: false,
  },
  {
    id: "q_color_mode",
    group: "visual",
    label: L("Background", "الخلفية"),
    type: "radio",
    required: true,
    options: [opt("dark", "Dark", "داكنة"), opt("light", "Light", "فاتحة")],
    allow_ai_decide: true,
  },
  {
    id: "q_accent_color",
    group: "visual",
    label: L("Accent color", "لون التمييز"),
    explanation: L(
      "One high-contrast accent; the rest comes from the brand palette.",
      "لون تمييز واحد عالي التباين؛ والباقي من لوحة ألوان العلامة.",
    ),
    type: "color",
    required: true,
    validation: { pattern: "^#[0-9a-fA-F]{6}$" },
    allow_ai_decide: true,
  },
  {
    id: "q_reference_notes",
    group: "visual",
    label: L("Visual references or must-haves", "مراجع بصرية أو عناصر ضرورية"),
    type: "textarea",
    required: false,
    validation: { max_length: 800 },
    allow_ai_decide: false,
  },

  // ── Motion & sound (video) ───────────────────────────────────────
  {
    id: "q_camera_style",
    group: "motion",
    label: L("Camera movement", "حركة الكاميرا"),
    type: "radio",
    required: true,
    options: [
      opt("smooth_orbit", "Smooth orbit around the subject", "دوران سلس حول العنصر"),
      opt("dolly_push", "Dolly push-ins between scenes", "اقتراب تدريجي بين المشاهد"),
      opt("swoop_reveal", "Swooping fly-throughs and reveals", "تحليق انسيابي وكشف درامي"),
      opt("static_drift", "Mostly still with subtle drift", "ثابتة غالبًا مع انجراف خفيف"),
    ],
    show_if: VIDEO,
    allow_ai_decide: true,
  },
  {
    id: "q_post_fx",
    group: "motion",
    label: L("Post-processing", "المعالجة اللاحقة"),
    type: "radio",
    required: true,
    options: [
      opt("clean", "Clean — tone mapping only", "نظيف — موازنة الألوان فقط"),
      opt(
        "cinematic",
        "Cinematic — bloom, film grain, vignette",
        "سينمائي — توهج وحبيبات فيلم وتظليل الأطراف",
      ),
      opt("bold", "Bold — strong bloom, chromatic aberration", "جريء — توهج قوي وانحراف لوني"),
    ],
    show_if: VIDEO,
    allow_ai_decide: true,
  },
  {
    id: "q_text_density",
    group: "motion",
    label: L("On-screen text", "النص على الشاشة"),
    type: "radio",
    required: true,
    options: [
      opt("minimal", "Minimal — short labels", "قليل — عناوين قصيرة"),
      opt("balanced", "Balanced — one line per scene", "متوازن — سطر لكل مشهد"),
      opt("rich", "Rich — captions throughout", "غني — نصوص طوال الفيديو"),
    ],
    show_if: VIDEO,
    allow_ai_decide: true,
  },
  {
    id: "q_voiceover",
    group: "motion",
    label: L("Voiceover", "التعليق الصوتي"),
    type: "radio",
    required: true,
    options: [
      opt("none", "None (music + text)", "بدون (موسيقى + نص)"),
      opt("ai_voice", "AI voice", "صوت بالذكاء الاصطناعي"),
      opt("own_voice", "I'll record it", "سأسجله بنفسي"),
    ],
    show_if: VIDEO,
    allow_ai_decide: true,
  },
  {
    id: "q_music_mood",
    group: "motion",
    label: L("Music mood", "طابع الموسيقى"),
    type: "select",
    required: false,
    options: [
      opt("none", "No music", "بدون موسيقى"),
      opt("upbeat", "Upbeat", "حيوية"),
      opt("calm", "Calm", "هادئة"),
      opt("epic", "Epic", "ملحمية"),
      opt("corporate", "Corporate", "مؤسسية"),
      opt("playful", "Playful", "مرحة"),
    ],
    show_if: VIDEO,
    allow_ai_decide: true,
  },

  // ── Call to action ───────────────────────────────────────────────
  {
    id: "q_cta",
    group: "cta",
    label: L("Call to action", "الدعوة لإجراء"),
    type: "text",
    required: true,
    validation: { max_length: 120 },
    allow_ai_decide: true,
  },
  {
    id: "q_cta_url",
    group: "cta",
    label: L("Link", "الرابط"),
    type: "url",
    required: false,
    validation: { max_length: 2048 },
    allow_ai_decide: false,
  },
  {
    id: "q_hashtags",
    group: "cta",
    label: L("Hashtags", "الوسوم"),
    type: "text",
    required: false,
    validation: { max_length: 300 },
    allow_ai_decide: true,
  },
];

export const CATALOG_IDS = CATALOG.map((q) => q.id);
export type CatalogId = (typeof CATALOG)[number]["id"];

export function catalogQuestion(id: string): Question | undefined {
  return CATALOG.find((q) => q.id === id);
}

/** Output pixel size for an aspect ratio (1080 on the short side; 1920 for 16:9 width). */
export function dimensionsFor(aspect: string): { width: number; height: number } {
  switch (aspect) {
    case "9:16":
      return { width: 1080, height: 1920 };
    case "4:5":
      return { width: 1080, height: 1350 };
    case "1:1":
      return { width: 1080, height: 1080 };
    default:
      return { width: 1920, height: 1080 };
  }
}
