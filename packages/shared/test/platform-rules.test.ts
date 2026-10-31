import { describe, expect, it } from "vitest";
import { checkPublishPackage, hashtagCount } from "../src/platform-rules.ts";

const slide = { width: 1080, height: 1350, mime_type: "image/png", file_size: 900_000 };

describe("checkPublishPackage", () => {
  it("accepts a normal Instagram carousel", () => {
    expect(
      checkPublishPackage({
        platform: "instagram",
        output_type: "carousel",
        items: [slide, slide, slide],
        caption: "Winter offer",
        hashtags: ["#coffee", "#قهوة"],
      }),
    ).toEqual([]);
  });

  it("flags aspect ratio, item count, caption length, hashtags, link and unsupported outputs", () => {
    const msgs = (input: Parameters<typeof checkPublishPackage>[0]) =>
      checkPublishPackage(input)
        .map((i) => `${i.field}: ${i.message}`)
        .join(" | ");
    expect(
      msgs({
        platform: "instagram",
        output_type: "png",
        items: [{ ...slide, height: 1920 }],
        caption: "",
        hashtags: [],
      }),
    ).toMatch(/1080×1920/);
    expect(
      msgs({
        platform: "x",
        output_type: "carousel",
        items: Array(5).fill({ ...slide, height: 1080 }),
        caption: "",
        hashtags: [],
      }),
    ).toMatch(/2–4 images/);
    expect(
      msgs({
        platform: "x",
        output_type: "png",
        items: [{ ...slide, height: 1080 }],
        caption: "a".repeat(300),
        hashtags: [],
      }),
    ).toMatch(/allows 280/);
    expect(
      msgs({
        platform: "threads",
        output_type: "png",
        items: [{ ...slide, height: 1080 }],
        caption: "#a #b",
        hashtags: [],
      }),
    ).toMatch(/at most 1 hashtags/);
    expect(
      msgs({
        platform: "instagram",
        output_type: "png",
        items: [slide],
        caption: "",
        hashtags: ["no-hash"],
      }),
    ).toMatch(/#word/);
    expect(
      msgs({
        platform: "instagram",
        output_type: "png",
        items: [slide],
        caption: "",
        hashtags: [],
        link: "http://x",
      }),
    ).toMatch(/https/);
    expect(
      msgs({ platform: "youtube", output_type: "png", items: [slide], caption: "", hashtags: [] }),
    ).toMatch(/does not take png/);
    expect(
      msgs({ platform: "myspace", output_type: "png", items: [slide], caption: "", hashtags: [] }),
    ).toMatch(/unsupported platform/);
  });

  it("counts hashtags in the caption", () => {
    expect(hashtagCount("Hello #one and #اثنان", ["#three"])).toBe(3);
  });
});
