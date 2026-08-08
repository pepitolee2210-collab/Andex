/**
 * ANDEX — Motor de recomendación (§3.3, ANDEX-PRD-v1.3-FINAL).
 *
 * Módulo PURO (§7.1 del brief): sin UI, sin capa de datos, sin i18n; solo
 * importa de lib/types y lib/catalogs/modules. Devuelve ReasonCode
 * estructurado, NUNCA copy — el diccionario i18n lo convierte en texto.
 * Será sustituible por una API de IA en Fase 2 sin tocar el frontend.
 *
 * API pública mínima: `rankModules`, `applyBehaviorAdjustments` y los tipos
 * del dominio re-exportados desde lib/types.
 */

import type {
  InterestTag,
  LocationContext,
  ModuleId,
  ModuleScore,
  ProfileInput,
  ReasonCode,
  SituationTag,
} from "@/lib/types";
import { DEFAULT_ORDER, MODULE_IDS } from "@/lib/catalogs/modules";
import {
  BASE_RELEVANCE,
  FAMILY_MODULE,
  INTEREST_MODULE_MAP,
  PILOT_MODULES,
  PILOT_STATE,
  SITUATION_BOOSTS_IN_US,
  SITUATION_BOOSTS_PRE,
  URGENCY_TAGS,
  WEIGHTS,
} from "@/lib/recommendation-engine/constants";

export { applyBehaviorAdjustments } from "@/lib/recommendation-engine/behavior";
export type {
  ModuleBehavior,
  ModuleScore,
  ProfileInput,
  ReasonCode,
} from "@/lib/types";

/**
 * Prioridad del ReasonCode ante EMPATE de contribución individual
 * (p. ej. interés adicional +15 vs FAMILY_BOOST +15 → gana interest).
 * Orden fijado: goal > interest > situation > family > urgency > pilot >
 * context_default.
 */
const REASON_PRIORITY: Record<ReasonCode["type"], number> = {
  goal: 0,
  interest: 1,
  situation: 2,
  family: 3,
  urgency: 4,
  pilot: 5,
  context_default: 6,
};

/** Contribución individual aplicada a un módulo durante el cálculo. */
type Contribution = {
  amount: number;
  reason: ReasonCode;
};

/** Interés → módulo destino; `other` no mapea a ninguno (§3.2.1). */
function moduleForInterest(tag: InterestTag): ModuleId | null {
  return tag === "other" ? null : INTEREST_MODULE_MAP[tag];
}

/**
 * Módulos que refuerza la situación del paso 3 según la rama (§3.3.1).
 * `other`, `null` o una situación que no exista en la tabla de SU rama
 * (incoherencia §3.2.2) no refuerzan nada: la rama manda.
 */
function situationBoostTargets(
  context: LocationContext,
  situation: SituationTag | "other" | null | undefined,
): readonly ModuleId[] {
  if (!situation || situation === "other") return [];
  const table: Readonly<Partial<Record<SituationTag, readonly ModuleId[]>>> =
    context === "in_us" ? SITUATION_BOOSTS_IN_US : SITUATION_BOOSTS_PRE;
  return table[situation] ?? [];
}

/** §3.3.1 paso 6 — ¿el perfil trae el tag de urgencia de su rama? */
function urgencyApplies(input: ProfileInput): boolean {
  if (input.locationContext === "in_us") {
    return input.timeInUS != null && URGENCY_TAGS.in_us.includes(input.timeInUS);
  }
  return (
    input.travelPlan != null &&
    URGENCY_TAGS.pre_arrival.includes(input.travelPlan)
  );
}

/** Módulo con mayor BASE_RELEVANCE del contexto (ante empate, menor id). */
function topBaseModule(context: LocationContext): ModuleId {
  const base = BASE_RELEVANCE[context];
  let top: ModuleId = MODULE_IDS[0];
  for (const id of MODULE_IDS) {
    if (base[id] > base[top]) top = id;
  }
  return top;
}

/**
 * §3.3.1 paso 6 — destino del URGENCY_BOOST. El PRD no fija el módulo;
 * decisión documentada: la urgencia refuerza la necesidad más inmediata ya
 * identificada — el PRIMER módulo de la lista de la situación (las listas
 * del PRD están ordenadas por prioridad); sin situación aplicable, el
 * módulo de mayor BASE_RELEVANCE del contexto (in_us → M1 Bóveda,
 * pre_arrival → M2 Migración).
 */
function urgencyTarget(
  context: LocationContext,
  situationTargets: readonly ModuleId[],
): ModuleId {
  if (situationTargets.length > 0) return situationTargets[0];
  return topBaseModule(context);
}

/**
 * Elige el ReasonCode del módulo: la MAYOR contribución individual; ante
 * empate de monto decide REASON_PRIORITY; ante empate total, la primera
 * aplicada (la lista conserva el orden de aplicación). Sin contribuciones
 * → context_default.
 */
function pickReason(
  contributions: readonly Contribution[],
  context: LocationContext,
): ReasonCode {
  if (contributions.length === 0) {
    return { type: "context_default", context };
  }
  let best = contributions[0];
  for (const c of contributions) {
    if (
      c.amount > best.amount ||
      (c.amount === best.amount &&
        REASON_PRIORITY[c.reason.type] < REASON_PRIORITY[best.reason.type])
    ) {
      best = c;
    }
  }
  return best.reason;
}

