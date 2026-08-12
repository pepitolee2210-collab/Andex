-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — TODAS LAS MIGRACIONES, EN ORDEN
--
-- Generado por concatenación de supabase/migrations/. NO editar a mano:
-- se regenera con `npm run sql:bundle`.
--
-- CÓMO APLICARLO
--   1. Abre el proyecto en Supabase → SQL Editor → New query
--   2. Pega este archivo entero y pulsa Run
--
-- Es idempotente (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS), así
-- que se puede volver a ejecutar sin romper nada si algo falla a mitad.
--
-- DESPUÉS de esto quedan DOS pasos manuales, en docs/CONECTAR-SUPABASE.md:
--   · crear .env.local con la URL y las claves
--   · darte el rol de administrador (necesita tu usuario ya creado)
-- ═══════════════════════════════════════════════════════════════════════



-- ═════════════════════════════════════════════════════════════════════
-- ▼▼▼  0001_schema.sql
-- ═════════════════════════════════════════════════════════════════════

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


-- ═════════════════════════════════════════════════════════════════════
-- ▼▼▼  0002_rls.sql
-- ═════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0002 ROW LEVEL SECURITY
-- Fuente: ANDEX-PRD-v1.3-FINAL.md §7.3 (obligatorio en Sprint 1) +
-- políticas complementarias para las tablas que el PRD dejó sin cubrir.
--
-- "Supabase expone las tablas públicamente por defecto. Sin RLS, todo el
--  perfil de todos los usuarios es legible." (§7.3)
--
-- Principios:
--   · RLS ENABLE en TODAS las tablas del esquema, sin excepción.
--   · Datos personales: solo el propio usuario (auth.uid()).
--   · Catálogos (modules, module_relevance, external_resources): lectura
--     pública; solo el service role los escribe.
--   · Telemetría (analytics_events, external_redirect_logs): INSERT
--     permitido, SELECT prohibido — se analiza desde el backend.
--   · subscriptions / stripe_events: escritura EXCLUSIVA del service role
--     (webhook de Stripe con cliente admin). Ninguna política de escritura.
--
-- Nota técnica: en una política FOR ALL sin WITH CHECK, Postgres aplica la
-- expresión USING también como WITH CHECK (cubre INSERT/UPDATE). Por eso
-- `own_user` ya permite que el usuario inserte su propia fila (además del
-- trigger de 0004_auth.sql, que la crea automáticamente).
--
-- Idempotencia: DROP POLICY IF EXISTS antes de cada CREATE POLICY;
-- ENABLE ROW LEVEL SECURITY es idempotente por naturaleza.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1. Activar RLS en TODAS las tablas
-- ─────────────────────────────────────────────────────────
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_profile  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_ranking      ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_interest_signals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules                  ENABLE ROW LEVEL SECURITY;
-- Tablas que el PRD §7.3 no cubrió explícitamente:
ALTER TABLE module_relevance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_resources       ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_context_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_redirect_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events            ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────
-- 2. Políticas del PRD §7.3 — cada usuario solo ve y edita lo suyo
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS own_user ON users;
CREATE POLICY own_user ON users
    FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS own_profile ON user_onboarding_profile;
CREATE POLICY own_profile ON user_onboarding_profile
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS own_ranking ON user_module_ranking;
CREATE POLICY own_ranking ON user_module_ranking
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS own_signals ON module_interest_signals;
CREATE POLICY own_signals ON module_interest_signals
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS own_consents ON user_consents;
CREATE POLICY own_consents ON user_consents
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS own_subscription ON subscriptions;
CREATE POLICY own_subscription ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Catálogo público de módulos: lectura para todos (§7.3)
DROP POLICY IF EXISTS modules_public_read ON modules;
CREATE POLICY modules_public_read ON modules FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────
-- 3. Políticas complementarias (no estaban en §7.3; motivo en cada una)
-- ─────────────────────────────────────────────────────────

-- 3.1 user_consents INSERT propio.
-- El PRD solo dio SELECT, pero §3.4.6 exige REGISTRAR el consentimiento
-- (checkbox de términos con versión y timestamp). Sin INSERT, ese registro
-- sería imposible desde el cliente. Sin UPDATE/DELETE: un consentimiento
-- es un registro histórico inmutable; revocar = insertar granted=false.
DROP POLICY IF EXISTS own_consents_insert ON user_consents;
CREATE POLICY own_consents_insert ON user_consents
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3.2 Catálogos de contexto: lectura pública, igual que modules.
-- module_relevance alimenta el ranking base y los títulos por contexto
-- (§3.3.1, §4.2.1); external_resources alimenta el ExternalGuideModal (§6).
-- Nadie salvo el service role los escribe (contenido curado por el equipo).
DROP POLICY IF EXISTS relevance_public_read ON module_relevance;
CREATE POLICY relevance_public_read ON module_relevance
    FOR SELECT USING (true);

DROP POLICY IF EXISTS resources_public_read ON external_resources;
CREATE POLICY resources_public_read ON external_resources
    FOR SELECT USING (true);

-- 3.3 analytics_events: INSERT para anon y authenticated, SIN SELECT.
-- La landing dispara eventos antes del login (§7.5: landing_viewed), por
-- eso anon puede insertar con user_id NULL. Un usuario autenticado solo
-- puede atribuirse eventos a sí mismo (nunca suplantar otro user_id).
-- Nadie lee desde el cliente: el análisis es del equipo, vía service role.
DROP POLICY IF EXISTS events_insert_anon ON analytics_events;
CREATE POLICY events_insert_anon ON analytics_events
    FOR INSERT TO anon
    WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS events_insert_authenticated ON analytics_events;
CREATE POLICY events_insert_authenticated ON analytics_events
    FOR INSERT TO authenticated
    WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 3.4 external_redirect_logs: INSERT abierto, SIN SELECT.
