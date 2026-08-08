/**
 * Lógica de ranking del dashboard — helpers PUROS + persistencia local de lo
 * que el esquema §7.2 todavía no guarda.
 *
 * Reparto de responsabilidades (§7.1: el motor no conoce la UI):
 *   · `lib/recommendation-engine` calcula (rankModules + applyBehaviorAdjustments).
 *   · `lib/data` persiste (getRanking / saveRanking / contadores).
 *   · Este archivo une las dos piezas y aplica las reglas de pantalla de §4.7.
 *
 * Por qué se REEJECUTA `rankModules` al iniciar sesión en vez de re-ajustar el
 * ranking guardado: `applyBehaviorAdjustments` no es idempotente — un −25 por
 * descarte aplicado sobre un score ya ajustado se restaría otra vez en cada
 * sesión hasta hundir el módulo a 0. El motor es una función pura y barata, así
 * que la base se recalcula del perfil y el ajuste se aplica UNA vez sobre esa
 * base. El resultado se persiste y el resto de la sesión se lee de ahí
 * (§3.3.1: "no se recalcula en cada carga"; §3.3.2: "corre al iniciar sesión").
 */

import type {
  LocationContext,
  ModuleBehavior,
  ModuleId,
  ModuleScore,
  ProfileInput,
  StoredProfile,
} from "@/lib/types";
import type { StoredRanking } from "@/lib/data";
import { DEFAULT_ORDER, MODULE_IDS } from "@/lib/catalogs/modules";
import { applyBehaviorAdjustments, rankModules } from "@/lib/recommendation-engine";

// ── Reglas de §4.7 y §3.3.2 ──────────────────────────────

/** §4.7 — a los 3 descartes la hero card se oculta. */
export const HERO_DISMISS_LIMIT = 3;
/** §4.7 — durante 7 días; mientras tanto, grid plano. */
export const HERO_HIDE_DAYS = 7;

/**
 * Claves de navegador propias del panel.
 *
 * `heroHiddenUntil` y `openSnapshot` NO tienen columna en §7.2. Se guardan en
 * el navegador para que las reglas de §4.7 y §3.3.2 funcionen hoy; la decisión
 * y las columnas que hacen falta están en el reporte del agente Dashboard.
 */
const KEYS = {
  heroHiddenUntil: "andex_panel_hero_hidden_until",
  openSnapshot: "andex_panel_open_snapshot",
  sessionRanked: "andex_panel_session_ranked",
} as const;

// ── Acceso blindado al almacenamiento (mismo criterio que demo-store) ──

function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* almacenamiento lleno o bloqueado: la app sigue funcionando */
  }
}

function readSession(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* ignorar */
  }
}

// ── Perfil → entrada del motor ───────────────────────────

/**
 * §3.3.1 — entrada del motor a partir del perfil persistido. "Prefiero no
 * responder" (§3.2 paso 3) viaja como situación nula, nunca como tag.
 * El orden de `interests` se conserva: `[0]` es el interés principal (D14).
 */
export function profileInputFrom(profile: StoredProfile): ProfileInput {
  return {
    locationContext: profile.locationContext,
    stateUS: profile.stateUS,
    countryOfResidence: profile.countryOfResidence,
    timeInUS: profile.timeInUS,
    travelPlan: profile.travelPlan,
    situation: profile.situationDeclined ? null : profile.situation,
    seekingFor: profile.seekingFor,
    interests: profile.interests,
    immediateGoal: profile.immediateGoal,
  };
}

/** Contadores en blanco para los 7 módulos. */
export function emptyBehavior(): ModuleBehavior[] {
  return MODULE_IDS.map((moduleId) => ({
    moduleId,
    openCount: 0,
    dismissedCount: 0,
    sessionsWithoutOpen: 0,
  }));
}

/**
 * §4.7 — orden por defecto del contexto, con score 0 y razón genérica.
 * Red de seguridad cuando no hay ranking guardado ni perfil rankeable: los 7
 * módulos SIEMPRE se muestran completos (§0.4), nunca una pantalla vacía.
 */
export function fallbackScores(context: LocationContext): ModuleScore[] {
  return DEFAULT_ORDER[context].map((moduleId) => ({
    moduleId,
    score: 0,
    reason: { type: "context_default", context } as const,
    contentVariant: context,
  }));
}

/** Base del motor + ajuste por comportamiento, en ese orden y una sola vez. */
export function computeScores(
  profile: StoredProfile,
  behavior: ModuleBehavior[],
): ModuleScore[] {
  const base = rankModules(profileInputFrom(profile));
  return applyBehaviorAdjustments(base, behavior);
}

/** Contadores completos: los guardados, más los módulos que falten. */
export function normalizeBehavior(
  behavior: readonly ModuleBehavior[] | undefined,
): ModuleBehavior[] {
  const byId = new Map<ModuleId, ModuleBehavior>();
  for (const b of behavior ?? []) byId.set(b.moduleId, b);
  return MODULE_IDS.map(
    (moduleId) =>
      byId.get(moduleId) ?? {
        moduleId,
        openCount: 0,
        dismissedCount: 0,
        sessionsWithoutOpen: 0,
      },
  );
}

