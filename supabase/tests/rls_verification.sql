-- ═══════════════════════════════════════════════════════════════════════
-- ANDEX — VERIFICACIÓN DE ROW LEVEL SECURITY (DoD PRD §7.3)
--
-- "Un test que intente leer datos de otro usuario" — este script crea dos
-- usuarios ficticios (Ana y Bruno), se hace pasar por cada rol (usuario A,
-- anónimo) usando la técnica oficial de impersonación de PostgREST
-- (SET LOCAL ROLE + request.jwt.claims) y verifica que:
--
--   · A NO puede leer ni editar nada de B (perfil, onboarding, suscripción,
--     ranking, consentimientos, historial de contexto).
--   · A NO puede insertar filas a nombre de B.
--   · Los catálogos (modules, module_relevance, external_resources) son
--     legibles por todos.
--   · La telemetría se puede insertar pero NO leer desde el cliente.
--   · subscriptions / stripe_events NO admiten escritura de clientes.
--
-- CÓMO CORRERLO (ver supabase/README.md):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_verification.sql
--   (o pegarlo completo en el SQL Editor de Supabase)
--
-- Requisitos: haber aplicado 0001–0003; conectarse como `postgres`
-- (dueño de las tablas: puede sembrar saltándose RLS y hacer SET ROLE).
-- TODO corre dentro de una transacción y termina en ROLLBACK: no deja
-- ningún dato en la base.
--
-- Si TODO pasa: verás una lista de "PASS ..." y "RLS OK" al final.
-- Si algo falla: el script aborta con "FAIL ..." (EXCEPTION).
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────
-- 0. Semilla de prueba (como postgres, dueño ⇒ ignora RLS)
-- ─────────────────────────────────────────────────────────
INSERT INTO users (id, email, first_name, location_context, current_state_us)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ana.rls-test@example.com', 'Ana', 'in_us', 'UT')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, first_name, location_context, country_of_residence)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bruno.rls-test@example.com', 'Bruno', 'pre_arrival', 'MX')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_onboarding_profile (user_id, situation_tag, seeking_for, current_step, branch)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'visa_aprobada', 'self', 3, 'pre_arrival')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_consents (user_id, consent_type, document_version, granted)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'terms', 'v1-2026-08', true);

INSERT INTO subscriptions (user_id, plan_type, status, current_period_end)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'monthly', 'active', now() + interval '1 month');

INSERT INTO user_module_ranking (user_id, module_id, score, reason)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 2, 88, '{"type":"context_default","context":"pre_arrival"}')
ON CONFLICT (user_id, module_id) DO NOTHING;

INSERT INTO location_context_changes (user_id, from_context, to_context, trigger_source)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'pre_arrival', 'pre_arrival', 'profile');

-- ─────────────────────────────────────────────────────────
-- 1. Impersonar al usuario A (rol authenticated, sub = A)
-- ─────────────────────────────────────────────────────────
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
                  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
                  true);
SELECT set_config('request.jwt.claim.sub',
                  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                  true);

DO $$
DECLARE
    n integer;
