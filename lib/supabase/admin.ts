/**
 * Cliente ADMIN de Supabase (service role) — SALTA RLS POR COMPLETO.
 *
 * Uso permitido, único y taxativo (brief §6 y PRD §7.3):
 *   · webhook de Stripe (app/api/webhooks/stripe) escribiendo `subscriptions`
 *     y `stripe_events`, que no tienen políticas de escritura a propósito.
 *   · jobs de servidor (verificación semanal de URLs de `external_resources`).
 *
 * PROHIBIDO importarlo desde un componente, un hook o cualquier código que
 * pueda acabar en el bundle del navegador: exportaría la llave maestra de la
 * base de datos.
 *
 * Guard: el paquete `server-only` NO está instalado (no se instalan
 * dependencias en esta sesión — ver brief §2), así que el guard es en
 * runtime: si esto se ejecuta en un navegador, lanza.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db-types";

/** Ver nota de tipos en lib/supabase/client.ts. */
export type AndexAdminClient = ReturnType<typeof createClient<Database>>;

if (typeof window !== "undefined") {
  throw new Error(
    "lib/supabase/admin.ts se importó en el navegador. Este módulo usa la " +
      "SERVICE ROLE KEY y solo puede ejecutarse en el servidor. " +
      "Desde la UI usa getDataStore() (lib/data).",
  );
}

let adminClient: AndexAdminClient | null = null;

export function getSupabaseAdminClient(): AndexAdminClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "getSupabaseAdminClient() invocado en el navegador. Solo servidor.",
    );
  }
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY: " +
        "el cliente admin no puede inicializarse.",
    );
  }

  adminClient = createClient<Database>(url, serviceKey, {
    auth: {
      // Sin sesión, sin refresco, sin persistencia: es una llave de servicio.
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return adminClient;
}
