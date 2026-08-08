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
