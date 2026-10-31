/** Validation of rendered files before they are recorded (ADR-0008 §4). */
import { createHash } from "node:crypto";
import { decodePng, lumaStats } from "./png.ts";

export interface RenderedFile {
  name: string;
  slideIndex: number | null;
  png: Buffer;
}

export interface CheckedFile extends RenderedFile {
  width: number;
  height: number;
  checksum: string;
  luma: { mean: number; stddev: number };
}

export interface Expectation {
  outputType: "png" | "carousel";
  width: number;
  height: number;
  /** Carousel: number of slides the creative has. */
  slides?: number;
  maxBytes: number;
  /** Minimum luma standard deviation; below it the frame is treated as blank. */
  minStddev: number;
}

export function validateRender(
  files: RenderedFile[],
  exp: Expectation,
): { ok: boolean; errors: string[]; files: CheckedFile[] } {
  const errors: string[] = [];
  const checked: CheckedFile[] = [];
  for (const f of files) {
    let img;
    try {
      img = decodePng(f.png);
    } catch (e) {
      errors.push(`${f.name}: ${(e as Error).message}`);
      continue;
    }
    if (img.width !== exp.width || img.height !== exp.height)
      errors.push(`${f.name}: ${img.width}×${img.height}, expected ${exp.width}×${exp.height}`);
    if (f.png.length > exp.maxBytes)
      errors.push(`${f.name}: ${f.png.length} bytes is over the ${exp.maxBytes}-byte limit`);
    const luma = lumaStats(img);
    if (luma.stddev < exp.minStddev)
      errors.push(`${f.name}: looks blank (luma deviation ${luma.stddev.toFixed(2)})`);
    checked.push({
      ...f,
      width: img.width,
      height: img.height,
      checksum: createHash("sha256").update(f.png).digest("hex"),
      luma,
    });
  }
  if (exp.outputType === "png" && files.length !== 1)
    errors.push(`expected one image, got ${files.length}`);
  if (exp.outputType === "carousel") {
    const order = files.map((f) => f.slideIndex);
    if (order.some((n, i) => n !== i + 1))
      errors.push(`slides are out of order: ${order.join(",")}`);
    if (exp.slides !== undefined && files.length !== exp.slides)
      errors.push(`${files.length} slides rendered, the creative has ${exp.slides}`);
    const sums = new Set(checked.map((c) => c.checksum));
    if (sums.size < checked.length) errors.push("two slides are identical");
  }
  return { ok: errors.length === 0, errors, files: checked };
}
