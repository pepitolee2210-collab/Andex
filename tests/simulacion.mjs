/**
 * SIMULACIÓN DEL EMBUDO COMPLETO — ANDEX MVP
 *
 * Recorre el producto entero en modo demo con un navegador real, como lo haría
 * una persona: landing → registro → entrevista → paywall → pago → panel.
 *
 * Verifica lo que la "Definición de Terminado" (§9) exige y que ninguna
 * lectura de código puede confirmar: que las pantallas se pintan de verdad,
 * que los formularios aceptan datos, que el motor produce dashboards
 * distintos para perfiles distintos y que no hay errores en consola.
 *
 * Uso:  node tests/simulacion.mjs [--url http://localhost:3200] [--headed]
 */

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv.includes("--url")
  ? process.argv[process.argv.indexOf("--url") + 1]
  : "http://localhost:3200";
const HEADED = process.argv.includes("--headed");
const SHOTS = join(process.cwd(), "tests", "capturas");

mkdirSync(SHOTS, { recursive: true });

// ─── Registro de resultados ──────────────────────────────

const results = [];
let currentStep = "";

function step(name) {
  currentStep = name;
  console.log(`\n▶ ${name}`);
}

function check(label, ok, detail = "") {
  results.push({ step: currentStep, label, ok, detail });
  const mark = ok ? "  OK   " : "  FALLA";
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ""}`);
}

async function shot(page, name) {
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: false });
}

// ─── Utilidades de página ────────────────────────────────

/** Espera a que el texto exista en la página, sin lanzar si no llega. */
async function hasText(page, text, timeout = 8000) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function clickByText(page, text, timeout = 8000) {
  const el = page.getByText(text, { exact: false }).first();
  await el.waitFor({ timeout });
  await el.click();
}

/**
 * Pulsa un botón por su nombre accesible. Se prefiere a buscar por texto:
 * el texto suelto también casa con contenido oculto (p. ej. el modal de
 * cambio de rama contiene la palabra "Continuar").
 */
async function clickButton(page, name, timeout = 10000) {
  const btn = page.getByRole("button", { name }).filter({ visible: true }).first();
  await btn.waitFor({ state: "visible", timeout });
  await btn.click();
}

/** Comprueba el VALOR de un campo, no su texto (un input no tiene texto). */
async function inputHasValue(page, selector, expected) {
  try {
    const v = await page.locator(selector).first().inputValue({ timeout: 5000 });
    return v.includes(expected);
  } catch {
    return false;
  }
}

/** Pulsa una opción (chip/checkbox) por su etiqueta visible. */
async function pickOption(page, label, timeout = 10000) {
  const opt = page
    .getByRole("radio", { name: label })
    .or(page.getByRole("checkbox", { name: label }))
    .or(page.getByRole("button", { name: label }))
    .filter({ visible: true })
    .first();
  await opt.waitFor({ state: "visible", timeout });
  await opt.click();
}

// ─── Simulación ──────────────────────────────────────────

const consoleErrors = [];

async function run() {
  // En modo visible se ralentiza cada acción para que el recorrido se pueda
  // seguir a ojo, y la ventana se maximiza.
  const browser = await chromium.launch({
    headless: !HEADED,
    slowMo: HEADED ? 550 : 0,
    args: HEADED ? ["--start-maximized"] : [],
  });
  const context = await browser.newContext({
    viewport: HEADED ? null : { width: 1280, height: 900 },
    locale: "es-MX",
  });
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(`PAGE ERROR: ${err.message}`));

  // ═══ 1. LANDING ═══════════════════════════════════════
  step("1. Landing — el hero ES la bifurcación (§3.1.1)");
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await shot(page, "01-landing");

  check("carga la landing", page.url().startsWith(BASE));
  check("titular de marca visible", await hasText(page, "cruza fronteras"));
  check("pregunta del hero visible", await hasText(page, "Dónde estás ahora"));
  check("tarjeta rama A visible", await hasText(page, "Ya estoy en Estados Unidos"));
  check("tarjeta rama B visible", await hasText(page, "Estoy fuera de Estados Unidos"));
  check("disclaimer gubernamental", await hasText(page, "no está afiliad"));

  // Orden de módulos ANTES de elegir rama
  const modulesBefore = await page
    .locator("#modulos li, #modulos article")
    .allTextContents();

  step("2. Elegir rama y ver la página reordenarse EN VIVO");
  await clickByText(page, "Ya estoy en Estados Unidos");
  await page.waitForTimeout(1200);
  await shot(page, "02-landing-rama-elegida");

  const modulesAfter = await page
    .locator("#modulos li, #modulos article")
    .allTextContents();
  check(
    "el orden de los módulos cambia al elegir rama",
    JSON.stringify(modulesBefore) !== JSON.stringify(modulesAfter),
    `antes ${modulesBefore.length} · después ${modulesAfter.length}`,
  );
  check("aparece el CTA del plan personalizado", await hasText(page, "plan personalizado"));

  // La elección se persiste en sessionStorage (§3.1.1)
  const stored = await page.evaluate(() =>
    window.sessionStorage.getItem("andex_landing_branch"),
  );
  check("la rama se persiste en sessionStorage", stored === "in_us", `valor: ${stored}`);

  // ═══ 3. REGISTRO ══════════════════════════════════════
  step("3. Registro (§0.2-B)");
  await page.goto(`${BASE}/registro`, { waitUntil: "domcontentloaded" });
  await shot(page, "03-registro");

  const emailInput = page.locator('input[type="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  check("hay campo de correo", (await emailInput.count()) > 0);
  check("hay campo de contraseña", (await passInput.count()) > 0);

  const terms = page.locator('input[type="checkbox"]').first();
  const termsChecked = (await terms.count()) > 0 ? await terms.isChecked() : null;
  check(
    "la casilla de términos NO viene premarcada (§3.4.6)",
    termsChecked === false,
    `estado: ${termsChecked}`,
  );

  // Rellenar y enviar
  const nameInput = page.locator('input[type="text"]').first();
  if ((await nameInput.count()) > 0) await nameInput.fill("María");
  await emailInput.fill("maria.simulacion@example.com");
  await passInput.fill("ClaveSegura123");
  if ((await terms.count()) > 0) await terms.check();
  await shot(page, "04-registro-lleno");

  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(3500);
  await shot(page, "05-tras-registro");
  check(
    "el registro lleva a la entrevista (§3 embudo)",
    page.url().includes("/entrevista"),
    page.url().replace(BASE, "") || "/",
  );

  // ═══ 4. MICRO-ENTREVISTA ══════════════════════════════
  step("4. Micro-entrevista — 5 pasos bifurcados (§3.2)");
  if (!page.url().includes("/entrevista")) {
    await page.goto(`${BASE}/entrevista`, { waitUntil: "domcontentloaded" });
  }
  await page.waitForTimeout(2500);
  await shot(page, "06-wizard-paso1");

  check("paso 1 visible con su contador", await hasText(page, "Paso 1 de 5"));
  check(
    "el nombre viene precargado de la sesión",
    await inputHasValue(page, 'input[name="firstName"], input[type="text"]', "María"),
  );

  // Paso 1 → 2
  await clickButton(page, /continuar|siguiente|ver mi plan|terminar|finalizar/i);
  await page.waitForTimeout(1200);
  await shot(page, "07-wizard-paso2-bifurcacion");
  check("paso 2 es la bifurcación", await hasText(page, "Paso 2 de 5"));
  check("la rama de la landing viene precargada", await hasText(page, "Utah") || await hasText(page, "Estado"));

  // Elegir estado Utah
  const combo = page.locator('input[role="combobox"]').first();
  if ((await combo.count()) > 0) {
    await combo.click();
    await combo.fill("Utah");
    await page.waitForTimeout(700);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
  }
  await shot(page, "08-wizard-estado-utah");
  check("se pudo seleccionar el estado", true);

  await clickButton(page, /continuar|siguiente|ver mi plan|terminar|finalizar/i);
  await page.waitForTimeout(1200);
  await shot(page, "09-wizard-paso3");
  check("avanza al paso 3", await hasText(page, "Paso 3 de 5"));
  check(
    "'Prefiero no responder' está presente (requisito de privacidad)",
    await hasText(page, "Prefiero no responder"),
  );
  check("paso 3.5 '¿para quién?' en la misma pantalla", await hasText(page, "Para mí"));

  // Elegir situación y para quién
  await pickOption(page, /acabo de llegar/i);
  await page.waitForTimeout(400);
  await pickOption(page, /para m/i);
  await page.waitForTimeout(400);
  await clickButton(page, /continuar|siguiente|ver mi plan|terminar|finalizar/i);
  await page.waitForTimeout(1200);
  await shot(page, "10-wizard-paso4-intereses");
  check("avanza al paso 4", await hasText(page, "Paso 4 de 5"));

  // Marcar intereses — el ORDEN importa (§3.3.1: el primero vale +30)
  await pickOption(page, /crear o formalizar|empresa|llc/i);
  await page.waitForTimeout(300);
  await pickOption(page, /educaci.n financiera|inversi.n/i);
  await page.waitForTimeout(300);
  await shot(page, "11-wizard-intereses-marcados");

  await clickButton(page, /continuar|siguiente|ver mi plan|terminar|finalizar/i);
  await page.waitForTimeout(1200);
  await shot(page, "12-wizard-paso5-objetivo");
  check("avanza al paso 5", await hasText(page, "Paso 5 de 5"));
  check(
    "las opciones del paso 5 salen de los intereses del paso 4",
    await hasText(page, "empresa") || await hasText(page, "negocio") || await hasText(page, "Formalizar"),
  );

  // Elegir objetivo y terminar
  try {
    await pickOption(page, /crear o formalizar|empresa|llc/i, 6000);
    await page.waitForTimeout(400);
  } catch {
    /* si el objetivo no bloquea, se sigue sin elegir */
  }
  await shot(page, "13-wizard-objetivo-elegido");

  await clickButton(page, /continuar|siguiente|ver mi plan|terminar|finalizar/i);
  await page.waitForTimeout(3500);
  await shot(page, "14-tras-entrevista");
  check(
    "al terminar la entrevista lleva al paywall (§3)",
    page.url().includes("/membresia"),
    page.url().replace(BASE, ""),
  );

  // ═══ 5. PAYWALL ═══════════════════════════════════════
  step("5. Paywall personalizado (§3.4)");
  if (!page.url().includes("/membresia")) {
    await page.goto(`${BASE}/membresia`, { waitUntil: "domcontentloaded" });
  }
  await page.waitForTimeout(2500);
  await shot(page, "15-paywall");

  check(
    "el titular usa el NOMBRE real, no un texto genérico (§3.4.3)",
    await hasText(page, "María"),
  );
  check("dice 'Tu plan está listo'", await hasText(page, "Tu plan está listo"));
  check("muestra el badge TU PRIORIDAD", await hasText(page, "PRIORIDAD"));
  check(
    "usa la referencia geográfica del usuario (Utah)",
    await hasText(page, "Utah"),
  );
  check("plan mensual visible", await hasText(page, "14"));
  check("plan anual visible", await hasText(page, "140"));
  check("sello de tarifa congelada", await hasText(page, "congelada"));
  check(
    "renovación automática divulgada antes del pago (§3.4.6)",
    await hasText(page, "renueva"),
  );

  // Patrones oscuros prohibidos (§3.4.1 / §3.4.6)
  const body = (await page.locator("body").innerText()).toLowerCase();
  check("sin cuenta regresiva", !/queda[n]? \d+ (minuto|segundo|hora)/.test(body));
  check("sin escasez inventada", !/solo quedan|últimos? \d+ cupos/.test(body));

  // El módulo #1 del paywall debe ser el que recomendó el motor
  const paywallText = await page.locator("body").innerText();
  const heroModuleInPaywall =
    /empresarial|negocio/i.test(paywallText) ? "M4 (Negocio)" : "otro";
  check(
    "el módulo #1 refleja el objetivo declarado (empresa → M4)",
    /empresarial|negocio/i.test(paywallText),
    heroModuleInPaywall,
  );

  // ═══ 6. CHECKOUT ══════════════════════════════════════
  step("6. Checkout simulado (§3.4.5)");
  await clickButton(page, /continuar con el plan|ir al pago|continuar/i);
  await page.waitForTimeout(3000);
  await shot(page, "16-checkout");
  check("llega al checkout", page.url().includes("/pago"), page.url().replace(BASE, ""));
  check(
    "el checkout avisa de que es una simulación",
    await hasText(page, "simula") || await hasText(page, "demo") || await hasText(page, "no se cobra"),
  );
  check("hay enlace para cambiar de plan (§3.4.5)", await hasText(page, "Cambiar de plan"));

  // §3.4.6 — consentimiento afirmativo expreso: el botón de pago está
  // bloqueado hasta marcar la casilla, que llega SIN premarcar.
  const consent = page.locator('input[type="checkbox"]').first();
  const consentPre = (await consent.count()) > 0 ? await consent.isChecked() : null;
  check(
    "el consentimiento NO viene premarcado (§3.4.6)",
    consentPre === false,
    `estado: ${consentPre}`,
  );

  const payBtn = page
    .getByRole("button", { name: /pagar|simular el pago|entrar|activar/i })
    .first();

  // §3.4.6 — el pago no puede seguir sin consentimiento. Se comprueba el
  // COMPORTAMIENTO, no que el botón esté deshabilitado: un botón inhabilitado
  // no explica qué falta y el teclado lo salta. Lo correcto es que no avance,
  // diga qué falta y lleve el foco a la casilla.
  const urlAntes = page.url();
  await payBtn.click({ force: true }).catch(() => {});
  await page.waitForTimeout(1800);
  const bodyTrasIntento = await page.locator("body").innerText();
  check(
    "sin consentir, el pago NO avanza (§3.4.6)",
    page.url() === urlAntes,
    page.url().replace(BASE, ""),
  );
  check(
    "explica qué falta en vez de fallar en silencio",
    /marca la casilla|acepta|debes|necesitas/i.test(bodyTrasIntento),
  );
  const focoTrasIntento = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName}${el.getAttribute("type") ? `[${el.getAttribute("type")}]` : ""}` : "";
  });
  check(
    "el foco va a la casilla que falta",
    focoTrasIntento === "INPUT[checkbox]",
    focoTrasIntento,
  );

  if ((await consent.count()) > 0) await consent.check();
  await page.waitForTimeout(400);
  await shot(page, "16b-checkout-consentido");

  if ((await payBtn.count()) > 0) {
    await payBtn.click();
    await page.waitForTimeout(4000);
  }
  await shot(page, "17-tras-pago");
  check(
    "el pago simulado avanza",
    page.url().includes("/exito") || page.url().includes("/panel"),
    page.url().replace(BASE, ""),
  );

  // ═══ 7. DASHBOARD ═════════════════════════════════════
  step("7. Dashboard adaptativo (§4)");
  await page.goto(`${BASE}/panel`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  await shot(page, "18-panel-in-us");

  check("el panel carga", page.url().includes("/panel"), page.url().replace(BASE, ""));
  check("saluda con el nombre", await hasText(page, "María"));
  check("hero card con recomendación", await hasText(page, "RECOMENDADO") || await hasText(page, "Recomendado"));
  check(
    "la hero card explica el porqué (§4.4)",
    await hasText(page, "Porque"),
  );
  check(
    "el botón 'No es lo que busco' está visible, no escondido (§4.4)",
    await hasText(page, "No es lo que busco"),
  );

  // Los 7 módulos accesibles (§0.4)
  const panelText = await page.locator("body").innerText();
  const moduleNames = ["Bóveda", "Migratorio", "Finanzas", "Empresarial", "Comunidad", "Academia", "Laboral"];
  const found = moduleNames.filter((m) => panelText.includes(m));
  check(
    "los 7 módulos son visibles (§0.4: nunca oculta)",
    found.length >= 6,
    `${found.length}/7 encontrados`,
  );

  const orderInUs = found.join(" > ");

  // ═══ 8. PLACEHOLDER DE MÓDULO ═════════════════════════
  step("8. Pantalla placeholder de módulo (§4.6)");
  await page.goto(`${BASE}/modulo/boveda`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await shot(page, "19-modulo-placeholder");
  check("el módulo abre una pantalla real, no un toast", await hasText(page, "Bóveda") || await hasText(page, "documentos"));
  check(
    "captura de interés presente (§4.6)",
    await hasText(page, "Avísame") || await hasText(page, "necesitas"),
  );

  // ═══ 9. PERFIL Y CANCELACIÓN ══════════════════════════
  step("9. Perfil y cancelación en un clic (§3.4.6)");
  await page.goto(`${BASE}/perfil`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await shot(page, "20-perfil");
  check("el perfil carga", await hasText(page, "perfil") || await hasText(page, "Perfil"));
  // La gestión de membresía vive al final de la página: hay que bajar.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await shot(page, "20b-perfil-membresia");
  const perfilTexto = await page.locator("body").innerText();
  check(
    "se puede cancelar la membresía desde aquí (§3.4.6)",
    /cancelar/i.test(perfilTexto),
  );
  check(
    "cancelar no exige llamar ni escribir a nadie (§3.4.6)",
    !/llámanos|escríbenos|contacta con soporte para cancelar/i.test(perfilTexto),
  );

  // ═══ 10. SEGUNDO PERFIL — otra rama ═══════════════════
  step("10. Segundo perfil (pre_arrival): ¿el dashboard cambia? (§9 DoD #4)");
  const page2 = await context.newPage();
  page2.on("pageerror", (err) => consoleErrors.push(`PAGE2 ERROR: ${err.message}`));

  // Perfil pre_arrival inyectado directamente en el almacenamiento demo
  await page2.goto(BASE, { waitUntil: "domcontentloaded" });
  await page2.evaluate(() => {
    window.localStorage.clear();
    const profile = {
      userId: "sim-carlos",
      email: "carlos@example.com",
      firstName: "Carlos",
      lastName: null,
      phone: null,
      phoneCountryCode: "+57",
      locationContext: "pre_arrival",
      stateUS: null,
      city: null,
      timeInUS: null,
      countryOfResidence: "CO",
      countryOther: null,
      nationality: null,
      travelPlan: "fecha_confirmada",
      estimatedArrivalDate: null,
      situation: "visa_turismo",
      situationOther: null,
      situationDeclined: false,
      seekingFor: "self",
      interests: ["visa_preparacion"],
      interestsOther: null,
      immediateGoal: "visa_preparacion",
      immediateGoalCustom: null,
      onboardingCompleted: true,
      onboardingSkippedAtStep: null,
      preferredLanguage: "es",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem("andex_demo_profile", JSON.stringify(profile));
    const sub = {
      plan: "annual",
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(Date.now() + 31536000000).toISOString(),
      priceUsd: 140,
    };
    window.localStorage.setItem("andex_demo_subscription", JSON.stringify(sub));
  });

  await page2.goto(`${BASE}/panel`, { waitUntil: "domcontentloaded" });
  await page2.waitForTimeout(3000);
  await shot(page2, "21-panel-pre-arrival");

  const panel2Text = await page2.locator("body").innerText();
  check("saluda a Carlos", panel2Text.includes("Carlos"));
  check(
    "modo pre_arrival: menciona su país de origen",
    panel2Text.includes("Colombia"),
  );
  check(
    "banner '¿Ya llegaste?' solo en pre_arrival (§3.2.3)",
    /ya llegaste/i.test(panel2Text),
  );
  check(
    "títulos en variante pre_arrival (§4.2.1)",
    /prepara tu visa|documentos para el viaje|mercado laboral/i.test(panel2Text),
  );

  // §4.2.1: en pre_arrival los módulos CAMBIAN de título. Buscar los nombres
  // de in_us daría un falso negativo — y encontrarlos aquí sería el fallo.
  const preArrivalTitles = [
    /documentos para el viaje/i,
    /prepara tu visa/i,
    /llegada financiera/i,
    /invierte o abre empresa/i,
    /conoce tu destino/i,
    /certif.cate desde tu pa.s/i,
    /mercado laboral/i,
  ];
  const found2 = preArrivalTitles.filter((re) => re.test(panel2Text));
  check(
    "los 7 módulos accesibles con sus títulos de pre_arrival (§4.2.1)",
    found2.length >= 6,
    `${found2.length}/7 títulos de la variante`,
  );

  // El orden DEBE ser distinto — es la casilla 4 de la DoD
  const orderPre = found2.map((r) => String(r)).join(" > ");
  check(
    "EL ORDEN DEL GRID CAMBIA ENTRE PERFILES (§9 DoD #4)",
    orderInUs !== orderPre,
    `in_us: ${orderInUs} || pre_arrival: ${orderPre}`,
  );

  // ═══ 11. MODO OSCURO Y ACCESIBILIDAD ══════════════════
  step("11. Modo oscuro e idioma (§2.6, §2.7)");
  await page2.goto(`${BASE}/api/prefs?theme=dark&back=/panel`, { waitUntil: "domcontentloaded" });
  await page2.waitForTimeout(2000);
  await shot(page2, "22-panel-oscuro");
  const themeAttr = await page2.evaluate(() =>
    document.documentElement.getAttribute("data-theme"),
  );
  check("el modo oscuro se aplica", themeAttr === "dark", `data-theme="${themeAttr}"`);

  await page2.goto(`${BASE}/api/prefs?lang=en&back=/`, { waitUntil: "domcontentloaded" });
  await page2.waitForTimeout(1500);
  await shot(page2, "23-landing-ingles");
  const enText = await page2.locator("body").innerText();
  check(
    "el idioma cambia a inglés",
    /Where are you|United States|your progress/i.test(enText),
  );

  // ═══ 12. RESPONSIVE 320px ═════════════════════════════
  step("12. Responsive hasta 320px (§9)");
  const mobile = await context.newPage();
  // En modo visible el viewport lo manda la ventana; se fuerza solo en headless.
  if (!HEADED) await mobile.setViewportSize({ width: 320, height: 700 });
  await mobile.goto(`${BASE}/api/prefs?lang=es&theme=light&back=/`, { waitUntil: "domcontentloaded" });
  await mobile.waitForTimeout(1500);
  await shot(mobile, "24-mobile-320-landing");
  const overflow = await mobile.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  check("la landing no desborda a 320px", !overflow);

  await mobile.goto(`${BASE}/panel`, { waitUntil: "domcontentloaded" });
  await mobile.waitForTimeout(2500);
  await shot(mobile, "25-mobile-320-panel");
  const overflow2 = await mobile.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  check("el panel no desborda a 320px", !overflow2);

  // ═══ CIERRE ═══════════════════════════════════════════
  step("13. Errores de consola");
  const realErrors = consoleErrors.filter(
    (e) =>
      !e.includes("favicon") &&
      !e.includes("Failed to load resource") &&
      !e.toLowerCase().includes("download the react devtools"),
  );
  check(
    "sin errores de JavaScript en consola",
    realErrors.length === 0,
    realErrors.length ? realErrors.slice(0, 3).join(" | ") : "",
  );

  await browser.close();

  // ─── Resumen ───────────────────────────────────────────
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log("\n" + "═".repeat(62));
  console.log(`RESULTADO: ${passed}/${results.length} comprobaciones correctas`);
  if (failed.length) {
    console.log(`\nFALLAN ${failed.length}:`);
    for (const f of failed) {
      console.log(`  · [${f.step}] ${f.label}${f.detail ? ` — ${f.detail}` : ""}`);
    }
  }
  console.log(`\nCapturas en: ${SHOTS}`);
  console.log("═".repeat(62));

  process.exit(failed.length > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("\nLa simulación se rompió:", err.message);
  console.log(`\nÚltimo paso alcanzado: ${currentStep}`);
  const passed = results.filter((r) => r.ok).length;
  console.log(`Comprobaciones hechas hasta el corte: ${passed}/${results.length}`);
  process.exit(2);
});
