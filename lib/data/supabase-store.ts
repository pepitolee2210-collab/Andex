/**
 * PRODUCCIÓN — implementación del DataStore sobre Supabase.
 * Todas las lecturas/escrituras respetan RLS (§7.3): el cliente usa la
 * anon key + sesión del usuario; nunca la service role key.
 *
 * Contrato en ./contract.ts — no cambiar firmas sin actualizar el brief.
 *
 * Mapeo (camelCase de lib/types.ts ↔ snake_case del esquema §7.2):
 *   perfil        → `users` + `user_onboarding_profile`
 *   wizard        → `user_onboarding_profile.current_step` + `branch` + campos
 *   ranking       → `user_module_ranking` (reason = JSON.stringify(ReasonCode))
 *   señales       → `module_interest_signals`
 *   consentimient.→ `user_consents`
 *   transición    → UPDATE `users` + INSERT `location_context_changes`
 *   eventos       → INSERT `analytics_events`
 *   suscripción   → SELECT `subscriptions` (las escrituras llegan por el
 *                   webhook de Stripe; cancel/reactivate pasan por
 *                   POST /api/subscription)
 *
 * El id de usuario SIEMPRE sale de la sesión (auth.getUser()), nunca de un
 * parámetro: así RLS y la aplicación no pueden discrepar.
 */

import { PRICES } from "@/lib/config";
import {
  getSupabaseBrowserClient,
  type AndexSupabaseClient,
} from "@/lib/supabase/client";
import type {
  Database,
  Json,
  UserOnboardingProfileRow,
  UserRow,
} from "@/lib/db-types";
import type {
  AnalyticsEventName,
  AnalyticsProps,
  InterestTag,
  Lang,
  LocationContext,
  ModuleBehavior,
  ModuleId,
  ModuleScore,
  PlanType,
  ReasonCode,
  SeekingFor,
  SituationTag,
  StoredProfile,
  SubscriptionInfo,
  SubscriptionStatus,
  TimeInUSTag,
  TravelPlanTag,
  WizardStep,
  WizardState,
} from "@/lib/types";
import type {
  ConsentRecord,
  DataStore,
  InterestSignal,
  LocationTransition,
  StoredRanking,
} from "./contract";

type Client = AndexSupabaseClient;

/** Ruta del endpoint que gestiona la suscripción (lo completa el agente de Stripe). */
const SUBSCRIPTION_ENDPOINT = "/api/subscription";

// ─── Helpers de sesión ───────────────────────────────────

async function currentUserId(supabase: Client): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

async function requireUserId(supabase: Client): Promise<string> {
  const userId = await currentUserId(supabase);
  if (!userId) {
    throw new Error("Sesión requerida: inicia sesión para guardar tus datos.");
  }
  return userId;
}

// ─── Helpers de conversión ───────────────────────────────

function asLocationContext(value: string | null): LocationContext | null {
  return value === "in_us" || value === "pre_arrival" ? value : null;
}

function asInterests(value: Json | null): InterestTag[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string") as InterestTag[];
}

function asWizardStep(value: number | null): WizardStep {
  if (value === 2 || value === 3 || value === 4 || value === 5) return value;
  return 1;
}

/** `reason` se persiste como JSON string; si está corrupto se degrada al default. */
function parseReason(raw: string | null, context: LocationContext): ReasonCode {
  if (!raw) return { type: "context_default", context };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "type" in parsed) {
      return parsed as ReasonCode;
    }
  } catch {
    /* JSON inválido: se usa el default */
  }
  return { type: "context_default", context };
}

/** Estados de Stripe → los cuatro estados del producto (§3.4.7). */
function asSubscriptionStatus(raw: string | null): SubscriptionStatus {
  switch (raw) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    default:
      return "canceled";
  }
}

function isModuleId(value: number): value is ModuleId {
  return value >= 1 && value <= 7 && Number.isInteger(value);
}

/**
 * §3.2.2 — coherencia dura: un usuario nunca tiene estado de EE. UU. y país
 * extranjero a la vez. Se aplica ANTES de escribir, para que el CHECK
 * `chk_location_coherence` (§7.2) nunca pueda rechazar un INSERT/UPDATE.
 */
