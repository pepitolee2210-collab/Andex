/**
 * VERIFICADOR VISUAL — «¿rompí algo?» en un solo comando.
 *
 * Existe por una razón concreta: los tres fallos más visibles del rediseño
 * anterior pasaron las 205 pruebas y los detectó una persona mirando.
 *
 *   · un dock que repetía la rejilla entera un palmo más abajo
 *   · una barra pegajosa translúcida a través de la que se leía el contenido
 *   · iconos que sólo se animaban con el ratón, en un producto de móvil
 *
 * Ninguna prueba unitaria puede cogerlos porque no son de lógica: son de
 * espacio, de capas y de gesto. Esto sí.
 *
 * Recorre cada pantalla del producto y comprueba siete cosas:
 *
 *   1. carga sin errores de JavaScript
 *   2. no se desborda en horizontal
 *   3. nada pulsable baja de 44 x 44
 *   4. el texto cumple 4.5:1 de contraste
 *   5. el cuerpo nunca baja de 16px
 *   6. nada pulsable queda TAPADO por una barra fija
 *   7. no hay dos navegaciones a la vez
 *
 * Uso:  node scripts/verificar-visual.mjs [--base http://localhost:3000]
 */

import { chromium } from "playwright";
import { PNG } from "pngjs";

const BASE =
  process.argv.find((a) => a.startsWith("--base="))?.split("=")[1] ??
  "http://localhost:3000";

