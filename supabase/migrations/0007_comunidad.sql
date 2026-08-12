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
