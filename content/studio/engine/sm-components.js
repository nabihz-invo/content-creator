/*! Stacko Motion — components: phone + Telegram chat, lock screen, notification storm, device frames,
 *  invoice → draft, ledger, KPI tiles, spreadsheet chaos, sticky notes, before/after, checklist, flow,
 *  import journey, poll/quiz, cursor, clock, captions (karaoke), lower third, whiteboard, cards, callouts,
 *  isometric yard (uses StackoMap), Dot-core logo animations and end cards.  Requires sm-core.js.
 *  Every component = method on a scene:  s.chat({...}), s.invoice({...}) …  All times are scene-local.
 */
(function (G) {
  'use strict';
  const SM = G.SM, C = SM.C, mk = SM.el, clamp = SM.clamp, E = SM.ease, esc = SM.esc, noise = SM.noise, S = SM.Scene.prototype;
  const f2 = n => Math.round(n * 100) / 100, NS = 'http://www.w3.org/2000/svg';
  const centerBox = (box, ax = -50, ay = -50) => { box.style.position = 'absolute'; box.style.left = '0'; box.style.top = '0'; box.style.transform = `translate(${ax}%,${ay}%)`; };
  /** 0×0 animatable wrapper at (x,y) inside parent, content centred by its own CSS */
  const wrapAt = (parent, x, y, cls, html) => { const w = mk('div', '', parent); w.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0`; const c = mk('div', cls || '', w, html); return [w, c]; };
  SM.wrapAt = wrapAt;
  const scaledBox = (box, k, ax = -50, ay = -50) => { box.style.position = 'absolute'; box.style.left = '0'; box.style.top = '0'; box.style.transform = `translate(${ax}%,${ay}%) scale(${k})`; box.style.transformOrigin = `${-ax}% ${-ay}%`; };

  /* ---------------------------------------------------------------- icons (24×24 line) */
  const IC = SM.icons = {
    msg: '<path d="M4 5h16v11H9l-5 4z"/>', ai: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4-6.5 8-6.5s7 2 8 6.5"/>', map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>', truck: '<path d="M2 6h12v10H2zM14 9h4l4 4v3h-8z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    ship: '<path d="M3 15h18l-3 5H6z"/><path d="M6 15V9h12v6M10 9V5h4v4"/>', plane: '<path d="M21 12l-7-1.5L10 3H8l2 7.5H5L3.5 8H2l1 4-1 4h1.5L5 13.5h5L8 21h2l4-7.5z"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>', warehouse: '<path d="M3 10l9-6 9 6v10H3z"/><path d="M8 20v-6h8v6M8 17h8"/>',
    invoice: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 15h7M9 19h4"/>', bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 3H4z"/><path d="M10 21h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>', search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>', phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M10.5 18.5h3"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>', customs: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h5M7 14h10M16 9.5l1.5 1.5L20 8.5"/>', sheet: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    note: '<path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
  };
  SM.icon = (name, size = 40, color = 'currentColor', sw = 2) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${IC[name] || IC.box}</svg>`;

  SM.addCSS(`
.sm-phone{width:390px;height:844px;border-radius:62px;background:#0B1A2E;padding:12px;box-shadow:0 50px 120px rgba(3,9,18,.55),inset 0 0 0 2px #23395A;position:relative}
.sm-phone .scr{position:absolute;inset:12px;border-radius:50px;overflow:hidden;background:#DCE9EE;color:#0E2440;font-family:'Readex Pro',sans-serif}
.sm-phone .island{position:absolute;left:50%;top:22px;width:112px;height:32px;border-radius:20px;background:#050D18;transform:translateX(-50%);z-index:20}
.sm-phone .sb{position:absolute;left:0;right:0;top:0;height:54px;display:flex;justify-content:space-between;align-items:center;padding:6px 30px 0 34px;font-weight:600;font-size:15px;z-index:10}
.sm-chat{position:absolute;inset:0;display:flex;flex-direction:column;background:#DCE9EE;background-image:radial-gradient(#C7DCE4 1.2px,transparent 1.3px);background-size:18px 18px}
.sm-chat .hd{display:flex;align-items:center;gap:10px;background:#fff;padding:58px 14px 10px;box-shadow:0 1px 0 #D5E1E7}
.sm-chat .hd .bk{font-size:32px;color:#2F86B8;line-height:1;margin-right:2px}
.sm-chat .hd .av{width:40px;height:40px;border-radius:50%;background:#0E2440;display:grid;place-items:center;flex:none;overflow:hidden}
.sm-chat .hd .av.grp{background:#79C0DE;color:#0E2440;font-weight:700;font-size:16px}
.sm-chat .hd b{font-size:16px;display:block}.sm-chat .hd small{color:#2C5974;font-size:12.5px}
.sm-chat .msgs{flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding:8px 12px 10px;overflow:hidden}
.sm-chat .mw{overflow:hidden;flex:none}
.sm-chat .m{max-width:82%;padding:8px 12px 6px;border-radius:16px;box-shadow:0 1px 1px rgba(14,36,64,.12);font-size:15.5px;line-height:1.38;margin-top:8px;width:max-content}
.sm-chat .m time{display:block;text-align:right;font-size:11px;color:#2C5974;margin-top:2px}
.sm-chat .m.me{margin-left:auto;background:#D4F5E9;border-bottom-right-radius:5px}
.sm-chat .m.bot,.sm-chat .m.other{background:#fff;border-bottom-left-radius:5px}
.sm-chat .m .nm{display:block;font-size:12.5px;font-weight:600;color:#0895A6;margin-bottom:1px}
.sm-chat .m.ar{direction:rtl;font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;font-size:15px}
.sm-chat .m.img{padding:4px}.sm-chat .m.img img{display:block;width:230px;height:170px;object-fit:cover;border-radius:12px}
.sm-chat .typing{display:flex;gap:5px;padding:12px 14px;width:max-content}
.sm-chat .typing i{width:8px;height:8px;border-radius:50%;background:#79C0DE;display:block}
.sm-chat .card{width:88%;background:#fff;border-radius:16px;padding:12px 14px;box-shadow:0 1px 1px rgba(14,36,64,.12);font-size:14.5px;margin-top:8px}
.sm-chat .card .ch{display:flex;justify-content:space-between;margin-bottom:4px;font-weight:600}.sm-chat .card .ch span{color:#0895A6;font-size:13px;font-weight:500}
.sm-chat .card .ch span.ok{color:#0E2440;background:#BCE5E0;border-radius:999px;padding:1px 8px}
.sm-chat .card .q em{font-style:normal;color:#2C5974;font-size:12.5px}.sm-chat .card .r{color:#2C5974;font-size:13px}
.sm-chat .card .ac{display:flex;gap:8px;margin-top:10px}.sm-chat .card .ac span{flex:1;text-align:center;border:1px solid #C9D8E4;background:#fff;border-radius:10px;padding:8px;font-weight:600;font-size:14px;position:relative;overflow:hidden}
.sm-chat .card .ac span.ok{background:#2F86B8;border-color:#2F86B8;color:#fff}
.sm-chat .in{display:flex;align-items:center;gap:10px;background:#fff;padding:10px 14px 30px;color:#9AAFBE;font-size:16px}
.sm-chat .in .tx{flex:1;min-height:22px;color:#0E2440;white-space:nowrap;overflow:hidden}.sm-chat .in .tx.ph{color:#9AAFBE}
.sm-chat .in .send{width:36px;height:36px;border-radius:50%;background:#2F86B8;color:#fff;display:grid;place-items:center;font-size:17px}
.sm-touch{position:absolute;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(14,36,64,.25);box-shadow:0 4px 18px rgba(14,36,64,.25)}
.sm-lock{position:absolute;inset:0;background:radial-gradient(120% 90% at 30% 35%,#1B416B 0%,#0E2440 62%);color:#fff;display:flex;flex-direction:column;align-items:center}
.sm-lock .tm{margin-top:96px;text-align:center}.sm-lock .tm small{font-size:18px;font-weight:500;opacity:.9}.sm-lock .tm b{display:block;font-size:88px;font-weight:600;letter-spacing:-.04em;line-height:1}
.sm-lock .wm{position:absolute;left:50%;top:64%;width:260px;transform:translate(-50%,-50%);opacity:.3}
.sm-lock .stack{position:absolute;left:12px;right:12px;top:270px;display:flex;flex-direction:column;gap:10px}
.sm-note{background:rgba(238,246,249,.9);color:#0E2440;border-radius:22px;padding:12px 16px 14px;box-shadow:0 10px 30px rgba(3,9,18,.25)}
.sm-note .nh{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#2C5974}.sm-note .nh .ic{width:22px;height:22px;border-radius:6px;background:#0E2440;display:grid;place-items:center;overflow:hidden}.sm-note .nh b{letter-spacing:.06em;font-weight:600}.sm-note .nh em{margin-left:auto;font-style:normal}
.sm-note .tt{font-weight:600;font-size:15.5px;margin-top:6px}.sm-note .tx{font-size:14.5px;line-height:1.38;color:#2C5974}
.sm-banner{width:900px;font-size:34px}.sm-banner .nh{font-size:26px;gap:14px}.sm-banner .nh .ic{width:44px;height:44px;border-radius:12px}.sm-banner .tt{font-size:34px}.sm-banner .tx{font-size:30px}.sm-banner{border-radius:40px;padding:26px 32px 30px}
.sm-bub{position:absolute;left:0;top:0;transform:translate(-50%,-50%);background:#fff;color:#0E2440;border-radius:28px;padding:18px 26px 20px;font-size:36px;font-weight:500;box-shadow:0 14px 40px rgba(3,9,18,.3);white-space:nowrap}
.sm-bub .nm{display:block;font-size:24px;font-weight:600;color:#0895A6;margin-bottom:2px}.sm-bub.ar{direction:rtl;font-family:'Noto Kufi Arabic','Readex Pro',sans-serif}
.sm-dev{position:relative;background:#0B1A2E;box-shadow:0 40px 100px rgba(3,9,18,.5)}
.sm-dev .sc{position:absolute;overflow:hidden;background:#fff}.sm-dev .sc img{display:block;width:100%}
.sm-dev.laptop{border-radius:22px 22px 6px 6px}.sm-dev .base{position:absolute;left:-7%;right:-7%;bottom:-26px;height:26px;background:linear-gradient(#C9D8E4,#8FA3B5);border-radius:0 0 26px 26px}
.sm-paper{background:#fff;color:#0E2440;border-radius:22px;padding:34px 36px;box-shadow:0 30px 80px rgba(3,9,18,.4);font-size:24px;position:relative;overflow:hidden}
.sm-paper .co{font-weight:700;font-size:28px}.sm-paper .ad{color:#2C5974;font-size:21px}
.sm-paper .meta{display:flex;justify-content:space-between;margin:16px 0;font-size:21px;color:#2C5974}
.sm-paper table{width:100%;border-collapse:collapse;font-size:23px;font-variant-numeric:tabular-nums}
.sm-paper th{text-align:left;font-size:17px;letter-spacing:.06em;color:#2C5974;border-bottom:2px solid #C9D8E4;padding:8px 4px}
.sm-paper td{padding:13px 4px;border-bottom:1px solid #EEF6F9}.sm-paper td.n,.sm-paper th.n{text-align:right}
.sm-paper tr.hit td{background:rgba(46,242,238,.18)}
.sm-paper .ex{margin-top:14px;font-size:16px;letter-spacing:.12em;color:#2C5974}
.sm-paper .beam{position:absolute;left:0;right:0;height:90px;background:linear-gradient(180deg,rgba(46,242,238,0),rgba(46,242,238,.35) 70%,rgba(46,242,238,.9));border-bottom:3px solid #2EF2EE;pointer-events:none}
.sm-paper .newi{display:inline-block;font-size:16px;font-weight:600;background:#F2E9D8;border-radius:999px;padding:3px 12px;margin-left:10px}
.sm-paper.draft .st{display:flex;justify-content:space-between;align-items:center}.sm-paper.draft .st b{font-size:30px}
.sm-paper.draft .rt{font-size:21px;color:#2C5974;margin:6px 0 10px}.sm-paper.draft .tot{margin-top:14px;font-weight:700;font-size:25px}
.sm-card{background:#fff;color:#0E2440;border-radius:30px;padding:30px 34px;box-shadow:0 30px 80px rgba(3,9,18,.35)}
.sm-card.dark{background:rgba(14,36,64,.92);color:#fff;border:1px solid rgba(201,216,228,.2)}
.sm-card h3{margin:0;font-size:40px;font-weight:600;letter-spacing:-.02em}.sm-card p{margin:8px 0 0;font-size:30px;line-height:1.4;color:#2C5974}.sm-card.dark p{color:#C9D8E4}
.sm-card .kick{font-size:22px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#0895A6;margin-bottom:8px}.sm-card.dark .kick{color:#79C0DE}
.sm-ledger table{width:100%;border-collapse:collapse;font-size:25px;font-variant-numeric:tabular-nums}
.sm-ledger th{font-size:17px;text-transform:uppercase;letter-spacing:.08em;color:#2C5974;text-align:left;padding:8px;border-bottom:2px solid #C9D8E4}
.sm-ledger td{padding:14px 8px;border-bottom:1px solid #EEF6F9;vertical-align:top}.sm-ledger td small{display:block;color:#2C5974;font-size:18px}
.sm-ledger .op{font-size:16px;font-weight:700;letter-spacing:.06em;border-radius:6px;padding:3px 8px;margin-right:6px;background:#EEF6F9}
.sm-ledger tr.hi td{background:rgba(46,242,238,.2)}
.sm-kpis{display:flex;gap:18px}.sm-kpi{background:#EEF6F9;color:#0E2440;border-radius:24px;padding:20px 26px;min-width:240px}
.sm-kpi b{display:block;font-size:64px;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums}.sm-kpi small{font-size:24px;color:#2C5974;font-weight:500}.sm-kpi.alert b{color:#C2334A}
.sm-sheet{background:#fff;color:#1F2A36;border-radius:16px;overflow:hidden;box-shadow:0 30px 80px rgba(3,9,18,.45);font-family:Arial,'Readex Pro',sans-serif;position:relative}
.sm-sheet .bar{height:54px;background:#E9EEF2;display:flex;align-items:center;gap:10px;padding:0 18px;font-size:20px;color:#5C7591}
.sm-sheet .grid{position:absolute;left:0;top:54px}
.sm-sheet .grid table{border-collapse:collapse;font-size:19px}.sm-sheet td{border:1px solid #D9E1E7;padding:7px 10px;white-space:nowrap;min-width:120px;height:40px}
.sm-sheet td.h{background:#F1F4F7;color:#5C7591;font-weight:700;text-align:center}.sm-sheet td.red{background:#F7C9CF;color:#9B1C31;font-weight:700}
.sm-sheet .tabs{position:absolute;left:0;right:0;bottom:0;height:56px;background:#E9EEF2;display:flex;gap:4px;padding:8px 10px 0;font-size:19px;color:#2C5974;white-space:nowrap;overflow:hidden}
.sm-sheet .tabs span{background:#F6F8FA;border-radius:8px 8px 0 0;padding:9px 16px}.sm-sheet .tabs span.on{background:#fff;font-weight:700;color:#0E2440}
.sm-sticky{position:absolute;left:0;top:0;width:250px;height:240px;margin:-120px 0 0 -125px;background:#F6EFD3;color:#3A3A2E;font:700 42px/1.05 Caveat,cursive;padding:24px 22px;box-shadow:0 14px 30px rgba(0,0,0,.25)}
.sm-sticky:before{content:'';position:absolute;left:50%;top:-10px;width:90px;height:26px;margin-left:-45px;background:rgba(201,216,228,.75)}
.sm-check{display:flex;flex-direction:column;gap:22px}
.sm-check .it{display:flex;align-items:center;gap:22px;font-size:40px;font-weight:500}
.sm-check .bx{width:58px;height:58px;border-radius:16px;border:3px solid #79C0DE;flex:none;position:relative;display:grid;place-items:center}
.sm-check .bx .fillc{position:absolute;inset:-3px;border-radius:16px;background:#0895A6}
.sm-check .bx svg{position:relative}
.sm-flow{position:absolute;left:0;top:0}
.sm-flow .nd{position:absolute;display:flex;align-items:center;gap:22px;background:#fff;color:#0E2440;border-radius:28px;padding:20px 28px 20px 22px;box-shadow:0 20px 50px rgba(3,9,18,.3);white-space:nowrap}
.sm-flow .nd .ic{width:76px;height:76px;border-radius:22px;background:#EEF6F9;display:grid;place-items:center;color:#2F86B8;flex:none}
.sm-flow .nd b{display:block;font-size:36px;font-weight:600;letter-spacing:-.02em}.sm-flow .nd small{display:block;font-size:24px;color:#2C5974}
.sm-flow .nd.on{background:#0E2440;color:#fff}.sm-flow .nd.on .ic{background:rgba(255,255,255,.1);color:#2EF2EE}.sm-flow .nd.on small{color:#C9D8E4}
.sm-poll{background:#fff;color:#0E2440;border-radius:34px;padding:34px 34px 28px;width:820px;box-shadow:0 30px 80px rgba(3,9,18,.4)}
.sm-poll .q{font-size:42px;font-weight:600;text-align:center;letter-spacing:-.02em;margin-bottom:24px}
.sm-poll .op{position:relative;height:88px;border-radius:22px;background:#EEF6F9;margin-top:14px;overflow:hidden;display:flex;align-items:center;justify-content:space-between;padding:0 28px;font-size:34px;font-weight:600}
.sm-poll .op i{position:absolute;left:0;top:0;bottom:0;background:#BCE5E0}.sm-poll .op span{position:relative}.sm-poll .op.win i{background:#79C0DE}
.sm-poll .op.right{outline:4px solid #0895A6}.sm-poll .op.wrong i{background:#F0AAAA}
.sm-cursor{position:absolute;left:0;top:0;width:0;height:0;z-index:50}.sm-cursor svg{position:absolute;left:-6px;top:-4px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35))}
.sm-cursor .rp{position:absolute;left:-40px;top:-40px;width:80px;height:80px;border-radius:50%;border:4px solid #2EF2EE}
.sm-cap{position:absolute;left:0;top:0;transform:translate(-50%,-50%);text-align:center;width:max-content;max-width:900px;font-weight:700;font-size:62px;line-height:1.12;letter-spacing:-.02em;color:#fff;text-shadow:0 4px 20px rgba(3,9,18,.6)}
.sm-cap .cw{display:inline-block;margin:0 .12em;transition:none}.sm-cap .cw.on{color:#2EF2EE}
.sm-cap.box .cw{background:rgba(14,36,64,.85);padding:0 .18em;border-radius:.16em;margin:.04em .06em}.sm-cap.box .cw.on{background:#0895A6;color:#fff}
.sm-cap.ar{direction:rtl;font-family:'Noto Kufi Arabic','Readex Pro',sans-serif}
.sm-l3{position:absolute;left:0;top:0;display:flex;align-items:center;gap:22px;background:rgba(14,36,64,.92);border-radius:26px;padding:18px 34px 18px 20px;border-left:7px solid #2EF2EE;box-shadow:0 16px 40px rgba(3,9,18,.35);white-space:nowrap}
.sm-l3 b{display:block;font-size:42px;font-weight:600;color:#fff;letter-spacing:-.02em}.sm-l3 small{display:block;font-size:26px;color:#C9D8E4}
.sm-journey .stop{position:absolute;display:flex;align-items:center;gap:20px;white-space:nowrap;transform:translateY(-50%)}
.sm-journey .stop .dt{width:34px;height:34px;border-radius:50%;background:#0E2440;border:6px solid #79C0DE;flex:none}
.sm-journey .stop.on .dt{background:#2EF2EE;border-color:#fff}
.sm-journey .stop b{display:block;font-size:40px;font-weight:600;letter-spacing:-.02em}.sm-journey .stop small{display:block;font-size:26px;color:#C9D8E4}
.sm-journey .day{position:absolute;font-variant-numeric:tabular-nums}
.sm-callout{position:absolute;left:0;top:0;white-space:nowrap;background:#0E2440;color:#fff;font-size:30px;font-weight:600;padding:12px 22px;border-radius:999px;box-shadow:0 10px 30px rgba(3,9,18,.35)}
.sm-callout.light{background:#fff;color:#0E2440}
.sm-iso{position:absolute;left:0;top:0;width:0;height:0}.sm-iso .it{position:absolute;left:0;top:0;line-height:0}
`);

  /* ---------------------------------------------------------------- phone + Telegram chat */
  S.phone = function (o = {}) {
    const R = this.R, L = this.layer(o.x ?? R.w / 2, o.y ?? R.h / 2, o.parent), k = (o.w || 640) / 414, ph = mk('div', 'sm-phone', L);
    scaledBox(ph, k);
    const scr = mk('div', 'scr', ph); mk('div', 'island', ph);
    if (o.status !== false) mk('div', 'sb', ph, `<b>${o.clock || '9:41'}</b><span>●●●● ▮</span>`).style.color = o.statusColor || (o.screen === 'lock' ? '#fff' : '#0E2440');
    if (o.tilt) this.set(L, { persp: 1800, ry: o.tilt === 'left' ? 14 : o.tilt === 'right' ? -14 : (o.tilt.ry || 0), rx: o.tilt.rx || 0, r: o.tilt.r || 0 });
    if (o.in) this.enter(L, o.in, o.at || 0, o); if (o.out) this.exit(L, o.out, o.outAt, o);
    return { layer: L, phone: ph, screen: scr, k };
  };
  /** Chat on a phone. o: x,y,w, title, sub, group(bool), lang. Returns API with .msg .type .bot .draft .approve .reject .photo */
  S.chat = function (o = {}) {
    o = Object.assign({ lang: SM.lang }, o);
    const s = this, P = s.phone(Object.assign({}, o, { screen: 'chat' })), root = mk('div', 'sm-chat', P.screen);
    const av = o.group ? `<div class="av grp">${esc((o.title || 'WH').slice(0, 2).toUpperCase())}</div>` : `<div class="av">${SM.mark('dark', 34)}</div>`;
    root.innerHTML = `<div class="hd"><span class="bk">‹</span>${av}<div><b>${esc(o.title || 'Stacko bot')}</b><small>${esc(o.sub || (o.group ? '12 members' : 'bot'))}</small></div></div><div class="msgs"></div><div class="in"><span class="tx ph">${o.lang === 'ar' ? 'رسالة' : 'Message'}</span><span class="send">➤</span></div>`;
    const msgs = root.querySelector('.msgs'), tx = root.querySelector('.in .tx'), send = root.querySelector('.send');
    const add = (at, html, cls, opt = {}) => {
      const w = mk('div', 'mw', msgs), m = mk('div', 'm ' + cls, w, html); if (opt.ar) m.classList.add('ar');
      s.on(at - .001, at + .35, (p, lt) => { w.style.display = lt < 0 ? 'none' : ''; if (lt >= 0) w.style.height = f2(m.offsetHeight * E.outCubic(p) + 8 * E.outCubic(p)) + 'px'; });
      s.anim(m, { o: [0, 1], s: [.85, 1], y: [16, 0] }, at, .35, 'outBack'); m.style.transformOrigin = cls.includes('me') ? '100% 100%' : '0 100%';
      return m;
    };
    let last = 0; const typingIn = [];
    const api = Object.assign(P, {
      el: root,
      msg(at, text, opt = {}) { s.sfx(opt.from === 'me' ? 'send' : 'pop', at, .55); return add(at, (opt.name ? `<span class="nm">${esc(opt.name)}</span>` : '') + esc(text) + `<time>${opt.time || '09:41'}${opt.from === 'me' ? ' ✓✓' : ''}</time>`, opt.from || 'bot', { ar: opt.lang === 'ar' }); },
      type(at, text, opt = {}) {
        const cps = opt.cps || 20, d = text.length / cps;
        s.on(at - .001, at + d + .4, (p, lt) => { if (lt < 0) return; const n = Math.floor(clamp(lt / d) * text.length); const v = lt > d + .2 ? '' : text.slice(0, n); if (tx.textContent !== v || tx.classList.contains('ph') !== !v) { tx.textContent = v || (o.lang === 'ar' ? 'رسالة' : 'Message'); tx.classList.toggle('ph', !v); } });
        typingIn.push([s.T(at), s.T(at + d + .4)]); s.sfx('typing', at, .5);
        s.anim(send, { s: [1, 1.25] }, at + d + .05, .12, 'outQuad').anim(send, { s: [1.25, 1] }, at + d + .17, .2, 'outQuad');
        return api.msg(at + d + .2, text, { from: 'me', time: opt.time, lang: opt.lang });
      },
      bot(at, text, opt = {}) {
        const td = opt.typing ?? .9; if (td > 0) { const w = mk('div', 'mw', msgs), m = mk('div', 'm bot typing', w, '<i></i><i></i><i></i>'); const dots = [...m.children];
          s.on(at - .001, at + td, (p, lt, t) => { const on = lt >= 0 && lt < td; w.style.display = on ? '' : 'none'; if (on) { w.style.height = (m.offsetHeight + 8) + 'px'; dots.forEach((d, i) => d.style.transform = `translateY(${f2(-5 * Math.max(0, Math.sin((t * 7) - i * .9)))}px)`); } }); }
        return api.msg(at + td, text, { from: opt.from || 'bot', name: opt.name, time: opt.time, lang: opt.lang });
      },
      photo(at, src, opt = {}) { s.sfx('send', at, .5); return add(at, `<img src="${src}">`, 'me img'); },
      draft(at, d = {}) {
        const w = mk('div', 'mw', msgs), card = mk('div', 'card', w, `<div class="ch"><b>${esc(d.code || 'Draft TRF-24019')}</b><span class="st">${esc(d.status || (o.lang === 'ar' ? 'بانتظار الموافقة' : 'Waiting for approval'))}</span></div><div class="q">${esc(d.line || '40 × LED Strip 5m')} <em>${esc(d.sku || 'SKU-10240')}</em></div><div class="r">${esc(d.sub || 'WH-01 Beirut → WH-02 Sidon · ETA 1h 13m')}</div><div class="ac"><span class="ok">${esc(d.ok || SM.t('Approve', 'موافقة'))}</span><span class="no">${esc(d.no || SM.t('Reject', 'رفض'))}</span></div>`);
        s.on(at - .001, at + .4, (p, lt) => { w.style.display = lt < 0 ? 'none' : ''; if (lt >= 0) w.style.height = f2((card.offsetHeight + 8) * E.outCubic(p)) + 'px'; });
        s.anim(card, { o: [0, 1], y: [24, 0] }, at, .4, 'outBack'); s.sfx('pop', at, .5);
        api._card = card; return card;
      },
      approve(at, opt = {}) { const card = api._card; if (!card) return; const btn = card.querySelector(opt.reject ? '.no' : '.ok'), st = card.querySelector('.st');
        const touch = mk('div', 'sm-touch', P.phone); s.set(touch, { o: 0 });
        s.on(at - .6, at + 1.2, (p, lt) => { const r = btn.getBoundingClientRect(), pr = P.phone.getBoundingClientRect(), k = pr.width / 414; touch.style.left = f2((r.left - pr.left) / k + r.width / k / 2) + 'px'; touch.style.top = f2((r.top - pr.top) / k + r.height / k / 2) + 'px'; });
        s.anim(touch, { o: [0, 1], s: [1.6, 1] }, at - .45, .35, 'outCubic').anim(touch, { s: [1, .82] }, at - .05, .1).anim(touch, { s: [.82, 1], o: [1, 0] }, at + .1, .4);
        s.anim(btn, { s: [1, .93] }, at - .05, .1).anim(btn, { s: [.93, 1] }, at + .05, .25, 'outBack');
        const txt0 = st.textContent, txt1 = opt.reject ? (o.lang === 'ar' ? 'مرفوض' : 'Rejected') : (o.lang === 'ar' ? 'تمت الموافقة ✓' : 'Approved ✓');
        s.on(at, at + .01, (p, lt) => { const v = lt >= 0 ? txt1 : txt0; if (st.textContent !== v) { st.textContent = v; st.classList.toggle('ok', lt >= 0 && !opt.reject); } });
        s.sfx('click', at, .7); return api;
      },
      reject(at) { return api.approve(at, { reject: true }); },
    });
    return api;
  };
  /** Phone lock screen; api.notify(at,{app,title,text,time}) */
  S.lock = function (o = {}) {
    o = Object.assign({ date: SM.t('Monday 14 December', 'الإثنين ١٤ كانون الأول') }, o);
    const s = this, P = s.phone(Object.assign({ statusColor: '#fff' }, o, { screen: 'lock' })), root = mk('div', 'sm-lock', P.screen);
    root.innerHTML = `<div class="wm">${SM.mark('dark', 260)}</div><div class="tm"><small>${esc(o.date || 'Monday 14 December')}</small><b>${esc(o.clock || '9:41')}</b></div><div class="stack"></div>`;
    const stack = root.querySelector('.stack');
    P.notify = (at, n = {}) => { const el = mk('div', 'sm-note', null, `<div class="nh"><span class="ic">${SM.mark('dark', 18)}</span><b>${esc(n.app || 'STACKO')}</b><em>${esc(n.time || 'now')}</em></div><div class="tt">${esc(n.title || '')}</div><div class="tx">${esc(n.text || '')}</div>`); stack.insertBefore(el, stack.firstChild);
      s.on(at - .001, at + .45, (p, lt) => { el.style.display = lt < 0 ? 'none' : ''; el.style.marginTop = lt < 0 ? '0' : f2(-(el.offsetHeight + 10) * (1 - E.outBack(p))) + 'px'; }); s.anim(el, { o: [0, 1], s: [.9, 1] }, at, .4, 'outBack'); s.sfx(n.sfx || 'ding', at, .7); s.shake(at, .25, 6); return el; };
    return P;
  };
  /** Big notification banner over any scene (iOS style). */
  S.notify = function (o = {}) {
    const R = this.R, L = this.layer(o.x ?? R.w / 2, o.y ?? 330, o.parent), el = mk('div', 'sm-note sm-banner', L, `<div class="nh"><span class="ic">${o.icon || SM.mark('dark', 34)}</span><b>${esc(o.app || 'STACKO')}</b><em>${esc(o.time || 'now')}</em></div><div class="tt">${esc(o.title || '')}</div><div class="tx">${esc(o.text || '')}</div>`);
    centerBox(el, -50, 0); if (o.w) el.style.width = o.w + 'px';
    const at = o.at || 0; this.anim(L, { y: [-420, 0], o: [0, 1] }, at, .6, 'outBack'); this.sfx(o.sfx || 'ding', at + .1, .7);
    if (o.outAt != null) this.anim(L, { y: -420, o: 0 }, o.outAt, .45, 'inBack');
    return { layer: L, el };
  };
  /** Notification / chat storm: many bubbles flood the screen (the "where's the shipment?" problem). */
  S.storm = function (o = {}) {
    const EN = [['Ahmad', 'Where is the shipment?', ''], ['Client · Rami', "Where's my order??", ''], ['Rana', 'Is the container in?', ''], ['Hadi', 'Did the LED strips reach Sidon?', ''], ['Showroom', 'Do we have 40 units?', ''], ['Omar', 'Which branch has it?', ''], ['Client · Maya', 'Any update?', ''], ['Accounting', 'Invoice qty ≠ received?', ''], ['Ahmad', 'Where is the truck?', ''], ['Driver', 'Sidon or Tripoli?', '']];
    const AR = [['أحمد', 'وين صارت البضاعة؟', 'ar'], ['الزبون · رامي', 'وين صارت طلبيتي؟', 'ar'], ['رنا', 'وصل الكونتينر؟', 'ar'], ['هادي', 'بعتولي الـLED لصيدا؟', 'ar'], ['المعرض', 'عنّا ٤٠ قطعة؟', 'ar'], ['عمر', 'بأيّ فرع البضاعة؟', 'ar'], ['الزبون · مايا', 'في شي جديد؟', 'ar'], ['المحاسبة', 'الفاتورة مش مطابقة؟', 'ar'], ['أحمد', 'وين الشاحنة؟', 'ar'], ['السائق', 'صيدا ولّا طرابلس؟', 'ar']];
    const s = this, R = s.R, msgs = o.messages || (SM.lang === 'ar' ? AR : EN);
    const n = o.count || 14, at = o.at || 0, d = o.dur || 2.6, r = SM.rng(o.seed || 5), area = o.area || [250, 300, R.w - 250, R.h - 480], out = [];
    for (let i = 0; i < n; i++) {
      const [nm, txt, lg] = msgs[i % msgs.length], x = area[0] + r() * (area[2] - area[0]), y = area[1] + r() * (area[3] - area[1]), t0 = at + d * Math.pow(i / n, 1.35);
      const L = s.layer(x, y), b = mk('div', 'sm-bub' + (lg === 'ar' ? ' ar' : ''), L, `<span class="nm">${esc(nm)}</span>${esc(txt)}`); b.style.fontSize = (o.size || 40) + 'px';
      s.set(L, { r: (r() - .5) * 14 }); s.anim(L, { o: [0, 1], s: [.3, 1] }, t0, .35, 'outBack'); s.sfx('buzz', t0, .35); out.push(L);
      if (o.clearAt != null) s.anim(L, { y: R.h * .9 + r() * 300, r: (r() - .5) * 60, o: 0 }, o.clearAt + r() * .25, .6, 'inQuad');
    }
    if (o.shake !== false) for (let i = 0; i < 4; i++) s.shake(at + d * (i / 4), .25, 8 + i * 3);
    return out;
  };

  /* ---------------------------------------------------------------- device frames with real screenshots */
  S.device = function (o = {}) {
    const R = this.R, type = o.type || 'phone', L = this.layer(o.x ?? R.w / 2, o.y ?? R.h / 2, o.parent);
    const spec = { phone: [414, 896, 12, 52, 44], tablet: [880, 640, 26, 42, 22], laptop: [1280, 800, 22, 22, 10], monitor: [1280, 760, 18, 18, 8] }[type] || [414, 896, 12, 52, 44];
    const [w0, h0, pad, rad, irad] = spec, k = (o.w || (type === 'phone' ? 620 : 960)) / w0;
    const dev = mk('div', 'sm-dev ' + type, L); dev.style.width = w0 + 'px'; dev.style.height = h0 + 'px'; dev.style.borderRadius = rad + 'px'; scaledBox(dev, k);
    const sc = mk('div', 'sc', dev); sc.style.inset = pad + 'px'; sc.style.borderRadius = irad + 'px'; if (type === 'phone') mk('div', 'island', dev).style.cssText = 'position:absolute;left:50%;top:22px;width:112px;height:32px;border-radius:20px;background:#050D18;transform:translateX(-50%)';
    if (type === 'laptop') mk('div', 'base', dev);
    let img = null; if (o.src) { img = mk('img', '', sc); img.src = o.src; if (o.fit === 'cover' || !o.scroll) { img.style.height = '100%'; img.style.objectFit = 'cover'; img.style.objectPosition = o.focus || '50% 0%'; } }
    if (o.html) sc.innerHTML = o.html;
    if (o.scroll && img) { const a = o.scroll.at || 0, d = o.scroll.dur || 3; this.on(a, a + d, p => { const hh = img.offsetHeight - sc.offsetHeight; const fr = (o.scroll.from || 0) + ((o.scroll.to ?? 1) - (o.scroll.from || 0)) * E.inOutCubic(p); img.style.transform = `translateY(${f2(-Math.max(0, hh) * fr)}px)`; }); }
    if (o.glare !== false) { const g = mk('div', 'sm-fill', sc); g.style.background = 'linear-gradient(115deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.16) 45%,rgba(255,255,255,0) 55%)'; g.style.pointerEvents = 'none'; this.set(g, { x: -w0 }); this.anim(g, { x: [-w0, w0] }, (o.at || 0) + .6, 1.6, 'inOutQuad'); }
    if (o.tilt) this.set(L, { persp: 2000, ry: o.tilt === 'left' ? 16 : o.tilt === 'right' ? -16 : (o.tilt.ry || 0), rx: o.tilt.rx || 0 });
    if (o.in) this.enter(L, o.in, o.at || 0, o); if (o.out) this.exit(L, o.out, o.outAt, o);
    return { layer: L, dev, screen: sc, img, k };
  };

  /* ---------------------------------------------------------------- invoice → draft (AI reading) */
  const INV = [['LED strip light 5m, 12V', 600, '1,260.00', 'LED Strip 5m', 'SKU-10240'], ['TWS wireless earbuds', 300, '2,040.00', 'Wireless Earbuds', 'SKU-10925'], ['Yoga mat 6mm, TPE', 180, '756.00', 'Yoga Mat', null], ['PP storage box 45L', 120, '432.00', 'Storage Box', null]];
  S.invoice = function (o = {}) {
    const s = this, R = s.R, items = o.items || INV, L = s.layer(o.x ?? R.w / 2, o.y ?? 640, o.parent);
    const p = mk('div', 'sm-paper', L, `<div class="co">${esc(o.supplier || 'SUPPLIER TRADING CO., LTD.')}</div><div class="ad">${esc(o.city || 'Shenzhen, China')}</div><div class="meta"><span>Invoice <b>${esc(o.no || 'SZ-2611-084')}</b></span><span>${esc(o.date || '14 Oct 2026 · FOB')}</span></div><table><thead><tr><th>DESCRIPTION</th><th class="n">QTY</th><th class="n">USD</th></tr></thead><tbody>${items.map(i => `<tr><td>${esc(i[0])}</td><td class="n">${i[1]}</td><td class="n">${esc(i[2])}</td></tr>`).join('')}<tr><td><b>TOTAL · 1 × 40ft</b></td><td class="n"><b>${items.reduce((a, i) => a + i[1], 0).toLocaleString('en')}</b></td><td class="n"><b>${esc(o.total || '4,488.00')}</b></td></tr></tbody></table><div class="ex">COMMERCIAL INVOICE · EXAMPLE</div>`);
    p.style.width = (o.w || 900) + 'px'; centerBox(p); if (o.rot) s.set(L, { r: o.rot });
    if (o.in) s.enter(L, o.in, o.at || 0, o);
    const rows = [...p.querySelectorAll('tbody tr')].slice(0, items.length);
    const api = { layer: L, paper: p, rows,
      scan(at, d = 1.6) { const beam = mk('div', 'beam', p); s.set(beam, { o: 0 }); s.anim(beam, { o: [0, 1] }, at, .15).anim(beam, { o: 0 }, at + d, .2); s.on(at, at + d, q => { beam.style.top = f2(-90 + (p.offsetHeight + 90) * E.inOutQuad(q)) + 'px'; });
        rows.forEach((r, i) => s.on(at + d * (.25 + i * .14), at + d * (.25 + i * .14) + .01, (q, lt) => r.classList.toggle('hit', lt >= 0))); s.sfx('scan', at, .6); return api; },
      draft(at, dd = {}) {
        const L2 = s.layer(dd.x ?? R.w / 2, dd.y ?? 1340), dr = mk('div', 'sm-paper draft', L2, `<div class="st"><span style="color:#2C5974;font-size:22px">${esc(dd.label || SM.t('Incoming shipment · AI draft', 'شحنة واردة · مسودّة الذكاء الاصطناعي'))}</span><b>${esc(dd.code || 'SHP-24017')}</b></div><div class="rt">${esc(dd.route || 'Sea · Shenzhen → Port of Beirut → WH-02 Sidon')}</div><table><tbody>${items.map(i => `<tr><td>${esc(i[3])}${i[4] ? '' : `<span class="newi">${SM.t('New item', 'صنف جديد')}</span>`}<br><small style="color:#2C5974;font-size:18px">${i[4] ? esc(i[4]) : SM.t('Confirm before it’s created', 'أكّد قبل ما ينضاف')}</small></td><td class="n">${i[1]}</td></tr>`).join('')}</tbody></table><div class="tot">${items.reduce((a, i) => a + i[1], 0).toLocaleString('en')} ${SM.t('units on the way · ETA about 32 days', 'قطعة عالطريق · الوصول بعد ٣٢ يوم تقريباً')}</div>`);
        dr.style.width = (dd.w || 900) + 'px'; centerBox(dr, -50, 0); s.anim(L2, { o: [0, 1], y: [80, 0] }, at, .6, 'outQuart');
        [...dr.querySelectorAll('tbody tr')].forEach((r, i) => { s.anim(r, { o: [0, 1], x: [-60, 0] }, at + .35 + i * (dd.stagger || .32), .45, 'outBack'); s.sfx('pop', at + .35 + i * (dd.stagger || .32), .35); const ni = r.querySelector('.newi'); if (ni) s.anim(ni, { s: [0, 1] }, at + .7 + i * (dd.stagger || .32), .4, 'outBack'); });
        const tot = dr.querySelector('.tot'); s.anim(tot, { o: [0, 1] }, at + .5 + items.length * (dd.stagger || .32), .4);
        return { layer: L2, el: dr };
      },
    };
    return api;
  };

  /* ---------------------------------------------------------------- cards, ledger, KPIs, callouts */
  S.card = function (o = {}) {
    if (!o.lang && SM.isAr((o.title || '') + (o.body || '') + (o.kicker || ''))) o = Object.assign({}, o, { lang: 'ar' });
    const R = this.R, L = this.layer(o.x ?? R.w / 2, o.y ?? R.h / 2, o.parent), c = mk('div', 'sm-card' + (o.dark ? ' dark' : ''), L, `${o.icon ? `<div style="margin-bottom:14px;color:${o.dark ? C.glow : C.ocean}">${SM.icon(o.icon, 64)}</div>` : ''}${o.kicker ? `<div class="kick">${esc(o.kicker)}</div>` : ''}${o.title ? `<h3>${esc(o.title)}</h3>` : ''}${o.body ? `<p>${esc(o.body)}</p>` : ''}${o.html || ''}`);
    c.style.width = (o.w || 860) + 'px'; centerBox(c, o.ax ?? -50, o.ay ?? -50); if (o.lang === 'ar') { c.style.direction = 'rtl'; c.style.fontFamily = "'Noto Kufi Arabic','Readex Pro',sans-serif"; }
    if (o.rot) this.set(L, { r: o.rot }); if (o.in) this.enter(L, o.in, o.at || 0, o); if (o.out) this.exit(L, o.out, o.outAt, o);
    return { layer: L, el: c };
  };
  const LEDGER = [['10:54', 'System', 'on arrival', 'IN', '40 × LED Strip 5m', 'WH-02 Sidon', '85 → 125'], ['09:41', 'Hadi', 'Telegram · approved by Karim', 'TRANSFER', '40 × LED Strip 5m', 'WH-01 → WH-02', '640 → 600'], ['09:12', 'Rana', 'Invoice · approved by Maya', 'SHIPMENT', '1,200 units', 'Shenzhen → WH-02', '+1,200 incoming'], ['08:55', 'Omar', 'App', 'OUT', '12 × Desk Fan', 'WH-03 Tripoli', '95 → 83']];
  S.ledger = function (o = {}) {
    const s = this, R = s.R, rows = o.rows || LEDGER, L = s.layer(o.x ?? R.w / 2, o.y ?? R.h / 2, o.parent);
    const c = mk('div', 'sm-card sm-ledger', L, `<div class="kick">${esc(o.kicker || SM.t('Audit trail · example entries', 'سجلّ الحركات · أمثلة'))}</div><h3>${esc(o.title || SM.t("Today's ledger", 'سجلّ اليوم'))}</h3><table><thead><tr><th>${SM.t('Time', 'الوقت')}</th><th>${SM.t('Who', 'مين')}</th><th>${SM.t('What', 'شو')}</th><th>${SM.t('Before → after', 'قبل ← بعد')}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}<small>${esc(r[2])}</small></td><td><span class="op">${r[3]}</span>${esc(r[4])}<small>${esc(r[5])}</small></td><td>${esc(r[6])}</td></tr>`).join('')}</tbody></table>`);
    c.style.width = (o.w || 960) + 'px'; centerBox(c); if (o.in) s.enter(L, o.in, o.at || 0, o);
    const trs = [...c.querySelectorAll('tbody tr')], at = (o.at || 0) + .35;
    trs.forEach((r, i) => { s.anim(r, { o: [0, 1], x: [80, 0] }, at + i * (o.stagger || .28), .45, 'outQuart'); s.sfx('tick', at + i * (o.stagger || .28), .3); });
    if (o.highlight != null) s.on(o.hlAt ?? at + trs.length * .3 + .3, s.dur, (p, lt) => trs.forEach((r, i) => r.classList.toggle('hi', lt >= 0 && i === o.highlight)));
    return { layer: L, el: c, rows: trs };
  };
  S.kpis = function (o = {}) {
    const s = this, R = s.R, items = o.items || [[SM.t('Units in stock', 'قطع بالمخازن'), 15350], [SM.t('In transit', 'عالطريق'), 1240], [SM.t('Low-stock lines', 'أصناف ناقصة'), 4, true]], L = s.layer(o.x ?? R.w / 2, o.y ?? R.h / 2, o.parent);
    const row = mk('div', 'sm-kpis', L); centerBox(row); if (o.vertical) row.style.flexDirection = 'column';
    items.forEach((it, i) => { const k = mk('div', 'sm-kpi' + (it[2] ? ' alert' : ''), row, `<b>0</b><small>${esc(it[0])}</small>`), b = k.firstChild, a = (o.at || 0) + i * .18; s.anim(k, { o: [0, 1], y: [50, 0] }, a, .5, 'outBack'); let last = ''; s.on(a + .1, a + 1.3, p => { const v = SM.fmtNum(it[1] * E.outExpo(p), {}); if (v !== last) b.textContent = last = v; }); });
    return { layer: L, el: row };
  };
  S.callout = function (o = {}) {
    const s = this, L = s.layer(o.x, o.y, o.parent), dx = o.dx ?? 160, dy = o.dy ?? -140, NSv = document.createElementNS(NS, 'svg');
    NSv.setAttribute('width', 1); NSv.setAttribute('height', 1); NSv.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
    NSv.innerHTML = `<circle r="16" fill="none" stroke="${o.color || C.glow}" stroke-width="5"/><circle r="6" fill="${o.color || C.glow}"/><path d="M0 0 L${dx} ${dy}" stroke="${o.color || C.glow}" stroke-width="4" fill="none" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`;
    L.appendChild(NSv); const [lb, lbi] = wrapAt(L, dx, dy, 'sm-callout' + (o.light ? ' light' : ''), esc(o.label || '')); lbi.style.transform = `translate(${dx < 0 ? -100 : 0}%,-50%)`;
    const at = o.at || 0, pth = NSv.querySelector('path'); s.set(L, { o: 0 }); s.anim(L, { o: [0, 1] }, at, .2); s.on(at, at + .45, p => pth.setAttribute('stroke-dashoffset', String(1 - E.outCubic(p)))); s.anim(lb, { o: [0, 1], s: [.6, 1] }, at + .3, .4, 'outBack');
    if (o.outAt != null) s.anim(L, { o: 0 }, o.outAt, .3);
    return { layer: L, label: lb };
  };

  /* ---------------------------------------------------------------- spreadsheet chaos */
  S.sheet = function (o = {}) {
    const s = this, R = s.R, cols = o.cols || 12, rows = o.rows || 42, r = SM.rng(o.seed || 3), L = s.layer(o.x ?? R.w / 2, o.y ?? R.h / 2, o.parent);
    const sh = mk('div', 'sm-sheet', L); sh.style.width = (o.w || 960) + 'px'; sh.style.height = (o.h || 1300) + 'px'; centerBox(sh); if (o.rot) s.set(L, { r: o.rot });
    sh.innerHTML = `<div class="bar">${SM.icon('sheet', 26, '#2F86B8')}<b style="color:#0E2440">${esc(o.file || 'stock_FINAL_v7_USE_THIS_ONE.xlsx')}</b></div><div class="grid"></div><div class="tabs">${(o.tabs || ['Beirut', 'Sidon (old)', 'FINAL', 'FINAL_v2', 'FINAL_v7_USE_THIS_ONE', 'Copy of stock (3)', 'DONT TOUCH']).map((t, i) => `<span class="${i === 4 ? 'on' : ''}">${esc(t)}</span>`).join('')}</div>`;
    const heads = ['', 'SKU', 'Item', 'Beirut', 'Sidon', 'Tripoli', 'In transit', 'Total', 'Last count', 'Who', 'Notes', 'Check', '??'];
    const names = ['LED Strip 5m', 'Security Cam', 'USB-C 1m', 'Desk Fan', 'Power Bank', 'Earbuds', 'Phone Case', 'Smart Plug', 'Kitchen Scale', 'Bottle 1L', 'Speaker', 'Wall Clock', 'Yoga Mat', 'Car Charger', 'Desk Lamp', 'Backpack', 'Storage Box', 'Hair Dryer'];
    let h = '<table><tr>' + heads.slice(0, cols + 1).map(x => `<td class="h">${x}</td>`).join('') + '</tr>'; const red = [];
    for (let i = 0; i < rows; i++) { h += `<tr><td class="h">${i + 2}</td>`; for (let c = 1; c <= cols; c++) { let v = ''; if (c === 1) v = 'SKU-' + (10240 + i * 137); else if (c === 2) v = names[i % names.length]; else if (c < 8) v = Math.floor(r() * 900); else if (c === 8) v = ['12/10', '03/09', '??', '28/10', 'old'][Math.floor(r() * 5)]; else if (c === 9) v = ['Hadi', 'Rana', 'Omar', '?'][Math.floor(r() * 4)]; else if (c === 10) v = ['check w/ Hadi', 'moved?', '', 'recount', 'see WhatsApp'][Math.floor(r() * 5)]; else v = r() > .6 ? '#REF!' : ''; const isRed = c > 2 && r() < .07; h += `<td class="${isRed ? 'red' : ''}" data-r="${isRed ? 1 : 0}">${v}</td>`; } h += '</tr>'; }
    sh.querySelector('.grid').innerHTML = h + '</table>';
    const grid = sh.querySelector('.grid'), reds = [...sh.querySelectorAll('td[data-r="1"]')];
    if (o.in) s.enter(L, o.in, o.at || 0, o);
    const sc = o.scroll || { at: o.at || 0, dur: s.dur, x: -900, y: -1100 };
    s.on(sc.at, sc.at + sc.dur, p => { const e = E.inQuad(p); grid.style.transform = `translate(${f2((sc.x || 0) * e)}px,${f2((sc.y || 0) * e)}px)`; });
    s.on(sc.at, sc.at + sc.dur, (p, lt, t) => { const fr = Math.floor(t * 6); reds.forEach((c, i) => { const on = noise(fr + i * 3.1) > .45; c.style.visibility = on ? '' : 'hidden'; }); });
    return { layer: L, el: sh, grid,
      collapse(at, d = .9) { const tds = [...grid.querySelectorAll('td')]; s.on(at, at + d, p => { const e = E.inBack(p); tds.forEach((td, i) => { const k = clamp(e * 1.2 - noise(i) * .2); td.style.transform = `scale(${f2(1 - k)})`; td.style.borderRadius = f2(50 * k) + '%'; td.style.background = k > .3 ? (noise(i * 1.7) > .6 ? C.glow : C.ocean) : ''; td.style.color = k > .2 ? 'transparent' : ''; }); }); s.anim(L, { s: [1, .4], o: [1, 0] }, at + d * .6, d * .5, 'inQuad'); s.sfx('whoosh', at, .7); },
    };
  };

  /* ---------------------------------------------------------------- sticky notes rain */
  S.notes = function (o = {}) {
    const s = this, R = s.R, texts = o.texts || (SM.lang === 'ar' ? ['٤٠ LED لصيدا؟', 'هادي أخد ١٢ مروحة', 'إعادة جرد المستودع ٢!!', 'الكونتينر التلاتا؟', 'إسأل رنا', 'ما تبيعوا الـyoga mats', 'طرابلس: باقي ٣؟', 'شيّك الفاتورة'] : ['40 LED → Sidon?', 'Hadi took 12 fans', 'recount WH-2!!', 'container Tue?', 'ask Rana', 'DONT sell yoga mats', 'Tripoli: 3 left?', 'check invoice']), r = SM.rng(o.seed || 7), at = o.at || 0, area = o.area || [140, 340, R.w - 140, R.h - 460], out = [];
    texts.forEach((t, i) => { const x = area[0] + r() * (area[2] - area[0]), y = area[1] + r() * (area[3] - area[1]), L = s.layer(x, y), n = mk('div', 'sm-sticky', L, esc(t)); if (o.size) n.style.fontSize = o.size + 'px';
      const a = at + i * (o.stagger ?? .16); s.anim(L, { o: [0, 1] }, a, .1).anim(L, { y: [-R.h * .7, 0], r: [(r() - .5) * 80, (r() - .5) * 16] }, a, .75, 'outBack'); s.sfx('paper', a + .5, .35); out.push(L);
      if (o.clearAt != null) s.anim(L, { y: R.h, r: (r() - .5) * 90 }, o.clearAt + i * .04, .55, 'inQuad'); });
    return out;
  };

  /* ---------------------------------------------------------------- before / after */
  S.compare = function (o = {}) {
    const s = this, R = s.R, x = o.x ?? R.w / 2, y = o.y ?? R.h / 2, w = o.w || R.w, h = o.h || R.h, L = s.layer(x, y, o.parent), box = mk('div', '', L);
    box.style.cssText = `position:absolute;width:${w}px;height:${h}px;left:${-w / 2}px;top:${-h / 2}px;overflow:hidden;border-radius:${o.radius ?? 0}px`;
    const pane = (src, cls) => { const p = mk('div', 'sm-fill', box); if (/\.(png|jpe?g|webp)$/i.test(src || '')) p.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover">`; else if (src) p.innerHTML = src; return p; };
    const before = pane(o.before), after = pane(o.after); const div = mk('div', '', box); div.style.cssText = `position:absolute;top:0;bottom:0;width:6px;margin-left:-3px;background:#fff;box-shadow:0 0 30px rgba(0,0,0,.4)`;
    const knob = mk('div', '', div, SM.icon('arrow', 40, '#0E2440', 2.6)); knob.style.cssText = 'position:absolute;left:50%;top:50%;width:92px;height:92px;margin:-46px 0 0 -46px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.35)';
    const lab = (t, side) => { const l = mk('div', '', box, esc(t)); l.style.cssText = `position:absolute;top:${o.labelY ?? 250}px;${side}:40px;background:rgba(14,36,64,.85);color:#fff;font-weight:600;font-size:32px;padding:10px 22px;border-radius:999px;letter-spacing:.06em;text-transform:uppercase`; return l; };
    lab(o.beforeLabel || SM.t('Before', 'قبل'), 'left'); const la = lab(o.afterLabel || SM.t('After', 'بعد'), 'right');
    const at = o.at || 0, d = o.dur || 1.8, a = o.from ?? .92, b = o.to ?? .08;
    s.on(-1, s.dur + 1, (p, lt, t) => { const q = E.inOutCubic(clamp((t - s.T(at)) / d)), pos = a + (b - a) * q; after.style.clipPath = `inset(0 0 0 ${f2(pos * 100)}%)`; div.style.left = f2(pos * w) + 'px'; });
    s.sfx('swoosh', at, .5);
    return { layer: L, before, after };
  };

  /* ---------------------------------------------------------------- checklist */
  S.checklist = function (o = {}) {
    const s = this, R = s.R, items = o.items || (SM.lang === 'ar' ? ['جرد بنفس النهار', 'تتبّع كل فرق', 'صلّح السبب'] : ['Count the same day', 'Trace every gap', 'Fix the cause']), L = s.layer(o.x ?? R.w / 2, o.y ?? R.h / 2, o.parent);
    const wrap = mk('div', o.card === false ? 'sm-check' : 'sm-card sm-check' + (o.dark ? ' dark' : ''), L); centerBox(wrap); wrap.style.width = (o.w || 860) + 'px'; if (o.card === false) wrap.style.color = o.color || '#fff';
    if (o.title) mk('h3', '', wrap, esc(o.title));
    const at = o.at || 0, st = o.stagger || .45;
    items.forEach((t, i) => { const it = mk('div', 'it', wrap, `<span class="bx"><span class="fillc"></span>${SM.icon('check', 40, '#fff', 3.2)}</span><span>${esc(t)}</span>`), fc = it.querySelector('.fillc'), pth = it.querySelector('path');
      pth.setAttribute('pathLength', '1'); pth.setAttribute('stroke-dasharray', '1 1');
      const a = at + .2 + i * st; s.anim(it, { o: [0, 1], x: [-40, 0] }, a - .15, .4, 'outQuart'); s.set(fc, { s: 0 }); s.anim(fc, { s: [0, 1] }, a + .25, .3, 'outBack');
      s.on(a + .3, a + .6, p => pth.setAttribute('stroke-dashoffset', String(1 - p))); s.sfx('check', a + .3, .5); });
    return { layer: L, el: wrap };
  };

  /* ---------------------------------------------------------------- flow (nodes + travelling pulse) */
  S.flow = function (o = {}) {
    const s = this, R = s.R, nodes = o.nodes || (SM.lang === 'ar' ? [{ icon: 'msg', t: 'رسالة وحدة', sub: 'تلغرام، بكلامك' }, { icon: 'ai', t: 'الذكاء الاصطناعي بيحضّرها', sub: 'الصنف، الكمية، من، لوين' }, { icon: 'user', t: 'المدير بيوافق', sub: 'ما في شي بيتحرّك قبل' }, { icon: 'map', t: 'الشاحنة عالخريطة', sub: 'وقت الوصول عم ينقص' }] : [{ icon: 'msg', t: 'One message', sub: 'Telegram, in your words' }, { icon: 'ai', t: 'AI drafts it', sub: 'Item, qty, from, to' }, { icon: 'user', t: 'Manager approves', sub: 'Nothing moves before' }, { icon: 'map', t: 'Truck on the map', sub: 'ETA counts down' }]);
    const x = o.x ?? R.w / 2, y0 = o.y ?? 480, gap = o.gap || 290, L = s.layer(x, y0, o.parent), at = o.at || 0, st = o.stagger || .55, NSv = document.createElementNS(NS, 'svg');
    NSv.setAttribute('width', 1); NSv.setAttribute('height', 1); NSv.style.cssText = 'position:absolute;left:0;top:0;overflow:visible'; L.appendChild(NSv);
    const els = nodes.map((n, i) => { const [w, e] = wrapAt(L, 0, i * gap, 'nd', `<span class="ic">${SM.icon(n.icon, 44)}</span><span><b>${esc(n.t)}</b>${n.sub ? `<small>${esc(n.sub)}</small>` : ''}</span>`); e.style.transform = 'translate(-50%,-50%)'; w.inner = e; return w; });
    for (let i = 0; i < nodes.length - 1; i++) { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', `M0 ${i * gap + 62} L0 ${(i + 1) * gap - 62}`); p.setAttribute('stroke', C.dolphin); p.setAttribute('stroke-width', '5'); p.setAttribute('stroke-dasharray', '1 1'); p.setAttribute('pathLength', '1'); p.setAttribute('stroke-dashoffset', '1'); NSv.appendChild(p); const a = at + i * st + .35; s.on(a, a + .35, q => p.setAttribute('stroke-dashoffset', String(1 - q))); }
    const pulse = document.createElementNS(NS, 'circle'); pulse.setAttribute('r', '12'); pulse.setAttribute('fill', C.glow); NSv.appendChild(pulse);
    els.forEach((e, i) => { const a = at + i * st; s.anim(e, { o: [0, 1], s: [.7, 1] }, a, .45, 'outBack'); s.sfx('pop', a, .4); s.on(a + .2, a + .21, (p, lt) => e.inner.classList.toggle('on', lt >= 0 && (i === nodes.length - 1 || lt < st))); });
    const tot = at + (nodes.length - 1) * st + .4; s.on(at, tot, p => { pulse.setAttribute('cy', f2(p * (nodes.length - 1) * gap)); pulse.setAttribute('opacity', p > 0 && p < 1 ? 1 : 0); });
    return { layer: L, nodes: els };
  };

  /* ---------------------------------------------------------------- import journey (China → shelf) */
  S.journey = function (o = {}) {
    const s = this, R = s.R, stops = o.stops || (SM.lang === 'ar' ? [{ t: 'شنجن', sub: 'المورّد بيشحن · اليوم ٠', icon: 'sea', day: 0 }, { t: 'قناة السويس', sub: 'بالبحر', icon: 'sea', day: 18 }, { t: 'مرفأ بيروت', sub: 'جمرك · حوالى يومين', icon: 'customs', day: 30 }, { t: 'WH-02 صيدا', sub: 'شاحنة · البضاعة بتوصل', icon: 'road', day: 32 }] : [{ t: 'Shenzhen', sub: 'Supplier ships · Day 0', icon: 'sea', day: 0 }, { t: 'Suez Canal', sub: 'At sea', icon: 'sea', day: 18 }, { t: 'Port of Beirut', sub: 'Customs · about 2 days', icon: 'customs', day: 30 }, { t: 'WH-02 Sidon', sub: 'Truck · stock lands', icon: 'road', day: 32 }]);
    const x = o.x ?? 250, y0 = o.y ?? 470, gap = o.gap || 330, at = o.at || 0, d = o.dur || 4.5, L = s.layer(x, y0, o.parent), J = mk('div', 'sm-journey', L), NSv = document.createElementNS(NS, 'svg');
    NSv.setAttribute('width', 1); NSv.setAttribute('height', 1); NSv.style.cssText = 'position:absolute;left:0;top:0;overflow:visible'; J.appendChild(NSv);
    const H = (stops.length - 1) * gap, path = `M0 0 C 90 ${gap * .35}, -90 ${gap * .65}, 0 ${gap}` + stops.slice(2).map((_, i) => ` S ${i % 2 ? 90 : -90} ${gap * (i + 2) - gap * .35}, 0 ${gap * (i + 2)}`).join('');
    NSv.innerHTML = `<path d="${path}" fill="none" stroke="rgba(201,216,228,.35)" stroke-width="6" stroke-dasharray="14 14"/><path class="pr" d="${path}" fill="none" stroke="${C.glow}" stroke-width="7" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`;
    const pr = NSv.querySelector('.pr');
    const els = stops.map((st, i) => { const [w, e] = wrapAt(J, -17, i * gap, 'stop', `<span class="dt"></span><span><b>${esc(st.t)}</b><small>${esc(st.sub || '')}</small></span>`); s.anim(w, { o: [0, 1], x: [-47, -17] }, at + i * d / (stops.length - 1) - .2, .4, 'outQuart'); s.on(at + i * d / (stops.length - 1), at + i * d / (stops.length - 1) + .01, (p, lt) => e.classList.toggle('on', lt >= 0)); return w; });
    const veh = mk('div', '', J, SM.ICON.sea); veh.style.cssText = 'position:absolute;left:0;top:0;line-height:0;filter:drop-shadow(0 6px 10px rgba(0,0,0,.4))';
    const day = mk('div', 'day', J); day.style.cssText = `position:absolute;left:${o.dayX ?? 520}px;top:${o.dayY ?? -40}px;font-size:${o.daySize || 84}px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:-.03em;white-space:nowrap`;
    const totalDays = stops[stops.length - 1].day;
    s.on(at, at + d, p => {
      const e = E.inOutSine(p); pr.setAttribute('stroke-dashoffset', String(1 - e)); const tl = pr.getTotalLength(), pt = pr.getPointAtLength(tl * e), pt2 = pr.getPointAtLength(Math.min(tl, tl * e + 2));
      const seg = Math.min(stops.length - 2, Math.floor(e * (stops.length - 1))), kind = stops[seg + 1].icon === 'road' ? 'road' : stops[seg + 1].icon === 'air' ? 'air' : 'sea';
      if (veh.dataset.k !== kind) { veh.innerHTML = SM.ICON[kind]; veh.dataset.k = kind; }
      const dir = pt2.x - pt.x < -0.05 ? -1 : 1, bob = Math.sin(p * 40) * 4; veh.style.transform = `translate(${f2(pt.x - (o.vehGap ?? 96))}px,${f2(pt.y - 10 + bob)}px) translate(-50%,-50%) scale(${f2(3.2 * dir)},3.2)`;
      day.textContent = `${o.dayLabel || SM.t('Day', 'اليوم')} ${Math.round(totalDays * e)}`;
    });
    return { layer: L, stops: els, day };
  };

  /* ---------------------------------------------------------------- poll / quiz sticker */
  S.poll = function (o = {}) {
    o = Object.assign({ lang: SM.lang }, o);
    const s = this, R = s.R, ops = o.options || [['1–2', 22], ['3–5', 51], ['6+', 27]], L = s.layer(o.x ?? R.w / 2, o.y ?? R.h / 2, o.parent), at = o.at || 0;
    const p = mk('div', 'sm-poll', L, `<div class="q">${esc(o.q || SM.t('How many warehouses do you run?', 'كم مستودع عندك؟'))}</div>${ops.map(op => `<div class="op"><i></i><span>${esc(op[0])}</span><span class="pc"></span></div>`).join('')}${o.note ? `<div style="text-align:center;font-size:22px;color:#2C5974;margin-top:16px">${esc(o.note)}</div>` : ''}`);
    centerBox(p); if (o.lang === 'ar') { p.style.direction = 'rtl'; p.style.fontFamily = "'Noto Kufi Arabic','Readex Pro',sans-serif"; }
    s.anim(L, { o: [0, 1], s: [.7, 1], r: [-4, 0] }, at, .5, 'outBack');
    const opEls = [...p.querySelectorAll('.op')], rv = o.revealAt ?? at + 1.2, max = Math.max(...ops.map(x => x[1] || 0));
    opEls.forEach((e, i) => { const bar = e.querySelector('i'), pc = e.querySelector('.pc'), v = ops[i][1];
      if (o.quiz) { s.on(rv, rv + .01, (q, lt) => { e.classList.toggle('right', lt >= 0 && i === o.correct); e.classList.toggle('wrong', lt >= 0 && i !== o.correct && i === o.picked); }); return; }
      s.on(rv, rv + 1, q => { const k = E.outCubic(q); bar.style.width = f2(v * k) + '%'; pc.textContent = q > 0 ? Math.round(v * k) + '%' : ''; e.classList.toggle('win', q > 0 && v === max); }); });
    if (!o.quiz) s.sfx('swoosh', rv, .4); else s.sfx('ding', rv, .6);
    return { layer: L, el: p };
  };

  /* ---------------------------------------------------------------- cursor */
  S.cursor = function (o = {}) {
    const s = this, pts = o.points || [], L = mk('div', 'sm-cursor', s.el); L.innerHTML = `<svg width="44" height="54" viewBox="0 0 22 27"><path d="M2 1 L2 21 L7 16.5 L10.5 25 L14 23.5 L10.5 15.5 L17 15.5 Z" fill="#fff" stroke="#0E2440" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
    const rp = mk('div', 'rp', L); s.set(rp, { o: 0 });
    s.on(-1, s.dur + 1, (p, lt, t) => { const tt = t - s.start; let a = pts[0], b = pts[0], q = 0; for (let i = 0; i < pts.length; i++) { if (pts[i].at <= tt) { a = pts[i]; b = pts[i + 1] || pts[i]; } } if (b !== a) q = E.inOutCubic(clamp((tt - a.at) / Math.max(.01, (b.at - a.at) * .85))); L.style.left = f2(a.x + (b.x - a.x) * q) + 'px'; L.style.top = f2(a.y + (b.y - a.y) * q) + 'px'; L.style.opacity = tt < (pts[0] ? pts[0].at : 0) ? 0 : 1; });
    pts.filter(p => p.click).forEach(p => { s.anim(rp, { o: [1, 0], s: [.3, 1.6] }, p.at + .05, .45, 'outCubic'); s.sfx('click', p.at, .6); });
    return L;
  };

  /* ---------------------------------------------------------------- clock / day timeline */
  S.clock = function (o = {}) {
    const s = this, R = s.R, from = o.from ?? 8 * 60, to = o.to ?? 18 * 60, at = o.at || 0, d = o.dur || s.dur - at;
    const T = s.text('08:00', Object.assign({ size: o.size || 170, fx: 'fade', y: o.y ?? 360, x: o.x }, o.text || {})); T.box.style.fontVariantNumeric = 'tabular-nums'; T.box.style.fontWeight = '700';
    const marks = o.marks || []; let last = '';
    s.on(at, at + d, p => { const m = Math.round(from + (to - from) * (o.ease ? SM.easeFn(o.ease)(p) : p)); let v = `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; if (v !== last) { T.box.textContent = v; last = v; } });
    marks.forEach(mk2 => s.sfx('tick', mk2, .4));
    return T;
  };

  /* ---------------------------------------------------------------- captions (karaoke) */
  /** words: [{w:'Three', s:0.2, e:0.5}, ...] (scene-local) — or o.elevenlabs: alignment JSON — or o.text + o.wps for even timing */
  S.captions = function (o = {}) {
    o = Object.assign({ lang: SM.lang }, o);
    const s = this, R = s.R; let words = o.words;
    if (!words && o.elevenlabs) words = SM.wordsFromAlignment(o.elevenlabs, o.offset || 0);
    if (!words && o.text) { const ws = o.text.split(/\s+/), st = o.at || 0, wps = o.wps || 2.6; words = ws.map((w, i) => ({ w, s: st + i / wps, e: st + (i + 1) / wps })); }
    words = words || []; const max = o.max || 4, groups = []; let g = [];
    words.forEach((w, i) => { g.push(w); if (g.length >= max || /[.!?,؟،]$/.test(w.w) || i === words.length - 1) { groups.push(g); g = []; } });
    const L = s.layer(o.x ?? R.w / 2, o.y ?? 1430, o.parent), box = mk('div', 'sm-cap' + (o.style === 'box' ? ' box' : '') + (o.lang === 'ar' ? ' ar' : ''), L); if (o.size) box.style.fontSize = o.size + 'px';
    let lastG = -1; const spans = [];
    s.on(-1, s.dur + 1, (p, lt, t) => { const tt = t - s.start; let gi = -1; for (let i = 0; i < groups.length; i++) if (tt >= groups[i][0].s - .05 && tt < (groups[i + 1] ? groups[i + 1][0].s - .05 : groups[i][groups[i].length - 1].e + .4)) gi = i;
      if (gi !== lastG) { lastG = gi; box.innerHTML = gi < 0 ? '' : groups[gi].map(w => `<span class="cw">${esc(w.w)}</span>`).join(' '); spans.length = 0; spans.push(...box.querySelectorAll('.cw')); }
      if (gi >= 0) groups[gi].forEach((w, i) => { const on = tt >= w.s && tt < w.e + .05; spans[i].classList.toggle('on', on); const k = clamp((tt - w.s) / .12); spans[i].style.transform = `scale(${f2(on ? 1 + .08 * (1 - Math.abs(k * 2 - 1)) : 1)})`; spans[i].style.opacity = tt >= w.s - .04 || o.reveal === false ? 1 : .35; }); });
    return { layer: L, el: box, words };
  };
  /** ElevenLabs /with-timestamps alignment → words */
  SM.wordsFromAlignment = function (al, offset = 0) {
    const a = al.alignment || al.normalized_alignment || al, ch = a.characters, st = a.character_start_times_seconds, en = a.character_end_times_seconds, out = []; let cur = null;
    for (let i = 0; i < ch.length; i++) { if (/\s/.test(ch[i])) { if (cur) { out.push(cur); cur = null; } continue; } if (!cur) cur = { w: '', s: st[i] + offset, e: en[i] + offset }; cur.w += ch[i]; cur.e = en[i] + offset; }
    if (cur) out.push(cur); return out;
  };

  /* ---------------------------------------------------------------- lower third */
  S.lowerThird = function (o = {}) {
    const s = this, R = s.R, L = s.layer(o.x ?? 60, o.y ?? 1250, o.parent), el = mk('div', 'sm-l3', L, `${SM.mark('dark', 70)}<span><b>${esc(o.name || 'Karim')}</b><small>${esc(o.role || SM.t('Stacko host · AI presenter', 'مقدّم ستاكو · مقدّم بالذكاء الاصطناعي'))}</small></span>`);
    el.style.transform = 'translate(0,-50%)'; const at = o.at || 0; s.clip(el, 'left'); s.set(el, { cp: 0 }); s.anim(el, { cp: [0, 1] }, at, .6, 'outQuart'); s.anim(L, { o: [0, 1] }, at, .2);
    if (o.until != null) s.anim(L, { o: 0, x: -40 }, o.until, .4, 'inQuad');
    return { layer: L, el };
  };

  /* ---------------------------------------------------------------- whiteboard (handwriting + arrows) */
  S.whiteboard = function (o = {}) {
    const s = this, out = [];
    (o.lines || []).forEach(l => { const T = s.text(l.t, Object.assign({ font: 'hand', size: l.size || 74, fx: 'type', cps: l.cps || 16, color: l.color || C.abyss, sfx: false, align: l.align || 'left', theme: 'light' }, l)); out.push(T); s.sfx('marker', l.at || 0, .5); });
    (o.arrows || []).forEach(a => { const L = s.layer(0, 0), NSv = document.createElementNS(NS, 'svg'); NSv.setAttribute('width', s.R.w); NSv.setAttribute('height', s.R.h); NSv.style.cssText = 'position:absolute;left:0;top:0;overflow:visible'; L.appendChild(NSv);
      NSv.innerHTML = `<path d="${a.d}" fill="none" stroke="${a.color || C.signal}" stroke-width="${a.w || 7}" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>`; const pth = NSv.firstChild; s.on(a.at || 0, (a.at || 0) + (a.dur || .6), p => pth.setAttribute('stroke-dashoffset', String(1 - E.inOutQuad(p)))); out.push(L); });
    return out;
  };

  /* ---------------------------------------------------------------- isometric yard (StackoMap elements) */
  /** items: [{key, id, o, x, y}] world units (1 unit ≈ 0.3 m). api.drive(key, at, dur, dx, dy), api.pop(key, at), api.hide(key, at) */
  S.iso = function (o = {}) {
    const s = this, R = s.R; if (!G.StackoMap) throw new Error('Load /assets/map-elements/stacko-map-elements.js before the engine to use s.iso()');
    const sc = o.scale || 2, L = s.layer(o.x ?? R.w / 2, o.y ?? R.h / 2, o.parent), root = mk('div', 'sm-iso', L), byKey = {}, at = o.at || 0;
    const items = (o.items || []).map((it, i) => ({ ...it, key: it.key || 'i' + i }));
    const order = items.slice().sort((a, b) => (a.d ?? (a.x + a.y)) - (b.d ?? (b.x + b.y)));
    order.forEach((it, idx) => {
      const svg = G.StackoMap.render(it.id, Object.assign({}, o.accent ? { accent: o.accent } : {}, o.text ? { text: o.text } : {}, it.o || {}), sc);
      const el = mk('div', 'it', root, svg), sv = el.firstChild, ax = +sv.dataset.anchorX, ay = +sv.dataset.anchorY;
      el.style.left = f2(-ax) + 'px'; el.style.top = f2(-ay) + 'px';
      const wrap = mk('div', '', root); wrap.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0'; wrap.appendChild(el);
      const px = (it.x - it.y) * .866 * sc, py = (it.x + it.y) * .5 * sc; s.set(wrap, { x: px, y: py });
      byKey[it.key] = { wrap, it, px, py };
      const intro = it.intro || o.intro || 'drop', a = at + (it.at ?? idx * (o.stagger ?? .09));
      if (intro === 'drop') { s.anim(wrap, { o: [0, 1] }, a, .1).anim(wrap, { y: [py - 420, py] }, a, .7, 'outBounce'); if (idx < 10) s.sfx('thud', a + .27, .3); }
      else if (intro === 'pop') { s.anim(wrap, { o: [0, 1], s: [.2, 1] }, a, .45, 'outBack'); if (idx < 10) s.sfx('pop', a, .3); }
      else if (intro === 'rise') s.anim(wrap, { o: [0, 1], y: [py + 80, py] }, a, .6, 'outQuart');
    });
    const api = { layer: L, root, items: byKey,
      drive(key, a, dur, dx, dy, ez = 'inOutCubic') { const b = byKey[key]; const nx = b.px + (dx - dy) * .866 * sc, ny = b.py + (dx + dy) * .5 * sc; s.anim(b.wrap, { x: [b.px, nx], y: [b.py, ny] }, a, dur, ez); b.px = nx; b.py = ny; s.sfx('engine', a, .35); return api; },
      pop(key, a) { s.anim(byKey[key].wrap, { s: [1, 1.12] }, a, .12).anim(byKey[key].wrap, { s: [1.12, 1] }, a + .12, .3, 'outBack'); return api; },
      hide(key, a) { s.anim(byKey[key].wrap, { o: 0, s: .6 }, a, .3, 'inBack'); return api; },
    };
    if (o.in) s.enter(L, o.in, o.inAt ?? at, o);
    return api;
  };

  /* ---------------------------------------------------------------- photo stack (mini-doc) */
  S.photos = function (o = {}) {
    const s = this, srcs = o.srcs || [], r = SM.rng(o.seed || 4), at = o.at || 0, out = [];
    srcs.forEach((src, i) => out.push(s.image(src, Object.assign({ x: (o.x ?? s.R.w / 2) + (r() - .5) * 160, y: (o.y ?? s.R.h / 2) + (r() - .5) * 220, w: o.w || 720, h: o.h || 560, frame: 'polaroid', rot: (r() - .5) * 14, in: 'drop', at: at + i * (o.stagger || .7), dist: 900 }, o.each || {}))));
    return out;
  };

  /* ---------------------------------------------------------------- Dot-core logo animations */
  /** o: x,y,size, variant, from: 'scatter'|'center'|'rain'|'grid'|'explode', at, dur, wordmark (bool), tagline: 'en'|'ar'|'both'|null, endorse (bool), cta (text) */
  S.logoDots = function (o = {}) {
    const s = this, R = s.R, size = o.size || 420, x = o.x ?? R.w / 2, y = o.y ?? R.h * .42, v = o.variant || (R.theme === 'light' ? 'light' : 'dark'), K = SM.MARKC[v], at = o.at || 0, d = o.dur || 1.5, rg = SM.rng(o.seed || 12), from = o.from || 'scatter';
    const L = s.layer(x, y, o.parent), svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 120 120'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.style.cssText = `position:absolute;left:${-size / 2}px;top:${-size / 2}px;overflow:visible`; L.appendChild(svg);
    const gid = 'lg' + Math.floor(rg() * 1e6); svg.innerHTML = `<defs><filter id="${gid}" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter></defs><circle class="glow" cx="60" cy="60" r="11" fill="${K.c}" opacity="0" filter="url(#${gid})"/>`;
    const dots = SM.DOTS.map(([cx, cy, r, c], i) => { const e = document.createElementNS(NS, 'circle'); e.setAttribute('r', r); e.setAttribute('fill', K[c]); e.setAttribute('stroke', K[c]); e.setAttribute('stroke-width', '.9'); svg.appendChild(e);
      let sx, sy; if (from === 'center') { sx = 60; sy = 60; } else if (from === 'rain') { sx = cx + (rg() - .5) * 30; sy = -120 - rg() * 260; } else if (from === 'grid') { sx = (i % 14) * 8.5 + 4; sy = Math.floor(i / 14) * 8.5 + 4; } else if (from === 'explode') { const a = rg() * Math.PI * 2, rr = 140 + rg() * 160; sx = 60 + Math.cos(a) * rr; sy = 60 + Math.sin(a) * rr; } else { sx = -60 + rg() * 240; sy = -80 + rg() * 280; }
      return { e, cx, cy, sx, sy, dl: (from === 'rain' ? (1 - cy / 120) * .35 : rg() * .35) }; });
    const core = document.createElementNS(NS, 'circle'); core.setAttribute('cx', 60); core.setAttribute('cy', 60); core.setAttribute('r', 0); core.setAttribute('fill', K.c); svg.appendChild(core); const glow = svg.querySelector('.glow');
    const fn = SM.easeFn(o.ease || (from === 'rain' ? 'outBounce' : 'outBackSoft'));
    s.on(at - .001, at + d + .6, (p, lt) => { for (const q of dots) { const k = clamp((lt - q.dl * d) / (d * .65)), e = lt < 0 ? 0 : fn(k); q.e.setAttribute('cx', f2(q.sx + (q.cx - q.sx) * e)); q.e.setAttribute('cy', f2(q.sy + (q.cy - q.sy) * e)); q.e.setAttribute('opacity', lt < 0 ? 0 : f2(clamp(k * 3))); } const c = clamp((lt - d * .85) / .45); core.setAttribute('r', f2(3.6 * E.outBack(c))); glow.setAttribute('opacity', f2(K.g * clamp((lt - d * .9) / .5))); });
    s.sfx('assemble', at, .6); s.sfx('ding', at + d * .9, .5);
    const out = { layer: L, svg };
    let yy = size / 2 + (o.gap ?? 70);
    const wmAr = (o.wordmarkLang || SM.lang) === 'ar', wmTheme = v === 'light' || v === 'navy' ? 'light' : 'dark';
    if (o.wordmark !== false) { const [ww, wm] = wrapAt(L, 0, yy, '', wmAr ? SM.wordmarkAr(wmTheme) : SM.wordmark(wmTheme)); wm.style.cssText = `position:absolute;left:0;top:0;transform:translate(-50%,0);font-size:${(o.wordSize || size * .42) * (wmAr ? .8 : 1)}px;white-space:nowrap`; s.anim(ww, { o: [0, 1], y: [yy + 40, yy] }, at + d * .85, .6, 'outQuart'); ww.style.top = '0'; out.wordmark = ww; yy += (o.wordSize || size * .42) * 1.15; }
    const theme = v === 'light' || v === 'navy' ? 'light' : 'dark';
    const tagL = o.tagline === 'both' || o.tagline === true ? SM.lang : o.tagline;   // never two languages in one frame
    if (tagL) { const mkT = (txt, ar, a) => { const [tw, t] = wrapAt(L, 0, yy, '', esc(txt)); t.style.cssText = `position:absolute;left:0;top:0;transform:translate(-50%,0);white-space:nowrap;font-size:${o.tagSize || 46}px;font-weight:${ar ? 700 : 400};color:${theme === 'light' ? C.deep : C.visor};${ar ? "font-family:'Noto Kufi Arabic','Readex Pro',sans-serif;direction:rtl" : ''}`; s.anim(tw, { o: [0, 1], blur: [10, 0] }, a, .5); return tw; };
      const ta = at + d * .85 + .35;
      if (tagL === 'en') mkT('Your stock, always in sight', false, ta);
      if (tagL === 'ar') mkT('مخزنك دايماً قدّام عينك', true, ta);
      yy += (o.tagSize || 46) * 1.9; }
    if (o.cta) { const [cw, c] = wrapAt(L, 0, yy, '', esc(o.cta)); c.style.cssText = `position:absolute;left:0;top:0;transform:translate(-50%,0);white-space:nowrap;font-size:${o.ctaSize || 40}px;font-weight:600;padding:18px 36px;border-radius:999px;background:${theme === 'light' ? C.ocean : C.glow};color:${theme === 'light' ? '#fff' : C.abyss}`; s.anim(cw, { o: [0, 1], s: [.7, 1] }, at + d + .8, .45, 'outBack'); out.cta = cw; }
    if (o.endorse !== false) { const e = mk('div', '', s.el, SM.endorse(theme)); e.style.cssText = `position:absolute;left:50%;bottom:${o.endorseY ?? 470}px;transform:translateX(-50%);font-size:28px`; s.anim(e, { o: [0, 1] }, at + d + .6, .5); out.endorse = e; }
    return out;
  };
  /** Static logo lockup (horizontal) */
  S.logo = function (o = {}) {
    const s = this, v = o.variant || 'dark', theme = v === 'light' || v === 'navy' ? 'light' : 'dark', size = o.size || 120, L = s.layer(o.x ?? s.R.w / 2, o.y ?? s.R.h / 2, o.parent);
    const b = mk('div', '', L, `${SM.mark(v, size)}${SM.wordmark(theme)}`); b.style.cssText = `position:absolute;left:0;top:0;display:flex;align-items:center;gap:${size * .32}px;transform:translate(-50%,-50%)`; b.querySelector('.sm-word').style.fontSize = (size * .78) + 'px';
    if (o.in) s.enter(L, o.in, o.at || 0, o); if (o.out) s.exit(L, o.out, o.outAt, o); return { layer: L, el: b };
  };
  /** Any brand lockup (LG codes in the workbook).
   *  o.layout: 'h' (horizontal) | 'v' (stacked) | 'ar' (Arabic, RTL — mark stays on the left) | 'bi' (stacko | ستاكو) | 'icon' (app icon tile) | 'mark'
   *  o.variant: 'dark' | 'light' | 'white' | 'navy' · o.size (mark height px) · o.tagline: 'en'|'ar'|'both' · o.endorse (bool) · in/at/out/outAt */
  S.lockup = function (o = {}) {
    const s = this, v = o.variant || (s.R.theme === 'light' ? 'light' : 'dark'), theme = v === 'light' || v === 'navy' ? 'light' : 'dark', size = o.size || 120, lay = o.layout || (SM.lang === 'ar' ? 'ar' : 'h');
    const L = s.layer(o.x ?? s.R.w / 2, o.y ?? s.R.h / 2, o.parent), main = theme === 'light' ? (v === 'navy' ? C.abyss : C.abyss) : '#fff', teal = v === 'white' ? '#fff' : v === 'navy' ? C.abyss : theme === 'light' ? C.signal : C.glow;
    const word = `<span class="sm-word" style="font-size:${size * .78}px;color:${main}">stack<i style="font-style:normal;color:${teal}">o</i></span>`;
    const wordAr = `<span style="font:700 ${size * .62}px 'Noto Kufi Arabic','Readex Pro',sans-serif;color:${main};direction:rtl;line-height:1.1">ستاك<span style="color:${teal}">و</span></span>`;
    const tag = o.tagline ? `<div style="font-size:${size * .2}px;font-weight:400;color:${theme === 'light' ? C.deep : C.visor};margin-top:${size * .08}px;white-space:nowrap">${o.tagline === 'ar' ? '<span style="font-family:\'Noto Kufi Arabic\',sans-serif;direction:rtl">مخزنك دايماً قدّام عينك</span>' : o.tagline === 'both' ? 'Your stock, always in sight · <span style="font-family:\'Noto Kufi Arabic\',sans-serif">مخزنك دايماً قدّام عينك</span>' : 'Your stock, always in sight'}</div>` : '';
    let html;
    if (lay === 'mark') html = SM.mark(v, size);
    else if (lay === 'icon') html = `<div style="width:${size * 1.25}px;height:${size * 1.25}px;border-radius:${size * .29}px;background:${SM.NIGHT};display:grid;place-items:center;box-shadow:0 18px 50px rgba(3,9,18,.45)">${SM.mark('dark', size)}</div>`;
    else if (lay === 'v') html = `<div style="display:flex;flex-direction:column;align-items:center;gap:${size * .18}px">${SM.mark(v, size)}${word}${tag}</div>`;
    else if (lay === 'ar') html = `<div style="display:flex;align-items:center;gap:${size * .3}px">${SM.mark(v, size)}<div style="display:flex;flex-direction:column;align-items:flex-end">${wordAr}${tag}</div></div>`;
    else if (lay === 'bi') html = `<div style="display:flex;align-items:center;gap:${size * .3}px">${SM.mark(v, size)}${word}<span style="width:3px;height:${size * .7}px;background:${theme === 'light' ? C.visor : 'rgba(201,216,228,.4)'}"></span>${wordAr}</div>${tag}`;
    else html = `<div style="display:flex;align-items:center;gap:${size * .32}px">${SM.mark(v, size)}<div>${word}${tag}</div></div>`;
    const b = mk('div', '', L, html); b.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center';
    if (o.endorse) { const e = mk('div', '', b, SM.endorse(theme)); e.style.cssText = `margin-top:${size * .35}px;font-size:${Math.max(20, size * .22)}px`; }
    if (o.in) s.enter(L, o.in, o.at || 0, o); if (o.out) s.exit(L, o.out, o.outAt, o); return { layer: L, el: b };
  };

  /* ---------------------------------------------------------------- CP-33 · dot morph (signature brand effect) */
  /** Brand particles — "every dot is a unit of stock" — that fly together into words, numbers, icons, the map of Lebanon
   *  and the Dot core logo, then break apart into the next shape. Deterministic (pure function of time).
   *  s.dotMorph({ count:480, x, y, palette, glow:true, steps:[
   *    { at:0,   shape:'scatter' },                       // 'scatter' | 'rain' | 'explode' | 'grid' | 'logo' | 'lebanon' | 'ring'
   *    { at:.2,  shape:{ text:'38', size:420 }, dur:1 },  // { text, size, weight, font, color }
   *    { at:1.8, shape:{ icon:'truck', size:520 } },       // icons: truck box warehouse pin ship check phone alert
   *    { at:3.2, shape:'logo', size:440 } ] })            // the Dot core with its real colours + glowing centre
   *  Each step: at (scene time), dur (flight, default .9), size, ease, x/y (centre), spread (0..1 random flight delay). */
  const DOT_ICONS = {
    truck: 'M8 30h52v36H8z M60 42h18l12 14v10H60z M22 80a8 8 0 1 0 0.1 0z M76 80a8 8 0 1 0 0.1 0z',
    box: 'M50 8 90 28 90 72 50 92 10 72 10 28z',
    warehouse: 'M8 44 50 14 92 44 92 90 8 90z',
    pin: 'M50 6c-19 0-32 14-32 31 0 24 32 57 32 57s32-33 32-57C82 20 69 6 50 6z',
    ship: 'M10 60h80l-12 22H22z M28 36h40v20H28z M40 20h14v14H40z',
    check: 'M14 52 38 76 86 22 76 14 38 58 24 42z',
    phone: 'M30 6h40a6 6 0 0 1 6 6v76a6 6 0 0 1-6 6H30a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z',
    alert: 'M50 8 94 88H6z',
  };
  S.dotMorph = function (o = {}) {
    const s = this, R = s.R, N = o.count || 480, W = R.w, H = R.h, cx0 = o.x ?? W / 2, cy0 = o.y ?? H / 2;
    const cv = mk('canvas', '', o.parent || s.el); cv.width = W; cv.height = H; cv.style.cssText = `position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none`;
    if (o.glow !== false) cv.style.filter = `drop-shadow(0 0 ${o.glowSize || 10}px rgba(46,242,238,${o.glowOp ?? .35}))`;
    const ctx = cv.getContext('2d'), rnd = SM.rng(o.seed || 21), PAL = o.palette || [C.glow, C.dolphin, C.ocean, C.glow, '#8CCBE6'];
    const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
    const pcol = i => hex(PAL[Math.floor(noise(i * 7.13 + 3) * PAL.length) % PAL.length]);
    const steps = (o.steps || [{ at: 0, shape: 'scatter' }, { at: .3, shape: 'logo' }]).map(st => Object.assign({ dur: .9, size: 420, spread: .35 }, st));
    let sets = null;   // per step: array of N targets {x,y,r,c:[r,g,b],a}
    const sampleMask = (draw, bw, bh, ccx, ccy, colorFn, rFactor) => {
      const c2 = document.createElement('canvas'); c2.width = bw; c2.height = bh; const x2 = c2.getContext('2d'); draw(x2, bw, bh);
      const d = x2.getImageData(0, 0, bw, bh).data; let filled = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 128) filled++;
      const area = filled * 4, g = Math.max(3, Math.sqrt(area / N) * .98), pts = [];
      for (let y = g / 2; y < bh; y += g) for (let x = g / 2; x < bw; x += g) { const k = (Math.floor(y) * bw + Math.floor(x)) * 4 + 3; if (d[k] > 128) pts.push({ x: ccx - bw / 2 + x, y: ccy - bh / 2 + y, r: g * (rFactor || .42) }); }
      pts.forEach((p, i) => { p.c = colorFn ? colorFn(p, i) : null; p.a = 1; });
      return pts;
    };
    const build = (st, idx) => {
      const sh = st.shape, ccx = st.x ?? cx0, ccy = st.y ?? cy0, size = st.size; let pts = [];
      if (sh === 'scatter' || sh === 'rain' || sh === 'explode' || sh === 'grid' || sh === 'ring') {
        for (let i = 0; i < N; i++) {
          const a = noise(i * 3.7 + idx * 11) * Math.PI * 2, q = noise(i * 9.1 + idx * 5);
          let x, y, r = 2 + noise(i * 1.9) * 4, al = 1;
          if (sh === 'scatter') { x = noise(i * 1.31 + idx) * W; y = 140 + noise(i * 2.17 + idx) * (H - 280); al = .25 + q * .45; }
          else if (sh === 'rain') { x = ccx + (noise(i * 4.1) - .5) * (size * 1.6); y = -60 - noise(i * 5.3) * 900; }
          else if (sh === 'explode') { const d = 900 + q * 900; x = ccx + Math.cos(a) * d; y = ccy + Math.sin(a) * d; al = 0; }
          else if (sh === 'ring') { const rr = size / 2 * (.92 + q * .16); x = ccx + Math.cos(i / N * Math.PI * 2) * rr; y = ccy + Math.sin(i / N * Math.PI * 2) * rr; r = 3.2; }
          else { const cols = Math.ceil(Math.sqrt(N * W / H)), rows = Math.ceil(N / cols); x = (i % cols + .5) * W / cols; y = (Math.floor(i / cols) + .5) * H / rows; r = 3; al = .35; }
          pts.push({ x, y, r, c: pcol(i), a: al });
        }
        return pts;   // already N, keep index order (organic)
      }
      if (sh === 'logo') {
        const v = SM.MARKC[st.variant || 'dark'], k = size / 120;
        pts = SM.DOTS.map(([x, y, r, c]) => ({ x: ccx + (x - 60) * k, y: ccy + (y - 60) * k, r: r * k * 1.02, c: hex(v[c]), a: 1 }));
      } else if (sh === 'lebanon' && SM.LEB && SM.mapXY) {
        const P = SM.LEB.map(([la, lo]) => SM.mapXY(la, lo)), xs = P.map(p => p[0]), ys = P.map(p => p[1]);
        const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys), k = size / (maxy - miny), bw = Math.ceil((maxx - minx) * k) + 4, bh = Math.ceil(size) + 4;
        const whs = ['W1', 'W2', 'W3'].filter(w => SM.PT[w]).map(w => { const q = SM.mapXY(...SM.PT[w]); return { x: ccx - bw / 2 + (q[0] - minx) * k + 2, y: ccy - bh / 2 + (q[1] - miny) * k + 2 }; });
        pts = sampleMask((x2) => { x2.fillStyle = '#000'; x2.beginPath(); P.forEach((p, i) => x2[i ? 'lineTo' : 'moveTo']((p[0] - minx) * k + 2, (p[1] - miny) * k + 2)); x2.closePath(); x2.fill(); }, bw, bh, ccx, ccy,
          (p) => { const near = whs.some(w => Math.hypot(p.x - w.x, p.y - w.y) < size * .045); if (near) { p.r *= 1.35; return hex(C.glow); } return hex(noise(p.x * .37 + p.y * .11) > .55 ? C.ocean : C.deep); }, .4);
      } else if (sh.text != null) {
        const ar = SM.isAr(sh.text), fs = sh.size || size * .5, font = `${sh.weight || (ar ? 700 : 600)} ${fs}px ${sh.font || (ar ? "'Noto Kufi Arabic','Readex Pro',sans-serif" : "'Readex Pro',sans-serif")}`;
        const c0 = document.createElement('canvas').getContext('2d'); c0.font = font; let fs2 = fs, font2 = font; const maxW = sh.maxW || st.maxW || W * .86, w0 = c0.measureText(String(sh.text)).width; if (w0 > maxW) { fs2 = fs * maxW / w0; font2 = font.replace(`${fs}px`, `${fs2}px`); c0.font = font2; }
        const tw = Math.ceil(c0.measureText(String(sh.text)).width) + 20, th = Math.ceil(fs2 * (ar ? 1.6 : 1.25));
        pts = sampleMask((x2, bw, bh) => { x2.font = font2; x2.textAlign = 'center'; x2.textBaseline = 'middle'; if (ar) x2.direction = 'rtl'; x2.fillStyle = '#000'; x2.fillText(String(sh.text), bw / 2, bh / 2 + (ar ? fs2 * .08 : 0)); }, tw, th, ccx, ccy,
          sh.color ? () => hex(sh.color) : (p, i) => pcol(i), .44);
      } else if (sh.icon || sh.path) {
        const d = sh.path || DOT_ICONS[sh.icon] || DOT_ICONS.box, bw = Math.ceil(size), bh = Math.ceil(size);
        pts = sampleMask((x2) => { x2.scale(bw / 100, bh / 100); x2.fillStyle = '#000'; x2.fill(new Path2D(d), 'nonzero'); }, bw, bh, ccx, ccy, sh.color ? () => hex(sh.color) : (p, i) => pcol(i), .44);
      } else if (sh.points) pts = sh.points.map((q, i) => ({ x: q[0], y: q[1], r: q[2] || 4, c: pcol(i), a: 1 }));
      if (!pts.length) pts = [{ x: ccx, y: ccy, r: 3, c: hex(C.glow), a: 1 }];
      // spatial order (top→bottom with a slight diagonal) so particles travel to the matching region of the next shape
      pts.forEach((p, i) => p.k = p.y + p.x * .35 + (noise(i * 1.7 + idx) - .5) * 40); pts.sort((a, b) => a.k - b.k);
      const M = pts.length, out = new Array(N);
      for (let i = 0; i < N; i++) { const j = Math.min(M - 1, Math.floor(i * M / N)); out[i] = pts[j]; }
      out.logo = sh === 'logo' ? { x: ccx, y: ccy, k: size / 120 } : null;
      return out;
    };
    s.R.fits.push(() => { sets = steps.map(build); });
    const sp = steps.map(st => [s.T(st.at), st.dur, SM.easeFn(st.ease || 'inOutCubic'), st.spread]);
    s.on(-1, s.dur + 1, (p, lt, t) => {
      if (!sets) return; ctx.clearRect(0, 0, W, H);
      let k = 0; while (k + 1 < steps.length && t >= sp[k + 1][0]) k++;        // current target step
      const B = sets[k], st = sp[k];
      const from = (k > 0 && t >= st[0]) ? sets[k - 1] : sets[k];
      for (let i = 0; i < N; i++) {
        const a = from[i], b = B[i], dl = noise(i * 2.31 + k * 7) * st[3] * st[1], q = k === 0 && t < st[0] ? 1 : clamp((t - st[0] - dl) / (st[1] * (1 - st[3] * .6))), e = st[2](q);
        const ox = (noise(i * 5.7 + k) - .5) * 260 * Math.sin(Math.PI * e), oy = (noise(i * 8.3 + k) - .5) * 260 * Math.sin(Math.PI * e);   // curved flight
        const x = a.x + (b.x - a.x) * e + ox, y = a.y + (b.y - a.y) * e + oy, al = a.a + (b.a - a.a) * e;
        if (al <= .01) continue;
        const tw = q >= 1 ? 1 + .07 * Math.sin(t * 3.1 + i) : 1, r = Math.max(.5, (a.r + (b.r - a.r) * e) * tw);
        const c = a.c.map((v, j) => Math.round(v + (b.c[j] - v) * e));
        ctx.globalAlpha = al; ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (B.logo) { const g = clamp((t - st[0] - st[1] * .8) / .5); if (g > 0) { const L = B.logo, rr = 11 * L.k * 1.6;
        const gr = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, rr); gr.addColorStop(0, `rgba(255,255,255,${.55 * g})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(L.x, L.y, rr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(L.x, L.y, 3.6 * L.k * E.outBack(g), 0, Math.PI * 2); ctx.fill(); } }
    });
    steps.forEach((st, i) => { if (i > 0 && st.shape === 'logo' && o.sfx !== false) s.sfx('assemble', st.at, .35); });
    return { canvas: cv };
  };

  /* ---------------------------------------------------------------- end cards (each is its own scene) */
  const EC = SM.ENDCARDS = {
    dots: (R, o) => { const s = R.scene(o.dur || 3, { in: o.in || 'dots', bg: 'night', name: 'endcard' }); s.logoDots({ from: o.from || 'scatter', tagline: o.tagline || SM.lang, cta: o.cta, at: .1 }); return s; },
    rain: (R, o) => { const s = R.scene(o.dur || 3, { in: o.in || 'flash', bg: 'night', name: 'endcard' }); s.logoDots({ from: 'rain', tagline: o.tagline || SM.lang, cta: o.cta, at: .05, dur: 1.4 }); return s; },
    wordmark: (R, o) => { const s = R.scene(o.dur || 2.6, { in: o.in || 'push-up', bg: 'paper', name: 'endcard' });
      s.html(SM.lang === 'ar' ? SM.wordmarkAr('light') : SM.wordmark('light'), { y: R.h * .42, css: `font-size:${SM.lang === 'ar' ? 180 : 230}px`, in: 'blur', at: .2 });
      s.logo({ variant: 'light', size: 110, y: R.h * .3, in: 'pop', at: .9 }).el.querySelector('.sm-word').style.display = 'none';
      s.text(o.cta || SM.t('See your stock live', 'شوف مخزنك مباشرة'), { size: 'sub', y: R.h * .52, theme: 'light', fx: 'blur', at: 1.1, color: C.deep, weight: 400 });
      const e = mk('div', '', s.el, SM.endorse('light')); e.style.cssText = 'position:absolute;left:50%;bottom:470px;transform:translateX(-50%);font-size:28px'; s.anim(e, { o: [0, 1] }, 1.4, .4); return s; },
    /** EC-04 tagline card — one language only (the version's) */
    bilingual: (R, o) => EC.tagline(R, o),
    tagline: (R, o) => { const s = R.scene(o.dur || 3.4, { in: o.in || 'blur', bg: 'night', name: 'endcard' }); s.lockup({ variant: 'dark', size: 96, y: R.h * .3, in: 'fade', at: .1 });
      s.text(SM.t('Your stock, *always in sight.*', 'مخزنك *دايماً* قدّام عينك'), { size: 96, y: R.h * .5, at: .4, fx: 'blur', w: 900 }); return s; },
    truck: (R, o) => { const s = R.scene(o.dur || 3.2, { in: o.in || 'wipe', bg: 'night', name: 'endcard' }); const y = s.iso({ x: R.w / 2 + 40, y: R.h * .52, scale: o.scale || 13, intro: 'none', items: [{ key: 't', id: 'boxTruck', o: { named: true, text: o.text || 'stacko', accent: o.accent || C.signal }, x: 0, y: 0 }] }); s.anim(y.items.t.wrap, { x: [-1500, y.items.t.px], y: [-860, y.items.t.py] }, .1, 1.1, 'outQuart'); s.shake(1.1, .25, 8); s.sfx('engine', .1, .6); s.lockup({ variant: 'dark', size: 90, y: R.h * .3, in: 'rise', at: 1.0 }); s.text(o.cta || SM.t('Your stock, always in sight.', 'مخزنك دايماً قدّام عينك'), { size: 'sub', y: R.h * .68, fx: 'blur', at: 1.3, weight: 400, color: C.visor }); return s; },
    phone: (R, o) => { const s = R.scene(o.dur || 3.4, { in: o.in || 'stack', bg: 'night', name: 'endcard' }); const c = s.chat({ y: R.h * .5, w: 620, in: 'rise', at: 0 }); c.bot(.4, o.botText || SM.t('See your stock live → stacko-lb.com', 'شوف مخزنك مباشرة ← stacko-lb.com'), { typing: .6 }); s.lockup({ variant: 'dark', size: 70, y: 260, in: 'fade', at: .2 }); return s; },
    photo: (R, o) => { const s = R.scene(o.dur || 3, { in: o.in || 'fade', bg: o.src || 'night', move: 'push', dim: .25, name: 'endcard' }); const sw = mk('div', 'sm-fill', s.el); sw.style.background = 'linear-gradient(110deg,rgba(255,255,255,0) 40%,rgba(255,255,255,.35) 50%,rgba(255,255,255,0) 60%)'; s.set(sw, { x: -R.w }); s.anim(sw, { x: [-R.w, R.w] }, .6, 1.2, 'inOutQuad'); s.lockup({ variant: 'white', size: 96, y: R.h * .78, in: 'rise', at: 1.0 }); return s; },
    /** EC-10 · the hook's key word is built from dots, then the dots regroup into the Dot core + wordmark */
    dotword: (R, o) => { const s = R.scene(o.dur || 4.2, { in: o.in || 'blur', bg: 'night', name: 'endcard' });
      s.dotMorph({ count: o.count || 520, y: R.h * .4, steps: [{ at: 0, shape: 'scatter' }, { at: .15, shape: { text: o.word || SM.t('in sight', 'قدّام عينك'), size: o.wordSize || 230 }, dur: 1.1 }, { at: 1.75, shape: 'logo', size: 420, dur: 1.15 }] });
      s.html(SM.lang === 'ar' ? SM.wordmarkAr('dark') : SM.wordmark('dark'), { y: R.h * .4 + 330, css: `font-size:${SM.lang === 'ar' ? 132 : 170}px`, in: 'blur', at: 2.85 });
      s.text(SM.t('Your stock, always in sight', 'مخزنك دايماً قدّام عينك'), { size: 46, weight: 400, color: C.visor, y: R.h * .4 + 470, fx: 'blur', at: 3.15 });
      const e = mk('div', '', s.el, SM.endorse('dark')); e.style.cssText = 'position:absolute;left:50%;bottom:470px;transform:translateX(-50%);font-size:28px'; s.set(e, { o: 0 }); s.anim(e, { o: [0, 1] }, 3.4, .4); return s; },
    /** EC-11 · dots draw the three warehouses as glowing pins on a Lebanon outline, then fly together into the Dot core */
    dotmap: (R, o) => { const s = R.scene(o.dur || 4.4, { in: o.in || 'fade', bg: 'night', name: 'endcard' });
      s.dotMorph({ count: o.count || 560, y: R.h * .42, steps: [{ at: 0, shape: 'rain' }, { at: .1, shape: 'lebanon', size: 900, dur: 1.2 }, { at: 1.9, shape: 'logo', size: 420, dur: 1.1 }] });
      s.text(SM.t('Every location. One map.', 'كل المواقع. خريطة وحدة.'), { size: 64, y: 330, fx: 'blur', at: .4, out: 'blur', outAt: 1.8 });
      s.html(SM.lang === 'ar' ? SM.wordmarkAr('dark') : SM.wordmark('dark'), { y: R.h * .42 + 330, css: `font-size:${SM.lang === 'ar' ? 132 : 170}px`, in: 'blur', at: 2.95 });
      s.text(SM.t('Your stock, always in sight', 'مخزنك دايماً قدّام عينك'), { size: 46, weight: 400, color: C.visor, y: R.h * .42 + 470, fx: 'blur', at: 3.25 });
      const e = mk('div', '', s.el, SM.endorse('dark')); e.style.cssText = 'position:absolute;left:50%;bottom:470px;transform:translateX(-50%);font-size:28px'; s.set(e, { o: 0 }); s.anim(e, { o: [0, 1] }, 3.5, .4); return s; },
  };
  SM.Reel.prototype.endcard = function (type = 'dots', o = {}) { const f = EC[type]; if (!f) throw new Error('Unknown end card: ' + type + '. Use ' + Object.keys(EC).join(', ')); return f(this, o); };
})(typeof window !== 'undefined' ? window : globalThis);
