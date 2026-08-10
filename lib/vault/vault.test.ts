/**
 * Pruebas del cálculo de vencimientos.
 *
 * Es la lógica que decide si a alguien le avisamos de que su permiso de
 * trabajo caduca. Un error de un día aquí es un aviso que no llega.
 */

import { describe, expect, it } from "vitest";
import { ALERT_DAYS, expiryState, urgencyRank } from "./types";

const HOY = new Date("2026-08-08T15:30:00Z");

describe("vencimientos", () => {
  it("un documento sin fecha no vence", () => {
    expect(expiryState(null, HOY)).toEqual({ kind: "none" });
  });

  it("detecta un documento ya vencido", () => {
    expect(expiryState("2026-08-01", HOY)).toEqual({ kind: "expired", daysAgo: 7 });
  });

  it("el día del vencimiento cuenta como vigente, no como vencido", () => {
    // La hora del reloj no debe influir: se comparan días naturales.
    const state = expiryState("2026-08-08", HOY);
    expect(state.kind).toBe("soon");
  });

  it("avisa en cada uno de los cuatro umbrales", () => {
    const casos: Array<[string, number]> = [
      ["2026-11-06", 90],
      ["2026-10-07", 60],
      ["2026-09-07", 30],
      ["2026-08-15", 7],
    ];
    for (const [fecha, umbral] of casos) {
      const state = expiryState(fecha, HOY);
      expect(state.kind).toBe("soon");
      if (state.kind === "soon") expect(state.threshold).toBe(umbral);
    }
  });

  it("elige siempre el umbral más cercano", () => {
    // A 20 días quedan por delante el de 30 y el de 7; manda el de 30 sólo
    // si es el menor que aún lo cubre.
    const state = expiryState("2026-08-28", HOY);
    expect(state.kind).toBe("soon");
    if (state.kind === "soon") expect(state.threshold).toBe(30);
  });

  it("un vencimiento lejano no genera alarma", () => {
    const state = expiryState("2027-06-01", HOY);
    expect(state.kind).toBe("ok");
  });

  it("una fecha inválida no rompe la pantalla", () => {
    expect(expiryState("no-es-fecha", HOY)).toEqual({ kind: "none" });
  });

  it("los umbrales van de mayor a menor: el orden decide cuál aplica", () => {
    expect([...ALERT_DAYS]).toEqual([90, 60, 30, 7]);
  });

  it("ordena primero lo urgente", () => {
    const estados = [
      expiryState(null, HOY),
      expiryState("2027-06-01", HOY),
      expiryState("2026-08-15", HOY),
      expiryState("2026-08-01", HOY),
    ];
    const orden = estados
      .map((s, i) => ({ i, r: urgencyRank(s) }))
      .sort((a, b) => a.r - b.r)
      .map((x) => x.i);
    expect(orden).toEqual([3, 2, 1, 0]); // vencido, pronto, ok, sin fecha
  });
});
