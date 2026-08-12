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
