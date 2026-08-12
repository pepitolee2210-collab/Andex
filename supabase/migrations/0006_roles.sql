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
