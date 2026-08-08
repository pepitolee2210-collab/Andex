/**
 * Comprobación puntual: ¿qué pasa al pulsar "pagar" SIN aceptar los términos?
 *
 * §3.4.6 exige consentimiento afirmativo expreso. Un botón que parece
 * pulsable, se deja pulsar y no hace nada ni explica por qué es peor que uno
 * deshabilitado: el usuario no sabe qué le falta.
 */

import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3200";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Sesión + perfil + ranking mínimos para llegar al checkout
await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  window.localStorage.setItem(
    "andex_demo_profile",
    JSON.stringify({
      userId: "chk", email: "t@e.com", firstName: "Test", lastName: null,
      phone: null, phoneCountryCode: null, locationContext: "in_us",
      stateUS: "UT", city: null, timeInUS: null, countryOfResidence: null,
      countryOther: null, nationality: null, travelPlan: null,
      estimatedArrivalDate: null, situation: null, situationOther: null,
      situationDeclined: false, seekingFor: "self", interests: ["empresa_llc"],
      interestsOther: null, immediateGoal: "empresa_llc", immediateGoalCustom: null,
      onboardingCompleted: true, onboardingSkippedAtStep: null,
      preferredLanguage: "es", createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
  );
});
await page.context().addCookies([
  {
    name: "andex_session",
    value: encodeURIComponent(
      JSON.stringify({ id: "chk", email: "t@e.com", firstName: "Test" }),
    ),
    url: BASE,
  },
]);

await page.goto(`${BASE}/pago?plan=annual`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);

const btn = page
  .getByRole("button", { name: /pagar|simular el pago|entrar/i })
  .first();

console.log("── Estado del botón SIN consentir ──");
console.log("  ¿existe?          ", (await btn.count()) > 0);
console.log("  ¿deshabilitado?   ", await btn.isDisabled());
console.log("  aria-disabled:    ", await btn.getAttribute("aria-disabled"));

const urlBefore = page.url();
await btn.click({ force: true }).catch(() => {});
await page.waitForTimeout(2500);

console.log("\n── Tras pulsarlo sin consentir ──");
console.log("  ¿navegó?          ", page.url() !== urlBefore, page.url().replace(BASE, ""));

const body = await page.locator("body").innerText();
const showsError = /acepta|aceptar|marca la casilla|necesitas|debes/i.test(body);
console.log("  ¿explica qué falta?", showsError);

if (showsError) {
  const m = body.match(/[^\n]*(?:acepta|aceptar|marca la casilla|necesitas|debes)[^\n]*/i);
  console.log("  mensaje:          ", m ? m[0].trim().slice(0, 120) : "");
}

// ¿El foco se mueve a la casilla? Sería la ayuda mínima aceptable.
const focused = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? `${el.tagName}${el.getAttribute("type") ? `[${el.getAttribute("type")}]` : ""}` : "ninguno";
});
console.log("  foco tras pulsar: ", focused);

await page.screenshot({ path: "tests/capturas/26-consentimiento-sin-marcar.png" });
await browser.close();
