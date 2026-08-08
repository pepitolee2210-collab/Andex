-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0001 ESQUEMA MVP v1
-- Fuente: ANDEX-PRD-v1.3-FINAL.md §7.2 (transcripción fiel: nombres, tipos,
-- checks e índices al pie de la letra).
--
-- Desviaciones deliberadas respecto al PRD (anotadas también en el reporte):
--   1. Orden de sentencias: `modules` se crea ANTES que las tablas que la
--      referencian por FK (module_relevance, user_module_ranking,
--      module_interest_signals). El PRD las lista en otro orden y no
--      compilaría tal cual.
--   2. Idempotencia: IF NOT EXISTS / OR REPLACE / DROP TRIGGER IF EXISTS
--      donde es razonable, para poder re-ejecutar la migración sin error.
--   3. MEJORA: trigger de updated_at también en `subscriptions` y
--      `user_onboarding_profile` (el PRD §7.2 solo lo puso en `users`,
--      pero ambas tablas tienen columna updated_at que quedaría congelada).
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- Tabla de Usuarios y Profiling Inteligente (§7.2)
-- `id` coincide con auth.users.id (lo garantiza el trigger de 0004_auth.sql);
-- las políticas RLS de 0002 comparan auth.uid() = id.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    phone_country_code VARCHAR(5),

    -- ── LA BIFURCACIÓN (§3.2.0) ───────────────────────
    location_context VARCHAR(20)
        CHECK (location_context IN ('in_us','pre_arrival')),

    -- Rama A: dentro de EE. UU.
    current_state_us CHAR(2),                 -- ISO ej. 'UT'. NULL si pre_arrival
    city VARCHAR(100),                        -- Opcional, se pide al abrir M5
    time_in_us VARCHAR(20),                   -- 'menos_6_meses' | '6m_2a' | ...

    -- Rama B: fuera de EE. UU.
    country_of_residence CHAR(2),             -- ISO 3166-1. NULL si in_us
    travel_plan_status VARCHAR(20),           -- 'fecha_confirmada' | 'este_ano' | ...
    estimated_arrival_date DATE,              -- Dispara el recordatorio de transición

    nationality CHAR(2),                      -- ISO. Solo si difiere de residencia
    timezone VARCHAR(50) DEFAULT 'America/Denver',
    preferred_language VARCHAR(5) DEFAULT 'es',

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,                   -- Soft delete

    -- Coherencia §3.2.2: nunca estado de EE.UU. y país extranjero a la vez
    CONSTRAINT chk_location_coherence CHECK (
        location_context IS NULL
        OR (location_context = 'in_us'       AND country_of_residence IS NULL)
        OR (location_context = 'pre_arrival' AND current_state_us     IS NULL)
    )
);

-- Índices §7.2 (idx_users_email es redundante con el UNIQUE de email;
-- se conserva por fidelidad al PRD)
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_context  ON users(location_context) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_state    ON users(current_state_us) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_country  ON users(country_of_residence) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────────────────
-- Módulos de la Plataforma (§7.2)
-- Se crea antes que module_relevance / user_module_ranking /
-- module_interest_signals: es el destino de sus FK.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    accent_color VARCHAR(20),
    canonical_order SMALLINT NOT NULL,
    status VARCHAR(20) DEFAULT 'coming_soon'  -- 'live' | 'coming_soon'
        CHECK (status IN ('live','coming_soon'))
);

-- ─────────────────────────────────────────────────────────
-- Respuestas del Onboarding para Recomendaciones (§7.2)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_onboarding_profile (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    primary_interest VARCHAR(100),
    interests_json JSONB,                     -- Array de intereses seleccionados
    interests_other TEXT,                     -- Texto libre del "Otro" del paso 4
    immediate_goal TEXT,                      -- Puede ser enum o texto libre
    immediate_goal_is_custom BOOLEAN DEFAULT false,

    situation_tag VARCHAR(50),                -- Enum canónico | 'other' | NULL
    situation_other TEXT,                     -- Texto libre cuando tag = 'other'
    situation_declined BOOLEAN DEFAULT false, -- "Prefiero no responder"

    seeking_for VARCHAR(20) DEFAULT 'self'    -- Paso 3.5
        CHECK (seeking_for IN ('self','family','both')),

    recommended_module_id INT,
    current_step SMALLINT DEFAULT 1,          -- Para retomar el wizard
    branch VARCHAR(20),                       -- Rama tomada en el paso 2
    is_completed BOOLEAN DEFAULT false,
    is_skipped BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- NUEVO: Relevancia de módulo por contexto (§7.2)
-- Permite que el mismo módulo se presente distinto según dónde esté el
-- usuario, sin duplicar módulos ni ramificar el frontend.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS module_relevance (
    module_id INT REFERENCES modules(id),
    location_context VARCHAR(20)
        CHECK (location_context IN ('in_us','pre_arrival')),
    base_score SMALLINT NOT NULL DEFAULT 0,   -- Punto de partida del ranking §3.3.1
    alt_title VARCHAR(120),                   -- Título en este contexto §4.2.1
    alt_description TEXT,                     -- Descripción en este contexto
    PRIMARY KEY (module_id, location_context)
);

-- ─────────────────────────────────────────────────────────
-- NUEVO: Recursos externos con alcance geográfico (§7.2, tabla §6)
-- El DMV depende del estado; el consulado, del país.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS external_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_slug VARCHAR(100) NOT NULL,
    label VARCHAR(200) NOT NULL,
    official_url TEXT NOT NULL,
    scope_type VARCHAR(20) NOT NULL
        CHECK (scope_type IN ('national','state','country')),
    scope_value CHAR(2),                      -- 'UT' | 'MX' | NULL si national
    location_context VARCHAR(20),             -- NULL = aplica a ambos
    instructions_json JSONB,                  -- Pasos del ExternalGuideModal (§5-M1)
    last_verified_at TIMESTAMPTZ,             -- Visible al usuario (§6)
    verified_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active','broken','deprecated'))
);

