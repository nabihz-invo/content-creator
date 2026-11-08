// Shared SVG art + icons for Stacko slides (v2: no red/orange/yellow; alerts use Deep #2C5974).
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rich = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');
// ---------- illustration library (inline SVG, 900x380 art box) ----------
const CUBE = (x, y, s = 1, o = 1) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><path d="M0 -84 L60 -50 L0 -16 L-60 -50Z" fill="#79C0DE"/><path d="M-60 -50 L0 -16 L0 34 L-60 0Z" fill="#2F86B8"/><path d="M60 -50 L0 -16 L0 34 L60 0Z" fill="#0895A6"/></g>`;
const F = (lang) => lang === 'ar' ? 'Noto Kufi Arabic' : 'Readex Pro';
const ART = {
  cubes: () => `<g fill="none" stroke="rgba(121,192,222,.35)" stroke-width="2" stroke-dasharray="6 10"><path d="M210 470 L420 330"/><path d="M420 330 L700 430"/><path d="M420 330 L560 170"/></g>${CUBE(210, 470)}${CUBE(420, 330)}${CUBE(700, 430)}${CUBE(560, 170)}`,
  network: () => `<path d="M150 300 L450 170 L750 290 L450 360Z" fill="none" stroke="#2EF2EE" stroke-width="5" stroke-linecap="round"/>${CUBE(150, 320, 1.1)}${CUBE(450, 190, 1.1)}${CUBE(750, 310, 1.1)}${CUBE(450, 380, 1.1)}<g transform="translate(450 70)"><path d="M0 44 C-24 16 -30 5 -30 -10 A30 30 0 0 1 30 -10 C30 5 24 16 0 44Z" fill="#2EF2EE"/><circle cy="-10" r="11" fill="#0E2440"/></g>`,
  fog: () => `<defs><filter id="fg"><feGaussianBlur stdDeviation="7"/></filter></defs><g filter="url(#fg)" opacity=".55">${CUBE(140, 260)}${CUBE(400, 150)}${CUBE(620, 290)}${CUBE(800, 140)}</g><g transform="translate(450 180)"><circle r="78" fill="none" stroke="#0E2440" stroke-width="10"/><path d="M55 55 L120 120" stroke="#0E2440" stroke-width="14" stroke-linecap="round"/></g>`,
  transfer: (l, t = []) => `${CUBE(150, 240, 1.4)}${CUBE(750, 240, 1.4)}${t[3] === 'ok' ? '<path d="M250 200 C380 110 520 110 650 200" fill="none" stroke="#0895A6" stroke-width="6" stroke-linecap="round"/><circle cx="450" cy="134" r="40" fill="#0895A6"/><path d="M432 135 L446 149 L470 122" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M250 200 C380 110 520 110 650 200" fill="none" stroke="#0895A6" stroke-width="4" stroke-dasharray="10 12" stroke-linecap="round"/><circle cx="450" cy="134" r="40" fill="#fff" stroke="#2C5974" stroke-width="3"/><text x="450" y="152" text-anchor="middle" font-family="Readex Pro" font-weight="700" font-size="50" fill="#2C5974">?</text>'}<g font-family="${F(l)}" font-size="26" font-weight="600" fill="#4F6E86" text-anchor="middle"><text x="${l === 'ar' ? 750 : 150}" y="335">${esc(t[0] || '')}</text><text x="${l === 'ar' ? 150 : 750}" y="335">${esc(t[1] || '')}</text><text x="450" y="230">${esc(t[2] || '')}</text></g>`,
  sheets: (l, t = []) => [0, 1, 2].map(i => `<g transform="translate(${i * 320} ${[40, 0, 60][i]})"><rect width="250" height="270" rx="22" fill="#fff" stroke="#C9D8E4" stroke-width="2"/><text x="${l === 'ar' ? 222 : 28}" y="50" ${l === 'ar' ? 'text-anchor="start" direction="rtl"' : ''} font-family="${F(l)}" font-size="22" font-weight="600" fill="#4F6E86">${esc(t[i] || '')}</text><g fill="#EEF6F9"><rect x="28" y="80" width="194" height="22" rx="6"/><rect x="28" y="120" width="150" height="22" rx="6"/><rect x="28" y="160" width="194" height="22" rx="6"/><rect x="28" y="200" width="120" height="22" rx="6"/></g></g>`).join('') + `<g fill="none" stroke="#0895A6" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round"><path d="M250 180 C285 150 290 150 320 140"/><path d="M570 150 C600 170 610 190 640 200"/></g>`,
  chat: (l, t = []) => {
    const rtl = l === 'ar', a = rtl ? 'start' : 'start', d = rtl ? 'direction="rtl"' : '';
    const b = (x, y, w, txt, me) => `<rect x="${x}" y="${y}" width="${w}" height="84" rx="30" fill="${me ? '#BCE5E0' : '#fff'}" ${me ? '' : 'stroke="#C9D8E4" stroke-width="2"'}/><text x="${rtl ? x + w - 32 : x + 32}" y="${y + 54}" text-anchor="${a}" ${d} font-family="${F(l)}" font-size="30" font-weight="500" fill="#0E2440">${esc(txt)}</text>`;
    return b(0, 20, 600, t[0] || '', 0) + b(300, 135, 440, t[1] || '', 1) + b(0, 250, 660, t[2] || '', 0);
  },
  mismatch: (l, t = []) => {
    const rtl = l === 'ar', x = rtl ? 328 : 32, d = rtl ? 'direction="rtl"' : '';
    const card = (tx, label, num, red) => `<g transform="translate(${tx} 30)"><rect width="360" height="300" rx="24" fill="#fff" stroke="#C9D8E4" stroke-width="2"/><text x="${x}" y="58" ${d} font-family="${F(l)}" font-size="24" font-weight="600" fill="#4F6E86">${esc(label)}</text><text x="${x}" y="130" ${d} font-family="${F(l)}" font-size="26" fill="#0E2440">${esc(t[2] || '')}</text><text x="${x}" y="245" ${d} font-family="Readex Pro" font-size="${String(num).length > 4 ? 58 : 96}" font-weight="700" fill="${red ? '#2C5974' : '#0E2440'}">${esc(num)}</text></g>`;
    return card(40, t[0] || '', t[3] || 42, 0) + card(500, t[1] || '', t[4] || 38, 1) + `<text x="450" y="200" text-anchor="middle" font-family="Readex Pro" font-size="64" font-weight="700" fill="#2C5974">≠</text>`;
  },
  clock: () => `<g transform="translate(450 190)"><circle r="150" fill="#fff" stroke="#C9D8E4" stroke-width="4"/><circle r="150" fill="none" stroke="#0895A6" stroke-width="12" stroke-dasharray="700 943" transform="rotate(-90)" stroke-linecap="round"/><path d="M0 0 L0 -95" stroke="#0E2440" stroke-width="12" stroke-linecap="round"/><path d="M0 0 L70 30" stroke="#0E2440" stroke-width="10" stroke-linecap="round"/><circle r="12" fill="#0E2440"/></g>`,
  clipboard: () => `<g transform="translate(330 10)"><rect width="240" height="330" rx="26" fill="#fff" stroke="#C9D8E4" stroke-width="3"/><rect x="70" y="-14" width="100" height="40" rx="12" fill="#0895A6"/>${[0, 1, 2, 3, 4].map(i => `<rect x="34" y="${70 + i * 52}" width="30" height="30" rx="8" fill="${i < 3 ? '#0895A6' : '#EEF6F9'}"/><rect x="82" y="${78 + i * 52}" width="${120 - (i % 2) * 30}" height="14" rx="6" fill="#E3ECF2"/>`).join('')}</g>`,
  roles: () => `${[[150, 'M'], [330, 'W'], [510, 'P'], [690, 'R']].map(([x, c], i) => `<g transform="translate(${x} 170)"><circle r="70" fill="${i === 0 ? '#0E2440' : '#fff'}" stroke="#C9D8E4" stroke-width="3"/><circle cy="-14" r="22" fill="${i === 0 ? '#2EF2EE' : '#79C0DE'}"/><path d="M-36 40 C-30 10 30 10 36 40" fill="${i === 0 ? '#2EF2EE' : '#79C0DE'}"/></g>`).join('')}<path d="M220 170 H260 M400 170 H440 M580 170 H620" stroke="#0895A6" stroke-width="4" stroke-dasharray="6 8"/>`,
  shield: () => `<g transform="translate(450 190)"><path d="M0 -160 L130 -110 V10 C130 90 70 140 0 170 C-70 140 -130 90 -130 10 V-110Z" fill="#fff" stroke="#0895A6" stroke-width="8"/><path d="M-50 10 L-12 48 L60 -30" fill="none" stroke="#0895A6" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  calendar: () => `<g transform="translate(250 20)"><rect width="400" height="320" rx="28" fill="#fff" stroke="#C9D8E4" stroke-width="3"/><rect width="400" height="70" rx="28" fill="#0E2440"/><rect y="40" width="400" height="30" fill="#0E2440"/>${Array.from({ length: 15 }, (_, i) => `<rect x="${30 + (i % 5) * 72}" y="${100 + Math.floor(i / 5) * 70}" width="52" height="48" rx="10" fill="${i === 12 ? '#2EF2EE' : '#EEF6F9'}"/>`).join('')}</g>`,
  boxes: () => `${CUBE(300, 300, 1.2)}${CUBE(420, 300, 1.2)}${CUBE(360, 230, 1.2)}${CUBE(600, 310, 1.0, .9)}<path d="M640 120 l40 -40 l40 40" fill="none" stroke="#2C5974" stroke-width="8" stroke-linecap="round"/><path d="M680 80 V200" stroke="#2C5974" stroke-width="8" stroke-linecap="round"/>`,
};
const art = (key, lang, labels) => `<div class="art"><svg viewBox="0 0 900 380" aria-hidden="true">${ART[key](lang, labels)}</svg></div>`;
const shot = (img, lang, h = 560, w) => `<div class="shot" style="height:${h}px${w ? `;width:${w}px` : ''}"><img src="../../_brand/site/${lang}-${img}.png" alt=""></div>`;

// post point icons (40x40, stroke colour is swapped for the dark theme by the template)
const ic = d => `<svg viewBox="0 0 40 40" fill="none" stroke="#0895A6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  warehouse: ic('<path d="M6 17 L20 8 L34 17 V33 H6Z"/><path d="M14 33 V23 H26 V33"/>'),
  map: ic('<path d="M4 10 L14 6 L26 10 L36 6 V30 L26 34 L14 30 L4 34Z"/><path d="M14 6 V30 M26 10 V34"/>'),
  search: ic('<circle cx="18" cy="18" r="11"/><path d="M26 26 L35 35"/><path d="M13 18 H23 M18 13 V23"/>'),
  truck: ic('<rect x="3" y="11" width="20" height="15" rx="2"/><path d="M23 16 h7 l6 6 v4 h-13"/><circle cx="10" cy="29" r="3"/><circle cx="29" cy="29" r="3"/>'),
  invoice: ic('<path d="M9 4 H25 L32 11 V36 H9Z"/><path d="M25 4 V11 H32"/><path d="M14 19 H27 M14 25 H27 M14 31 H22"/>'),
  shield: ic('<path d="M20 4 L33 9 V19 C33 27 27 33 20 36 C13 33 7 27 7 19 V9Z"/><path d="M14 20 L18 24 L26 15"/>'),
  users: ic('<circle cx="15" cy="14" r="5"/><path d="M5 32 C6 24 24 24 25 32"/><circle cx="28" cy="13" r="4"/><path d="M27 21 C32 21 35 25 35 30"/>'),
  clock: ic('<circle cx="20" cy="20" r="15"/><path d="M20 11 V20 L26 24"/>'),
  chart: ic('<path d="M5 34 H35"/><path d="M9 28 L16 20 L22 24 L33 11"/><path d="M27 11 H33 V17"/>'),
  check: ic('<circle cx="20" cy="20" r="15"/><path d="M13 20 L18 25 L27 15"/>'),
  bell: ic('<path d="M10 28 V18 C10 12 14 8 20 8 C26 8 30 12 30 18 V28 L33 31 H7Z"/><path d="M17 34 C18 36 22 36 23 34"/>'),
  link: ic('<path d="M17 23 L23 17"/><path d="M14 18 L10 22 C7 25 7 30 10 33 C13 36 18 36 21 33 L25 29"/><path d="M26 22 L30 18 C33 15 33 10 30 7 C27 4 22 4 19 7 L15 11"/>'),
  phone: ic('<rect x="11" y="4" width="18" height="32" rx="4"/><path d="M18 31 H22"/>'),
  list: ic('<path d="M14 11 H34 M14 20 H34 M14 29 H34"/><circle cx="7" cy="11" r="1.5"/><circle cx="7" cy="20" r="1.5"/><circle cx="7" cy="29" r="1.5"/>'),
};

