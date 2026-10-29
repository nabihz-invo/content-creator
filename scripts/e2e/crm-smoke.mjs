// End-to-end smoke test of the CRM against the local stack (scripts/local-stack).
// Usage: node scripts/e2e/crm-smoke.mjs [baseUrl]   (default http://127.0.0.1:4173)
// Writes screenshots to docs/screenshots/. Exits non-zero on any failed check.
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ANON_KEY, SERVICE_ROLE_KEY } from "../local-stack/keys.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SHOTS = join(ROOT, "docs/screenshots");
const TMP = join(ROOT, "tmp/e2e");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(TMP, { recursive: true });

const BASE = process.argv[2] ?? "http://127.0.0.1:4173";
const SUPA = "http://127.0.0.1:54321";
const run = Date.now().toString(36);
const email = `owner-${run}@example.com`;
const password = `pw-${run}-Secret!`;

let failures = 0;
function check(cond, msg) {
  console.log(`${cond ? "  ok  " : "  FAIL"} ${msg}`);
  if (!cond) failures++;
}

async function json(res) {
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body)}`);
  return body;
}

// 1. User + session through GoTrue (the signup trigger creates the workspace).
await json(
  await fetch(`${SUPA}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Noor" },
    }),
  }),
);
const session = await json(
  await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  }),
);
console.log(`user ${email}`);

const browser = await chromium.launch();
const errors = [];
async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport, locale: "en-US" });
  await ctx.addInitScript((s) => {
    localStorage.setItem("sb-127-auth-token", JSON.stringify(s));
    localStorage.setItem("cc.theme", "light");
    if (!localStorage.getItem("cc.locale")) localStorage.setItem("cc.locale", "en");
  }, session);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));
  return page;
}
const nav = (page, name) =>
  page.getByRole("navigation", { name: "Menu" }).getByRole("link", { name }).click();
const shot = (page, name) => page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });

const page = await newPage({ width: 1360, height: 860 });

console.log("overview");
await page.goto(BASE);
await page.getByRole("heading", { name: "Overview" }).waitFor();
check(await page.getByText("Ideas awaiting analysis").isVisible(), "overview shows status groups");

console.log("brand");
await nav(page, "Brands");
await page.getByRole("button", { name: "New brand" }).first().click();
await page.getByLabel("Name").fill("Noor Café");
await page.getByRole("button", { name: "Create" }).click();
await page.getByRole("heading", { name: "Noor Café" }).waitFor();
await page
  .getByLabel("Description")
  .fill("Specialty coffee in Riyadh. Warm, local, a little playful.");
await page.getByRole("tab", { name: "Voice" }).click();
await page.getByLabel("Tone").fill("Warm and witty");
await page
  .getByLabel("Do", { exact: true })
  .fill("Use Saudi dialect sparingly\nMention seasonal drinks");
