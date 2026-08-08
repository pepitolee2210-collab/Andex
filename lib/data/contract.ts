/**
 * ANDEX — Contrato de la capa de datos.
 *
 * TODO acceso a datos desde UI pasa por getDataStore() (lib/data/index.ts).
 * Hay dos implementaciones intercambiables:
 *   - demo-store.ts     → sin credenciales: localStorage + cookie de sesión demo
 *   - supabase-store.ts → producción: Supabase (PostgreSQL + RLS)
 *
 * PROHIBIDO llamar a Supabase directamente desde componentes.
 * Excepción única: el webhook de Stripe (app/api/webhooks/stripe) escribe
 * con el cliente admin de servicio, fuera de este contrato.
 */

import type {
  AnalyticsEventName,
  AnalyticsProps,
  LocationContext,
  ModuleBehavior,
  ModuleId,
  ModuleScore,
  PlanType,
  StoredProfile,
  SubscriptionInfo,
  WizardState,
} from "@/lib/types";

/** Ranking persistido (§3.3.1: se persiste, no se recalcula en cada carga). */
export type StoredRanking = {
  scores: ModuleScore[]; // los 7, orden desc
  behavior: ModuleBehavior[]; // contadores del re-ranking §3.3.2
  computedAt: string; // ISO
};

export type InterestSignal = {
  moduleId: ModuleId;
  freeText: string | null;
  wantsNotification: boolean;
};

export type ConsentRecord = {
  type: "terms" | "privacy" | "marketing";
  version: string;
  granted: boolean;
};

export type LocationTransition = {
  toContext: LocationContext;
  /** Estado de llegada cuando to = in_us ("¿Ya llegaste?" §3.2.3). */
  stateUS?: string;
  /**
   * País de residencia cuando to = pre_arrival (el usuario vuelve a salir de
   * EE. UU., solo desde /perfil). Sin este dato el perfil quedaría sin país
   * y los enlaces consulares del M2 no podrían resolverse.
   */
  countryOfResidence?: string;
  arrivalDate?: string; // ISO date
  trigger: "banner" | "profile" | "notification";
};

export interface DataStore {
  // ── Wizard (guardado parcial §3.2 regla 1) ──
  getWizardState(): Promise<WizardState | null>;
  saveWizardState(state: WizardState): Promise<void>;
  clearWizardState(): Promise<void>;

  // ── Perfil ──
  getProfile(): Promise<StoredProfile | null>;
  /** Crea o reemplaza el perfil completo (fin del wizard o skip). */
  saveProfile(profile: StoredProfile): Promise<void>;
  /** Edición parcial desde /perfil. El caller recalcula ranking si §3.3.1 lo exige. */
  updateProfile(patch: Partial<StoredProfile>): Promise<StoredProfile>;

  // ── Ranking ──
  getRanking(): Promise<StoredRanking | null>;
  saveRanking(ranking: StoredRanking): Promise<void>;
  /** +2 al abrir (tope +20 acumulado) — la implementación solo persiste contadores. */
  registerModuleOpen(moduleId: ModuleId): Promise<void>;
  /** Devuelve el dismissed_count resultante (a las 3 se oculta la hero card §4.7). */
  registerHeroDismiss(moduleId: ModuleId): Promise<number>;

  // ── Señales de interés (placeholder §4.6) ──
  submitInterestSignal(signal: InterestSignal): Promise<void>;

  // ── Suscripción (§3.4.7) ──
  getSubscription(): Promise<SubscriptionInfo | null>;
  /** Cancelación en un clic: marca cancel_at_period_end. Acceso hasta period_end. */
  cancelSubscription(): Promise<SubscriptionInfo>;
  reactivateSubscription(): Promise<SubscriptionInfo>;
  /** SOLO modo demo: simula el alta tras el checkout simulado. */
  activateDemoSubscription?(plan: PlanType): Promise<SubscriptionInfo>;

  // ── Cumplimiento (§3.4.6) ──
  recordConsent(consent: ConsentRecord): Promise<void>;

  // ── Transición de contexto (§3.2.3) ──
  /** Migra el contexto, limpia campos incoherentes (§3.2.2) y registra el cambio. */
  recordLocationTransition(t: LocationTransition): Promise<StoredProfile>;

  // ── Analítica (§7.5) ──
  trackEvent(name: AnalyticsEventName, props?: AnalyticsProps): Promise<void>;
}