BEGIN
    -- T1 · A no ve la fila de B en users
    SELECT count(*) INTO n FROM users WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T1: A puede LEER el perfil de B (users)'; END IF;
    RAISE NOTICE 'PASS T1: A no lee el perfil de B';

    -- T2 · Todo lo visible en users es del propio A
    SELECT count(*) INTO n FROM users WHERE id <> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T2: A ve filas ajenas en users (%)', n; END IF;
    RAISE NOTICE 'PASS T2: A solo ve su propia fila en users';

    -- T3 · A no puede editar a B (el UPDATE no alcanza la fila)
    UPDATE users SET first_name = 'hackeado' WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T3: A pudo EDITAR el perfil de B'; END IF;
    RAISE NOTICE 'PASS T3: A no edita el perfil de B';

    -- T4 · Onboarding de B invisible
    SELECT count(*) INTO n FROM user_onboarding_profile
     WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T4: A lee el onboarding de B'; END IF;
    RAISE NOTICE 'PASS T4: A no lee el onboarding de B';

    -- T5 · Suscripción de B invisible
    SELECT count(*) INTO n FROM subscriptions
     WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T5: A lee la suscripción de B'; END IF;
    RAISE NOTICE 'PASS T5: A no lee la suscripción de B';

    -- T6 · Ranking y consentimientos de B invisibles
    SELECT count(*) INTO n FROM user_module_ranking
     WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T6a: A lee el ranking de B'; END IF;
    SELECT count(*) INTO n FROM user_consents
     WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T6b: A lee los consentimientos de B'; END IF;
    SELECT count(*) INTO n FROM location_context_changes
     WHERE user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T6c: A lee el historial de contexto de B'; END IF;
    RAISE NOTICE 'PASS T6: ranking, consentimientos e historial de B invisibles';

    -- T7 · A no puede firmar consentimientos a nombre de B
    BEGIN
        INSERT INTO user_consents (user_id, consent_type, document_version, granted)
        VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'terms', 'v1-2026-08', true);
        RAISE EXCEPTION 'FAIL T7: A insertó un consentimiento a nombre de B';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS T7: RLS bloqueó consentimiento a nombre de B';
    END;

    -- T8 · A sí registra SU consentimiento (§3.4.6 exige poder registrarlo)
    INSERT INTO user_consents (user_id, consent_type, document_version, granted)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'terms', 'v1-2026-08', true);
    RAISE NOTICE 'PASS T8: A registra su propio consentimiento';

    -- T9 · Analítica: A no puede atribuir eventos a B
    BEGIN
        INSERT INTO analytics_events (user_id, event_name, properties)
        VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'module_opened', '{"module_id":2}');
        RAISE EXCEPTION 'FAIL T9: A insertó analítica a nombre de B';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS T9: RLS bloqueó analítica a nombre de B';
    END;

    -- T10 · Analítica propia y anónima sí entran; leerla, jamás
    INSERT INTO analytics_events (user_id, event_name)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'module_opened');
    INSERT INTO analytics_events (user_id, event_name) VALUES (NULL, 'landing_viewed');
    SELECT count(*) INTO n FROM analytics_events;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T10: un cliente puede LEER analytics_events'; END IF;
    RAISE NOTICE 'PASS T10: analítica se inserta pero no se lee';

    -- T11 · Catálogos públicos legibles
    SELECT count(*) INTO n FROM modules;
    IF n < 7 THEN RAISE EXCEPTION 'FAIL T11a: modules ilegible o sin seed (%)', n; END IF;
    SELECT count(*) INTO n FROM module_relevance;
    IF n < 14 THEN RAISE EXCEPTION 'FAIL T11b: module_relevance ilegible o sin seed (%)', n; END IF;
    SELECT count(*) INTO n FROM external_resources;
    IF n < 1 THEN RAISE EXCEPTION 'FAIL T11c: external_resources ilegible o sin seed'; END IF;
    RAISE NOTICE 'PASS T11: catálogos públicos legibles';

    -- T12 · Nadie escribe suscripciones desde el cliente (solo service role)
    BEGIN
        INSERT INTO subscriptions (user_id, plan_type, status)
        VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'monthly', 'active');
        RAISE EXCEPTION 'FAIL T12: un cliente insertó en subscriptions';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS T12: subscriptions solo se escribe con service role';
    END;

    -- T13 · stripe_events: ni leer ni escribir desde el cliente
    SELECT count(*) INTO n FROM stripe_events;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T13a: un cliente puede leer stripe_events'; END IF;
    BEGIN
        INSERT INTO stripe_events (event_id, event_type) VALUES ('evt_test_rls', 'noop');
        RAISE EXCEPTION 'FAIL T13b: un cliente insertó en stripe_events';
    EXCEPTION
        WHEN insufficient_privilege THEN NULL;
    END;
    RAISE NOTICE 'PASS T13: stripe_events es invisible e inescribible';

    -- T14 · A no puede crear ranking a nombre de B
    BEGIN
        INSERT INTO user_module_ranking (user_id, module_id, score)
        VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 1, 99);
        RAISE EXCEPTION 'FAIL T14: A insertó ranking a nombre de B';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS T14: RLS bloqueó ranking a nombre de B';
    END;

    -- T15 · A sí escribe su propio ranking y su historial de contexto
    INSERT INTO user_module_ranking (user_id, module_id, score, reason)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, 40, '{"type":"context_default","context":"in_us"}')
    ON CONFLICT (user_id, module_id) DO UPDATE SET score = EXCLUDED.score;
    INSERT INTO location_context_changes (user_id, from_context, to_context, trigger_source)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'pre_arrival', 'in_us', 'banner');
    RAISE NOTICE 'PASS T15: A escribe su ranking y su historial de contexto';

    -- T16 · Logs de redirección: insertar sí, leer no
    INSERT INTO external_redirect_logs (module_slug, target_url, user_state)
    VALUES ('boveda', 'https://egov.uscis.gov/casestatus/', 'UT');
    SELECT count(*) INTO n FROM external_redirect_logs;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL T16: un cliente puede leer external_redirect_logs'; END IF;
    RAISE NOTICE 'PASS T16: redirect logs se insertan pero no se leen';
