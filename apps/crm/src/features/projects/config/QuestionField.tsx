import { type AnswerError, type AnswerValue, isAiDecide, type Question } from "@cc/shared";
import { Sparkles, Palette as PaletteIcon, PenLine } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { textDir } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

const same = (a: AnswerValue | undefined, b: AnswerValue | undefined) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function QuestionField({
  question: q,
  value,
  error,
  disabled,
  onChange,
}: {
  question: Question;
  value: AnswerValue | undefined;
  error?: AnswerError;
  disabled?: boolean;
  onChange: (v: AnswerValue | undefined) => void;
}) {
  const { t, locale } = useI18n();
  const id = `field-${q.id}`;
  const aiDecides = isAiDecide(value);
  const str = typeof value === "string" ? value : "";
  const arr = Array.isArray(value) ? value : [];
  const s = q.suggested;
  const edited = s && !aiDecides && value !== undefined && !same(value, s.value);

  const input = (() => {
    switch (q.type) {
      case "textarea":
        return (
          <Textarea
            id={id}
            rows={q.id === "q_scene_beats" ? 5 : 3}
            dir={textDir(str) === "auto" ? "auto" : textDir(str)}
            value={str}
            disabled={disabled || aiDecides}
            aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      case "select":
        return (
          <NativeSelect
            id={id}
            value={str}
            disabled={disabled || aiDecides}
            aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value || undefined)}
          >
            <option value="">—</option>
            {q.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label[locale]}
              </option>
            ))}
          </NativeSelect>
        );
      case "radio":
        return (
          <div
            role="radiogroup"
            aria-labelledby={`${id}-label`}
            className={cn(
              "grid gap-2",
              (q.options?.length ?? 0) > 3 ? "sm:grid-cols-2" : "sm:grid-cols-3",
            )}
          >
            {q.options?.map((o) => {
              const checked = str === o.value;
              return (
                <label
                  key={o.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-lg border bg-card p-3 text-sm transition hover:border-primary/40",
                    checked && "border-primary bg-primary/5 ring-1 ring-primary/30",
                    (disabled || aiDecides) && "pointer-events-none opacity-60",
                  )}
                >
                  <input
                    type="radio"
                    name={id}
                    className="mt-0.5 accent-[var(--primary)]"
                    checked={checked}
                    disabled={disabled || aiDecides}
                    onChange={() => onChange(o.value)}
                  />
                  <span>{o.label[locale]}</span>
                </label>
              );
            })}
          </div>
        );
      case "checkbox":
        return (
          <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${id}-label`}>
            {q.options?.map((o) => {
              const checked = arr.includes(o.value);
              return (
                <label
                  key={o.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm transition",
                    checked && "border-primary bg-primary/5",
                    disabled && "pointer-events-none opacity-60",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={disabled || aiDecides}
                    onCheckedChange={(c) =>
                      onChange(c ? [...arr, o.value] : arr.filter((x) => x !== o.value))
                    }
                  />
                  {o.label[locale]}
                </label>
              );
            })}
          </div>
        );
      case "color":
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label={q.label[locale]}
              value={/^#[0-9a-f]{6}$/i.test(str) ? str : "#000000"}
              disabled={disabled || aiDecides}
              onChange={(e) => onChange(e.target.value)}
              className="size-9 cursor-pointer rounded-md border bg-card p-1"
            />
            <Input
              id={id}
              dir="ltr"
              className="w-32 font-mono"
              value={str}
              disabled={disabled || aiDecides}
              aria-invalid={!!error}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        );
      case "url":
        return (
          <Input
            id={id}
            type="url"
            dir="ltr"
            value={str}
            disabled={disabled || aiDecides}
            aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      default:
        return (
          <Input
            id={id}
            dir={textDir(str) === "auto" ? "auto" : textDir(str)}
            value={str}
            disabled={disabled || aiDecides}
            aria-invalid={!!error}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  })();

  const lines = q.validation?.min_lines
    ? t("config.linesHint", { min: q.validation.min_lines, max: q.validation.max_lines ?? "" })
    : null;

  return (
    <div className="flex flex-col gap-2" data-question={q.id}>
      <div className="flex flex-wrap items-center gap-2">
        <Label
          id={`${id}-label`}
          htmlFor={["radio", "checkbox"].includes(q.type) ? undefined : id}
          className="text-sm"
        >
          {q.label[locale]}
          {q.required && <span className="text-destructive">*</span>}
        </Label>
        {s && !edited && !aiDecides && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
              s.source === "brand"
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary/10 text-primary",
            )}
          >
            {s.source === "brand" ? (
              <PaletteIcon className="size-3" />
            ) : (
              <Sparkles className="size-3" />
            )}
            {s.source === "brand"
              ? t("config.badge.brand")
              : `${t("config.badge.ai")} · ${t(`config.confidence.${s.confidence}` as MessageKey)}`}
          </span>
        )}
        {edited && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium">
            <PenLine className="size-3" />
            {t("config.badge.edited")}
          </span>
        )}
        {q.allow_ai_decide && !disabled && (
          <label className="ms-auto flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <Checkbox
              checked={aiDecides}
              onCheckedChange={(c) => onChange(c ? { ai_decide: true } : s?.value)}
            />
            {t("config.aiDecide")}
          </label>
        )}
      </div>
      {q.explanation && <p className="text-xs text-muted-foreground">{q.explanation[locale]}</p>}
      {input}
      {s && s.source === "ai" && !aiDecides && (
        <p className="text-xs text-primary/80">✦ {s.rationale[locale]}</p>
      )}
      {lines && <p className="text-xs text-muted-foreground">{lines}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {t(`error.${error}` as MessageKey)}
        </p>
      )}
    </div>
  );
}
