import { describe, expect, it } from "vitest";
import {
  NON_TERMINAL_STATUSES,
  PROJECT_STATUSES,
  STATUS_STAGE,
  TRANSITIONS,
  canTransition,
  isProjectStatus,
} from "../src/status.ts";

describe("project status machine", () => {
  it("allows the full happy path", () => {
    const path = [
      "new",
      "analyzing",
      "awaiting_answers",
      "validating_answers",
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
    ] as const;
    for (let i = 1; i < path.length; i++) {
      expect(canTransition(path[i - 1]!, path[i]!), `${path[i - 1]} -> ${path[i]}`).toBe(true);
    }
  });

  it.each([
    ["new", "script_in_review"],
    ["awaiting_answers", "generating_script"],
    ["script_in_review", "rendering"],
    ["creative_in_review", "ready_to_publish"],
    ["rendering", "published"],
    ["published", "cancelled"],
    ["cancelled", "new"],
    ["published", "failed"],
    ["failed", "published"],
  ] as const)("rejects %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it("lets every non-terminal status fail or be cancelled", () => {
    for (const s of NON_TERMINAL_STATUSES) {
      expect(canTransition(s, "cancelled")).toBe(true);
      if (s !== "failed") expect(canTransition(s, "failed")).toBe(true);
    }
  });

  it("has no duplicate transitions and only known statuses", () => {
    const keys = TRANSITIONS.map((x) => `${x.from}>${x.to}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const x of TRANSITIONS) {
      expect(isProjectStatus(x.from)).toBe(true);
      expect(isProjectStatus(x.to)).toBe(true);
    }
  });

  it("maps every status to a stage entry", () => {
    for (const s of PROJECT_STATUSES) expect(s in STATUS_STAGE).toBe(true);
  });
});
