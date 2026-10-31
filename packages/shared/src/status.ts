/**
 * Project status machine. Mirrors docs/WORKFLOW.md §2–3 and the
 * `project_status_transitions` table seeded in supabase/migrations.
 * A test (test/status-sql-sync.test.ts) fails if the two drift apart.
 */

export const PROJECT_STATUSES = [
  "new",
  "analyzing",
  "awaiting_answers",
  "validating_answers",
  "needs_clarification",
  "generating_script",
  "script_in_review",
  "generating_creative",
  "creative_in_review",
  "rendering",
  "media_in_review",
  "ready_to_publish",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STAGES = [
  "intake",
  "analysis",
  "questionnaire",
  "brief",
  "script",
  "script_review",
  "creative",
  "creative_review",
  "render",
  "media_review",
  "publish",
] as const;

export type Stage = (typeof STAGES)[number];

/** Stage a project is in while it has a given status. */
export const STATUS_STAGE: Record<ProjectStatus, Stage | null> = {
  new: "intake",
  analyzing: "analysis",
  awaiting_answers: "questionnaire",
  validating_answers: "brief",
  needs_clarification: "brief",
  generating_script: "script",
  script_in_review: "script_review",
  generating_creative: "creative",
  creative_in_review: "creative_review",
  rendering: "render",
  media_in_review: "media_review",
  ready_to_publish: "publish",
  scheduled: "publish",
  publishing: "publish",
  published: "publish",
  failed: null,
  cancelled: null,
};

export const TERMINAL_STATUSES: readonly ProjectStatus[] = ["published", "cancelled"];

export interface Transition {
  from: ProjectStatus;
  to: ProjectStatus;
  trigger: string;
}

const t = (from: ProjectStatus, to: ProjectStatus, trigger: string): Transition => ({
  from,
  to,
  trigger,
});

/** Explicit (non-generic) transitions. */
const EXPLICIT: Transition[] = [
  t("new", "analyzing", "analysis job created"),
  // Only via mark_imported_published(): content-plan imports already posted elsewhere.
  t("new", "published", "imported content already published outside the pipeline (link recorded)"),
  t("analyzing", "awaiting_answers", "questionnaire saved"),
  t("awaiting_answers", "analyzing", "analysis re-run requested"),
  t("awaiting_answers", "validating_answers", "answers submitted"),
  t("validating_answers", "needs_clarification", "contradictions or missing essentials"),
  t("needs_clarification", "validating_answers", "clarification answers submitted"),
  t("validating_answers", "generating_script", "brief valid"),
  t("generating_script", "script_in_review", "script version saved"),
  t("script_in_review", "generating_script", "changes requested, regenerate"),
  t("script_in_review", "script_in_review", "manual edit saved as new version"),
  t("script_in_review", "generating_creative", "script approved"),
  t("generating_creative", "creative_in_review", "creative version recorded"),
  t("creative_in_review", "generating_creative", "creative changes requested"),
  t("creative_in_review", "script_in_review", "sent back to script"),
  t("creative_in_review", "rendering", "creative approved, render job created"),
  t("rendering", "media_in_review", "render succeeded and validated"),
  t("media_in_review", "rendering", "rerender requested"),
  t("media_in_review", "generating_creative", "returned to creative editing"),
  t("media_in_review", "ready_to_publish", "media approved"),
  t("ready_to_publish", "scheduled", "publishing scheduled, provider confirmed"),
  t("ready_to_publish", "publishing", "publish now"),
  t("scheduled", "publishing", "schedule fired"),
  t("publishing", "published", "provider confirmed publication"),
  t("ready_to_publish", "published", "manual publication confirmed by user"),
  t("publishing", "ready_to_publish", "publish failed, retryable"),
];

/** Statuses from which a user may edit and resubmit the questionnaire. */
const RESUBMITTABLE: ProjectStatus[] = [
  "validating_answers",
  "needs_clarification",
  "generating_script",
  "script_in_review",
  "generating_creative",
  "creative_in_review",
  "rendering",
  "media_in_review",
];

export const NON_TERMINAL_STATUSES: readonly ProjectStatus[] = PROJECT_STATUSES.filter(
  (s) => !TERMINAL_STATUSES.includes(s),
);

function buildTransitions(): Transition[] {
  const all: Transition[] = [...EXPLICIT];
  for (const s of RESUBMITTABLE) all.push(t(s, "awaiting_answers", "questionnaire resubmitted"));
  for (const s of NON_TERMINAL_STATUSES) {
    if (s !== "failed") all.push(t(s, "failed", "job needs attention"));
    all.push(t(s, "cancelled", "cancelled by user"));
  }
  // Admin retry from `failed` returns the project to the status it failed in.
  for (const s of NON_TERMINAL_STATUSES) {
    if (s !== "failed") all.push(t("failed", s, "admin retry"));
  }
  // De-duplicate by (from,to), keeping the first trigger.
  const seen = new Set<string>();
  return all.filter((x) => {
    const k = `${x.from}>${x.to}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const TRANSITIONS: readonly Transition[] = buildTransitions();

const TRANSITION_KEYS = new Set(TRANSITIONS.map((x) => `${x.from}>${x.to}`));

export function canTransition(from: ProjectStatus, to: ProjectStatus): boolean {
  return TRANSITION_KEYS.has(`${from}>${to}`);
}

export function isProjectStatus(v: unknown): v is ProjectStatus {
  return typeof v === "string" && (PROJECT_STATUSES as readonly string[]).includes(v);
}

/** Overview groups (blueprint §4A). */
export const OVERVIEW_GROUPS: Record<string, readonly ProjectStatus[]> = {
  awaiting_analysis: ["new", "analyzing"],
  awaiting_answers: ["awaiting_answers", "needs_clarification"],
  scripts_in_review: ["script_in_review"],
  creatives_in_review: ["creative_in_review"],
  rendering: ["rendering"],
  media_in_review: ["media_in_review"],
  ready_to_publish: ["ready_to_publish"],
  scheduled: ["scheduled", "publishing"],
  published: ["published"],
  needs_attention: ["failed"],
};
