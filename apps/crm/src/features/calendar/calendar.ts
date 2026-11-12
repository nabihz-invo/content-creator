/** Month grid and post grouping for the publishing calendar (P5-T26). Dates are plain YYYY-MM-DD strings. */

export interface Month {
  year: number;
  /** 0-11 */
  month: number;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const isoDay = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m, d));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

export function todayIso(now = new Date()) {
  return isoDay(now.getFullYear(), now.getMonth(), now.getDate());
}

export function monthOf(iso: string): Month {
  return { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) - 1 };
}

export function addMonths({ year, month }: Month, by: number): Month {
  const m = year * 12 + month + by;
  return { year: Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
}

/** The days shown for a month: whole weeks from Monday, padded with the neighbouring months' days. */
export function monthGrid({ year, month }: Month): { iso: string; inMonth: boolean }[] {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7; // Monday = 0
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const weeks = Math.ceil((lead + days) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = i - lead + 1;
    return { iso: isoDay(year, month, d), inMonth: d >= 1 && d <= days };
  });
}

/** Posts by day ("YYYY-MM-DD" → posts). Dates may carry a time ("2026-12-01T10:00"); undated posts are left out. */
export function byDay<T extends { publish_date: string | null }>(posts: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const p of posts) {
    const day = p.publish_date?.slice(0, 10);
    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
    const list = map.get(day);
    if (list) list.push(p);
    else map.set(day, [p]);
  }
  return map;
}

/**
 * Where a post stands for the client: waiting for them, approved by them, sent back by them,
 * or already scheduled / published.
 */
export type ClientState = "waiting" | "approved" | "changes" | "scheduled" | "published";

export function clientState(p: {
  status: string;
  client_review: { status: "approved" | "changes_requested" } | null;
}): ClientState {
  if (p.status === "published") return "published";
  if (p.client_review?.status === "changes_requested") return "changes";
  if (p.status === "scheduled" || p.status === "publishing") return "scheduled";
  if (p.client_review?.status === "approved") return "approved";
  return "waiting";
}

/** The month to open first: the current one if it has posts, else the next month with a post, else the current one. */
export function startMonth(days: string[], today: string): Month {
  const current = today.slice(0, 7);
  const sorted = [...days].sort();
  if (sorted.some((d) => d.startsWith(current))) return monthOf(today);
  const next = sorted.find((d) => d > today);
  return monthOf(next ?? today);
}
