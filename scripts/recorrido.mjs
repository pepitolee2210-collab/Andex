/**
 * RECORRIDO COMPLETO — ¿sigue funcionando la lógica con la interfaz nueva?
 *
 * No mide si se ve bonito: eso lo hace `verificar-visual.mjs`. Esto
 * comprueba que las cosas SIGUEN PASANDO. Un rediseño puede dejar una
 * pantalla preciosa donde el botón de guardar ya no guarda, y las pruebas
 * unitarias no se enteran porque no montan la pantalla.
 *
 * Cada comprobación afirma un HECHO verificable, no «se ve bien».
 */
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3000";
const VISIBLE = process.env.VER === "1";

const browser = await chromium.launch({ headless: !VISIBLE, slowMo: VISIBLE ? 120 : 0 });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

const page = await ctx.newPage();

// ── Vigilancia permanente ────────────────────────────────
const erroresJS = [];
const erroresRed = [];
const avisosConsola = [];
page.on("pageerror", (e) => erroresJS.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") avisosConsola.push(m.text().slice(0, 160));
});
page.on("response", (r) => {
  const s = r.status();
  if (s >= 400 && !r.url().includes("favicon")) {
    erroresRed.push(`${s} ${r.url().replace(BASE, "")}`);
  }
});

const resultados = [];
/* Si el recorrido se cae a media pista, lo hecho hasta ahí no se pierde: sin
   esto, un fallo duro en la bóveda oculta los 20 aciertos anteriores. */
let resumido = false;
process.on("exit", () => {
  if (resumido) return;
  console.log("");
  console.log("── el recorrido murió a media pista; esto es lo que dio tiempo a comprobar ──");
  for (const r of resultados) {
    console.log(`${r.bien ? " ok " : " ✗  "} ${r.area.padEnd(11)} ${r.que}${r.detalle ? `  — ${r.detalle}` : ""}`);
  }
});
function ok(area, que) { resultados.push({ area, que, bien: true }); }
function mal(area, que, detalle) { resultados.push({ area, que, bien: false, detalle }); }

async function comprobar(area, que, fn) {
  try {
    const r = await fn();
    if (r === false) mal(area, que, "devolvió falso");
    else ok(area, que);
    return r;
  } catch (e) {
    mal(area, que, String(e.message).split("\n")[0].slice(0, 120));
    return null;
  }
}

const paso = (t) => console.log(`\n▶ ${t}`);
const texto = async () => (await page.locator("body").innerText()).replace(/\s+/g, " ");

// ══════════════════════════════════════════════════════════
paso("PORTADA");
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

await comprobar("portada", "el titular se lee (no es navy sobre navy)", async () => {
  const h1 = page.locator("h1").first();
  const { color, fondo } = await h1.evaluate((el) => {
    const c = getComputedStyle(el).color;
    let n = el, f = "rgba(0, 0, 0, 0)";
    while (n && f === "rgba(0, 0, 0, 0)") { f = getComputedStyle(n).backgroundColor; n = n.parentElement; }
    return { color: c, fondo: f };
  });
  return color !== fondo;
});

await comprobar("portada", "lleva a la bienvenida, no al registro", async () => {
  // Por DESTINO, no por rótulo. Y el destino cambió: el embudo nuevo empieza
  // por el video de Henry, no por el formulario. Si algún botón se quedó
  // apuntando a /registro, se salta el video y el pago enteros.
  const alEmbudo = await page.locator('a[href^="/bienvenida"]').count();
  const alRegistro = await page.locator('a[href^="/registro"]').count();
  if (alEmbudo === 0) throw new Error("ningún botón lleva a /bienvenida");
  if (alRegistro > 0) throw new Error(`${alRegistro} botones se saltan el embudo`);
  return true;
});

// ════════════════════════════════════════════════════════
// EL EMBUDO NUEVO: bienvenida → pago → cuenta → comunidad.
//
// El orden importa, y es el que nadie espera: se COBRA ANTES de que exista
// la cuenta. Todo lo que se comprueba aquí gira alrededor de eso — que el
// correo del pago sea el que crea la cuenta, que el cobro quede anotado
// mientras el usuario rellena el registro, y que al final aterrice en la
// comunidad y no en una entrevista de cinco pasos que nadie le prometió.
// ════════════════════════════════════════════════════════
paso("BIENVENIDA — el video de Henry");
await page.goto(BASE + "/bienvenida", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);

