// Map a flat W x H element onto 4 corner points (e.g. a phone/tablet screen in a photo).
// Prints a CSS transform: matrix3d(...). Use on an element with transform-origin:0 0; position:absolute; left:0; top:0.
//
// Usage:
//   node studio/post/screen-map.mjs <W> <H> x1,y1 x2,y2 x3,y3 x4,y4 [--scale s --left L --top T]
// Corners in order: top-left, top-right, bottom-right, bottom-left.
// Corners are SOURCE-IMAGE pixels; --scale/--left/--top describe how the <img> is placed in the post
// (img width = natural width * scale, at left L / top T). They default to 1 / 0 / 0.
const a = process.argv.slice(2);
const opt = { scale: 1, left: 0, top: 0 };
const pts = [];
for (let i = 0; i < a.length; i++) {
  if (a[i].startsWith('--')) { opt[a[i].slice(2)] = Number(a[++i]); continue; }
  if (a[i].includes(',')) pts.push(a[i].split(',').map(Number));
}
const W = Number(a[0]), H = Number(a[1]);
if (pts.length !== 4 || !W || !H) { console.error('Usage: node studio/post/screen-map.mjs W H x1,y1 x2,y2 x3,y3 x4,y4 [--scale s --left L --top T]'); process.exit(1); }
const dst = pts.map(([x, y]) => [x * opt.scale + opt.left, y * opt.scale + opt.top]);
const src = [[0, 0], [W, 0], [W, H], [0, H]];
const A = [], b = [];
src.forEach(([x, y], i) => {
  const [u, v] = dst[i];
  A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
  A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
});
// Gaussian elimination
const n = 8; const M = A.map((r, i) => [...r, b[i]]);
for (let c = 0; c < n; c++) {
  let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
  [M[c], M[p]] = [M[p], M[c]];
  for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
}
const [h0, h1, h2, h3, h4, h5, h6, h7] = M.map((r, i) => r[n] / r[i]);
const m = [h0, h3, 0, h6, h1, h4, 0, h7, 0, 0, 1, 0, h2, h5, 0, 1];
console.log(`transform:matrix3d(${m.map(v => +v.toFixed(6)).join(',')})`);
console.log('quad in post px:', dst.map(p => p.map(v => Math.round(v)).join(',')).join('  '));
