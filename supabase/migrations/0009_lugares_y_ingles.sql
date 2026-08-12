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