CREATE INDEX IF NOT EXISTS idx_resources_scope
    ON external_resources(scope_type, scope_value, module_slug)
    WHERE status = 'active';

-- ─────────────────────────────────────────────────────────
-- NUEVO: Historial de cambio de contexto (§7.2, transición §3.2.3)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS location_context_changes (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    from_context VARCHAR(20),
    to_context VARCHAR(20),
    from_scope CHAR(2),
    to_scope CHAR(2),
    trigger_source VARCHAR(50),               -- 'banner' | 'profile' | 'notification'
    changed_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- NUEVO: Ranking personalizado por usuario (§7.2, §3.3.1)
-- `reason` persiste el ReasonCode del motor como JSON string
-- (lib/types.ts — el copy visible lo produce i18n, no la BD).
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_module_ranking (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module_id INT REFERENCES modules(id),
    score SMALLINT NOT NULL DEFAULT 0,
    reason TEXT,                              -- Copy mostrado en la hero card
    dismissed_count SMALLINT DEFAULT 0,
    open_count SMALLINT DEFAULT 0,
    computed_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_ranking_user_score
    ON user_module_ranking(user_id, score DESC);

-- ─────────────────────────────────────────────────────────
-- NUEVO: Captura de interés en placeholders (§7.2, §4.6)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS module_interest_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    module_id INT REFERENCES modules(id),
    free_text TEXT,                           -- "¿Qué necesitas primero?"
    wants_notification BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- NUEVO: Consentimientos (§7.2, cumplimiento §3.4.6)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,        -- 'terms' | 'privacy' | 'marketing'
    document_version VARCHAR(20) NOT NULL,
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- NUEVO: Analítica de producto (§7.2, eventos §7.5)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_name VARCHAR(100) NOT NULL,
    properties JSONB,
    occurred_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_name_time
    ON analytics_events(event_name, occurred_at DESC);

-- ─────────────────────────────────────────────────────────
-- Tracking de Uso de Enlaces Externos (§7.2, Fase 1 Analysis)
-- Agregado y anónimo: mide demanda de trámite, no comportamiento individual.
-- Por eso NO tiene user_id.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS external_redirect_logs (
    id BIGSERIAL PRIMARY KEY,
    module_slug VARCHAR(100),
    target_url TEXT,
    user_state VARCHAR(50),                   -- Estado, no usuario
    clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_redirect_module_time
    ON external_redirect_logs(module_slug, clicked_at DESC);

-- ─────────────────────────────────────────────────────────
-- Suscripciones y Pagos (§7.2, §3.4)
-- Solo el service role escribe aquí (webhook de Stripe); ver 0002_rls.sql.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_price_id VARCHAR(255),
    plan_type VARCHAR(20) CHECK (plan_type IN ('monthly','annual')),
    status VARCHAR(50),                       -- 'active','past_due','canceled'
    cancel_at_period_end BOOLEAN DEFAULT false,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- ─────────────────────────────────────────────────────────
-- Idempotencia de webhooks de Stripe (§7.2)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stripe_events (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100),
    processed_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- Trigger de updated_at (§7.2)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PRD §7.2: trigger en users
DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- MEJORA (no está en el PRD): subscriptions y user_onboarding_profile
-- también tienen updated_at; sin trigger quedarían con el valor de inserción.
DROP TRIGGER IF EXISTS trg_subscriptions_updated ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_onboarding_profile_updated ON user_onboarding_profile;
CREATE TRIGGER trg_onboarding_profile_updated
    BEFORE UPDATE ON user_onboarding_profile
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
