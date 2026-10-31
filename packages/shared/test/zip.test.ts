import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { crc32, createZip } from "../src/zip.ts";

const enc = new TextEncoder();

describe("createZip", () => {
  it("writes an archive that unzip verifies and extracts byte for byte", () => {
    const png = new Uint8Array(5000).map((_, i) => (i * 31) & 255);
    const zip = createZip([
      { name: "01-slide-01.png", data: png },
      { name: "caption.txt", data: enc.encode("مرحبا — hello\n") },
    ]);
    const dir = mkdtempSync(join(tmpdir(), "zip-"));
    writeFileSync(join(dir, "b.zip"), zip);
    expect(execFileSync("unzip", ["-t", join(dir, "b.zip")]).toString()).toMatch(
      /No errors detected/,
    );
    execFileSync("unzip", ["-q", join(dir, "b.zip"), "-d", join(dir, "out")]);
    expect(new Uint8Array(readFileSync(join(dir, "out", "01-slide-01.png")))).toEqual(png);
    expect(readFileSync(join(dir, "out", "caption.txt"), "utf8")).toBe("مرحبا — hello\n");
  });

  it("is deterministic and refuses unsafe names", () => {
    const a = createZip([{ name: "a.txt", data: enc.encode("x") }]);
    expect(createZip([{ name: "a.txt", data: enc.encode("x") }])).toEqual(a);
    expect(() => createZip([{ name: "../evil", data: enc.encode("") }])).toThrow(/bad/);
    expect(() =>
      createZip([
        { name: "a", data: enc.encode("") },
        { name: "a", data: enc.encode("") },
      ]),
    ).toThrow(/duplicate/);
  });

  it("computes the standard CRC-32", () => {
    expect(crc32(enc.encode("123456789"))).toBe(0xcbf43926);
  });
});
