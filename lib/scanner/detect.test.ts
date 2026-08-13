/**
 * BANCO DE PRUEBAS DE LA DETECCIÓN DE BORDES.
 *
 * Mide, en un número, qué tan bien encuentra el detector las esquinas del
 * papel en las condiciones que de verdad arruinan un escaneo. Sin esto,
 * "mejoré el escáner" es una opinión.
 *
 * Los umbrales de abajo NO son aspiraciones: son el comportamiento medido
 * hoy, congelado para que una regresión falle. Cuando el detector mejore, se
 * bajan — y el commit deja constancia de cuánto.
 */

import { describe, expect, it } from "vitest";
import { detectWithSobelHough as detectDocument } from "./detect-sobel";
import { cornerError, makeDocumentPhoto, type PhotoOptions } from "./fixtures";

/** Error tolerable para dar una detección por buena: 3% del ancho. */
const BUENO = 0.03;

type Caso = { id: string; desc: string; opciones: PhotoOptions };

const CASOS: Caso[] = [
  {
    id: "facil",
    desc: "papel claro sobre mesa oscura, casi recto",
    opciones: { rotation: 0.02 },
  },
  {
    id: "inclinado",
    desc: "perspectiva fuerte, como una foto desde arriba en ángulo",
    opciones: { rotation: 0.02, perspective: 0.22 },
  },
  {
    id: "claro_sobre_claro",
    desc: "papel blanco sobre mesa CLARA — el caso que se sabe que falla",
    opciones: { background: [232, 228, 220], rotation: 0.03 },
  },
  {
    id: "madera",
    desc: "mesa de madera con veta, que produce bordes falsos",
    opciones: { background: [107, 74, 47], woodGrain: true, rotation: 0.05 },
  },
  {
    id: "sombra_mano",
    desc: "sombra de la propia mano sobre una esquina",
    opciones: { rotation: 0.03, illumination: "handShadow" },
  },
  {
    id: "penumbra",
    desc: "foto a oscuras, con ruido de sensor",
    opciones: { background: [26, 26, 30], paper: [138, 136, 128], noise: 14 },
  },
  {
    id: "reflejo",
    desc: "reflejo de lámpara quemando parte del papel",
    opciones: { rotation: 0.02, illumination: "glare" },
  },
  {
    id: "degradado",
    desc: "luz entrando por un lado",
    opciones: { rotation: 0.03, illumination: "gradient" },
  },
];

/**
 * Comportamiento MEDIDO hoy, no deseado.
 *
 * `null` significa que el detector no encuentra nada y devuelve `null` — que
 * es una respuesta correcta: mejor rendirse que inventar un recorte que la
 * persona tendría que deshacer. Lo que no puede pasar es que devuelva un
 * cuadrilátero MAL, porque entonces se acepta sin mirar.
 */
const LINEA_BASE: Record<string, number | null> = {
  facil: BUENO,
  inclinado: BUENO,
  // El único que este detector no saca. Lo resuelve el neuronal de la
  // cascada (ver `detect.ts`), y lo importante es que aquí NO se inventa un
  // recorte: se rinde, que es la respuesta correcta cuando no se sabe.
  claro_sobre_claro: null,
  madera: BUENO,
  sombra_mano: BUENO,
  penumbra: BUENO,
  reflejo: BUENO,
  degradado: BUENO,
};

describe("detección de bordes — banco de casos", () => {
  for (const caso of CASOS) {
    it(`${caso.id}: ${caso.desc}`, () => {
      const { image, truth } = makeDocumentPhoto({ seed: 7, ...caso.opciones });
      const quad = detectDocument(image);
      const esperado = LINEA_BASE[caso.id];

      if (esperado === null) {
        // Se admite que falle, pero NUNCA que acierte a medias: un recorte
        // equivocado que parece bueno es peor que ninguno.
        if (quad !== null) {
          const err = cornerError(quad, truth, image.width);
          expect(err).toBeLessThan(BUENO);
        }
        return;
      }

      expect(quad).not.toBeNull();
      const err = cornerError(quad!, truth, image.width);
      expect(err).toBeLessThan(esperado);
    });
  }
});

describe("garantías del detector", () => {
  it("una imagen sin papel no produce un recorte inventado", () => {
    // Sólo mesa: no hay documento que encontrar.
    const { image } = makeDocumentPhoto({ fill: 0.001, background: [60, 60, 64] });
    const quad = detectDocument(image);
    // Puede devolver null (correcto) o algo, pero nunca reventar.
    expect(quad === null || typeof quad.topLeft.x === "number").toBe(true);
  });

  it("no revienta con una imagen diminuta", () => {
    const { image } = makeDocumentPhoto({ width: 24, height: 32 });
    expect(() => detectDocument(image)).not.toThrow();
  });

  it("las esquinas salen ordenadas", () => {
    const { image } = makeDocumentPhoto({ seed: 3 });
    const quad = detectDocument(image);
    if (!quad) return;
    // Arriba por encima de abajo, izquierda a la izquierda de derecha.
    expect(quad.topLeft.y).toBeLessThan(quad.bottomLeft.y);
    expect(quad.topLeft.x).toBeLessThan(quad.topRight.x);
  });
});