/** Posición del módulo en el orden por defecto del contexto (§3.3.1). */
function defaultPosition(context: LocationContext, id: ModuleId): number {
  return DEFAULT_ORDER[context].indexOf(id);
}

/**
 * §3.3.1 — Motor de reglas v1. Calcula el score de los 7 módulos desde
 * BASE_RELEVANCE[locationContext] + pesos, normaliza a 0–100 y devuelve
 * SIEMPRE los 7 ordenados desc con `reason` y
 * `contentVariant = input.locationContext`. La relevancia baja hunde un
 * módulo al fondo, nunca lo elimina (§0.4: la personalización ordena y
 * enfatiza, jamás oculta).
 *
 * Decisiones deterministas documentadas:
 * - Normalización (paso 9): `round(100 × raw / max_raw)`; si max_raw es 0,
 *   todos quedan en 0. El orden se decide sobre el raw (mayor precisión);
 *   el score expuesto es el normalizado.
 * - Desempate (paso 10): menor id (orden canónico). EXCEPCIÓN razonada:
 *   cuando ninguna señal contribuyó (perfil solo con contexto, §4.7), el
 *   desempate es la posición en DEFAULT_ORDER, porque el desempate por id
 *   puro NO reproduce los órdenes por defecto que §3.3.1 declara
 *   (in_us [1,7,5,3,2,4,6], pre_arrival [2,6,1,3,5,4,7]) y el PRD manda.
 * - IMMEDIATE_GOAL 'custom' y el interés 'other' no puntúan a ningún módulo.
 *   Si el PRIMER interés es 'other', su peso primario se pierde: la posición
 *   en el array decide el peso (§3.3.1 paso 3, lectura literal).
 */
export function rankModules(input: ProfileInput): ModuleScore[] {
  const context = input.locationContext;

  // Paso 1 — inicializar los 7 módulos con la base del contexto.
  const raw: Record<ModuleId, number> = { ...BASE_RELEVANCE[context] };
  const contributions: Record<ModuleId, Contribution[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [],
  };
  let signalCount = 0;

  const add = (moduleId: ModuleId, amount: number, reason: ReasonCode): void => {
    raw[moduleId] += amount;
    contributions[moduleId].push({ amount, reason });
    signalCount += 1;
  };

  // Paso 2 — IMMEDIATE_GOAL al módulo mapeado del paso 5 ('custom' no suma).
  const goal = input.immediateGoal;
  if (goal && goal !== "custom") {
    const target = moduleForInterest(goal);
    if (target !== null) {
      add(target, WEIGHTS.IMMEDIATE_GOAL, { type: "goal", goal });
    }
  }

  // Pasos 3 y 4 — PRIMARY_INTEREST al primer interés del array,
  // OTHER_INTEREST a cada interés adicional.
  const interests = input.interests ?? [];
  interests.forEach((interest, index) => {
    const target = moduleForInterest(interest);
    if (target === null) return;
    const amount =
      index === 0 ? WEIGHTS.PRIMARY_INTEREST : WEIGHTS.OTHER_INTEREST;
    add(target, amount, { type: "interest", interest });
  });

  // Paso 5 — SITUATION_BOOST a cada módulo listado para la situación de la rama.
  const situationTargets = situationBoostTargets(context, input.situation);
  if (input.situation && input.situation !== "other") {
    const situation = input.situation;
    for (const target of situationTargets) {
      add(target, WEIGHTS.SITUATION_BOOST, { type: "situation", situation });
    }
  }

  // Paso 6 — URGENCY_BOOST si el tag de urgencia de la rama aplica.
  if (urgencyApplies(input)) {
    add(urgencyTarget(context, situationTargets), WEIGHTS.URGENCY_BOOST, {
      type: "urgency",
      context,
    });
  }

  // Paso 7 — PILOT_BOOST: Utah refuerza M5 y M6.
  if (input.stateUS === PILOT_STATE) {
    for (const target of PILOT_MODULES) {
      add(target, WEIGHTS.PILOT_BOOST, { type: "pilot" });
    }
  }

  // Paso 8 — FAMILY_BOOST a M2 si seekingFor ≠ 'self' (modo dual, §3.2 paso 3.5).
  if (input.seekingFor && input.seekingFor !== "self") {
    add(FAMILY_MODULE, WEIGHTS.FAMILY_BOOST, { type: "family" });
  }

  // Paso 9 — normalizar a 0–100.
  const maxRaw = Math.max(...MODULE_IDS.map((id) => raw[id]));
  const hasSignals = signalCount > 0;

  const entries = MODULE_IDS.map((id) => ({
    moduleId: id,
    rawScore: raw[id],
    score: maxRaw > 0 ? Math.round((100 * raw[id]) / maxRaw) : 0,
    reason: pickReason(contributions[id], context),
    contentVariant: context,
  }));

  // Pasos 10 y 11 — ordenar desc; desempate: menor id, salvo caso base
  // (sin señales) donde manda DEFAULT_ORDER (ver JSDoc).
  entries.sort((a, b) => {
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    if (hasSignals) return a.moduleId - b.moduleId;
    return defaultPosition(context, a.moduleId) - defaultPosition(context, b.moduleId);
  });

  return entries.map(({ moduleId, score, reason, contentVariant }) => ({
    moduleId,
    score,
    reason,
    contentVariant,
  }));
}
