/**
 * Deterministic stand-in for the model (AI_PROVIDER=fake). Produces
 * schema-valid outputs that depend on the input, so local dev, CI, and e2e can
 * run the whole pipeline without network or cost. Never used in production.
 *
 * Test hook: an idea containing "[clarify]" makes the brief stage ask one
 * clarification question until a clarification answer exists.
 */
import type {
  AnalysisStageOutput,
  Brief,
  BriefStageOutput,
  CarouselScript,
  Script,
  StaticScript,
  VideoScript,
} from "./ai-schemas.ts";
import type { Answers } from "./questionnaire.ts";

const both = (en: string, ar: string) => ({ en, ar });

function detectFormat(text: string, hint: string | null): "static" | "carousel" | "video" {
  if (hint === "static" || hint === "carousel" || hint === "video") return hint;
  if (/carousel|كاروسيل|slides|شرائح/i.test(text)) return "carousel";
  if (/video|فيديو|reel|motion|3d|ريل/i.test(text)) return "video";
  return "static";
}

const isArabic = (t: string) => /[؀-ۿ]/.test(t);

export function fakeAnalysis(input: {
  idea: string;
  title: string;
  content_type: string | null;
  source_text?: string | null;
}): AnalysisStageOutput {
  const text = `${input.title}\n${input.idea}\n${input.source_text ?? ""}`;
  const format = detectFormat(text, input.content_type);
  const lang = isArabic(input.idea) ? "ar" : "en";
  const topic = input.title.slice(0, 80);
  const aspect = format === "video" ? "9:16" : format === "carousel" ? "4:5" : "1:1";
  const beats =
    lang === "ar"
      ? "مشهد افتتاحي يلفت الانتباه\nعرض المشكلة\nتقديم الحل\nالدعوة لإجراء"
      : "Attention-grabbing opening\nShow the problem\nIntroduce the solution\nCall to action";
  const suggestions: AnalysisStageOutput["suggestions"] = [
    {
      question_id: "q_core_message",
      value: input.idea.slice(0, 300).padEnd(12, "."),
      rationale: both("Taken from your idea.", "مأخوذ من فكرتك."),
      confidence: "high",
    },
    {
      question_id: "q_objective",
      value: /offer|عرض|sale|خصم/i.test(text) ? "conversion" : "awareness",
      rationale: both("Based on the idea's intent.", "بناءً على هدف الفكرة."),
      confidence: "medium",
    },
    {
      question_id: "q_format",
      value: format,
      rationale: both(`A ${format} fits this message best.`, "هذه الصيغة الأنسب لهذه الرسالة."),
      confidence: "high",
    },
    {
      question_id: "q_platforms",
      value: format === "video" ? ["instagram", "tiktok"] : ["instagram"],
      rationale: both("Where this format performs best.", "حيث تحقق هذه الصيغة أفضل أداء."),
      confidence: "medium",
    },
    {
      question_id: "q_aspect_ratio",
      value: aspect,
      rationale: both("Matches the chosen platforms.", "يناسب المنصات المختارة."),
      confidence: "high",
    },
    {
      question_id: "q_language",
      value: lang,
      rationale: both("Same language as the idea.", "نفس لغة الفكرة."),
      confidence: "high",
    },
    {
      question_id: "q_visual_style",
      value: format === "video" ? "glassmorphism" : "minimal_flat",
      rationale: both("Modern look that suits the topic.", "مظهر عصري يناسب الموضوع."),
      confidence: "medium",
    },
    {
      question_id: "q_color_mode",
      value: format === "video" ? "dark" : "light",
      rationale: both("Contrast for the style.", "تباين يناسب الأسلوب."),
      confidence: "low",
    },
    {
      question_id: "q_hook",
      value: lang === "ar" ? "هل تعرف هذا السر؟" : "Did you know this?",
      rationale: both("A question stops the scroll.", "السؤال يوقف التمرير."),
      confidence: "low",
    },
    {
      question_id: "q_tone",
      value: lang === "ar" ? "ودود وواثق" : "Friendly and confident",
      rationale: both("Fits a broad audience.", "يناسب جمهورًا واسعًا."),
      confidence: "low",
    },
    {
      question_id: "q_cta",
      value: lang === "ar" ? "تابعنا للمزيد" : "Follow for more",
      rationale: both("Low-friction action.", "إجراء سهل."),
      confidence: "low",
    },
  ];
  if (format !== "static") {
    suggestions.push({
      question_id: "q_scene_beats",
      value: beats,
      rationale: both("A classic problem → solution arc.", "قوس كلاسيكي من المشكلة إلى الحل."),
      confidence: "medium",
    });
  }
  if (format === "video") {
    suggestions.push(
      {
        question_id: "q_duration",
        value: "20",
        rationale: both("Short enough to finish.", "قصير بما يكفي ليُشاهد كاملًا."),
        confidence: "medium",
      },
      {
        question_id: "q_camera_style",
        value: "smooth_orbit",
        rationale: both("Calm, premium movement.", "حركة هادئة وراقية."),
        confidence: "medium",
      },
      {
        question_id: "q_post_fx",
        value: "cinematic",
        rationale: both("Polished look.", "مظهر مصقول."),
        confidence: "medium",
      },
      {
        question_id: "q_text_density",
        value: "balanced",
        rationale: both("Readable without sound.", "مقروء دون صوت."),
        confidence: "medium",
      },
      {
        question_id: "q_voiceover",
        value: "none",
        rationale: both("Most viewers watch muted.", "معظم المشاهدين بلا صوت."),
        confidence: "medium",
      },
    );
  }
  if (format === "carousel") {
    suggestions.push({
      question_id: "q_slide_count",
      value: "6",
      rationale: both("Enough room for the story.", "مساحة كافية للقصة."),
      confidence: "medium",
    });
  }
  const custom_questions: AnalysisStageOutput["custom_questions"] = /offer|عرض|discount|خصم/i.test(
    text,
  )
    ? [
        {
          id: "q_custom_offer_end_date",
          label: both("When does the offer end?", "متى ينتهي العرض؟"),
          explanation: both(
            "Needed to state the deadline correctly.",
            "مطلوب لذكر الموعد النهائي بدقة.",
          ),
          type: "text",
          required: true,
          options: [],
          suggested_value: null,
          rationale: both(
            "The idea mentions an offer but no end date.",
            "تذكر الفكرة عرضًا دون تاريخ انتهاء.",
          ),
        },
      ]
    : [];
  return {
    analysis: {
      topic,
      summary: both(`An idea about "${topic}".`, `فكرة حول «${topic}».`),
      objective: "awareness",
      audience: lang === "ar" ? "متابعو العلامة على وسائل التواصل" : "The brand's social followers",
      proposed_format: format,
      format_rationale: both(`${format} suits the message.`, "هذه الصيغة تناسب الرسالة."),
      language: lang,
      platforms: [{ platform: "instagram", suitability: 0.9 }],
      brand_relevance: { score: 0.8, notes: "Relevant." },
      known_facts: [],
      missing_information: custom_questions.length
        ? [both("Offer end date", "تاريخ انتهاء العرض")]
        : [],
      claims_to_verify: [],
      risk_flags: [],
    },
    suggestions,
    skip: ["q_reference_notes"],
    custom_questions,
  };
}

