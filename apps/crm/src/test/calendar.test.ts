import { describe, expect, it } from "vitest";
import { addMonths, byDay, clientState, monthGrid, startMonth } from "@/features/calendar/calendar";

describe("publishing calendar", () => {
  it("lays a month out in whole weeks from Monday", () => {
    // November 2026 starts on a Sunday and has 30 days
    const grid = monthGrid({ year: 2026, month: 10 });
    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual({ iso: "2026-10-26", inMonth: false });
    expect(grid[6]).toEqual({ iso: "2026-11-01", inMonth: true });
    expect(grid.filter((d) => d.inMonth)).toHaveLength(30);
    expect(grid.at(-1)).toEqual({ iso: "2026-12-06", inMonth: false });
    // February 2027 starts on a Monday: four weeks exactly
    expect(monthGrid({ year: 2027, month: 1 })).toHaveLength(28);
  });

  it("steps across years", () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(addMonths({ year: 2027, month: 0 }, -1)).toEqual({ year: 2026, month: 11 });
  });

  it("groups posts by day and skips undated ones", () => {
    const map = byDay([
      { id: "a", publish_date: "2026-12-01" },
      { id: "b", publish_date: "2026-12-01T09:30:00" },
      { id: "c", publish_date: null },
      { id: "d", publish_date: "soon" },
    ]);
    expect([...map.keys()]).toEqual(["2026-12-01"]);
    expect(map.get("2026-12-01")!.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("says where a post stands for the client", () => {
    expect(clientState({ status: "ready_to_publish", client_review: null })).toBe("waiting");
    expect(clientState({ status: "ready_to_publish", client_review: { status: "approved" } })).toBe(
      "approved",
    );
    expect(clientState({ status: "new", client_review: { status: "changes_requested" } })).toBe(
      "changes",
    );
    expect(clientState({ status: "scheduled", client_review: null })).toBe("scheduled");
    expect(clientState({ status: "published", client_review: { status: "approved" } })).toBe(
      "published",
    );
  });

  it("opens on this month, or the next month with posts", () => {
    expect(startMonth(["2026-11-20"], "2026-11-12")).toEqual({ year: 2026, month: 10 });
    expect(startMonth(["2027-01-05", "2026-10-01"], "2026-11-12")).toEqual({
      year: 2027,
      month: 0,
    });
    expect(startMonth([], "2026-11-12")).toEqual({ year: 2026, month: 10 });
  });
});
