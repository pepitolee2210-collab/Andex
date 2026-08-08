/**
 * MODO DEMO — implementación del DataStore sin backend.
 * Persistencia en localStorage (navegador) para poder recorrer el embudo
 * completo sin credenciales de Supabase/Stripe.
 *
 * Contrato en ./contract.ts — no cambiar firmas sin actualizar el brief.
 *
 * Reglas de esta implementación:
 *   · Single-user: hay un solo perfil por navegador (no hay multi-cuenta).
 *   · Seguro ante SSR: sin `window`, los getters devuelven null y los
 *     setters son no-op. Nada de esto lanza en el servidor salvo las
 *     mutaciones que DEBEN devolver estado (updateProfile, cancel/reactivate),
 *     que sí lanzan con un mensaje explícito.
 *   · Todo es síncrono envuelto en promesas ya resueltas: la UI puede
 *     `await` sin latencia perceptible.
 *   · localStorage corrupto o lleno nunca rompe la app: se degrada a null.
 */

import { PRICES } from "@/lib/config";
import type {
  AnalyticsEventName,
  AnalyticsProps,
  LocationContext,
  ModuleBehavior,
  ModuleId,
  PlanType,
  StoredProfile,
  SubscriptionInfo,
  WizardState,
} from "@/lib/types";
import type {
  ConsentRecord,
  DataStore,
  InterestSignal,
  LocationTransition,
  StoredRanking,
} from "./contract";

// ─── Claves de almacenamiento ────────────────────────────

const PREFIX = "andex_demo_";

const KEYS = {
  wizard: `${PREFIX}wizard`,
  profile: `${PREFIX}profile`,
  ranking: `${PREFIX}ranking`,
  signals: `${PREFIX}signals`,
  subscription: `${PREFIX}subscription`,
  consents: `${PREFIX}consents`,
  contextChanges: `${PREFIX}context_changes`,
  /** Buffer circular de analítica (§7.5). Nombre fijado por el brief. */
  events: `${PREFIX}events`,
} as const;

/** Tope del buffer circular de eventos. */
const EVENT_BUFFER_SIZE = 500;

// ─── Registros auxiliares que solo existen en modo demo ──

type DemoEvent = {
  name: AnalyticsEventName;
  props: AnalyticsProps | null;
  at: string; // ISO
};

type DemoConsent = ConsentRecord & { grantedAt: string };

type DemoInterestSignal = InterestSignal & { createdAt: string };

/** Espejo de `location_context_changes` (§7.2) en el navegador. */
type DemoContextChange = {
  fromContext: LocationContext | null;
  toContext: LocationContext;
  fromScope: string | null;
  toScope: string | null;
  trigger: LocationTransition["trigger"];
  changedAt: string;
};

// ─── Acceso a localStorage, blindado ─────────────────────

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function read<T>(key: string): T | null {
  if (!hasStorage()) return null; // SSR: sin datos, sin excepciones
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    // JSON corrupto o acceso denegado (modo privado): tratar como vacío
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (!hasStorage()) return; // SSR: no-op
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // QuotaExceededError u origen sin storage: la app sigue funcionando
  }
}

