/* Aiphin helpers for the motion engine (load after sm-core / sm-components).
   Engine colours already match the Aiphin palette; this adds the Aiphin type, the dolphin,
   a neutral chat phone (no third-party branding) and the Aiphin end card. */
(function () {
  const A = (window.AIP = {});
  A.OCEAN = 'radial-gradient(120% 90% at 50% 0%, #4AA3D3 0%, #2F86B8 55%, #2A79A8 100%)';
  A.NIGHT = 'radial-gradient(120% 90% at 70% 0%, #1B416B 0%, #0E2440 60%)';
  A.IMG = (code) => `/brands/aiphin/assets/post-images/final/${code}`;
  const LOGO = '/brands/aiphin/assets/brand/logo';

  /** Headline: Audiowide in English, Noto Kufi 700 in Arabic (the engine picks Kufi for Arabic). */
  A.head = function (s, str, o = {}) {
    const T = s.text(str, Object.assign({ size: 78, w: 940, lh: SM.ar() ? 1.45 : 1.15 }, o));
    if (!SM.ar()) { T.box.style.fontFamily = "'Audiowide','Readex Pro',sans-serif"; T.box.style.fontWeight = 400; T.box.style.letterSpacing = '.02em'; }
    return T;
  };
  /** Body line in Readex Pro. */
  A.line = (s, str, o = {}) => s.text(str, Object.assign({ size: 44, w: 900, weight: 400, lh: 1.45, color: '#C9D8E4' }, o));

  /** The dolphin (transparent PNG). Mirrored when `mirror` is true. Returns the engine layer. */
  A.fin = function (s, code, o = {}) {
    const w = o.w || 620, mir = o.mirror ? 'transform:scaleX(-1);' : '';
    const halo = o.halo === false ? '' : 'filter:drop-shadow(0 0 70px rgba(46,242,238,.32));';
    return s.html(`<img src="${A.IMG(code)}" style="width:${w}px;display:block;${mir}${halo}">`, { x: o.x ?? 540, y: o.y ?? 1300, in: o.in || 'rise', at: o.at ?? .1, out: o.out, outAt: o.outAt });
  };

  /** Small logo at the top of a scene (reversed on dark). */
  A.topLogo = function (s, o = {}) {
    const src = SM.ar() ? `${LOGO}/arabic/wordmark/aiphin-ar-wordmark-${o.variant || 'reversed'}.svg` : `${LOGO}/wordmark/aiphin-wordmark-${o.variant || 'reversed'}.svg`;
    return s.html(`<img src="${src}" style="height:${SM.ar() ? 70 : 46}px;display:block">`, { x: 540, y: o.y ?? 250, in: 'fade', at: o.at ?? .2 });
  };

  /**
   * A neutral messaging phone. Returns { layer, msg(at, text, who, time), typing(at, until, who), clock(at, text), header }.
   * who: 'them' (customer, white, left) | 'us' (business, Ocean, right). Mirrors for Arabic.
   */
  A.phone = function (s, o = {}) {
    const w = o.w || 600, h = o.h || 1060, ar = SM.ar();
    const L = s.html(`<div style="width:${w}px;height:${h}px;border-radius:64px;background:#08172B;padding:18px;box-shadow:0 50px 120px rgba(0,0,0,.5),0 0 0 3px rgba(121,192,222,.35)">
      <div class="aip-scr" style="position:relative;width:100%;height:100%;border-radius:48px;overflow:hidden;background:#EEF6F9;direction:${ar ? 'rtl' : 'ltr'}">
        <div style="position:relative;z-index:2;height:150px;background:#fff;border-bottom:1px solid #C9D8E4;display:flex;align-items:flex-end;padding:0 32px 22px;gap:18px">
          <div style="width:64px;height:64px;border-radius:50%;background:#79C0DE;flex:none"></div>
          <div><div style="font:600 30px/1.2 'Readex Pro',sans-serif;color:#0E2440">${o.title || ''}</div><div class="aip-sub" style="font:400 22px/1.3 'Readex Pro',sans-serif;color:#2C5974">${o.sub || ''}</div></div>
          <div class="aip-clock" style="margin-inline-start:auto;font:600 30px/1 'Readex Pro',sans-serif;color:#0895A6;direction:ltr"></div>
        </div>
        <div class="aip-feed" style="position:absolute;left:0;right:0;top:150px;bottom:0;padding:24px 26px 30px;display:flex;flex-direction:column;justify-content:flex-end;gap:18px;overflow:hidden"></div>
      </div></div>`, { x: o.x ?? 540, y: o.y ?? 1000, in: o.in || 'rise', at: o.at ?? 0 });
    const feed = L.box.querySelector('.aip-feed'), clockEl = L.box.querySelector('.aip-clock'), subEl = L.box.querySelector('.aip-sub');
    const P = { layer: L.layer, box: L.box };
    P.msg = (at, text, who = 'them', time = '') => {
      const us = who === 'us';
      const b = SM.el('div', '', feed, `<div>${text}</div><div style="font-size:20px;opacity:.7;margin-top:8px;direction:ltr;text-align:${ar ? 'left' : 'right'}">${time}</div>`);
      b.style.cssText = `flex:none;align-self:${us ? 'flex-end' : 'flex-start'};max-width:82%;padding:20px 24px;border-radius:30px;font:400 28px/1.4 'Readex Pro',sans-serif;${us ? 'background:#2F86B8;color:#fff' : 'background:#fff;color:#0E2440;box-shadow:0 4px 14px rgba(14,36,64,.08)'}`;
      s.set(b, { o: 0, y: 30 }); s.anim(b, { o: [0, 1], y: [30, 0] }, at, .35, 'outBack');
      s.sfx(us ? 'send' : 'pop', at, .4);
      return b;
    };
    P.typing = (at, until, who = 'us') => {
      const b = SM.el('div', '', feed, '<span>●</span> <span>●</span> <span>●</span>');
      b.style.cssText = `flex:none;align-self:${who === 'us' ? 'flex-end' : 'flex-start'};padding:18px 26px;border-radius:30px;font:400 22px/1 sans-serif;letter-spacing:4px;${who === 'us' ? 'background:#79C0DE;color:#fff' : 'background:#fff;color:#79C0DE'}`;
      s.set(b, { o: 0 }); s.anim(b, { o: [0, 1] }, at, .2);
      s.on(0, s.dur, (p, lt) => { const v = lt >= at && lt < until ? '' : 'none'; if (b.style.display !== v) b.style.display = v; });
      return b;
    };
    // clock / status: keyed values, one driver over the whole scene (correct at any seek time)
    const keyed = (el, first) => { const keys = [[-1, first]]; s.on(0, s.dur, (p, lt) => { let v = keys[0][1]; for (const [k, t] of keys) if (lt >= k) v = t; if (el.textContent !== v) el.textContent = v; }); return keys; };
    const ck = keyed(clockEl, ''), sk = keyed(subEl, o.sub || '');
    P.clock = (at, text) => { if (at <= 0) ck[0][1] = text; else ck.push([at, text]); };
    P.sub = (at, text) => sk.push([at, text]);
    P.clockKeys = ck;
    return P;
  };

  /** Aiphin end card: stacked lockup in the version's language, line, aiphin.me. */
  A.endcard = function (R, o = {}) {
    const e = R.scene(o.dur || 3.5, { in: o.in || 'blur', bg: A.NIGHT, name: 'endcard' });
    e.fill('background:radial-gradient(circle at 50% 42%, rgba(46,242,238,.18), transparent 45%)');
    const src = SM.ar() ? `${LOGO}/arabic/lockups/aiphin-ar-stacked-dark.svg` : `${LOGO}/lockups/aiphin-stacked-dark.svg`;
    e.html(`<img src="${src}" style="width:${SM.ar() ? 520 : 560}px;display:block">`, { x: 540, y: 820, in: 'pop', at: .1 });
    e.text(o.line || SM.t('One team. *Every expert.*', 'فريق واحد. *كل الخبرات.*'), { y: SM.ar() ? 1340 : 1260, size: SM.ar() ? 54 : 52, fx: 'blur', at: .6, w: 900, weight: 500 });
    const site = e.html(`<div style="font:400 50px/1 'Audiowide',sans-serif;letter-spacing:.05em;color:#fff;direction:ltr">aiphin.me</div>`, { x: 540, y: SM.ar() ? 1480 : 1400, in: 'rise', at: 1.0 });
    e.sfx('ding', .15, .35);
    return e;
  };
})();
