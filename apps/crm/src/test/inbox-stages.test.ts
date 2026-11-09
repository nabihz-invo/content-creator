import { describe, expect, it } from "vitest";
import { FLOW_STAGES, parseInboxStage } from "@/features/inbox/stages";

describe("inbox stages", () => {
  it("keeps the six stages in flow order", () => {
    expect(FLOW_STAGES).toEqual(["new", "content", "media", "declined", "ready", "published"]);
  });

  it("reads a stage from the address", () => {
    expect(parseInboxStage("declined")).toBe("declined");
    expect(parseInboxStage("cancelled")).toBe("cancelled");
  });

  it("ignores anything else", () => {
    expect(parseInboxStage("nope")).toBeNull();
    expect(parseInboxStage(null)).toBeNull();
  });
});
