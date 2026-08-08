/**
 * Cliente de Supabase para el NAVEGADOR (client components).
 *
 * Sesión y RLS: usa la anon key + la sesión del usuario guardada en cookies.
 * TODA la seguridad la impone RLS (§7.3) — este cliente nunca ve datos ajenos.
 * NUNCA usar aquí la service role key (ver lib/supabase/admin.ts).
 *
 * La UI no importa esto: consume la capa de datos vía getDataStore()
 * (lib/data/index.ts). Lo usa lib/data/supabase-store.ts.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db-types";

/**
 * ⚠️ Desajuste de versiones conocido: @supabase/ssr 0.6.1 declara
 * `createBrowserClient<Database, SchemaName, Schema>` contra la firma de
 * genéricos de supabase-js < 2.5x, pero el instalado es 2.112, donde el
 * tercer parámetro ya es un nombre de esquema. Si se le pasa `Database` a la
 * factory, todas las tablas se resuelven a `never`.
 *
 * Solución: llamar a la factory SIN genéricos y tipar el resultado con la
 * firma moderna de supabase-js. El cast es seguro — el cliente es el mismo
 * objeto en runtime. Se elimina cuando se actualice @supabase/ssr (ver
 * reporte del agente de Datos).
 */
export type AndexSupabaseClient = SupabaseClient<Database>;

let browserClient: AndexSupabaseClient | null = null;

/**
 * Singleton: @supabase/ssr recomienda una sola instancia por documento
 * para no duplicar el listener de refresco de token.
 */
export function getSupabaseBrowserClient(): AndexSupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // isDemoMode (lib/config.ts) debería haber evitado llegar aquí.
    throw new Error(
      "Supabase no está configurado: faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Sin ellas la app corre en modo demo (lib/data/demo-store.ts).",
    );
  }

  browserClient = createBrowserClient(url, anonKey) as unknown as AndexSupabaseClient;
  return browserClient;
}
