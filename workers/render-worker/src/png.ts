/**
 * Minimal PNG reader for render validation (no native dependencies): header
 * info, and full decoding of 8-bit, non-interlaced grey/RGB/RGBA images — what
 * Chromium screenshots produce.
 */
import { inflateSync } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 4: 2, 6: 4 };

export interface PngInfo {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
  interlace: number;
}

export interface PngImage extends PngInfo {
  channels: number;
  /** Unfiltered scanlines, `width * channels` bytes per row. */
  data: Buffer;
}

function chunks(buf: Buffer) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG file");
  const out: { type: string; data: Buffer }[] = [];
  let off = 8;
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("latin1", off + 4, off + 8);
    if (off + 12 + len > buf.length) throw new Error(`truncated PNG chunk ${type}`);
    out.push({ type, data: buf.subarray(off + 8, off + 8 + len) });
    off += 12 + len;
    if (type === "IEND") break;
  }
  if (out[0]?.type !== "IHDR") throw new Error("PNG has no IHDR");
  if (out.at(-1)?.type !== "IEND") throw new Error("PNG is truncated (no IEND)");
  return out;
}

export function readPngInfo(buf: Buffer): PngInfo {
  const ihdr = chunks(buf)[0]!.data;
  return {
    width: ihdr.readUInt32BE(0),
    height: ihdr.readUInt32BE(4),
    bitDepth: ihdr[8]!,
    colorType: ihdr[9]!,
    interlace: ihdr[12]!,
  };
}

export function decodePng(buf: Buffer): PngImage {
  const all = chunks(buf);
  const info = readPngInfo(buf);
  const channels = CHANNELS[info.colorType];
  if (info.bitDepth !== 8 || !channels || info.interlace !== 0)
    throw new Error(
      `unsupported PNG (bit depth ${info.bitDepth}, colour type ${info.colorType}, interlace ${info.interlace})`,
    );
  const raw = inflateSync(Buffer.concat(all.filter((c) => c.type === "IDAT").map((c) => c.data)));
  const stride = info.width * channels;
  if (raw.length !== (stride + 1) * info.height)
    throw new Error("PNG image data has the wrong size");
  const data = Buffer.alloc(stride * info.height);
  for (let y = 0; y < info.height; y++) {
    const filter = raw[y * (stride + 1)]!;
    const src = y * (stride + 1) + 1;
    const row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? data[row + x - channels]! : 0;
      const b = y > 0 ? data[row - stride + x]! : 0;
      const c = x >= channels && y > 0 ? data[row - stride + x - channels]! : 0;
      let v = raw[src + x]!;
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error(`bad PNG filter ${filter}`);
      data[row + x] = v & 0xff;
    }
  }
  return { ...info, channels, data };
}

/** Mean and standard deviation of luma, sampled on a grid (a blank frame has ~0 deviation). */
export function lumaStats(img: PngImage, samples = 40_000): { mean: number; stddev: number } {
  const step = Math.max(1, Math.floor(Math.sqrt((img.width * img.height) / samples)));
  let n = 0;
  let sum = 0;
  let sq = 0;
  for (let y = 0; y < img.height; y += step) {
    for (let x = 0; x < img.width; x += step) {
      const i = (y * img.width + x) * img.channels;
      const l =
        img.channels >= 3
          ? 0.2126 * img.data[i]! + 0.7152 * img.data[i + 1]! + 0.0722 * img.data[i + 2]!
          : img.data[i]!;
      n++;
      sum += l;
      sq += l * l;
    }
  }
  const mean = sum / n;
  return { mean, stddev: Math.sqrt(Math.max(0, sq / n - mean * mean)) };
}
