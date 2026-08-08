/**
 * Recorrido guiado de la landing en un navegador visible.
 *
 * Abre la página, deja que la secuencia de carga del hero termine y baja
 * despacio sección por sección para que se vean las animaciones de entrada,
 * el reordenamiento de los módulos al elegir rama y el acordeón.
 *
 * Uso:  node tests/ver-landing.mjs [url]
 * La ventana queda abierta al final para poder trastear a mano; se cierra
 * con Ctrl+C en la terminal.
 */

import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://localhost:3800";

const PARADAS = [
  ["hero", "Hero — el titular se revela por líneas y el teléfono rota"],
  ["confianza", "Cinta de confianza — portales oficiales y alianzas"],
  ["comparativa", "Problema vs solución — el dolor entra antes que el alivio"],
  ["modulos", "Los 7 módulos — el primero ocupa fila entera"],
  ["servicios", "Servicios directos — banda navy con parallax"],
  ["comunidad", "Misión y visión — se revela palabra a palabra"],
  ["precios", "Precios — anual destacado, mensual a un clic"],
  ["faq", "Preguntas frecuentes — acordeón accesible"],
  ["cierre", "Cierre — el trazo se completa con el scroll"],
];

const browser = await chromium.launch({
  headless: false,
  args: ["--start-maximized"],
});
const page = await (await browser.newContext({ viewport: null, locale: "es-MX" })).newPage();

console.log("\nAbriendo la landing…\n");
await page.goto(BASE, { waitUntil: "domcontentloaded" });

// Deja terminar la secuencia de carga del hero antes de tocar nada.
await page.waitForTimeout(4000);

for (const [id, titulo] of PARADAS) {
  console.log(`▼ ${titulo}`);
  await page.evaluate((sec) => {
    document.getElementById(sec)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, id);
  await page.waitForTimeout(3200);

  // En módulos, enseña lo que de verdad vende el producto: el reordenamiento.
  if (id === "modulos") {
    console.log("    · eligiendo «Estoy fuera de EE. UU.» para ver el reordenamiento");
    await page.goto(`${BASE}/?ctx=pre_arrival#modulos`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);
    await page.evaluate(() =>
      document.getElementById("modulos")?.scrollIntoView({ block: "start" }),
    );
    await page.waitForTimeout(3000);
  }

  // En el FAQ, abre una pregunta distinta para ver el acordeón.
  if (id === "faq") {
    const botones = page.locator("#faq button[aria-expanded]");
    if ((await botones.count()) > 1) {
      await botones.nth(1).click();
      await page.waitForTimeout(2200);
    }
  }
}

console.log("\n─────────────────────────────────────────────");
console.log("La ventana queda abierta para que la recorras tú.");
console.log("Prueba: el modo oscuro (icono del sol), ES│EN,");
console.log("y encoger la ventana para ver el menú de móvil.");
console.log("Corta con Ctrl+C cuando termines.");
console.log("─────────────────────────────────────────────\n");

// Mantener viva la ventana.
await new Promise(() => {});
