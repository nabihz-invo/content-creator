import type { ProjectStatus } from "@cc/shared";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

const VARIANT: Record<
  ProjectStatus,
  "info" | "warning" | "success" | "destructive" | "secondary" | "outline"
> = {
  new: "secondary",
  analyzing: "info",
  awaiting_answers: "warning",
  validating_answers: "info",
  needs_clarification: "warning",
  generating_script: "info",
  script_in_review: "warning",
  generating_creative: "info",
  creative_in_review: "warning",
  rendering: "info",
  media_in_review: "warning",
  ready_to_publish: "success",
  scheduled: "success",
  publishing: "info",
  published: "success",
  failed: "destructive",
  cancelled: "outline",
};

/** Statuses where the system is working (vs. waiting on a human). */
const WORKING = new Set<ProjectStatus>([
  "analyzing",
  "validating_answers",
  "generating_script",
  "generating_creative",
  "rendering",
  "publishing",
]);

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useI18n();
  return (
    <Badge variant={VARIANT[status]} data-status={status}>
      {WORKING.has(status) && (
        <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden />
      )}
      {t(`status.${status}`)}
    </Badge>
  );
}
