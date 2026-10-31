import assert from "node:assert/strict";
import { test } from "node:test";
import { decodePng, lumaStats, readPngInfo } from "../src/png.ts";
import { makePng } from "./png-fixture.ts";

const gradient = (x: number, y: number): [number, number, number] => [x * 8, y * 8, (x + y) * 4];

test("reads the header and decodes every filter type the fixture writes", () => {
  for (const filter of [0, 1, 2] as const) {
    const img = decodePng(makePng(20, 10, gradient, filter));
    assert.deepEqual([img.width, img.height, img.channels], [20, 10, 3]);
    assert.deepEqual(
      [...img.data.subarray((5 * 20 + 7) * 3, (5 * 20 + 7) * 3 + 3)],
      gradient(7, 5),
    );
  }
  assert.deepEqual(readPngInfo(makePng(3, 2, gradient)).width, 3);
});

test("rejects files that are not complete PNGs", () => {
  assert.throws(() => readPngInfo(Buffer.from("GIF89a")), /not a PNG/);
  const png = makePng(4, 4, gradient);
  assert.throws(() => decodePng(png.subarray(0, png.length - 12)), /truncated|IEND/);
});

test("luma deviation tells a blank frame from a real one", () => {
  const blank = lumaStats(decodePng(makePng(64, 64, () => [240, 240, 240])));
  const busy = lumaStats(decodePng(makePng(64, 64, (x) => (x < 32 ? [0, 0, 0] : [255, 255, 255]))));
  assert.equal(blank.stddev, 0);
  assert.ok(busy.stddev > 100);
});