-- La tabla es agregada y anónima por diseño (§7.2: "mide demanda de
-- trámite, no comportamiento individual") — no tiene user_id.
DROP POLICY IF EXISTS redirect_logs_insert ON external_redirect_logs;
CREATE POLICY redirect_logs_insert ON external_redirect_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- 3.5 location_context_changes: INSERT y SELECT del propio usuario.
-- La transición "¿Ya llegaste?" (§3.2.3) registra el cambio desde el
-- cliente; el usuario puede ver su propio historial. Sin UPDATE/DELETE:
-- es un log inmutable.
DROP POLICY IF EXISTS own_context_changes_select ON location_context_changes;
CREATE POLICY own_context_changes_select ON location_context_changes
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS own_context_changes_insert ON location_context_changes;
CREATE POLICY own_context_changes_insert ON location_context_changes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3.6 subscriptions y stripe_events: SIN políticas de escritura.
-- Deliberado: el estado de una suscripción solo lo cambia el webhook de
-- Stripe (app/api/webhooks/stripe) con el cliente admin (service role,
-- que ignora RLS). El cliente solo LEE su suscripción (own_subscription).
-- stripe_events no tiene NINGUNA política: ni siquiera lectura — es
-- bookkeeping interno de idempotencia de webhooks.


-- ═════════════════════════════════════════════════════════════════════
-- ▼▼▼  0003_seed.sql
-- ═════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0003 SEED
--   · modules            — §7.4 EXACTO (7 módulos, ids fijos 1–7)
--   · module_relevance   — base_score de BASE_RELEVANCE §3.3.1 +
--                          alt_title por contexto según la tabla §4.2.1
--   · external_resources — los 7 trámites de la tabla §6, con
--                          instructions_json de 3 pasos al estilo §5-M1
--
-- Idempotencia: UPSERT (ON CONFLICT ... DO UPDATE) — re-ejecutar converge
-- al contenido del PRD sin duplicar filas. external_resources usa UUIDs
-- fijos para que el upsert por id sea posible.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1. Módulos (§7.4, transcripción fiel)
-- ─────────────────────────────────────────────────────────
INSERT INTO modules (id, title, slug, description, icon_name, accent_color, canonical_order, status) VALUES
(1, 'Bóveda Digital & Alertas',      'boveda',    'Guarda tus documentos y no pierdas ninguna fecha límite.', 'folder-lock', '#0F766E', 1, 'coming_soon'),
(2, 'Guía Migratoria & Consular',    'migracion', 'Visas, pasaportes y citas, paso a paso.',                   'plane',       '#102A43', 2, 'coming_soon'),
(3, 'Finanzas & Patrimonio',         'finanzas',  'Construye tu crédito y protege lo que ahorras.',            'trending-up', '#0E7C5A', 3, 'coming_soon'),
(4, 'Desarrollo Empresarial',        'negocio',   'Crea tu LLC y haz crecer tu negocio.',                      'building',    '#9A6B00', 4, 'coming_soon'),
(5, 'Comunidad & Vida Local',        'comunidad', 'Encuentra tu gente, eventos y servicios cerca de ti.',      'users',       '#12B8A6', 5, 'coming_soon'),
(6, 'Academia de Certificaciones',   'academia',  'Certifícate en carreras de alta demanda.',                  'graduation',  '#102A43', 6, 'coming_soon'),
(7, 'Conexión Laboral',              'empleo',    'Empleos que coinciden con tu perfil.',                      'briefcase',   '#0F766E', 7, 'coming_soon')
ON CONFLICT (id) DO UPDATE SET
    title           = EXCLUDED.title,
    slug            = EXCLUDED.slug,
    description     = EXCLUDED.description,
    icon_name       = EXCLUDED.icon_name,
    accent_color    = EXCLUDED.accent_color,
    canonical_order = EXCLUDED.canonical_order,
    status          = EXCLUDED.status;

-- El seed inserta ids explícitos en una columna SERIAL: hay que avanzar la
-- secuencia o el próximo INSERT sin id chocaría con id=1.
SELECT setval(pg_get_serial_sequence('modules', 'id'),
              (SELECT MAX(id) FROM modules));

-- ─────────────────────────────────────────────────────────
-- 2. Relevancia por contexto
--    base_score = BASE_RELEVANCE §3.3.1:
--      in_us:       M1 40 · M2 30 · M3 30 · M4 25 · M5 30 · M6 25 · M7 35
--      pre_arrival: M1 25 · M2 50 · M3 20 · M4 15 · M5 15 · M6 30 · M7  5
--    alt_title = tabla §4.2.1 ("Diferencias de copy, no de funcionalidad").
--    alt_description: el PRD solo especifica títulos por contexto; las
--    descripciones in_us reusan §7.4 y las pre_arrival son copy derivado
--    del PRD (§4.2.1, §5) — el copy visible final lo gobierna lib/i18n.
-- ─────────────────────────────────────────────────────────
INSERT INTO module_relevance (module_id, location_context, base_score, alt_title, alt_description) VALUES
-- Contexto in_us (títulos = §4.2.1 columna "Título in_us")
(1, 'in_us', 40, 'Bóveda Digital & Alertas',      'Guarda tus documentos y no pierdas ninguna fecha límite.'),
(2, 'in_us', 30, 'Trámites y Estatus Migratorio', 'Visas, pasaportes y citas, paso a paso.'),
(3, 'in_us', 30, 'Finanzas & Patrimonio',         'Construye tu crédito y protege lo que ahorras.'),
(4, 'in_us', 25, 'Desarrollo Empresarial',        'Crea tu LLC y haz crecer tu negocio.'),
(5, 'in_us', 30, 'Comunidad & Vida Local',        'Encuentra tu gente, eventos y servicios cerca de ti.'),
(6, 'in_us', 25, 'Academia de Certificaciones',   'Certifícate en carreras de alta demanda.'),
(7, 'in_us', 35, 'Conexión Laboral',              'Empleos que coinciden con tu perfil.'),
-- Contexto pre_arrival (títulos = §4.2.1 columna "Título pre_arrival")
(1, 'pre_arrival', 25, 'Tus documentos para el viaje',        'Reúne y organiza los documentos que vas a necesitar para viajar.'),
(2, 'pre_arrival', 50, 'Prepara tu visa y tu cita',           'Tu DS-160, tu cita consular y cada paso antes de viajar.'),
(3, 'pre_arrival', 20, 'Prepara tu llegada financiera',       'Organiza tu dinero antes del viaje y llega con un plan.'),
(4, 'pre_arrival', 15, 'Invierte o abre empresa en EE. UU.',  'Constituye tu LLC en EE. UU. sin ser residente.'),
(5, 'pre_arrival', 15, 'Conoce tu destino antes de llegar',   'Descubre cómo es la vida en la ciudad a la que llegas.'),
(6, 'pre_arrival', 30, 'Certifícate desde tu país',           'Empieza hoy una certificación de alta demanda desde tu país.'),
(7, 'pre_arrival',  5, 'Cómo funciona el mercado laboral',    'Entiende cómo se consigue empleo en EE. UU. antes de llegar.')
ON CONFLICT (module_id, location_context) DO UPDATE SET
    base_score      = EXCLUDED.base_score,
    alt_title       = EXCLUDED.alt_title,
    alt_description = EXCLUDED.alt_description;

-- ─────────────────────────────────────────────────────────
-- 3. Recursos externos (tabla §6) — instructions_json de 3 pasos (§5-M1)
--    Requisitos §6: last_verified_at visible al usuario; job semanal de
--    verificación de URLs (pendiente, fuera de esta migración).
--    UUIDs fijos → seed idempotente por id.
-- ─────────────────────────────────────────────────────────
INSERT INTO external_resources
    (id, module_slug, label, official_url, scope_type, scope_value, location_context, instructions_json, last_verified_at, verified_by, status)
VALUES
-- M1 · Tracking Estado de Caso (USCIS) — nacional, ambos contextos.
-- Pasos: transcripción fiel del modal de 3 pasos de §5-M1.
('a0000000-0000-4000-8000-000000000001', 'boveda',
 'Consultar Estado Oficial de Mi Caso (USCIS)',
 'https://egov.uscis.gov/casestatus/',
 'national', NULL, NULL,
 '[
   {"step": 1, "text": "Copia tu número de recibo (ej. EAC1234567890)."},
   {"step": 2, "text": "Haz clic en el enlace seguro oficial."},
   {"step": 3, "text": "Pega el número en el portal del gobierno."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M1 · Fechas de Corte Inmigración (EOIR) — nacional, ambos contextos.
('a0000000-0000-4000-8000-000000000002', 'boveda',
 'Consultar fechas de corte de inmigración (EOIR)',
 'https://portal.eoir.justice.gov',
 'national', NULL, NULL,
 '[
   {"step": 1, "text": "Ten a la mano tu número A (Alien Registration, 9 dígitos)."},
   {"step": 2, "text": "Haz clic en el enlace seguro oficial."},
   {"step": 3, "text": "Ingresa tu número A en el portal para consultar tu caso y tus fechas de corte."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M2 · Formulario Visa DS-160 — nacional, contexto pre_arrival.
('a0000000-0000-4000-8000-000000000003', 'migracion',
 'Llenar el formulario de visa DS-160',
 'https://ceac.state.gov',
 'national', NULL, 'pre_arrival',
 '[
   {"step": 1, "text": "Reúne tu pasaporte vigente y una foto digital reciente."},
   {"step": 2, "text": "Haz clic en el enlace seguro oficial de CEAC."},
   {"step": 3, "text": "Guarda tu Application ID apenas empieces; lo necesitas para retomar el formulario."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M2 · Citas Consulares — por país (§6: "Portales de Embajadas por País").
-- Se siembran MX, CO y GT como ejemplos de scope 'country'; el directorio
-- completo por nacionalidad se cura en iteraciones siguientes.
('a0000000-0000-4000-8000-000000000004', 'migracion',
 'Citas consulares — Embajada de EE. UU. en México',
 'https://mx.usembassy.gov/visas/',
 'country', 'MX', 'pre_arrival',
 '[
   {"step": 1, "text": "Completa primero tu DS-160 y guarda tu número de confirmación."},
   {"step": 2, "text": "Haz clic en el portal oficial de la embajada."},
   {"step": 3, "text": "Crea tu cuenta en el sistema de citas y agenda tu cita consular."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

('a0000000-0000-4000-8000-000000000005', 'migracion',
 'Citas consulares — Embajada de EE. UU. en Colombia',
 'https://co.usembassy.gov/visas/',
 'country', 'CO', 'pre_arrival',
 '[
   {"step": 1, "text": "Completa primero tu DS-160 y guarda tu número de confirmación."},
   {"step": 2, "text": "Haz clic en el portal oficial de la embajada."},
   {"step": 3, "text": "Crea tu cuenta en el sistema de citas y agenda tu cita consular."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

('a0000000-0000-4000-8000-000000000006', 'migracion',
 'Citas consulares — Embajada de EE. UU. en Guatemala',
 'https://gt.usembassy.gov/visas/',
 'country', 'GT', 'pre_arrival',
 '[
   {"step": 1, "text": "Completa primero tu DS-160 y guarda tu número de confirmación."},
   {"step": 2, "text": "Haz clic en el portal oficial de la embajada."},
   {"step": 3, "text": "Crea tu cuenta en el sistema de citas y agenda tu cita consular."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M2 · Citas Licencia de Manejo — DMV por estado (piloto: Utah), in_us.
('a0000000-0000-4000-8000-000000000007', 'migracion',
 'Agendar cita para tu licencia de manejo (DMV Utah)',
 'https://dmv.utah.gov',
 'state', 'UT', 'in_us',
 '[
   {"step": 1, "text": "Reúne tus documentos de identidad y dos comprobantes de domicilio en Utah."},
   {"step": 2, "text": "Haz clic en el enlace seguro oficial del DMV de Utah."},
   {"step": 3, "text": "Agenda tu cita en línea y lleva tus documentos el día de la visita."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M4 · Registro de LLC — Division of Corporations de Utah.
-- location_context NULL a propósito: un no residente sí puede constituir
-- una LLC desde el extranjero (§4.2.1, situación inversion_remota §3.3.1).
('a0000000-0000-4000-8000-000000000008', 'negocio',
 'Registrar tu LLC en Utah (Division of Corporations)',
 'https://corporations.utah.gov',
 'state', 'UT', NULL,
 '[
   {"step": 1, "text": "Elige el nombre de tu empresa y verifica que esté disponible en Utah."},
   {"step": 2, "text": "Haz clic en el portal oficial de corporaciones de Utah."},
   {"step": 3, "text": "Completa el registro en línea y guarda tu confirmación y número de entidad."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active'),

-- M6 · Registro PTIN (IRS) — nacional, ambos contextos (§6: irs.gov/ptin).
('a0000000-0000-4000-8000-000000000009', 'academia',
 'Solicitar tu PTIN del IRS (preparador de impuestos)',
 'https://www.irs.gov/ptin',
 'national', NULL, NULL,
 '[
   {"step": 1, "text": "Ten a la mano tu SSN o ITIN y tu declaración de impuestos más reciente."},
   {"step": 2, "text": "Haz clic en el enlace seguro oficial del IRS."},
   {"step": 3, "text": "Crea tu cuenta PTIN y completa la solicitud en línea."}
 ]'::jsonb,
 now(), 'ANDEX seed v1 (PRD §6)', 'active')

ON CONFLICT (id) DO UPDATE SET
    module_slug       = EXCLUDED.module_slug,
    label             = EXCLUDED.label,
    official_url      = EXCLUDED.official_url,
    scope_type        = EXCLUDED.scope_type,
    scope_value       = EXCLUDED.scope_value,
    location_context  = EXCLUDED.location_context,
    instructions_json = EXCLUDED.instructions_json,
    last_verified_at  = EXCLUDED.last_verified_at,
    verified_by       = EXCLUDED.verified_by,
    status            = EXCLUDED.status;


-- ═════════════════════════════════════════════════════════════════════
-- ▼▼▼  0004_auth.sql
-- ═════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0004 AUTH → PERFIL
-- Alta automática en public.users al registrarse en Supabase Auth.
--
-- Patrón estándar de Supabase: trigger AFTER INSERT sobre auth.users con
-- función SECURITY DEFINER (el dueño de public.users ignora RLS, así que
-- el alta funciona aunque la sesión del nuevo usuario aún no exista).
--
-- El formulario de registro pasa first_name / last_name en
-- options.data → auth.users.raw_user_meta_data. Si faltan (p. ej. magic
-- link directo), first_name queda '' — el usuario lo completa en el
-- wizard (paso 1) o en /perfil; NUNCA inventamos datos.
--
-- ON CONFLICT DO NOTHING: si la fila ya existe (reintento del webhook de
-- auth, import manual, etc.) el trigger no falla ni pisa datos.
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- search_path vacío: obligatorio en SECURITY DEFINER para impedir que un
-- search_path malicioso resuelva "users" hacia otra tabla.
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NULLIF(btrim(NEW.raw_user_meta_data ->> 'first_name'), ''), ''),
        NULLIF(btrim(NEW.raw_user_meta_data ->> 'last_name'), '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ═════════════════════════════════════════════════════════════════════
-- ▼▼▼  0005_schema_gaps.sql
-- ═════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0005 BRECHAS DEL ESQUEMA DEL PRD
--
-- Tres columnas que el PRD EXIGE en su texto pero que no aparecen en el
-- esquema de §7.2. Se añaden en una migración aparte, y no editando
-- 0001_schema.sql, para que la discrepancia quede visible y pueda
-- corregirse en una futura edición del documento (§11).
--
-- Registrado en docs/DECISIONES.md.
-- ═══════════════════════════════════════════════════════════════════════

-- ── 1. IP del consentimiento ────────────────────────────────────────────
-- §3.4.6, fila "Consentimiento afirmativo expreso":
--   "se registra en `user_consents` con versión de términos, timestamp e IP"
-- La tabla de §7.2 tiene versión y timestamp, pero NO la IP.
--
-- Nota de implementación: el navegador no conoce su propia IP. Este dato
-- solo puede escribirlo un route handler leyendo la cabecera de la
-- petición, así que el consentimiento se registra desde el servidor,
-- no desde el cliente.
ALTER TABLE user_consents
    ADD COLUMN IF NOT EXISTS ip_address INET;

COMMENT ON COLUMN user_consents.ip_address IS
    'IP desde la que se otorgó el consentimiento (§3.4.6). La escribe el '
    'servidor a partir de la cabecera de la petición; el cliente no puede.';

-- ── 2. Racha de sesiones sin abrir el módulo recomendado ────────────────
-- §3.3.2, re-ranking por comportamiento:
--   "No abrir el módulo recomendado en 3 sesiones consecutivas le resta -10"
-- Sin esta columna la regla es inaplicable: `user_module_ranking` de §7.2
-- solo guarda `open_count` y `dismissed_count`, que no distinguen "no lo
-- abrió en 3 sesiones seguidas" de "nunca lo abrió".
ALTER TABLE user_module_ranking
    ADD COLUMN IF NOT EXISTS sessions_without_open SMALLINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN user_module_ranking.sessions_without_open IS
    'Sesiones consecutivas en que se recomendó el módulo y no se abrió '
    '(§3.3.2: a partir de 3, -10 al score). Se reinicia al abrirlo.';

-- ── 3. Fecha de llegada en el historial de transición ───────────────────
-- §3.2.3 dispara el cambio de contexto con "estado + fecha de llegada".
-- `users.estimated_arrival_date` guarda la fecha DECLARADA de viaje; hace
-- falta distinguirla de la fecha REAL de llegada para medir la precisión
-- de la predicción, que es lo que decide cuándo enviar el aviso.
ALTER TABLE location_context_changes
    ADD COLUMN IF NOT EXISTS arrival_date DATE;

COMMENT ON COLUMN location_context_changes.arrival_date IS
    'Fecha real de llegada declarada al migrar a in_us (§3.2.3). '
    'Comparar con users.estimated_arrival_date mide si la predicción sirve.';

-- ── 4. Texto libre de "Mi país no está en la lista" ─────────────────────
-- Anexo C.2 cierra la lista de países con:
--   Opción final: "Mi país no está en la lista" → campo de texto libre
-- El esquema de §7.2 no tiene dónde guardarlo. Mismo patrón que el resto de
-- los "Otro" (§3.2.1): el enum guarda el código canónico ('XX') y el texto
-- libre viaja en su propia columna, sin contaminarlo.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS country_other TEXT;

COMMENT ON COLUMN users.country_other IS
    'Texto libre cuando country_of_residence = ''XX'' (Anexo C.2). '
    'Sanitizado antes de persistir, máx. 120 caracteres (§3.2.1 regla 5).';


-- ═════════════════════════════════════════════════════════════════════
-- ▼▼▼  0006_roles.sql
-- ═════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0006 ROLES Y ADMINISTRACIÓN
--
-- Hasta aquí el esquema sólo conocía "el usuario dueño de la fila". Para que
-- exista un panel donde alguien publique talleres, empleos o lecciones hace
-- falta una segunda clase de actor, y hace falta que las políticas RLS lo
-- sepan distinguir.
--
-- ── Por qué una TABLA de roles y no una columna en `users` ──
--
-- Es el error clásico de RLS en Postgres: si la política de `users` consulta
-- `users` para saber si quien pregunta es administrador, la política se
-- invoca a sí misma y Postgres aborta con recursión infinita. Una tabla
-- aparte, con su propia política trivial, rompe el ciclo.
--
-- Además admite varios roles por persona sin migrar nada el día que haga
-- falta un 'moderator' o un 'partner' (un empleador que publica sus propias
-- vacantes sin ver nada más).
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_roles (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL
                CHECK (role IN ('admin','moderator','partner')),
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    granted_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- ─────────────────────────────────────────────────────────
-- Helpers para las políticas
--
-- SECURITY DEFINER: la función se ejecuta con los permisos de quien la
-- creó, así que puede leer `user_roles` saltándose el RLS de esa tabla. Sin
-- esto volveríamos a la recursión que la tabla venía a evitar.
--
-- `search_path` fijado a public: sin eso, alguien con permiso de crear
-- objetos podría anteponer un esquema propio con una tabla `user_roles`
-- falsa y la función SECURITY DEFINER se la creería.
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION has_role(target_role VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = target_role
    );
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
$$;

-- ─────────────────────────────────────────────────────────
-- RLS de la propia tabla de roles
--
-- Cada quien ve los suyos (la interfaz necesita saber si enseñar el panel);
-- sólo un administrador ve y reparte todos. Nadie se puede dar un rol a sí
-- mismo: no hay política de INSERT para el usuario corriente.
-- ─────────────────────────────────────────────────────────
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS own_roles_read ON user_roles;
CREATE POLICY own_roles_read ON user_roles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS admin_roles_all ON user_roles;
CREATE POLICY admin_roles_all ON user_roles
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────
-- Convención compartida para TODO el contenido publicable
--
-- Talleres, empleos, lugares de apoyo y lecciones son cosas distintas con
-- campos distintos —y por eso llevan tablas propias, no una tabla genérica
-- con un JSON dentro, que sería imposible de consultar—. Pero comparten un
-- ciclo de vida, y compartirlo de verdad es lo que hace que el panel de
-- administración sea UNA pantalla y no cuatro.
--
--   draft     · el administrador lo está escribiendo, nadie más lo ve
--   published · visible para los miembros
--   archived  · deja de mostrarse pero no se borra (hay que poder auditar
--               qué se publicó y cuándo)
-- ─────────────────────────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE content_status AS ENUM ('draft','published','archived');
    END IF;
END
$$;

-- Toca `updated_at` en cualquier tabla que la tenga. `0001` ya define
-- `set_updated_at`; aquí sólo se comprueba para no depender del orden.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


-- ═════════════════════════════════════════════════════════════════════
-- ▼▼▼  0007_comunidad.sql
-- ═════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0007 COMUNIDAD: TALLERES EN VIVO
--
-- ── La decisión estructural: SERIE ≠ SESIÓN ──
--
-- La serie es lo que el administrador configura una vez ("Inglés para el
-- trabajo, martes a viernes, 18:00–20:00 hora de Utah"). La sesión es cada
-- ocurrencia concreta, y lleva SU PROPIO enlace.
--
-- No es una sutileza de modelado, es seguridad. Un enlace fijo que nunca
-- cambia deja entrar para siempre a cualquiera que lo consiga una vez: se
-- reenvía por WhatsApp y ya no hay forma de cerrarlo. En una sala donde
-- alguien va a decir en voz alta, con su cara y su nombre visibles, que
-- tiene una audiencia en corte de inmigración, eso no es una fuga de
-- negocio: es una lista de asistencia para quien la quiera.
--
-- Con enlace por sesión, el de la semana pasada ya no sirve.
--
-- Segunda consecuencia: una sesión suelta se puede cancelar, mover de hora o
-- cambiar de ponente sin tocar la serie.
--
-- ── Y por qué la hora se guarda como hora de pared + zona ──
--
-- Utah es horario de montaña: UTC−7 en invierno y UTC−6 en verano. Guardar
-- "las 18:00 son la 01:00 UTC" hace que medio año el taller salga a la hora
-- equivocada. Se guarda 18:00 + 'America/Denver' y el desfase se resuelve
-- para cada fecha (ver lib/community/schedule.ts, con sus pruebas).
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- Serie de talleres
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workshop_series (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(60) UNIQUE NOT NULL,

    -- Copy bilingüe. JSONB `{"es": "...", "en": "..."}` en vez de dos
    -- columnas: el idioma es dato, no esquema, y añadir un tercero no
    -- debería ser una migración.
    title           JSONB NOT NULL,
    summary         JSONB NOT NULL,
    description     JSONB,

    -- Qué módulo del catálogo §7.4 alimenta. Permite que la Bóveda o Empleo
    -- enseñen "hay un taller sobre esto el jueves" sin acoplarse a Comunidad.
    module_id       INT REFERENCES modules(id) ON DELETE SET NULL,

    -- Etiquetas de oficio para el emparejamiento con el perfil laboral:
    -- 'mesero', 'ninera', 'limpieza', 'jardineria'… Array y no tabla puente
    -- porque se consulta con `&&` y un índice GIN, y nunca se agrega por sí
    -- solo. Vacío = interesa a todo el mundo.
    occupation_tags TEXT[] NOT NULL DEFAULT '{}',

    -- ── Recurrencia, en hora de pared ──
    -- 0 = domingo … 6 = sábado, igual que `Date.getUTCDay()` en el cliente.
    weekdays        SMALLINT[] NOT NULL DEFAULT '{}',
    start_minutes   SMALLINT NOT NULL CHECK (start_minutes BETWEEN 0 AND 1439),
    end_minutes     SMALLINT NOT NULL CHECK (end_minutes   BETWEEN 1 AND 1440),
    time_zone       VARCHAR(50) NOT NULL DEFAULT 'America/Denver',

    -- Cero = sin límite. Un aforo pequeño y real vale más que uno inventado.
    capacity        INT NOT NULL DEFAULT 0 CHECK (capacity >= 0),

    host_name       VARCHAR(120),
    -- Se declara si lo conduce alguien habilitado para dar consejo legal.
    -- Sin esto, el copy NO puede prometer evaluación de casos: es la
    -- diferencia entre educar y ejercer la abogacía sin licencia.
    host_credential VARCHAR(120),

    status          content_status NOT NULL DEFAULT 'draft',
    published_at    TIMESTAMPTZ,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_series_horas CHECK (end_minutes > start_minutes)
);

CREATE INDEX IF NOT EXISTS idx_series_status ON workshop_series(status)
    WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_series_occupations ON workshop_series USING GIN(occupation_tags);

DROP TRIGGER IF EXISTS trg_series_updated ON workshop_series;
CREATE TRIGGER trg_series_updated BEFORE UPDATE ON workshop_series
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────
-- Sesión concreta
--
-- `starts_at` es un instante absoluto ya resuelto: el servidor lo calcula
-- al generar la sesión y desde ahí nadie tiene que volver a razonar sobre
-- horarios de verano. La hora de pared se conserva sólo como referencia
-- para el panel.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workshop_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id       UUID NOT NULL REFERENCES workshop_series(id) ON DELETE CASCADE,

    starts_at       TIMESTAMPTZ NOT NULL,
    ends_at         TIMESTAMPTZ NOT NULL,

    -- Puede diferir del de la serie en una sesión especial.
    title_override  JSONB,
    host_name       VARCHAR(120),

    -- ⚠️ El enlace NUNCA se sirve en HTML público ni se incrusta en un
    -- chunk del cliente: se entrega desde el servidor sólo a quien tiene
    -- sesión y membresía, y sólo cuando la sala está por abrir. La política
    -- RLS de abajo no basta por sí sola para eso — el filtro de tiempo lo
    -- aplica el servidor.
    join_url        TEXT,
    -- Lo que se le enseña a quien no debería entrar todavía.
    passcode_hint   VARCHAR(120),

    status          VARCHAR(20) NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','canceled','ended')),
    cancel_reason   JSONB,

    -- Se llena al terminar: cuánta gente entró de verdad. Es el único dato
    -- que dice si el taller sirve para algo.
    attendance      INT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_sesion_orden CHECK (ends_at > starts_at),
    -- Una serie no puede tener dos sesiones al mismo instante: protege
    -- contra generar el calendario dos veces.
    CONSTRAINT uq_sesion_serie_inicio UNIQUE (series_id, starts_at)
);

CREATE INDEX IF NOT EXISTS idx_sesiones_proximas ON workshop_sessions(starts_at)
    WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_sesiones_serie ON workshop_sessions(series_id, starts_at DESC);

DROP TRIGGER IF EXISTS trg_sesion_updated ON workshop_sessions;
CREATE TRIGGER trg_sesion_updated BEFORE UPDATE ON workshop_sessions
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────
-- Quién dijo que va
--
-- Sirve para tres cosas: recordarle antes de que empiece, medir cuántos
-- confirman frente a cuántos entran, y respetar el aforo. `attended` lo
-- rellena el administrador después, no el usuario.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workshop_registrations (
    session_id   UUID NOT NULL REFERENCES workshop_sessions(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    attended     BOOLEAN,
    -- Qué quiere resolver. Deja al ponente preparar la sesión con lo que la
    -- gente trae de verdad, en vez de con lo que se supone que necesita.
    question     TEXT,
    PRIMARY KEY (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_registros_usuario ON workshop_registrations(user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- RLS
--
-- Miembros: leen lo PUBLICADO y sólo eso. Un borrador no existe para nadie
-- salvo su autor y los administradores.
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE workshop_series        ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS series_leer_publicado ON workshop_series;
CREATE POLICY series_leer_publicado ON workshop_series
    FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS series_admin ON workshop_series;
CREATE POLICY series_admin ON workshop_series
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Una sesión es visible si su serie lo es. Sin esto, una serie en borrador
-- filtraría sus sesiones por la puerta de atrás.
DROP POLICY IF EXISTS sesiones_leer_publicado ON workshop_sessions;
CREATE POLICY sesiones_leer_publicado ON workshop_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workshop_series s
            WHERE s.id = workshop_sessions.series_id AND s.status = 'published'
        )
    );

DROP POLICY IF EXISTS sesiones_admin ON workshop_sessions;
CREATE POLICY sesiones_admin ON workshop_sessions
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Cada quien gestiona su propia inscripción; el administrador las ve todas
-- (necesita la lista para conducir la sesión).
DROP POLICY IF EXISTS registro_propio ON workshop_registrations;
CREATE POLICY registro_propio ON workshop_registrations
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS registro_admin ON workshop_registrations;
CREATE POLICY registro_admin ON workshop_registrations
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());


-- ═════════════════════════════════════════════════════════════════════
-- ▼▼▼  0008_empleo.sql
-- ═════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0008 EMPLEO: PERFIL LABORAL, VACANTES Y EMPAREJAMIENTO
--
-- ── La decisión más importante de este archivo ──
--
-- **NO se almacena el estatus migratorio ni la autorización de trabajo de
-- ninguna persona.** No hay columna donde ponerlo, y es a propósito.
--
-- Guardar "esta persona no tiene permiso de trabajo" junto a su nombre, su
-- teléfono y su ciudad es construir exactamente el expediente que esta
-- comunidad teme. Una filtración, una orden judicial o un empleado curioso
-- convierten la base de datos en una herramienta contra sus propios
-- usuarios. El PRD ya lo dice para el registro (§ estatus migratorio
-- opcional en todo el alta); aquí se lleva hasta el final: ni opcional.
--
-- La misma necesidad se resuelve del otro lado, y mejor: **la VACANTE
-- declara lo que exige** (`requires_ssn`, `requires_drivers_license`), que
-- es un hecho sobre el puesto y no sobre la persona. Quien quiera puede
-- filtrar por eso desde la interfaz sin decirnos nunca por qué. El filtro
-- vive en la sesión del navegador, no en una fila.
--
-- ── Y la otra: el emparejamiento se EXPLICA ──
--
-- Nada de caja negra. Igual que el motor de recomendación de módulos
-- (§7.1), cada coincidencia guarda su `reason_codes`, y la interfaz dice
-- "porque dijiste que buscas trabajo de limpieza y tienes carro". Para un
-- público al que ya le vendieron humo, un algoritmo que no puede explicarse
-- es un algoritmo en el que no se confía.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- Perfil laboral
--
-- Tabla aparte de `users` y no columnas nuevas, por tres razones: es
-- opcional, se llena a trozos, y así se puede borrar entera sin tocar la
-- cuenta — que es lo que hay que poder hacer cuando alguien pide que se le
-- olviden sus datos de empleo pero quiere conservar su bóveda.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS work_profile (
    user_id            UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- Qué trabajo busca. Etiquetas del catálogo de oficios: 'mesero',
    -- 'ninera', 'limpieza', 'jardineria', 'construccion', 'bodega'…
    -- En orden de preferencia: el primero pesa más al emparejar.
    occupations        TEXT[] NOT NULL DEFAULT '{}',

    -- Autoevaluado, nunca examinado. Sirve para elegir qué lección enseñar
    -- y para no mandar a alguien a una entrevista que no va a poder pasar.
    english_level      VARCHAR(20)
                       CHECK (english_level IN ('ninguno','basico','intermedio','avanzado')),

    years_experience   SMALLINT CHECK (years_experience BETWEEN 0 AND 60),
    has_vehicle        BOOLEAN,
    -- Cuánto está dispuesto a viajar. Sin transporte propio, 30 minutos en
    -- autobús es media ciudad menos.
    max_commute_min    SMALLINT CHECK (max_commute_min BETWEEN 0 AND 240),
    has_own_tools      BOOLEAN,

    -- Turnos disponibles: {"manana":true,"tarde":true,"noche":false,
    -- "findes":true}. JSONB porque la forma va a cambiar y no merece una
    -- migración cada vez.
    availability       JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Dónde busca. Por defecto hereda de `users`, pero se puede separar:
    -- hay quien vive en un sitio y busca en otro.
    search_state_us    CHAR(2),
    search_city        VARCHAR(100),

    -- Cuánto necesita ganar para que le salgan las cuentas. Guía el orden,
    -- nunca esconde vacantes: enseñar sólo lo que paga lo que pidió deja a
    -- alguien sin ver la única oferta que había.
    desired_pay_hourly NUMERIC(6,2),

    -- 0–100. Lo calcula el servidor. Su único fin es poder decir "con tres
    -- datos más te enseñamos 12 empleos que ahora no ves", que convierte
    -- rellenar el perfil en desbloquear algo en vez de en llenar un
    -- formulario.
    completeness       SMALLINT NOT NULL DEFAULT 0
                       CHECK (completeness BETWEEN 0 AND 100),

    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_profile_occupations ON work_profile USING GIN(occupations);
CREATE INDEX IF NOT EXISTS idx_work_profile_estado ON work_profile(search_state_us);

DROP TRIGGER IF EXISTS trg_work_profile_updated ON work_profile;
CREATE TRIGGER trg_work_profile_updated BEFORE UPDATE ON work_profile
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────
-- Empleadores
--
-- `verified_at` no es adorno: es la diferencia entre un tablón de anuncios
-- y algo por lo que se paga. Sin verificar, la vacante se muestra marcada
-- como tal — nunca escondida, pero nunca disfrazada.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(160) NOT NULL,
    website       TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(40),
    state_us      CHAR(2),
    city          VARCHAR(100),
    verified_at   TIMESTAMPTZ,
    verified_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_employers_updated ON employers;
CREATE TRIGGER trg_employers_updated BEFORE UPDATE ON employers
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────
-- Vacantes
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_postings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id       UUID REFERENCES employers(id) ON DELETE SET NULL,

    title             JSONB NOT NULL,
    description       JSONB,
    occupation_tags   TEXT[] NOT NULL DEFAULT '{}',

    state_us          CHAR(2),
    city              VARCHAR(100),
    -- Coordenadas para "cerca de mí". NUMERIC y no PostGIS: la extensión
    -- se puede añadir el día que la distancia importe de verdad.
    latitude          NUMERIC(9,6),
    longitude         NUMERIC(9,6),
    is_remote         BOOLEAN NOT NULL DEFAULT false,

    pay_min           NUMERIC(8,2),
    pay_max           NUMERIC(8,2),
    pay_period        VARCHAR(10) DEFAULT 'hour'
                      CHECK (pay_period IN ('hour','day','week','month','year')),

    -- ── Lo que el puesto EXIGE ──
    -- Hechos sobre la vacante. Nunca se comparan contra un estatus guardado
    -- —no existe—: quien mira decide si le sirve.
    requires_english      VARCHAR(20)
                          CHECK (requires_english IN ('ninguno','basico','intermedio','avanzado')),
    requires_vehicle      BOOLEAN NOT NULL DEFAULT false,
    requires_drivers_license BOOLEAN NOT NULL DEFAULT false,
    requires_ssn          BOOLEAN,   -- NULL = el empleador no lo declaró
    requires_experience   SMALLINT,

    shift_tags        TEXT[] NOT NULL DEFAULT '{}',  -- 'manana','noche','findes'

    -- A dónde se manda a la persona. Uno de los dos, o los dos.
    apply_url         TEXT,
    apply_instructions JSONB,

    status            content_status NOT NULL DEFAULT 'draft',
    published_at      TIMESTAMPTZ,
    -- Una vacante caducada que sigue visible es peor que no tener vacantes:
    -- se aplica, no contestan, y la culpa se la lleva ANDEX.
    expires_at        TIMESTAMPTZ,

    created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_pago CHECK (pay_max IS NULL OR pay_min IS NULL OR pay_max >= pay_min),
    CONSTRAINT chk_como_aplicar CHECK (apply_url IS NOT NULL OR apply_instructions IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_vacantes_vivas ON job_postings(published_at DESC)
    WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_vacantes_oficio ON job_postings USING GIN(occupation_tags);
CREATE INDEX IF NOT EXISTS idx_vacantes_estado ON job_postings(state_us, city);

DROP TRIGGER IF EXISTS trg_vacantes_updated ON job_postings;
CREATE TRIGGER trg_vacantes_updated BEFORE UPDATE ON job_postings
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────
-- Coincidencias calculadas
--
-- Se materializan en vez de calcularse al vuelo por una razón de producto,
-- no de rendimiento: hace falta poder decir "12 empleos nuevos para ti esta
-- semana" sin recorrer el catálogo entero en cada carga, y hace falta saber
-- cuáles ya se le enseñaron para no repetirlos.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_matches (
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id       UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    score        SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
    -- Códigos, no frases: el texto se resuelve en i18n. Es la misma regla
    -- que D3 impuso al motor de módulos, y por el mismo motivo.
    reason_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    computed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    shown_at     TIMESTAMPTZ,
    PRIMARY KEY (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_match_usuario ON job_matches(user_id, score DESC);

-- ─────────────────────────────────────────────────────────
-- Guardados y aplicaciones
--
-- `applied` lo marca la persona, no el sistema: aplicar ocurre fuera de
-- ANDEX y lo único honesto es preguntarle si lo hizo. Sirve además para lo
-- único que mide si el módulo funciona: cuánta gente consiguió trabajo.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_interactions (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id      UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    saved       BOOLEAN NOT NULL DEFAULT false,
    applied_at  TIMESTAMPTZ,
    outcome     VARCHAR(20)
                CHECK (outcome IN ('sin_respuesta','entrevista','contratado','descartado')),
    note        TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, job_id)
);

DROP TRIGGER IF EXISTS trg_interacciones_updated ON job_interactions;
CREATE TRIGGER trg_interacciones_updated BEFORE UPDATE ON job_interactions
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE work_profile     ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_interactions ENABLE ROW LEVEL SECURITY;

-- El perfil laboral es del usuario y de nadie más. Ni siquiera de un
-- administrador: no hay razón para que el equipo lea lo que alguien busca.
DROP POLICY IF EXISTS work_profile_propio ON work_profile;
CREATE POLICY work_profile_propio ON work_profile
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Vacantes publicadas y no caducadas: visibles para cualquiera con sesión.
DROP POLICY IF EXISTS vacantes_leer ON job_postings;
CREATE POLICY vacantes_leer ON job_postings
    FOR SELECT USING (
        status = 'published' AND (expires_at IS NULL OR expires_at > now())
    );

DROP POLICY IF EXISTS vacantes_admin ON job_postings;
CREATE POLICY vacantes_admin ON job_postings
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS empleadores_leer ON employers;
CREATE POLICY empleadores_leer ON employers FOR SELECT USING (true);

DROP POLICY IF EXISTS empleadores_admin ON employers;
CREATE POLICY empleadores_admin ON employers
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Las coincidencias las escribe el servidor (service role), nunca el
-- cliente: si el usuario pudiera insertarlas, podría inventarse su propio
-- score. Por eso sólo hay política de lectura.
DROP POLICY IF EXISTS match_propio ON job_matches;
CREATE POLICY match_propio ON job_matches
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS interaccion_propia ON job_interactions;
CREATE POLICY interaccion_propia ON job_interactions
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════
-- ▼▼▼  0009_lugares_y_ingles.sql
-- ═════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0009 LUGARES DE APOYO E INGLÉS POR OFICIO
--
-- Las dos mitades que cierran la cadena del producto:
--
--   perfil → vacante que encaja → el inglés EXACTO de esa vacante → aplicar
--
-- El inglés no es un curso: es munición para una entrevista concreta. Por
-- eso las lecciones se indexan por oficio y no por nivel gramatical. Quien
-- busca trabajo de limpieza no necesita el presente perfecto, necesita las
-- veinte frases que le van a decir el primer día.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- Lugares de apoyo
--
-- Clínicas comunitarias, bancos de comida, consulados, bibliotecas,
-- organizaciones de ayuda legal. Sólo dentro de EE. UU.
--
-- ⚠️ `is_free` y `accepts_uninsured` son los dos campos que de verdad
-- deciden si alguien va o no va. Un hospital que no acepta a quien no tiene
-- seguro no es un recurso, es una pérdida de tiempo y un susto.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_places (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              VARCHAR(200) NOT NULL,
    category          VARCHAR(40) NOT NULL
                      CHECK (category IN (
                          'salud','ayuda_legal','comida','educacion',
                          'consulado','vivienda','empleo','otro'
                      )),
    description       JSONB,

    state_us          CHAR(2) NOT NULL,
    city              VARCHAR(100),
    address           TEXT,
    postal_code       VARCHAR(12),
    latitude          NUMERIC(9,6),
    longitude         NUMERIC(9,6),

    phone             VARCHAR(40),
    website           TEXT,
    -- Texto libre por idioma: los horarios reales de estos sitios no caben
    -- en una estructura ("martes y jueves 9-12, cerrado la última semana
    -- del mes").
    hours             JSONB,

    speaks_spanish    BOOLEAN,
    is_free           BOOLEAN,
    accepts_uninsured BOOLEAN,
    -- Si el sitio declara públicamente que no pregunta por estatus. Es el
    -- dato que más pesa para esta comunidad, y por eso se guarda como lo
    -- que es: una declaración del lugar, con su fuente.
    no_status_question BOOLEAN,
    source_url        TEXT,
    verified_at       TIMESTAMPTZ,

    status            content_status NOT NULL DEFAULT 'draft',
    created_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lugares_estado ON support_places(state_us, category)
    WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_lugares_geo ON support_places(latitude, longitude);

DROP TRIGGER IF EXISTS trg_lugares_updated ON support_places;
CREATE TRIGGER trg_lugares_updated BEFORE UPDATE ON support_places
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────
-- Rutas de inglés, una por oficio
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_tracks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(60) UNIQUE NOT NULL,
    title           JSONB NOT NULL,
    summary         JSONB,
    -- El oficio al que sirve. Es la bisagra con `job_postings` y con
    -- `work_profile`: la misma etiqueta en los tres sitios.
    occupation_tag  VARCHAR(40) NOT NULL,
    level           VARCHAR(20) NOT NULL DEFAULT 'basico'
                    CHECK (level IN ('ninguno','basico','intermedio','avanzado')),
    status          content_status NOT NULL DEFAULT 'draft',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rutas_oficio ON lesson_tracks(occupation_tag)
    WHERE status = 'published';

-- ─────────────────────────────────────────────────────────
-- Lecciones
--
-- `phrases` es un array JSONB de
--   {"en": "Where do I clock in?", "es": "¿Dónde marco mi entrada?",
--    "say": "uér du ai clok in"}
--
-- Ese tercer campo —la pronunciación escrita como suena en español— es
-- deliberado y probablemente lo más útil de todo el módulo. El alfabeto
-- fonético no lo lee nadie; "uér du ai clok in" lo lee cualquiera que sepa
-- leer español, y es la diferencia entre practicar en casa o no practicar.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id    UUID NOT NULL REFERENCES lesson_tracks(id) ON DELETE CASCADE,
    position    SMALLINT NOT NULL DEFAULT 0,
    title       JSONB NOT NULL,
    -- En qué momento real del trabajo se usa esto: 'entrevista',
    -- 'primer_dia', 'con_el_jefe', 'emergencia'. Ordenar por situación y no
    -- por dificultad es lo que hace que sirva para el jueves que viene.
    situation   VARCHAR(40),
    phrases     JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Sesión de taller donde se practica en vivo, si la hay.
    session_id  UUID REFERENCES workshop_sessions(id) ON DELETE SET NULL,
    status      content_status NOT NULL DEFAULT 'draft',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lecciones_ruta ON lessons(track_id, position);

-- ─────────────────────────────────────────────────────────
-- Progreso
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    practiced    SMALLINT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, lesson_id)
);

-- ═══════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE support_places  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_tracks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lugares_leer ON support_places;
CREATE POLICY lugares_leer ON support_places
    FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS lugares_admin ON support_places;
CREATE POLICY lugares_admin ON support_places
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS rutas_leer ON lesson_tracks;
CREATE POLICY rutas_leer ON lesson_tracks
    FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS rutas_admin ON lesson_tracks;
CREATE POLICY rutas_admin ON lesson_tracks
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Una lección es visible si su ruta lo es.
DROP POLICY IF EXISTS lecciones_leer ON lessons;
CREATE POLICY lecciones_leer ON lessons
    FOR SELECT USING (
        status = 'published'
        AND EXISTS (
            SELECT 1 FROM lesson_tracks t
            WHERE t.id = lessons.track_id AND t.status = 'published'
        )
    );
DROP POLICY IF EXISTS lecciones_admin ON lessons;
CREATE POLICY lecciones_admin ON lessons
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS progreso_propio ON lesson_progress;
CREATE POLICY progreso_propio ON lesson_progress
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- ═════════════════════════════════════════════════════════════════════
-- ▼▼▼  0010_fuentes_empleo.sql
-- ═════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — 0010 FUENTES DE VACANTES
--
-- Prepara `job_postings` para recibir vacantes de fuera además de las que
-- se cargan a mano. La fuente elegida es la API de empleo de CareerOneStop
-- (Departamento de Trabajo de EE. UU.), que sirve el caudal del National
-- Labor Exchange: vacantes verificadas, sin duplicar y refrescadas a diario,
-- procedentes de las agencias estatales de empleo de los 50 estados.
--
-- El razonamiento y sus citas: docs/evidencia-fuentes-empleo.md
--
-- ── Por qué NO se raspan portales ──
-- Lo legal ya bastaría, pero el motivo que manda aquí es otro: lo que se
-- raspa no se puede verificar, y las estafas de empleo apuntan justo a esta
-- población. Una vacante falsa servida por ANDEX no cuesta una vacante:
-- cuesta lo único que el producto vende.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE job_postings
    -- De dónde salió. `manual` es la carga del panel; `partner`, un
    -- empleador que publica lo suyo; `nlx`, la sincronización oficial.
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual','nlx','partner')),

    -- Identificador en la fuente. Sin esto, cada sincronización duplicaría
    -- el catálogo entero.
    ADD COLUMN IF NOT EXISTS external_id VARCHAR(120),

    -- Código ocupacional del Departamento de Trabajo (O*NET/SOC). Es como se
    -- consulta la API y como se mapean sus vacantes a nuestras etiquetas de
    -- oficio sin adivinar por el título.
    ADD COLUMN IF NOT EXISTS onet_code VARCHAR(20),

    -- Cuándo se vio por última vez en la fuente. Una vacante que dejó de
    -- aparecer en la sincronización está cerrada: seguir enseñándola manda a
    -- alguien a aplicar a algo que ya no existe, y la culpa se la lleva
    -- ANDEX.
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,

    -- Atribución que la fuente exija mostrar junto a la vacante.
    ADD COLUMN IF NOT EXISTS source_attribution TEXT;

-- Una vacante externa es única por (fuente, id en la fuente). Parcial para
-- que las cargadas a mano —sin `external_id`— no choquen entre sí.
CREATE UNIQUE INDEX IF NOT EXISTS uq_vacante_externa
    ON job_postings(source, external_id)
    WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vacantes_onet ON job_postings(onet_code);
CREATE INDEX IF NOT EXISTS idx_vacantes_sincro ON job_postings(source, last_seen_at);

-- ─────────────────────────────────────────────────────────
-- Bitácora de sincronizaciones
--
-- Existe para poder contestar "¿por qué hoy no hay vacantes nuevas?" sin
-- adivinar. Una sincronización que falla en silencio deja el catálogo
-- congelado y nadie se entera hasta que un usuario se queja.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_sync_runs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source        VARCHAR(20) NOT NULL,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at   TIMESTAMPTZ,
    status        VARCHAR(20) NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running','ok','failed')),
    fetched       INT NOT NULL DEFAULT 0,
    created       INT NOT NULL DEFAULT 0,
    updated       INT NOT NULL DEFAULT 0,
    closed        INT NOT NULL DEFAULT 0,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sincro_recientes ON job_sync_runs(started_at DESC);

ALTER TABLE job_sync_runs ENABLE ROW LEVEL SECURITY;

-- Sólo administradores. La escribe el proceso de sincronización con el
-- service role, que se salta RLS por definición.
DROP POLICY IF EXISTS sincro_admin ON job_sync_runs;
CREATE POLICY sincro_admin ON job_sync_runs
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());
