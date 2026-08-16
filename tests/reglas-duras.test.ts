/**
 * Verificación automática de las reglas que el PRD declara NO NEGOCIABLES.
 *
 * No sustituye a la revisión humana: cubre lo que una expresión regular
 * puede afirmar con certeza. Lo que no se puede automatizar (jerarquía
 * visual, calidad del copy, si el grid cambia de verdad entre dos perfiles)
 * se verifica a mano y queda en el reporte de QA.
 *
 * §9 pide explícitamente que el contraste se verifique automáticamente en CI;
 * esto es la base de ese trabajo.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { ROUTES } from "@/lib/config";
import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics/event-names";

const ROOT = join(__dirname, "..");
const SCAN_DIRS = ["app", "components", "lib"];
const CODE_EXT = /\.(ts|tsx)$/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const CODE_FILES = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d))).filter((f) =>
  CODE_EXT.test(f),
);

function read(file: string): string {
  return readFileSync(file, "utf8");
}

function rel(file: string): string {
  return relative(ROOT, file).split(sep).join("/");
}

/** Quita comentarios de línea y de bloque: documentar una regla no la viola. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("Anexo B — la palabra 'notario' está prohibida en el copy", () => {
  // "En EE. UU. un notary public no es un abogado, y usar el término en
  // español está expresamente restringido por las leyes estatales de
  // consultoría migratoria." Esto es riesgo legal, no preferencia de estilo.
  it("no aparece en ningún archivo de código", () => {
    const offenders = CODE_FILES.filter((f) =>
      /notar[ií]/i.test(stripComments(read(f))),
    ).map(rel);
    expect(offenders).toEqual([]);
  });
});

describe("§2.1 — los colores solo se definen en globals.css", () => {
  // El PRD fija una paleta con una matriz de contraste verificada (§2.1.1).
  // Un hex suelto en un componente elude esa matriz sin dejar rastro.
  it("ningún componente ni página declara un color hex", () => {
    const HEX = /#[0-9a-fA-F]{3,8}\b/;
    const offenders: string[] = [];

    for (const file of CODE_FILES) {
      const path = rel(file);
      // El catálogo de módulos replica el seed SQL de §7.4 (accent_color),
      // y el showcase de diseño imprime la matriz de contraste como texto.
      if (path === "lib/catalogs/modules.ts") continue;
      if (path === "app/design/page.tsx") continue;
      // `themeColor` pinta la barra del navegador: es un valor de <meta> que
      // el navegador lee ANTES del CSS, así que no admite una variable.
      // Es la única excepción real; si la paleta cambia, hay que tocarlo.
      if (path === "app/layout.tsx") continue;

      const code = stripComments(read(file));
      for (const line of code.split("\n")) {
        if (HEX.test(line)) offenders.push(`${path}: ${line.trim()}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  // Esta regla decía "solo en globals.css" pero únicamente miraba .ts/.tsx.
  // Al portar el sistema de diseño aparecieron cuatro hex en `app/kit.css`
  // que la elidían igual de bien que uno en un componente: un color fuera
  // de globals.css no lo ve la matriz de contraste, esté en TSX o en CSS.
  it("ningún otro archivo CSS declara un color hex", () => {
    const HEX = /#[0-9a-fA-F]{3,8}\b/;
    const offenders: string[] = [];

    const cssFiles = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)))
      .filter((f) => f.endsWith(".css"))
      .filter((f) => rel(f) !== "app/globals.css");

    for (const file of cssFiles) {
      const code = stripComments(read(file));
      for (const line of code.split("\n")) {
        if (HEX.test(line)) offenders.push(`${rel(file)}: ${line.trim()}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("§2.1.1 — el teal y el ámbar puros nunca llevan texto encima", () => {
  // Blanco sobre #12B8A6 da 2.49:1 y sobre #F4B942 da 1.77:1. Ambos
  // reprueban AA. La regla de oro del PRD: son colores de superficie.
  it("no se combina bg-teal o bg-amber con texto claro", () => {
    const offenders: string[] = [];

    for (const file of CODE_FILES) {
      const path = rel(file);
      if (path === "app/design/page.tsx") continue;

      for (const line of stripComments(read(file)).split("\n")) {
        // Solo el token PURO. `bg-teal-deep` (5.47:1 con blanco) y los
        // tonos `-soft` sí admiten texto: son los que la matriz aprueba.
        const hasRawSurface = /\bbg-(teal|amber)(?!-)\b/.test(line);
        const hasLightText = /\btext-(white|on-accent)\b/.test(line);
        if (hasRawSurface && hasLightText) {
          offenders.push(`${path}: ${line.trim()}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("§9 — el texto nunca baja de 16px", () => {
  // La audiencia usa dispositivos de gama baja, con frecuencia bajo luz
  // solar directa (§2.2.1). `text-caption` (13px) existe solo para
  // metadatos; las utilidades de Tailwind por debajo del token no existen.
  it("no se usan tamaños de texto fuera de la escala del PRD", () => {
    const ALLOWED = new Set([
      "text-display",
      "text-display-lg",
      "text-h1",
      "text-h2",
      "text-h3",
      "text-body-lg",
      "text-body",
      "text-label",
      "text-caption",
    ]);
    const SIZE_LIKE = /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)\b/;
    const offenders: string[] = [];

    for (const file of CODE_FILES) {
      for (const line of stripComments(read(file)).split("\n")) {
        const match = line.match(SIZE_LIKE);
        if (match && !ALLOWED.has(match[0])) {
          offenders.push(`${rel(file)}: ${match[0]}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("§2.9 — el sello se usa una sola vez en todo el producto", () => {
  // "Si aparece en badges, en confirmaciones o en el dashboard, pierde su
  // significado." Su única aparición legítima es el plan anual del paywall.
  it("solo lo importa el paywall", () => {
    const importers = CODE_FILES.filter((f) =>
      /from\s+["']@\/components\/seal["']/.test(read(f)),
    )
      .map(rel)
      .filter((p) => p !== "app/design/page.tsx");

    expect(importers.length).toBeLessThanOrEqual(1);
    for (const path of importers) {
      expect(path).toMatch(/membresia|paywall/);
    }
  });
});

describe("§2.8 — La Ruta aparece una sola vez por pantalla", () => {
  it("ningún archivo monta <RouteBar> más de una vez", () => {
    const offenders: string[] = [];

    for (const file of CODE_FILES) {
      const path = rel(file);
      if (path === "app/design/page.tsx") continue; // showcase: excepción documentada
      if (path === "components/route-bar.tsx") continue; // su definición

      const uses = stripComments(read(file)).match(/<RouteBar\b/g);
      if (uses && uses.length > 1) {
        offenders.push(`${path}: ${uses.length} apariciones`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("§9 — ANDEX nunca toca datos de tarjeta", () => {
  it("no hay campos propios de número de tarjeta ni CVC", () => {
    // Todo pasa por Stripe Elements. Un <input> propio para la tarjeta
    // metería a ANDEX en el alcance de PCI DSS.
    //
    // Se buscan CAMPOS, no palabras: el diccionario sí necesita etiquetas
    // ("CVC", "Número de tarjeta") porque los campos de Stripe se rotulan
    // en español — rotular el campo ajeno no es recogerlo.
    const SUSPECT =
      /<input[^>]*\b(name|id|autoComplete)\s*=\s*["'`](cc-number|cc-csc|cardNumber|card_number|cvc|cvv)/i;
    const offenders = CODE_FILES.filter((f) =>
      SUSPECT.test(stripComments(read(f))),
    ).map(rel);

    expect(offenders).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// AÑADIDO POR QA — reglas del PRD que eran automatizables y no lo estaban.
// ═══════════════════════════════════════════════════════════════════════

// ── §2.1.1 · Matriz de contraste, verificada de verdad ───────────────
//
// §9 pide "contraste AA en todas las pantallas, verificado automáticamente" y
// el Sprint 1 pide "la matriz de contraste de §2.1.1 verificada automáticamente
// en CI". Hasta aquí solo se comprobaba que nadie escribiera un hex suelto y
// que nadie pusiera texto claro sobre teal/ámbar puros — dos reglas necesarias,
// pero ninguna de las dos MIDE nada.
//
// Esto sí mide: lee los tokens reales de `app/globals.css`, resuelve los
// `var(--x)`, calcula el ratio WCAG 2.1 y exige AA (4.5:1) en los dos temas.
// Si alguien retoca un token de la paleta y rompe el contraste, esto falla.

const GLOBALS_CSS = readFileSync(join(ROOT, "app", "globals.css"), "utf8");

/** Contenido del primer bloque `<selector> { … }` que aparezca. */
function cssBlock(selector: string): string {
  const start = GLOBALS_CSS.indexOf(selector);
  if (start === -1) throw new Error(`No se encontró el bloque CSS ${selector}`);
  const open = GLOBALS_CSS.indexOf("{", start);
  const close = GLOBALS_CSS.indexOf("\n}", open);
  return GLOBALS_CSS.slice(open + 1, close);
}

