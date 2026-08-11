/**
 * Pruebas de la búsqueda de la Bóveda.
 *
 * Buscar aquí no es una comodidad: a los seis meses una familia tiene veinte
 * papeles dentro y encontrar el correcto es la diferencia entre llegar a la
 * cita con el documento o sin él. Y el filtro "sin fecha" es el que destapa
 * los documentos que nunca van a disparar un aviso.
 */

import { describe, expect, it } from "vitest";
import { expiryState, type VaultDocument } from "@/lib/vault/types";
import {
  matchesFilter,
  matchesQuery,
  normalizeText,
  searchDocuments,
  type VaultEntry,
} from "./vault-format";

const HOY = new Date("2026-08-10T12:00:00Z");

function doc(over: Partial<VaultDocument> = {}): VaultDocument {
  return {
    id: over.id ?? "1",
    folder: over.folder ?? "identity",
    name: over.name ?? "Pasaporte",
    expiresAt: over.expiresAt !== undefined ? over.expiresAt : null,
    pageCount: 1,
    sizeBytes: 1000,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    note: over.note !== undefined ? over.note : null,
  };
}

const entry = (over: Partial<VaultDocument> = {}): VaultEntry => {
  const d = doc(over);
  return { document: d, state: expiryState(d.expiresAt, HOY) };
};

describe("normalizar texto", () => {
  it("quita tildes y mayúsculas", () => {
    expect(normalizeText("Matrícula Consular")).toBe("matricula consular");
  });

  it("la eñe se pliega a n, a propósito", () => {
    // Decidido, no heredado del algoritmo: mucha gente de esta comunidad
    // teclea en un móvil en inglés, donde la ñ exige mantener pulsada la n.
    // Plegándola, "compania" encuentra "Compañía".
    expect(normalizeText("Año")).toBe("ano");
    expect(matchesQuery(doc({ name: "Compañía de seguros" }), "compania")).toBe(true);
  });
});

describe("buscar por texto", () => {
  it("sin consulta, todo coincide", () => {
    expect(matchesQuery(doc(), "")).toBe(true);
    expect(matchesQuery(doc(), "   ")).toBe(true);
  });

  it("encuentra por un trozo del nombre", () => {
    expect(matchesQuery(doc({ name: "Permiso de trabajo (EAD)" }), "permiso")).toBe(true);
    expect(matchesQuery(doc({ name: "Permiso de trabajo (EAD)" }), "ead")).toBe(true);
  });

  it("encuentra aunque falten las tildes al escribir", () => {
    expect(matchesQuery(doc({ name: "Matrícula consular" }), "matricula")).toBe(true);
  });

  it("encuentra aunque sobren: escribir con tilde también vale", () => {
    expect(matchesQuery(doc({ name: "Matricula consular" }), "matrícula")).toBe(true);
  });

  it("las palabras cuentan sueltas, no como frase", () => {
    // Nadie recuerda el nombre exacto que le puso a su propio archivo.
    expect(matchesQuery(doc({ name: "Permiso de trabajo (EAD)" }), "permiso trabajo")).toBe(true);
  });

  it("exige TODAS las palabras, no cualquiera", () => {
    expect(matchesQuery(doc({ name: "Permiso de trabajo" }), "permiso licencia")).toBe(false);
  });

  it("busca también en la nota, que es donde se apunta el para qué", () => {
    expect(
      matchesQuery(doc({ name: "Acta", note: "el que pidió el abogado" }), "abogado"),
    ).toBe(true);
  });

  it("un documento sin nota no rompe la búsqueda", () => {
    expect(matchesQuery(doc({ note: null }), "pasaporte")).toBe(true);
    expect(matchesQuery(doc({ note: null }), "abogado")).toBe(false);
  });
});

describe("filtrar por estado", () => {
  const vencePronto = entry({ id: "a", expiresAt: "2026-09-01" }); // 22 días
  const vencido = entry({ id: "b", expiresAt: "2026-08-01" });
  const vigente = entry({ id: "c", expiresAt: "2030-01-01" });
  const sinFecha = entry({ id: "d", expiresAt: null });

  it("'todos' no descarta nada", () => {
    for (const e of [vencePronto, vencido, vigente, sinFecha]) {
      expect(matchesFilter(e, "all")).toBe(true);
    }
  });

  it("'vence pronto' incluye lo ya vencido", () => {
    // Lo vencido es más urgente que lo que está por vencer: esconderlo en
    // otro filtro sería esconder justo lo que hay que resolver hoy.
    expect(matchesFilter(vencido, "dueSoon")).toBe(true);
    expect(matchesFilter(vencePronto, "dueSoon")).toBe(true);
    expect(matchesFilter(vigente, "dueSoon")).toBe(false);
    expect(matchesFilter(sinFecha, "dueSoon")).toBe(false);
  });

  it("'sin fecha' saca los que nunca van a avisar", () => {
    expect(matchesFilter(sinFecha, "noExpiry")).toBe(true);
    expect(matchesFilter(vigente, "noExpiry")).toBe(false);
  });
});

describe("buscar y filtrar juntos", () => {
  const entries = [
    entry({ id: "1", name: "Pasaporte", expiresAt: "2030-01-01" }),
    entry({ id: "2", name: "Permiso de trabajo", expiresAt: "2026-09-05" }),
    entry({ id: "3", name: "Licencia de manejo", expiresAt: "2026-08-01" }),
    entry({ id: "4", name: "Acta de nacimiento", expiresAt: null }),
  ];

  it("busca en TODAS las carpetas, no sólo en la abierta", () => {
    const r = searchDocuments(entries, "pasaporte", "all");
    expect(r.map((e) => e.document.id)).toEqual(["1"]);
  });

  it("devuelve lo más urgente primero", () => {
    const r = searchDocuments(entries, "", "dueSoon");
    // La licencia está vencida; el permiso sólo por vencer.
    expect(r.map((e) => e.document.id)).toEqual(["3", "2"]);
  });

  it("el texto y el filtro se aplican a la vez", () => {
    expect(searchDocuments(entries, "permiso", "dueSoon").map((e) => e.document.id)).toEqual(["2"]);
    expect(searchDocuments(entries, "permiso", "noExpiry")).toEqual([]);
  });

  it("sin resultados devuelve una lista vacía, no todo", () => {
    // El fallo clásico: una búsqueda sin coincidencias que enseña el catálogo
    // entero y hace creer que el documento está ahí.
    expect(searchDocuments(entries, "hipoteca", "all")).toEqual([]);
  });

  it("no muta la lista original", () => {
    const copia = [...entries];
    searchDocuments(entries, "", "all");
    expect(entries).toEqual(copia);
  });
});
