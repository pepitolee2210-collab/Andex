/**
 * Pruebas del temario de inglés.
 *
 * Lo que se protege no es el conteo: es que el temario se ordene por el
 * MOMENTO del trabajo y no por el orden en que alguien escribió las
 * lecciones. Si eso se rompe, la persona ve "emergencia" antes que "la
 * entrevista" y el módulo deja de tener sentido.
 *
 * Y una parte es contenido: sin la pronunciación escrita, una frase sólo
 * sirve a quien ya sabe leer inglés — que es justo quien no necesita esto.
 */

import { describe, expect, it } from "vitest";
import {
  RUTAS_INGLES,
  RUTAS_POR_OFICIO,
  RUTAS_TRANSVERSALES,
  rutaPorOficio,
  rutaPorSlug,
} from "@/lib/catalogs/ingles";
import {
  SITUATION_ORDER,
  lessonsBySituation,
  phraseCount,
  type LessonTrack,
} from "./types";

const RUTA_PRUEBA: LessonTrack = {
  id: "t",
  slug: "t",
  title: "Prueba",
  summary: "Prueba",
  kind: "oficio",
  occupationTag: "prueba",
  level: "basico",
  weeks: 2,
  lessons: [
    // A propósito en desorden: es lo que la función tiene que arreglar.
    { id: "c", position: 1, title: "C", situation: "emergencia", phrases: [
      { en: "Help", es: "Ayuda", say: "jelp" },
    ] },
    { id: "a", position: 2, title: "A", situation: "entrevista", phrases: [
      { en: "Hello", es: "Hola", say: "je-LÓU" },
      { en: "Thanks", es: "Gracias", say: "zanks" },
    ] },
    { id: "b", position: 1, title: "B", situation: "entrevista", phrases: [
      { en: "Bye", es: "Adiós", say: "bai" },
    ] },
  ],
};

describe("orden del temario", () => {
  it("agrupa por momento del trabajo, no por orden de escritura", () => {
    const grupos = lessonsBySituation(RUTA_PRUEBA);
    expect(grupos.map((g) => g.situation)).toEqual(["entrevista", "emergencia"]);
  });

  it("dentro de cada momento, ordena por posición", () => {
    const [entrevista] = lessonsBySituation(RUTA_PRUEBA);
    expect(entrevista.lessons.map((l) => l.id)).toEqual(["b", "a"]);
  });

  it("no inventa grupos vacíos", () => {
    // Sólo hay lecciones de dos situaciones; no deben salir las otras cuatro.
    expect(lessonsBySituation(RUTA_PRUEBA)).toHaveLength(2);
  });

  it("cuenta todas las frases de la ruta", () => {
    expect(phraseCount(RUTA_PRUEBA)).toBe(4);
  });

  it("una ruta sin lecciones no revienta", () => {
    const vacia = { ...RUTA_PRUEBA, lessons: [] };
    expect(lessonsBySituation(vacia)).toEqual([]);
    expect(phraseCount(vacia)).toBe(0);
  });
});

describe("el catálogo publicado", () => {
  it("hay rutas", () => {
    expect(RUTAS_INGLES.length).toBeGreaterThan(0);
  });

  it("TODA frase trae su pronunciación", () => {
    // Es la razón de ser del módulo. Una frase sin `say` sólo sirve a quien
    // ya sabe leer inglés.
    const sinPronunciacion: string[] = [];
    for (const ruta of RUTAS_INGLES) {
      for (const leccion of ruta.lessons) {
        for (const frase of leccion.phrases) {
          if (!frase.say.trim()) sinPronunciacion.push(`${ruta.slug}: ${frase.en}`);
        }
      }
    }
    expect(sinPronunciacion).toEqual([]);
  });

  it("TODA frase trae su significado en español", () => {
    const sinEspanol: string[] = [];
    for (const ruta of RUTAS_INGLES) {
      for (const leccion of ruta.lessons) {
        for (const frase of leccion.phrases) {
          if (!frase.es.trim()) sinEspanol.push(`${ruta.slug}: ${frase.en}`);
        }
      }
    }
    expect(sinEspanol).toEqual([]);
  });

  it("los slugs no se repiten", () => {
    const slugs = RUTAS_INGLES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("toda situación usada existe en el orden canónico", () => {
    // Una situación fuera de la lista quedaría sin traducir y sin ordenar.
    const usadas = new Set(
      RUTAS_INGLES.flatMap((r) => r.lessons.map((l) => l.situation)),
    );
    for (const s of usadas) expect(SITUATION_ORDER).toContain(s);
  });

  it("todo temario DE OFICIO cubre la entrevista", () => {
    // Nadie llega al primer día sin pasar la entrevista: si un temario de
    // oficio no la cubre, no sirve para conseguir el trabajo. Los
    // transversales no la necesitan — "qué hacer si te lastimas" no se
    // practica en una entrevista.
    for (const ruta of RUTAS_POR_OFICIO) {
      expect(ruta.lessons.some((l) => l.situation === "entrevista")).toBe(true);
    }
  });

  it("los transversales no dependen de ningún oficio", () => {
    for (const ruta of RUTAS_TRANSVERSALES) {
      expect(ruta.kind).toBe("transversal");
      expect(ruta.occupationTag).toBe("");
    }
  });

  it("los transversales van PRIMERO en el catálogo", () => {
    // Nadie sabe que necesita saber qué hacer cuando no le pagan, así que no
    // se puede esperar a que baje a buscarlo.
    const primeros = RUTAS_INGLES.slice(0, RUTAS_TRANSVERSALES.length);
    expect(primeros.every((r) => r.kind === "transversal")).toBe(true);
  });

  it("TODO hecho sobre derechos lleva su fuente", () => {
    // Un hecho sin fuente es una afirmación nuestra. En un módulo que habla
    // de salarios y de OSHA, eso no se puede publicar: hay que poder
    // enseñar de dónde sale cada cosa.
    const sinFuente: string[] = [];
    for (const ruta of RUTAS_INGLES) {
      for (const leccion of ruta.lessons) {
        for (const hecho of leccion.facts ?? []) {
          if (!hecho.source.trim()) sinFuente.push(`${ruta.slug}: ${hecho.text.slice(0, 40)}`);
        }
      }
    }
    expect(sinFuente).toEqual([]);
  });

  it("se cubren las dos áreas que exige el marco federal", () => {
    // CASAS 4.2 (salario y derechos) y 4.3 (seguridad). Faltaban las dos, y
    // esta prueba impide que se caigan sin que nadie se dé cuenta.
    expect(RUTAS_INGLES.some((r) => r.slug === "pago-y-derechos")).toBe(true);
    expect(RUTAS_INGLES.some((r) => r.slug === "seguridad")).toBe(true);
  });

  it("se encuentra una ruta por su oficio", () => {
    // Es la bisagra con Empleo: una vacante de limpieza tiene que poder
    // ofrecer su temario.
    expect(rutaPorOficio("limpieza")?.slug).toBe("limpieza");
    expect(rutaPorOficio("  LIMPIEZA ")?.slug).toBe("limpieza");
    expect(rutaPorOficio("astronauta")).toBeUndefined();
  });

  it("se encuentra una ruta por su slug", () => {
    expect(rutaPorSlug("restaurante")?.occupationTag).toBe("mesero");
    expect(rutaPorSlug("no-existe")).toBeUndefined();
  });
});