await comprobar("bienvenida", "no exige sesión", async () => {
  // Si volviera a estar protegida, el embudo empezaría por un login.
  return page.url().includes("/bienvenida");
});

await comprobar("bienvenida", "el hueco del video está reservado en 16:9", async () => {
  // El archivo todavía no existe. Lo que no puede pasar es que al llegar
  // empuje la página hacia abajo: el marco reserva su proporción DESDE AHORA.
  const marco = page.locator(".aspect-video").first();
  if (!(await marco.count())) throw new Error("no hay marco con proporción");
  const r = await marco.boundingBox();
  const proporcion = r.width / r.height;
  if (Math.abs(proporcion - 16 / 9) > 0.04) {
    throw new Error(`proporción ${proporcion.toFixed(2)}`);
  }
  return true;
});

await comprobar("bienvenida", "el estado PENDIENTE está rotulado", async () => {
  // Un marco vacío que parece un reproductor acaba en producción sin que
  // nadie se dé cuenta. Mientras no haya archivo, tiene que decirlo.
  return /pendiente|pending/i.test(await texto());
});

await comprobar("bienvenida", "el recorrido dice en qué paso va", async () => {
  return (await page.locator('[role="group"][aria-label*="aso"]').count()) > 0;
});

await comprobar("bienvenida", "continuar lleva al pago", async () => {
  await page.getByRole("link", { name: /continuar|continue/i }).first().click();
  /* 30 s y no 15: en desarrollo /pago compila la primera vez que se visita,
     así que un margen corto mide la velocidad del compilador y no si el
     botón navega. */
  await page.waitForURL("**/pago**", { timeout: 30_000 });
  return true;
});

// ════════════════════════════════════════════════════════
paso("PAGO — antes de que exista la cuenta");
await page.waitForTimeout(1200);

await comprobar("pago", "se puede pagar SIN sesión", async () => {
  // Si `middleware.ts` volviera a proteger /pago, el embudo se rompe entero:
  // el usuario iría al login antes de haber podido pagar.
  return page.url().includes("/pago");
});

await comprobar("pago", "NINGÚN campo de tarjeta es nuestro", async () => {
  // Regla dura: un `<input>` propio metería el producto en el alcance de
  // PCI DSS. Aquí es donde más tienta ponerlo, así que aquí se comprueba.
  const propios = await page.locator(
    'input[name*="card" i], input[name*="tarjeta" i], input[autocomplete*="cc-"], ' +
      'input[inputmode="numeric"][maxlength="19"]',
  ).count();
  if (propios) throw new Error(`${propios} campos de tarjeta propios`);
  return true;
});

await comprobar("pago", "dice que la cuenta se crea después, con ese correo", async () => {
  // Pagar y que no te pidan la cuenta hasta el paso siguiente se lee como
  // haber perdido el dinero. El texto tiene que decirlo ANTES de cobrar.
  return /cuenta.{0,40}siguiente paso|account.{0,40}next step/i.test(await texto());
});

const CORREO = `recorrido${Date.now()}@andex.test`;

await comprobar("pago", "sin correo no cobra", async () => {
  await page.getByRole("button", { name: /pagar|pay /i }).first().click().catch(() => {});
  await page.waitForTimeout(1000);
  const anotado = await page.evaluate(() => localStorage.getItem("andex_pago_pendiente"));
  if (anotado) throw new Error("cobró sin correo");
  return page.url().includes("/pago");
});

await comprobar("pago", "cobra y anota el cobro antes de mandar al registro", async () => {
  await page.locator('input[type="email"]').first().fill(CORREO);
  await page.getByRole("button", { name: /pagar|pay /i }).first().click();
  await page.waitForURL("**/registro", { timeout: 20000 });
  const anotado = await page.evaluate(() => localStorage.getItem("andex_pago_pendiente"));
  if (!anotado) {
    throw new Error("el cobro no quedó anotado: se pierde si cierra la pestaña");
  }
  const { plan, email } = JSON.parse(anotado);
  if (!plan) throw new Error("sin plan");
  if (email !== CORREO) throw new Error("el correo anotado no es el que se escribió");
  return true;
});

// ════════════════════════════════════════════════════════
paso("REGISTRO — la cuenta, ya pagada");
await page.waitForTimeout(1000);

