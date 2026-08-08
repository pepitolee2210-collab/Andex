/**
 * ANDEX — Tipos compartidos del MVP.
 * Fuente: ANDEX-PRD-v1.3-FINAL.md (§3.3.1 ProfileInput/ModuleScore, Anexo C.3 enums,
 * §7.5 eventos de analítica).
 *
 * Regla: este archivo NO importa nada de UI ni de librerías externas.
 * Todos los agentes importan de aquí; nadie redefine estos tipos localmente.
 */

// ─── La bifurcación (§3.2.0) ─────────────────────────────

export type LocationContext = "in_us" | "pre_arrival";

export type Lang = "es" | "en";

// ─── Enums canónicos (Anexo C.3) ─────────────────────────

export type TimeInUSTag =
  | "menos_6_meses"
  | "6m_2a"
  | "2a_5a"
  | "mas_5a"
  | "no_responde";

export type TravelPlanTag =
  | "fecha_confirmada"
  | "este_ano"
  | "explorando"
  | "no_se";

export type SituationTagInUS =
  | "recien_llegado"
  | "tramite_proceso"
  | "permiso_trabajo"
  | "residente"
  | "ciudadano"
  | "visa_temporal"
  | "resolviendo";

export type SituationTagPreArrival =
  | "visa_turismo"
  | "visa_estudiante"
  | "visa_aprobada"
  | "visa_negada"
  | "explorando"
  | "reunificacion"
  | "inversion_remota";

export type SituationTag = SituationTagInUS | SituationTagPreArrival;

export type SeekingFor = "self" | "family" | "both";

/**
 * Intereses del paso 4. Patrón "Otro" (§3.2.1): 'other' es un valor válido
 * del enum; el texto libre viaja aparte en `interestsOther`.
 */
export type InterestTag =
  // Base común (ambas ramas)
  | "legal_tramites"
  | "empresa_llc"
  | "finanzas"
  | "certificaciones"
  | "familia_educacion"
  // Solo rama A (in_us)
  | "empleo"
  | "comunidad_local"
  | "licencia_conducir"
  // Solo rama B (pre_arrival)
  | "visa_preparacion"
  | "vida_en_usa"
  | "finanzas_prellegada"
  | "other";

// ─── Módulos ─────────────────────────────────────────────

export type ModuleId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type ModuleSlug =
  | "boveda"
  | "migracion"
  | "finanzas"
  | "negocio"
  | "comunidad"
  | "academia"
  | "empleo";

export type ModuleStatus = "live" | "coming_soon";

export type ModuleMeta = {
  id: ModuleId;
  slug: ModuleSlug;
  iconName: string; // nombre lucide, ver seed §7.4
  accentColor: string; // token hex del seed §7.4 — solo para superficies, nunca texto
  canonicalOrder: number;
  status: ModuleStatus;
};

// ─── Motor de recomendación (§3.3.1) ─────────────────────

/**
 * El motor es agnóstico de UI: devuelve un código de razón estructurado,
 * NUNCA copy. El diccionario i18n lo convierte en texto
 * ("Porque dijiste que quieres formalizar tu negocio…").
 * En BD (`user_module_ranking.reason`) se persiste como JSON string.
 */
export type ReasonCode =
  | { type: "goal"; goal: InterestTag }
  | { type: "interest"; interest: InterestTag }
  | { type: "situation"; situation: SituationTag }
  | { type: "family" }
  | { type: "urgency"; context: LocationContext }
  | { type: "pilot" }
  | { type: "context_default"; context: LocationContext };

export type ProfileInput = {
  locationContext: LocationContext; // Paso 2 — LA BIFURCACIÓN (único obligatorio)
  stateUS?: string | null; // Rama A. ISO ej. 'UT'
  countryOfResidence?: string | null; // Rama B. ISO ej. 'MX'
  timeInUS?: TimeInUSTag | null; // Rama A
  travelPlan?: TravelPlanTag | null; // Rama B
  situation?: SituationTag | "other" | null; // Paso 3 (opcional, puede declinarse)
  seekingFor?: SeekingFor | null; // Paso 3.5 (default 'self')
  interests?: InterestTag[]; // Paso 4 (el orden importa: [0] = primario)
  immediateGoal?: InterestTag | "custom" | null; // Paso 5 (se genera desde intereses)
};

