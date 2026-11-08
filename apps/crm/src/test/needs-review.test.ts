import { describe, expect, it } from "vitest";
import { needsReview } from "@/features/ideas/needs-review";

describe("needsReview", () => {
  it("keeps an idea nobody has acted on", () => {
    expect(needsReview({ idea_comments: [], review: null })).toBe(true);
  });

  it("hides an idea while a note waits for the agent", () => {
    expect(
      needsReview({ idea_comments: [{ status: "addressed" }, { status: "open" }], review: null }),
    ).toBe(false);
  });

  it("brings an idea back once its notes are answered", () => {
    expect(needsReview({ idea_comments: [{ status: "addressed" }], review: null })).toBe(true);
  });

  it("hides a finished post that was approved or sent back", () => {
    expect(needsReview({ idea_comments: [], review: { status: "approved" } })).toBe(false);
    expect(needsReview({ idea_comments: [], review: { status: "changes_requested" } })).toBe(false);
  });
});
