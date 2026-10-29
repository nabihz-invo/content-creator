import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  contentHash,
  dedupeHash,
  normalizeIdeaText,
  normalizeUrl,
  sha256Hex,
} from "../src/hash.ts";

describe("hashing", () => {
  it("canonical JSON ignores key order and undefined", () => {
    expect(canonicalJson({ b: 1, a: { d: [1, { z: 1, y: 2 }], c: undefined } })).toBe(
      '{"a":{"d":[1,{"y":2,"z":1}]},"b":1}',
    );
  });

  it("content hash is stable across key order", async () => {
    expect(await contentHash({ a: 1, b: [1, 2] })).toBe(await contentHash({ b: [1, 2], a: 1 }));
    expect(await contentHash({ a: 1 })).not.toBe(await contentHash({ a: 2 }));
  });

  it("sha256 matches a known vector", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("rejects non-finite numbers", () => {
    expect(() => canonicalJson({ a: NaN })).toThrow();
  });

  it("normalizes Arabic and whitespace for dedupe", () => {
    expect(normalizeIdeaText("  مَرْحَبًا   بالعالم ")).toBe("مرحبا بالعالم");
    expect(normalizeIdeaText("Hello\n  WORLD")).toBe("hello world");
  });

  it("normalizes URLs", () => {
    expect(normalizeUrl("https://Example.com/a/?utm_source=x&id=2#top")).toBe(
      "https://example.com/a?id=2",
    );
  });

  it("dedupe hash treats equivalent ideas as equal", async () => {
    expect(await dedupeHash("Hello  World", "https://x.com/p?utm_medium=a")).toBe(
      await dedupeHash("hello world", "https://X.com/p"),
    );
  });
});