Object.assign(ICONS, {
  box: ic('<path d="M20 4 L35 12 V28 L20 36 L5 28 V12Z"/><path d="M5 12 L20 20 L35 12 M20 20 V36"/>'),
  pin: ic('<path d="M20 36 C12 27 8 21 8 15 A12 12 0 0 1 32 15 C32 21 28 27 20 36Z"/><circle cx="20" cy="15" r="4"/>'),
  cart: ic('<path d="M4 6 H9 L13 26 H31 L35 12 H11"/><circle cx="15" cy="32" r="2.5"/><circle cx="29" cy="32" r="2.5"/>'),
  eye: ic('<path d="M3 20 C8 11 14 8 20 8 C26 8 32 11 37 20 C32 29 26 32 20 32 C14 32 8 29 3 20Z"/><circle cx="20" cy="20" r="5"/>'),
  gear: ic('<circle cx="20" cy="20" r="6"/><path d="M20 3 V9 M20 31 V37 M3 20 H9 M31 20 H37 M8 8 L12 12 M28 28 L32 32 M8 32 L12 28 M28 12 L32 8"/>'),
  card: ic('<rect x="4" y="9" width="32" height="22" rx="3"/><path d="M4 16 H36 M9 25 H17"/>'),
  glasses: ic('<circle cx="11" cy="23" r="6"/><circle cx="29" cy="23" r="6"/><path d="M17 23 H23 M5 21 L8 12 M35 21 L32 12"/>'),
  arrows: ic('<path d="M5 14 H33 L27 8 M35 26 H7 L13 32"/>'),
  files: ic('<path d="M6 10 H20 L24 14 V36 H6Z"/><path d="M14 4 H28 L34 10 V30 H24"/>'),
  lock: ic('<rect x="8" y="18" width="24" height="17" rx="3"/><path d="M13 18 V12 A7 7 0 0 1 27 12 V18"/><path d="M20 25 V29"/>'),
  upload: ic('<path d="M20 26 V6 M12 13 L20 5 L28 13"/><path d="M6 24 V34 H34 V24"/>'),
  chat: ic('<path d="M5 8 H35 V27 H18 L10 34 V27 H5Z"/><path d="M12 15 H28 M12 21 H23"/>'),
  calendar: ic('<rect x="5" y="8" width="30" height="27" rx="3"/><path d="M5 16 H35 M13 4 V11 M27 4 V11"/>'),
  alert: ic('<path d="M20 5 L36 33 H4Z"/><path d="M20 15 V23 M20 28 V29"/>'),
  question: ic('<circle cx="20" cy="20" r="15"/><path d="M15 15 A5 5 0 1 1 21 20 C20 21 20 22 20 24 M20 29 V30"/>'),
  sheet: ic('<rect x="5" y="5" width="30" height="30" rx="3"/><path d="M5 14 H35 M5 23 H35 M16 5 V35"/>'),
  scan: ic('<path d="M5 13 V5 H13 M27 5 H35 V13 M35 27 V35 H27 M13 35 H5 V27"/><path d="M11 20 H29"/>'),
  star: ic('<path d="M20 4 L25 15 L36 16 L28 24 L30 35 L20 29 L10 35 L12 24 L4 16 L15 15Z"/>'),
  flag: ic('<path d="M8 36 V5 M8 6 H32 L27 13 L32 20 H8"/>'),
  team: ic('<circle cx="12" cy="14" r="4"/><circle cx="28" cy="14" r="4"/><circle cx="20" cy="11" r="4.5"/><path d="M4 30 C5 23 19 23 20 30 M20 30 C21 23 35 23 36 30"/>'),
  money: ic('<rect x="4" y="10" width="32" height="20" rx="3"/><circle cx="20" cy="20" r="5"/><path d="M9 15 V25 M31 15 V25"/>'),
  route: ic('<circle cx="8" cy="31" r="4"/><circle cx="32" cy="9" r="4"/><path d="M12 31 H24 A6 6 0 0 0 24 19 H16 A6 6 0 0 1 16 7 H28"/>'),
  doc: ic('<path d="M9 4 H25 L32 11 V36 H9Z"/><path d="M25 4 V11 H32"/>'),
  phonecall: ic('<path d="M9 5 L15 5 L18 13 L14 16 C16 21 19 24 24 26 L27 22 L35 25 V31 C35 33 33 35 31 35 C17 34 6 23 5 9 C5 7 7 5 9 5Z"/>'),
});

module.exports = { esc, rich, CUBE, F, ART, ICONS, ic };
