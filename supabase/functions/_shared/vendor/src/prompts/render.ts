import { CATALOG } from "../config-catalog.ts";
import { TEMPLATES } from "./templates.generated.ts";

export class PromptError extends Error {}

export function template(name: string): string {
  const t = TEMPLATES[name];
  if (t === undefined) throw new PromptError(`unknown prompt template ${name}`);
  return t;
}

/** Replaces {{name}} placeholders. Every placeholder must be provided. */
export function renderPrompt(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in vars)) throw new PromptError(`missing prompt variable ${key}`);
    return String(vars[key]);
  });
}

export function splitSections(text: string): { system: string; user: string } {
  const m = text.match(/<!-- system -->([\s\S]*?)<!-- user -->([\s\S]*)$/);
  if (!m) throw new PromptError("template must contain <!-- system --> and <!-- user --> sections");
  return { system: m[1]!.trim(), user: m[2]!.trim() };
}

/**
 * Wraps untrusted text (ideas, CSV cells, Telegram messages, web pages) so the
 * model treats it as data. The content cannot close the wrapper: any tag that
 * looks like it is neutralized.
 */
export function untrusted(label: string, text: string | null | undefined): string {
  if (!text || !text.trim()) return `<untrusted_source label="${label}">(none)</untrusted_source>`;
  const safe = text.replace(/<\s*\/?\s*untrusted_source[^>]*>/gi, "[removed tag]");
  return `<untrusted_source label="${label}">\n${safe}\n</untrusted_source>`;
}

/** The catalog as compact reference lines for the analysis prompt. */
export function catalogForPrompt(): string {
  return CATALOG.map((q) => {
    const parts = [`- ${q.id} (${q.type}${q.required ? ", required" : ""}) — ${q.label.en}`];
    if (q.explanation) parts.push(`  ${q.explanation.en}`);
    if (q.options?.length) parts.push(`  options: ${q.options.map((o) => o.value).join(" | ")}`);
    if (q.show_if)
      parts.push(
        `  only when ${q.show_if.question} ${q.show_if.op} ${Array.isArray(q.show_if.value) ? q.show_if.value.join("/") : (q.show_if.value ?? "")}`,
      );
    const v = q.validation;
    if (v?.max_length) parts.push(`  max ${v.max_length} characters`);
    if (v?.min_lines) parts.push(`  ${v.min_lines}–${v.max_lines ?? ""} lines`);
    return parts.join("\n");
  }).join("\n");
}
