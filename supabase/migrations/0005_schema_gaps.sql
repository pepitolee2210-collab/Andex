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
