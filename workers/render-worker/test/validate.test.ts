import assert from "node:assert/strict";
import { test } from "node:test";
import { validateRender } from "../src/validate.ts";
import { makePng } from "./png-fixture.ts";

const art =
  (seed: number) =>
  (x: number, y: number): [number, number, number] => [(x * seed) & 255, y * 4, 128];
const exp = { width: 40, height: 50, maxBytes: 1_000_000, minStddev: 2 };

test("a correct carousel passes and gets checksums", () => {
  const files = [1, 2, 3].map((i) => ({
    name: `slide-0${i}`,
    slideIndex: i,
    png: makePng(40, 50, art(i + 2)),
  }));
  const r = validateRender(files, { ...exp, outputType: "carousel", slides: 3 });
  assert.deepEqual(r.errors, []);
  assert.match(r.files[0]!.checksum, /^[0-9a-f]{64}$/);
});

test("wrong size, blank frames, missing or duplicate slides and oversize files are rejected", () => {
  const ok = (i: number) => ({
    name: `slide-0${i}`,
    slideIndex: i,
    png: makePng(40, 50, art(i + 2)),
  });
  const errs = (files: Parameters<typeof validateRender>[0], extra = {}) =>
    validateRender(files, { ...exp, outputType: "carousel", slides: 2, ...extra }).errors.join(
      " | ",
    );
  assert.match(
    errs([ok(1), { name: "slide-02", slideIndex: 2, png: makePng(40, 49, art(5)) }]),
    /40×49, expected 40×50/,
  );
  assert.match(
    errs([ok(1), { name: "slide-02", slideIndex: 2, png: makePng(40, 50, () => [9, 9, 9]) }]),
    /looks blank/,
  );
  assert.match(errs([ok(1)]), /1 slides rendered, the creative has 2/);
  assert.match(errs([ok(2), ok(1)]), /out of order/);
  assert.match(errs([ok(1), { ...ok(1), slideIndex: 2, name: "slide-02" }]), /identical/);
  assert.match(errs([ok(1), ok(2)], { maxBytes: 100 }), /over the 100-byte limit/);
  assert.match(
    validateRender([{ name: "post", slideIndex: null, png: Buffer.from("nope") }], {
      ...exp,
      outputType: "png",
    }).errors.join(),
    /not a PNG/,
  );
});