function coherentBranchFields(
  context: LocationContext | null,
  fields: {
    stateUS?: string | null;
    timeInUS?: string | null;
    city?: string | null;
    countryOfResidence?: string | null;
    countryOther?: string | null;
    travelPlan?: string | null;
    nationality?: string | null;
  },
): {
  current_state_us: string | null;
  time_in_us: string | null;
  city: string | null;
  country_of_residence: string | null;
  country_other: string | null;
  travel_plan_status: string | null;
  nationality: string | null;
} {
  if (context === "in_us") {
    return {
      current_state_us: fields.stateUS ?? null,
      time_in_us: fields.timeInUS ?? null,
      city: fields.city ?? null,
      country_of_residence: null,
      country_other: null,
      travel_plan_status: null,
      nationality: null,
    };
  }
  if (context === "pre_arrival") {
    return {
      current_state_us: null,
      time_in_us: null,
      city: null,
      country_of_residence: fields.countryOfResidence ?? null,
      // Texto libre de "Mi país no está en la lista" (Anexo C.2): solo tiene
      // sentido junto a country_of_residence = 'XX'.
      country_other: fields.countryOther ?? null,
      travel_plan_status: fields.travelPlan ?? null,
      nationality: fields.nationality ?? null,
    };
  }
  // Sin contexto aún (paso 1 del wizard): no se escribe nada de ninguna rama.
  return {
    current_state_us: null,
    time_in_us: null,
    city: null,
    country_of_residence: null,
    country_other: null,
    travel_plan_status: null,
    nationality: null,
  };
}

// ─── Lecturas base ───────────────────────────────────────