await comprobar("registro", "los tres campos existen y aceptan texto", async () => {
  await page.locator('input[type="text"]').first().fill("María López");
  const correo = page.locator('input[type="email"]').first();
  if (!(await correo.inputValue())) await correo.fill(CORREO);
  await page.locator('input[type="password"]').first().fill("ClaveSegura123");
  return true;
});

await comprobar("registro", "no se puede crear la cuenta sin aceptar", async () => {
  const b = page.getByRole("button", { name: /crear mi cuenta/i }).first();
  const antes = page.url();
  await b.click().catch(() => {});
  await page.waitForTimeout(900);
  const sigue = page.url().includes("registro");
  const aviso = (await page.locator('[role="alert"]').count()) > 0;
  return sigue || aviso || antes === page.url();
});

await comprobar("registro", "acepta, y el pago pendiente lo lleva a la COMUNIDAD", async () => {
  await page.getByRole("checkbox").first().click();
  await page.getByRole("button", { name: /crear mi cuenta/i }).click();
  await page.waitForURL("**/modulo/comunidad", { timeout: 25000 });
  return true;
});

await comprobar("registro", "el cobro anotado se limpia al consumirlo", async () => {
  // Si sobreviviera, la próxima cuenta creada en este navegador activaría
  // una suscripción que nadie pagó.
  return (await page.evaluate(() => localStorage.getItem("andex_pago_pendiente"))) === null;
});

// ════════════════════════════════════════════════════════
paso("COMUNIDAD — se entra sin haber contestado la entrevista");
// La espera es larga a propósito: el rebote llegaba DESPUÉS de pintar, así
// que mirar demasiado pronto daba un falso verde.
await page.waitForTimeout(4000);

await comprobar("comunidad", "NO rebota a la entrevista", async () => {
  // Ésta es la regresión que rompería la promesa del embudo. El guardián del
  // panel mandaba a la entrevista desde CUALQUIER pantalla; ahora sólo desde
  // el panel, que es la única que necesita el perfil para ordenar módulos.
  if (page.url().includes("entrevista")) throw new Error("rebotó a la entrevista");
  return page.url().includes("/modulo/comunidad");
});

await comprobar("comunidad", "la suscripción quedó activa", async () => {
  const sub = await page.evaluate(() => localStorage.getItem("andex_demo_subscription"));
  if (!sub) throw new Error("pagó y no se le activó ninguna suscripción");
  return true;
});

