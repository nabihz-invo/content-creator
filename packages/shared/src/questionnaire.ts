/**
 * Questionnaire model, answer validation, and composition of the AI-proposed
 * configuration (ADR-0006). Pure functions: used by Edge Functions (vendored)
 * and the CRM, so both sides agree on visibility and validity.
 */

export interface Localized {
  en: string;
  ar: string;
}

export type QuestionType =
  "text" | "textarea" | "select" | "radio" | "checkbox" | "url" | "color" | "number";
export type Confidence = "high" | "medium" | "low";

export interface QuestionOption {
  value: string;
  label: Localized;
}

export interface ShowIf {
  question: string;
  op: "eq" | "neq" | "in" | "not_empty";
  value?: string | readonly string[];
}

export interface Validation {
  min_length?: number;
  max_length?: number;
  pattern?: string;
  min?: number;
  max?: number;
  min_items?: number;
  max_items?: number;
  /** For textarea answers read as one item per line. */
  min_lines?: number;
  max_lines?: number;
}

export interface Suggestion {
  value: string | string[];
  rationale: Localized;
  confidence: Confidence;
  source: "ai" | "brand" | "catalog";
}

export interface QuestionGroup {
  id: string;
  label: Localized;
}

export interface Question {
  id: string;
  group: string;
  label: Localized;
  explanation?: Localized | null;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[];
  show_if?: ShowIf | null;
  validation?: Validation | null;
  allow_ai_decide: boolean;
  suggested?: Suggestion | null;
  custom?: boolean;
}

export interface Questionnaire {
  schema_version: 1;
  catalog_version: string;
  kind: "initial" | "clarification";
  groups: QuestionGroup[];
  questions: Question[];
}

export type AnswerValue = string | string[] | { ai_decide: true };
export type Answers = Record<string, AnswerValue>;

export type AnswerError =
  | "required"
  | "invalid_type"
  | "invalid_option"
  | "too_short"
  | "too_long"
  | "pattern"
  | "invalid_url"
  | "too_few"
  | "too_many"
  | "ai_decide_not_allowed"
  | "unknown_question";

export const isAiDecide = (v: unknown): v is { ai_decide: true } =>
  typeof v === "object" &&
  v !== null &&
  !Array.isArray(v) &&
  (v as { ai_decide?: unknown }).ai_decide === true;

function isEmpty(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (isAiDecide(v)) return false;
  if (Array.isArray(v)) return v.length === 0;
  return String(v).trim() === "";
}

/** Whether a question is shown, given the current answers (hidden parents hide children). */
export function isVisible(q: Question, answers: Answers, all: Question[], depth = 0): boolean {
  if (!q.show_if || depth > 10) return true;
  const parent = all.find((p) => p.id === q.show_if!.question);
  if (parent && !isVisible(parent, answers, all, depth + 1)) return false;
  const v = answers[q.show_if.question];
  const values = Array.isArray(v) ? v : isAiDecide(v) || v === undefined ? [] : [String(v)];
  const target = q.show_if.value;
  switch (q.show_if.op) {
    case "eq":
      return values.includes(String(target));
    case "neq":
      return !values.includes(String(target));
    case "in":
      return Array.isArray(target)
        ? values.some((x) => target.includes(x))
        : values.includes(String(target));
    case "not_empty":
      return values.some((x) => x.trim() !== "");
  }
}

const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

/** Validates one value against its question. Returns null when valid. */
export function validateValue(q: Question, v: AnswerValue | undefined): AnswerError | null {
  if (isEmpty(v)) return q.required ? "required" : null;
  if (isAiDecide(v)) return q.allow_ai_decide ? null : "ai_decide_not_allowed";
  const val = q.validation ?? {};
  const optionValues = new Set((q.options ?? []).map((o) => o.value));

  if (q.type === "checkbox") {
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) return "invalid_type";
    if (optionValues.size && v.some((x) => !optionValues.has(x))) return "invalid_option";
    if (val.min_items !== undefined && v.length < val.min_items) return "too_few";
    if (val.max_items !== undefined && v.length > val.max_items) return "too_many";
    return null;
  }
  if (typeof v !== "string") return "invalid_type";
  const s = v.trim();
  if ((q.type === "select" || q.type === "radio") && optionValues.size && !optionValues.has(s))
    return "invalid_option";
  if (q.type === "url") {
    try {
      const u = new URL(s);
      if (u.protocol !== "http:" && u.protocol !== "https:") return "invalid_url";
    } catch {
      return "invalid_url";
    }
  }
  if (q.type === "color" && !/^#[0-9a-fA-F]{6}$/.test(s)) return "pattern";
  if (q.type === "number") {
    const n = Number(s);
    if (!Number.isFinite(n)) return "invalid_type";
    if (val.min !== undefined && n < val.min) return "too_short";
    if (val.max !== undefined && n > val.max) return "too_long";
  }
  if (val.min_length !== undefined && s.length < val.min_length) return "too_short";
  if (val.max_length !== undefined && s.length > val.max_length) return "too_long";
  if (val.pattern && !new RegExp(val.pattern).test(s)) return "pattern";
  if (val.min_lines !== undefined && lines(s).length < val.min_lines) return "too_few";
  if (val.max_lines !== undefined && lines(s).length > val.max_lines) return "too_many";
  return null;
}

export interface AnswersCheck {
  valid: boolean;
  errors: Record<string, AnswerError>;
  /** Answers restricted to visible questions (hidden answers are dropped). */
  cleaned: Answers;
  visible: string[];
}

export function validateAnswers(questionnaire: Questionnaire, answers: Answers): AnswersCheck {
  const qs = questionnaire.questions;
  const errors: Record<string, AnswerError> = {};
  const cleaned: Answers = {};
  const visible: string[] = [];
  for (const id of Object.keys(answers)) {
    if (!qs.some((q) => q.id === id)) errors[id] = "unknown_question";
  }
  for (const q of qs) {
    if (!isVisible(q, answers, qs)) continue;
    visible.push(q.id);
    const err = validateValue(q, answers[q.id]);
    if (err) errors[q.id] = err;
    else if (!isEmpty(answers[q.id])) {
      const v = answers[q.id]!;
      cleaned[q.id] = typeof v === "string" ? v.trim() : v;
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, cleaned, visible };
}

/** Initial form values: suggestion → nothing. Used to pre-fill the review form. */
export function suggestedAnswers(questionnaire: Questionnaire): Answers {
  const out: Answers = {};
  for (const q of questionnaire.questions) {
    if (q.suggested) out[q.id] = q.suggested.value;
  }
  return out;
}

/** Plain text value of an answer for prompts ("AI decides" → null). */
export function answerText(v: AnswerValue | undefined): string | null {
  if (v === undefined || isAiDecide(v)) return null;
  return Array.isArray(v) ? v.join(", ") : v;
}
