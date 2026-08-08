/**
 * Constantes del motor de recomendación — transcripción de §3.3.1
 * (ANDEX-PRD-v1.3-FINAL). Los números no se ajustan aquí: cambian en el PRD.
 *
 * Módulo PURO (§7.1 del brief): solo importa de lib/types.
 */

import type {
  InterestTag,
  LocationContext,
  ModuleId,
  SituationTagInUS,
  SituationTagPreArrival,
  TimeInUSTag,
  TravelPlanTag,
} from "@/lib/types";

/**
 * §3.3.1 — Relevancia base por contexto de ubicación (matriz `module_relevance`).
 * M1 Bóveda · M2 Migración · M3 Finanzas · M4 Negocio · M5 Comunidad ·
 * M6 Academia · M7 Empleo.
 */
export const BASE_RELEVANCE: Record<
  LocationContext,
  Record<ModuleId, number>
> = {
  in_us: { 1: 40, 2: 30, 3: 30, 4: 25, 5: 30, 6: 25, 7: 35 },
  pre_arrival: { 1: 25, 2: 50, 3: 20, 4: 15, 5: 15, 6: 30, 7: 5 },
};

/** §3.3.1 — Pesos de cada señal del perfil. */
export const WEIGHTS = {
  /** Paso 5 — la señal más fuerte. */
  IMMEDIATE_GOAL: 50,
  /** Primer interés seleccionado (paso 4). */
  PRIMARY_INTEREST: 30,
  /** Intereses adicionales (paso 4). */
  OTHER_INTEREST: 15,
  /** Refuerzo contextual por situación (paso 3). */
  SITUATION_BOOST: 10,
  /** Recién llegado / viaje con fecha. */
  URGENCY_BOOST: 12,
  /** Utah = boost a M5 y M6. */
  PILOT_BOOST: 5,
  /** seekingFor incluye 'family' → M2. */
  FAMILY_BOOST: 15,
} as const;

/** §3.3.1 — Refuerzos por situación, rama A (in_us). Cada módulo listado recibe +SITUATION_BOOST. */
export const SITUATION_BOOSTS_IN_US: Record<
  SituationTagInUS,
  readonly ModuleId[]
> = {
  recien_llegado: [1, 7, 5], // Bóveda, Empleo, Comunidad
  tramite_proceso: [1, 2], // Bóveda, Migración
  permiso_trabajo: [7, 3, 1],
  residente: [3, 4, 6], // Finanzas, Negocio, Academia
  ciudadano: [4, 3, 6],
  visa_temporal: [1, 2, 6],
  resolviendo: [2, 1],
};

/** §3.3.1 — Refuerzos por situación, rama B (pre_arrival). Cada módulo listado recibe +SITUATION_BOOST. */
export const SITUATION_BOOSTS_PRE: Record<
  SituationTagPreArrival,
  readonly ModuleId[]
> = {
  visa_turismo: [2],
  visa_estudiante: [2, 6, 3],
  visa_aprobada: [2, 1, 3], // Preparando el viaje
  visa_negada: [2],
  explorando: [2, 6, 5],
  reunificacion: [2, 1],
  inversion_remota: [4, 3], // LLC desde el extranjero
};

/** §3.3.1 — Tags que activan URGENCY_BOOST según la rama. */
export const URGENCY_TAGS: {
  readonly in_us: readonly TimeInUSTag[];
  readonly pre_arrival: readonly TravelPlanTag[];
} = {
  in_us: ["menos_6_meses"], // Recién llegado
  pre_arrival: ["fecha_confirmada", "este_ano"], // Viaje inminente
};

/**
 * Mapeo interés → módulo, derivado de §3.3 (mapeo a módulo principal) y
 * §3.2 paso 4. `licencia_conducir` → M2 porque las citas de licencia de
 * manejo viven en M2 según la tabla §6. `other` no mapea a ningún módulo
 * (§3.2.1: el texto libre viaja aparte y no puntúa).
 */
export const INTEREST_MODULE_MAP: Record<
  Exclude<InterestTag, "other">,
  ModuleId
> = {
  legal_tramites: 2,
  empresa_llc: 4,
  finanzas: 3,
  certificaciones: 6,
  familia_educacion: 5,
  empleo: 7,
  comunidad_local: 5,
  licencia_conducir: 2,
  visa_preparacion: 2,
  vida_en_usa: 5,
  finanzas_prellegada: 3,
};

/** §3.3.1 paso 7 — el piloto Utah activa PILOT_BOOST cuando stateUS === PILOT_STATE. */
export const PILOT_STATE = "UT";

/** §3.3.1 paso 7 — módulos que reciben PILOT_BOOST (Comunidad y Academia). */
export const PILOT_MODULES: readonly ModuleId[] = [5, 6];

/** §3.3.1 paso 8 + §3.2 paso 3.5 (modo dual) — módulo que recibe FAMILY_BOOST cuando seekingFor ≠ 'self'. */
export const FAMILY_MODULE: ModuleId = 2;
