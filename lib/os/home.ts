/**
 * EL INICIO — su estado, y las reglas que lo mantienen coherente.
 *
 * Todo aquí son funciones puras sobre un objeto. Ni React, ni
 * `localStorage`, ni DOM: la persistencia y el pintado son de otro. Así se
 * puede probar lo único que de verdad se puede romper —que una app
 * desaparezca, que se duplique, que quede una página fantasma— sin montar
 * un navegador.
 *
 * ── Las dos invariantes ──
 *
 *  1. **Una app vive en UNA sola casilla.** Si estuviera en dos, quitarla
 *     de una la dejaría en la otra y el usuario vería un fantasma. Los
 *     widgets sí se repiten: son vistas, no la app.
 *  2. **Una página existe mientras tenga algo.** Sin apps y sin widgets,
 *     se va. Pero nunca se borra la última: una pantalla de inicio sin
 *     páginas no es un estado válido, es un producto roto.
 */

import { OS_APPS, SLOTS_POR_PAGINA, isAppSlug, type AppSlug } from "./apps";

export type WidgetSize = "pequeno" | "mediano" | "grande";

export type HomeWidget = {
  id: string;
  app: AppSlug;
  size: WidgetSize;
};

export type HomePage = {
  widgets: HomeWidget[];
  /** Exactamente `SLOTS_POR_PAGINA`; `null` es un hueco. */
  apps: (AppSlug | null)[];
};

export type HomeLayout = {
  v: 2;
  pages: HomePage[];
};

export const CLAVE_INICIO = "andex_home_v2";
/** La clave vieja: una sola rejilla plana, sin páginas ni widgets. */
export const CLAVE_ANTERIOR = "andex_home_grid";

const TAMANOS: WidgetSize[] = ["pequeno", "mediano", "grande"];

function paginaVacia(): HomePage {
  return { widgets: [], apps: Array<AppSlug | null>(SLOTS_POR_PAGINA).fill(null) };
}

/**
 * El inicio de fábrica.
 *
 * Los dos widgets no son decoración: son la idea central de esta pantalla.
 * Bóveda en grande dice CUÁNTOS documentos hay y cuál vence; Inglés en
 * pequeño dice cuándo es la próxima clase. Se abre la aplicación y ya se
 * sabe el estado, sin entrar en ningún sitio.
 */
export function layoutInicial(): HomeLayout {
  const pagina = paginaVacia();
  const deFabrica = OS_APPS.filter((a) => a.defaultHome).map((a) => a.slug);
  for (let i = 0; i < Math.min(deFabrica.length, SLOTS_POR_PAGINA); i += 1) {
    pagina.apps[i] = deFabrica[i];
  }
  pagina.widgets = [
    { id: "w-boveda", app: "boveda", size: "grande" },
    { id: "w-ingles", app: "ingles", size: "pequeno" },
  ];
  return { v: 2, pages: [pagina] };
}

/** Todas las apps colocadas, en orden de página y casilla. */
export function appsColocadas(layout: HomeLayout): AppSlug[] {
  return layout.pages.flatMap((p) => p.apps.filter((s): s is AppSlug => s !== null));
}

/** Las que existen pero no están en ninguna página: el catálogo de la Store. */
export function appsQuitadas(layout: HomeLayout): AppSlug[] {
  const puestas = new Set(appsColocadas(layout));
  return OS_APPS.map((a) => a.slug).filter((s) => !puestas.has(s));
}

/**
 * Lee lo guardado sin fiarse de nada.
 *
 * `localStorage` es texto que cualquiera puede editar, y una versión vieja
 * del producto pudo escribir otra forma. Si algo no cuadra, se devuelve el
 * inicio de fábrica: perder la disposición es molesto, arrancar en una
 * pantalla rota es peor.
 */
export function parseLayout(raw: unknown): HomeLayout {
  if (typeof raw === "string") {
    try { return parseLayout(JSON.parse(raw) as unknown); } catch { return layoutInicial(); }
  }
  if (!raw || typeof raw !== "object") return layoutInicial();

  const objeto = raw as Record<string, unknown>;

  // ── Migración de la clave vieja ──
  // v1 era una rejilla plana sin páginas. Se envuelve en una página y se
  // le ponen los widgets de fábrica: quien venía de ahí nunca los tuvo.
  if (!("pages" in objeto) && Array.isArray(objeto.apps)) {
    const pagina = paginaVacia();
    const planas = objeto.apps.filter(isAppSlug).slice(0, SLOTS_POR_PAGINA);
    planas.forEach((s, i) => { pagina.apps[i] = s; });
    pagina.widgets = layoutInicial().pages[0].widgets;
    return normalizar({ v: 2, pages: [pagina] });
  }

  if (!Array.isArray(objeto.pages)) return layoutInicial();

  const pages: HomePage[] = [];
  for (const cruda of objeto.pages) {
    if (!cruda || typeof cruda !== "object") continue;
    const p = cruda as Record<string, unknown>;
    const pagina = paginaVacia();

    if (Array.isArray(p.apps)) {
      for (let i = 0; i < Math.min(p.apps.length, SLOTS_POR_PAGINA); i += 1) {
        const s = p.apps[i];
        pagina.apps[i] = isAppSlug(s) ? s : null;
      }
    }
    if (Array.isArray(p.widgets)) {
      for (const w of p.widgets) {
        if (!w || typeof w !== "object") continue;
        const ww = w as Record<string, unknown>;
        if (!isAppSlug(ww.app)) continue;
        const size = TAMANOS.includes(ww.size as WidgetSize) ? (ww.size as WidgetSize) : "mediano";
        const id = typeof ww.id === "string" && ww.id ? ww.id : `w-${String(ww.app)}-${pagina.widgets.length}`;
        pagina.widgets.push({ id, app: ww.app, size });
      }
    }
    pages.push(pagina);
  }

  if (pages.length === 0) return layoutInicial();
  return normalizar({ v: 2, pages });
}