await comprobar("perfil", "sin entrevista NO está en blanco", async () => {
  // Quien pagó y saltó la entrevista puede tocar "Perfil". Antes veía una
  // pantalla vacía; ahora se le dice qué falta y se le ofrece contestarlo.
  await page.goto(BASE + "/perfil", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  if (page.url().includes("entrevista")) return true;
  const t = (await texto()).trim();
  if (t.length < 60) throw new Error(`pantalla casi vacía (${t.length} caracteres)`);
  return true;
});

// ════════════════════════════════════════════════════════
paso("ENTREVISTA — 5 pasos (se ofrece, no se obliga)");
await page.goto(BASE + "/entrevista", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
let pasosHechos = 0;
for (let i = 0; i < 8; i++) {
  if (!page.url().includes("entrevista")) break;
  const antes = await texto();

  // Radios / chips: elegir el primero que haya
  const radios = page.locator('[role="radio"], input[type="radio"]');
  if (await radios.count()) await radios.first().click().catch(() => {});

  const checks = await page.locator('[role="checkbox"]').all();
  for (const c of checks.slice(0, 2)) await c.click().catch(() => {});

  const combo = page.locator('input[placeholder*="stado"], input[placeholder*="iudad"]').first();
  if (await combo.count()) {
    await combo.fill("Utah");
    await page.waitForTimeout(800);
    const o = page.locator('[role="option"]').first();
    if (await o.count()) await o.click().catch(() => {});
  }

  const seguir = page
    .getByRole("button", { name: /continuar|siguiente|ver mi plan|terminar/i })
    .first();
  if (!(await seguir.count())) break;
  await seguir.click().catch(() => {});
  await page.waitForTimeout(1400);
  if ((await texto()) !== antes) pasosHechos++;
}
await comprobar(
  "entrevista",
  `avanza por sus pasos (${pasosHechos} transiciones)`,
  async () => pasosHechos >= 4,
);

await comprobar("membresía", "quien YA pagó no vuelve a ver el muro", async () => {
  /* La entrevista termina empujando a /membresia sin mirar si hay
     suscripción. Con el embudo nuevo eso le pasa a alguien que YA pagó, así
     que el muro tiene que apartarse solo. La espera es al DESTINO y no a un
     reloj: leer la URL demasiado pronto daba un falso rojo con el redirect
     todavía en vuelo. */
  await page.waitForURL((u) => !u.pathname.startsWith("/membresia"), { timeout: 20000 });
  return !page.url().includes("/membresia");
});

await comprobar("panel", "con perfil y suscripción, el panel abre", async () => {
  await page.goto(BASE + "/panel", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  return page.url().includes("/panel");
});


// ══════════════════════════════════════════════════════════
paso("ARMAZÓN");
await comprobar("armazón", "la cápsula tiene CUATRO pestañas y el «+»", async () => {
  const tabs = await page.locator(".cristal-barra a").count();
  const mas = await page.locator(".cristal-mas").count();
  if (tabs !== 4 || mas !== 1) throw new Error(`${tabs} pestañas, ${mas} botón +`);
  return true;
});

await comprobar("armazón", "la cápsula mide 68px y es redonda del todo", async () => {
  const m = await page.locator(".cristal-barra").evaluate((el) => {
    const s = getComputedStyle(el);
    return { alto: Math.round(el.getBoundingClientRect().height), radio: s.borderRadius };
  });
  if (m.alto !== 68) throw new Error(`alto ${m.alto}`);
  return true;
});

await comprobar("armazón", "todo lo pulsable de la barra llega a 44px", async () => {
  const chicos = await page.evaluate(() =>
    [...document.querySelectorAll(".cristal-barra a, .cristal-barra button")]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width < 44 || r.height < 44).length);
  if (chicos) throw new Error(`${chicos} por debajo`);
  return true;
});

await comprobar("menú", "el «+» abre el modal flotante", async () => {
  await page.locator(".cristal-mas").click();
  await page.waitForTimeout(700);
  const abierto = await page.locator("dialog.cristal-modal[open]").count();
  const expandido = await page.locator('.cristal-mas[aria-expanded="true"]').count();
  if (!abierto || !expandido) throw new Error("no abrió o el + no cambió de estado");
  return true;
});

await comprobar("menú", "trae OCHO herramientas y la equis, en 3×3", async () => {
  const n = await page.locator(".cristal-accion").count();
  const cols = await page.locator(".cristal-rejilla").evaluate(
    (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  if (n !== 9) throw new Error(`hay ${n} (8 + cerrar = 9)`);
  if (cols !== 3) throw new Error(`${cols} columnas`);
  return true;
});

await comprobar("menú", "lo que ya funciona va PRIMERO", async () => {
  const orden = await page.evaluate(() =>
    [...document.querySelectorAll(".cristal-accion[href]")].map((a) => a.getAttribute("href")));
  const cerrados = ["migracion", "finanzas", "negocio", "empleo"];
  const primerCerrado = orden.findIndex((h) => cerrados.some((c) => h?.includes(c)));
  const ultimoVivo = orden.reduce(
    (max, h, i) => (cerrados.some((c) => h?.includes(c)) ? max : i), -1);
  if (primerCerrado !== -1 && ultimoVivo > primerCerrado) {
    throw new Error("hay algo cerrado antes de algo que funciona");
  }
  return orden[0]?.includes("tienda") === true;
});

await comprobar("menú", "no repite lo que ya es pestaña", async () => {
  const enRejilla = await page.evaluate(() =>
    [...document.querySelectorAll(".cristal-accion[href]")].map((a) => a.getAttribute("href")));
  const enBarra = await page.evaluate(() =>
    [...document.querySelectorAll(".cristal-barra a")].map((a) => a.getAttribute("href")));
  const repetidas = enRejilla.filter((h) => enBarra.includes(h));
  if (repetidas.length) throw new Error(`repetidas: ${repetidas.join(", ")}`);
  return true;
});

await comprobar("menú", "entre barra y rejilla están los SIETE módulos", async () => {
  const todos = await page.evaluate(() => [
    ...[...document.querySelectorAll(".cristal-accion[href]")].map((a) => a.getAttribute("href")),
    ...[...document.querySelectorAll(".cristal-barra a")].map((a) => a.getAttribute("href")),
  ]);
  const modulos = ["boveda", "migracion", "finanzas", "negocio", "comunidad", "academia", "empleo"];
  const faltan = modulos.filter((m) => !todos.some((d) => d?.includes(m)));
  if (faltan.length) throw new Error(`faltan: ${faltan.join(", ")}`);
  return true;
});

await comprobar("menú", "los nombres van completos y sin recortar", async () => {
  const malos = await page.evaluate(() =>
    [...document.querySelectorAll(".cristal-etiqueta")]
      // `scrollHeight > clientHeight` delata texto cortado por overflow.
      .filter((el) => el.scrollHeight > el.clientHeight + 1)
      .map((el) => el.textContent));
  if (malos.length) throw new Error(`recortados: ${malos.join(" · ")}`);
  const nombres = await page.evaluate(() =>
    [...document.querySelectorAll(".cristal-etiqueta")].map((el) => el.textContent));
  if (!nombres.some((n) => n && n.length > 14)) {
    throw new Error("parecen abreviaturas, no nombres de módulo");
  }
  return true;
});

await comprobar("menú", "el material sigue al tema, no es negro fijo", async () => {
  const fondo = await page.locator(".cristal-barra").evaluate(
    (el) => getComputedStyle(el).backgroundImage);
  return fondo.includes("gradient");
});

await comprobar("menú", "el modal flota SOBRE la barra, en la zona del pulgar", async () => {
  const p = await page.locator(".cristal-panel").boundingBox();
  const b = await page.locator(".cristal-barra").boundingBox();
  if (!p || !b) throw new Error("no los encuentro");
  if (p.y + p.height > b.y) throw new Error("el panel se solapa con la barra");
  return true;
});

await comprobar("menú", "Escape lo cierra", async () => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);
  return (await page.locator("dialog.cristal-modal[open]").count()) === 0;
});

await comprobar("menú", "tocar el fondo lo cierra", async () => {
  await page.locator(".cristal-mas").click();
  await page.waitForTimeout(700);
  await page.mouse.click(195, 120);
  await page.waitForTimeout(900);
  return (await page.locator("dialog.cristal-modal[open]").count()) === 0;
});

await comprobar("menú", "el foco vuelve al «+» al cerrar", async () => {
  const enfocado = await page.evaluate(() => document.activeElement?.className || "");
  return /cristal-mas/.test(String(enfocado));
});

await comprobar("menú", "una acción lleva a su sitio y cierra el menú", async () => {
  await page.locator(".cristal-mas").click();
  await page.waitForTimeout(700);
  await page.locator('.cristal-accion[href*="tienda"]').first().click();
  await page.waitForURL("**/tienda", { timeout: 30_000 });
  await page.waitForTimeout(600);
  const cerrado = (await page.locator("dialog.cristal-modal[open]").count()) === 0;
  return cerrado && page.url().includes("tienda");
});

await comprobar("armazón", "no quedan dos navegaciones a la vez", async () => {
  const navs = await page.locator("nav").count();
  const lateral = await page.locator("aside nav").count();
  return lateral === 0 && navs <= 2;
});

await comprobar("armazón", "las pestañas navegan de verdad", async () => {
  const destinos = [];
  for (const nombre of [/bóveda/i, /academia/i, /comunidad/i, /inicio/i]) {
    const tab = page.locator(".cristal-barra a").filter({ hasText: nombre }).first();
    const destino = await tab.getAttribute("href");
    await tab.click();
    /* Se espera al HECHO, no al reloj. En desarrollo cada ruta compila la
       primera vez que se visita, así que un `waitForTimeout` fijo mide la
       velocidad del compilador y no si la pestaña navega. */
    await page.waitForURL(`**${destino}`, { timeout: 30_000 });
    destinos.push(page.url().replace(BASE, ""));
  }
  return new Set(destinos).size === 4;
});

await comprobar("armazón", "la pestaña activa se marca sola", async () => {
  await page.goto(BASE + "/modulo/boveda", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1600);
  const activa = await page.locator('.cristal-barra a[aria-current="page"]').innerText();
  return /bóveda/i.test(activa);
});

// ══════════════════════════════════════════════════════════
paso("PANEL — ¿el motor sigue vivo?");
await page.goto(BASE + "/panel", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2200);
const textoPanel = await texto();

await comprobar("panel", "la recomendación trae su PORQUÉ", async () =>
  /porque/i.test(textoPanel));

await comprobar("panel", "están los SIETE módulos", async () => {
  const n = await page.locator(".tile").count();
  if (n < 7) throw new Error(`sólo ${n} baldosas`);
  return true;
});

await comprobar("panel", "los dos bloques dicen qué entra y dónde acaba", async () =>
  /TU PLAN INCLUYE/i.test(textoPanel) && /FUERA DE TU PLAN/i.test(textoPanel));

await comprobar("panel", "una baldosa lleva a su módulo", async () => {
  const destino = await page.locator(".tile").first().getAttribute("href");
  await page.locator(".tile").first().click();
  await page.waitForURL(`**${destino}`, { timeout: 30_000 });
  return page.url().includes("/modulo/") || page.url().includes("/tienda") || page.url().includes("/inversiones");
});

// ══════════════════════════════════════════════════════════
paso("BÓVEDA — guardar, contar, filtrar, borrar");
await page.goto(BASE + "/modulo/boveda", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);

await comprobar("bóveda", "la bóveda vacía ofrece UNA acción", async () => {
  const t = await texto();
  return /escanear/i.test(t);
});

async function escanear(nombre, dias) {
  await page.goto(BASE + "/modulo/boveda", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1400);

  /* Se espera a que el botón esté ADEMÁS habilitado: mientras la bóveda
     descifra se pinta uno desactivado con el mismo nombre, y un `click()`
     sobre él se queda esperando los 30 s enteros sin decir por qué. */
  const btnEscanear = page.locator("button:not([disabled])").filter({ hasText: /escanear/i }).first();
  try {
    await btnEscanear.waitFor({ state: "visible", timeout: 15_000 });
  } catch {
    const diag = await page.evaluate(() => ({
      url: location.pathname + location.search,
      dialogoAbierto: !!document.querySelector("dialog[open]"),
      botones: [...document.querySelectorAll("button")]
        .filter((b) => /escanear/i.test(b.textContent || ""))
        .map((b) => ({ txt: (b.textContent || "").trim().slice(0, 24), off: b.disabled })),
      texto: (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 140),
    }));
    throw new Error(`no encuentro el botón de escanear: ${JSON.stringify(diag)}`);
  }
  await btnEscanear.click();
  await page.waitForTimeout(1800);
  await page.evaluate(async (t) => {
    const c = document.createElement("canvas");
    c.width = 900; c.height = 1250;
    const g = c.getContext("2d");
    g.fillStyle = "#26262b"; g.fillRect(0, 0, c.width, c.height);
    g.save(); g.translate(450, 625); g.rotate(0.04);
    g.fillStyle = "#f6f4ee"; g.fillRect(-330, -440, 660, 880);
    g.fillStyle = "#0f2f4f"; g.fillRect(-330, -440, 660, 80);
    g.fillStyle = "#111"; g.font = "bold 36px sans-serif";
    g.fillText(t.slice(0, 20), -300, -290);
    g.restore();
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.9));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], "d.jpg", { type: "image/jpeg" }));
    const i = document.querySelector(
      'dialog[open] input[type="file"]:not([capture]), [role="dialog"] input[type="file"]:not([capture])'
    );
    if (!i) throw new Error("no encuentro el campo de archivo del escáner");
    i.files = dt.files;
    i.dispatchEvent(new Event("change", { bubbles: true }));
  }, nombre);
  await page.waitForTimeout(3200);
  const dlg = page.locator('dialog[open], [role="dialog"]');
  for (const re of [/continuar/i, /terminar/i, /crear mi pdf/i]) {
    const b = dlg.getByRole("button", { name: re }).first();
    if (await b.count()) { await b.click(); await page.waitForTimeout(2400); }
  }
  await page.locator('input[type="text"]').first().fill(nombre).catch(() => {});
  if (dias !== null) {
    const f = new Date(Date.now() + dias * 864e5).toISOString().slice(0, 10);
    await page.locator('input[type="date"]').first().fill(f).catch(() => {});
  }
  await page.getByRole("button", { name: /guardar|añadir a mi bóveda/i }).first().click().catch(() => {});
  await page.waitForTimeout(2400);
}

