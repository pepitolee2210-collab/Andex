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