export function fakeBrief(input: {
  idea: string;
  answers: Answers;
  clarification_answered: boolean;
  brand_prohibited: string[];
}): BriefStageOutput {
  if (/\[clarify\]/i.test(input.idea) && !input.clarification_answered) {
    return {
      status: "needs_clarification",
      contradictions: [],
      clarification_questions: [
        {
          id: "q_custom_target_city",
          label: both("Which city is this for?", "لأي مدينة هذا المحتوى؟"),
          explanation: null,
          type: "text",
          required: true,
          options: [],
          suggested_value: null,
          rationale: both("The location changes the message.", "الموقع يغيّر الرسالة."),
        },
      ],
      brief: null,
    };
  }
  const a = input.answers;
  const text = (id: string, fallback: string) =>
    typeof a[id] === "string" && (a[id] as string).trim() ? (a[id] as string) : fallback;
  const core = text("q_core_message", input.idea);
  const brief: Brief = {
    title: core.split("\n")[0]!.slice(0, 80),
    key_message: core.slice(0, 300),
    supporting_points: ["Clear benefit", "Simple next step"],
    audience: text("q_audience", "General audience"),
    objective: "awareness",
    tone: text("q_tone", "Friendly"),
    content_type: "static",
    language: "en",
    platforms: ["instagram"],
    aspect_ratio: "1:1",
    duration_seconds: null,
    slide_count: null,
    hook: text("q_hook", "Stop scrolling"),
    narrative_beats: ["Hook", "Problem", "Solution", "Call to action"],
    facts_to_include: [],
    claims_requiring_verification: [],
    prohibited_claims: input.brand_prohibited,
    visual: {
      style: "minimal_flat",
      style_notes: "Clean and bold.",
      color_mode: "light",
      accent_color: "#4f46e5",
      camera_style: null,
      post_fx: null,
      text_density: null,
    },
    audio: { voiceover: null, music_mood: null },
    cta: { text: text("q_cta", "Learn more"), url: null },
    hashtags: [],
    assumptions: Object.entries(a)
      .filter(([, v]) => typeof v === "object" && v !== null && !Array.isArray(v))
      .map(([question_id]) => ({
        question_id,
        value: "decided by AI",
        reason: "User chose Let AI decide.",
      })),
  };
  return { status: "ready", contradictions: [], clarification_questions: [], brief };
}

