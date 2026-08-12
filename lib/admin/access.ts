/**
 * PANEL DE ADMINISTRACIÓN — quién puede entrar.
 *
 * ── Las dos vías, y por qué la de demo no puede filtrarse a producción ──
 *
 * En producción manda la base de datos: la tabla `user_roles` y la función
 * `is_admin()` de `0006_roles.sql`, aplicada por las políticas RLS. Aunque
 * alguien se saltara esta comprobación y llegara a la pantalla, la base le
 * devolvería cero filas y no podría escribir nada. La seguridad real vive
 * ahí, no aquí: esto sólo evita enseñar una interfaz inútil.
 *
 * En modo demo no hay base ni usuarios reales —la app corre sin credenciales
 * con datos en el navegador (D2)— así que cualquiera con sesión es
 * administrador. Es necesario para poder probar el panel, y es seguro por
 * construcción: `isDemoMode` es falso en cuanto existen las credenciales de
 * Supabase, de modo que un despliegue real NUNCA pasa por esta rama.
 */

import { isDemoMode } from "@/lib/config";

/**
 * Correo con permiso de administrador en modo demo.
 *
 * Sin la variable, cualquier sesión demo vale. Con ella, sólo ese correo —
 * útil para grabar una demostración sin que el panel salga por en medio.
 */
const DEMO_ADMIN = process.env.ANDEX_DEMO_ADMIN_EMAIL?.trim().toLowerCase();

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!isDemoMode) return false;
  if (!DEMO_ADMIN) return true;
  return (email ?? "").trim().toLowerCase() === DEMO_ADMIN;
}
