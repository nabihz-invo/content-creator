/*! Stacko Motion — app recreations: the LIVE MAP exactly as the Stacko app draws it
 *  (isometric warehouse yards, roads, sea lane, air route, trucks/ships/planes rotating along their
 *  route with ETA tags, warehouse chips with units and low-stock counts, toasts, KPI header) —
 *  but fully animatable and deterministic for video.  Requires sm-core.js.
 *
 *  const m = s.map({ view: 'all', intro: 'drop' });
 *  m.camera(1.2, { focus: 'W2', zoom: 2.4, dur: 1.4 });
 *  m.truck({ from: 'W1', to: 'W2', at: 2, dur: 5, eta: 73, qty: 40, item: 'LED Strip 5m', glow: true, follow: true });
 */
(function (G) {
  'use strict';
  const SM = G.SM, C = SM.C, mk = SM.el, clamp = SM.clamp, E = SM.ease, esc = SM.esc;
  const f2 = n => Math.round(n * 100) / 100, NS = 'http://www.w3.org/2000/svg';

  /* ---------------------------------------------------------------- app drawing (from the live map) */
  const P = (x, y, z = 0) => [100 + (x - y) * 0.866, 34 + (x + y) * 0.5 - z];
  const pts = a => a.map(p => P(...p).map(v => v.toFixed(1)).join(',')).join(' ');
  const poly = (a, f, s) => `<polygon points="${pts(a)}" fill="${f}"${s ? ` stroke="${s}" stroke-width=".6" stroke-linejoin="round"` : ''}/>`;
  const line = (a, b, c, w = .6, dash = '') => { const p = P(...a), q = P(...b); return `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="${c}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`; };
  function box(x, y, z, w, d, h, c) { const x1 = x + w, y1 = y + d, z1 = z + h; return poly([[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], c[0]) + poly([[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]], c[1]) + poly([[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]], c[2]); }
  const KRAFT = ['#E6CB9E', '#CDA672', '#B58E5A'];
  function carton(x, y, z) { return box(x, y, z, 9, 9, 7, KRAFT) + poly([[x + 2.5, y + 9, z + 2.5], [x + 6.5, y + 9, z + 2.5], [x + 6.5, y + 9, z + 5], [x + 2.5, y + 9, z + 5]], '#0895A6') + line([x + 4.5, y, z + 7], [x + 4.5, y + 9, z + 7], '#B58E5A', .8); }
  function pallet(x, y, levels) { let s = box(x, y, 0, 10, 10, 1.6, ['#C9A77A', '#A9875C', '#9A7A52']); for (let i = 0; i < levels; i++) s += carton(x + .5, y + .5, 1.6 + i * 7); return s; }
  function tree(x, y) { const b = P(x, y, 0), c = P(x, y, 14); return `<ellipse cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" rx="5" ry="2.4" fill="#0E2440" opacity=".12"/>` + line([x, y, 0], [x, y, 8], '#2C5974', 1.6) + `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="6.5" fill="#4FAE95"/><circle cx="${(c[0] - 1.8).toFixed(1)}" cy="${(c[1] - 2).toFixed(1)}" r="3.4" fill="#86D3B9"/>`; }
  function lamp(x, y) { const h = P(x, y, 18); return line([x, y, 0], [x, y, 18], '#2C5974', 1) + `<circle cx="${h[0].toFixed(1)}" cy="${h[1].toFixed(1)}" r="1.8" fill="#BCE5E0" stroke="#2C5974" stroke-width=".6"/>`; }
  function faceText(x, y, z, str, size, fill, accent) { const p = P(x, y, z); return `<text transform="matrix(0.866,0.5,0,1,${p[0].toFixed(1)},${p[1].toFixed(1)})" font-family="Readex Pro,sans-serif" font-weight="600" font-size="${size}" letter-spacing="-.25" fill="${fill}">${str}<tspan fill="${accent}">o</tspan></text>`; }
  /** The isometric warehouse yard used as a marker in the app. o.truck=false hides the parked truck. */
  SM.appScene = function (code, o = {}) {
    let s = `<svg class="scene" xmlns="http://www.w3.org/2000/svg" width="194" height="132" viewBox="-4 14 194 132">`;
    s += poly([[0, 0, 0], [100, 0, 0], [100, 96, 0], [0, 96, 0]], '#EAF2F4', '#C9D8E4');
    s += poly([[22, 58, 0], [68, 58, 0], [68, 96, 0], [22, 96, 0]], '#DCE6EE');
    s += poly([[0, 96, 0], [100, 96, 0], [100, 100, 0], [0, 100, 0]], '#D3DEE7');
    s += poly([[0, 100, 0], [100, 100, 0], [100, 118, 0], [0, 118, 0]], '#4C6684');
    s += line([0, 109, 0], [100, 109, 0], '#FFFFFF', .9, '4 4');
    s += tree(6, 6) + tree(96, 5) + tree(5, 32);
    const bx0 = 18, bx1 = 78, by0 = 14, by1 = 58, wz = 24, rz = 34, ry = 36;
    s += poly([[bx0, ry, rz], [bx1, ry, rz], [bx1, by0, wz], [bx0, by0, wz]], '#5FA9D0');
    s += poly([[bx0, by1, 0], [bx1, by1, 0], [bx1, by1, wz], [bx0, by1, wz]], '#2F86B8');
    s += poly([[bx1, by0, 0], [bx1, by1, 0], [bx1, by1, wz], [bx1, ry, rz], [bx1, by0, wz]], '#246A9A');
    s += poly([[bx0, by1, wz], [bx1, by1, wz], [bx1, ry, rz], [bx0, ry, rz]], '#8CCBE6');
    for (let x = bx0 + 5; x < bx1; x += 5) s += line([x, by1, wz], [x, ry, rz], '#A9DAEE', .6);
    s += line([bx0, ry, rz], [bx1, ry, rz], '#FFFFFF', .8);
    [[24, 34, false], [40, 50, true], [56, 66, false]].forEach(([a, b, open]) => { s += poly([[a, by1, 0], [b, by1, 0], [b, by1, 13], [a, by1, 13]], open ? '#0E2440' : '#C9D8E4'); if (open) s += carton(a + 1, by1 - 10, 0); else[3, 6, 9, 12].forEach(z => s += line([a, by1, z], [b, by1, z], '#A2B1C0', .5)); });
    s += poly([[26, by1, 15.5], [72, by1, 15.5], [72, by1, 22], [26, by1, 22]], '#0E2440');
    s += faceText(33, by1, 16.8, 'stack', 6.4, '#FFFFFF', '#2EF2EE');
    const g = P(bx1, ry, 17);
    s += `<rect x="${(g[0] - 8).toFixed(1)}" y="${(g[1] - 8).toFixed(1)}" width="16" height="16" rx="4" fill="#0E2440"/><svg x="${(g[0] - 7).toFixed(1)}" y="${(g[1] - 7).toFixed(1)}" width="14" height="14"><use href="#mark"/></svg>`;
    const lc = P(bx1, 22, 5);
    s += `<text transform="matrix(-0.866,0.5,0,1,${(lc[0] + 20).toFixed(1)},${(lc[1] - 11).toFixed(1)})" font-family="Readex Pro,sans-serif" font-weight="600" font-size="4.6" fill="#FFFFFF" opacity=".85">${code}</text>`;
    s += pallet(84, 16, 2) + pallet(84, 30, 1) + pallet(84, 44, 2);
    s += box(60, 63, 0, 8, 5, 4.5, ['#3BB3C2', '#0895A6', '#067C8A']) + box(63, 63, 4.5, 4, 5, 3, ['#BCE5E0', '#0E2440', '#16355A']);
    s += line([59.5, 63, 0], [59.5, 63, 11], '#0E2440', 1.3) + line([59.5, 68, 0], [59.5, 68, 11], '#0E2440', 1.3) + carton(50.5, 63, 1.2);
    s += tree(8, 86) + tree(92, 88) + lamp(14, 98) + lamp(76, 98);
    if (o.truck !== false) {
      s += box(22, 102, 1.8, 34, 8, 13, ['#F4F8FA', '#FFFFFF', '#DCE6EE']);
      s += poly([[24, 110, 3.5], [54, 110, 3.5], [54, 110, 5], [24, 110, 5]], '#0895A6');
      s += faceText(26, 110, 7.4, 'stack', 6.2, '#0E2440', '#0895A6');
      s += box(56, 102, 1.8, 10, 8, 11, ['#1B416B', '#0E2440', '#16355A']) + poly([[66, 103, 7], [66, 109, 7], [66, 109, 11], [66, 103, 11]], '#BCE5E0');
      [[28, 110], [50, 110], [61, 110]].forEach(([x, y]) => { const w = P(x, y, 1.8); s += `<circle cx="${w[0].toFixed(1)}" cy="${w[1].toFixed(1)}" r="2.6" fill="#0E2440"/>`; });
    }
    return s + `</svg>`;
  };
  /** Flat vehicle icons used on the app map (rotate along the route). */
  const ICON = SM.ICON = {
    road: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="22" viewBox="0 0 48 22"><rect x="1" y="2" width="31" height="15" rx="2.5" fill="#FFFFFF" stroke="#0E2440" stroke-width="1.4"/><rect x="4" y="12" width="25" height="2.2" rx="1" fill="#0895A6"/><text x="5.5" y="9.6" font-family="Readex Pro,sans-serif" font-weight="600" font-size="6.2" letter-spacing="-.2" fill="#0E2440">stack<tspan fill="#0895A6">o</tspan></text><path d="M33 5 H40 L46 11 V17 H33 Z" fill="#0E2440"/><path d="M36 7 H39.5 L43.5 11 H36 Z" fill="#BCE5E0"/><circle cx="9" cy="18.5" r="2.6" fill="#0E2440"/><circle cx="24" cy="18.5" r="2.6" fill="#0E2440"/><circle cx="40" cy="18.5" r="2.6" fill="#0E2440"/></svg>`,
    sea: `<svg xmlns="http://www.w3.org/2000/svg" width="58" height="24" viewBox="0 0 58 24"><path d="M2 12 H46 L56 17 L50 22 H6 Z" fill="#0E2440"/><rect x="5" y="5" width="8" height="7" fill="#2F86B8"/><rect x="14" y="5" width="8" height="7" fill="#0895A6"/><rect x="23" y="5" width="8" height="7" fill="#FFFFFF" stroke="#C9D8E4" stroke-width=".6"/><rect x="14" y="0" width="8" height="5" fill="#79C0DE"/><rect x="5" y="0" width="8" height="5" fill="#FFFFFF" stroke="#C9D8E4" stroke-width=".6"/><rect x="34" y="2" width="9" height="10" rx="1" fill="#FFFFFF"/><rect x="35.5" y="4" width="6" height="2" fill="#2F86B8"/><path d="M6 17 H50" stroke="#2EF2EE" stroke-width="1.2"/></svg>`,
    air: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 36 36"><path d="M34 18 L27 16 L19 16 L12 4 L8.5 4 L12.5 16 L6 16 L3 11.5 L1 11.5 L2.5 18 L1 24.5 L3 24.5 L6 20 L12.5 20 L8.5 32 L12 32 L19 20 L27 20 Z" fill="#0E2440" stroke="#FFFFFF" stroke-width="1.2" stroke-linejoin="round"/><path d="M22 18 H30" stroke="#2EF2EE" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  };

  /* ---------------------------------------------------------------- geography (demo data) */
  const PT = SM.PT = { PORT: [33.903, 35.518], AIR: [33.821, 35.488], W1: [33.888, 35.548], W2: [33.553, 35.395], W3: [34.437, 35.845] };
  const NAMES = SM.WH_NAMES = {
    W1: { code: 'WH-01', en: 'Beirut', ar: 'بيروت', units: 7250 }, W2: { code: 'WH-02', en: 'Sidon', ar: 'صيدا', units: 4980 }, W3: { code: 'WH-03', en: 'Tripoli', ar: 'طرابلس', units: 3120 },
    PORT: { en: 'Port of Beirut', ar: 'مرفأ بيروت' }, AIR: { en: 'Beirut Airport', ar: 'مطار بيروت' },
  };
  const COAST = [[34.95, 35.90], [34.75, 35.93], [34.64, 35.97], [34.55, 35.92], [34.47, 35.84], [34.45, 35.80], [34.43, 35.81], [34.36, 35.73], [34.30, 35.68], [34.25, 35.66], [34.12, 35.64], [34.04, 35.64], [33.98, 35.61], [33.95, 35.59], [33.91, 35.54], [33.905, 35.50], [33.898, 35.468], [33.87, 35.48], [33.83, 35.48], [33.78, 35.46], [33.70, 35.44], [33.64, 35.41], [33.57, 35.37], [33.52, 35.36], [33.45, 35.29], [33.36, 35.24], [33.27, 35.20], [33.20, 35.17], [33.09, 35.10], [32.9, 35.05]];
  const LEB = [[34.64, 35.97], ...COAST.slice(3, 29), [33.09, 35.50], [33.27, 35.62], [33.33, 35.82], [33.45, 35.92], [33.62, 36.07], [33.83, 36.22], [34.0, 36.40], [34.20, 36.62], [34.42, 36.58], [34.52, 36.40], [34.63, 36.30], [34.69, 36.0]];
  const SOUTH = [PT.W1, [33.880, 35.515], [33.845, 35.497], [33.80, 35.478], [33.77, 35.465], [33.70, 35.45], [33.65, 35.42], [33.60, 35.40], PT.W2];
  const NORTH = [PT.W1, [33.915, 35.565], [33.94, 35.59], [33.98, 35.627], [34.03, 35.637], [34.12, 35.652], [34.255, 35.668], [34.33, 35.73], [34.39, 35.79], PT.W3];
  const LANE = [[33.99, 34.0], [33.99, 34.5], [33.975, 34.9], [33.965, 35.2], [33.94, 35.4], [33.92, 35.47], [33.91, 35.5], PT.PORT];
  function bez(a, c, b, n = 60) { const r = []; for (let i = 0; i <= n; i++) { const s = i / n, u = 1 - s; r.push([u * u * a[0] + 2 * u * s * c[0] + s * s * b[0], u * u * a[1] + 2 * u * s * c[1] + s * s * b[1]]); } return r; }
  const AIRP = bez([34.9, 37.2], [34.3, 35.98], PT.AIR);
  function road(a, b) {
    if (a === 'PORT') return [PT.PORT, [33.897, 35.53], ...(b === 'W1' ? [PT.W1] : road('W1', b))];
    if (a === 'AIR') { if (b === 'W2') return [PT.AIR, ...SOUTH.slice(3)]; return [PT.AIR, [33.845, 35.497], [33.880, 35.515], ...(b === 'W1' ? [PT.W1] : road('W1', b))]; }
    if (a === 'W1') return b === 'W2' ? SOUTH : NORTH;
    if (b === 'W1') return [...road('W1', a)].reverse();
    if (a === 'W2') return [...SOUTH].reverse().concat(NORTH.slice(1));
    return [...NORTH].reverse().concat(SOUTH.slice(1));
  }
  SM.road = road;
  SM.LEB = LEB;   // Lebanon outline [lat, lon] — used by dotMorph('lebanon')
  const K = 1150, LAT0 = 34.78, LON0 = 34.95, COS = 0.829;
  const XY = SM.mapXY = (la, lo) => [(lo - LON0) * COS * K, (LAT0 - la) * K];
  const toPts = arr => arr.map(p => XY(p[0], p[1]));
  const dstr = a => 'M' + a.map(p => f2(p[0]) + ',' + f2(p[1])).join('L');
  function geo(points) { const cum = [0]; for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])); return { pts: points, cum, total: cum[cum.length - 1] }; }
  function at(g, f) { if (!g.total) return [g.pts[0][0], g.pts[0][1], 0]; const d = clamp(f) * g.total; let i = 0; while (i < g.cum.length - 2 && g.cum[i + 1] < d) i++; const s = (d - g.cum[i]) / ((g.cum[i + 1] - g.cum[i]) || 1), a = g.pts[i], b = g.pts[i + 1]; return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI]; }
  const fmtETA = m => { m = Math.max(0, Math.round(m)); const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60; return d ? `${d}d ${h}h` : h ? `${h}h ${mm}m` : `${Math.max(1, mm)}m`; };
  SM.fmtETA = fmtETA;

  SM.addCSS(`
.sm-map{position:absolute;inset:0;background:#DCEBF1;overflow:hidden;z-index:0;isolation:isolate}
.sm-map .world{position:absolute;left:0;top:0;transform-origin:0 0}
.sm-map .world>svg{position:absolute;overflow:visible}
.sm-map .wh{position:absolute;width:194px;height:132px;transform-origin:105.7px 69px}
.sm-map .wh svg.scene{display:block;filter:drop-shadow(0 6px 8px rgba(14,36,64,.2))}
.sm-map .ui{position:absolute;inset:0}
.sm-map .chip{position:absolute;left:0;top:0;transform:translate(-50%,-100%);display:flex;gap:10px;align-items:center;background:#fff;color:#0E2440;border-radius:999px;padding:9px 10px 9px 20px;font-weight:600;font-size:28px;white-space:nowrap;box-shadow:0 6px 22px rgba(22,59,98,.26)}
.sm-map .chip .u{background:#EEF6F9;border-radius:999px;padding:2px 14px;font-weight:700;font-variant-numeric:tabular-nums}
.sm-map .chip .dot{background:#C2334A;color:#fff;border-radius:999px;padding:2px 12px;font-size:24px;font-weight:700}
.sm-map .chip.sel{background:#0E2440;color:#fff}.sm-map .chip.sel .u{background:#2F86B8;color:#fff}
.sm-map .chip.ar{direction:rtl;font-family:'Noto Kufi Arabic','Readex Pro',sans-serif}
.sm-map .veh{position:absolute;left:0;top:0;width:0;height:0}
.sm-map .veh .rot{position:absolute;left:0;top:0;line-height:0;filter:drop-shadow(0 4px 6px rgba(14,36,64,.35))}
.sm-map .veh .rot.glow{filter:drop-shadow(0 0 10px rgba(46,242,238,.95)) drop-shadow(0 4px 6px rgba(14,36,64,.35))}
.sm-map .veh .tag{position:absolute;left:0;top:0;transform:translate(-50%,-100%);background:#0E2440;color:#fff;font-size:26px;font-weight:600;padding:5px 16px;border-radius:999px;white-space:nowrap;font-variant-numeric:tabular-nums;box-shadow:0 4px 14px rgba(14,36,64,.3)}
.sm-map .veh .tag.sel{background:#0895A6}.sm-map .veh .tag.done{background:#BCE5E0;color:#0E2440}
.sm-map .poi{position:absolute;left:0;top:0;transform:translate(-100%,-50%);display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.96);border:1.5px solid #C9D8E4;border-radius:12px;padding:6px 14px;font-size:24px;font-weight:600;color:#0E2440;white-space:nowrap}
.sm-map .poi i{width:14px;height:14px;border-radius:50%;background:#0E2440}.sm-map .poi i.sea{background:#0895A6}
.sm-map .ring{position:absolute;left:0;top:0;width:0;height:0}
.sm-map .ring b{position:absolute;left:-60px;top:-60px;width:120px;height:120px;border-radius:50%;border:5px solid #2EF2EE}
.sm-map .toast{position:absolute;left:50%;transform:translateX(-50%);background:#0E2440;color:#fff;font-weight:600;font-size:32px;padding:20px 32px;border-radius:22px;white-space:nowrap;box-shadow:0 14px 40px rgba(14,36,64,.4);display:flex;align-items:center;gap:14px}
.sm-map .toast i{width:16px;height:16px;border-radius:50%;background:#2EF2EE;flex:none}
.sm-map .hdr{position:absolute;left:36px;right:36px;background:#fff;border-radius:30px;box-shadow:0 14px 40px rgba(22,59,98,.22);padding:20px 22px;display:flex;flex-direction:column;gap:16px;color:#0E2440}
.sm-map .hdr .top{display:flex;align-items:center;gap:14px}
.sm-map .hdr .top .sm-word{font-size:44px}
.sm-map .hdr.ar{direction:rtl;font-family:'Noto Kufi Arabic','Readex Pro',sans-serif}.sm-map .hdr .top .sm-word-ar{font-size:38px}.sm-map .hdr.ar .live{margin-left:0;margin-right:auto}.sm-map .hdr.ar .kpi b{direction:ltr;text-align:right}
.sm-map .hdr .live{margin-left:auto;display:flex;align-items:center;gap:10px;font-size:24px;font-weight:600;color:#2C5974}
.sm-map .hdr .live i{width:14px;height:14px;border-radius:50%;background:#0895A6}
.sm-map .hdr .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.sm-map .hdr .kpi{background:#EEF6F9;border-radius:18px;padding:12px 16px}
.sm-map .hdr .kpi b{display:block;font-size:40px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.sm-map .hdr .kpi small{font-size:21px;color:#2C5974;font-weight:500}
.sm-map .hdr .kpi.alert b{color:#C2334A}
`);

  /* ---------------------------------------------------------------- the map component */
  SM.Scene.prototype.map = function (o = {}) {
    const s = this, R = s.R, W = R.w, H = R.h, lang = o.lang || SM.lang || 'en', whScale = o.whScale || 1.25;
    const host = mk('div', 'sm-map', o.parent || s.el), world = mk('div', 'world', host), ui = mk('div', 'ui', host);
    const minX = -1100, minY = -700, ww = 3300, wh = 3200;
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('width', ww); svg.setAttribute('height', wh); svg.setAttribute('viewBox', `${minX} ${minY} ${ww} ${wh}`); svg.style.left = minX + 'px'; svg.style.top = minY + 'px'; world.appendChild(svg);
    const coast = toPts(COAST), leb = toPts(LEB);
    let g = `<rect x="${minX}" y="${minY}" width="${ww}" height="${wh}" fill="#DCEBF1"/>`;
    for (let la = 32.75; la <= 35.25; la += .25) { const y = XY(la, 35)[1]; g += `<line class="grid" x1="${minX}" x2="${minX + ww}" y1="${f2(y)}" y2="${f2(y)}" stroke="#C3D9E3"/>`; }
    for (let lo = 33.5; lo <= 37.5; lo += .25) { const x = XY(34, lo)[0]; g += `<line class="grid" y1="${minY}" y2="${minY + wh}" x1="${f2(x)}" x2="${f2(x)}" stroke="#C3D9E3"/>`; }
    g += `<path class="land" d="${dstr(coast)}L${minX + ww},${minY + wh}L${minX + ww},${minY}Z" fill="#E7EDF1" stroke="#B9CDD8"/>`;
    g += `<path class="leb" d="${dstr(leb)}Z" fill="#FFFFFF" stroke="#9FB6C6"/>`;
    const lab = (la, lo, t, cls, fs, ls) => { const p = XY(la, lo); return `<text class="lbl" data-fs="${fs}" x="${f2(p[0])}" y="${f2(p[1])}" fill="${cls}" font-family="Readex Pro,sans-serif" font-weight="600" letter-spacing="${ls}" text-anchor="middle">${t}</text>`; };
    g += lab(34.05, 36.08, lang === 'ar' ? 'لبنان' : 'LEBANON', '#9FB6C6', 34, lang === 'ar' ? 0 : 10) + lab(34.6, 36.75, lang === 'ar' ? 'سوريا' : 'SYRIA', '#B9CDD8', 26, 6);
    const ms = XY(33.75, 34.75); g += `<text class="lbl" data-fs="30" x="${f2(ms[0])}" y="${f2(ms[1])}" fill="#8FB1C2" font-family="Readex Pro,sans-serif" font-style="italic" text-anchor="middle">${lang === 'ar' ? 'البحر المتوسط' : 'Mediterranean Sea'}</text>`;
    g += `<path class="lane" d="${dstr(toPts(LANE))}" fill="none" stroke="#0895A6" stroke-linecap="round"/>`;
    g += `<path class="airp" d="${dstr(toPts(AIRP))}" fill="none" stroke="#5C7591" stroke-linecap="round"/>`;
    const roads = [SOUTH, NORTH, road('PORT', 'W1'), road('AIR', 'W1')].map(toPts);
    roads.forEach(r => { g += `<path class="rw" d="${dstr(r)}" fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>`; });
    roads.forEach(r => { g += `<path class="rn" d="${dstr(r)}" fill="none" stroke="#0E2440" stroke-opacity=".72" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>`; });
    g += `<g class="hl"></g>`;
    ['PORT', 'AIR'].forEach(k => { const p = XY(...PT[k]); g += `<circle class="poidot" data-r="9" cx="${f2(p[0])}" cy="${f2(p[1])}" fill="${k === 'PORT' ? '#0895A6' : '#0E2440'}" stroke="#fff"/>`; });
    svg.innerHTML = g;
    const Q = sel => [...svg.querySelectorAll(sel)], hlG = svg.querySelector('g.hl');
    if (o.fade !== false) { const fd = mk('div', '', host); fd.style.cssText = `position:absolute;left:0;right:0;top:0;height:${o.fadeH || 620}px;background:linear-gradient(180deg,rgba(244,248,250,.96) 0%,rgba(244,248,250,.82) 45%,rgba(244,248,250,0) 100%);pointer-events:none;z-index:2`; ui.style.zIndex = 3; }

    /* warehouses */
    const WHK = o.warehouses || ['W1', 'W2', 'W3'], whs = {};
    WHK.forEach((k, i) => {
      const p = XY(...PT[k]), el = mk('div', 'wh', world, SM.appScene(NAMES[k].code, o.scene || {}));
      el.style.left = f2(p[0] - 105.7) + 'px'; el.style.top = f2(p[1] - 69) + 'px'; s.set(el, { s: whScale });
      const cw = mk('div', '', ui); cw.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0';
      const chip = mk('div', 'chip' + (lang === 'ar' ? ' ar' : ''), cw, `<span>${NAMES[k].code} · ${lang === 'ar' ? NAMES[k].ar : NAMES[k].en}</span><span class="u"></span><span class="dot"></span>`);
      whs[k] = { p, el, chip, cw, u: chip.querySelector('.u'), dot: chip.querySelector('.dot'), base: (o.units && o.units[k]) ?? NAMES[k].units, chg: [], low: [{ t: -1, n: (o.low && o.low[k]) ?? 0 }], sel: [], lastU: '', lastL: '' };
    });
    /* POI labels */
    const pois = ['PORT', 'AIR'].map(k => ({ k, p: XY(...PT[k]), el: mk('div', 'poi', ui, `<i class="${k === 'PORT' ? 'sea' : ''}"></i>${lang === 'ar' ? NAMES[k].ar : NAMES[k].en}`) }));
    if (o.pois === false) pois.forEach(q => q.el.style.display = 'none');

    /* camera */
    const fitZoom = () => { const ps = WHK.map(k => whs[k].p); const sx = Math.max(...ps.map(p => p[0])) - Math.min(...ps.map(p => p[0])) + 360, sy = Math.max(...ps.map(p => p[1])) - Math.min(...ps.map(p => p[1])) + 260; return Math.min(W * .95 / sx, (H * (o.fitH || .56)) / sy); };
    const focusOf = (f, z) => { if (Array.isArray(f)) return f.length === 2 && Math.abs(f[0]) < 90 && f[1] > 20 && f[1] < 60 ? XY(f[0], f[1]) : f; if (f === 'all' || !f) { const ps = WHK.map(k => whs[k].p); const xs = ps.map(p => p[0]), ys = ps.map(p => p[1]); const zz = z || fitZoom(); return [(Math.min(...xs) + Math.max(...xs)) / 2 + 30, (Math.min(...ys) + Math.max(...ys)) / 2 - (o.textSpace ?? .09) * H / zz]; } if (PT[f]) return XY(...PT[f]); return [0, 0]; };
    const v0 = o.view || 'all', z0 = o.zoom || (v0 === 'all' ? fitZoom() : 1.6);
    const cams = [{ s: -1, d: 0, f: focusOf(v0, z0), z: z0, e: E.inOutCubic }];
    const follows = [];
    const api = {
      el: host, world, ui, svg,
      camera(at, c = {}) { const prev = cams[cams.length - 1], z = c.zoom ?? (c.focus === 'all' ? fitZoom() : prev.z); let f = c.focus != null ? focusOf(c.focus, z) : prev.f; if (c.offset) f = [f[0] - c.offset[0] / z, f[1] - c.offset[1] / z]; cams.push({ s: s.T(at), d: c.dur ?? 1.3, f, z, e: SM.easeFn(c.ease || 'inOutCubic') }); return api; },
      zoomAll(at, dur = 1.3) { return api.camera(at, { focus: 'all', zoom: fitZoom(), dur }); },
    };
    let cur = { f: cams[0].f, z: z0 };
    function camAt(t) {
      let k = 0; for (let i = 0; i < cams.length; i++) if (cams[i].s <= t) k = i;
      const c = cams[k], prev = cams[k - 1] || cams[0];
      if (!k) return { f: c.f, z: c.z };
      const p = c.e(clamp((t - c.s) / c.d)), pf = prev.f, pz = prev.z;
      return { f: [pf[0] + (c.f[0] - pf[0]) * p, pf[1] + (c.f[1] - pf[1]) * p], z: Math.exp(Math.log(pz) + (Math.log(c.z) - Math.log(pz)) * p) };
    }
    const proj = (x, y) => [W / 2 + (x - cur.f[0]) * cur.z, H / 2 + (y - cur.f[1]) * cur.z];

    /* model helpers */
    const unitsAt = (k, t) => { const w = whs[k]; let u = w.base; for (const c of w.chg) u += c.v * E.outCubic(clamp((t - c.t) / c.d)); return u; };
    const lowAt = (k, t) => { let n = 0; for (const c of whs[k].low) if (c.t <= t) n = c.n; return n; };
    const selAt = (k, t) => { let v = false; for (const c of whs[k].sel) if (c.t <= t) v = c.v; return v; };
    const vehicles = [], rings = [], toasts = [];

    /* intro */
    const intro = o.intro || 'none', ia = o.at || 0;
    if (intro === 'drop' || intro === 'draw') {
      WHK.forEach((k, i) => { const w = whs[k]; s.anim(w.el, { o: [0, 1] }, ia + .3 + i * .22, .12).anim(w.el, { y: [-500, 0] }, ia + .3 + i * .22, .85, 'outBounce'); s.sfx('thud', ia + .3 + i * .22 + .32, .45); s.anim(w.cw, { o: [0, 1], s: [.6, 1] }, ia + .95 + i * .22, .45, 'outBack'); });
      pois.forEach((q, i) => s.anim(q.el, { o: [0, 1] }, ia + 1.2 + i * .1, .4));
      const rd = Q('path.rw,path.rn'); s.on(ia, ia + 1.4, p => { const e = E.inOutCubic(p); rd.forEach(r => { r.setAttribute('stroke-dasharray', '1 1'); r.setAttribute('stroke-dashoffset', String(1 - e)); }); });
      if (intro === 'draw') { const lb = Q('path.leb,path.land'); lb.forEach(pth => { pth.setAttribute('pathLength', '1'); }); s.on(ia - .01, ia + 1.1, p => { const e = E.inOutQuad(p); lb.forEach(pth => { pth.setAttribute('stroke-dasharray', '1 1'); pth.setAttribute('stroke-dashoffset', String(1 - e)); pth.setAttribute('fill-opacity', String(e)); }); }); }
    }

    /* vehicles */
    function addVeh(kind, path, v) {
      const gg = geo(path), a0 = s.T(v.at || 0), d = v.dur || 4, f = SM.easeFn(v.ease || (kind === 'road' ? 'inOutSine' : 'linear'));
      const el = mk('div', 'veh', ui), rot = mk('div', 'rot', el, ICON[kind]), tag = v.tag === false ? null : mk('div', 'tag', el);
      if (v.glow) rot.classList.add('glow'); if (tag && v.glow) tag.classList.add('sel');
      const hl = v.glow ? (() => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', dstr(path)); p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#2EF2EE'); p.setAttribute('stroke-opacity', '.85'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round'); hlG.appendChild(p); return p; })() : null;
      const veh = { kind, gg, a0, d, f, el, rot, tag, hl, v, w: kind === 'air' ? 40 : kind === 'sea' ? 58 : 48, h: kind === 'air' ? 40 : kind === 'sea' ? 24 : 22, last: '' };
      vehicles.push(veh); return veh;
    }
    api.truck = (v = {}) => {
      const from = v.from || 'W1', to = v.to || 'W2', path = v.path ? toPts(v.path) : toPts(road(from, to)), veh = addVeh('road', path, v);
      const q = v.qty || 0; if (q && whs[from] && v.stock !== false) whs[from].chg.push({ t: veh.a0, d: .5, v: -q }); if (q && whs[to] && v.stock !== false) whs[to].chg.push({ t: veh.a0 + veh.d, d: .6, v: q });
      if (v.toast !== false && whs[to]) api.toast((v.at || 0) + veh.d + .15, v.toastText || (lang === 'ar' ? `وصلت: ${q ? q + ' × ' : ''}${v.item || 'بضاعة'} ← ${NAMES[to].code} ${NAMES[to].ar}` : `Delivered: ${q ? q + ' × ' : ''}${v.item || 'stock'} → ${NAMES[to].code} ${NAMES[to].en}`), v.toastDur || 2.2);
      if (v.follow) follows.push({ veh, s: veh.a0 - .4, e: veh.a0 + veh.d + .2, z: v.followZoom || 2.6, off: v.followOffset || o.followOffset || [0, 0] });
      s.sfx('engine', v.at || 0, .4); return veh;
    };
    api.ship = (v = {}) => { const veh = addVeh('sea', toPts(LANE), Object.assign({ eta: 2880 }, v)); if (v.follow) follows.push({ veh, s: veh.a0 - .4, e: veh.a0 + veh.d + .2, z: v.followZoom || 1.6, off: v.followOffset || o.followOffset || [0, 0] }); return veh; };
    api.plane = (v = {}) => { const veh = addVeh('air', toPts(AIRP), Object.assign({ eta: 95 }, v)); if (v.follow) follows.push({ veh, s: veh.a0 - .4, e: veh.a0 + veh.d + .2, z: v.followZoom || 1.6, off: v.followOffset || o.followOffset || [0, 0] }); s.sfx('whoosh', v.at || 0, .4); return veh; };
    api.units = (k, at, delta, d = .8) => { whs[k].chg.push({ t: s.T(at), d, v: delta }); return api; };
    api.low = (k, at, n) => { whs[k].low.push({ t: s.T(at), n }); api.pulse(k, at, C.red); s.sfx('ding', at, .5); return api; };
    api.select = (k, at, v = true) => { whs[k].sel.push({ t: s.T(at), v }); return api; };
    api.pulse = (k, at, color) => { const r = mk('div', 'ring', ui, '<b></b>'); if (color) r.firstChild.style.borderColor = color; const rr = { k, el: r, b: r.firstChild }; rings.push(rr); s.set(rr.b, { o: 0 }); for (let i = 0; i < 2; i++) { const a = at + i * .5; s.anim(rr.b, { s: [.3, 3.2], o: [1, 0] }, a, 1.1, 'outCubic'); } return api; };
    api.toast = (at, text, dur = 2.2) => { const tw = mk('div', '', ui); tw.style.cssText = `position:absolute;left:0;right:0;bottom:${o.toastY ?? 470}px;height:0`; const t = mk('div', 'toast', tw, `<i></i>${esc(text)}`); t.style.bottom = '0'; if (SM.isAr(text)) { t.style.direction = 'rtl'; t.style.fontFamily = "'Noto Kufi Arabic','Readex Pro',sans-serif"; } s.set(tw, { o: 0 }); s.anim(tw, { o: [0, 1], y: [60, 0] }, at, .45, 'outBack').anim(tw, { o: 0, y: 30 }, at + dur, .35, 'inQuad'); s.sfx('pop', at, .5); toasts.push(tw); return tw; };
    api.header = (h = {}) => {
      const el = mk('div', 'hdr' + (lang === 'ar' ? ' ar' : ''), ui, `<div class="top">${SM.mark('light', 52)}${lang === 'ar' ? SM.wordmarkAr('light') : SM.wordmark('light')}<span class="live"><i></i>${lang === 'ar' ? 'مباشر' : 'Live'}</span></div><div class="kpis"><div class="kpi"><b class="k1"></b><small>${lang === 'ar' ? 'في المخزون' : 'Units in stock'}</small></div><div class="kpi"><b class="k2"></b><small>${lang === 'ar' ? 'قيد النقل' : 'In transit'}</small></div><div class="kpi alert"><b class="k3"></b><small>${lang === 'ar' ? 'أصناف منخفضة' : 'Low-stock lines'}</small></div></div>`);
      el.style.top = (h.y ?? 250) + 'px'; const k1 = el.querySelector('.k1'), k2 = el.querySelector('.k2'), k3 = el.querySelector('.k3'), live = el.querySelector('.live i');
      if (h.at != null) { s.set(el, { o: 0 }); s.anim(el, { o: [0, 1], y: [-60, 0] }, h.at, .6, 'outQuart'); }
      let l1 = '', l2 = '', l3 = '';
      s.on(-1, s.dur + 1, (p, lt, t) => {
        const a = SM.fmtNum(WHK.reduce((x, k) => x + unitsAt(k, t), 0), {}), b = SM.fmtNum(vehicles.filter(v => v.kind === 'road' && t >= v.a0 && t < v.a0 + v.d).reduce((x, v) => x + (v.v.qty || 0), 0), {}), c = String(WHK.reduce((x, k) => x + lowAt(k, t), 0));
        if (a !== l1) k1.textContent = l1 = a; if (b !== l2) k2.textContent = l2 = b; if (c !== l3) k3.textContent = l3 = c; live.style.opacity = Math.floor(t * 2) % 2 ? .35 : 1;
      });
      return el;
    };
    api.whs = whs;
    api.screenOf = (k, t) => { const c = camAt(t); return [W / 2 + (whs[k].p[0] - c.f[0]) * c.z, H / 2 + (whs[k].p[1] - c.f[1]) * c.z]; };

    /* per-frame */
    const strokes = { rw: [Q('path.rw'), 18, null], rn: [Q('path.rn'), 7.5, null], lane: [Q('path.lane'), 5.5, [16, 16]], airp: [Q('path.airp'), 4.5, [3, 13]], leb: [Q('path.leb'), 3, [14, 10]], land: [Q('path.land'), 2, null], grid: [Q('line.grid'), 1.2, null] };
    let lastZ = -1;
    s.on(-1, s.dur + 1, (p, lt, t) => {
      // camera with follows
      cur = camAt(t);
      for (const fl of follows) { if (t < fl.s - .6 || t > fl.e + .8) continue; const w = clamp((t - (fl.s - .6)) / .6) * (1 - clamp((t - fl.e) / .8)); const vp0 = at(fl.veh.gg, fl.veh.f(clamp((t - fl.veh.a0) / fl.veh.d))), vp = [vp0[0] - fl.off[0] / fl.z, vp0[1] - fl.off[1] / fl.z]; const k = E.inOutCubic(w); cur = { f: [cur.f[0] + (vp[0] - cur.f[0]) * k, cur.f[1] + (vp[1] - cur.f[1]) * k], z: Math.exp(Math.log(cur.z) + (Math.log(fl.z) - Math.log(cur.z)) * k) }; }
      const z = cur.z; world.style.transform = `translate(${f2(W / 2 - cur.f[0] * z)}px,${f2(H / 2 - cur.f[1] * z)}px) scale(${Math.round(z * 10000) / 10000})`;
      if (Math.abs(z - lastZ) > 1e-4) { lastZ = z; for (const k in strokes) { const [els, w, dash] = strokes[k]; els.forEach(e => { e.setAttribute('stroke-width', f2(w / z)); if (dash) e.setAttribute('stroke-dasharray', dash.map(d => f2(d / z)).join(' ')); }); } Q('text.lbl').forEach(e => e.setAttribute('font-size', f2(+e.dataset.fs / z))); Q('circle.poidot').forEach(e => { e.setAttribute('r', f2(9 / z)); e.setAttribute('stroke-width', f2(3 / z)); }); [...hlG.children].forEach(e => e.setAttribute('stroke-width', f2(16 / z))); }
      // chips
      for (const k of WHK) { const w = whs[k], sp = proj(w.p[0], w.p[1] - 66 * whScale); w.cw.style.left = f2(sp[0]) + 'px'; w.cw.style.top = f2(sp[1] - 8) + 'px'; const u = SM.fmtNum(unitsAt(k, t), {}), l = lowAt(k, t); if (u !== w.lastU) { w.u.textContent = u; w.lastU = u; } if (String(l) !== w.lastL) { w.dot.textContent = l; w.dot.style.display = l ? '' : 'none'; w.lastL = String(l); } w.chip.classList.toggle('sel', selAt(k, t)); }
      for (const q of pois) { const sp = proj(q.p[0] - 14, q.p[1]); q.el.style.left = f2(sp[0]) + 'px'; q.el.style.top = f2(sp[1]) + 'px'; }
      for (const r of rings) { const sp = proj(whs[r.k].p[0], whs[r.k].p[1]); r.el.style.left = f2(sp[0]) + 'px'; r.el.style.top = f2(sp[1]) + 'px'; }
      // vehicles
      const vs = (o.vehScale || 2.1) * Math.pow(z, .45);
      for (const v of vehicles) {
        const lp = (t - v.a0) / v.d, vis = lp >= -1e-6 && lp <= 1 + (v.v.hold ?? .25) / v.d;
        v.el.style.display = vis ? '' : 'none'; if (!vis) { if (v.hl) v.hl.style.display = 'none'; continue; }
        const pp = v.f(clamp(lp)), q = at(v.gg, pp), sp = proj(q[0], q[1]);
        v.el.style.left = f2(sp[0]) + 'px'; v.el.style.top = f2(sp[1]) + 'px';
        let ang = q[2]; const rt = Math.abs(ang) > 90 ? `rotate(${f2(ang + 180)}deg) scale(${f2(-vs)},${f2(vs)})` : `rotate(${f2(ang)}deg) scale(${f2(vs)})`;
        v.rot.style.transform = `translate(${f2(-v.w / 2)}px,${f2(-v.h / 2)}px) ${rt}`; v.rot.style.transformOrigin = `${v.w / 2}px ${v.h / 2}px`;
        const fade = clamp(lp / .06) * (1 - clamp((lp - 1) / ((v.v.hold ?? .25) / v.d))); v.el.style.opacity = f2(fade);
        if (v.tag) { v.tag.style.top = f2(-v.h * vs * .5 - 18) + 'px'; const rem = (v.v.eta ?? 60) * (1 - pp); const txt = lp >= 1 ? (v.v.doneText || (lang === 'ar' ? 'وصلت ✓' : 'Arrived ✓')) : ((v.v.label ? v.v.label + ' · ' : '') + fmtETA(rem)); if (txt !== v.last) { v.tag.textContent = txt; v.last = txt; v.tag.classList.toggle('done', lp >= 1); } }
        if (v.hl) { v.hl.style.display = ''; v.hl.style.opacity = f2(clamp(lp / .1) * (1 - clamp((lp - 1) / .3))); }
      }
    });
    return api;
  };
})(typeof window !== 'undefined' ? window : globalThis);
