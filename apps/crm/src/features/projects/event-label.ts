import { isProjectStatus } from "@cc/shared";
import { isMessageKey, type Locale, translate } from "@/lib/i18n";
import type { WorkflowEvent } from "@/types/db";

/** Human-readable label for an audit event, in the UI language. */
export function eventLabel(e: WorkflowEvent, locale: Locale): string {
  const key = `event.${e.event_type}`;
  if (!isMessageKey(key)) return e.event_type;
  const d = e.event_data as Record<string, unknown>;
  const status = (v: unknown) => {
    const s = String(v ?? "");
    return isProjectStatus(s) ? translate(locale, `status.${s}`) : s;
  };
  return translate(locale, key, {
    from: status(d.from),
    to: status(d.to),
    stage: String(d.stage ?? ""),
    attempts: String(d.attempts ?? ""),
  });
}
