/**
 * Pruebas del inicio.
 *
 * Lo que se protege no es "que funcione": es que una app no se pierda ni se
 * duplique, y que no quede una página fantasma que se pueda deslizar hacia
 * la nada. Son los tres fallos que se ven y no se explican.
 */

import { describe, expect, it } from "vitest";
import { OS_APPS, SLOTS_POR_PAGINA } from "./apps";
import {
  anadirApp,
  anadirWidget,
  appsColocadas,
  appsQuitadas,
  intercambiar,
  layoutInicial,
  normalizar,
  parseLayout,
  quitarApp,
  quitarWidget,
  type HomeLayout,
} from "./home";

describe("el inicio de fábrica", () => {
  it("cabe en una sola página", () => {
    const l = layoutInicial();
    expect(l.pages).toHaveLength(1);
    expect(l.pages[0].apps).toHaveLength(SLOTS_POR_PAGINA);
  });

  it("trae todas las apps de fábrica, sin repetir", () => {
    const puestas = appsColocadas(layoutInicial());
    const esperadas = OS_APPS.filter((a) => a.defaultHome).map((a) => a.slug);
    expect(puestas).toEqual(esperadas);
    expect(new Set(puestas).size).toBe(puestas.length);
  });

  it("arranca con los dos widgets de estado", () => {
    // Son la idea de la pantalla: se abre y ya se sabe cómo van las cosas.
    expect(layoutInicial().pages[0].widgets.map((w) => w.app)).toEqual(["boveda", "ia", "escaner"]);
  });
});

describe("una app vive en una sola casilla", () => {
  it("añadir una que ya está no hace nada", () => {
    const l = layoutInicial();
    expect(anadirApp(l, "boveda")).toBe(l);
  });

  it("un duplicado guardado se limpia al leerlo", () => {
    const roto: HomeLayout = {
      v: 2,
      pages: [{
        widgets: [],
        apps: ["boveda", "boveda", "escaner", null, null, null, null, null],
      }],
    };
    const apps = appsColocadas(normalizar(roto));
    expect(apps).toEqual(["boveda", "escaner"]);
  });

  it("quitar la deja disponible en la Store", () => {
    const l = quitarApp(layoutInicial(), "legal");
    expect(appsColocadas(l)).not.toContain("legal");
    expect(appsQuitadas(l)).toContain("legal");
  });

  it("y se puede recuperar", () => {
    const l = anadirApp(quitarApp(layoutInicial(), "legal"), "legal");
    expect(appsColocadas(l)).toContain("legal");
    expect(appsQuitadas(l)).toEqual([]);
  });
});

describe("las páginas nacen y mueren solas", () => {
  it("si no cabe, se abre una página nueva", () => {
    let l = layoutInicial();
    // Se llena la primera hasta arriba y se fuerza una más.
    expect(l.pages[0].apps.filter(Boolean)).toHaveLength(SLOTS_POR_PAGINA);
    l = quitarApp(l, "ajustes");
    l = anadirApp(l, "ajustes");
    expect(l.pages).toHaveLength(1);
  });

  it("una página sin nada desaparece", () => {
    const dos: HomeLayout = {
      v: 2,
      pages: [
        layoutInicial().pages[0],
        { widgets: [], apps: Array(SLOTS_POR_PAGINA).fill(null) },
      ],
    };
    expect(normalizar(dos).pages).toHaveLength(1);
  });

  it("pero una página con SÓLO un widget se queda", () => {
    // Un widget es contenido. Si se borrara la página, el widget se iría con
    // ella sin que nadie lo hubiera quitado.
    const dos: HomeLayout = {
      v: 2,
      pages: [
        layoutInicial().pages[0],
        { widgets: [{ id: "w1", app: "ia", size: "mediano" }], apps: Array(SLOTS_POR_PAGINA).fill(null) },
      ],
    };
    expect(normalizar(dos).pages).toHaveLength(2);
  });

  it("nunca se queda sin ninguna página", () => {
    // Cero páginas no es "vacío": es un producto roto que no se puede usar.
    const vacio: HomeLayout = { v: 2, pages: [] };
    expect(normalizar(vacio).pages).toHaveLength(1);
  });
});

