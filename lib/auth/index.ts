/**
 * Contrato de autenticación — LADO SERVIDOR.
 *
 * FIRMAS CONGELADAS (`getSessionUser`, `requireUser`, `SessionUser`): wizard,
 * paywall y panel ya programan contra ellas. Aquí solo se añaden exports.
 *
 * Doble modo, decidido por `isDemoMode` (lib/config.ts):
 *   · Modo real → Supabase Auth vía @supabase/ssr. `getUser()` valida el token
 *     contra el servidor de auth; nunca se confía en `getSession()`.
 *   · Modo demo → cookie `andex_session` con JSON {id,email,firstName}.
 *     Ver lib/auth/demo-session.ts: es un maniquí, no seguridad.
 *
 * ⚠️ Este módulo importa `next/headers`: NO se puede importar desde un client
 * component. La parte cliente vive en `lib/auth/client.ts` y las reglas puras
 * de navegación en `lib/auth/routing.ts` (importable desde ambos lados).
 */

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIES, ROUTES, isDemoMode } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/lib/types";
import { parseDemoSession } from "./demo-session";
import {
  PATHNAME_HEADER,
  loginPathWithNext,
  resolvePostAuthRoute,
  safeInternalPath,
  type PostAuthContext,
} from "./routing";

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
};

/**
 * Reglas de navegación post-login (§3). Se reexportan aquí para que el
 * contrato público sea `@/lib/auth`; los client components deben importarlas
 * de `@/lib/auth/routing` (este archivo arrastra `next/headers`).
 */
export {
  resolvePostAuthRoute,
  safeInternalPath,
  safeNextPath,
  loginPathWithNext,
  hasDashboardAccess,
  hasUsableProfile,
  grantsAccess,
  PATHNAME_HEADER,
} from "./routing";
export type {
  PostAuthContext,
  PostAuthProfile,
  PostAuthSubscription,
} from "./routing";

/** Lee un campo string de `user_metadata` sin ceder al `any` de supabase-js. */
function metaString(meta: Record<string, unknown> | undefined, key: string): string {
  const value = meta?.[key];
  return typeof value === "string" ? value.trim() : "";
}

/** Usuario de la sesión actual o null. Solo servidor (RSC / route handlers). */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (isDemoMode) {
    const store = await cookies();
    return parseDemoSession(store.get(COOKIES.demoSession)?.value);
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    const meta = data.user.user_metadata as Record<string, unknown> | undefined;
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      // Un magic link puro no trae nombre: se queda vacío y lo pide el wizard
      // (paso 1). NUNCA se inventa un nombre a partir del correo.
      firstName: metaString(meta, "first_name"),
    };
  } catch {
    // Credenciales presentes pero inválidas, o red caída: sin sesión.
    return null;
  }
}

/**
 * Como getSessionUser pero redirige a /login si no hay sesión. Solo servidor.
 * Conserva la ruta pedida en `?next=` para volver después del login.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user) return user;

  const requestHeaders = await headers();
  const pathname = safeInternalPath(requestHeaders.get(PATHNAME_HEADER));
  redirect(pathname ? loginPathWithNext(pathname) : ROUTES.login);
}

/**
 * Ruta a la que mandar al usuario recién autenticado, resolviendo el estado
 * DESDE EL SERVIDOR (lo usa `/callback`, que corre sin navegador).
 *
 * En modo demo el perfil vive en localStorage y el servidor no puede verlo:
 * ahí la decisión la toma el cliente con
 * `resolvePostAuthRouteForCurrentUser()` de `lib/auth/client.ts`.
 */
export async function getPostAuthRoute(): Promise<string> {
  const user = await getSessionUser();
  if (!user) return ROUTES.login;
  if (isDemoMode) return ROUTES.entrevista;

  try {
    const supabase = await getSupabaseServerClient();
    const [userRow, onboarding, subscription] = await Promise.all([
      supabase
        .from("users")
        .select("location_context")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_onboarding_profile")
        .select("is_completed, is_skipped, current_step")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Sin location_context no hay perfil utilizable: el dashboard no puede
    // adaptarse a nada (mismo criterio que lib/data/supabase-store.ts).
    const hasContext = Boolean(userRow.data?.location_context);
    const row = onboarding.data;

    const context: PostAuthContext = {
      profile:
        hasContext && row
          ? {
              onboardingCompleted: row.is_completed === true,
              onboardingSkippedAtStep:
                row.is_skipped === true ? (row.current_step ?? 3) : null,
            }
          : null,
      subscription: subscription.data
        ? {
            status: asSubscriptionStatus(subscription.data.status),
            currentPeriodEnd: subscription.data.current_period_end,
          }
        : null,
    };

    return resolvePostAuthRoute(context);
  } catch {
    // Si la base no responde, el destino seguro es el inicio del embudo:
    // la entrevista tiene guardado parcial y no cobra nada.
    return ROUTES.entrevista;
  }
}

/** Mismos cuatro estados que lib/data/supabase-store.ts (§3.4.7). */
function asSubscriptionStatus(raw: string | null): SubscriptionStatus {
  switch (raw) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    default:
      return "canceled";
  }
}
