/**
 * Tests del motor de recomendación — §3.3.1 y §3.3.2 (ANDEX-PRD-v1.3-FINAL)
 * más casos borde §4.7. Consumen SOLO la API pública del motor.
 */

import { describe, expect, it } from "vitest";
import type {
  LocationContext,
  ModuleId,
  ModuleScore,
  ProfileInput,
} from "@/lib/types";
import {
  applyBehaviorAdjustments,
  rankModules,
} from "@/lib/recommendation-engine";

const onlyContext = (locationContext: LocationContext): ProfileInput => ({
  locationContext,
});

const order = (ranking: ModuleScore[]): number[] =>
  ranking.map((s) => s.moduleId);

const byId = (ranking: ModuleScore[], id: ModuleId): ModuleScore => {
  const found = ranking.find((s) => s.moduleId === id);
  if (!found) throw new Error(`Módulo ${id} ausente del ranking`);
  return found;
};

/** ModuleScore sintético para los tests de §3.3.2. */
const mk = (
  moduleId: ModuleId,
  score: number,
  contentVariant: LocationContext = "in_us",
): ModuleScore => ({
  moduleId,
  score,
  reason: { type: "context_default", context: contentVariant },
  contentVariant,
});

const REASON_TYPES = [
  "goal",
  "interest",
  "situation",
  "family",
  "urgency",
  "pilot",
  "context_default",
] as const;

// ─── §3.3.1 — Órdenes por defecto (solo contexto) ─────────────────────────

describe("orden por defecto con solo locationContext (§3.3.1)", () => {
  it("in_us → [1,7,5,3,2,4,6] con reasons context_default", () => {
    const r = rankModules(onlyContext("in_us"));
    expect(order(r)).toEqual([1, 7, 5, 3, 2, 4, 6]);
    expect(r[0].score).toBe(100); // M1 base 40 normaliza a 100
    expect(r.map((s) => s.score)).toEqual([100, 88, 75, 75, 75, 63, 63]);
    for (const s of r) {
      expect(s.reason).toEqual({ type: "context_default", context: "in_us" });
    }
  });

  it("pre_arrival → [2,6,1,3,5,4,7] con reasons context_default", () => {
    const r = rankModules(onlyContext("pre_arrival"));
    expect(order(r)).toEqual([2, 6, 1, 3, 5, 4, 7]);
    expect(r.map((s) => s.score)).toEqual([100, 60, 50, 40, 30, 30, 10]);
    for (const s of r) {
      expect(s.reason).toEqual({
        type: "context_default",
        context: "pre_arrival",
      });
    }
  });
});

// ─── Invariantes: siempre 7, score 0–100, reason presente ─────────────────