async function loadUserRow(supabase: Client, userId: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer tu perfil: ${error.message}`);
  return data ?? null;
}

async function loadOnboardingRow(
  supabase: Client,
  userId: string,
): Promise<UserOnboardingProfileRow | null> {
  const { data, error } = await supabase
    .from("user_onboarding_profile")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(`No se pudieron leer tus respuestas: ${error.message}`);
  }
  return data ?? null;
}

function toStoredProfile(
  user: UserRow,
  onboarding: UserOnboardingProfileRow | null,
): StoredProfile | null {
  const context = asLocationContext(user.location_context);
  // Sin location_context no hay perfil utilizable: el dashboard no puede
  // adaptarse a nada (§3.2 regla 6). El caller manda al wizard.
  if (!context) return null;

  const goal = onboarding?.immediate_goal ?? null;
  const goalIsCustom = onboarding?.immediate_goal_is_custom === true;

  return {
    userId: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    phoneCountryCode: user.phone_country_code,

    locationContext: context,
    stateUS: user.current_state_us,
    city: user.city,
    timeInUS: (user.time_in_us as TimeInUSTag | null) ?? null,
    countryOfResidence: user.country_of_residence,
    countryOther: user.country_other,
    nationality: user.nationality,
    travelPlan: (user.travel_plan_status as TravelPlanTag | null) ?? null,
    estimatedArrivalDate: user.estimated_arrival_date,

    situation: (onboarding?.situation_tag as SituationTag | "other" | null) ?? null,
    situationOther: onboarding?.situation_other ?? null,
    situationDeclined: onboarding?.situation_declined === true,
    seekingFor: (onboarding?.seeking_for as SeekingFor | null) ?? "self",
    interests: asInterests(onboarding?.interests_json ?? null),
    interestsOther: onboarding?.interests_other ?? null,
    immediateGoal: goalIsCustom
      ? "custom"
      : ((goal as InterestTag | null) ?? null),
    immediateGoalCustom: goalIsCustom ? goal : null,

    onboardingCompleted: onboarding?.is_completed === true,
    onboardingSkippedAtStep:
      onboarding?.is_skipped === true ? asWizardStep(onboarding.current_step) : null,
    preferredLanguage: (user.preferred_language as Lang | null) ?? "es",

    createdAt: user.created_at ?? new Date().toISOString(),
    updatedAt: user.updated_at ?? new Date().toISOString(),
  };
}

// ─── Implementación ──────────────────────────────────────

export function createSupabaseStore(): DataStore {
  // Cliente de navegador (singleton). Construirlo fuera del navegador no
  // lanza (@supabase/ssr degrada el storage de cookies), pero sin cookies no
  // hay sesión: este store está pensado para client components, tal como
  // indica el brief §6. En el servidor usa lib/supabase/server.ts.
  const supabase = getSupabaseBrowserClient();

  // ── Escrituras compartidas ──

  /**
   * Escribe la parte del perfil que vive en `users`. Usa upsert por `id`:
   * la fila normalmente ya existe (trigger `handle_new_user`, 0004_auth.sql),
   * pero así el store también funciona si el trigger no está instalado.
   */
  async function writeUserRow(
    userId: string,
    existing: UserRow | null,
    patch: {
      email?: string;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      phoneCountryCode?: string | null;
      locationContext?: LocationContext | null;
      stateUS?: string | null;
      city?: string | null;
      timeInUS?: string | null;
      countryOfResidence?: string | null;
      countryOther?: string | null;
      travelPlan?: string | null;
      nationality?: string | null;
      estimatedArrivalDate?: string | null;
      preferredLanguage?: Lang | null;
    },
  ): Promise<void> {
    const context =
      patch.locationContext !== undefined
        ? patch.locationContext
        : asLocationContext(existing?.location_context ?? null);

    const branch = coherentBranchFields(context, {
      stateUS: patch.stateUS !== undefined ? patch.stateUS : existing?.current_state_us,
      timeInUS: patch.timeInUS !== undefined ? patch.timeInUS : existing?.time_in_us,
      city: patch.city !== undefined ? patch.city : existing?.city,
      countryOfResidence:
        patch.countryOfResidence !== undefined
          ? patch.countryOfResidence
          : existing?.country_of_residence,
      countryOther:
        patch.countryOther !== undefined
          ? patch.countryOther
          : existing?.country_other,
      travelPlan:
        patch.travelPlan !== undefined ? patch.travelPlan : existing?.travel_plan_status,
      nationality:
        patch.nationality !== undefined ? patch.nationality : existing?.nationality,
    });

    // email y first_name son NOT NULL (§7.2): siempre se envía un valor.
    const email = patch.email ?? existing?.email ?? "";
    const firstName = patch.firstName ?? existing?.first_name ?? "";

    const { error } = await supabase.from("users").upsert(
      {
        id: userId,
        email,
        first_name: firstName,
        last_name:
          patch.lastName !== undefined ? patch.lastName : (existing?.last_name ?? null),
        phone: patch.phone !== undefined ? patch.phone : (existing?.phone ?? null),
        phone_country_code:
          patch.phoneCountryCode !== undefined
            ? patch.phoneCountryCode
            : (existing?.phone_country_code ?? null),
        location_context: context,
        estimated_arrival_date:
          patch.estimatedArrivalDate !== undefined
            ? patch.estimatedArrivalDate
            : (existing?.estimated_arrival_date ?? null),
        preferred_language:
          patch.preferredLanguage ?? existing?.preferred_language ?? "es",
        ...branch,
      },
      { onConflict: "id" },
    );

    if (error) throw new Error(`No se pudo guardar tu perfil: ${error.message}`);
  }

  /** Escribe la parte que vive en `user_onboarding_profile`. */
  async function writeOnboardingRow(
    userId: string,
    patch: Partial<UserOnboardingProfileRow>,
  ): Promise<void> {
    const { error } = await supabase
      .from("user_onboarding_profile")
      .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
    if (error) {
      throw new Error(`No se pudieron guardar tus respuestas: ${error.message}`);
    }
  }

  // ── Wizard (guardado parcial §3.2 regla 1) ──

  async function getWizardState(): Promise<WizardState | null> {
    const userId = await currentUserId(supabase);
    if (!userId) return null;

    const [user, onboarding] = await Promise.all([
      loadUserRow(supabase, userId),
      loadOnboardingRow(supabase, userId),
    ]);
    if (!user || !onboarding) return null;
    // Wizard terminado o descartado: no hay borrador que retomar.
    if (onboarding.current_step === null) return null;
    if (onboarding.is_completed === true) return null;

    const step = asWizardStep(onboarding.current_step);
    const goalIsCustom = onboarding.immediate_goal_is_custom === true;

    return {
      currentStep: step,
      // `max_step_reached` no existe en §7.2: se deriva del paso actual.
      maxStepReached: step,
      draft: {
        firstName: user.first_name || undefined,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        phoneCountryCode: user.phone_country_code,
        locationContext: asLocationContext(user.location_context),
        stateUS: user.current_state_us,
        timeInUS: (user.time_in_us as TimeInUSTag | null) ?? null,
        countryOfResidence: user.country_of_residence,
        countryOther: user.country_other,
        nationality: user.nationality,
        travelPlan: (user.travel_plan_status as TravelPlanTag | null) ?? null,
        situation: (onboarding.situation_tag as SituationTag | "other" | null) ?? null,
        situationOther: onboarding.situation_other,
        situationDeclined: onboarding.situation_declined === true,
        seekingFor: (onboarding.seeking_for as SeekingFor | null) ?? "self",
        interests: asInterests(onboarding.interests_json),
        interestsOther: onboarding.interests_other,
        immediateGoal: goalIsCustom
          ? "custom"
          : ((onboarding.immediate_goal as InterestTag | null) ?? null),
        immediateGoalCustom: goalIsCustom ? onboarding.immediate_goal : null,
      },
      startedAt: user.created_at ?? new Date().toISOString(),
      updatedAt: onboarding.updated_at ?? new Date().toISOString(),
    };
  }

  async function saveWizardState(state: WizardState): Promise<void> {
    const userId = await requireUserId(supabase);
    const existing = await loadUserRow(supabase, userId);
    const d = state.draft;

    await writeUserRow(userId, existing, {
      email: d.email,
      firstName: d.firstName ?? null,
      lastName: d.lastName ?? null,
      phone: d.phone ?? null,
      phoneCountryCode: d.phoneCountryCode ?? null,
      locationContext: d.locationContext ?? null,
      stateUS: d.stateUS ?? null,
      timeInUS: d.timeInUS ?? null,
      countryOfResidence: d.countryOfResidence ?? null,
      countryOther: d.countryOther ?? null,
      travelPlan: d.travelPlan ?? null,
      nationality: d.nationality ?? null,
    });

    const interests = d.interests ?? [];
    await writeOnboardingRow(userId, {
      current_step: state.currentStep,
      branch: d.locationContext ?? null,
      situation_tag: d.situation ?? null,
      situation_other: d.situationOther ?? null,
      situation_declined: d.situationDeclined === true,
      seeking_for: d.seekingFor ?? "self",
      // El primer interés es el primario (§3.3.1: interests[0] pesa más).
      primary_interest: interests[0] ?? null,
      interests_json: interests as unknown as Json,
      interests_other: d.interestsOther ?? null,
      immediate_goal:
        d.immediateGoal === "custom"
          ? (d.immediateGoalCustom ?? null)
          : (d.immediateGoal ?? null),
      immediate_goal_is_custom: d.immediateGoal === "custom",
      updated_at: new Date().toISOString(),
    });
  }

  async function clearWizardState(): Promise<void> {
    const userId = await currentUserId(supabase);
    if (!userId) return;
    // No se borran las respuestas (son el perfil): se marca que ya no hay
    // borrador en curso poniendo current_step a NULL.
    await writeOnboardingRow(userId, { current_step: null });
  }

  // ── Perfil ──

  async function getProfile(): Promise<StoredProfile | null> {
    const userId = await currentUserId(supabase);
    if (!userId) return null;
    const [user, onboarding] = await Promise.all([
      loadUserRow(supabase, userId),
      loadOnboardingRow(supabase, userId),
    ]);
    if (!user) return null;
    return toStoredProfile(user, onboarding);
  }

  async function saveProfile(profile: StoredProfile): Promise<void> {
    const userId = await requireUserId(supabase);
    const existing = await loadUserRow(supabase, userId);

    await writeUserRow(userId, existing, {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      phoneCountryCode: profile.phoneCountryCode,
      locationContext: profile.locationContext,
      stateUS: profile.stateUS,
      city: profile.city,
      timeInUS: profile.timeInUS,
      countryOfResidence: profile.countryOfResidence,
      countryOther: profile.countryOther,
      travelPlan: profile.travelPlan,
      nationality: profile.nationality,
      estimatedArrivalDate: profile.estimatedArrivalDate,
      preferredLanguage: profile.preferredLanguage,
    });

    const skipped = profile.onboardingSkippedAtStep;
    await writeOnboardingRow(userId, {
      branch: profile.locationContext,
      situation_tag: profile.situation,
      situation_other: profile.situationOther,
      situation_declined: profile.situationDeclined,
      seeking_for: profile.seekingFor,
      primary_interest: profile.interests[0] ?? null,
      interests_json: profile.interests as unknown as Json,
      interests_other: profile.interestsOther,
      immediate_goal:
        profile.immediateGoal === "custom"
          ? profile.immediateGoalCustom
          : profile.immediateGoal,
      immediate_goal_is_custom: profile.immediateGoal === "custom",
      is_completed: profile.onboardingCompleted,
      is_skipped: skipped !== null,
      current_step: skipped ?? null,
      completed_at: profile.onboardingCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    });
  }

  async function updateProfile(patch: Partial<StoredProfile>): Promise<StoredProfile> {
    const current = await getProfile();
    if (!current) {
      throw new Error(
        "No hay perfil que actualizar: completa la entrevista antes de editarlo.",
      );
    }
    const next: StoredProfile = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await saveProfile(next);
    return next;
  }

  // ── Ranking (§3.3.1) + comportamiento (§3.3.2) ──

  async function getRanking(): Promise<StoredRanking | null> {
    const userId = await currentUserId(supabase);
    if (!userId) return null;

    const [user, rows] = await Promise.all([
      loadUserRow(supabase, userId),
      supabase
        .from("user_module_ranking")
        .select("*")
        .eq("user_id", userId)
        .order("score", { ascending: false })
        .order("module_id", { ascending: true }), // desempate por orden canónico
    ]);

    if (rows.error) {
      throw new Error(`No se pudo leer tu ranking: ${rows.error.message}`);
    }
    if (!rows.data || rows.data.length === 0) return null;

    // `content_variant` no existe en §7.2: se deriva del contexto vigente
    // del usuario, que es justamente lo que determina qué versión servir.
    const context = asLocationContext(user?.location_context ?? null) ?? "in_us";

    const scores: ModuleScore[] = [];
    const behavior: ModuleBehavior[] = [];
    let computedAt = "";

    for (const row of rows.data) {
      if (!isModuleId(row.module_id)) continue;
      scores.push({
        moduleId: row.module_id,
        score: row.score,
        reason: parseReason(row.reason, context),
        contentVariant: context,
      });
      behavior.push({
        moduleId: row.module_id,
        openCount: row.open_count ?? 0,
        dismissedCount: row.dismissed_count ?? 0,
        // `sessions_without_open` no existe en §7.2 — ver reporte.
        sessionsWithoutOpen: 0,
      });
      if (row.computed_at && row.computed_at > computedAt) computedAt = row.computed_at;
    }

    return {
      scores,
      behavior,
      computedAt: computedAt || new Date().toISOString(),
    };
  }

  async function saveRanking(ranking: StoredRanking): Promise<void> {
    const userId = await requireUserId(supabase);

    // Los contadores de comportamiento son historia de uso: nunca se pierden
    // al recalcular. Se leen los actuales y se conserva el valor más alto.
    const { data: existing, error: readError } = await supabase
      .from("user_module_ranking")
      .select("module_id, open_count, dismissed_count")
      .eq("user_id", userId);
    if (readError) {
      throw new Error(`No se pudo leer tu ranking: ${readError.message}`);
    }

    const previous = new Map<number, { open: number; dismissed: number }>();
    for (const row of existing ?? []) {
      previous.set(row.module_id, {
        open: row.open_count ?? 0,
        dismissed: row.dismissed_count ?? 0,
      });
    }

    const computedAt = ranking.computedAt || new Date().toISOString();
    const payload = ranking.scores.map((s) => {
      const incoming = ranking.behavior.find((b) => b.moduleId === s.moduleId);
      const prev = previous.get(s.moduleId);
      return {
        user_id: userId,
        module_id: s.moduleId,
        score: s.score,
        reason: JSON.stringify(s.reason),
        open_count: Math.max(prev?.open ?? 0, incoming?.openCount ?? 0),
        dismissed_count: Math.max(prev?.dismissed ?? 0, incoming?.dismissedCount ?? 0),
        computed_at: computedAt,
      };
    });

    const { error } = await supabase
      .from("user_module_ranking")
      .upsert(payload, { onConflict: "user_id,module_id" });
    if (error) throw new Error(`No se pudo guardar tu ranking: ${error.message}`);
  }

  /**
   * Incrementa un contador con lectura previa. No es atómico: dos pestañas
   * simultáneas podrían perder un incremento. Aceptable para una señal de
   * ranking (§3.3.2); si importara, se resuelve con una función RPC.
   */
  async function bumpCounter(
    moduleId: ModuleId,
    field: "open_count" | "dismissed_count",
  ): Promise<number> {
    const userId = await requireUserId(supabase);

    const { data: existing, error: readError } = await supabase
      .from("user_module_ranking")
      .select("score, reason, open_count, dismissed_count, computed_at")
      .eq("user_id", userId)
      .eq("module_id", moduleId)
      .maybeSingle();
    if (readError) {
      throw new Error(`No se pudo leer tu ranking: ${readError.message}`);
    }

    const nextValue = ((existing?.[field] ?? 0) as number) + 1;

    const { error } = await supabase.from("user_module_ranking").upsert(
      {
        user_id: userId,
        module_id: moduleId,
        // Si aún no había fila (el motor no ha corrido) se crea con score 0:
        // el contador no se pierde y el próximo cálculo lo sobrescribe.
        score: existing?.score ?? 0,
        reason: existing?.reason ?? null,
        open_count: field === "open_count" ? nextValue : (existing?.open_count ?? 0),
        dismissed_count:
          field === "dismissed_count" ? nextValue : (existing?.dismissed_count ?? 0),
        computed_at: existing?.computed_at ?? new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" },
    );
    if (error) throw new Error(`No se pudo registrar tu actividad: ${error.message}`);

    return nextValue;
  }

  async function registerModuleOpen(moduleId: ModuleId): Promise<void> {
    await bumpCounter(moduleId, "open_count");
  }

  async function registerHeroDismiss(moduleId: ModuleId): Promise<number> {
    // §4.7: a los 3 descartes la hero card se oculta 7 días.
    return bumpCounter(moduleId, "dismissed_count");
  }

  // ── Señales de interés (placeholder §4.6) ──

  async function submitInterestSignal(signal: InterestSignal): Promise<void> {
    const userId = await requireUserId(supabase);
    const { error } = await supabase.from("module_interest_signals").insert({
      user_id: userId,
      module_id: signal.moduleId,
      free_text: signal.freeText,
      wants_notification: signal.wantsNotification,
    });
    if (error) {
      throw new Error(`No se pudo enviar tu respuesta: ${error.message}`);
    }
  }

  // ── Suscripción (§3.4.7) ──

  async function getSubscription(): Promise<SubscriptionInfo | null> {
    const userId = await currentUserId(supabase);
    if (!userId) return null;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      throw new Error(`No se pudo leer tu membresía: ${error.message}`);
    }
    if (!data) return null;

    const plan: PlanType = data.plan_type === "annual" ? "annual" : "monthly";
    return {
      plan,
      status: asSubscriptionStatus(data.status),
      cancelAtPeriodEnd: data.cancel_at_period_end === true,
      // Sin period end conocido, el acceso se considera vencido hoy.
      currentPeriodEnd: data.current_period_end ?? new Date().toISOString(),
      // El precio no se guarda en §7.2: es el de config (tarifa congelada §3.4.4).
      priceUsd: plan === "annual" ? PRICES.annual.usd : PRICES.monthly.usd,
    };
  }

  /**
   * Cancelar y reactivar NO se escriben desde el cliente: `subscriptions` no
   * tiene políticas de escritura (0002_rls.sql). La mutación la hace el
   * servidor contra Stripe y vuelve por webhook.
   */
  async function callSubscriptionEndpoint(
    action: "cancel" | "reactivate",
  ): Promise<SubscriptionInfo> {
    const response = await fetch(SUBSCRIPTION_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `No se pudo ${action === "cancel" ? "cancelar" : "reactivar"} tu membresía. ` +
          `Inténtalo de nuevo o escríbenos.${detail ? ` (${detail})` : ""}`,
      );
    }

    const updated = await getSubscription();
    if (!updated) {
      throw new Error("No se pudo leer el estado de tu membresía tras el cambio.");
    }
    return updated;
  }

  function cancelSubscription(): Promise<SubscriptionInfo> {
    return callSubscriptionEndpoint("cancel");
  }

  function reactivateSubscription(): Promise<SubscriptionInfo> {
    return callSubscriptionEndpoint("reactivate");
  }

  // ── Cumplimiento (§3.4.6) ──

  async function recordConsent(consent: ConsentRecord): Promise<void> {
    const userId = await requireUserId(supabase);
    // §7.2 no tiene columna de IP; §3.4.6 la pide. Ver reporte.
    const { error } = await supabase.from("user_consents").insert({
      user_id: userId,
      consent_type: consent.type,
      document_version: consent.version,
      granted: consent.granted,
    });
    if (error) {
      throw new Error(`No se pudo registrar tu consentimiento: ${error.message}`);
    }
  }

  // ── Transición de contexto (§3.2.3) con coherencia (§3.2.2) ──

  async function recordLocationTransition(
    t: LocationTransition,
  ): Promise<StoredProfile> {
    const userId = await requireUserId(supabase);
    const existing = await loadUserRow(supabase, userId);
    if (!existing) {
      throw new Error("No hay perfil que migrar: completa la entrevista primero.");
    }

    const fromContext = asLocationContext(existing.location_context);
    const fromScope =
      fromContext === "in_us" ? existing.current_state_us : existing.country_of_residence;

    // writeUserRow ya limpia la rama abandonada (§3.2.2).
    await writeUserRow(userId, existing, {
      locationContext: t.toContext,
      stateUS: t.toContext === "in_us" ? (t.stateUS ?? null) : null,
      estimatedArrivalDate: t.arrivalDate ?? existing.estimated_arrival_date,
    });

    const { error } = await supabase.from("location_context_changes").insert({
      user_id: userId,
      from_context: fromContext,
      to_context: t.toContext,
      from_scope: fromScope,
      to_scope: t.toContext === "in_us" ? (t.stateUS ?? null) : null,
      trigger_source: t.trigger,
    });
    if (error) {
      // El perfil ya migró; el log es secundario y no debe romper el flujo.
      console.warn("[andex] no se pudo registrar el cambio de contexto:", error.message);
    }

    const profile = await getProfile();
    if (!profile) {
      throw new Error("El perfil quedó incompleto tras la migración de contexto.");
    }
    return profile;
  }

  // ── Analítica (§7.5) ──

  async function trackEvent(
    name: AnalyticsEventName,
    props?: AnalyticsProps,
  ): Promise<void> {
    // Fire-and-forget: la analítica jamás rompe la UI.
    try {
      const userId = await currentUserId(supabase);
      await supabase.from("analytics_events").insert({
        user_id: userId,
        event_name: name,
        properties: (props ?? null) as Json | null,
      });
    } catch {
      /* silencio deliberado */
    }
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
    recordConsent,
    recordLocationTransition,
    trackEvent,
  };
}