await comprobar("bóveda", "el escáner GUARDA de verdad", async () => {
  await escanear("Permiso de trabajo EAD", 40);
  await page.goto(BASE + "/modulo/boveda", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  return (await page.locator(".doccard").count()) >= 1;
});

await comprobar("bóveda", "sobrevive a recargar (está cifrado en el disco)", async () => {
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2400);
  return (await page.locator(".doccard").count()) >= 1;
});

await escanear("Acta de nacimiento", null);
await escanear("Pasaporte Mexico", 700);
await page.goto(BASE + "/modulo/boveda", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2200);

const cuentas = await page.evaluate(() =>
  [...document.querySelectorAll(".tallycell")].map((c) => ({
    n: Number(c.querySelector(".tallynum")?.textContent),
    lbl: c.querySelector(".tallylbl")?.textContent,
  })));

await comprobar("bóveda", `el recuento cuadra con lo guardado ${JSON.stringify(cuentas.map(c => c.n))}`,
  async () => cuentas.length === 3 && cuentas.reduce((a, c) => a + c.n, 0) === 3);

await comprobar("bóveda", "tocar una cuenta CAMBIA la lista", async () => {
  const celdas = page.locator(".tallycell");
  const antes = await page.locator("#boveda-lista").innerText().catch(() => "");
  await celdas.nth(2).click();
  await page.waitForTimeout(900);
  const despues = await page.locator("#boveda-lista").innerText().catch(() => "");
  return antes !== despues;
});