/**
 * Repara lo que haga falta: duplicados fuera, páginas vacías fuera,
 * ids de widget únicos, y nunca menos de una página.
 */
export function normalizar(layout: HomeLayout): HomeLayout {
  const vistas = new Set<AppSlug>();
  const ids = new Set<string>();
  let contador = 0;

  const pages = layout.pages.map((p) => {
    const apps = p.apps.slice(0, SLOTS_POR_PAGINA).map((s) => {
      if (s === null) return null;
      // Invariante 1: la segunda aparición se descarta, no se mueve. Mover
      // la haría saltar de sitio sin que nadie lo pidiera.
      if (vistas.has(s)) return null;
      vistas.add(s);
      return s;
    });
    while (apps.length < SLOTS_POR_PAGINA) apps.push(null);

    const widgets = p.widgets.map((w) => {
      let id = w.id;
      while (ids.has(id)) { contador += 1; id = `${w.id}-${contador}`; }
      ids.add(id);
      return { ...w, id };
    });

    return { widgets, apps };
  });

  // Invariante 2: fuera las vacías, pero siempre queda una.
  const conAlgo = pages.filter((p) => p.widgets.length > 0 || p.apps.some((s) => s !== null));
  return { v: 2, pages: conAlgo.length > 0 ? conAlgo : [paginaVacia()] };
}

/** Coloca una app en el primer hueco libre; abre página si no cabe. */
export function anadirApp(layout: HomeLayout, slug: AppSlug): HomeLayout {
  if (appsColocadas(layout).includes(slug)) return layout;

  const pages = layout.pages.map((p) => ({ ...p, apps: [...p.apps] }));
  for (const p of pages) {
    const hueco = p.apps.indexOf(null);
    if (hueco !== -1) { p.apps[hueco] = slug; return normalizar({ v: 2, pages }); }
  }
  const nueva = paginaVacia();
  nueva.apps[0] = slug;
  return normalizar({ v: 2, pages: [...pages, nueva] });
}

/** Quita una app del inicio. Sigue existiendo: vuelve en la Store. */
export function quitarApp(layout: HomeLayout, slug: AppSlug): HomeLayout {
  const pages = layout.pages.map((p) => ({
    ...p,
    apps: p.apps.map((s) => (s === slug ? null : s)),
  }));
  return normalizar({ v: 2, pages });
}

/**
 * Intercambia dos casillas. Intercambia, no inserta: si se desplazaran
 * todas las demás, soltar un icono reordenaría media pantalla y nadie
 * entendería por qué.
 */
export function intercambiar(
  layout: HomeLayout,
  origen: { pagina: number; slot: number },
  destino: { pagina: number; slot: number },
): HomeLayout {
  const pages = layout.pages.map((p) => ({ ...p, apps: [...p.apps] }));
  const a = pages[origen.pagina];
  const b = pages[destino.pagina];
  if (!a || !b) return layout;
  if (origen.slot < 0 || origen.slot >= SLOTS_POR_PAGINA) return layout;
  if (destino.slot < 0 || destino.slot >= SLOTS_POR_PAGINA) return layout;

  const guardado = a.apps[origen.slot];
  a.apps[origen.slot] = b.apps[destino.slot];
  b.apps[destino.slot] = guardado;
  return normalizar({ v: 2, pages });
}

export function anadirWidget(
  layout: HomeLayout,
  pagina: number,
  app: AppSlug,
  size: WidgetSize,
  id: string,
): HomeLayout {
  const pages = layout.pages.map((p, i) =>
    i === pagina ? { ...p, widgets: [...p.widgets, { id, app, size }] } : p,
  );
  if (!pages[pagina]) return layout;
  return normalizar({ v: 2, pages });
}

export function quitarWidget(layout: HomeLayout, id: string): HomeLayout {
  const pages = layout.pages.map((p) => ({
    ...p,
    widgets: p.widgets.filter((w) => w.id !== id),
  }));
  return normalizar({ v: 2, pages });
}