describe("mover iconos", () => {
  it("intercambia, no desplaza al resto", () => {
    const l = layoutInicial();
    const antes = [...l.pages[0].apps];
    const luego = intercambiar(l, { pagina: 0, slot: 0 }, { pagina: 0, slot: 3 });
    expect(luego.pages[0].apps[0]).toBe(antes[3]);
    expect(luego.pages[0].apps[3]).toBe(antes[0]);
    // Lo demás, intacto.
    expect(luego.pages[0].apps[1]).toBe(antes[1]);
    expect(luego.pages[0].apps[2]).toBe(antes[2]);
  });

  it("una casilla fuera de rango no rompe nada", () => {
    const l = layoutInicial();
    expect(intercambiar(l, { pagina: 0, slot: 0 }, { pagina: 0, slot: 99 })).toBe(l);
    expect(intercambiar(l, { pagina: 9, slot: 0 }, { pagina: 0, slot: 1 })).toBe(l);
  });
});

describe("widgets", () => {
  it("la misma app puede tener varios, de distinto tamaño", () => {
    let l = layoutInicial();
    l = anadirWidget(l, 0, "boveda", "pequeno", "w-extra");
    expect(l.pages[0].widgets.filter((w) => w.app === "boveda")).toHaveLength(2);
  });

  it("dos ids iguales se separan al normalizar", () => {
    // Si se repitieran, quitar uno quitaría el otro — y React pintaría mal.
    const roto: HomeLayout = {
      v: 2,
      pages: [{
        widgets: [
          { id: "w", app: "ia", size: "pequeno" },
          { id: "w", app: "ia", size: "grande" },
        ],
        apps: Array(SLOTS_POR_PAGINA).fill(null),
      }],
    };
    const ids = normalizar(roto).pages[0].widgets.map((w) => w.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("se quita por id", () => {
    const l = quitarWidget(layoutInicial(), "w-ia");
    expect(l.pages[0].widgets.map((w) => w.id)).toEqual(["w-boveda", "w-escaner"]);
  });
});

describe("leer lo guardado sin fiarse", () => {
  it("un texto que no es JSON devuelve el inicio de fábrica", () => {
    expect(parseLayout("{{{no")).toEqual(layoutInicial());
  });

  it("null, número o array sueltos, igual", () => {
    expect(parseLayout(null)).toEqual(layoutInicial());
    expect(parseLayout(42)).toEqual(layoutInicial());
    expect(parseLayout([])).toEqual(layoutInicial());
  });

  it("una app que ya no existe se descarta, el resto se conserva", () => {
    // Pasa de verdad: se retira una app del catálogo y hay gente con ella
    // guardada. Lo que no puede pasar es que se pierda todo lo demás.
    const guardado = JSON.stringify({
      v: 2,
      pages: [{ widgets: [], apps: ["boveda", "criptomonedas", "ingles"] }],
    });
    expect(appsColocadas(parseLayout(guardado))).toEqual(["boveda", "ingles"]);
  });

  it("un tamaño de widget inventado cae en 'mediano'", () => {
    const guardado = JSON.stringify({
      v: 2,
      pages: [{ widgets: [{ id: "x", app: "ia", size: "gigante" }], apps: [] }],
    });
    expect(parseLayout(guardado).pages[0].widgets[0].size).toBe("mediano");
  });

  it("la rejilla plana de la versión anterior se migra", () => {
    // v1 no tenía páginas ni widgets. Quien venía de ahí no puede aterrizar
    // en una pantalla sin nada.
    const v1 = JSON.stringify({ apps: ["ingles", "boveda"] });
    const l = parseLayout(v1);
    expect(l.v).toBe(2);
    expect(appsColocadas(l)).toEqual(["ingles", "boveda"]);
    expect(l.pages[0].widgets.length).toBeGreaterThan(0);
  });

  it("una ida y vuelta por JSON no cambia nada", () => {
    const l = layoutInicial();
    expect(parseLayout(JSON.stringify(l))).toEqual(l);
  });
});