function parseTokens(block: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const match of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

/** Resuelve `var(--x)` hasta llegar a un valor literal. */
function resolve(tokens: Map<string, string>, name: string, depth = 0): string {
  const raw = tokens.get(name);
  if (raw === undefined) throw new Error(`Token ${name} no definido`);
  const varRef = raw.match(/^var\((--[\w-]+)\)$/);
  if (varRef && depth < 8) return resolve(tokens, varRef[1], depth + 1);
  return raw;
}

function toRgb(hex: string): [number, number, number] {
  const value = hex.trim().replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Luminancia relativa WCAG 2.1 (fórmula literal de la norma). */
function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

const AA = 4.5;

/** Pares (texto, fondo) que el producto usa de verdad, por nombre de token. */
const TEXT_ON_SURFACE: ReadonlyArray<readonly [string, string]> = [
  // Texto principal y secundario sobre las tres superficies de la app.
  ["--text", "--surface"],
  ["--text", "--bg"],
  ["--text", "--surface-alt"],
  ["--text-muted", "--surface"],
  ["--text-muted", "--bg"],
  ["--text-muted", "--surface-alt"],
  // Texto sobre acentos (botón primario y badge ámbar).
  ["--on-accent", "--teal-deep"],
  ["--on-highlight", "--amber"],
  // Colores semánticos: siempre sobre superficie de tarjeta.
  ["--amber-deep", "--surface"],
  ["--success", "--surface"],
  ["--danger", "--surface"],
  ["--info", "--surface"],
  ["--warning", "--surface"],
];

const LIGHT_TOKENS = parseTokens(cssBlock(":root {"));
const DARK_TOKENS = new Map([
  ...LIGHT_TOKENS,
  ...parseTokens(cssBlock('[data-theme="dark"]')),
]);

describe("§2.1.1 — matriz de contraste verificada automáticamente", () => {
  it("la tabla del PRD se reproduce con la fórmula WCAG", () => {
    // Valida a la vez la función y los números que el documento afirma.
    // Los ❌ del PRD se comprueban como ❌: si alguien "arreglara" uno de esos
    // colores sin tocar el documento, esto lo delataría.
    expect(contrast("#102A43", "#FFFFFF")).toBeCloseTo(14.6, 0);
    expect(contrast("#102A43", "#F7F5EF")).toBeCloseTo(13.7, 0);
    expect(contrast("#52708C", "#FFFFFF")).toBeCloseTo(5.18, 1);
    expect(contrast("#627D98", "#FFFFFF")).toBeLessThan(AA); // ❌ prohibido
    expect(contrast("#FFFFFF", "#0F766E")).toBeCloseTo(5.47, 1);
    expect(contrast("#FFFFFF", "#12B8A6")).toBeLessThan(AA); // ❌ nunca
    expect(contrast("#102A43", "#12B8A6")).toBeCloseTo(5.88, 1);
    expect(contrast("#F4B942", "#FFFFFF")).toBeLessThan(AA); // ❌ nunca
    // El PRD dice 8.2:1; la fórmula da 8.27:1. Es un redondeo del documento,
    // no una discrepancia de paleta: por eso aquí la tolerancia es de ±0.5.
    expect(contrast("#102A43", "#F4B942")).toBeCloseTo(8.2, 0);
    expect(contrast("#9A6B00", "#FFFFFF")).toBeCloseTo(4.69, 1);
  });

  it("modo CLARO: todos los pares en uso cumplen AA", () => {
    const failures: string[] = [];
    for (const [fg, bg] of TEXT_ON_SURFACE) {
      const ratio = contrast(resolve(LIGHT_TOKENS, fg), resolve(LIGHT_TOKENS, bg));
      if (ratio < AA) failures.push(`${fg} sobre ${bg}: ${ratio.toFixed(2)}:1`);
    }
    expect(failures).toEqual([]);
  });

  it("modo OSCURO: todos los pares en uso cumplen AA", () => {
    const failures: string[] = [];
    for (const [fg, bg] of TEXT_ON_SURFACE) {
      const ratio = contrast(resolve(DARK_TOKENS, fg), resolve(DARK_TOKENS, bg));
      if (ratio < AA) failures.push(`${fg} sobre ${bg}: ${ratio.toFixed(2)}:1`);
    }
    expect(failures).toEqual([]);
  });

  it("el ámbar de alerta se lee sobre las TRES superficies", () => {
    // ── Esta prueba cambió de sentido, y merece explicarse ──
    //
    // Antes decía lo contrario: que `--amber-deep` NO podía ir sobre el
    // fondo crema. Era cierto con el ámbar viejo (#9A6B00), que daba 4.69:1
    // sobre blanco pero sólo 4.30:1 sobre crema, y ahí reprobaba AA. De ahí
    // salió la restricción de usarlo sólo en tarjetas y avisos.
    //
    // El sistema de diseño nuevo lo oscurece a #8A5A00 y con eso pasa a
    // 5.44:1 sobre crema: la restricción dejó de tener motivo. Así que la
    // prueba deja de prohibir y pasa a VERIFICAR — que es lo que debe hacer
    // cuando el hecho que la justificaba cambia.
    //
    // Se comprueban las tres superficies para que, si alguien aclara el
    // ámbar en el futuro, el fallo salte aquí y no en el teléfono de nadie.
    const superficies = ["--surface", "--bg", "--surface-alt"] as const;
    const flojos: string[] = [];
    for (const bg of superficies) {
      const r = contrast(resolve(LIGHT_TOKENS, "--amber-deep"), resolve(LIGHT_TOKENS, bg));
      if (r < AA) flojos.push(`--amber-deep sobre ${bg}: ${r.toFixed(2)}:1`);
    }
    expect(flojos).toEqual([]);
  });
});

// ── §7.5 · Ningún evento declarado se queda sin emitir ───────────────

describe("§7.5 — todos los eventos declarados se emiten en alguna parte", () => {
  // Un nombre de evento que existe en el tipo pero que ningún componente
  // dispara es un agujero silencioso: el tablero muestra la métrica en cero y
  // parece un problema de producto, no de instrumentación. Así se cazó
  // `landing_section_viewed` (decisión D24), que estaba declarado y no se
  // emitía en ninguna pantalla.
  it("cada nombre de AnalyticsEventName aparece en al menos un emisor", () => {
    const EMITTER_EXCLUDES = new Set([
      "lib/types.ts", // la declaración del tipo
      "lib/analytics/event-names.ts", // la lista en tiempo de ejecución
      "lib/analytics/track.ts", // el transporte
    ]);

    const sources = CODE_FILES.filter((f) => !EMITTER_EXCLUDES.has(rel(f))).map(read);

    const missing = ANALYTICS_EVENT_NAMES.filter(
      (name) => !sources.some((source) => source.includes(`"${name}"`)),
    );

    expect(missing).toEqual([]);
  });
});

// ── §3 y §7 · Ningún enlace apunta al vacío ──────────────────────────

describe("§3 — el mapa de rutas corresponde a páginas que existen", () => {
  /** Rutas declaradas en ROUTES que TODAVÍA no tienen página. */
  const PENDIENTES: ReadonlySet<string> = new Set<string>([
    // docs/DECISIONES.md D26: las rutas existen para que el footer y el
    // checkout puedan enlazarlas (§3.4.6 exige divulgar los términos antes del
    // cobro); el CONTENIDO es redacción legal y está fuera del alcance de v1.
    // ⚠️ Sin estas tres páginas escritas no se puede cobrar.
    ROUTES.terminos,
    ROUTES.privacidad,
    ROUTES.contacto,
  ]);

  /** Rutas reales derivadas del árbol de `app/`, sin los grupos `(x)`. */
  function routesFromFileSystem(): Set<string> {
    const pages = walk(join(ROOT, "app")).filter((f) => /[\\/]page\.tsx$/.test(f));
    return new Set(
      pages.map((file) => {
        const segments = rel(file)
          .replace(/^app\//, "")
          .replace(/page\.tsx$/, "")
          .split("/")
          // Los grupos `(auth)` / `(panel)` organizan archivos, no URL.
          .filter((s) => s.length > 0 && !s.startsWith("("));
        return `/${segments.join("/")}`;
      }),
    );
  }

  const REAL_ROUTES = routesFromFileSystem();

  it("cada ruta estática de ROUTES tiene su page.tsx (o está en pendientes)", () => {
    // `ROUTES.modulo` es una función (ruta dinámica): se comprueba aparte.
    const broken = Object.values(ROUTES)
      .flatMap((value) => (typeof value === "string" ? [value] : []))
      .filter((route) => !REAL_ROUTES.has(route) && !PENDIENTES.has(route));

    expect(broken).toEqual([]);
  });

  it("la ruta dinámica de módulo existe", () => {
    expect(REAL_ROUTES.has("/modulo/[slug]")).toBe(true);
  });

  it("las rutas legales pendientes siguen siendo exactamente tres", () => {
    // Si alguien escribe una de las tres páginas, este test avisa para que se
    // saque de la lista de pendientes y deje de ser un 404 tolerado.
    const stillMissing = [...PENDIENTES].filter((route) => !REAL_ROUTES.has(route));
    expect(stillMissing).toEqual([
      ROUTES.terminos,
      ROUTES.privacidad,
      ROUTES.contacto,
    ]);
  });
});

// ── Higiene: nada de depuración olvidada ─────────────────────────────

describe("higiene — sin restos de depuración en el código de producto", () => {
  it("no hay console.log ni debugger", () => {
    // `console.warn` y `console.error` sí se permiten: son avisos deliberados
    // de servidor (webhook sin user_id, consentimiento que no se pudo grabar).
    // `console.log` no aporta nada en producción y suele ser un olvido.
    const offenders: string[] = [];
    for (const file of CODE_FILES) {
      for (const line of stripComments(read(file)).split("\n")) {
        if (/\bconsole\.log\s*\(/.test(line) || /^\s*debugger\s*;/.test(line)) {
          offenders.push(`${rel(file)}: ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

// ── Brief §4.8 · El copy visible SIEMPRE sale de lib/i18n ────────────

describe("brief §4.8 — ningún texto visible se escribe en el JSX", () => {
  // El producto es bilingüe por cookie (D6): una cadena escrita a mano en un
  // componente se queda en español para siempre y el toggle EN deja de decir
  // la verdad. `/design` es el showcase interno y está exento por definición.
  const EXENTOS = new Set(["app/design/page.tsx"]);

  /**
   * El panel de administración va en español directo, sin pasar por i18n.
   *
   * La regla existe para el copy que lee LA COMUNIDAD: una cadena escrita a
   * mano se queda en español para siempre y el toggle EN deja de decir la
   * verdad. El panel no lo ve ningún usuario — lo usa el equipo, cuyo idioma
   * de trabajo es el español— así que traducir cada etiqueta interna a dos
   * idiomas es trabajo que no le sirve a nadie.
   *
   * ⚠️ ESTA EXENCIÓN CADUCA. `0006_roles.sql` ya contempla un rol `partner`
   * —un empleador publicando sus propias vacantes—. El día que alguien de
   * fuera del equipo entre al panel, deja de ser interno y este bloque tiene
   * que desaparecer, con su copy movido a i18n.
   */
  const esPanelInterno = (path: string): boolean =>
    path.startsWith("app/admin/") || path.startsWith("components/admin/");

  it("los atributos visibles no llevan cadenas literales", () => {
    const ATTR =
      /\b(aria-label|aria-description|placeholder|alt|title|label|loadingLabel)="[^"]{2,}"/;
    const offenders: string[] = [];

    for (const file of CODE_FILES) {
      const path = rel(file);
      if (!path.endsWith(".tsx") || EXENTOS.has(path) || esPanelInterno(path)) continue;
      for (const line of stripComments(read(file)).split("\n")) {
        const match = line.match(ATTR);
        if (match) offenders.push(`${path}: ${match[0]}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("no hay nodos de texto en español dentro del JSX", () => {
    // Heurística por acentos y signos de apertura: es lo que delata sin falsos
    // positivos una frase en español incrustada entre etiquetas.
    const SPANISH_TEXT_NODE = />[^<>{}]*[áéíóúüñ¿¡][^<>{}]*</i;
    const offenders: string[] = [];

    for (const file of CODE_FILES) {
      const path = rel(file);
      if (!path.endsWith(".tsx") || EXENTOS.has(path) || esPanelInterno(path)) continue;
      for (const line of stripComments(read(file)).split("\n")) {
        if (SPANISH_TEXT_NODE.test(line)) offenders.push(`${path}: ${line.trim()}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

// ── §9 · Accesibilidad de imágenes ───────────────────────────────────

describe("§9 — toda imagen lleva alternativa textual", () => {
  it("ningún <img> se queda sin alt", () => {
    // Hoy la app no usa ni una sola imagen (el único gráfico es SVG inline).
    // El test existe para que la primera que entre nazca con `alt`.
    const offenders: string[] = [];
    for (const file of CODE_FILES) {
      const code = stripComments(read(file));
      for (const tag of code.match(/<img\b[^>]*>/g) ?? []) {
        if (!/\balt\s*=/.test(tag)) offenders.push(`${rel(file)}: ${tag}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
