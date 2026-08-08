/**
 * Cliente de Supabase para el SERVIDOR (RSC, route handlers, server actions).
 *
 * Lee y escribe la sesión desde las cookies de next/headers. Igual que el
 * cliente de navegador, usa la anon key: RLS (§7.3) sigue siendo la frontera
 * de seguridad. Para saltarse RLS está lib/supabase/admin.ts (solo webhooks).
 *
 * Nota de Next 15: `cookies()` es asíncrono, por eso el factory es async.
 * En un React Server Component las cookies son de solo lectura y `setAll`
 * lanza; se ignora a propósito — el refresco de sesión lo hace el middleware
 * (agente de Auth).
 */

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db-types";

/** Mismo desajuste de genéricos que en lib/supabase/client.ts — ver nota allí. */
export type AndexServerClient = SupabaseClient<Database>;

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function getSupabaseServerClient(): Promise<AndexServerClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase no está configurado: faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // RSC: cookies de solo lectura. El middleware refresca la sesión.
        }
      },
    },
  }) as unknown as AndexServerClient;
}

/**
 * Atajo para route handlers: devuelve el id del usuario autenticado o null.
 * Usa getUser() (valida el token contra Supabase), no getSession().
 */
export async function getServerUserId(): Promise<string | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}
