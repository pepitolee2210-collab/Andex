/**
 * ANDEX — Tipos de la base de datos, escritos A MANO.
 * Espejo exacto del esquema de supabase/migrations/0001_schema.sql (PRD §7.2).
 *
 * No hay codegen (`supabase gen types`) porque el proyecto de Supabase aún no
 * existe: la app arranca en modo demo. Cuando exista, se puede regenerar y
 * este archivo pasa a ser el contrato de referencia para el diff.
 *
 * Convención (idéntica a la del codegen de Supabase para que sea sustituible):
 *   Row    — lo que devuelve un SELECT (columnas con DEFAULT o NULL → `| null`)
 *   Insert — lo que acepta un INSERT (opcional si tiene DEFAULT o es nullable)
 *   Update — todo opcional
 *
 * IMPORTANTE: aquí se habla snake_case (lenguaje de la BD). El mapeo a
 * camelCase de lib/types.ts lo hace lib/data/supabase-store.ts.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enumeraciones expresadas como CHECK en el esquema ───
// (No son tipos ENUM de Postgres: §7.2 los define con CHECK constraints.)

export type DbLocationContext = "in_us" | "pre_arrival";
export type DbSeekingFor = "self" | "family" | "both";
export type DbModuleStatus = "live" | "coming_soon";
export type DbScopeType = "national" | "state" | "country";
export type DbResourceStatus = "active" | "broken" | "deprecated";
export type DbPlanType = "monthly" | "annual";

// ─── Filas (§7.2, tabla por tabla) ───────────────────────

/** `users` — perfil y bifurcación. `id` = auth.users.id (trigger 0004). */
export type UserRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  phone_country_code: string | null;
  location_context: DbLocationContext | null;
  /** Rama A. CHAR(2) ISO, ej. 'UT'. NULL si pre_arrival (chk_location_coherence). */
  current_state_us: string | null;
  city: string | null;
  time_in_us: string | null;
  /** Rama B. CHAR(2) ISO 3166-1. NULL si in_us (chk_location_coherence). */
  country_of_residence: string | null;
  /** Texto libre de "Mi país no está en la lista" (Anexo C.2). Ver 0005. */
  country_other: string | null;
  travel_plan_status: string | null;
  /** DATE — se serializa como 'YYYY-MM-DD'. */
  estimated_arrival_date: string | null;
  nationality: string | null;
  timezone: string | null;
  preferred_language: string | null;
  created_at: string | null;
  updated_at: string | null;
  /** Soft delete §7.2. */
  deleted_at: string | null;
};

/** `user_onboarding_profile` — respuestas del wizard (§3.2). */
export type UserOnboardingProfileRow = {
  user_id: string;
  primary_interest: string | null;
  /** Array de InterestTag serializado como JSONB. */
  interests_json: Json | null;
  interests_other: string | null;
  immediate_goal: string | null;
  immediate_goal_is_custom: boolean | null;
  situation_tag: string | null;
  situation_other: string | null;
  situation_declined: boolean | null;
  seeking_for: DbSeekingFor | null;
  recommended_module_id: number | null;
  /** Para retomar el wizard (guardado parcial §3.2 regla 1). */
  current_step: number | null;
  branch: string | null;
  is_completed: boolean | null;
  is_skipped: boolean | null;
  completed_at: string | null;
  updated_at: string | null;
};

/** `modules` — catálogo (§7.4). Lectura pública. */
export type ModuleRow = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  accent_color: string | null;
  canonical_order: number;
  status: DbModuleStatus | null;
};

/** `module_relevance` — base del ranking (§3.3.1) y copy por contexto (§4.2.1). */
export type ModuleRelevanceRow = {
  module_id: number;
  location_context: DbLocationContext;
  base_score: number;
  alt_title: string | null;
  alt_description: string | null;
};

/** Un paso del ExternalGuideModal (§5-M1: instrucciones de 3 pasos). */
export type ExternalResourceStep = {
  step: number;
  text: string;
};

/** `external_resources` — trámites oficiales de la tabla §6. */
export type ExternalResourceRow = {
  id: string;
  module_slug: string;
  label: string;
  official_url: string;
  scope_type: DbScopeType;
  /** 'UT' | 'MX' | NULL si national. */
  scope_value: string | null;
  /** NULL = aplica a ambos contextos. */
  location_context: DbLocationContext | null;
  instructions_json: Json | null;
  /** Visible al usuario (§6). */
  last_verified_at: string | null;
  verified_by: string | null;
  status: DbResourceStatus | null;
};

