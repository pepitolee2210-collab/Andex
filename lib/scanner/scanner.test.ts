/**
 * Pruebas del motor del escáner.
 *
 * La geometría y el PDF se prueban con números porque son el punto donde un
 * fallo silencioso arruina el resultado: una homografía mal calculada saca
 * el documento del revés, y un offset mal contado produce un PDF que ningún
 * lector abre. Ambas cosas son invisibles hasta que el usuario intenta
 * presentar el expediente.
 */

import { describe, expect, it } from "vitest";
import {
  defaultQuad,
  isUsableQuad,
  naturalSize,
  orderCorners,
  project,
  projectionFromQuad,
  quadArea,
  type Quad,
} from "./geometry";
import { PAGE_SIZES, buildPdf } from "./pdf";

/** Cuadrilátero perfecto de 100×200 en el origen. */
const RECT: Quad = {
  topLeft: { x: 0, y: 0 },
  topRight: { x: 100, y: 0 },
  bottomRight: { x: 100, y: 200 },
  bottomLeft: { x: 0, y: 200 },
};

describe("geometría — proyección", () => {
  it("las cuatro esquinas del cuadrado unidad caen en las del cuadrilátero", () => {
    const p = projectionFromQuad(RECT);
    expect(project(p, 0, 0)).toEqual({ x: 0, y: 0 });
    expect(project(p, 1, 0)).toEqual({ x: 100, y: 0 });
    expect(project(p, 1, 1)).toEqual({ x: 100, y: 200 });
    expect(project(p, 0, 1)).toEqual({ x: 0, y: 200 });
  });

  it("el centro del cuadrado cae en el centro del rectángulo", () => {
    const c = project(projectionFromQuad(RECT), 0.5, 0.5);
    expect(c.x).toBeCloseTo(50);
    expect(c.y).toBeCloseTo(100);
  });

  it("respeta las esquinas de un cuadrilátero con perspectiva real", () => {
    // Foto inclinada: el borde superior se ve más corto que el inferior.
    const skewed: Quad = {
      topLeft: { x: 30, y: 10 },
      topRight: { x: 170, y: 40 },
      bottomRight: { x: 190, y: 260 },
      bottomLeft: { x: 10, y: 230 },
    };
    const p = projectionFromQuad(skewed);
    expect(project(p, 0, 0).x).toBeCloseTo(30);
    expect(project(p, 1, 0).y).toBeCloseTo(40);
    expect(project(p, 1, 1).x).toBeCloseTo(190);
    expect(project(p, 0, 1).y).toBeCloseTo(230);
  });

  it("en el centro, la perspectiva NO coincide con la media de las esquinas", () => {
    // Si coincidiera sería una transformación afín: la prueba confirma que
    // de verdad se está corrigiendo la fuga, no sólo estirando la imagen.
    const trapezoid: Quad = {
      topLeft: { x: 40, y: 0 },
      topRight: { x: 160, y: 0 },
      bottomRight: { x: 200, y: 200 },
      bottomLeft: { x: 0, y: 200 },
    };
    const c = project(projectionFromQuad(trapezoid), 0.5, 0.5);
    expect(c.y).not.toBeCloseTo(100, 1);
  });

  it("un cuadrilátero degenerado no produce NaN", () => {
    const flat: Quad = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 100, y: 0 },
      bottomRight: { x: 50, y: 0 },
      bottomLeft: { x: 0, y: 0 },
    };
    const c = project(projectionFromQuad(flat), 0.5, 0.5);
    expect(Number.isFinite(c.x)).toBe(true);
    expect(Number.isFinite(c.y)).toBe(true);
  });
});

describe("geometría — tamaño natural", () => {
  it("devuelve las dimensiones del rectángulo", () => {
    expect(naturalSize(RECT)).toEqual({ width: 100, height: 200 });
  });

  it("se queda con el lado más largo para no perder resolución", () => {
    // El borde inferior está más cerca de la cámara: tiene más píxeles.
    const q: Quad = {
      topLeft: { x: 20, y: 0 },
      topRight: { x: 80, y: 0 },
      bottomRight: { x: 100, y: 100 },
      bottomLeft: { x: 0, y: 100 },
    };
    expect(naturalSize(q).width).toBe(100);
  });
});

describe("geometría — orden de esquinas", () => {
  it("normaliza cuatro puntos desordenados", () => {
    const shuffled = [
      { x: 100, y: 200 },
      { x: 0, y: 0 },
      { x: 0, y: 200 },
      { x: 100, y: 0 },
    ];
    const q = orderCorners(shuffled);
    expect(q).not.toBeNull();
    expect(q!.topLeft).toEqual({ x: 0, y: 0 });
    expect(q!.topRight).toEqual({ x: 100, y: 0 });
    expect(q!.bottomRight).toEqual({ x: 100, y: 200 });
    expect(q!.bottomLeft).toEqual({ x: 0, y: 200 });
  });

  it("es idempotente: reordenar lo ya ordenado no cambia nada", () => {
    const once = orderCorners([
      RECT.topLeft, RECT.topRight, RECT.bottomRight, RECT.bottomLeft,
    ]);
    const twice = orderCorners([
      once!.topLeft, once!.topRight, once!.bottomRight, once!.bottomLeft,
    ]);
    expect(twice).toEqual(once);
  });

  it("rechaza un número de puntos distinto de cuatro", () => {
    expect(orderCorners([{ x: 0, y: 0 }])).toBeNull();
  });
});