function remove(key: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignorar */
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Suma meses conservando el día; `Date` normaliza el desbordamiento. */
function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── Implementación ──────────────────────────────────────

export function createDemoStore(): DataStore {
  // ── Wizard (guardado parcial §3.2 regla 1) ──

  function getWizardState(): Promise<WizardState | null> {
    return Promise.resolve(read<WizardState>(KEYS.wizard));
  }

  function saveWizardState(state: WizardState): Promise<void> {
    write(KEYS.wizard, { ...state, updatedAt: nowIso() });
    return Promise.resolve();
  }

  function clearWizardState(): Promise<void> {
    remove(KEYS.wizard);
    return Promise.resolve();
  }

  // ── Perfil ──

  function getProfile(): Promise<StoredProfile | null> {
    return Promise.resolve(read<StoredProfile>(KEYS.profile));
  }

  function saveProfile(profile: StoredProfile): Promise<void> {
    const existing = read<StoredProfile>(KEYS.profile);
    write(KEYS.profile, {
      ...profile,
      createdAt: existing?.createdAt ?? profile.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    });
    return Promise.resolve();
  }

  function updateProfile(patch: Partial<StoredProfile>): Promise<StoredProfile> {
    const current = read<StoredProfile>(KEYS.profile);
    if (!current) {
      return Promise.reject(
        new Error(
          "No hay perfil que actualizar en modo demo. Guarda el perfil " +
            "completo con saveProfile() al terminar la entrevista.",
        ),
      );
    }
    const next: StoredProfile = { ...current, ...patch, updatedAt: nowIso() };
    write(KEYS.profile, next);
    return Promise.resolve(next);
  }

  // ── Ranking (§3.3.1) y contadores de comportamiento (§3.3.2) ──

  function getRanking(): Promise<StoredRanking | null> {
    return Promise.resolve(read<StoredRanking>(KEYS.ranking));
  }

  function saveRanking(ranking: StoredRanking): Promise<void> {
    // Los contadores de comportamiento sobreviven al recálculo: son historia
    // de uso, no resultado del motor. Se conserva lo ya acumulado y se
    // completa con lo que traiga el ranking nuevo.
    const previous = read<StoredRanking>(KEYS.ranking);
    const merged = mergeBehavior(previous?.behavior ?? [], ranking.behavior ?? []);
    write(KEYS.ranking, {
      scores: ranking.scores,
      behavior: merged,
      computedAt: ranking.computedAt ?? nowIso(),
    } satisfies StoredRanking);
    return Promise.resolve();
  }

  function registerModuleOpen(moduleId: ModuleId): Promise<void> {
    bumpBehavior(moduleId, (b) => ({
      ...b,
      openCount: b.openCount + 1,
      // Abrir un módulo reinicia su racha de "recomendado y no abierto" (§3.3.2)
      sessionsWithoutOpen: 0,
    }));
    return Promise.resolve();
  }

  function registerHeroDismiss(moduleId: ModuleId): Promise<number> {
    // §4.7: a los 3 descartes la hero card se oculta 7 días.
    const updated = bumpBehavior(moduleId, (b) => ({
      ...b,
      dismissedCount: b.dismissedCount + 1,
    }));
    return Promise.resolve(updated.dismissedCount);
  }

  // ── Señales de interés (placeholder §4.6) ──

  function submitInterestSignal(signal: InterestSignal): Promise<void> {
    const list = read<DemoInterestSignal[]>(KEYS.signals) ?? [];
    list.push({ ...signal, createdAt: nowIso() });
    write(KEYS.signals, list);
    return Promise.resolve();
  }

  // ── Suscripción (§3.4.7) ──

  function getSubscription(): Promise<SubscriptionInfo | null> {
    return Promise.resolve(read<SubscriptionInfo>(KEYS.subscription));
  }

  function activateDemoSubscription(plan: PlanType): Promise<SubscriptionInfo> {
    const start = new Date();
    const end = addMonths(start, plan === "annual" ? 12 : 1);
    const sub: SubscriptionInfo = {
      plan,
      status: "active",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: end.toISOString(),
      priceUsd: plan === "annual" ? PRICES.annual.usd : PRICES.monthly.usd,
    };
    write(KEYS.subscription, sub);
    return Promise.resolve(sub);
  }

  function cancelSubscription(): Promise<SubscriptionInfo> {
    const current = read<SubscriptionInfo>(KEYS.subscription);
    if (!current) {
      return Promise.reject(new Error("No hay suscripción activa que cancelar."));
    }
    // §3.4.7: cancelar NO corta el acceso — se mantiene hasta
    // current_period_end. El estado sigue siendo 'active'.
    const next: SubscriptionInfo = { ...current, cancelAtPeriodEnd: true };
    write(KEYS.subscription, next);
    return Promise.resolve(next);
  }

  function reactivateSubscription(): Promise<SubscriptionInfo> {
    const current = read<SubscriptionInfo>(KEYS.subscription);
    if (!current) {
      return Promise.reject(new Error("No hay suscripción que reactivar."));
    }
    // §3.4.7: "Vuelve a su ranking anterior, sin repetir la entrevista"
    // — el ranking nunca se borró, así que basta con revertir la cancelación.
    const next: SubscriptionInfo = {
      ...current,
      cancelAtPeriodEnd: false,
      status: "active",
    };
    write(KEYS.subscription, next);
    return Promise.resolve(next);
  }

  // ── Cumplimiento (§3.4.6) ──

  function recordConsent(consent: ConsentRecord): Promise<void> {
    // Histórico acumulado: un consentimiento no se edita, se añade otro.
    const list = read<DemoConsent[]>(KEYS.consents) ?? [];
    list.push({ ...consent, grantedAt: nowIso() });
    write(KEYS.consents, list);
    return Promise.resolve();
  }

  // ── Transición de contexto (§3.2.3) con coherencia (§3.2.2) ──

  function recordLocationTransition(t: LocationTransition): Promise<StoredProfile> {
    const current = read<StoredProfile>(KEYS.profile);
    if (!current) {
      return Promise.reject(
        new Error(
          "No hay perfil que migrar. La transición de contexto exige un " +
            "perfil guardado (entrevista completada o saltada).",
        ),
      );
    }

    const fromContext = current.locationContext;
    const fromScope =
      fromContext === "in_us" ? current.stateUS : current.countryOfResidence;

    // §3.2.2 regla dura: nunca estado de EE. UU. y país extranjero a la vez.
    // Al cambiar de rama se limpian los campos de la rama anterior.
    const next: StoredProfile =
      t.toContext === "in_us"
        ? {
            ...current,
            locationContext: "in_us",
            stateUS: t.stateUS ?? null,
            estimatedArrivalDate: t.arrivalDate ?? current.estimatedArrivalDate,
            // Campos de la rama B que dejan de aplicar
            countryOfResidence: null,
            countryOther: null,
            travelPlan: null,
            nationality: null,
            updatedAt: nowIso(),
          }
        : {
            ...current,
            locationContext: "pre_arrival",
            // El país es OBLIGATORIO en esta rama: de él dependen el consulado
            // aplicable de M2, la zona horaria y la moneda de referencia (C.4).
            // Si la transición no lo trae, se conserva el que hubiera.
            countryOfResidence:
              t.countryOfResidence ?? current.countryOfResidence,
            // Campos de la rama A que dejan de aplicar
            stateUS: null,
            city: null,
            timeInUS: null,
            // La fecha estimada de llegada sigue siendo válida en pre_arrival
            estimatedArrivalDate: t.arrivalDate ?? current.estimatedArrivalDate,
            updatedAt: nowIso(),
          };

    write(KEYS.profile, next);

    // Log del cambio — espejo de `location_context_changes` (§7.2)
    const log = read<DemoContextChange[]>(KEYS.contextChanges) ?? [];
    log.push({
      fromContext,
      toContext: t.toContext,
      fromScope: fromScope ?? null,
      toScope:
        t.toContext === "in_us"
          ? (t.stateUS ?? null)
          : (next.countryOfResidence ?? null),
      trigger: t.trigger,
      changedAt: nowIso(),
    });
    write(KEYS.contextChanges, log);

    return Promise.resolve(next);
  }

  // ── Analítica (§7.5) ──

  function trackEvent(
    name: AnalyticsEventName,
    props?: AnalyticsProps,
  ): Promise<void> {
    const event: DemoEvent = { name, props: props ?? null, at: nowIso() };

    // Visible en la consola del navegador para depurar el embudo sin backend.
    if (typeof console !== "undefined") {
      console.debug("[andex:event]", name, props ?? {});
    }

    const buffer = read<DemoEvent[]>(KEYS.events) ?? [];
    buffer.push(event);
    // Buffer circular: se descartan los más antiguos.
    const trimmed =
      buffer.length > EVENT_BUFFER_SIZE
        ? buffer.slice(buffer.length - EVENT_BUFFER_SIZE)
        : buffer;
    write(KEYS.events, trimmed);

    return Promise.resolve();
  }

  return {
    getWizardState,
    saveWizardState,
    clearWizardState,
    getProfile,
    saveProfile,
    updateProfile,
    getRanking,
    saveRanking,
    registerModuleOpen,
    registerHeroDismiss,
    submitInterestSignal,
    getSubscription,
    cancelSubscription,
    reactivateSubscription,
    activateDemoSubscription,
    recordConsent,
    recordLocationTransition,
    trackEvent,
  };
}

// ─── Helpers de comportamiento ───────────────────────────

function emptyBehavior(moduleId: ModuleId): ModuleBehavior {
  return { moduleId, openCount: 0, dismissedCount: 0, sessionsWithoutOpen: 0 };
}

/** Conserva los contadores previos y añade los módulos que falten. */
function mergeBehavior(
  previous: ModuleBehavior[],
  incoming: ModuleBehavior[],
): ModuleBehavior[] {
  const byId = new Map<ModuleId, ModuleBehavior>();
  for (const b of previous) byId.set(b.moduleId, b);
  for (const b of incoming) {
    const prev = byId.get(b.moduleId);
    byId.set(
      b.moduleId,
      prev
        ? {
            moduleId: b.moduleId,
            // Nunca perder historia: se queda el contador más alto.
            openCount: Math.max(prev.openCount, b.openCount),
            dismissedCount: Math.max(prev.dismissedCount, b.dismissedCount),
            sessionsWithoutOpen: b.sessionsWithoutOpen,
          }
        : b,
    );
  }
  return [...byId.values()];
}

/**
 * Aplica una mutación al contador de un módulo y persiste el ranking.
 * Si aún no hay ranking guardado, crea uno vacío: los contadores se pueden
 * acumular antes de que el motor haya corrido.
 */
function bumpBehavior(
  moduleId: ModuleId,
  mutate: (b: ModuleBehavior) => ModuleBehavior,
): ModuleBehavior {
  const ranking = read<StoredRanking>(KEYS.ranking) ?? {
    scores: [],
    behavior: [],
    computedAt: nowIso(),
  };
  const behavior = ranking.behavior ?? [];
  const index = behavior.findIndex((b) => b.moduleId === moduleId);
  const base = index >= 0 ? behavior[index] : emptyBehavior(moduleId);
  const updated = mutate(base);

  const nextBehavior =
    index >= 0
      ? behavior.map((b, i) => (i === index ? updated : b))
      : [...behavior, updated];

  write(KEYS.ranking, { ...ranking, behavior: nextBehavior });
  return updated;
}
