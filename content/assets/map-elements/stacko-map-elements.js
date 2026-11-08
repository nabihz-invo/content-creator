/*!
 * Stacko Map Elements — isometric SVG sprites for the Stacko live map.
 * Same projection as the live-map prototype: screen = ((x − y)·cos30°, (x + y)·sin30° − z).
 * Usage:  const svg = StackoMap.render('warehouse', { size: 'm', accent: '#0895A6', text: 'stacko' });
 *         StackoMap.list()  → every element id, name, category and its variants.
 * Every rendered SVG carries data-anchor-x / data-anchor-y: the pixel where the element's
 * footprint centre touches the ground — use it as the Leaflet iconAnchor.
 * 1 unit ≈ 0.3 m. No external dependencies. Works in the browser and in Node.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.StackoMap = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ colours */
  const C = {
    navy: '#0E2440', night: '#1B416B', ocean: '#2F86B8', dolphin: '#79C0DE', signal: '#0895A6', glow: '#2EF2EE',
    deep: '#2C5974', visor: '#C9D8E4', foam: '#EEF6F9', paper: '#F4F8FA', white: '#FFFFFF',
    kraft: '#CDA672', kraftL: '#E6CB9E', kraftD: '#B58E5A', wood: '#B8925F', woodD: '#9A7A52',
    concrete: '#D3DEE7', concreteD: '#AEBDCA', asphalt: '#4C6684', asphaltD: '#3E566F',
    grass: '#4FAE95', grassL: '#86D3B9', grassD: '#3B8E78', olive: '#8DA88A', oliveD: '#6E8C6B',
    glass: '#BCE5E0', glassD: '#8FC9D6', rust: '#A65A4A', sand: '#D9C49A', grey: '#8A9BAA', greyD: '#6B7C8C',
    tire: '#232C38', steel: '#9AA9B6', water: '#BFE0EA', waterD: '#9CCBDA', classic: '#D2A646', skin: '#C99A78',
  };
  const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const toHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  const lighten = (c, t) => mix(c, '#FFFFFF', t);
  const darken = (c, t) => mix(c, '#0B1A2E', t);
  const shades = c => [lighten(c, 0.22), c, darken(c, 0.2)]; // top, left (+y), right (+x)
  function shadeN(n, base) { // world normal → shaded colour
    const s = shades(base), w = [Math.max(n[2], 0), Math.max(n[1], 0), Math.max(n[0], 0)];
    const t = w[0] + w[1] + w[2] || 1, rgb = [0, 0, 0];
    s.forEach((c, i) => { const v = hex(c); for (let k = 0; k < 3; k++) rgb[k] += v[k] * w[i] / t; });
    return toHex(...rgb);
  }
  const f2 = n => (Math.round(n * 100) / 100).toString();
  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  /* ------------------------------------------------------------------ engine */
  const COS = 0.8660254, SIN = 0.5, V = [1, 1, 1];
  class Iso {
    constructor() { this.out = []; this.defs = []; this.b = [Infinity, Infinity, -Infinity, -Infinity]; this.st = [{ x: 0, y: 0, z: 0, s: false }]; this.anchor = [0, 0]; this.uid = 0; this.tag = Math.random().toString(36).slice(2, 7); }
    get t() { return this.st[this.st.length - 1]; }
    /** run fn inside a local frame offset by (x,y,z); swap=true turns the object 90° (x↔y) */
    at(x, y, z, swap, fn) { const p = this.w(x, y, z), t = this.t; this.st.push({ x: p[0], y: p[1], z: p[2], s: t.s !== !!swap }); fn(); this.st.pop(); return this; }
    w(x, y, z = 0) { const t = this.t; return t.s ? [t.x + y, t.y + x, t.z + z] : [t.x + x, t.y + y, t.z + z]; }
    wn(n) { return this.t.s ? [n[1], n[0], n[2]] : n; }
    pw(X, Y, Z) { const sx = (X - Y) * COS, sy = (X + Y) * SIN - Z, b = this.b; if (sx < b[0]) b[0] = sx; if (sy < b[1]) b[1] = sy; if (sx > b[2]) b[2] = sx; if (sy > b[3]) b[3] = sy; return [sx, sy]; }
    P(x, y, z = 0) { return this.pw(...this.w(x, y, z)); }
    pts(list, world) { return list.map(q => (world ? this.pw(...q) : this.P(...q)).map(f2).join(',')).join(' '); }
    add(s) { this.out.push(s); return this; }
    attrs(o) { let a = ''; if (o.stroke) a += ` stroke="${o.stroke}" stroke-width="${o.sw || 0.5}" stroke-linejoin="round"`; if (o.op != null) a += ` opacity="${o.op}"`; return a; }
    poly(list, fill, o = {}) { return this.add(`<polygon points="${this.pts(list)}" fill="${fill}"${this.attrs(o)}/>`); }
    wpoly(list, fill, o = {}) { return this.add(`<polygon points="${this.pts(list, true)}" fill="${fill}"${this.attrs(o)}/>`); }
    line(a, b, col, w = 0.6, o = {}) { const p = this.P(...a), q = this.P(...b); return this.add(`<line x1="${f2(p[0])}" y1="${f2(p[1])}" x2="${f2(q[0])}" y2="${f2(q[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}/>`); }
    path(list, col, w = 0.6, o = {}) { return this.add(`<polyline points="${this.pts(list)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}/>`); }
    /** screen-space circle at a world point (trees, lights, heads) */
    dot(x, y, z, r, fill, o = {}) { const p = this.P(x, y, z); const b = this.b; b[0] = Math.min(b[0], p[0] - r); b[1] = Math.min(b[1], p[1] - r); b[2] = Math.max(b[2], p[0] + r); b[3] = Math.max(b[3], p[1] + r); return this.add(`<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${f2(r)}" fill="${fill}"${this.attrs(o)}/>`); }
    ell(x, y, z, rx, ry, fill, o = {}) { const p = this.P(x, y, z), b = this.b; b[0] = Math.min(b[0], p[0] - rx); b[1] = Math.min(b[1], p[1] - ry); b[2] = Math.max(b[2], p[0] + rx); b[3] = Math.max(b[3], p[1] + ry); return this.add(`<ellipse cx="${f2(p[0])}" cy="${f2(p[1])}" rx="${f2(rx)}" ry="${f2(ry)}" fill="${fill}"${o.rot ? ` transform="rotate(${o.rot} ${f2(p[0])} ${f2(p[1])})"` : ''}${this.attrs(o)}/>`); }
    /** ground shadow ellipse under a point */
    shadow(x, y, rx, ry, op = 0.1) { rx *= 0.8; ry *= 0.8; const p = this.P(x, y, 0); return this.add(`<ellipse cx="${f2(p[0])}" cy="${f2(p[1])}" rx="${f2(rx)}" ry="${f2(ry)}" fill="#0E2440" opacity="${op}"/>`); }
    /** axis-aligned box; c = base colour or [top, left, right] */
    box(x, y, z, w, d, h, c, o = {}) {
      const a = this.w(x, y, z), b = this.w(x + w, y + d, z + h);
      const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]), z0 = a[2], z1 = b[2];
      const f = Array.isArray(c) ? c : shades(c);
      if (!o.noLeft) this.wpoly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], f[1], o);
      if (!o.noRight) this.wpoly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], f[2], o);
      if (!o.noTop) this.wpoly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], f[0], o);
      return this;
    }
    /** draw a list of world-space faces {p:[[X,Y,Z]...], n:[nx,ny,nz], c:colour} with back-face culling and depth sort */
    solid(faces, o = {}) {
      faces.filter(f => f.n[0] + f.n[1] + f.n[2] > 1e-6)
        .map(f => ({ f, d: f.p.reduce((s, q) => s + q[0] + q[1] + q[2], 0) / f.p.length }))
        .sort((a, b) => a.d - b.d)
        .forEach(({ f }) => this.wpoly(f.p, f.c || shadeN(norm(f.n), f.base), { stroke: o.seams === false ? null : (f.c || shadeN(norm(f.n), f.base)), sw: 0.25, op: o.op }));
      return this;
    }
    /** prism: 2D profile (in the plane across `axis`) extruded from `start` for `len` along axis ('x' | 'y' | 'z') */
    prism(axis, prof, start, len, base, o = {}) {
      const L = (u, v, t) => axis === 'x' ? [t, u, v] : axis === 'y' ? [u, t, v] : [u, v, t];
      const ax = axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1];
      let A = 0; for (let i = 0; i < prof.length; i++) { const p = prof[i], q = prof[(i + 1) % prof.length]; A += p[0] * q[1] - q[0] * p[1]; }
      const sg = A >= 0 ? 1 : -1, faces = [], cols = o.cols || {};
      const W = q => this.w(...q);
      const capC = (side) => cols.cap || base;
      faces.push({ p: prof.map(([u, v]) => W(L(u, v, start + len))), n: this.wn(ax), base: capC() });
      faces.push({ p: prof.map(([u, v]) => W(L(u, v, start))).reverse(), n: this.wn(ax.map(k => -k)), base: capC() });
      for (let i = 0; i < prof.length; i++) {
        const p = prof[i], q = prof[(i + 1) % prof.length], du = q[0] - p[0], dv = q[1] - p[1];
        const n2 = [dv * sg, -du * sg], l = Math.hypot(...n2) || 1;
        const n = axis === 'x' ? [0, n2[0] / l, n2[1] / l] : axis === 'y' ? [n2[0] / l, 0, n2[1] / l] : [n2[0] / l, n2[1] / l, 0];
        faces.push({ p: [W(L(p[0], p[1], start)), W(L(q[0], q[1], start)), W(L(q[0], q[1], start + len)), W(L(p[0], p[1], start + len))], n: this.wn(n), base: (cols.sides && cols.sides[i]) || base });
      }
      return this.solid(faces, o);
    }
    /** lathe: profile [[t, r], …] (t increasing) revolved around an axis through (c1, c2) */
    lathe(axis, prof, c1, c2, base, o = {}) {
      const seg = o.seg || 20, faces = [];
      const L = (t, r, a) => { const cu = Math.cos(a) * r, sv = Math.sin(a) * r; return axis === 'x' ? [t, c1 + cu, c2 + sv] : axis === 'y' ? [c1 + cu, t, c2 + sv] : [c1 + cu, c2 + sv, t]; };
      const R = (a) => axis === 'x' ? [0, Math.cos(a), Math.sin(a)] : axis === 'y' ? [Math.cos(a), 0, Math.sin(a)] : [Math.cos(a), Math.sin(a), 0];
      const ax = axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1];
      for (let i = 0; i < prof.length - 1; i++) {
        const [t0, r0] = prof[i], [t1, r1] = prof[i + 1], dt = t1 - t0, dr = r1 - r0, l = Math.hypot(dt, dr) || 1;
        for (let j = 0; j < seg; j++) {
          const a0 = j / seg * Math.PI * 2, a1 = (j + 1) / seg * Math.PI * 2, am = (a0 + a1) / 2, rad = R(am);
          const n = [0, 1, 2].map(k => ax[k] * (-dr / l) + rad[k] * (dt / l));
          faces.push({ p: [L(t0, r0, a0), L(t0, r0, a1), L(t1, r1, a1), L(t1, r1, a0)].map(q => this.w(...q)), n: this.wn(n), base: (o.bands && o.bands[i]) || base });
        }
      }
      const capP = (t, r) => Array.from({ length: seg }, (_, j) => this.w(...L(t, r, j / seg * Math.PI * 2)));
      const first = prof[0], last = prof[prof.length - 1];
      if (o.caps !== false && last[1] > 0.01) faces.push({ p: capP(last[0], last[1]), n: this.wn(ax), base: o.capColor || base });
      if (o.caps !== false && first[1] > 0.01) faces.push({ p: capP(first[0], first[1]).reverse(), n: this.wn(ax.map(k => -k)), base: o.capColor || base });
      return this.solid(faces, o);
    }
    /** text painted on a vertical face. plane 'y' = face at local y=c (runs along x); plane 'x' = face at local x=c (runs along y) */
    faceText(plane, c, a, b, z, size, text, fill, weight = 600) {
      const m = plane === 'y' ? [(a + b) / 2, c, z] : [c, (a + b) / 2, z];
      const wpl = (plane === 'y') !== this.t.s ? 'L' : 'R';
      const p = this.P(...m), mat = wpl === 'L' ? `matrix(${COS},${SIN},0,1,${f2(p[0])},${f2(p[1])})` : `matrix(${COS},${-SIN},0,1,${f2(p[0])},${f2(p[1])})`;
      const esc = String(text).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      return this.add(`<text transform="${mat}" font-family="Readex Pro, Arial, sans-serif" font-weight="${weight}" font-size="${f2(size)}" letter-spacing="-0.03em" text-anchor="middle" dominant-baseline="central" fill="${fill}">${esc}</text>`);
    }
    /** rectangle painted on a vertical face */
    faceRect(plane, c, a0, a1, z0, z1, fill, o) { return this.poly(plane === 'y' ? [[a0, c, z0], [a1, c, z0], [a1, c, z1], [a0, c, z1]] : [[c, a0, z0], [c, a1, z0], [c, a1, z1], [c, a0, z1]], fill, o); }
    setAnchor(x, y) { this.anchor = this.P(x, y, 0); return this; }
    svg(scale = 1, pad = 3) {
      const b = this.b; if (!isFinite(b[0])) return '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
      const x = b[0] - pad, y = b[1] - pad, w = b[2] - b[0] + pad * 2, h = b[3] - b[1] + pad * 2;
      const ax = (this.anchor[0] - x) * scale, ay = (this.anchor[1] - y) * scale;
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(x)} ${f2(y)} ${f2(w)} ${f2(h)}" width="${f2(w * scale)}" height="${f2(h * scale)}" data-anchor-x="${f2(ax)}" data-anchor-y="${f2(ay)}">${this.defs.length ? '<defs>' + this.defs.join('') + '</defs>' : ''}${this.out.join('')}</svg>`;
    }
  }
  function norm(n) { const l = Math.hypot(...n) || 1; return n.map(k => k / l); }

  /* ------------------------------------------------------------------ helpers */
  const wheelY = (I, x, y, z, r, w = 1.4) => { I.lathe('y', [[y - w, r], [y, r]], x, z + r, C.tire, { seg: 18, capColor: '#1A222C' }); I.lathe('y', [[y, r * 0.5], [y + 0.15, r * 0.5]], x, z + r, C.steel, { seg: 14 }); };
  const wheelX = (I, x, y, z, r, w = 1.4) => { I.lathe('x', [[x - w, r], [x, r]], y, z + r, C.tire, { seg: 18, capColor: '#1A222C' }); I.lathe('x', [[x, r * 0.5], [x + 0.15, r * 0.5]], y, z + r, C.steel, { seg: 14 }); };
  const carton = (I, x, y, z, w = 9, d = 9, h = 7, tape = C.signal) => { I.box(x, y, z, w, d, h, [C.kraftL, C.kraft, C.kraftD]); I.line([x + w / 2, y, z + h], [x + w / 2, y + d, z + h], C.kraftD, 0.8); if (tape) I.faceRect('y', y + d, x + w * 0.28, x + w * 0.72, z + h * 0.35, z + h * 0.7, tape); };
  const pallet = (I, x, y, z = 0, w = 10, d = 10) => { I.box(x, y, z, w, d, 0.5, [C.wood, C.woodD, darken(C.woodD, .15)]); [0, w / 2 - 0.8, w - 1.6].forEach(px => I.box(x + px, y, z + 0.5, 1.6, d, 0.9, [C.wood, C.woodD, darken(C.woodD, .15)])); I.box(x, y, z + 1.4, w, d, 0.4, [C.wood, C.woodD, darken(C.woodD, .15)]); for (let i = 1; i < 5; i++) I.line([x + i * w / 5, y, z + 1.8], [x + i * w / 5, y + d, z + 1.8], C.woodD, 0.3); };
  const palletLoad = (I, x, y, levels = 2, o = {}) => { pallet(I, x, y); for (let l = 0; l < levels; l++) { carton(I, x + 0.5, y + 0.5, 1.8 + l * 6.4, 4.4, 4.4, 6.2, null); carton(I, x + 5.1, y + 0.5, 1.8 + l * 6.4, 4.4, 4.4, 6.2, null); carton(I, x + 0.5, y + 5.1, 1.8 + l * 6.4, 4.4, 4.4, 6.2, o.tape === undefined ? C.signal : o.tape); carton(I, x + 5.1, y + 5.1, 1.8 + l * 6.4, 4.4, 4.4, 6.2, o.tape === undefined ? C.signal : o.tape); } if (o.wrap) I.box(x + 0.3, y + 0.3, 1.8, 9.4, 9.4, levels * 6.4 + 0.2, ['#FFFFFF', '#EAF4F7', '#DCEAF0'], { op: 0.45 }); };
  const person = (I, x, y, o = {}) => { const shirt = o.shirt || C.signal, pants = o.pants || C.navy; I.shadow(x + 1, y + 1, 3, 1.5, 0.16); I.box(x, y, 0, 2.2, 1.4, 4.6, pants); I.box(x - 0.3, y - 0.2, 4.6, 2.8, 1.8, 4.4, shirt); if (o.vest) I.faceRect('y', y + 1.6, x - 0.1, x + 2.3, 5.6, 6.2, '#F4F8FA'); I.dot(x + 1.1, y + 0.7, 10.6, 1.55, o.skin || C.skin); if (o.helmet) I.dot(x + 1.1, y + 0.7, 11.5, 1.45, o.helmet); if (o.carry) carton(I, x - 0.6, y + 1.6, 5.4, 3.4, 3, 2.8, null); };
  const treeRound = (I, x, y, s = 1, c = C.grass, cl = C.grassL) => { I.shadow(x + 2 * s, y + 2 * s, 7 * s, 3.2 * s); I.line([x, y, 0], [x, y, 8 * s], C.deep, 1.6 * s); I.dot(x, y, 14 * s, 6.5 * s, c); I.dot(x - 1.8 * s, y, 15.5 * s, 3.4 * s, cl); };

  /* ------------------------------------------------------------------ elements */
  const E = {};
  const def = (id, name, cat, variants, draw, notes) => { E[id] = { id, name, cat, variants, draw, notes: notes || '' }; };

  // ---------- BUILDINGS ----------
  def('warehouse', 'Warehouse', 'Buildings', [
    { label: 'Medium · brand blue', o: { size: 'm' } },
    { label: 'Small · 2 doors', o: { size: 's', doors: 2 } },
    { label: 'Large · 5 doors', o: { size: 'l', doors: 5, open: 2 } },
    { label: 'White panels', o: { size: 'm', wall: '#E4ECF1', roof: '#C9D8E4', accent: C.navy } },
    { label: 'Grey industrial', o: { size: 'm', wall: C.grey, roof: C.visor, accent: C.signal } },
    { label: 'Sand / stone', o: { size: 'm', wall: '#CBB894', roof: '#E3D7BD', accent: C.navy } },
    { label: 'Navy', o: { size: 'm', wall: C.night, roof: C.ocean, accent: C.glow } },
    { label: 'Cold storage', o: { size: 'm', cold: true, wall: '#F1F6F8', roof: '#DDE8EE', accent: C.ocean } },
    { label: 'Turned 90°', o: { size: 'm', turn: true } },
  ], (I, o) => {
    const [W, D, H, R] = { s: [44, 32, 16, 7], m: [64, 44, 22, 9], l: [92, 56, 26, 11] }[o.size || 'm'];
    const wall = o.wall || C.ocean, roof = o.roof || lighten(wall, 0.38), acc = o.accent || C.navy, wf = shades(wall), rf = shades(roof);
    const doors = o.doors || 3, open = o.open == null ? 1 : o.open;
    I.at(0, 0, 0, !!o.turn, () => {
      I.box(-6, -4, 0, W + 12, D + 16, 0.6, [C.concrete, C.concreteD, '#9FB0BF']);
      I.poly([[0, 0, H], [W, 0, H], [W, D / 2, H + R], [0, D / 2, H + R]], darken(roof, 0.12));
      I.poly([[0, D, 0], [W, D, 0], [W, D, H], [0, D, H]], wf[1]);
      for (let x = 2.5; x < W; x += 2.5) I.line([x, D, 0.6], [x, D, H], lighten(wall, 0.14), 0.35);
      I.poly([[W, 0, 0], [W, D, 0], [W, D, H], [W, D / 2, H + R], [W, 0, H]], wf[2]);
      for (let y = 2.5; y < D; y += 2.5) I.line([W, y, 0.6], [W, y, y < D / 2 ? H + R * (y / (D / 2)) - 0.4 : H + R * ((D - y) / (D / 2)) - 0.4], lighten(wf[2], 0.1), 0.3);
      const dw = Math.min(10, (W - 8) / doors - 3), gap = (W - doors * dw) / (doors + 1), dh = H * 0.6;
      for (let i = 0; i < doors; i++) {
        const x0 = gap + i * (dw + gap), x1 = x0 + dw, isOpen = i >= doors - open;
        I.faceRect('y', D, x0 - 0.6, x1 + 0.6, 0, dh + 0.6, darken(wall, 0.3));
        if (isOpen) { I.faceRect('y', D, x0, x1, 0, dh, '#0B1A2E'); carton(I, x0 + 1.5, D - 6, 0, 4, 4, 3.5, null); }
        else { I.faceRect('y', D, x0, x1, 0, dh, C.visor); for (let z = 1.2; z < dh; z += 1.2) I.line([x0, D, z], [x1, D, z], '#A9B9C7', 0.3); }
        I.box(x0 - 1.4, D, 1, 0.8, 0.8, 2.4, C.navy); I.box(x1 + 0.6, D, 1, 0.8, 0.8, 2.4, C.navy);
        I.box(x0, D, 0, dw, 3.2, 1.1, [C.concreteD, '#9FB0BF', '#8C9DAD']);
        I.poly([[x0 - 1, D, dh + 1.6], [x1 + 1, D, dh + 1.6], [x1 + 1, D + 2.2, dh + 1.2], [x0 - 1, D + 2.2, dh + 1.2]], C.visor);
      }
      if (o.sign !== false) {
        const sx0 = W * 0.22, sx1 = W * 0.78, z0 = dh + 3, z1 = Math.min(H - 1, dh + 3 + H * 0.2);
        I.faceRect('y', D, sx0, sx1, z0, z1, acc);
        if (o.text) I.faceText('y', D, sx0, sx1, (z0 + z1) / 2, (z1 - z0) * 0.62, o.text, '#FFFFFF');
      }
      I.faceRect('x', W, D * 0.62, D * 0.62 + 5, 0, 8, C.visor); I.faceRect('x', W, D * 0.62 + 0.4, D * 0.62 + 4.6, 0, 7.6, lighten(C.visor, .3));
      I.faceRect('x', W, 4, D - 4, H * 0.62, H * 0.76, C.glassD);
      if (o.cold) { I.faceRect('y', D, 0, W, H * 0.92, H, C.ocean); I.faceRect('x', W, 0, D, H * 0.92, H, darken(C.ocean, .15)); }
      I.poly([[0, D / 2, H + R], [W, D / 2, H + R], [W, D + 1.6, H - 0.7], [0, D + 1.6, H - 0.7]], rf[0]);
      for (let x = 2; x < W; x += 2) I.line([x, D / 2, H + R], [x, D + 1.6, H - 0.7], lighten(roof, 0.25), 0.35);
      I.line([0, D / 2, H + R], [W, D / 2, H + R], '#FFFFFF', 0.9);
      I.poly([[W, D + 1.6, H - 0.7], [W, D / 2, H + R], [W + 0.6, D / 2, H + R], [W + 0.6, D + 1.6, H - 0.7]], darken(roof, .25));
      if (o.cold) [W * 0.25, W * 0.5, W * 0.75].forEach(x => { I.box(x - 3, D * 0.62, H + R * 0.55, 6, 5, 2.4, C.paper); I.lathe('z', [[H + R * 0.55 + 2.4, 1.6], [H + R * 0.55 + 2.5, 1.6]], x, D * 0.62 + 2.5, C.greyD, { seg: 14 }); });
      for (let i = 0; i < 3; i++) I.dot(W * (0.25 + i * 0.25), D, dh + 1.2, 0.5, '#FFF7D6');
      I.setAnchor(W / 2, D / 2);
    });
  }, 'Doors face the front-left. Use "Turned 90°" for doors facing front-right. Sign text uses the customer name.');

  def('office', 'Office building', 'Buildings', [
    { label: '3 floors · white', o: { floors: 3 } },
    { label: '2 floors', o: { floors: 2 } },
    { label: '5 floors · glass', o: { floors: 5, color: '#DCE6EE', glassy: true } },
    { label: 'Sand stone (Beirut)', o: { floors: 4, color: '#E2D3B5' } },
    { label: 'No rooftop items', o: { floors: 3, roofItems: false } },
  ], (I, o) => {
    const F = o.floors || 3, W = 30, D = 24, fh = 9.5, H = F * fh, col = o.color || C.paper;
        I.box(-3, -3, 0, W + 6, D + 6, 0.5, [C.concrete, C.concreteD, '#9FB0BF']);
    I.box(0, 0, 0, W, D, H, col);
    for (let f = 0; f < F; f++) {
      const z0 = f * fh + 2.4, z1 = z0 + fh - 4.2;
      if (o.glassy) { I.faceRect('y', D, 1, W - 1, z0 - 1, z1 + 1, C.glassD); I.faceRect('x', W, 1, D - 1, z0 - 1, z1 + 1, darken(C.glassD, .12)); continue; }
      for (let x = 2; x < W - 3; x += 6) { if (f === 0 && x > 10 && x < 18) continue; I.faceRect('y', D, x, x + 4, z0, z1, C.glassD); I.line([x + 0.6, D, z1 - 0.4], [x + 2.2, D, z0 + 0.6], '#FFFFFF', 0.4, { op: 0.6 }); }
      for (let y = 2; y < D - 3; y += 6) I.faceRect('x', W, y, y + 4, z0, z1, darken(C.glassD, .14));
      if (f > 0) { I.line([0, D, f * fh], [W, D, f * fh], darken(col, .08), 0.4); I.line([W, 0, f * fh], [W, D, f * fh], darken(col, .2), 0.4); }
    }
    I.faceRect('y', D, 11, 17, 0, 6.5, C.glassD); I.line([14, D, 0], [14, D, 6.5], C.navy, 0.4);
    I.box(9.5, D, 7, 9, 3, 0.8, o.accent || C.navy);
    I.box(0, 0, H, W, 1, 1.4, col); I.box(0, 1, H, 1, D - 1, 1.4, col); I.box(W - 1, 1, H, 1, D - 1, 1.4, col); I.box(0, D - 1, H, W, 1, 1.4, col);
    if (o.roofItems !== false) {
      [[4, 4, '#1F2A36'], [9, 4, C.paper]].forEach(([x, y, c]) => I.lathe('z', [[H, 2.2], [H + 4.6, 2.2], [H + 5.2, 1.4]], x, y, c, { seg: 16 }));
      for (let i = 0; i < 3; i++) { const x = 13 + i * 5; I.poly([[x, 6, H + 1], [x + 4, 6, H + 1], [x + 4, 14, H + 3.4], [x, 14, H + 3.4]], C.night); I.line([x + 2, 6, H + 1], [x + 2, 14, H + 3.4], C.ocean, 0.3); I.line([x, 10, H + 2.2], [x + 4, 10, H + 2.2], C.ocean, 0.3); }
      I.box(5, 14, H, 5, 4, 3, C.visor); I.lathe('y', [[18, 1.2], [18.1, 1.2]], 7.5, H + 1.5, C.greyD, { seg: 12 });
    }
    I.setAnchor(W / 2, D / 2);
  });

  def('canopy', 'Open shed / canopy', 'Buildings', [
    { label: 'With pallets', o: {} }, { label: 'Empty', o: { empty: true } }, { label: 'Navy roof', o: { roof: C.night } },
  ], (I, o) => {
    const W = 40, D = 24, H = 14, roof = o.roof || C.visor;
    I.box(0, 0, 0, W, D, 0.5, [C.concrete, C.concreteD, '#9FB0BF']);
    [[1, 1], [W - 2, 1]].forEach(([x, y]) => I.box(x, y, 0.5, 1, 1, H, C.greyD));
    if (!o.empty) { palletLoad(I, 6, 5, 2, { wrap: true }); palletLoad(I, 18, 5, 1); palletLoad(I, 6, 13, 1); palletLoad(I, 18, 13, 2); }
    [[1, D - 2], [W - 2, D - 2]].forEach(([x, y]) => I.box(x, y, 0.5, 1, 1, H, C.greyD));
    I.poly([[-1, -1, H + 2], [W + 1, -1, H + 2], [W + 1, D + 1, H], [-1, D + 1, H]], lighten(roof, .1));
    I.poly([[-1, D + 1, H], [W + 1, D + 1, H], [W + 1, D + 1, H - 0.8], [-1, D + 1, H - 0.8]], darken(roof, .15));
    I.poly([[W + 1, -1, H + 2], [W + 1, D + 1, H], [W + 1, D + 1, H - 0.8], [W + 1, -1, H + 1.2]], darken(roof, .25));
    for (let x = 3; x < W; x += 3) I.line([x, -1, H + 2], [x, D + 1, H], darken(roof, .08), 0.3);
    I.setAnchor(W / 2, D / 2);
  });

  def('gatehouse', 'Gatehouse + barrier', 'Buildings', [{ label: 'Barrier down', o: {} }, { label: 'Barrier up', o: { up: true } }], (I, o) => {
    I.box(-4, -2, 0, 36, 16, 0.4, C.asphalt); I.line([-4, 13, 0.4], [32, 13, 0.4], '#FFFFFF', 0.5, { dash: '3 3' });
    I.box(0, 0, 0, 10, 10, 0.5, [C.concrete, C.concreteD, '#9FB0BF']);
    I.box(1, 1, 0.5, 8, 8, 9, C.paper); I.faceRect('y', 9, 2, 8, 4, 7.5, C.glassD); I.faceRect('x', 9, 2, 7, 4, 7.5, darken(C.glassD, .12)); I.faceRect('x', 9, 7.2, 8.6, 0.5, 6.5, C.visor);
    I.box(0, 0, 9.5, 10, 10, 1, C.navy);
    I.box(10, 4, 0, 1.4, 1.4, 4, C.navy);
    if (o.up) { for (let i = 0; i < 6; i++) I.line([10.7, 4.7, 4 + i * 2.4], [10.7, 4.7, 4 + (i + 1) * 2.4], i % 2 ? '#FFFFFF' : C.signal, 0.9); }
    else { for (let i = 0; i < 6; i++) I.line([11.4 + i * 3, 4.7, 4], [11.4 + (i + 1) * 3, 4.7, 4], i % 2 ? '#FFFFFF' : C.signal, 0.9); }
    I.setAnchor(5, 5);
  });

  def('factory', 'Small factory', 'Buildings', [{ label: 'Sawtooth roof + chimney', o: {} }, { label: 'Sand walls', o: { wall: '#CBB894' } }], (I, o) => {
    const W = 56, D = 34, H = 16, wall = o.wall || C.visor;
    I.box(-4, -4, 0, W + 8, D + 8, 0.5, [C.concrete, C.concreteD, '#9FB0BF']);
    I.box(0, 0, 0, W, D, H, wall);
    for (let i = 0; i < 4; i++) { const x0 = i * 14; I.prism('y', [[x0, H], [x0 + 14, H], [x0, H + 7]], 0, D, lighten(wall, .2), { cols: { sides: [null, null, null] } }); I.poly([[x0, D, H], [x0, D, H + 7], [x0 + 14, D, H]], darken(wall, .05)); }
    I.faceRect('y', D, 6, 18, 0, 10, C.greyD); for (let z = 1.2; z < 10; z += 1.2) I.line([6, D, z], [18, D, z], C.grey, 0.3);
    I.faceRect('y', D, 24, 50, 7, 11, C.glassD);
    I.faceRect('x', W, 6, D - 6, 7, 11, darken(C.glassD, .12));
    I.lathe('z', [[0, 3], [36, 2.2]], W + 5, 5, '#E4ECF1', { seg: 18 });
    for (let z = 24; z < 36; z += 5) I.lathe('z', [[z, 2.5], [z + 1.2, 2.46]], W + 5, 5, C.signal, { seg: 18, caps: false });
    I.setAnchor(W / 2, D / 2);
  });

  def('silo', 'Silo / tank', 'Buildings', [{ label: 'Silo (cone top)', o: {} }, { label: 'Pair of silos', o: { pair: true } }, { label: 'Fuel tank (flat top)', o: { flat: true, color: '#E4ECF1' } }], (I, o) => {
    const one = (x, y) => { const c = o.color || C.paper; if (o.flat) { I.lathe('z', [[0, 7], [12, 7]], x, y, c, { seg: 26 }); I.lathe('z', [[3.8, 7.05], [4.6, 7.05]], x, y, C.signal, { seg: 26, caps: false }); } else { I.lathe('z', [[0, 1.5], [3, 5.5], [24, 5.5], [29, 0.6]], x, y, c, { seg: 26 }); I.lathe('z', [[14, 5.55], [15, 5.55]], x, y, C.signal, { seg: 26, caps: false }); } };
    I.box(-8, -8, 0, o.pair ? 32 : 16, 16, 0.5, [C.concrete, C.concreteD, '#9FB0BF']);
    one(0, 0); if (o.pair) one(15, 0);
    I.setAnchor(o.pair ? 7.5 : 0, 0);
  });

  def('shop', 'Shop / showroom', 'Buildings', [{ label: 'Accent awning', o: {} }, { label: 'Navy awning', o: { accent: C.navy } }], (I, o) => {
    const W = 26, D = 18, H = 12, acc = o.accent || C.signal;
    I.box(-2, -2, 0, W + 4, D + 7, 0.5, [C.concrete, C.concreteD, '#9FB0BF']);
    I.box(0, 0, 0, W, D, H, '#E9E1D0');
    I.faceRect('y', D, 1.5, W - 1.5, 0.5, 7.5, C.glassD); for (let x = 7; x < W; x += 6) I.line([x, D, 0.5], [x, D, 7.5], C.navy, 0.4);
    I.faceRect('x', W, 3, D - 3, 3, 7, darken(C.glassD, .12));
    I.poly([[0, D, 9], [W, D, 9], [W, D + 4, 7.4], [0, D + 4, 7.4]], acc); for (let x = 2; x < W; x += 4) I.poly([[x, D, 9], [x + 2, D, 9], [x + 2, D + 4, 7.4], [x, D + 4, 7.4]], '#FFFFFF', { op: 0.85 });
    I.faceRect('y', D, 6, W - 6, 9.6, 11.4, C.navy);
    if (o.text) I.faceText('y', D, 6, W - 6, 10.5, 1.4, o.text, '#FFFFFF');
    I.setAnchor(W / 2, D / 2);
  });

  // ---------- PORT ----------
  def('gantryCrane', 'Port gantry crane (STS)', 'Port & cranes', [
    { label: 'Teal', o: {} }, { label: 'Ocean blue', o: { color: C.ocean } }, { label: 'Navy', o: { color: C.night } }, { label: 'Classic (real-world)', o: { color: C.classic } }, { label: 'With container', o: { load: true } },
  ], (I, o) => {
    const c = o.color || C.signal, lg = 1.6, H = 36;
    I.shadow(7, 6, 18, 8, 0.08);
    [[0, 0], [14, 0]].forEach(([x, y]) => I.box(x, y, 0, lg, lg, H, c));
    I.box(0, 0, H, 15.6, lg, 2, c);
    I.line([1, 1, 2], [14, 1, H - 2], darken(c, .2), 0.7); I.line([14, 1, 2], [1, 1, H - 2], darken(c, .2), 0.7);
    I.box(5.6, -16, H + 4, 3, 66, 2.4, c);
    I.box(4, -14, H + 6.4, 6.4, 9, 5.5, C.paper); I.faceRect('y', -5, 5, 9.4, H + 8.5, H + 10.5, C.glassD);
    I.line([7, 4, H + 2], [7, 4, H + 18], c, 1.1); I.line([7, 4, H + 18], [7, -16, H + 6.4], darken(c, .15), 0.5); I.line([7, 4, H + 18], [7, 50, H + 6.4], darken(c, .15), 0.5); I.line([7, 4, H + 18], [7, 30, H + 6.4], darken(c, .15), 0.5);
    [[0, 10], [14, 10]].forEach(([x, y]) => I.box(x, y, 0, lg, lg, H, c));
    I.box(0, 10, H, 15.6, lg, 2, c); I.box(0, 0, H + 2, lg, 11.6, 2, c); I.box(14, 0, H + 2, lg, 11.6, 2, c);
    I.line([1, 11, 2], [14, 11, H - 2], darken(c, .1), 0.7); I.line([14, 11, 2], [1, 11, H - 2], darken(c, .1), 0.7);
    I.box(5.2, 34, H + 2.6, 3.8, 5, 1.6, C.navy);
    I.line([6, 36.5, H + 2.6], [6, 36.5, 22], C.navy, 0.3); I.line([8, 36.5, H + 2.6], [8, 36.5, 22], C.navy, 0.3);
    if (o.load) { I.box(-3, 34.5, 21, 20, 4, 0.9, C.navy); containerAt(I, -3, 32.5, 12, 20, C.ocean); } else I.box(3, 34.5, 21, 8, 4, 0.9, C.navy);
    
    [[0, 0], [14, 0], [0, 10], [14, 10]].forEach(([x, y]) => I.box(x - 0.6, y - 0.6, 0, 2.8, 2.8, 1.2, C.navy));
    I.setAnchor(7.8, 5.8);
  }, 'Boom points front-left (over the water). Place it on the quay edge.');

  def('mobileCrane', 'Mobile harbour crane', 'Port & cranes', [{ label: 'Teal', o: {} }, { label: 'Classic (real-world)', o: { color: C.classic } }], (I, o) => {
    const c = o.color || C.signal;
    I.shadow(10, 8, 18, 9, 0.13);
    I.box(0, 0, 1.5, 20, 14, 3, C.greyD); [[1, 1], [16, 1], [1, 10], [16, 10]].forEach(([x, y]) => I.box(x - 2, y, 0, 5, 3, 1.5, C.navy));
    I.box(4, 3, 4.5, 12, 8, 5, c); I.box(13, 4, 9.5, 4, 6, 5, C.paper); I.faceRect('x', 17, 5, 9, 11, 13.5, C.glassD);
    I.box(3, 4, 9.5, 5, 6, 4, darken(c, .2));
    const A = [12, 7, 10], B = [46, 10, 38];
    const pA = I.P(...A), pB = I.P(...B);
    I.add(`<line x1="${f2(pA[0])}" y1="${f2(pA[1])}" x2="${f2(pB[0])}" y2="${f2(pB[1])}" stroke="${darken(c, .15)}" stroke-width="3.2" stroke-linecap="round"/><line x1="${f2(pA[0])}" y1="${f2(pA[1] - 0.8)}" x2="${f2(pB[0])}" y2="${f2(pB[1] - 0.8)}" stroke="${lighten(c, .15)}" stroke-width="1.2" stroke-linecap="round"/>`);
    I.line([46, 10, 38], [46, 10, 12], C.navy, 0.4); I.box(44.5, 8.5, 10, 3, 3, 2, C.navy);
    I.setAnchor(10, 7);
  });

  def('towerCrane', 'Tower crane', 'Port & cranes', [{ label: 'Teal', o: {} }, { label: 'Classic (real-world)', o: { color: C.classic } }], (I, o) => {
    const c = o.color || C.signal, H = 60;
    I.box(-2, -2, 0, 7, 7, 1.5, C.concreteD);
    I.box(0, 0, 1.5, 3, 3, H, [lighten(c, .2), c, darken(c, .2)], { op: 0.95 });
    for (let z = 4; z < H; z += 4) { I.line([0, 3, z], [3, 3, z + 4], darken(c, .25), 0.35); I.line([3, 0, z], [3, 3, z + 4], darken(c, .3), 0.35); }
    I.box(-12, 0.5, H + 1.5, 12, 2, 1.5, c); I.box(-11, 0.2, H - 1.5, 5, 2.6, 3, C.greyD);
    I.box(3, 0.5, H + 1.5, 42, 2, 1.5, c); I.box(2.8, 0, H - 2.5, 3.5, 3, 3.5, C.paper); I.faceRect('x', 6.3, 0.4, 2.6, H - 1.8, H + 0.2, C.glassD);
    I.line([1.5, 1.5, H + 1.5], [1.5, 1.5, H + 9], c, 1); I.line([1.5, 1.5, H + 9], [44, 1.5, H + 3], darken(c, .2), 0.4); I.line([1.5, 1.5, H + 9], [-11, 1.5, H + 3], darken(c, .2), 0.4);
    I.box(28, 0.6, H + 0.4, 2, 1.8, 1.2, C.navy); I.line([29, 1.5, H + 0.4], [29, 1.5, 30], C.navy, 0.3); I.box(28.2, 0.8, 28.8, 1.6, 1.4, 1.2, C.navy);
    I.setAnchor(1.5, 1.5);
  });

  function containerAt(I, x, y, z, len, color, along = 'x') {
    const L = len, Wd = 8, Hh = 8.6;
    if (along === 'x') {
      I.box(x, y, z, L, Wd, Hh, color);
      for (let i = 1.2; i < L; i += 1.2) I.line([x + i, y + Wd, z + 0.3], [x + i, y + Wd, z + Hh - 0.3], lighten(color, .12), 0.3);
      I.faceRect('x', x + L, y + 0.5, y + Wd - 0.5, z + 0.4, z + Hh - 0.4, darken(color, .28)); I.line([x + L, y + Wd / 2, z + 0.4], [x + L, y + Wd / 2, z + Hh - 0.4], darken(color, .45), 0.4);
      [1.8, 3.2, 4.8, 6.2].forEach(yy => I.line([x + L, y + yy, z + 0.8], [x + L, y + yy, z + Hh - 0.8], lighten(color, .2), 0.35));
    } else {
      I.box(x, y, z, Wd, L, Hh, color);
      for (let i = 1.2; i < L; i += 1.2) I.line([x + Wd, y + i, z + 0.3], [x + Wd, y + i, z + Hh - 0.3], darken(color, .05), 0.3);
      I.faceRect('y', y + L, x + 0.5, x + Wd - 0.5, z + 0.4, z + Hh - 0.4, darken(color, .1)); I.line([x + Wd / 2, y + L, z + 0.4], [x + Wd / 2, y + L, z + Hh - 0.4], darken(color, .4), 0.4);
      [1.8, 3.2, 4.8, 6.2].forEach(xx => I.line([x + xx, y + L, z + 0.8], [x + xx, y + L, z + Hh - 0.8], lighten(color, .25), 0.35));
    }
  }
  const CONT = [C.ocean, C.signal, C.night, C.grey, C.rust, '#E4ECF1', C.sand, '#5E8C7A'];
  def('container', 'Shipping container', 'Port & cranes', [
    { label: '40 ft · ocean', o: {} }, { label: '20 ft · teal', o: { len: 20, color: C.signal } }, { label: '40 ft · navy', o: { color: C.night } }, { label: '40 ft · rust', o: { color: C.rust } },
    { label: '40 ft · white (reefer)', o: { color: '#E4ECF1' } }, { label: '20 ft · grey', o: { len: 20, color: C.grey } }, { label: '40 ft · green', o: { color: '#5E8C7A' } }, { label: '40 ft · customer colour', o: { useAccent: true } },
  ], (I, o) => { const L = o.len || 40; I.shadow(L / 2 + 2, 6, L * 0.6, 6, 0.12); containerAt(I, 0, 0, 0, L, o.useAccent ? (o.accent || C.signal) : (o.color || C.ocean)); I.setAnchor(L / 2, 4); });

  def('containerStack', 'Container stack', 'Port & cranes', [
    { label: '3 × 2 × 3', o: {} }, { label: 'Small 2 × 2 × 2', o: { rows: 2, cols: 2, levels: 2, seed: 4 } }, { label: 'Long row 1 × 4 × 2', o: { rows: 1, cols: 4, levels: 2, seed: 9 } }, { label: 'Tall 2 × 2 × 4', o: { rows: 2, cols: 2, levels: 4, seed: 2 } },
  ], (I, o) => {
    const rows = o.rows || 3, cols = o.cols || 2, lv = o.levels || 3, r = rng(o.seed || 7);
    for (let c = 0; c < cols; c++) for (let row = 0; row < rows; row++) { const h = Math.max(1, lv - Math.floor(r() * 2)); for (let l = 0; l < h; l++) containerAt(I, c * 41, row * 8.4, l * 8.7, 40, CONT[Math.floor(r() * CONT.length)]); }
    I.setAnchor(cols * 41 / 2, rows * 8.4 / 2);
  });

  def('quay', 'Quay / pier with bollards', 'Port & cranes', [{ label: 'Quay segment', o: {} }, { label: 'Long quay', o: { len: 140 } }], (I, o) => {
    const L = o.len || 90;
    I.poly([[-10, 20, 0], [L + 10, 20, 0], [L + 10, 50, 0], [-10, 50, 0]], C.water);
    for (let i = 0; i < 8; i++) I.line([i * 13, 28 + (i % 3) * 7, 0], [i * 13 + 6, 28 + (i % 3) * 7, 0], '#FFFFFF', 0.5, { op: 0.6 });
    I.box(0, 0, -2, L, 20, 4, [C.concrete, C.concreteD, '#9FB0BF']);
    I.faceRect('y', 20, 0, L, -2, 2, '#9FB0BF');
    for (let x = 6; x < L; x += 18) { I.box(x, 20, -1.5, 3, 0.8, 3, '#1F2A36'); I.lathe('z', [[2, 0.9], [3.4, 0.9], [3.8, 1.3]], x + 1.5, 18, C.navy, { seg: 12 }); }
    I.line([0, 17, 2.05], [L, 17, 2.05], C.classic, 0.5, { dash: '3 3' });
    I.setAnchor(L / 2, 10);
  });

  def('lighthouse', 'Lighthouse', 'Port & cranes', [{ label: 'White + teal', o: {} }], (I, o) => {
    I.lathe('z', [[0, 4.5], [1, 4.5]], 0, 0, C.concreteD, { seg: 18 });
    I.lathe('z', [[1, 3.4], [26, 2.4]], 0, 0, C.paper, { seg: 18 });
    [6, 14, 22].forEach(z => I.lathe('z', [[z, 3.4 - z * 0.04 + 0.05], [z + 3, 3.4 - (z + 3) * 0.04 + 0.05]], 0, 0, C.signal, { seg: 18, caps: false }));
    I.lathe('z', [[26, 3.2], [26.6, 3.2]], 0, 0, C.navy, { seg: 18 }); I.lathe('z', [[26.6, 2], [29.5, 2]], 0, 0, C.glass, { seg: 14 }); I.lathe('z', [[29.5, 2.4], [31, 0.4]], 0, 0, C.navy, { seg: 14 });
    I.dot(0, 0, 28, 1.4, '#FFF7D6');
    I.setAnchor(0, 0);
  });

  // ---------- SHIPS ----------
  def('ship', 'Ships & boats', 'Ships & planes', [
    { label: 'Container ship', o: { type: 'container' } }, { label: 'Feeder ship', o: { type: 'feeder' } }, { label: 'Tug boat', o: { type: 'tug' } }, { label: 'Coastal / fishing boat', o: { type: 'boat' } }, { label: 'Ship turned 90°', o: { type: 'feeder', turn: true } },
  ], (I, o) => {
    const t = o.type || 'container';
    const dims = { container: [120, 22, 9], feeder: [80, 16, 7.5], tug: [26, 10, 4.5], boat: [22, 8, 3.2] }[t];
    const [L, B, H] = dims, hull = t === 'tug' ? C.night : t === 'boat' ? '#F1F6F8' : (o.hull || C.navy);
    I.at(0, 0, 0, !!o.turn, () => {
      I.poly([[-6, -4, 0], [L + 12, -4, 0], [L + 12, B + 8, 0], [-6, B + 8, 0]], C.water, { op: 0.9 });
      I.path([[-4, B + 3, 0], [L * 0.4, B + 5, 0], [L + 8, B / 2 + 2, 0]], '#FFFFFF', 0.6, { op: 0.7 });
      const plan = [[0, 1], [L - B * 0.9, 0], [L, B / 2], [L - B * 0.9, B], [0, B - 1]];
      I.prism('z', plan, 0, H * 0.35, t === 'boat' ? C.ocean : C.rust);
      I.prism('z', plan, H * 0.35, H * 0.65, hull);
      I.line([2, B - 1, H], [L - B * 0.9, B, H], '#FFFFFF', 0.5, { op: 0.8 });
      if (t === 'container' || t === 'feeder') {
        const bayL = 8.6, rows = Math.floor((B - 3) / 4.2), bays = Math.floor((L - B * 0.9 - 26) / (bayL + 0.4)), r = rng(t === 'container' ? 3 : 5);
        I.box(2, 1.5, H, 16, B - 3, 13, C.paper); for (let z = H + 3; z < H + 12; z += 3) I.faceRect('y', B - 1.5, 3, 17, z, z + 1.2, C.glassD);
        I.faceRect('x', 18, 3, B - 4.5, H + 9.5, H + 12, C.glassD);
        I.box(5, B / 2 - 2, H + 13, 6, 4, 6, hull); I.box(5, B / 2 - 2, H + 18, 6, 4, 1.2, C.signal);
        for (let b = 0; b < bays; b++) for (let rr = 0; rr < rows; rr++) { const h = 1 + Math.floor(r() * (t === 'container' ? 3 : 2)); for (let l = 0; l < h; l++) { const col = CONT[Math.floor(r() * CONT.length)]; I.box(22 + b * (bayL + 0.4), 1.5 + rr * 4.2, H + l * 4.2, bayL, 4, 4.1, col); I.line([22 + b * (bayL + 0.4) + bayL / 2, 1.5 + rr * 4.2 + 4, H + l * 4.2 + 0.4], [22 + b * (bayL + 0.4) + bayL / 2, 1.5 + rr * 4.2 + 4, H + l * 4.2 + 3.7], darken(col, .2), 0.3); } }
      }
      if (t === 'tug') { I.box(6, 2, H, 10, 6, 5, C.paper); I.faceRect('y', 8, 7, 15, H + 2.5, H + 4.2, C.glassD); I.faceRect('x', 16, 3, 7, H + 2.5, H + 4.2, C.glassD); I.box(8, 3.5, H + 5, 4, 3, 3, C.signal); I.box(9, 4, H + 8, 2, 2, 2.5, C.navy); [4, 10, 16, 21].forEach(x => I.box(x, B - 0.2, H * 0.4, 2, 0.8, 1.6, '#1F2A36')); }
      if (t === 'boat') { I.box(4, 1.8, H, 7, 4.4, 4, C.paper); I.faceRect('x', 11, 2.4, 5.6, H + 2, H + 3.4, C.glassD); I.faceRect('y', 6.2, 5, 10, H + 2, H + 3.4, C.glassD); I.line([8, 4, H + 4], [8, 4, H + 14], C.navy, 0.5); I.line([8, 4, H + 13], [18, 4, H + 1], C.navy, 0.3); }
      I.setAnchor(L / 2, B / 2);
    });
  }, 'Includes its own water patch. Turn 90° for routes running front-left.');

  // ---------- PLANES ----------
  def('airplane', 'Aircraft', 'Ships & planes', [{ label: 'Cargo jet · white', o: {} }, { label: 'Cargo jet · navy tail', o: { tail: C.night } }, { label: 'Small prop plane', o: { small: true } }, { label: 'Turned 90°', o: { turn: true } }], (I, o) => {
    const acc = o.tail || o.accent || C.signal;
    I.at(0, 0, 0, !!o.turn, () => {
      if (o.small) {
        I.shadow(10, 10, 16, 7, 0.12);
        I.poly([[7, -8, 4.2], [11, -8, 4.2], [11, 28, 4.2], [7, 28, 4.2]], C.paper); I.poly([[7, 28, 4.2], [11, 28, 4.2], [11, 28, 3.8], [7, 28, 3.8]], C.visor);
        I.lathe('x', [[0, 0.4], [2, 1.6], [14, 1.8], [22, 0.6]], 10, 3.8, C.paper, { seg: 16 });
        I.prism('y', [[18, 4], [22, 4.4], [22, 9], [20.5, 9]], 9.7, 0.6, acc);
        I.poly([[18.5, 6, 4.6], [21.5, 6, 4.6], [21.5, 14, 4.6], [18.5, 14, 4.6]], C.paper);
        I.lathe('x', [[-0.6, 0.3], [0, 0.3]], 10, 3.8, C.navy, { seg: 8 }); I.line([-0.3, 10, 1.4], [-0.3, 10, 6.2], C.navy, 0.5);
        [[7, 8], [7, 12]].forEach(([x, y]) => wheelY(I, x, y, 0, 0.8, 0.5)); wheelY(I, 0.8, 10.3, 0, 0.6, 0.4);
        I.setAnchor(10, 10);
        return;
      }
      const L = 70, cy = 20, cz = 5.5, R = 3.6;
      I.shadow(L / 2, cy + 2, 30, 12, 0.08);
      I.poly([[24, cy, cz], [40, cy, cz], [28, cy - 34, cz + 1.2], [21, cy - 34, cz + 1.2]], '#E4ECF1'); I.lathe('x', [[26, 1.4], [31, 1.5], [33, 1.1]], cy - 12, cz - 2, C.visor, { seg: 14 });
      I.prism('z', [[58, cy], [66, cy], [70, cy - 12], [66.5, cy - 12]], cz + 1, 0.5, '#E4ECF1');
      I.lathe('x', [[0, 0.3], [2, 2.2], [6, 3.4], [10, R], [56, R], [64, 2.4], [70, 1.2]], cy, cz, C.paper, { seg: 22 });
      I.path(Array.from({ length: 13 }, (_, i) => [12 + i * 3.6, cy + R * 0.84, cz + R * 0.55]), C.navy, 0.5, { dash: '0.6 2.4' });
      I.line([10, cy + R * 0.98, cz - 0.6], [58, cy + R * 0.98, cz - 0.6], acc, 0.9);
      I.prism('y', [[56, cz + 2], [67, cz + 2], [70.5, cz + 14], [66, cz + 14]], cy - 0.4, 0.8, acc);
      I.prism('z', [[58, cy], [66, cy], [70, cy + 12], [66.5, cy + 12]], cz + 1, 0.5, C.paper);
      I.lathe('x', [[26, 1.4], [31, 1.5], [33, 1.1]], cy + 12, cz - 2, C.visor, { seg: 14 });
      I.poly([[24, cy, cz], [40, cy, cz], [28, cy + 34, cz + 1.2], [21, cy + 34, cz + 1.2]], C.paper); I.poly([[40, cy, cz], [28, cy + 34, cz + 1.2], [28, cy + 34, cz + 0.6], [40, cy + 3, cz - 0.6]], C.visor);
      [[8, cy], [36, cy - 4], [36, cy + 4]].forEach(([x, y]) => { I.line([x, y, 0.6], [x, y, cz - R + 0.4], C.greyD, 0.5); wheelY(I, x, y + 0.6, 0, 0.9, 0.6); });
      I.setAnchor(L / 2, cy);
    });
  });

  // ---------- VEHICLES ----------
  function truckCab(I, x0, W, col, h = 10) { I.prism('y', [[x0, 2.4], [x0 + 7.5, 2.4], [x0 + 7.5, h * 0.62], [x0 + 6, h], [x0, h]], 0.3, W - 0.6, col); I.poly([[x0 + 7.5, 0.9, h * 0.66], [x0 + 7.5, W - 0.9, h * 0.66], [x0 + 6.15, W - 0.9, h * 0.94], [x0 + 6.15, 0.9, h * 0.94]], C.glassD); I.faceRect('y', W - 0.3, x0 + 2.2, x0 + 5.6, h * 0.62, h * 0.92, C.glassD); I.faceRect('x', x0 + 7.5, 0.8, 2, 3.4, 4.2, '#FFF7D6'); I.faceRect('x', x0 + 7.5, W - 2, W - 0.8, 3.4, 4.2, '#FFF7D6'); I.faceRect('x', x0 + 7.5, 2.4, W - 2.4, 2.6, 4.6, darken(col, .35)); }
  def('boxTruck', 'Box truck', 'Vehicles', [
    { label: 'White + accent stripe', o: {} }, { label: 'Customer colour', o: { body: 'accent' } }, { label: 'Navy', o: { body: C.night, cab: C.paper } }, { label: 'Reefer (cold)', o: { reefer: true } }, { label: 'Turned 90°', o: { turn: true } }, { label: 'With name on side', o: { named: true } },
  ], (I, o) => {
    const acc = o.accent || C.signal, body = o.body === 'accent' ? acc : (o.body || C.paper), cab = o.cab || C.navy, W = 8;
    I.at(0, 0, 0, !!o.turn, () => {
      I.shadow(13, 5, 16, 6, 0.16);
      I.box(0, 0.6, 1.2, 26, W - 1.2, 1.2, '#1F2A36');
      wheelY(I, 4, W - 0.2, 0, 2); wheelY(I, 13, W - 0.2, 0, 2);
      I.box(0, 0, 2.4, 18, W, 11, body);
      if (body !== acc) I.faceRect('y', W, 0.4, 17.6, 4, 5.2, acc);
      if (o.reefer) { I.box(16, 1.2, 9.5, 2, W - 2.4, 3.2, C.greyD); I.faceRect('y', W, 0.4, 17.6, 12, 12.6, C.ocean); }
      if (o.named || o.text) I.faceText('y', W, 1, 17, 8.6, 3.2, o.text || 'stacko', body === acc ? '#FFFFFF' : C.navy);
      truckCab(I, 18.5, W, cab);
      wheelY(I, 22.5, W - 0.2, 0, 2);
      I.setAnchor(13, W / 2);
    });
  }, 'Faces front-right by default (driving towards the bottom-right). "Turned 90°" drives towards the bottom-left.');

  def('semiTruck', 'Truck with container', 'Vehicles', [{ label: 'Ocean container', o: {} }, { label: 'Teal 20 ft', o: { len: 20, color: C.signal } }, { label: 'Rust container', o: { color: C.rust } }, { label: 'Turned 90°', o: { turn: true } }], (I, o) => {
    const L = o.len || 40, W = 8;
    I.at(0, 0, 0, !!o.turn, () => {
      I.shadow((L + 11) / 2, 5, (L + 12) * 0.55, 6, 0.16);
      I.box(0, 0.8, 1.8, L + 2, W - 1.6, 1, '#1F2A36');
      [3, 6.5, L - 6].forEach(x => wheelY(I, x, W - 0.2, 0, 1.8));
      containerAt(I, 0, 0, 2.8, L, o.color || C.ocean);
      truckCab(I, L + 2.5, W, o.cab || C.paper, 11);
      wheelY(I, L + 5.5, W - 0.2, 0, 1.9);
      I.setAnchor((L + 10) / 2, W / 2);
    });
  });

  def('van', 'Delivery van', 'Vehicles', [{ label: 'White + accent', o: {} }, { label: 'Customer colour', o: { body: 'accent' } }, { label: 'Grey', o: { body: '#B9C6D1' } }, { label: 'Turned 90°', o: { turn: true } }], (I, o) => {
    const acc = o.accent || C.signal, body = o.body === 'accent' ? acc : (o.body || C.paper), W = 7.4;
    I.at(0, 0, 0, !!o.turn, () => {
      I.shadow(9, 4, 12, 5, 0.16);
      wheelY(I, 3.5, W - 0.2, 0, 1.7);
      I.prism('y', [[0, 1.4], [18, 1.4], [18.6, 4.2], [15.6, 8.6], [0.2, 9]], 0, W, body);
      I.poly([[18.2, 0.8, 4.8], [18.2, W - 0.8, 4.8], [15.8, W - 0.8, 8.2], [15.8, 0.8, 8.2]], C.glassD);
      I.faceRect('y', W, 12.4, 16, 5, 8.2, C.glassD);
      if (body !== acc) I.faceRect('y', W, 0.3, 12, 4.4, 5.4, acc);
      if (o.text) I.faceText('y', W, 0.5, 11.5, 7, 2.2, o.text, body === acc ? '#FFFFFF' : C.navy);
      I.faceRect('x', 18.55, 0.8, 1.8, 3, 3.8, '#FFF7D6'); I.faceRect('x', 18.55, W - 1.8, W - 0.8, 3, 3.8, '#FFF7D6');
      wheelY(I, 14.5, W - 0.2, 0, 1.7);
      I.setAnchor(9, W / 2);
    });
  });

  def('pickup', 'Pickup with cargo', 'Vehicles', [{ label: 'White · cartons', o: {} }, { label: 'Navy · empty', o: { body: C.night, empty: true } }, { label: 'Turned 90°', o: { turn: true } }], (I, o) => {
    const body = o.body || C.paper, W = 7.2;
    I.at(0, 0, 0, !!o.turn, () => {
      I.shadow(9, 4, 12, 5, 0.16);
      wheelY(I, 3.5, W - 0.2, 0, 1.7);
      I.box(0, 0, 1.6, 8.5, W, 3.4, body); I.box(0.4, 0.4, 2.2, 7.7, W - 0.8, 2.8, darken(body, .35), { noLeft: true, noRight: true });
      if (!o.empty) { carton(I, 0.8, 0.8, 2.2, 3.4, 2.8, 3, null); carton(I, 4.4, 0.8, 2.2, 3.4, 2.8, 3, null); carton(I, 0.8, 3.8, 2.2, 3.4, 2.8, 3, null); }
      I.prism('y', [[8.5, 1.6], [17.5, 1.6], [17.8, 4.2], [14.5, 4.6], [13, 7.8], [8.5, 7.8]], 0, W, body);
      I.poly([[14.6, 0.8, 4.8], [14.6, W - 0.8, 4.8], [13.1, W - 0.8, 7.5], [13.1, 0.8, 7.5]], C.glassD); I.faceRect('y', W, 9.2, 12.8, 5, 7.4, C.glassD);
      wheelY(I, 14.2, W - 0.2, 0, 1.7);
      I.setAnchor(9, W / 2);
    });
  });

  def('car', 'Car', 'Vehicles', [
    { label: 'White', o: {} }, { label: 'Silver', o: { body: '#B9C6D1' } }, { label: 'Navy', o: { body: C.night } }, { label: 'Ocean', o: { body: C.ocean } }, { label: 'Sand', o: { body: '#D6C29A' } }, { label: 'Teal', o: { body: C.signal } }, { label: 'Turned 90°', o: { turn: true, body: '#B9C6D1' } },
  ], (I, o) => {
    const body = o.body || C.paper, W = 6.6;
    I.at(0, 0, 0, !!o.turn, () => {
      I.shadow(8, 3.5, 10, 4.5, 0.16);
      wheelY(I, 3.4, W - 0.2, 0, 1.4, 1);
      I.prism('y', [[0, 1.2], [15.5, 1.2], [16, 3.4], [12.6, 4], [3, 4], [0, 3.6]], 0, W, body);
      I.prism('y', [[3.6, 4], [11.6, 4], [9.6, 6.6], [5, 6.6]], 0.6, W - 1.2, body);
      I.poly([[11.6, 1, 4.05], [11.6, W - 1, 4.05], [9.7, W - 1, 6.5], [9.7, 1, 6.5]], C.glassD);
      I.faceRect('y', W - 0.6, 4.6, 7.4, 4.3, 6.3, C.glassD); I.faceRect('y', W - 0.6, 7.9, 10.2, 4.3, 6.3, C.glassD);
      I.faceRect('x', 16, 0.6, 1.6, 2.5, 3.1, '#FFF7D6'); I.faceRect('x', 16, W - 1.6, W - 0.6, 2.5, 3.1, '#FFF7D6');
      wheelY(I, 12.6, W - 0.2, 0, 1.4, 1);
      I.setAnchor(8, W / 2);
    });
  });

  def('moto', 'Delivery motorbike', 'Vehicles', [{ label: 'With box + rider', o: {} }, { label: 'Parked (no rider)', o: { noRider: true } }, { label: 'Turned 90°', o: { turn: true } }], (I, o) => {
    const acc = o.accent || C.signal;
    I.at(0, 0, 0, !!o.turn, () => {
      I.shadow(5, 1.5, 7, 3, 0.16);
      wheelY(I, 1.6, 2.2, 0, 1.5, 0.7);
      I.prism('y', [[1, 2.2], [8, 2.2], [9.6, 4.6], [9, 5.2], [6, 3.6], [2.5, 4.6], [0.8, 3.6]], 1.1, 1, C.night);
      I.box(0, 0.4, 4.6, 4.2, 2.6, 3.6, acc); I.faceRect('y', 3, 0.6, 3.6, 5.6, 7, '#FFFFFF');
      I.line([9.2, 1.6, 4.8], [9.8, 1.6, 7], C.navy, 0.5); I.line([9.8, 0.5, 7], [9.8, 2.7, 7], C.navy, 0.6);
      if (!o.noRider) { I.box(4.8, 1, 3.6, 2.6, 1.6, 1.6, C.navy); I.box(5, 0.9, 5.2, 2.4, 1.8, 3.4, acc); I.line([7.2, 2.6, 7.6], [9.6, 2.6, 7], acc, 0.7); I.dot(6.2, 1.8, 10.4, 1.4, C.navy); I.dot(6.6, 1.8, 10.2, 0.6, C.glassD); }
      wheelY(I, 8.6, 2.2, 0, 1.5, 0.7);
      I.setAnchor(5, 1.6);
    });
  });

  // ---------- EQUIPMENT ----------
  def('forklift', 'Forklift', 'Equipment & tools', [{ label: 'Teal · with pallet', o: {} }, { label: 'Teal · empty forks', o: { empty: true } }, { label: 'Classic (real-world)', o: { color: C.classic } }, { label: 'Navy', o: { color: C.night } }, { label: 'Turned 90°', o: { turn: true } }], (I, o) => {
    const c = o.color || C.signal;
    I.at(0, 0, 0, !!o.turn, () => {
      I.shadow(8, 3.5, 10, 4.5, 0.16);
      wheelY(I, 2.4, 6, 0, 1.3, 1);
      I.box(0, 0, 1, 4, 6, 4.2, C.greyD);
      I.box(3.6, 0, 1, 6.4, 6, 3.4, c);
      I.box(4.6, 1.6, 4.4, 2.6, 2.8, 2, C.navy);
      [[3.8, 0.4], [3.8, 5.2], [8.8, 0.4], [8.8, 5.2]].forEach(([x, y]) => I.line([x, y, 4.4], [x + (x > 5 ? 0.4 : 0), y, 11], C.navy, 0.45));
      I.box(3.6, 0, 11, 5.8, 6, 0.4, C.navy);
      I.box(10.2, 0.6, 1, 0.8, 1, 12, '#1F2A36'); I.box(10.2, 4.4, 1, 0.8, 1, 12, '#1F2A36');
      I.box(11, 0.8, 3, 0.6, 4.4, 2.2, C.greyD);
      I.box(11.2, 1.2, 1.2, 8, 0.8, 0.3, C.steel); I.box(11.2, 4, 1.2, 8, 0.8, 0.3, C.steel);
      if (!o.empty) { I.at(11, -2, 1.5, false, () => palletLoad(I, 0, 0, 1)); }
      wheelY(I, 8.6, 6, 0, 1.5, 1);
      I.setAnchor(8, 3);
    });
  });

  def('palletJack', 'Pallet jack', 'Equipment & tools', [{ label: 'Empty', o: {} }, { label: 'With load', o: { load: true } }], (I, o) => {
    I.shadow(6, 3, 8, 4, 0.14);
    I.box(0, 0.6, 0.2, 11, 1.2, 0.5, C.signal); I.box(0, 4.2, 0.2, 11, 1.2, 0.5, C.signal);
    if (o.load) I.at(0, 0, 0.7, false, () => palletLoad(I, 0.5, -2, 1));
    I.box(11, 0.6, 0, 2, 4.8, 2.2, C.navy); I.line([12.5, 3, 2.2], [15.5, 3, 8.5], C.navy, 0.6); I.line([15, 1.8, 8.4], [16, 4.2, 8.6], C.navy, 0.7);
    wheelY(I, 12, 5.6, 0, 0.8, 0.6);
    I.setAnchor(6, 3);
  });

  def('handTruck', 'Hand truck', 'Equipment & tools', [{ label: 'With cartons', o: {} }, { label: 'Empty', o: { empty: true } }], (I, o) => {
    I.shadow(2, 2.5, 4, 2, 0.14);
    I.box(0, 0, 0, 3.5, 4.5, 0.3, C.steel);
    if (!o.empty) { carton(I, 0.2, 0.3, 0.3, 3.2, 3.8, 3.4, null); carton(I, 0.3, 0.4, 3.7, 3, 3.6, 3, C.signal); }
    I.line([-0.2, 0.2, 0], [-0.2, 0.2, 10], C.navy, 0.5); I.line([-0.2, 4.3, 0], [-0.2, 4.3, 10], C.navy, 0.5); I.line([-0.2, 0.2, 10], [-0.2, 4.3, 10], C.navy, 0.6);
    wheelY(I, 0, 4.8, 0, 1, 0.5);
    I.setAnchor(1.7, 2.2);
  });

  def('racking', 'Pallet racking', 'Equipment & tools', [{ label: '3 levels · full', o: {} }, { label: '3 levels · half empty', o: { fill: 0.5 } }, { label: '4 levels · tall', o: { levels: 4 } }, { label: 'Turned 90°', o: { turn: true } }], (I, o) => {
    const bays = o.bays || 3, lv = o.levels || 3, BW = 11.5, D = 11, LH = 9, r = rng(11), fill = o.fill == null ? 0.9 : o.fill;
    I.at(0, 0, 0, !!o.turn, () => {
      for (let b = 0; b <= bays; b++) I.box(b * BW, 0, 0, 0.8, 0.8, lv * LH + 1, C.ocean);
      for (let l = 0; l < lv; l++) {
        for (let b = 0; b < bays; b++) if (l === 0 || r() < fill) { I.at(b * BW + 0.9, 0.5, l * LH + (l ? 0.9 : 0), false, () => r() < 0.5 ? palletLoad(I, 0, 0, 1, { wrap: r() < 0.3 }) : (pallet(I, 0, 0), carton(I, 0.5, 0.5, 1.8, 9, 9, 5.6, null))); }
        if (l) { I.box(0, 0, l * LH, bays * BW + 0.8, 0.6, 0.9, C.classic); I.box(0, D - 0.6, l * LH, bays * BW + 0.8, 0.6, 0.9, C.classic); }
      }
      for (let b = 0; b <= bays; b++) I.box(b * BW, D - 0.8, 0, 0.8, 0.8, lv * LH + 1, C.ocean);
      I.setAnchor(bays * BW / 2, D / 2);
    });
  }, 'Beams use the real-world orange-yellow; uprights in brand blue.');

  def('conveyor', 'Conveyor belt', 'Equipment & tools', [{ label: 'With cartons', o: {} }, { label: 'Empty', o: { empty: true } }], (I, o) => {
    const L = 36;
    I.shadow(L / 2, 3, L * 0.6, 4, 0.12);
    for (let x = 2; x < L; x += 10) { I.box(x, 0.4, 0, 0.6, 0.6, 4, C.greyD); }
    I.box(0, 0, 4, L, 5, 1.2, C.steel); I.box(0, 0.4, 5.2, L, 4.2, 0.2, '#2A3440', { noLeft: true, noRight: true });
    for (let x = 2; x < L; x += 10) I.box(x, 4.4, 0, 0.6, 0.6, 4, C.greyD);
    if (!o.empty) [3, 13, 24].forEach((x, i) => carton(I, x, 0.8, 5.4, 5, 3.4, 3.2 + (i % 2), i === 1 ? C.signal : null));
    I.setAnchor(L / 2, 2.5);
  });

  def('rollCage', 'Roll cage trolley', 'Equipment & tools', [{ label: 'Loaded', o: {} }], (I, o) => {
    I.shadow(3.5, 3, 5, 3, 0.14);
    I.box(0, 0, 0.8, 7, 6, 0.4, C.steel);
    carton(I, 0.4, 0.4, 1.2, 3, 2.6, 3, null); carton(I, 3.6, 0.4, 1.2, 3, 2.6, 3, null); carton(I, 0.4, 3.1, 1.2, 3, 2.6, 3, C.signal); carton(I, 1.5, 1.4, 4.2, 4, 3.6, 3, null);
    [[0, 6], [7, 0], [7, 6]].forEach(([x, y]) => I.line([x, y, 1], [x, y, 11], C.greyD, 0.4));
    for (let z = 3; z <= 11; z += 2.6) { I.path([[0, 6, z], [7, 6, z], [7, 0, z]], C.greyD, 0.3); }
    for (let x = 1.4; x < 7; x += 1.4) I.line([x, 6, 1], [x, 6, 11], C.greyD, 0.25); for (let y = 1.2; y < 6; y += 1.2) I.line([7, y, 1], [7, y, 11], C.greyD, 0.25);
    [[0.5, 6], [6.5, 6]].forEach(([x, y]) => wheelY(I, x, y, 0, 0.4, 0.3));
    I.setAnchor(3.5, 3);
  });

  def('stretchWrapper', 'Pallet wrapping machine', 'Equipment & tools', [{ label: 'Wrapping a pallet', o: {} }], (I, o) => {
    I.lathe('z', [[0, 8], [1.2, 8]], 6, 6, C.greyD, { seg: 28 });
    I.at(1, 1, 1.2, false, () => palletLoad(I, 0, 0, 2, { wrap: true }));
    I.box(15, 4, 0, 3, 4, 20, C.signal); I.box(13.5, 4.6, 8, 1.6, 2.8, 4, C.paper); I.lathe('z', [[8.4, 0.9], [11.6, 0.9]], 13.2, 6, '#EAF4F7', { seg: 12 });
    I.setAnchor(6, 6);
  });

  def('scale', 'Platform scale', 'Equipment & tools', [{ label: 'With pallet', o: {} }, { label: 'Empty', o: { empty: true } }], (I, o) => {
    I.box(0, 0, 0, 12, 12, 0.8, C.greyD); I.box(0.4, 0.4, 0.8, 11.2, 11.2, 0.2, C.steel);
    if (!o.empty) I.at(1, 1, 1, false, () => palletLoad(I, 0, 0, 1));
    I.line([12.5, 1, 0], [12.5, 1, 9], C.navy, 0.5); I.box(12, 0, 9, 1.2, 2.4, 2.2, C.navy); I.faceRect('x', 13.2, 0.4, 2, 9.6, 10.6, C.glow);
    I.setAnchor(6, 6);
  });

  def('ladder', 'Rolling warehouse ladder', 'Equipment & tools', [{ label: 'Ladder', o: {} }], (I, o) => {
    I.shadow(4, 3, 5, 3, 0.14);
    I.prism('y', [[0, 0], [8, 0], [2.6, 14], [0, 14]], 0, 0.5, C.steel); I.prism('y', [[0, 0], [8, 0], [2.6, 14], [0, 14]], 4.5, 0.5, C.steel);
    for (let i = 1; i < 6; i++) { const z = i * 2.4, x = 8 - (8 - 2.6) * z / 14; I.box(x - 1.6, 0.5, z, 1.8, 4, 0.3, C.greyD); }
    I.box(0, 0, 14, 3, 5, 0.4, C.signal);
    I.setAnchor(4, 2.5);
  });

  def('workbench', 'Workbench + tools', 'Equipment & tools', [{ label: 'Workbench', o: {} }], (I, o) => {
    I.shadow(7, 4, 9, 4, 0.12);
    [[0, 0], [13, 0], [0, 6.4], [13, 6.4]].forEach(([x, y]) => I.box(x, y, 0, 0.6, 0.6, 7, C.greyD));
    I.box(0, 0, 7, 13.6, 7, 0.8, C.wood); I.box(0, 0, 2, 13.6, 7, 0.4, C.greyD, { noTop: false });
    I.box(1, 1, 7.8, 3, 2, 1.6, C.signal); carton(I, 8, 1.5, 7.8, 4, 3.5, 2.5, null); I.line([5, 4.5, 7.9], [7.5, 5.5, 7.9], C.navy, 0.5); I.dot(5.4, 5.2, 8, 0.6, C.rust);
    I.box(0, 0, 7.8, 13.6, 0.4, 6, C.visor, { noTop: true }); for (let x = 2; x < 13; x += 2.5) I.line([x, 0.4, 10], [x, 0.4, 12.5], C.navy, 0.4);
    I.setAnchor(6.8, 3.5);
  });

  def('extinguisher', 'Fire extinguisher', 'Equipment & tools', [{ label: 'On stand', o: {} }], (I, o) => {
    I.box(-1.2, -1.2, 0, 2.4, 2.4, 0.4, C.greyD); I.lathe('z', [[0.4, 0.9], [4, 0.9], [4.6, 0.5]], 0, 0, C.rust, { seg: 14 }); I.box(-0.3, -0.3, 4.6, 0.6, 0.6, 0.8, C.navy); I.line([0.3, 0, 5], [1.2, 0.6, 3], C.navy, 0.3);
    I.setAnchor(0, 0);
  });
  def('cone', 'Traffic cone / barrier', 'Equipment & tools', [{ label: 'Cone · brand', o: {} }, { label: 'Cone · classic', o: { classic: true } }, { label: 'Jersey barrier', o: { barrier: true } }], (I, o) => {
    if (o.barrier) { I.prism('y', [[0, 0], [3, 0], [2.2, 1.2], [1.8, 4], [1.2, 4], [0.8, 1.2]], 0, 16, C.concrete); for (let y = 2; y < 16; y += 4) I.poly([[3, y, 0], [3, y + 2, 0], [2.2, y + 2, 1.2], [2.2, y, 1.2]], C.signal); I.setAnchor(1.5, 8); return; }
    const c = o.classic ? '#D9774A' : C.signal;
    I.box(-1.6, -1.6, 0, 3.2, 3.2, 0.4, C.navy); I.lathe('z', [[0.4, 1.2], [4.6, 0.25]], 0, 0, c, { seg: 16 }); I.lathe('z', [[1.8, 0.86], [2.6, 0.7]], 0, 0, '#FFFFFF', { seg: 16 });
    I.setAnchor(0, 0);
  });

  // ---------- GOODS ----------
  def('carton', 'Carton', 'Goods & cargo', [{ label: 'Medium · teal tape', o: {} }, { label: 'Plain', o: { tape: null } }, { label: 'Small', o: { s: 0.6 } }, { label: 'Long (flat pack)', o: { long: true } }, { label: 'Customer tape colour', o: { useAccent: true } }], (I, o) => {
    const s = o.s || 1; const w = o.long ? 16 : 9 * s, d = o.long ? 6 : 9 * s, h = o.long ? 4 : 7 * s;
    I.shadow(w / 2 + 1, d / 2 + 1, w * 0.7, d * 0.4, 0.14);
    carton(I, 0, 0, 0, w, d, h, o.useAccent ? (o.accent || C.signal) : (o.tape === undefined ? C.signal : o.tape)); I.setAnchor(w / 2, d / 2);
  });
  def('cartonStack', 'Carton pile', 'Goods & cargo', [{ label: 'Pile', o: {} }, { label: 'Big pile', o: { big: true } }], (I, o) => {
    const r = rng(o.big ? 21 : 5), n = o.big ? 3 : 2;
    I.shadow(9, 9, 14, 7, 0.14);
    for (let l = 0; l < n; l++) for (let y = 0; y < (o.big ? 3 : 2) - (l ? 1 : 0); y++) for (let x = 0; x < (o.big ? 3 : 2) - (l ? 1 : 0); x++) carton(I, x * 6.2 + l * 2.5, y * 6.2 + l * 2.5, l * 5, 6, 6, 5, r() < 0.4 ? C.signal : null);
    I.setAnchor(6, 6);
  });
  def('pallet', 'Pallet', 'Goods & cargo', [
    { label: 'Empty pallet', o: { empty: true } }, { label: '1 level of cartons', o: { levels: 1 } }, { label: '2 levels', o: { levels: 2 } }, { label: '3 levels', o: { levels: 3 } }, { label: 'Shrink-wrapped', o: { levels: 2, wrap: true } }, { label: 'Stack of empty pallets', o: { emptyStack: true } },
  ], (I, o) => {
    I.shadow(6, 6, 9, 4.5, 0.14);
    if (o.emptyStack) { for (let i = 0; i < 5; i++) pallet(I, 0, 0, i * 1.85); I.setAnchor(5, 5); return; }
    if (o.empty) pallet(I, 0, 0); else palletLoad(I, 0, 0, o.levels || 2, { wrap: o.wrap });
    I.setAnchor(5, 5);
  });
  def('crate', 'Wooden crate', 'Goods & cargo', [{ label: 'Crate', o: {} }, { label: 'Large crate', o: { big: true } }], (I, o) => {
    const w = o.big ? 16 : 9, d = o.big ? 10 : 9, h = o.big ? 9 : 7;
    I.shadow(w / 2 + 1, d / 2 + 1, w * 0.7, d * 0.4, 0.14);
    I.box(0, 0, 0, w, d, h, ['#D4B07E', C.wood, C.woodD]);
    for (let z = h / 3; z < h; z += h / 3) { I.line([0, d, z], [w, d, z], C.woodD, 0.4); I.line([w, 0, z], [w, d, z], darken(C.woodD, .2), 0.4); }
    I.line([0, d, 0], [w, d, h], C.woodD, 0.6); I.line([w, 0, 0], [w, d, h], darken(C.woodD, .2), 0.6);
    I.setAnchor(w / 2, d / 2);
  });
  def('barrel', 'Drums / barrels', 'Goods & cargo', [{ label: 'Single · navy', o: {} }, { label: 'Single · teal', o: { color: C.signal } }, { label: '4 on a pallet', o: { group: true } }, { label: 'Single · grey', o: { color: C.grey } }], (I, o) => {
    const dr = (x, y, z, c) => { I.lathe('z', [[z, 2], [z + 7, 2]], x, y, c, { seg: 18 }); [z + 2.3, z + 4.7].forEach(zz => I.lathe('z', [[zz, 2.05], [zz + 0.3, 2.05]], x, y, darken(c, .25), { seg: 18, caps: false })); };
    if (o.group) { pallet(I, 0, 0); [[2.6, 2.6], [7.4, 2.6], [2.6, 7.4], [7.4, 7.4]].forEach(([x, y], i) => dr(x, y, 1.8, i % 2 ? C.signal : C.navy)); I.setAnchor(5, 5); return; }
    I.shadow(1, 1, 3.5, 1.8, 0.14); dr(0, 0, 0, o.color || C.night); I.setAnchor(0, 0);
  });
  def('sacks', 'Sacks', 'Goods & cargo', [{ label: 'Pile of sacks', o: {} }, { label: 'On a pallet', o: { pallet: true } }], (I, o) => {
    const z0 = o.pallet ? 1.8 : 0; if (o.pallet) pallet(I, 0, 0, 0, 10, 10); else I.shadow(5, 5, 8, 4, 0.14);
    const sack = (x, y, z) => I.prism('y', [[x, z], [x + 4.6, z], [x + 4.8, z + 1.2], [x + 4.4, z + 2.4], [x + 0.2, z + 2.4], [x - 0.2, z + 1.2]], y, 4.4, '#E2D7C0');
    for (let l = 0; l < 3; l++) for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) sack(0.3 + x * 4.9, 0.4 + y * 4.6, z0 + l * 2.5);
    I.setAnchor(5, 5);
  });
  def('ibc', 'IBC tank', 'Goods & cargo', [{ label: 'IBC tote', o: {} }], (I, o) => {
    pallet(I, 0, 0); I.box(0.5, 0.5, 1.8, 9, 9, 9, ['#FFFFFF', '#E9F1F4', '#D7E3EA'], { op: 0.92 }); I.box(0.5, 0.5, 1.8, 9, 9, 5, ['#D8E8EE', '#CFE0E8', '#BFD3DD'], { op: 0.7, noTop: false });
    for (let x = 0.5; x <= 9.5; x += 2.25) I.line([x, 9.5, 1.8], [x, 9.5, 10.8], C.greyD, 0.3); for (let z = 1.8; z <= 10.8; z += 3) { I.line([0.5, 9.5, z], [9.5, 9.5, z], C.greyD, 0.3); I.line([9.5, 0.5, z], [9.5, 9.5, z], C.greyD, 0.3); }
    for (let y = 0.5; y <= 9.5; y += 2.25) I.line([9.5, y, 1.8], [9.5, y, 10.8], C.greyD, 0.3);
    I.lathe('z', [[10.8, 1.2], [11.6, 1.2]], 5, 5, C.navy, { seg: 12 });
    I.setAnchor(5, 5);
  });
  def('tires', 'Tyres (spare parts)', 'Goods & cargo', [{ label: 'Stack of 4', o: {} }, { label: 'Three stacks', o: { three: true } }], (I, o) => {
    const st = (x, y, n) => { for (let i = 0; i < n; i++) { I.lathe('z', [[i * 2.2, 2.7], [i * 2.2 + 0.35, 3.2], [i * 2.2 + 1.65, 3.2], [i * 2.2 + 2, 2.7]], x, y, C.tire, { seg: 20, bands: [darken(C.tire, .3), C.tire, darken(C.tire, .3)] }); I.lathe('z', [[i * 2.2 + 2, 1.6], [i * 2.2 + 2.05, 1.6]], x, y, '#11161D', { seg: 16 }); } };
    I.shadow(1, 1, 5, 2.6, 0.14);
    if (o.three) { st(0, 0, 4); st(7, 0, 3); st(3.5, 6, 5); I.setAnchor(3.5, 2); return; }
    st(0, 0, 4); I.setAnchor(0, 0);
  });
  def('rolls', 'Rolls (fabric / carpet)', 'Goods & cargo', [{ label: 'Upright rolls', o: {} }], (I, o) => {
    const cols = [C.ocean, C.sand, C.signal, '#E4ECF1', C.night, C.rust];
    I.shadow(6, 4, 9, 4, 0.14);
    [[0, 0], [4, 0], [8, 0], [2, 3.6], [6, 3.6], [10, 3.6]].forEach(([x, y], i) => I.lathe('z', [[0, 1.8], [12 - (i % 3), 1.8]], x, y, cols[i], { seg: 16, capColor: lighten(cols[i], .3) }));
    I.setAnchor(5, 2);
  });
  def('gasCylinders', 'Gas cylinders', 'Goods & cargo', [{ label: 'Group of 6', o: {} }], (I, o) => {
    I.shadow(4, 3, 7, 3.5, 0.14);
    [[0, 0], [3, 0], [6, 0], [1.5, 2.8], [4.5, 2.8], [7.5, 2.8]].forEach(([x, y], i) => { I.lathe('z', [[0, 1.2], [7, 1.2], [8, 0.6]], x, y, i % 2 ? C.signal : C.paper, { seg: 14 }); I.lathe('z', [[8, 0.35], [8.8, 0.35]], x, y, C.greyD, { seg: 8 }); });
    I.setAnchor(4, 1.5);
  });
  def('cableDrum', 'Cable drum', 'Goods & cargo', [{ label: 'Wooden drum', o: {} }], (I, o) => {
    I.shadow(3, 4, 6, 3, 0.14);
    I.lathe('y', [[0, 5], [0.8, 5], [0.8, 3], [5.2, 3], [5.2, 5], [6, 5]], 3, 5, C.wood, { seg: 22, bands: [C.wood, C.woodD, C.night, C.woodD, C.wood] });
    I.setAnchor(3, 3);
  });

  // ---------- NATURE ----------
  def('tree', 'Trees & plants', 'Nature', [
    { label: 'Round tree', o: { k: 'round' } }, { label: 'Round · large', o: { k: 'round', s: 1.4 } }, { label: 'Cypress', o: { k: 'cypress' } }, { label: 'Palm', o: { k: 'palm' } }, { label: 'Olive tree', o: { k: 'olive' } },
    { label: 'Pine (Lebanese cedar style)', o: { k: 'cedar' } }, { label: 'Bush', o: { k: 'bush' } }, { label: 'Planter box', o: { k: 'planter' } }, { label: 'Hedge row', o: { k: 'hedge' } },
  ], (I, o) => {
    const k = o.k || 'round', s = o.s || 1;
    if (k === 'round') { treeRound(I, 0, 0, s); I.setAnchor(0, 0); return; }
    if (k === 'cypress') { I.shadow(2, 2, 4, 2); I.line([0, 0, 0], [0, 0, 3], C.deep, 1.2); I.ell(0, 0, 11, 3.2, 9, C.grassD); I.ell(-0.8, 0, 12, 1.4, 6, C.grass); I.setAnchor(0, 0); return; }
    if (k === 'palm') { I.shadow(2, 2, 6, 3); const pts = [[0, 0, 0], [0.4, 0.2, 5], [1, 0.4, 10], [1.8, 0.6, 15]]; I.path(pts, '#8C6E4F', 1.4); const top = I.P(1.8, 0.6, 15); const fr = [[-9, -1], [-6, -5], [0, -7], [6, -5], [9, 0], [5, 4], [-5, 4]]; fr.forEach(([dx, dy]) => I.add(`<path d="M${f2(top[0])} ${f2(top[1])} q ${f2(dx * 0.5)} ${f2(dy - 3)} ${f2(dx)} ${f2(dy + 2)}" stroke="${C.grassD}" stroke-width="2" fill="none" stroke-linecap="round"/>`)); I.dot(1.8, 0.6, 15, 1.3, '#6B5238'); I.P(-8, 0, 20); I.P(8, 0, 20); I.setAnchor(0, 0); return; }
    if (k === 'olive') { I.shadow(2, 2, 7, 3.2); I.path([[0, 0, 0], [0.5, 0, 4], [-0.5, 0, 7]], '#7A6650', 1.6); [[-3, 0, 9, 3.6], [2.5, 0, 9.5, 3.4], [0, 0, 12, 3.8], [-1, 2, 10, 3]].forEach(([x, y, z, r], i) => I.dot(x, y, z, r, i % 2 ? C.olive : C.oliveD)); I.dot(-1, 0, 12.5, 1.6, lighten(C.olive, .2)); I.setAnchor(0, 0); return; }
    if (k === 'cedar') { I.shadow(2, 2, 7, 3.4); I.line([0, 0, 0], [0, 0, 6], '#6B5238', 1.4); [[6, 10], [9.5, 8], [13, 5.6], [16, 3.4]].forEach(([z, r], i) => { I.ell(0, 0, z - 0.6, r, r * 0.3, darken('#2F7A66', .25)); I.ell(0, 0, z, r, r * 0.32, i % 2 ? C.grassD : '#2F7A66'); }); I.setAnchor(0, 0); return; }
    if (k === 'bush') { I.shadow(1, 1, 5, 2.2); I.dot(-1.6, 0, 2.4, 2.6, C.grassD); I.dot(1.6, 0, 2.4, 2.6, C.grass); I.dot(0, 0, 3.8, 2.6, C.grass); I.dot(-0.6, 0, 4.4, 1.2, C.grassL); I.setAnchor(0, 0); return; }
    if (k === 'planter') { I.box(0, 0, 0, 10, 4, 3.2, C.concrete); I.box(0.4, 0.4, 3.2, 9.2, 3.2, 0.1, '#5D4A3A'); [1.8, 5, 8.2].forEach((x, i) => I.dot(x, 2, 5, 2.2, i % 2 ? C.grass : C.grassD)); I.setAnchor(5, 2); return; }
    if (k === 'hedge') { I.box(0, 0, 0, 24, 3.4, 4.4, [C.grassL, C.grass, C.grassD]); for (let x = 2; x < 24; x += 3) I.dot(x, 3.4, 3.4, 1, C.grassL, { op: 0.6 }); I.setAnchor(12, 1.7); return; }
  });

  // ---------- GROUND & ROADS ----------
  def('ground', 'Ground tiles & roads', 'Ground & roads', [
    { label: 'Road · straight', o: { k: 'road' } }, { label: 'Road · turned 90°', o: { k: 'road', turn: true } }, { label: 'Crossroads', o: { k: 'cross' } }, { label: 'Parking bays', o: { k: 'parking' } },
    { label: 'Loading zone (hatched)', o: { k: 'hatch' } }, { label: 'Crosswalk', o: { k: 'zebra' } }, { label: 'Concrete yard', o: { k: 'concrete' } }, { label: 'Grass patch', o: { k: 'grass' } }, { label: 'Water', o: { k: 'water' } }, { label: 'Sand / gravel', o: { k: 'sand' } },
  ], (I, o) => {
    const k = o.k, S = 40;
    I.at(0, 0, 0, !!o.turn, () => {
      if (k === 'road') { I.poly([[0, 0, 0], [S, 0, 0], [S, 14, 0], [0, 14, 0]], C.asphalt); I.line([0, 7, 0], [S, 7, 0], '#FFFFFF', 0.7, { dash: '4 4' }); I.line([0, 0.6, 0], [S, 0.6, 0], '#FFFFFF', 0.4, { op: 0.6 }); I.line([0, 13.4, 0], [S, 13.4, 0], '#FFFFFF', 0.4, { op: 0.6 }); I.setAnchor(S / 2, 7); }
      if (k === 'cross') { I.poly([[0, 13, 0], [S, 13, 0], [S, 27, 0], [0, 27, 0]], C.asphalt); I.poly([[13, 0, 0], [27, 0, 0], [27, S, 0], [13, S, 0]], C.asphalt); I.line([0, 20, 0], [12, 20, 0], '#FFFFFF', 0.7, { dash: '4 4' }); I.line([28, 20, 0], [S, 20, 0], '#FFFFFF', 0.7, { dash: '4 4' }); I.line([20, 0, 0], [20, 12, 0], '#FFFFFF', 0.7, { dash: '4 4' }); I.line([20, 28, 0], [20, S, 0], '#FFFFFF', 0.7, { dash: '4 4' }); I.setAnchor(20, 20); }
      if (k === 'parking') { I.poly([[0, 0, 0], [S, 0, 0], [S, 14, 0], [0, 14, 0]], C.asphaltD); for (let x = 0; x <= S; x += 8) I.line([x, 0.5, 0], [x, 13.5, 0], '#FFFFFF', 0.6); I.setAnchor(S / 2, 7); }
      if (k === 'hatch') { I.poly([[0, 0, 0], [24, 0, 0], [24, 14, 0], [0, 14, 0]], C.concrete); I.path([[0, 0, 0], [24, 0, 0], [24, 14, 0], [0, 14, 0], [0, 0, 0]], C.classic, 0.8); for (let t = -14; t < 24; t += 3) { let sx = t, sy = 0, ex = t + 14, ey = 14; if (sx < 0) { sy = -sx; sx = 0; } if (ex > 24) { ey = 14 - (ex - 24); ex = 24; } if (ey > sy) I.line([sx, sy, 0], [ex, ey, 0], C.classic, 0.6); } I.setAnchor(12, 7); }
      if (k === 'zebra') { I.poly([[0, 0, 0], [16, 0, 0], [16, 14, 0], [0, 14, 0]], C.asphalt); for (let y = 1; y < 14; y += 2.4) I.poly([[3, y, 0], [13, y, 0], [13, y + 1.2, 0], [3, y + 1.2, 0]], '#FFFFFF'); I.setAnchor(8, 7); }
      if (k === 'concrete') { I.poly([[0, 0, 0], [S, 0, 0], [S, S, 0], [0, S, 0]], C.concrete); for (let i = 10; i < S; i += 10) { I.line([i, 0, 0], [i, S, 0], C.concreteD, 0.4); I.line([0, i, 0], [S, i, 0], C.concreteD, 0.4); } I.setAnchor(S / 2, S / 2); }
      if (k === 'grass') { I.poly([[0, 0, 0], [S, 0, 0], [S, S, 0], [0, S, 0]], '#CFE7D8'); const r = rng(3); for (let i = 0; i < 40; i++) { const x = r() * S, y = r() * S; I.line([x, y, 0], [x + 0.4, y, 0.9], C.grass, 0.4); } I.setAnchor(S / 2, S / 2); }
      if (k === 'water') { I.poly([[0, 0, 0], [S, 0, 0], [S, S, 0], [0, S, 0]], C.water); const r = rng(8); for (let i = 0; i < 10; i++) { const x = r() * (S - 8), y = r() * S; I.line([x, y, 0], [x + 6, y, 0], '#FFFFFF', 0.5, { op: 0.7 }); } I.setAnchor(S / 2, S / 2); }
      if (k === 'sand') { I.poly([[0, 0, 0], [S, 0, 0], [S, S, 0], [0, S, 0]], '#E8DCC0'); const r = rng(4); for (let i = 0; i < 60; i++) I.dot(r() * S, r() * S, 0, 0.35, '#C9B58E'); I.setAnchor(S / 2, S / 2); }
    });
  }, 'Flat tiles to build yards and roads. 40 × 40 units each (roads 40 × 14).');

  def('fence', 'Fence & gate', 'Ground & roads', [{ label: 'Fence · along x', o: {} }, { label: 'Fence · along y', o: { turn: true } }, { label: 'Sliding gate', o: { gate: true } }, { label: 'Wall with railing', o: { wall: true } }], (I, o) => {
    const L = 30;
    I.at(0, 0, 0, !!o.turn, () => {
      if (o.wall) { I.box(0, 0, 0, L, 1.2, 3.4, C.paper); for (let x = 0; x <= L; x += 2) I.line([x, 0.6, 3.4], [x, 0.6, 7], C.navy, 0.3); I.line([0, 0.6, 7], [L, 0.6, 7], C.navy, 0.5); I.setAnchor(L / 2, 0.6); return; }
      for (let x = 0; x <= L; x += 7.5) I.box(x, 0, 0, 0.6, 0.6, 8, C.greyD);
      for (let x = 0; x < L; x += 0.9) I.line([x, 0.3, 0.3], [x + 0.9, 0.3, 7.6], C.steel, 0.15, { op: 0.8 });
      for (let x = 0; x < L; x += 0.9) I.line([x + 0.9, 0.3, 0.3], [x, 0.3, 7.6], C.steel, 0.15, { op: 0.8 });
      I.line([0, 0.3, 7.8], [L, 0.3, 7.8], C.greyD, 0.4);
      if (o.gate) { I.box(L, -0.2, 0, 0.8, 1, 9, C.navy); I.box(L + 1, 0, 0.8, 16, 0.6, 6, C.signal, { op: 0.9 }); for (let x = L + 2; x < L + 17; x += 1.6) I.line([x, 0.6, 1], [x, 0.6, 6.6], darken(C.signal, .3), 0.4); }
      I.setAnchor(L / 2, 0.3);
    });
  });

  def('lamp', 'Lights & masts', 'Ground & roads', [{ label: 'Street lamp', o: {} }, { label: 'Floodlight mast', o: { mast: true } }, { label: 'Bollard light', o: { bollard: true } }], (I, o) => {
    if (o.bollard) { I.lathe('z', [[0, 0.6], [3, 0.6]], 0, 0, C.navy, { seg: 12 }); I.lathe('z', [[2.2, 0.62], [2.8, 0.62]], 0, 0, '#FFF7D6', { seg: 12 }); I.setAnchor(0, 0); return; }
    if (o.mast) { I.box(-1, -1, 0, 2, 2, 1, C.concreteD); I.line([0, 0, 1], [0, 0, 30], C.greyD, 1); I.box(-3, -0.6, 30, 6, 1.2, 2.2, C.navy); [-2, 0, 2].forEach(x => I.faceRect('y', 0.6, x - 0.7, x + 0.7, 30.4, 31.8, '#FFF7D6')); I.setAnchor(0, 0); return; }
    I.line([0, 0, 0], [0, 0, 16], C.deep, 0.8); I.line([0, 0, 16], [3, 0, 17], C.deep, 0.7); I.dot(3, 0, 16.6, 1.2, '#FFF7D6', { stroke: C.deep, sw: 0.4 });
    I.setAnchor(0, 0);
  });

  // ---------- ROOFTOP (Lebanon) ----------
  def('rooftop', 'Rooftop items (Lebanon)', 'Rooftop & utilities', [
    { label: 'Water tank · black', o: { k: 'tank' } }, { label: 'Water tank · white', o: { k: 'tank', color: C.paper } }, { label: 'Solar panel array', o: { k: 'solar' } }, { label: 'Generator', o: { k: 'gen' } },
    { label: 'AC outdoor unit', o: { k: 'ac' } }, { label: 'Satellite dish', o: { k: 'dish' } }, { label: 'Electric box', o: { k: 'ebox' } },
  ], (I, o) => {
    const k = o.k;
    if (k === 'tank') { I.box(-3, -3, 0, 6, 6, 1.6, C.greyD); I.lathe('z', [[1.6, 2.6], [7, 2.6], [7.8, 1.6]], 0, 0, o.color || '#1F2A36', { seg: 18 }); [3.4, 5.2].forEach(z => I.lathe('z', [[z, 2.65], [z + 0.3, 2.65]], 0, 0, darken(o.color || '#2A3440', .3), { seg: 18, caps: false })); I.setAnchor(0, 0); return; }
    if (k === 'solar') { for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) { const x = i * 5.4, y = r * 9; I.line([x + 0.5, y + 6, 0], [x + 0.5, y + 6, 2.6], C.greyD, 0.4); I.poly([[x, y, 0.6], [x + 5, y, 0.6], [x + 5, y + 6.5, 3], [x, y + 6.5, 3]], C.night); I.line([x + 2.5, y, 0.6], [x + 2.5, y + 6.5, 3], C.ocean, 0.3); I.line([x, y + 3.25, 1.8], [x + 5, y + 3.25, 1.8], C.ocean, 0.3); I.line([x + 0.4, y + 0.4, 0.8], [x + 2, y + 5.5, 2.6], '#FFFFFF', 0.4, { op: 0.35 }); } I.setAnchor(10.8, 7.5); return; }
    if (k === 'gen') { I.shadow(6, 4, 9, 4, 0.14); I.box(0, 0, 0, 12, 6, 6.5, '#5E8C7A'); for (let x = 1.5; x < 8; x += 1) I.line([x, 6, 2], [x, 6, 5], darken('#5E8C7A', .3), 0.35); I.faceRect('x', 12, 1.5, 4.5, 2, 5, darken('#5E8C7A', .35)); I.lathe('z', [[6.5, 0.5], [10, 0.5]], 10, 1.5, C.greyD, { seg: 10 }); I.setAnchor(6, 3); return; }
    if (k === 'ac') { I.box(0, 0, 0, 6, 2.6, 4.4, C.paper); I.ell(2.4, 2.6, 2.2, 1.6, 1.9, C.greyD, { rot: -30 }); for (let z = 0.8; z < 4; z += 0.6) I.line([4.6, 2.6, z], [5.6, 2.6, z], C.visor, 0.3); I.setAnchor(3, 1.3); return; }
    if (k === 'dish') { I.line([0, 0, 0], [0, 0, 4], C.greyD, 0.6); I.ell(0, 0, 5, 3.6, 2.2, C.paper, { stroke: C.visor, sw: 0.5, rot: -25 }); I.line([0, 0, 5], [1.6, 1.6, 6.4], C.greyD, 0.4); I.setAnchor(0, 0); return; }
    if (k === 'ebox') { I.box(0, 0, 0, 4, 2, 6, C.visor); I.faceRect('y', 2, 0.4, 3.6, 0.6, 5.4, lighten(C.visor, .3)); I.faceRect('y', 2, 1.2, 2.8, 3.5, 4.6, C.signal); I.setAnchor(2, 1); return; }
  }, 'Very Lebanese details: black water tanks, solar panels and generators make a rooftop or yard feel local.');

  // ---------- PEOPLE ----------
  def('people', 'People', 'People', [
    { label: 'Worker · teal shirt', o: {} }, { label: 'Worker · hi-vis + helmet', o: { vest: true, helmet: '#F4F8FA', shirt: C.ocean } }, { label: 'Carrying a carton', o: { carry: true } }, { label: 'Manager · navy', o: { shirt: C.night, pants: C.greyD } }, { label: 'Driver', o: { shirt: '#E4ECF1', pants: C.navy } }, { label: 'Small group', o: { group: true } },
  ], (I, o) => {
    if (o.group) { person(I, 0, 0, { shirt: C.signal }); person(I, 4, 1.5, { shirt: C.night, pants: C.greyD }); person(I, 1.5, 4.5, { vest: true, helmet: '#F4F8FA', shirt: C.ocean }); I.setAnchor(2.5, 2.5); return; }
    person(I, 0, 0, o); I.setAnchor(1.1, 0.7);
  }, 'Simple figures at map scale — enough to make the yard feel alive.');

  // ---------- MAP UI (flat) ----------
  const FLAT = {
    truck: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="22" viewBox="0 0 48 22"><rect x="1" y="2" width="31" height="15" rx="2.5" fill="#FFFFFF" stroke="#0E2440" stroke-width="1.4"/><rect x="4" y="12" width="25" height="2.2" rx="1" fill="${a}"/><path d="M33 5 H40 L46 11 V17 H33 Z" fill="#0E2440"/><path d="M36 7 H39.5 L43.5 11 H36 Z" fill="#BCE5E0"/><circle cx="9" cy="18.5" r="2.6" fill="#0E2440"/><circle cx="24" cy="18.5" r="2.6" fill="#0E2440"/><circle cx="40" cy="18.5" r="2.6" fill="#0E2440"/></svg>`,
    containerTruck: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="22" viewBox="0 0 60 22"><rect x="1" y="3" width="42" height="13" rx="1" fill="#2F86B8" stroke="#0E2440" stroke-width="1.2"/><path d="M6 4v11M11 4v11M16 4v11M21 4v11M26 4v11M31 4v11M36 4v11" stroke="#79C0DE" stroke-width=".8"/><path d="M45 6 H52 L58 12 V17 H45 Z" fill="#0E2440"/><path d="M48 8 H51.5 L55.5 12 H48 Z" fill="#BCE5E0"/><circle cx="8" cy="18.5" r="2.6" fill="#0E2440"/><circle cx="15" cy="18.5" r="2.6" fill="#0E2440"/><circle cx="36" cy="18.5" r="2.6" fill="#0E2440"/><circle cx="52" cy="18.5" r="2.6" fill="#0E2440"/></svg>`,
    van: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="22" viewBox="0 0 40 22"><path d="M1 4 Q1 2 3 2 H27 L36 9 Q38 10 38 12 V17 H1 Z" fill="#FFFFFF" stroke="#0E2440" stroke-width="1.4"/><path d="M27 4 L34 9.5 H27 Z" fill="#BCE5E0"/><rect x="3" y="11" width="21" height="2" rx="1" fill="${a}"/><circle cx="9" cy="18.5" r="2.6" fill="#0E2440"/><circle cx="30" cy="18.5" r="2.6" fill="#0E2440"/></svg>`,
    moto: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="22" viewBox="0 0 30 22"><rect x="2" y="3" width="10" height="8" rx="1.5" fill="${a}"/><path d="M5 15 H18 L22 9 H25" stroke="#0E2440" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M24 9 L23 4 H26" stroke="#0E2440" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="6" cy="17" r="3.4" fill="none" stroke="#0E2440" stroke-width="2"/><circle cx="24" cy="17" r="3.4" fill="none" stroke="#0E2440" stroke-width="2"/></svg>`,
    ship: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="58" height="24" viewBox="0 0 58 24"><path d="M2 12 H46 L56 17 L50 22 H6 Z" fill="#0E2440"/><rect x="5" y="5" width="8" height="7" fill="#2F86B8"/><rect x="14" y="5" width="8" height="7" fill="${a}"/><rect x="23" y="5" width="8" height="7" fill="#FFFFFF" stroke="#C9D8E4" stroke-width=".6"/><rect x="14" y="0" width="8" height="5" fill="#79C0DE"/><rect x="5" y="0" width="8" height="5" fill="#FFFFFF" stroke="#C9D8E4" stroke-width=".6"/><rect x="34" y="2" width="9" height="10" rx="1" fill="#FFFFFF"/><rect x="35.5" y="4" width="6" height="2" fill="#2F86B8"/><path d="M6 17 H50" stroke="#2EF2EE" stroke-width="1.2"/></svg>`,
    plane: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 36 36"><path d="M34 18 L27 16 L19 16 L12 4 L8.5 4 L12.5 16 L6 16 L3 11.5 L1 11.5 L2.5 18 L1 24.5 L3 24.5 L6 20 L12.5 20 L8.5 32 L12 32 L19 20 L27 20 Z" fill="#0E2440" stroke="#FFFFFF" stroke-width="1.2" stroke-linejoin="round"/><path d="M22 18 H30" stroke="${a}" stroke-width="1.3" stroke-linecap="round"/></svg>`,
    pin: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="44" viewBox="0 0 34 44"><path d="M17 43 C17 43 3 27 3 17 A14 14 0 1 1 31 17 C31 27 17 43 17 43 Z" fill="#0E2440"/><circle cx="17" cy="17" r="8" fill="${a}"/><circle cx="17" cy="17" r="3.2" fill="#FFFFFF"/></svg>`,
    warehousePin: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><path d="M20 47 L12 36 H6 Q2 36 2 32 V6 Q2 2 6 2 H34 Q38 2 38 6 V32 Q38 36 34 36 H28 Z" fill="#0E2440"/><path d="M9 28 V16 L20 10 L31 16 V28 Z" fill="${a}"/><rect x="15" y="20" width="10" height="8" fill="#0E2440"/><path d="M15 23 H25 M15 25.5 H25" stroke="${a}" stroke-width=".8"/></svg>`,
    portPin: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><path d="M20 47 L12 36 H6 Q2 36 2 32 V6 Q2 2 6 2 H34 Q38 2 38 6 V32 Q38 36 34 36 H28 Z" fill="#0E2440"/><path d="M20 9 V27 M13 14 H27 M10 22 Q12 29 20 29 Q28 29 30 22" stroke="${a}" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="20" cy="9" r="2.4" fill="none" stroke="${a}" stroke-width="2"/></svg>`,
    airportPin: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48"><path d="M20 47 L12 36 H6 Q2 36 2 32 V6 Q2 2 6 2 H34 Q38 2 38 6 V32 Q38 36 34 36 H28 Z" fill="#0E2440"/><path d="M31 19 L24 17.5 L19 10 H16.5 L19 17.5 H13 L11 14.5 H9.5 L10.5 19 L9.5 23.5 H11 L13 20.5 H19 L16.5 28 H19 L24 20.5 L31 19 Z" fill="${a}"/></svg>`,
    alert: () => `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><circle cx="13" cy="13" r="12" fill="#C2334A" stroke="#FFFFFF" stroke-width="2"/><rect x="11.6" y="6" width="2.8" height="9" rx="1.4" fill="#FFFFFF"/><circle cx="13" cy="19" r="1.7" fill="#FFFFFF"/></svg>`,
    cluster: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="21" fill="${a}" opacity=".25"/><circle cx="22" cy="22" r="15" fill="#0E2440"/><text x="22" y="22" font-family="Readex Pro, Arial, sans-serif" font-weight="700" font-size="13" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central">12</text></svg>`,
    etaTag: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="22" viewBox="0 0 64 22"><rect x="1" y="1" width="62" height="18" rx="9" fill="#0E2440"/><circle cx="11" cy="10" r="3.4" fill="${a}"/><text x="38" y="10.5" font-family="Readex Pro, Arial, sans-serif" font-weight="600" font-size="10" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central">1h 20m</text></svg>`,
    stockChip: (a) => `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="26" viewBox="0 0 150 26"><rect x="1" y="1" width="148" height="24" rx="12" fill="#FFFFFF" stroke="#C9D8E4"/><text x="12" y="13.5" font-family="Readex Pro, Arial, sans-serif" font-weight="600" font-size="11" fill="#0E2440" dominant-baseline="central">WH-01 · Beirut</text><rect x="94" y="5" width="34" height="16" rx="8" fill="#EEF6F9"/><text x="111" y="13.5" font-family="Readex Pro, Arial, sans-serif" font-weight="700" font-size="10" fill="#0E2440" text-anchor="middle" dominant-baseline="central">7,250</text><rect x="131" y="5" width="15" height="16" rx="8" fill="#C2334A"/><text x="138.5" y="13.5" font-family="Readex Pro, Arial, sans-serif" font-weight="700" font-size="9" fill="#FFFFFF" text-anchor="middle" dominant-baseline="central">4</text></svg>`,
  };
  const FLAT_NAMES = { truck: 'Route icon · truck', containerTruck: 'Route icon · container truck', van: 'Route icon · van', moto: 'Route icon · motorbike', ship: 'Route icon · ship', plane: 'Route icon · plane (top view)', pin: 'Location pin', warehousePin: 'Warehouse pin', portPin: 'Port pin', airportPin: 'Airport pin', alert: 'Alert badge', cluster: 'Cluster bubble', etaTag: 'ETA tag', stockChip: 'Warehouse chip' };
  Object.keys(FLAT).forEach(k => { E['ui_' + k] = { id: 'ui_' + k, name: FLAT_NAMES[k], cat: 'Map UI (flat)', variants: [{ label: 'Default', o: {} }], flat: true, draw: null, notes: k.match(/truck|van|moto|ship|plane/i) ? 'Side/top view icon that rotates along the route, like the prototype.' : 'Flat UI marker.' }; });

  /* ------------------------------------------------------------------ API */
  function render(id, o = {}, scale = 1) {
    const e = E[id]; if (!e) throw new Error('Unknown element: ' + id);
    if (e.flat) { const k = id.slice(3); let s = FLAT[k](o.accent || C.signal); const m = s.match(/width="(\d+)" height="(\d+)"/); const w = +m[1], h = +m[2]; s = s.replace(/width="\d+" height="\d+"/, `width="${w * scale}" height="${h * scale}" data-anchor-x="${(w * scale / 2)}" data-anchor-y="${(k.match(/pin/i) ? h : h / 2) * scale}"`); return s; }
    const I = new Iso(); e.draw(I, o); return I.svg(scale);
  }
  function list() { return Object.values(E).map(e => ({ id: e.id, name: e.name, category: e.cat, variants: e.variants.map(v => v.label), notes: e.notes })); }
  function variant(id, label) { const v = E[id].variants.find(v => v.label === label); return v ? v.o : {}; }
  /** compose several elements into one scene: items = [{id, o, x, y}] in world units, drawn back to front */
  function scene(items, scale = 1) {
    const I = new Iso();
    items.slice().sort((a, b) => (a.d != null ? a.d : a.x + a.y) - (b.d != null ? b.d : b.x + b.y)).forEach(it => I.at(it.x, it.y, it.z || 0, false, () => E[it.id].draw(I, it.o || {})));
    I.anchor = [0, 0]; return I.svg(scale, 4);
  }
  return { render, list, variant, scene, colors: C, elements: E, Iso, version: '1.0.0' };
});
