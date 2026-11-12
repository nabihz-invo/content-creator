import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { addMonths, byDay, monthGrid, startMonth, todayIso, type Month } from "./calendar";

export interface CalendarItem {
  id: string;
  title: string;
  publish_date: string | null;
}

/** Titles start with the plan ID ("IDEA-155 · The manager…"); the chip shows the part after it. */
export function shortTitle(title: string) {
  const i = title.indexOf(" · ");
  return i > 0 && i < 20 ? title.slice(i + 3) : title;
}

/**
 * A month of posts: a 7-column grid on wide screens, a list of the days with posts on phones.
 * `dot(p)` colours each post by its state; `onOpen` opens it.
 */
export function CalendarMonth<T extends CalendarItem>({
  posts,
  dot,
  onOpen,
  legend,
}: {
  posts: T[];
  dot: (p: T) => string;
  onOpen: (p: T) => void;
  legend?: ReactNode;
}) {
  const { t, locale, dir } = useI18n();
  const today = todayIso();
  const days = useMemo(() => byDay(posts), [posts]);
  const [month, setMonth] = useState<Month>(() => startMonth([...days.keys()], today));
  const grid = monthGrid(month);
  const intl = locale === "ar" ? "ar" : "en";
  const title = new Intl.DateTimeFormat(intl, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(month.year, month.month, 1)));
  const weekdays = grid
    .slice(0, 7)
    .map((d) =>
      new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "UTC" }).format(new Date(d.iso)),
    );
  const dayLabel = (iso: string) =>
    new Intl.DateTimeFormat(intl, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(iso));
  const inMonth = grid.filter((d) => d.inMonth && days.has(d.iso));
  const Prev = dir === "rtl" ? ChevronRight : ChevronLeft;
  const Next = dir === "rtl" ? ChevronLeft : ChevronRight;

  const chip = (p: T, compact: boolean) => (
    <button
      key={p.id}
      type="button"
      onClick={() => onOpen(p)}
      title={p.title}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-md text-start transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        compact ? "px-1.5 py-1 text-[11px] leading-tight" : "border bg-card px-3 py-2.5 text-sm",
      )}
    >
      <span className={cn("shrink-0 rounded-full", compact ? "size-2" : "size-2.5", dot(p))} />
      <span className={cn("min-w-0 flex-1", compact ? "line-clamp-2" : "truncate")} dir="auto">
        {shortTitle(p.title)}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4" data-testid="calendar">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="min-w-40 text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("calendar.prev")}
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <Prev />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(startMonth([], today))}>
            {t("calendar.today")}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("calendar.next")}
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <Next />
          </Button>
        </div>
        {legend && (
          <div className="ms-auto flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {legend}
          </div>
        )}
      </div>

      {/* Wide screens: the month grid */}
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <div className="grid grid-cols-7 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
          {weekdays.map((w) => (
            <div key={w} className="px-2 py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const list = days.get(d.iso) ?? [];
            return (
              <div
                key={d.iso}
                className={cn(
                  "flex min-h-28 flex-col gap-0.5 border-b p-1",
                  i % 7 !== 6 && "border-e",
                  i >= grid.length - 7 && "border-b-0",
                  !d.inMonth && "bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "mb-0.5 grid size-6 place-items-center rounded-full text-xs tabular-nums",
                    d.inMonth ? "text-foreground" : "text-muted-foreground/60",
                    d.iso === today && "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {Number(d.iso.slice(8))}
                </span>
                {list.map((p) => chip(p, true))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Phones: the days that have posts */}
      <div className="flex flex-col gap-4 md:hidden">
        {inMonth.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            {t("calendar.emptyMonth")}
          </p>
        ) : (
          inMonth.map((d) => (
            <section key={d.iso} className="flex flex-col gap-2">
              <h3 className={cn("text-sm font-medium", d.iso === today && "text-primary")}>
                {dayLabel(d.iso)}
              </h3>
              {(days.get(d.iso) ?? []).map((p) => chip(p, false))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

export function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  );
}