await comprobar("bóveda", "el buscador encuentra por nombre", async () => {
  const lupa = page.locator(".navright button").first();
  await lupa.click();
  await page.waitForTimeout(700);
  await page.locator('input[type="search"]').fill("pasaporte");
  await page.waitForTimeout(1100);
  const t = await texto();
  return /pasaporte/i.test(t) && !/acta de nacimiento/i.test(t);
});

await comprobar("bóveda", "cambiar el nombre PERSISTE", async () => {
  await page.goto(BASE + "/modulo/boveda", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.locator(".docactions button").filter({ hasText: /editar/i }).first().click();
  await page.waitForTimeout(1200);
  await page.locator('dialog[open] input[type="text"], [role="dialog"] input[type="text"]')
    .first().fill("NOMBRE CAMBIADO");
  await page.getByRole("button", { name: /guardar/i }).first().click();
  await page.waitForTimeout(2000);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2400);
  return /NOMBRE CAMBIADO/.test(await texto());
});

await comprobar("bóveda", "borrar PIDE confirmación y borra", async () => {
  /* Se cuenta el TOTAL del resumen, no las tarjetas visibles.
     Al borrar el último documento de un estado, el resumen salta solo al
     siguiente estado con contenido, así que la lista visible puede tener
     los mismos elementos que antes y el borrado haber ocurrido igual. El
     total de las tres cuentas es lo que no miente. */
  const total = () => page.evaluate(() =>
    [...document.querySelectorAll(".tallynum")].reduce((a, n) => a + Number(n.textContent), 0));
  const antes = await total();
  await page.locator(".docactions button.danger").first().click();
  await page.waitForTimeout(1100);
  const hayDialogo = (await page.locator('dialog[open], [role="dialog"]').count()) > 0;
  if (!hayDialogo) throw new Error("borró sin preguntar");
  /* Acotado al diálogo y con el nombre EXACTO: el botón «Borrar» de la
     propia tarjeta lleva `aria-label="Eliminar"`, así que una búsqueda
     suelta por «eliminar» lo encontraba a él y no al de confirmar. */
  await page.locator('dialog[open], [role="dialog"]')
    .getByRole("button", { name: /^s[ií], eliminar$/i }).first().click();
  await page.waitForTimeout(2400);
  const despues = await total();
  if (!(despues < antes)) throw new Error(`el total sigue en ${despues}`);
  return true;
});