await page.getByRole("tab", { name: "Visual" }).click();
await page.getByRole("button", { name: "Add color" }).click();
await page.getByPlaceholder("Name").first().fill("Espresso");
await page.getByRole("button", { name: "Add color" }).click();
await page.getByPlaceholder("Name").nth(1).fill("Saffron");
await page
  .locator('input[type="color"]')
  .nth(0)
  .evaluate((el) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    set.call(el, "#3b2417");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
await page
  .locator('input[type="color"]')
  .nth(1)
  .evaluate((el) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    set.call(el, "#e8a33d");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
await page.getByRole("button", { name: "Save" }).click();
await page.getByText("Brand saved — settings v2").waitFor();
check(true, "brand saved and settings version bumped to v2");
await page.getByRole("tab", { name: "Assets" }).click();
const logo = join(TMP, "logo.svg");
writeFileSync(
  logo,
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="30" fill="#e8a33d"/></svg>',
);
await page.getByLabel("File to upload").setInputFiles(logo);
await page.getByRole("button", { name: "Upload asset" }).click();
await page.getByText("logo.svg").waitFor();
check(true, "brand asset uploaded to storage and recorded");
await page.getByRole("tab", { name: "History" }).click();
await page.getByText("Settings v2").first().waitFor();
await page.getByRole("tab", { name: "Visual" }).click();
await shot(page, "02-brand-editor");

console.log("ideas");
await nav(page, "Idea inbox");
await page.getByRole("button", { name: "New idea" }).click();
const idea = "كاروسيل يعرض قهوة الشتاء الجديدة في نور كافيه مع عرض خاص لنهاية الأسبوع";
let dlg = page.getByRole("dialog");
await dlg.getByLabel("Idea", { exact: true }).fill(idea);
await dlg.getByLabel("Brand").selectOption({ label: "Noor Café" });
await dlg.getByLabel("Format").selectOption("carousel");
await dlg.getByLabel(/Tags/).fill("winter, offers");
await dlg.getByRole("button", { name: "Add idea" }).click();
await page.waitForURL(/\/projects\/[0-9a-f-]{36}$/);
const projectUrl = page.url();
await page.getByText("Analyzing").first().waitFor();
check(true, "new idea created and moved to Analyzing");
await page.getByRole("tab", { name: "History" }).click();
await page.getByText("Status: New → Analyzing").waitFor();
check(true, "history shows the audited status change");
await page.getByRole("tab", { name: "Idea" }).click();
await shot(page, "04-project-detail");

// duplicate detection
await nav(page, "Idea inbox");
await page.getByRole("button", { name: "New idea" }).click();
dlg = page.getByRole("dialog");
await dlg.getByLabel("Idea", { exact: true }).fill("  " + idea + "  ");
await dlg.getByRole("button", { name: "Add idea" }).click();
await page.getByText("This idea already exists.").waitFor();
check(true, "duplicate idea is detected instead of creating a second project");
await page.keyboard.press("Escape");

// URL idea
await page.getByRole("button", { name: "New idea" }).click();
dlg = page.getByRole("dialog");
await dlg.getByLabel("Link").fill("https://example.com/coffee-trends-2026?utm_source=newsletter");
await dlg.getByRole("button", { name: "Add idea" }).click();
await page.waitForURL(/\/projects\//);
check(true, "link-only idea created");

console.log("csv");
const csv = join(TMP, "ideas.csv");
writeFileSync(
  csv,
  [
    "Idea,Link,Brand,Tags,Format",
    '"Behind the scenes: roasting day",,Noor Café,"bts; roasting",video',
    '"5 ways to brew at home",,Noor Café,education,carousel',
    "=SUM(1;2) Weekend brunch menu,,,,static",
    ",,,,",
    '"5 ways to brew at home",,,,',
    "Loyalty card launch,,Unknown Brand,,",
  ].join("\n"),
);
await nav(page, "Idea inbox");
await page.getByRole("button", { name: "Import CSV" }).click();
dlg = page.getByRole("dialog");
await dlg.getByLabel("CSV file").setInputFiles(csv);
await dlg.getByText(/Preview \(first \d+ rows\)/).waitFor();
check((await dlg.getByLabel("Idea text").inputValue()) === "Idea", "CSV columns are auto-mapped");
await dlg.getByRole("button", { name: "Check file" }).click();
await page.getByText("Valid: 3").waitFor();
await shot(page, "05-csv-import-check");
await page.getByRole("button", { name: /^Import 3 rows$/ }).click();
await page.getByText("Import finished").waitFor();
const created = await page.getByText(/Created: \d+/).textContent();
check(created?.includes("3"), `CSV import report: ${created}`);
check(await page.getByText("Duplicates: 1").isVisible(), "CSV duplicate row reported");
check(
  await page.getByText(/unknown brand/).isVisible(),
  "CSV invalid row reported with its reason",
);
await shot(page, "05-csv-import-result");
await page.getByRole("button", { name: "Done" }).click();

await page.getByText("Weekend brunch menu").first().waitFor();
check(!(await page.getByText("=SUM").count()), "formula prefix stripped from imported cell");
await page.getByPlaceholder("Search ideas, titles, links…").fill("roasting");
await page.getByText("Behind the scenes: roasting day").first().waitFor();
let rows = 0;
for (let i = 0; i < 20 && rows !== 1; i++) {
  await page.waitForTimeout(250);
  rows = await page.locator("tbody tr").count();
}
check(rows === 1, `full-text search filters the inbox (${rows} row)`);
await page.getByPlaceholder("Search ideas, titles, links…").fill("");
await page.waitForTimeout(600);
await shot(page, "03-inbox");

await nav(page, "Overview");
await page.getByText("Recent ideas").waitFor();
await page.waitForTimeout(500);
await shot(page, "01-overview");

console.log("arabic / rtl");
await page.getByRole("button", { name: "العربية" }).click();
await page.getByRole("heading", { name: "نظرة عامة" }).waitFor();
check(
  (await page.evaluate(() => document.documentElement.dir)) === "rtl",
  "Arabic switches the document to RTL",
);
await shot(page, "06-overview-ar");
await page.goto(projectUrl);
await page.getByText("الفكرة الأصلية").waitFor();
await shot(page, "07-project-ar");
await page.goto(`${BASE}/settings`);
await page.getByRole("button", { name: "أنشئ رمز الربط" }).click();
await page.getByText(/\/link [A-Z0-9]{8}/).waitFor();
check(true, "Telegram link code generated through the API");
await page.reload();
await page.getByRole("heading", { name: "الإعدادات" }).waitFor();
check(true, "language choice persists in the profile across reloads");
await page.getByRole("button", { name: "English" }).click();
await page.getByRole("heading", { name: "Settings" }).waitFor();

console.log("mobile");
const mobile = await newPage({ width: 390, height: 844 });
await mobile.goto(`${BASE}/inbox`);
await mobile.getByRole("heading", { name: "Idea inbox" }).waitFor();
check(
  await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  "no horizontal scroll at 390px",
);
await shot(mobile, "08-inbox-mobile");
await mobile.getByRole("button", { name: "Menu" }).click();
await mobile.getByRole("dialog").getByRole("link", { name: "Brands" }).waitFor();
await shot(mobile, "09-nav-mobile");

await browser.close();

const realErrors = errors.filter((e) => !/favicon|DevTools/.test(e));
check(
  realErrors.length === 0,
  `no browser errors${realErrors.length ? `:\n    ${realErrors.join("\n    ")}` : ""}`,
);
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
