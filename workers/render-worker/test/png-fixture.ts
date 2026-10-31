import { deflateSync } from "node:zlib";

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (b: Buffer) => {
  let c = 0xffffffff;
  for (const x of b) c = CRC[(c ^ x) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, data: Buffer) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

/** RGB PNG; `pixel(x, y)` returns [r, g, b]; rows use filter `filter` (0–4, encoded naively as 0 but tagged per row is not needed). */
export function makePng(
  width: number,
  height: number,
  pixel: (x: number, y: number) => [number, number, number],
  filter: 0 | 1 | 2 = 0,
): Buffer {
  const stride = width * 3;
  const rows: Buffer[] = [];
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(stride);
    for (let x = 0; x < width; x++) row.set(pixel(x, y), x * 3);
    const out = Buffer.alloc(stride + 1);
    out[0] = filter;
    for (let i = 0; i < stride; i++) {
      const a = i >= 3 ? row[i - 3]! : 0;
      const b = prev[i]!;
      out[i + 1] = (row[i]! - (filter === 1 ? a : filter === 2 ? b : 0)) & 0xff;
    }
    rows.push(out);
    prev = row;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