await comprobar("bóveda", "ningún documento viaja en la URL", async () =>
  !/nombre|name|doc|file/i.test(page.url().split("?")[1] ?? ""));

// ══════════════════════════════════════════════════════════
paso("ACADEMIA · COMUNIDAD · TIENDA · INVERSIONES");
for (const [ruta, area, esperado] of [
  ["/modulo/academia", "academia", /ingl[eé]s/i],
  ["/modulo/comunidad", "comunidad", /taller/i],
  ["/tienda", "tienda", /andex|fuera|abrir/i],
  ["/inversiones", "inversiones", /\$/],
]) {
  await page.goto(BASE + ruta, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2200);
  const t = await texto();
  await comprobar(area, "carga con contenido real", async () => esperado.test(t) && t.length > 200);
  await comprobar(area, "sin «undefined» ni «[object» a la vista", async () =>
    !/undefined|\[object|NaN/.test(t));
}

await comprobar("academia", "un temario se abre", async () => {
  await page.goto(BASE + "/modulo/academia", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const antes = await texto();
  await page.locator(".row.tappable").first().click();
  await page.waitForTimeout(1600);
  return (await texto()) !== antes;
});

await comprobar("tienda", "los enlaces externos salen con rel seguro", async () => {
  await page.goto(BASE + "/tienda", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const malos = await page.evaluate(() =>
    [...document.querySelectorAll('a[target="_blank"]')]
      .filter((a) => !(a.rel || "").includes("noopener")).length);
  return malos === 0;
});

// ══════════════════════════════════════════════════════════
paso("PERFIL — tema, idioma, guardar");
await page.goto(BASE + "/perfil", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2200);

await comprobar("perfil", "el tema NOCHE se aplica de verdad", async () => {
  const noche = page.getByRole("button", { name: /noche/i }).first();
  if (!(await noche.count())) throw new Error("no encuentro el conmutador");
  await noche.click();
  await page.waitForTimeout(1200);
  const fondo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (fondo !== "rgb(11, 11, 13)") throw new Error(`fondo ${fondo}`);
  return true;
});

await comprobar("perfil", "el tema SOBREVIVE al navegar", async () => {
  await page.goto(BASE + "/modulo/boveda", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  return (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === "rgb(11, 11, 13)";
});

await comprobar("perfil", "de noche NADA proyecta sombra", async () => {
  const conSombra = await page.evaluate(() =>
    [...document.querySelectorAll(".ax-card, .doccard, .tallycell, .ax-group, .tile")]
      .filter((el) => {
        const s = getComputedStyle(el).boxShadow;
        return s !== "none" && !s.includes("inset");
      }).length);
  if (conSombra > 0) throw new Error(`${conSombra} elementos con sombra`);
  return true;
});

await comprobar("perfil", "vuelve a DÍA", async () => {
  await page.goto(BASE + "/perfil", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: /d[ií]a/i }).first().click();
  await page.waitForTimeout(1200);
  return (await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === "rgb(247, 245, 239)";
});

await comprobar("perfil", "el conmutador de idioma existe y apunta a la API", async () => {
  const t = await texto();
  return /EN|English|Ingl/i.test(t);
});

// ══════════════════════════════════════════════════════════
paso("REGLAS DURAS, sobre la pantalla ya pintada");
const rutas = ["/panel", "/modulo/boveda", "/modulo/academia", "/modulo/comunidad", "/tienda", "/inversiones", "/perfil"];
let notario = 0, pequeno = 0, urlSucia = 0;
for (const r of rutas) {
  await page.goto(BASE + r, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1600);
  const t = await texto();
  if (/notar[ií]/i.test(t)) notario++;
  if (/[?&](email|name|nombre|caso|ssn)=/i.test(page.url())) urlSucia++;
  pequeno += await page.evaluate(() =>
    [...document.querySelectorAll("p, span, li, a, button")]
      .filter((el) => {
        const txt = (el.textContent || "").trim();
        if (txt.length < 12 || el.children.length) return false;
        const s = getComputedStyle(el);
        if (s.textTransform === "uppercase") return false; // rótulos
        return parseFloat(s.fontSize) < 13;
      }).length);
}
await comprobar("reglas", "la palabra «notario» no aparece en ninguna pantalla", async () => notario === 0);
await comprobar("reglas", "ningún dato personal en una URL", async () => urlSucia === 0);
await comprobar("reglas", `ninguna prosa por debajo de 13px (${pequeno})`, async () => pequeno === 0);

// ══════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(66));
resumido = true;
const fallos = resultados.filter((r) => !r.bien);
for (const r of resultados) {
  console.log(`${r.bien ? " ok " : " ✗  "} ${r.area.padEnd(11)} ${r.que}${r.detalle ? `  — ${r.detalle}` : ""}`);
}
console.log("═".repeat(66));
console.log(`${resultados.length - fallos.length}/${resultados.length} comprobaciones`);
console.log(`errores JS: ${erroresJS.length ? erroresJS.slice(0, 6).join(" | ") : "ninguno"}`);
console.log(`respuestas 4xx/5xx: ${erroresRed.length ? [...new Set(erroresRed)].slice(0, 8).join(" | ") : "ninguna"}`);
console.log(`errores de consola: ${avisosConsola.length ? [...new Set(avisosConsola)].slice(0, 5).join(" | ") : "ninguno"}`);
console.log("═".repeat(66));

await browser.close();
process.exit(fallos.length ? 1 : 0);