describe("geometría — validación del recorte", () => {
  it("acepta el recorte por defecto", () => {
    expect(isUsableQuad(defaultQuad(1000, 1400), 1000, 1400)).toBe(true);
  });

  it("rechaza un recorte diminuto", () => {
    const tiny: Quad = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 30, y: 0 },
      bottomRight: { x: 30, y: 30 },
      bottomLeft: { x: 0, y: 30 },
    };
    expect(isUsableQuad(tiny, 1000, 1400)).toBe(false);
  });

  it("rechaza un cuadrilátero retorcido que deshría los píxeles", () => {
    const twisted: Quad = {
      topLeft: { x: 0, y: 0 },
      topRight: { x: 900, y: 0 },
      bottomRight: { x: 100, y: 1300 },
      bottomLeft: { x: 0, y: 1300 },
    };
    expect(isUsableQuad(twisted, 1000, 1400)).toBe(false);
  });

  it("el área es la del cordón de zapato", () => {
    expect(quadArea(RECT)).toBe(20000);
  });
});

// ─── PDF ─────────────────────────────────────────────────

/** JPEG mínimo válido: cabecera, un SOF0 en color y el fin de imagen. */
function fakeJpeg(components = 3): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8, // SOI
    0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x10, 0x00, 0x10, components,
    ...new Array(components * 3).fill(0),
    0xff, 0xd9, // EOI
  ]);
}

function readAscii(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return s;
}

describe("PDF", () => {
  const page = { jpeg: fakeJpeg(), width: 1200, height: 1600 };

  it("empieza por la cabecera y termina en el marcador de fin", () => {
    const text = readAscii(buildPdf([page]));
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("usa CARTA por defecto, no A4: los trámites son estadounidenses", () => {
    const text = readAscii(buildPdf([page]));
    expect(text).toContain("/MediaBox [0 0 612.00 792.00]");
  });

  it("permite A4 para trámites consulares", () => {
    const text = readAscii(buildPdf([page], { size: "a4" }));
    expect(text).toContain("595.28");
  });

  it("declara una página por imagen", () => {
    const text = readAscii(buildPdf([page, page, page]));
    expect(text).toContain("/Count 3");
    expect(text.match(/\/Type \/Page[^s]/g)?.length).toBe(3);
  });

  it("incrusta el JPEG sin recodificar", () => {
    const pdf = buildPdf([page]);
    // Los bytes del JPEG aparecen intactos dentro del archivo.
    const text = readAscii(pdf);
    expect(text).toContain("/Filter /DCTDecode");
    expect(text).toContain(`/Length ${page.jpeg.length}`);
    expect(pdf.length).toBeGreaterThan(page.jpeg.length);
  });

  it("detecta el JPEG en escala de grises y declara el espacio correcto", () => {
    const gray = { jpeg: fakeJpeg(1), width: 100, height: 100 };
    expect(readAscii(buildPdf([gray]))).toContain("/DeviceGray");
    expect(readAscii(buildPdf([page]))).toContain("/DeviceRGB");
  });

  it("la tabla xref apunta a los bytes reales de cada objeto", () => {
    const pdf = buildPdf([page]);
    const text = readAscii(pdf);

    const startxref = Number(text.match(/startxref\n(\d+)/)![1]);
    expect(text.slice(startxref, startxref + 4)).toBe("xref");

    // Cada offset de la tabla debe caer justo en "<n> 0 obj".
    const rows = text.slice(startxref).match(/^(\d{10}) 00000 n $/gm) ?? [];
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row, i) => {
      const at = Number(row.slice(0, 10));
      expect(text.slice(at)).toMatch(new RegExp(`^${i + 1} 0 obj`));
    });
  });

  it("conserva la proporción: un documento apaisado no se estira", () => {
    const wide = { jpeg: fakeJpeg(), width: 1600, height: 900 };
    const text = readAscii(buildPdf([wide]));
    const [, w, h] = text.match(/q\n([\d.]+) 0 0 ([\d.]+)/)!;
    expect(Number(w) / Number(h)).toBeCloseTo(1600 / 900, 2);
  });

  it("respeta el margen: nada se dibuja fuera del área útil", () => {
    const text = readAscii(buildPdf([page], { marginInches: 0.5 }));
    const [, w, h] = text.match(/q\n([\d.]+) 0 0 ([\d.]+)/)!;
    expect(Number(w)).toBeLessThanOrEqual(PAGE_SIZES.letter.width - 72);
    expect(Number(h)).toBeLessThanOrEqual(PAGE_SIZES.letter.height - 72);
  });

  it("un PDF sin páginas es un error, no un archivo roto", () => {
    expect(() => buildPdf([])).toThrow();
  });
});