/** `location_context_changes` — historial de la transición §3.2.3. */
export type LocationContextChangeRow = {
  id: number;
  user_id: string | null;
  from_context: string | null;
  to_context: string | null;
  from_scope: string | null;
  to_scope: string | null;
  trigger_source: string | null;
  changed_at: string | null;
};

/** `user_module_ranking` — ranking persistido (§3.3.1) + contadores (§3.3.2). */
export type UserModuleRankingRow = {
  user_id: string;
  module_id: number;
  score: number;
  /** ReasonCode serializado con JSON.stringify (lib/types.ts). */
  reason: string | null;
  dismissed_count: number | null;
  open_count: number | null;
  computed_at: string | null;
};

/** `module_interest_signals` — captura de interés del placeholder (§4.6). */
export type ModuleInterestSignalRow = {
  id: string;
  user_id: string | null;
  module_id: number | null;
  free_text: string | null;
  wants_notification: boolean | null;
  created_at: string | null;
};

/** `user_consents` — consentimiento afirmativo expreso (§3.4.6). */
export type UserConsentRow = {
  id: string;
  user_id: string | null;
  consent_type: string;
  document_version: string;
  granted: boolean;
  granted_at: string | null;
  /**
   * IP desde la que se otorgó el consentimiento (§3.4.6 la exige junto a
   * versión y timestamp). Añadida en 0005_schema_gaps.sql. Solo la puede
   * escribir el servidor: el navegador no conoce su propia IP.
   */
  ip_address: string | null;
};

/** `analytics_events` — los 27 eventos de §7.5. */
export type AnalyticsEventRow = {
  id: number;
  user_id: string | null;
  event_name: string;
  properties: Json | null;
  occurred_at: string | null;
};

/** `external_redirect_logs` — agregado y anónimo, sin user_id (§7.2). */
export type ExternalRedirectLogRow = {
  id: number;
  module_slug: string | null;
  target_url: string | null;
  /** Estado, no usuario. */
  user_state: string | null;
  clicked_at: string | null;
};