END $$;

-- ─────────────────────────────────────────────────────────
-- 2. Impersonar visitante anónimo (rol anon, sin sub)
-- ─────────────────────────────────────────────────────────
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SELECT set_config('request.jwt.claim.sub', '', true);

DO $$
DECLARE
    n integer;
BEGIN
    -- A1 · Un anónimo no ve ningún usuario
    SELECT count(*) INTO n FROM users;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL A1: anon puede leer users (%)', n; END IF;
    RAISE NOTICE 'PASS A1: anon no lee users';

    -- A2 · Catálogo visible sin sesión (landing/paywall §0.4)
    SELECT count(*) INTO n FROM modules;
    IF n < 7 THEN RAISE EXCEPTION 'FAIL A2: anon no puede leer modules'; END IF;
    RAISE NOTICE 'PASS A2: anon lee el catálogo de módulos';

    -- A3 · Analítica anónima: entra con user_id NULL…
    INSERT INTO analytics_events (user_id, event_name, properties)
    VALUES (NULL, 'landing_viewed', '{"lang":"es"}');
    RAISE NOTICE 'PASS A3: anon inserta analítica sin user_id';

    -- A4 · …pero jamás con user_id de alguien
    BEGIN
        INSERT INTO analytics_events (user_id, event_name)
        VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'landing_viewed');
        RAISE EXCEPTION 'FAIL A4: anon insertó analítica con user_id ajeno';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS A4: RLS bloqueó analítica anónima con user_id';
    END;

    -- A5 · anon no registra consentimientos
    BEGIN
        INSERT INTO user_consents (user_id, consent_type, document_version, granted)
        VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'terms', 'v1-2026-08', true);
        RAISE EXCEPTION 'FAIL A5: anon insertó un consentimiento';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE 'PASS A5: anon no registra consentimientos';
    END;

    -- A6 · Redirect log anónimo permitido (tabla agregada, sin user_id)
    INSERT INTO external_redirect_logs (module_slug, target_url, user_state)
    VALUES ('migracion', 'https://ceac.state.gov', NULL);
    RAISE NOTICE 'PASS A6: anon registra redirect log';

    RAISE NOTICE '─────────────────────────────────────────────';
    RAISE NOTICE 'RLS OK: todas las verificaciones pasaron.';
    RAISE NOTICE 'ROLLBACK a continuación: la base queda intacta.';
    RAISE NOTICE '─────────────────────────────────────────────';
END $$;

-- Nada de lo anterior persiste.
ROLLBACK;