export type ModuleScore = {
  moduleId: ModuleId;
  score: number; // 0–100 normalizado
  reason: ReasonCode;
  contentVariant: LocationContext; // qué versión del contenido servir
};

/** Contadores de comportamiento para el re-ranking ligero (§3.3.2). */
export type ModuleBehavior = {
  moduleId: ModuleId;
  openCount: number;
  dismissedCount: number;
  /** Sesiones consecutivas sin abrir el módulo recomendado. */
  sessionsWithoutOpen: number;
};

// ─── Perfil persistido y estado del wizard ───────────────

/** Campos que el usuario edita durante la entrevista (borrador y perfil final). */
export type OnboardingDraft = {
  firstName?: string;
  lastName?: string | null;
  email?: string;
  phone?: string | null;
  phoneCountryCode?: string | null;

  locationContext?: LocationContext | null;
  // Rama A — coherencia §3.2.2: nunca conviven con los de rama B
  stateUS?: string | null;
  timeInUS?: TimeInUSTag | null;
  // Rama B
  countryOfResidence?: string | null;
  /** Texto libre de "Mi país no está en la lista" (Anexo C.2), cuando el código es 'XX'. */
  countryOther?: string | null;
  nationality?: string | null;
  travelPlan?: TravelPlanTag | null;

  situation?: SituationTag | "other" | null;
  situationOther?: string | null;
  situationDeclined?: boolean;

  seekingFor?: SeekingFor;

  interests?: InterestTag[];
  interestsOther?: string | null;

  immediateGoal?: InterestTag | "custom" | null;
  immediateGoalCustom?: string | null; // máx 120 caracteres, se muestra literal en el dashboard
};

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type WizardState = {
  currentStep: WizardStep;
  maxStepReached: WizardStep;
  draft: OnboardingDraft;
  startedAt: string; // ISO
  updatedAt: string; // ISO
};

export type StoredProfile = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  phoneCountryCode: string | null;

  locationContext: LocationContext;
  stateUS: string | null;
  city: string | null;
  timeInUS: TimeInUSTag | null;
  countryOfResidence: string | null;
  /** Texto libre de "Mi país no está en la lista" (Anexo C.2), cuando el código es 'XX'. */
  countryOther: string | null;
  nationality: string | null;
  travelPlan: TravelPlanTag | null;
  estimatedArrivalDate: string | null; // ISO date

  situation: SituationTag | "other" | null;
  situationOther: string | null;
  situationDeclined: boolean;
  seekingFor: SeekingFor;
  interests: InterestTag[];
  interestsOther: string | null;
  immediateGoal: InterestTag | "custom" | null;
  immediateGoalCustom: string | null;

  onboardingCompleted: boolean;
  onboardingSkippedAtStep: number | null;
  preferredLanguage: Lang;

  createdAt: string;
  updatedAt: string;
};

// ─── Suscripción (§3.4) ──────────────────────────────────

export type PlanType = "monthly" | "annual";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export type SubscriptionInfo = {
  plan: PlanType;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string; // ISO — al cancelar, acceso hasta esta fecha (§3.4.7)
  priceUsd: number;
};

// ─── Analítica (§7.5 — nombres exactos, no inventar) ─────

export type AnalyticsEventName =
  | "landing_viewed"
  | "landing_cta_clicked"
  /**
   * Añadido fuera de la tabla §7.5: la tabla de requisitos de §3.1.1 pide
   * "evento por sección vista y por CTA", pero §7.5 solo listó el de CTA.
   * Props: { section }. Ver docs/DECISIONES.md D24.
   */
  | "landing_section_viewed"
  | "onboarding_started"
  | "onboarding_step_completed"
  | "onboarding_abandoned"
  | "onboarding_completed"
  | "onboarding_skipped"
  | "location_branch_selected"
  | "location_scope_selected"
  | "other_option_used"
  | "situation_declined"
  | "seeking_for_selected"
  | "location_context_changed"
  | "transition_banner_shown"
  | "transition_banner_clicked"
  | "ranking_computed"
  | "paywall_viewed"
  | "plan_selected"
  | "checkout_started"
  | "checkout_method_chosen"
  | "checkout_abandoned"
  | "payment_succeeded"
  | "payment_failed"
  | "subscription_canceled"
  | "hero_card_clicked"
  | "hero_card_dismissed"
  | "module_opened"
  | "interest_signal_submitted";

export type AnalyticsProps = Record<
  string,
  string | number | boolean | null | undefined
>;
