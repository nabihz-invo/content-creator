/**
 * The three AI stages behind one interface: Claude in production, a
 * deterministic fake for local dev, CI, and e2e (AI_PROVIDER=fake).
 */
import { generateJson, type StageSettings, STAGE_DEFAULTS, type Transport } from "./llm.ts";
import {
  type Analysis,
  type AnalysisStageOutput,
  analysisStageSchema,
  type Brief,
  type BriefStageOutput,
  briefStageSchema,
  type Script,
  SCRIPT_SCHEMAS,
} from "./vendor/src/ai-schemas.ts";
import { fakeAnalysis, fakeBrief, fakeScript } from "./vendor/src/fake-ai.ts";
import { type BrandContext, checkScript, enforceApprovedConfig } from "./vendor/src/pipeline.ts";
import {
  buildAnalysisPrompt,
  buildBriefPrompt,
  buildScriptPrompt,
} from "./vendor/src/prompts/stages.ts";
import type { Answers, Questionnaire } from "./vendor/src/questionnaire.ts";

export interface StageOverrides {
  settings?: Partial<StageSettings>;
  promptVersion?: string;
}

export interface AnalysisInput {
  brand: BrandContext | null;
  title: string;
  idea: string;
  input_source: string;
  content_type_hint: string | null;
  ui_locale: "en" | "ar";
  source_page: { url: string; title: string | null; text: string } | null;
}

export interface BriefInput {
  brand: BrandContext | null;
  analysis: Analysis | null;
  questionnaire: Questionnaire;
  answers: Answers;
  clarifications: { questionnaire: Questionnaire; answers: Answers }[];
  idea: string;
}

export interface ScriptInput {
  brand: BrandContext | null;
  brief: Brief;
  previous: {
    script: Script;
    version: number;
    comment: string | null;
    instructions: string | null;
  } | null;
}

export interface StageResult<T> {
  output: T;
  model: string;
  promptVersion: string;
}

export interface StageAi {
  analyze(input: AnalysisInput, o?: StageOverrides): Promise<StageResult<AnalysisStageOutput>>;
  brief(input: BriefInput, o?: StageOverrides): Promise<StageResult<BriefStageOutput>>;
  script(input: ScriptInput, o?: StageOverrides): Promise<StageResult<Script>>;
}

const settings = (stage: keyof typeof STAGE_DEFAULTS, o?: StageOverrides): StageSettings => ({
  ...STAGE_DEFAULTS[stage],
  ...(o?.settings ?? {}),
});

export function claudeStageAi(transport: Transport): StageAi {
  return {
    async analyze(input, o) {
      const p = buildAnalysisPrompt({ ...input, version: o?.promptVersion });
      const r = await generateJson<AnalysisStageOutput>(transport, {
        stage: "analysis",
        system: p.system,
        user: p.user,
        schema: analysisStageSchema,
        settings: settings("analysis", o),
      });
      return { output: r.data, model: r.model, promptVersion: p.version };
    },
    async brief(input, o) {
      const p = buildBriefPrompt({ ...input, version: o?.promptVersion });
      const r = await generateJson<BriefStageOutput>(transport, {
        stage: "brief",
        system: p.system,
        user: p.user,
        schema: briefStageSchema,
        settings: settings("brief", o),
        check: (d) => {
          const b = d as BriefStageOutput;
          if (b.status === "ready" && !b.brief) return ["status is ready but brief is null"];
          if (b.status === "needs_clarification" && !b.clarification_questions.length) {
            return ["status is needs_clarification but clarification_questions is empty"];
          }
          return [];
        },
      });
      return { output: r.data, model: r.model, promptVersion: p.version };
    },
    async script(input, o) {
      const p = buildScriptPrompt({ ...input, version: o?.promptVersion });
      const r = await generateJson<Script>(transport, {
        stage: "script",
        system: p.system,
        user: p.user,
        schema: SCRIPT_SCHEMAS[input.brief.content_type],
        settings: settings("script", o),
        check: (d) => checkScript(d as Script, input.brief),
      });
      return { output: r.data, model: r.model, promptVersion: p.version };
    },
  };
}

export function fakeStageAi(): StageAi {
  return {
    analyze: (i) =>
      Promise.resolve({
        output: fakeAnalysis({
          idea: i.idea,
          title: i.title,
          content_type: i.content_type_hint,
          source_text: i.source_page?.text ?? null,
        }),
        model: "fake",
        promptVersion: "fake",
      }),
    brief: (i) =>
      Promise.resolve({
        output: fakeBrief({
          idea: i.idea,
          answers: i.answers,
          clarification_answered: i.clarifications.some((c) => Object.keys(c.answers).length > 0),
          brand_prohibited: i.brand?.settings.claims?.prohibited ?? [],
        }),
        model: "fake",
        promptVersion: "fake",
      }),
    script: (i) =>
      Promise.resolve({
        output: fakeScript(i.brief, i.previous),
        model: "fake",
        promptVersion: "fake",
      }),
  };
}

export { enforceApprovedConfig };
