/** The Idea inbox stages, in flow order. Worked out by `public.inbox_stage` in the database. */
export const FLOW_STAGES = ["new", "content", "media", "declined", "ready", "published"] as const;

/** Outside the flow: shown as small links under the stage cards. */
export const SIDE_STAGES = ["failed", "cancelled"] as const;

export type InboxStage = (typeof FLOW_STAGES)[number] | (typeof SIDE_STAGES)[number];

export function parseInboxStage(value: string | null): InboxStage | null {
  return [...FLOW_STAGES, ...SIDE_STAGES].find((s) => s === value) ?? null;
}