export function fakeScript(
  brief: Brief,
  revision?: { comment: string | null; version: number } | null,
): Script {
  const suffix = revision ? ` (v${revision.version + 1})` : "";
  const common = {
    title: `${brief.title}${suffix}`.slice(0, 120),
    language: brief.language,
    caption: `${brief.key_message}\n\n${brief.cta.text}`.slice(0, 2200),
    hashtags: brief.hashtags,
  };
  if (brief.content_type === "video") {
    const total = brief.duration_seconds ?? 20;
    const beats =
      brief.narrative_beats.length >= 2
        ? brief.narrative_beats
        : ["Hook", "Message", "Call to action"];
    const step = Math.round((total / beats.length) * 100) / 100;
    const scenes = beats.map((beat, i) => {
      const start = Math.round(step * i * 100) / 100;
      const end = i === beats.length - 1 ? total : Math.round(step * (i + 1) * 100) / 100;
      return {
        index: i + 1,
        start_s: start,
        end_s: end,
        purpose: beat,
        on_screen_text: beat.slice(0, 60),
        voiceover: null,
        visual: `Abstract ${brief.visual.style} shapes illustrating: ${beat}`,
        camera: {
          move: "slow orbit",
          start_position: [0, 1.5, 6 - i],
          end_position: [1, 1.2, 5 - i],
          look_at: [0, 0.5, 0],
          easing: "easeInOutCubic",
        },
        transition_out: i === beats.length - 1 ? "fade to logo" : "camera glide",
        sound: "soft whoosh",
      };
    });
    const v: VideoScript = {
      ...common,
      total_duration_s: total,
      hook: brief.hook,
      scenes,
      closing_cta: brief.cta.text,
      music_direction: brief.audio.music_mood ?? "calm",
    };
    return v;
  }
  if (brief.content_type === "carousel") {
    const n = brief.slide_count ?? 6;
    const slides = Array.from({ length: n }, (_, i) => ({
      index: i + 1,
      role: (i === 0 ? "cover" : i === n - 1 ? "cta" : "body") as "cover" | "body" | "cta",
      headline:
        i === 0
          ? brief.hook.slice(0, 100)
          : i === n - 1
            ? brief.cta.text
            : (brief.narrative_beats[(i - 1) % Math.max(1, brief.narrative_beats.length)] ??
              `Point ${i}`),
      supporting_text: i === 0 ? brief.key_message.slice(0, 200) : "Supporting detail.",
      visual: `${brief.visual.style} illustration`,
    }));
    const c: CarouselScript = { ...common, slides, cta: brief.cta.text };
    return c;
  }
  const s: StaticScript = {
    ...common,
    headline: brief.hook.slice(0, 100),
    body: brief.key_message.slice(0, 500),
    visual_composition: `${brief.visual.style} composition with accent ${brief.visual.accent_color}`,
    cta: brief.cta.text,
  };
  return s;
}