// ── Re-ranking de inicio de sesión (§3.3.2) ──────────────

type OpenSnapshot = Partial<Record<ModuleId, number>>;

function readOpenSnapshot(): OpenSnapshot {
  const raw = readLocal(KEYS.openSnapshot);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as OpenSnapshot)
      : {};
  } catch {
    return {};
  }
}

function writeOpenSnapshot(behavior: readonly ModuleBehavior[]): void {
  const snapshot: OpenSnapshot = {};
  for (const b of behavior) snapshot[b.moduleId] = b.openCount;
  writeLocal(KEYS.openSnapshot, JSON.stringify(snapshot));
}

/** ¿Es la primera carga del panel en esta sesión de navegador? */
export function isFirstLoadOfSession(): boolean {
  return readSession(KEYS.sessionRanked) !== "1";
}

export function markSessionRanked(): void {
  writeSession(KEYS.sessionRanked, "1");
}

/**
 * §3.3.2 — "No abrir el módulo recomendado en 3 sesiones consecutivas le resta
 * −10". Nadie más incrementa `sessionsWithoutOpen`: se hace aquí, al arrancar
 * la sesión, comparando el `openCount` del módulo que estuvo recomendado
 * contra el que tenía al cerrar la sesión anterior.
 */
export function bumpSessionsWithoutOpen(
  behavior: readonly ModuleBehavior[],
  previousTopModule: ModuleId | null,
): ModuleBehavior[] {
  const snapshot = readOpenSnapshot();
  const next = behavior.map((b) => {
    if (previousTopModule === null || b.moduleId !== previousTopModule) return { ...b };
    const before = snapshot[b.moduleId];
    // Sin foto previa (primera sesión) no se penaliza: no hay historia que juzgar.
    if (before === undefined) return { ...b };
    return b.openCount > before
      ? { ...b, sessionsWithoutOpen: 0 }
      : { ...b, sessionsWithoutOpen: b.sessionsWithoutOpen + 1 };
  });
  writeOpenSnapshot(next);
  return next;
}

/** Foto de los contadores de apertura para la comparación de la sesión siguiente. */
export function snapshotOpenCounts(behavior: readonly ModuleBehavior[]): void {
  writeOpenSnapshot(behavior);
}

// ── Hero card descartada 3 veces (§4.7) ──────────────────

/** Descartes acumulados de la hero card, sumando todos los módulos. */
export function totalDismissals(behavior: readonly ModuleBehavior[]): number {
  return behavior.reduce((sum, b) => sum + b.dismissedCount, 0);
}

/** ¿La hero card está dentro de su ventana de 7 días oculta? (§4.7) */
export function isHeroHidden(now: Date = new Date()): boolean {
  const raw = readLocal(KEYS.heroHiddenUntil);
  if (!raw) return false;
  const until = new Date(raw);
  if (Number.isNaN(until.getTime())) return false;
  return now.getTime() < until.getTime();
}

/** Oculta la hero card durante `HERO_HIDE_DAYS` a partir de ahora (§4.7). */
export function hideHeroForAWeek(now: Date = new Date()): void {
  const until = new Date(now.getTime());
  until.setDate(until.getDate() + HERO_HIDE_DAYS);
  writeLocal(KEYS.heroHiddenUntil, until.toISOString());
}

/**
 * ¿La hero card debe estar oculta ahora mismo?
 *
 * La ocultación la manda la VENTANA de 7 días, no el contador: si mandara el
 * contador (que nunca baja), a los 3 descartes la hero card desaparecería para
 * siempre y §4.7 dice "por 7 días". El contador solo sirve para ARMAR la
 * ventana la primera vez, o para re-armarla si el navegador la perdió.
 */
export function resolveHeroHidden(totalDismissed: number): boolean {
  if (isHeroHidden()) return true;
  const windowRecorded = readLocal(KEYS.heroHiddenUntil) !== null;
  if (totalDismissed >= HERO_DISMISS_LIMIT && !windowRecorded) {
    hideHeroForAWeek();
    return true;
  }
  return false;
}

// ── Ranking listo para pintar ────────────────────────────

export type PanelRanking = {
  scores: ModuleScore[];
  behavior: ModuleBehavior[];
  computedAt: string;
};

export function toStoredRanking(ranking: PanelRanking): StoredRanking {
  return {
    scores: ranking.scores,
    behavior: ranking.behavior,
    computedAt: ranking.computedAt,
  };
}

/** Posición (0-based) de un módulo en el orden actual — `position_in_grid` de §7.5. */
export function positionOf(scores: readonly ModuleScore[], moduleId: ModuleId): number {
  return scores.findIndex((s) => s.moduleId === moduleId);
}
