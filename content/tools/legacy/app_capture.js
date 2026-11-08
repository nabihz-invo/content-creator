// Screenshots of the running Stacko app (demo company only) for social content.
//   node app_capture.js <plan.json> <outDir>
// plan.json: { user: "hadi", lang: "en", w: 1360, h: 900, dpr: 2, shots: [ { name, path, wait?, click?: [sel...], eval?: "js", full?: false } ] }
// path is relative to /<lang>/o/<orgId> (e.g. "" = map, "/stock"). The demo password is read at runtime from
// ../supabase/.env.local (never copied). Warm colours are swapped for brand blues before each shot.
const fs = require('fs'), path = require('path'), { chromium } = require('playwright-core');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const BASE = process.env.APP_BASE || 'http://localhost:3000';
const ENV = Object.fromEntries(fs.readFileSync('C:/nabih/projects/AIphin/Stacko/supabase/.env.local', 'utf8')
  .split(/\r?\n/).filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]));
const COOL = `:root,:root *{--coral:#2EF2EE!important;--low:#2F86B8!important;--alert:#2C5974!important}nextjs-portal,[data-nextjs-toast],[data-next-badge-root]{display:none!important}`;

async function login(page, user, lang) {
  await page.goto(`${BASE}/${lang}/login`, { timeout: 120000 });
  await page.fill('input[name="email"]', `${user}@demo.stacko.aiphin.me`);
  await page.fill('input[name="password"]', ENV.DEMO_USERS_PASSWORD);
  await Promise.all([page.waitForURL(/\/o\/[0-9a-f-]{36}/, { timeout: 120000 }), page.click('button[type="submit"]')]);
  return page.url().match(/\/o\/([0-9a-f-]{36})/)[1];
}

(async () => {
  const [planFile, out] = process.argv.slice(2);
  const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  const lang = plan.lang || 'en';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: EDGE });
  const ctx = await browser.newContext({ viewport: { width: plan.w || 1360, height: plan.h || 900 }, deviceScaleFactor: plan.dpr || 2, locale: lang === 'ar' ? 'ar-LB' : 'en-US', timezoneId: 'Asia/Beirut' });
  await ctx.addInitScript(css => { addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }); }, COOL);
  const page = await ctx.newPage();
  const org = await login(page, plan.user || 'hadi', lang);
  for (const s of plan.shots) {
    // noData: block the database API so the page shows its real no-data state
    if (s.noData) await page.route(/\/rest\/v1\//, r => r.abort()); else await page.unroute(/\/rest\/v1\//).catch(() => {});
    await page.goto(`${BASE}/${lang}/o/${org}${s.path || ''}`, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(s.wait || 2500);
    if (s.follow) { // open a link's target directly (client-side clicks are flaky at phone size)
      const href = await page.getAttribute(`a:has-text("${s.follow}")`, 'href', { timeout: 15000 }).catch(() => null);
      if (href) { await page.goto(new URL(href, BASE).href, { waitUntil: 'networkidle', timeout: 120000 }).catch(() => {}); await page.waitForTimeout(s.after || 5000); }
      else console.log('follow failed', s.follow);
    }
    for (const sel of s.click || []) { await page.click(sel, { timeout: 15000 }).catch(e => console.log('click failed', sel, e.message.split('\n')[0])); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(s.after || 3000); }
    if (s.eval) await page.evaluate(s.eval).catch(e => console.log('eval failed', e.message));
    if (s.eval || s.click) await page.waitForTimeout(800);
    const f = path.join(out, `${lang}-${s.name}.png`);
    if (s.selector) await (await page.$(s.selector)).screenshot({ path: f }); else await page.screenshot({ path: f, fullPage: !!s.full });
    console.log(f);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
