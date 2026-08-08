/** Capturas de la landing en todos sus estados, para revisión de diseño. */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3300";
const OUT = join(process.cwd(), "tests", "revision-landing");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function capture(name, { width, height, theme = "light", lang = "es", path = "/", full = true }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    locale: "es-MX",
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/api/prefs?theme=${theme}&lang=${lang}&back=%2F`, {
    waitUntil: "domcontentloaded",
  });
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: full });
  console.log(`  ${name}.png`);
  await ctx.close();
}

console.log("Capturando:");
await capture("01-desktop-claro-completa", { width: 1440, height: 1000 });
await capture("02-desktop-claro-hero", { width: 1440, height: 900, full: false });
await capture("03-desktop-oscuro-completa", { width: 1440, height: 1000, theme: "dark" });
await capture("04-movil-390-completa", { width: 390, height: 844 });
await capture("05-movil-320-hero", { width: 320, height: 700, full: false });
await capture("06-desktop-rama-elegida", { width: 1440, height: 1000, path: "/?ctx=pre_arrival" });
await capture("07-tablet-820", { width: 820, height: 1180 });

await browser.close();
console.log(`\nEn: ${OUT}`);