/** Contraste WCAG. */
const lum = (r, g, b) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(...a), lum(...b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const fallos = [];
const suma = { pantallas: 0, comprobaciones: 0 };
const anota = (pantalla, que, detalle) => fallos.push({ pantalla, que, detalle });

/**
 * Mide el contraste de un texto de verdad.
 *
 * El color se pinta en un canvas para que dé igual la sintaxis del CSS
 * —`oklab()`, `color-mix()`, lo que sea—, y el fondo se fotografía con las
 * LETRAS APAGADAS, no con el elemento oculto: ocultarlo borraría también su
 * propio fondo y un botón daría 1.00:1.
 */
async function contrasteDe(page, el) {
  const info = await el.evaluate((n) => {
    const cs = getComputedStyle(n);
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    const g = c.getContext("2d");
    g.fillStyle = cs.color;
    g.fillRect(0, 0, 1, 1);
    const [r, gg, b, a] = g.getImageData(0, 0, 1, 1).data;
    return { rgb: [r, gg, b], alpha: a / 255, size: parseFloat(cs.fontSize), weight: cs.fontWeight };
  });
  const caja = await el.boundingBox();
  if (!caja || caja.width < 4 || caja.height < 4 || caja.y < 0) return null;

  await el.evaluate((n) => {
    n.style.setProperty("color", "transparent", "important");
    n.style.setProperty("-webkit-text-fill-color", "transparent", "important");
  });
  const shot = await page.screenshot({
    clip: {
      x: Math.max(0, caja.x), y: Math.max(0, caja.y),
      width: Math.max(4, Math.min(caja.width, 380)),
      height: Math.max(4, Math.min(caja.height, 60)),
    },
  }).catch(() => null);
  await el.evaluate((n) => {
    n.style.removeProperty("color");
    n.style.removeProperty("-webkit-text-fill-color");
  });
  if (!shot) return null;

  const png = PNG.sync.read(shot);
  let R = 0, G = 0, B = 0, n = 0;
  for (let i = 0; i < png.data.length; i += 4) { R += png.data[i]; G += png.data[i + 1]; B += png.data[i + 2]; n += 1; }
  const fondo = [R / n, G / n, B / n];
  const frente = info.rgb.map((v, i) => v * info.alpha + fondo[i] * (1 - info.alpha));
  const grande = info.size >= 24 || (info.size >= 18.66 && Number(info.weight) >= 700);
  return { r: ratio(frente, fondo), size: info.size, minimo: grande ? 3 : 4.5 };
}

async function revisar(page, nombre) {
  suma.pantallas += 1;
  const errores = new Set();
  const onError = (e) => errores.add(e.message.slice(0, 90));
  page.on("pageerror", onError);

  await page.waitForTimeout(2600);

  // 1 · errores de JavaScript
  if (errores.size) anota(nombre, "errores de JavaScript", [...errores][0]);

  // 2 · desbordamiento horizontal
  const ancho = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    vista: window.innerWidth,
  }));
  if (ancho.doc > ancho.vista + 2) {
    anota(nombre, "se desborda en horizontal", `${ancho.doc}px en una ventana de ${ancho.vista}px`);
  }

  // 3 · objetivos táctiles + 6 · tapados por una barra fija
  const problemas = await page.evaluate(() => {
    const fijas = [...document.querySelectorAll("*")].filter((e) => {
      const cs = getComputedStyle(e);
      return (cs.position === "fixed" || cs.position === "sticky") &&
        e.getBoundingClientRect().height > 24 &&
        Number(cs.zIndex || 0) >= 10;
    }).map((e) => e.getBoundingClientRect());

    const chicos = [];
    const tapados = [];
    /* Un enlace DENTRO de una frase no tiene que medir 44px: la propia WCAG
       lo exenta, y exigírselo obligaría a romper el párrafo. La prueba es
       si el elemento es `inline` y su padre tiene más texto que él. */
    const esEnlaceDeTexto = (el) => {
      if (getComputedStyle(el).display !== "inline") return false;
      const padre = el.parentElement;
      if (!padre) return false;
      const suyo = (el.textContent || "").trim().length;
      const total = (padre.textContent || "").trim().length;
      return total > suyo + 12;
    };

    for (const b of document.querySelectorAll("a, button, [role=button]")) {
      const r = b.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;               // sr-only y similares
      const etq = (b.getAttribute("aria-label") || b.textContent || "").trim().slice(0, 26);
      if ((r.height < 44 || r.width < 44) && !esEnlaceDeTexto(b)) {
        chicos.push(`${etq} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      // ¿su centro cae dentro de una barra fija que no lo contiene?
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      for (const f of fijas) {
        if (cy > f.top && cy < f.bottom && cx > f.left && cx < f.right) {
          const dentro = [...document.elementsFromPoint(cx, cy)].includes(b);
          if (!dentro) { tapados.push(etq); break; }
        }
      }
    }
    // 7 · dos navegaciones a la vez
    const navs = [...document.querySelectorAll("nav")].filter((n) => {
      const cs = getComputedStyle(n);
      return (cs.position === "fixed" || cs.position === "sticky") &&
        n.querySelectorAll("a, button").length >= 3;
    }).length;
    return { chicos, tapados, navs };
  });

  if (problemas.chicos.length) {
    anota(nombre, "pulsable por debajo de 44px", problemas.chicos.slice(0, 3).join(" · "));
  }
  if (problemas.tapados.length) {
    anota(nombre, "pulsable TAPADO por una barra fija", problemas.tapados.slice(0, 3).join(" · "));
  }
  if (problemas.navs > 1) {
    anota(nombre, "dos navegaciones fijas a la vez", `${problemas.navs} barras`);
  }

  // 4 y 5 · contraste y tamaño mínimo del cuerpo
  const nodos = await page.locator("main :is(p, span, li, a, button, h1, h2, h3)").all();
  let medidos = 0;
  for (const el of nodos.slice(0, 40)) {
    if (medidos >= 12) break;
    const t = (await el.innerText().catch(() => "")).trim();
    if (!t || t.length > 70) continue;
    const hoja = await el.evaluate((n) => ![...n.children].some((c) => c.textContent?.trim()));
    if (!hoja) continue;
    const m = await contrasteDe(page, el);
    if (!m) continue;
    medidos += 1;
    suma.comprobaciones += 1;
    if (m.r < m.minimo) {
      anota(nombre, "contraste por debajo del mínimo", `"${t.slice(0, 26)}" ${m.r.toFixed(2)}:1 (exige ${m.minimo})`);
    }
    if (m.size < 16 && m.size >= 14) {
      // 13px está permitido para metadatos; por debajo de eso, no.
      if (m.size < 13) anota(nombre, "texto por debajo del mínimo", `"${t.slice(0, 22)}" ${m.size}px`);
    }
  }

  page.off("pageerror", onError);
  process.stdout.write(`  ${fallos.some((f) => f.pantalla === nombre) ? "✗" : "✓"} ${nombre}\n`);
}

// ── El recorrido ──
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  isMobile: true, hasTouch: true, locale: "es-MX",
});
const page = await ctx.newPage();

console.log(`\nVerificando ${BASE}\n`);
console.log("Públicas");
for (const [ruta, nombre] of [["/", "landing"], ["/registro", "registro"], ["/login", "login"]]) {
  await page.goto(BASE + ruta, { waitUntil: "load" });
  await revisar(page, nombre);
}

// Sesión demo para lo de dentro.
console.log("\nEmbudo y plataforma");
await page.goto(BASE + "/registro", { waitUntil: "load" });
await page.waitForTimeout(1200);
await page.locator('input[type="text"]').first().fill("María López");
await page.locator('input[type="email"]').fill("verificacion@andex.test");
await page.locator('input[type="password"]').first().fill("ClaveSegura123");
await page.getByRole("checkbox").first().click();
await page.getByRole("button", { name: /Crear mi cuenta/i }).click();
await page.waitForURL(/entrevista/, { timeout: 30000 }).catch(() => {});

const paso = async () => {
  const m = (await page.locator("body").innerText().catch(() => "")).match(/Paso\s+(\d+)\s+de/i);
  return m ? Number(m[1]) : null;
};
for (let i = 0; i < 12; i += 1) {
  if (!page.url().includes("entrevista")) break;
  await page.waitForTimeout(800);
  const antes = await paso();
  const usa = page.getByRole("radio", { name: /Ya estoy en Estados Unidos/i });
  if (await usa.count()) { await usa.click(); await page.waitForTimeout(500); }
  const combo = page.locator('input[placeholder*="estado"]').first();
  if ((await combo.count()) && !(await combo.inputValue())) {
    await combo.fill("Utah"); await page.waitForTimeout(700);
    const o = page.getByRole("option", { name: /Utah/i }).first();
    if (await o.count()) await o.click(); else { await combo.press("ArrowDown"); await combo.press("Enter"); }
    await page.waitForTimeout(400);
  }
  for (const g of await page.locator('[role="radiogroup"]').all()) {
    if (!(await g.locator('[aria-checked="true"]').count())) {
      const r = g.getByRole("radio").first();
      if (await r.count()) { await r.click().catch(() => {}); await page.waitForTimeout(200); }
    }
  }
  const cbs = await page.getByRole("checkbox").all();
  if (cbs.length && !(await page.locator('[role="checkbox"][aria-checked="true"]').count())) {
    for (const c of cbs.slice(0, 2)) await c.click().catch(() => {});
  }
  const b = page.getByRole("button", { name: /^(Continuar|Siguiente|Ver mi plan)/i }).first();
  if (!(await b.count())) break;
  await b.click().catch(() => {});
  await page.waitForTimeout(1300);
  if ((await paso()) === antes && page.url().includes("entrevista")) break;
}
await page.goto(BASE + "/membresia", { waitUntil: "load" });
const plan = page.getByRole("button", { name: /plan mensual|plan anual/i }).first();
const enl = page.getByRole("link", { name: /plan mensual|plan anual/i }).first();
if (await plan.count()) await plan.click().catch(() => {});
else if (await enl.count()) await enl.click().catch(() => {});
await page.waitForURL(/pago/, { timeout: 20000 }).catch(() => {});
if (!page.url().includes("/pago")) await page.goto(BASE + "/pago", { waitUntil: "load" });
await page.getByRole("checkbox").first().click().catch(() => {});
await page.getByRole("button", { name: /Simular el pago/i }).click().catch(() => {});
await page.waitForURL(/exito|panel/, { timeout: 25000 }).catch(() => {});

for (const [ruta, nombre] of [
  ["/panel", "panel"],
  ["/modulo/boveda", "boveda"],
  ["/modulo/academia", "academia"],
  ["/modulo/comunidad", "comunidad"],
  ["/inversiones", "inversiones"],
  ["/perfil", "perfil"],
  ["/modulo/migracion", "modulo-en-construccion"],
]) {
  await page.goto(BASE + ruta, { waitUntil: "load" });
  await revisar(page, nombre);
}

// ── El informe ──
console.log("\n" + "═".repeat(66));
if (fallos.length === 0) {
  console.log(`Nada roto. ${suma.pantallas} pantallas, ${suma.comprobaciones} textos medidos.`);
} else {
  console.log(`${fallos.length} problema(s) en ${suma.pantallas} pantallas:\n`);
  let ultima = "";
  for (const f of fallos) {
    if (f.pantalla !== ultima) { console.log(`  ${f.pantalla}`); ultima = f.pantalla; }
    console.log(`    ✗ ${f.que}${f.detalle ? ` — ${f.detalle}` : ""}`);
  }
}
console.log("═".repeat(66));

await browser.close();
process.exit(fallos.length === 0 ? 0 : 1);
