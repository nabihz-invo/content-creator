import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarMonth, shortTitle } from "@/features/calendar/CalendarMonth";
import { todayIso } from "@/features/calendar/calendar";
import { I18nProvider } from "@/lib/i18n";

describe("CalendarMonth", () => {
  it("puts each post on its day and opens it on click", async () => {
    const day = `${todayIso().slice(0, 8)}15`;
    const onOpen = vi.fn();
    const posts = [
      { id: "a", title: "IDEA-155 · The manager who gets every call", publish_date: day },
      { id: "b", title: "Undated", publish_date: null },
    ];
    render(
      <I18nProvider defaultLocale="en">
        <CalendarMonth posts={posts} dot={() => "bg-warning"} onOpen={onOpen} />
      </I18nProvider>,
    );
    const cal = screen.getByTestId("calendar");
    // shown in the grid (wide screens) and the day list (phones); the plan ID is left out
    const chips = within(cal).getAllByRole("button", { name: "The manager who gets every call" });
    expect(chips.length).toBeGreaterThan(0);
    expect(within(cal).queryByText("Undated")).toBeNull();
    await userEvent.click(chips[0]!);
    expect(onOpen).toHaveBeenCalledWith(posts[0]);
  });

  it("keeps titles without a plan ID", () => {
    expect(shortTitle("Peace of mind is a feature")).toBe("Peace of mind is a feature");
    expect(shortTitle("STK-06 · 3 warehouses")).toBe("3 warehouses");
  });
});