/** `subscriptions` — solo el service role escribe (webhook Stripe). */
export type SubscriptionRow = {
  id: string;
  user_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan_type: DbPlanType | null;
  /** 'active' | 'trialing' | 'past_due' | 'canceled' (VARCHAR(50) sin CHECK). */
  status: string | null;
  cancel_at_period_end: boolean | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/** `stripe_events` — idempotencia de webhooks. Sin políticas: service role. */
export type StripeEventRow = {
  event_id: string;
  event_type: string | null;
  processed_at: string | null;
};

// ─── Insert/Update derivados ─────────────────────────────
// Regla: son opcionales las columnas con DEFAULT o nullables; obligatorias
// las NOT NULL sin DEFAULT.

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type UserInsert = Optional<
  UserRow,
  | "id"
  | "last_name"
  | "phone"
  | "phone_country_code"
  | "location_context"
  | "current_state_us"
  | "city"
  | "time_in_us"
  | "country_of_residence"
  | "country_other"
  | "travel_plan_status"
  | "estimated_arrival_date"
  | "nationality"
  | "timezone"
  | "preferred_language"
  | "created_at"
  | "updated_at"
  | "deleted_at"
>;
export type UserUpdate = Partial<UserRow>;

export type UserOnboardingProfileInsert = Optional<
  UserOnboardingProfileRow,
  Exclude<keyof UserOnboardingProfileRow, "user_id">
>;
export type UserOnboardingProfileUpdate = Partial<UserOnboardingProfileRow>;

export type ModuleInsert = Optional<ModuleRow, "id" | "description" | "icon_name" | "accent_color" | "status">;
export type ModuleUpdate = Partial<ModuleRow>;

export type ModuleRelevanceInsert = Optional<
  ModuleRelevanceRow,
  "base_score" | "alt_title" | "alt_description"
>;
export type ModuleRelevanceUpdate = Partial<ModuleRelevanceRow>;

export type ExternalResourceInsert = Optional<
  ExternalResourceRow,
  | "id"
  | "scope_value"
  | "location_context"
  | "instructions_json"
  | "last_verified_at"
  | "verified_by"
  | "status"
>;
export type ExternalResourceUpdate = Partial<ExternalResourceRow>;

/** Todas las columnas tienen DEFAULT o son nullables → Insert todo opcional. */
export type LocationContextChangeInsert = Partial<LocationContextChangeRow>;
export type LocationContextChangeUpdate = Partial<LocationContextChangeRow>;

export type UserModuleRankingInsert = Optional<
  UserModuleRankingRow,
  "score" | "reason" | "dismissed_count" | "open_count" | "computed_at"
>;
export type UserModuleRankingUpdate = Partial<UserModuleRankingRow>;

export type ModuleInterestSignalInsert = Partial<ModuleInterestSignalRow>;
export type ModuleInterestSignalUpdate = Partial<ModuleInterestSignalRow>;

export type UserConsentInsert = Optional<
  UserConsentRow,
  "id" | "user_id" | "granted_at" | "ip_address"
>;
export type UserConsentUpdate = Partial<UserConsentRow>;

export type AnalyticsEventInsert = Optional<
  AnalyticsEventRow,
  "id" | "user_id" | "properties" | "occurred_at"
>;
export type AnalyticsEventUpdate = Partial<AnalyticsEventRow>;

export type ExternalRedirectLogInsert = Partial<ExternalRedirectLogRow>;
export type ExternalRedirectLogUpdate = Partial<ExternalRedirectLogRow>;

export type SubscriptionInsert = Partial<SubscriptionRow>;
export type SubscriptionUpdate = Partial<SubscriptionRow>;

export type StripeEventInsert = Optional<StripeEventRow, "event_type" | "processed_at">;
export type StripeEventUpdate = Partial<StripeEventRow>;

// ─── Forma `Database` que consumen los clientes tipados ──
// Misma estructura que produce `supabase gen types typescript`, para poder
// sustituir este archivo por el generado sin tocar los call sites.
// `Relationships: []` es deliberado: no usamos joins embebidos de PostgREST;
// el store hace consultas por tabla y compone en TypeScript.

export type Database = {
  public: {
    Tables: {
      users: { Row: UserRow; Insert: UserInsert; Update: UserUpdate; Relationships: [] };
      user_onboarding_profile: {
        Row: UserOnboardingProfileRow;
        Insert: UserOnboardingProfileInsert;
        Update: UserOnboardingProfileUpdate;
        Relationships: [];
      };
      modules: { Row: ModuleRow; Insert: ModuleInsert; Update: ModuleUpdate; Relationships: [] };
      module_relevance: {
        Row: ModuleRelevanceRow;
        Insert: ModuleRelevanceInsert;
        Update: ModuleRelevanceUpdate;
        Relationships: [];
      };
      external_resources: {
        Row: ExternalResourceRow;
        Insert: ExternalResourceInsert;
        Update: ExternalResourceUpdate;
        Relationships: [];
      };
      location_context_changes: {
        Row: LocationContextChangeRow;
        Insert: LocationContextChangeInsert;
        Update: LocationContextChangeUpdate;
        Relationships: [];
      };
      user_module_ranking: {
        Row: UserModuleRankingRow;
        Insert: UserModuleRankingInsert;
        Update: UserModuleRankingUpdate;
        Relationships: [];
      };
      module_interest_signals: {
        Row: ModuleInterestSignalRow;
        Insert: ModuleInterestSignalInsert;
        Update: ModuleInterestSignalUpdate;
        Relationships: [];
      };
      user_consents: {
        Row: UserConsentRow;
        Insert: UserConsentInsert;
        Update: UserConsentUpdate;
        Relationships: [];
      };
      analytics_events: {
        Row: AnalyticsEventRow;
        Insert: AnalyticsEventInsert;
        Update: AnalyticsEventUpdate;
        Relationships: [];
      };
      external_redirect_logs: {
        Row: ExternalRedirectLogRow;
        Insert: ExternalRedirectLogInsert;
        Update: ExternalRedirectLogUpdate;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: SubscriptionInsert;
        Update: SubscriptionUpdate;
        Relationships: [];
      };
      stripe_events: {
        Row: StripeEventRow;
        Insert: StripeEventInsert;
        Update: StripeEventUpdate;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