describe("invariantes del contrato (§3.3.1 reglas de negocio)", () => {
  const profiles: ProfileInput[] = [
    { locationContext: "in_us" },
    { locationContext: "pre_arrival" },
    {
      locationContext: "in_us",
      stateUS: "UT",
      timeInUS: "menos_6_meses",
      situation: "recien_llegado",
      seekingFor: "both",
      interests: ["empleo", "legal_tramites", "comunidad_local"],
      immediateGoal: "empleo",
    },
    {
      locationContext: "pre_arrival",
      countryOfResidence: "MX",
      travelPlan: "fecha_confirmada",
      situation: "inversion_remota",
      seekingFor: "family",
      interests: ["empresa_llc", "finanzas_prellegada", "other"],
      immediateGoal: "custom",
    },
    {
      locationContext: "in_us",
      situation: "other",
      seekingFor: "self",
      interests: ["other"],
      immediateGoal: "custom",
    },
  ];

  it("siempre devuelve los 7 módulos, sin subconjuntos ni duplicados", () => {
    for (const p of profiles) {
      const r = rankModules(p);
      expect(r).toHaveLength(7);
      expect([...order(r)].sort()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }
  });

  it("scores enteros 0–100 y reason con type válido en los 7", () => {
    for (const p of profiles) {
      for (const s of rankModules(p)) {
        expect(Number.isInteger(s.score)).toBe(true);
        expect(s.score).toBeGreaterThanOrEqual(0);
        expect(s.score).toBeLessThanOrEqual(100);
        expect(REASON_TYPES).toContain(s.reason.type);
      }
    }
  });

  it("contentVariant = locationContext en los 7 (ambos contextos)", () => {
    for (const ctx of ["in_us", "pre_arrival"] as const) {
      const r = rankModules({
        locationContext: ctx,
        seekingFor: "both",
        interests: ["legal_tramites"],
      });
      for (const s of r) expect(s.contentVariant).toBe(ctx);
    }
  });

  it("determinismo: misma entrada → misma salida", () => {
    const input: ProfileInput = {
      locationContext: "in_us",
      stateUS: "UT",
      timeInUS: "menos_6_meses",
      situation: "permiso_trabajo",
      seekingFor: "both",
      interests: ["empleo", "finanzas", "certificaciones"],
      immediateGoal: "finanzas",
    };
    const a = rankModules(input);
    const b = rankModules(input);
    expect(a).toEqual(b);
    expect(a).not.toBe(b); // objetos nuevos, sin estado compartido
  });
});

// ─── Señales individuales ─────────────────────────────────────────────────

describe("IMMEDIATE_GOAL (§3.3.1 paso 2)", () => {
  it("in_us + goal empresa_llc → M4 primero con reason goal", () => {
    const r = rankModules({
      locationContext: "in_us",
      immediateGoal: "empresa_llc",
    });
    expect(order(r)).toEqual([4, 1, 7, 2, 3, 5, 6]); // empates → menor id
    expect(r[0].score).toBe(100); // raw 75 = 25 + 50
    expect(r[0].reason).toEqual({ type: "goal", goal: "empresa_llc" });
  });

  it("goal 'custom' no suma a ningún módulo", () => {
    const r = rankModules({
      locationContext: "in_us",
      immediateGoal: "custom",
    });
    expect(r).toEqual(rankModules(onlyContext("in_us")));
  });
});

describe("FAMILY_BOOST (§3.3.1 paso 8, modo dual §3.2 paso 3.5)", () => {
  it("seekingFor 'family' sube M2 al primer puesto en in_us con reason family", () => {
    const r = rankModules({ locationContext: "in_us", seekingFor: "family" });
    expect(r[0].moduleId).toBe(2); // 30 + 15 = 45 > 40 de M1
    expect(r[0].reason).toEqual({ type: "family" });
  });

  it("seekingFor 'both' también aplica; 'self' no", () => {
    const both = rankModules({ locationContext: "in_us", seekingFor: "both" });
    expect(both[0].moduleId).toBe(2);
    expect(both[0].reason).toEqual({ type: "family" });

    const self = rankModules({ locationContext: "in_us", seekingFor: "self" });
    expect(self).toEqual(rankModules(onlyContext("in_us")));
  });

  it("ante contribuciones empatadas (interés adicional +15 vs family +15) gana interest", () => {
    const r = rankModules({
      locationContext: "in_us",
      seekingFor: "family",
      interests: ["finanzas", "legal_tramites"], // M2 recibe +15 adicional
    });
    // M2: 30 + 15 (interés) + 15 (family) = 60 → prioridad goal>interest>…
    expect(byId(r, 2).reason).toEqual({
      type: "interest",
      interest: "legal_tramites",
    });
  });
});

describe("PILOT_BOOST (§3.3.1 paso 7)", () => {
  it("stateUS 'UT' suma 5 a M5 y M6 con reason pilot", () => {
    const r = rankModules({ locationContext: "in_us", stateUS: "UT" });
    // raws: M1 40 · M5 35 · M7 35 · M2 30 · M3 30 · M6 30 · M4 25
    expect(order(r)).toEqual([1, 5, 7, 2, 3, 6, 4]); // empate 35 → id 5 < 7
    expect(byId(r, 5).score).toBe(88); // round(3500/40)
    expect(byId(r, 6).score).toBe(75); // round(3000/40)
    expect(byId(r, 5).reason).toEqual({ type: "pilot" });
    expect(byId(r, 6).reason).toEqual({ type: "pilot" });
  });

  it("otro estado no activa el piloto", () => {
    const r = rankModules({ locationContext: "in_us", stateUS: "TX" });
    expect(r).toEqual(rankModules(onlyContext("in_us")));
  });
});

describe("URGENCY_BOOST (§3.3.1 paso 6 — destino documentado en el motor)", () => {
  it("in_us + menos_6_meses sin situación → +12 al módulo base #1 (M1)", () => {
    const r = rankModules({
      locationContext: "in_us",
      timeInUS: "menos_6_meses",
    });
    expect(r[0].moduleId).toBe(1); // raw 52 = 40 + 12
    expect(r[0].score).toBe(100);
    expect(r[0].reason).toEqual({ type: "urgency", context: "in_us" });
    expect(order(r)).toEqual([1, 7, 2, 3, 5, 4, 6]); // con señal: empate → menor id
  });

  it("in_us + situación → la urgencia va al top de la situación", () => {
    const r = rankModules({
      locationContext: "in_us",
      timeInUS: "menos_6_meses",
      situation: "recien_llegado", // boosts a [1, 7, 5]
    });
    expect(byId(r, 1).score).toBe(100); // raw 62 = 40 + 10 + 12
    // 12 de urgencia > 10 de situación → la mayor contribución manda
    expect(byId(r, 1).reason).toEqual({ type: "urgency", context: "in_us" });
    expect(byId(r, 7).reason).toEqual({
      type: "situation",
      situation: "recien_llegado",
    });
  });

  it("in_us + 6m_2a NO es urgente", () => {
    const r = rankModules({ locationContext: "in_us", timeInUS: "6m_2a" });
    expect(r).toEqual(rankModules(onlyContext("in_us")));
  });

  it("pre_arrival + fecha_confirmada → +12 a M2 (base #1) con reason urgency", () => {
    const r = rankModules({
      locationContext: "pre_arrival",
      travelPlan: "fecha_confirmada",
    });
    expect(r[0].moduleId).toBe(2); // raw 62 = 50 + 12
    expect(r[0].reason).toEqual({ type: "urgency", context: "pre_arrival" });
  });

  it("pre_arrival + este_ano también urge; explorando no", () => {
    const urgent = rankModules({
      locationContext: "pre_arrival",
      travelPlan: "este_ano",
      situation: "inversion_remota", // boosts a [4, 3] → urgencia a M4
    });
    expect(byId(urgent, 4).reason).toEqual({
      type: "urgency",
      context: "pre_arrival",
    });
    // M4 raw 37 = 15 + 10 + 12; M2 (50) sigue primero
    expect(urgent[0].moduleId).toBe(2);

    const calm = rankModules({
      locationContext: "pre_arrival",
      travelPlan: "explorando",
    });
    expect(calm).toEqual(rankModules(onlyContext("pre_arrival")));
  });
});

describe("situación y contexto mandan sobre el interés (§3.3.1)", () => {
  it("pre_arrival jamás pone M7 primero, aunque marque interés en empleo", () => {
    // El wizard de rama B no ofrece 'empleo', pero el motor lo resiste:
    // M7 = 5 + 30 = 35 < M2 = 50.
    const r = rankModules({
      locationContext: "pre_arrival",
      interests: ["empleo"],
    });
    expect(r[0].moduleId).toBe(2);
    expect(order(r)).not.toContain(NaN);
    expect(r[0].moduleId).not.toBe(7);
  });

  it("pre_arrival con todos los boosts razonables de rama B deja M7 al fondo", () => {
    const r = rankModules({
      locationContext: "pre_arrival",
      countryOfResidence: "MX",
      travelPlan: "fecha_confirmada",
      situation: "inversion_remota",
      seekingFor: "both",
      interests: ["empresa_llc", "finanzas_prellegada", "visa_preparacion", "vida_en_usa"],
      immediateGoal: "empresa_llc",
    });
    // raws: M4 117 · M2 80 · M3 45 · M5 30 · M6 30 · M1 25 · M7 5
    expect(order(r)).toEqual([4, 2, 3, 5, 6, 1, 7]);
    expect(r[0].reason).toEqual({ type: "goal", goal: "empresa_llc" });
    expect(byId(r, 7).score).toBe(4); // round(500/117): hundido, nunca oculto (§0.4)
  });
});

describe("intereses y desempates (§3.3.1 pasos 3, 4 y 10)", () => {
  it("primer interés +30, adicionales +15, y empates → menor id", () => {
    const r = rankModules({
      locationContext: "in_us",
      interests: ["certificaciones"],
    });
    // M6 = 25 + 30 = 55; empate 30 entre M2/M3/M5 → menor id
    expect(order(r)).toEqual([6, 1, 7, 2, 3, 5, 4]);
    expect(byId(r, 6).reason).toEqual({
      type: "interest",
      interest: "certificaciones",
    });
  });

  it("dos intereses al mismo módulo se acumulan (comunidad_local + familia_educacion → M5)", () => {
    const r = rankModules({
      locationContext: "in_us",
      interests: ["comunidad_local", "familia_educacion"],
    });
    expect(byId(r, 5).score).toBe(100); // raw 75 = 30 + 30 + 15 → máximo
    expect(r[0].moduleId).toBe(5);
    // La mayor contribución individual es el interés primario
    expect(r[0].reason).toEqual({
      type: "interest",
      interest: "comunidad_local",
    });
  });
});

// ─── §4.7 — Casos borde ───────────────────────────────────────────────────

describe("casos borde (§4.7)", () => {
  it("perfil que saltó el wizard (solo contexto) → orden por defecto", () => {
    expect(order(rankModules(onlyContext("in_us")))).toEqual([1, 7, 5, 3, 2, 4, 6]);
    expect(order(rankModules(onlyContext("pre_arrival")))).toEqual([2, 6, 1, 3, 5, 4, 7]);
  });

  it("perfil con campos presentes pero neutros (other/custom/self) → orden por defecto", () => {
    const r = rankModules({
      locationContext: "in_us",
      stateUS: "TX",
      timeInUS: "2a_5a",
      situation: "other",
      seekingFor: "self",
      interests: ["other"],
      immediateGoal: "custom",
    });
    expect(r).toEqual(rankModules(onlyContext("in_us")));
  });

  it("todos los scores empatados en 0 (tras behavior) → orden por defecto", () => {
    for (const ctx of ["in_us", "pre_arrival"] as const) {
      const ranked = rankModules(onlyContext(ctx));
      const wipeAll = ranked.map((s) => ({
        moduleId: s.moduleId,
        openCount: 0,
        dismissedCount: 5, // −125 → clamp a 0
        sessionsWithoutOpen: 0,
      }));
      const adjusted = applyBehaviorAdjustments(ranked, wipeAll);
      expect(adjusted.every((s) => s.score === 0)).toBe(true);
      expect(order(adjusted)).toEqual(
        ctx === "in_us" ? [1, 7, 5, 3, 2, 4, 6] : [2, 6, 1, 3, 5, 4, 7],
      );
    }
  });
});

// ─── §3.3.2 — Re-ranking por comportamiento ───────────────────────────────

describe("applyBehaviorAdjustments (§3.3.2)", () => {
  it("suma +2 por apertura con tope acumulado de +20", () => {
    const scores = [mk(1, 50), mk(2, 40)];
    const few = applyBehaviorAdjustments(scores, [
      { moduleId: 2, openCount: 3, dismissedCount: 0, sessionsWithoutOpen: 0 },
    ]);
    expect(byId(few, 2).score).toBe(46); // 40 + 6

    const many = applyBehaviorAdjustments(scores, [
      { moduleId: 2, openCount: 15, dismissedCount: 0, sessionsWithoutOpen: 0 },
    ]);
    expect(byId(many, 2).score).toBe(60); // 40 + 20 (cap), no +30
    expect(order(many)).toEqual([2, 1]); // reordena
  });

  it("resta −10 al llegar a 3 sesiones sin abrir el recomendado (no con 2)", () => {
    const scores = [mk(1, 50), mk(2, 45)];
    const hit = applyBehaviorAdjustments(scores, [
      { moduleId: 1, openCount: 0, dismissedCount: 0, sessionsWithoutOpen: 3 },
    ]);
    expect(byId(hit, 1).score).toBe(40);
    expect(order(hit)).toEqual([2, 1]);

    const notYet = applyBehaviorAdjustments(scores, [
      { moduleId: 1, openCount: 0, dismissedCount: 0, sessionsWithoutOpen: 2 },
    ]);
    expect(byId(notYet, 1).score).toBe(50);
    expect(order(notYet)).toEqual([1, 2]);
  });

  it("resta −25 por cada dismiss y reordena al instante", () => {
    const scores = [mk(1, 80), mk(7, 60)];
    const once = applyBehaviorAdjustments(scores, [
      { moduleId: 1, openCount: 0, dismissedCount: 1, sessionsWithoutOpen: 0 },
    ]);
    expect(byId(once, 1).score).toBe(55);
    expect(order(once)).toEqual([7, 1]);

    const twice = applyBehaviorAdjustments(scores, [
      { moduleId: 1, openCount: 0, dismissedCount: 2, sessionsWithoutOpen: 0 },
    ]);
    expect(byId(twice, 1).score).toBe(30); // 80 − 50
  });

  it("clamp 0–100: nunca fuera de rango", () => {
    const r = applyBehaviorAdjustments(
      [mk(1, 95), mk(2, 10), mk(3, 50)],
      [
        { moduleId: 1, openCount: 15, dismissedCount: 0, sessionsWithoutOpen: 0 },
        { moduleId: 2, openCount: 0, dismissedCount: 1, sessionsWithoutOpen: 0 },
        { moduleId: 3, openCount: 4, dismissedCount: 1, sessionsWithoutOpen: 3 },
      ],
    );
    expect(byId(r, 1).score).toBe(100); // 95 + 20 → clamp
    expect(byId(r, 2).score).toBe(0); // 10 − 25 → clamp
    expect(byId(r, 3).score).toBe(23); // 50 + 8 − 25 − 10
    for (const s of r) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    }
  });

  it("empate tras el ajuste → menor id, y es puro (no muta la entrada)", () => {
    const scores = [mk(2, 50), mk(1, 50)];
    const snapshot = structuredClone(scores);
    const r = applyBehaviorAdjustments(scores, []);
    expect(order(r)).toEqual([1, 2]);
    expect(scores).toEqual(snapshot); // entrada intacta
    expect(r[0]).not.toBe(scores[1]); // objetos nuevos
  });

  it("determinismo y conservación de reason/contentVariant", () => {
    const ranked = rankModules({
      locationContext: "in_us",
      seekingFor: "family",
      interests: ["finanzas"],
    });
    const behavior = [
      { moduleId: 3 as ModuleId, openCount: 2, dismissedCount: 0, sessionsWithoutOpen: 0 },
      { moduleId: 2 as ModuleId, openCount: 0, dismissedCount: 1, sessionsWithoutOpen: 0 },
    ];
    const a = applyBehaviorAdjustments(ranked, behavior);
    const b = applyBehaviorAdjustments(ranked, behavior);
    expect(a).toEqual(b);
    for (const s of a) {
      const original = byId(ranked, s.moduleId);
      expect(s.reason).toEqual(original.reason);
      expect(s.contentVariant).toBe(original.contentVariant);
    }
  });
});
