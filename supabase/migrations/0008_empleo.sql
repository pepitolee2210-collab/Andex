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
