/**
 * Reglas de navegación que dependen de la sesión — módulo PURO.
 *
 * Vive separado de `lib/auth/index.ts` a propósito: aquí no se importa
 * `next/headers` ni el cliente de Supabase, así que este archivo se puede
 * usar desde client components (formulario de login) Y desde el servidor
 * (middleware, route handlers, RSC). `lib/auth/index.ts` lo reexporta para
 * que el contrato público siga siendo `@/lib/auth`.
 *
 * Fuente: seccion 3 (embudo landing -> registro -> entrevista -> membresia ->
 * pago -> panel) y 3.4.7 (estados y casos borde de la suscripcion).
 */

import { PAST_DUE_GRACE_DAYS, ROUTES } from "@/lib/config";
import type { SubscriptionStatus } from "@/lib/types";

/**
 * Lo mínimo que hay que saber del perfil para decidir la ruta.
 * `StoredProfile` lo satisface estructuralmente: se le puede pasar tal cual.
 */
export type PostAuthProfile = {
  onboardingCompleted: boolean;
  onboardingSkippedAtStep: number | null;
};

/** `SubscriptionInfo` lo satisface estructuralmente. */
export type PostAuthSubscription = {
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
};

export type PostAuthContext = {
  profile: PostAuthProfile | null;
  subscription: PostAuthSubscription | null;
};

/**
 * Cabecera que el middleware pone en cada petición con la ruta pedida.
 * Permite que `requireUser()` sepa a dónde devolver al usuario tras el login
 * y que el layout de auth arme el enlace de cambio de idioma, sin que la
 * ruta viaje en ninguna URL pública (§9).
 */
export const PATHNAME_HEADER = "x-andex-pathname";

/** Rutas de autenticación: nunca son destino de `?next=` (evita bucles). */
const AUTH_PATHS: readonly string[] = [
  ROUTES.login,
  ROUTES.registro,
  ROUTES.recuperar,
];

/**
 * Hay perfil aprovechable cuando la entrevista se completó **o** se saltó
 * (§3.2 permite saltar desde el paso 3). En ambos casos el motor ya pudo
 * calcular un ranking, así que el usuario no debe repetir la entrevista
 * (§3.4.7: "Al volver, entra directo al paywall con su plan armado").
 */
export function hasUsableProfile(profile: PostAuthProfile | null): boolean {
  if (!profile) return false;
  return profile.onboardingCompleted || profile.onboardingSkippedAtStep !== null;
}

/** Estados que abren el panel (§3.4.7: `past_due` conserva acceso). */
const ACCESS_STATUSES: readonly SubscriptionStatus[] = [
  "active",
  "trialing",
  "past_due",
];

export function grantsAccess(
  status: SubscriptionStatus | null | undefined,
): boolean {
  return status != null && ACCESS_STATUSES.includes(status);
}

/**
 * Versión fina del acceso al panel, para el agente de Dashboard:
 * · `active` / `trialing` → acceso pleno.
 * · `past_due`  → solo lectura durante `PAST_DUE_GRACE_DAYS` tras el fin de
 *   periodo (§3.4.7). Sin fecha conocida se concede el acceso: cortarlo por
 *   un dato ausente castigaría a quien sí pagó.
 * · `canceled`  → acceso hasta `currentPeriodEnd` (§3.4.7), luego bloqueado
 *   pero **cuenta y perfil intactos**.
 */
export function hasDashboardAccess(
  subscription: PostAuthSubscription | null,
  now: Date = new Date(),
): boolean {
  if (!subscription) return false;
  const end = parseDate(subscription.currentPeriodEnd);

  switch (subscription.status) {
    case "active":
    case "trialing":
      return true;
    case "past_due": {
      if (!end) return true;
      const grace = new Date(end.getTime());
      grace.setDate(grace.getDate() + PAST_DUE_GRACE_DAYS);
      return now.getTime() <= grace.getTime();
    }
    case "canceled":
      return end !== null && now.getTime() < end.getTime();
    default:
      return false;
  }
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * A dónde mandar al usuario justo después de autenticarse (§3, embudo):
 *   sin perfil                       -> /entrevista
 *   con perfil, sin suscripción      -> /membresia
 *   con perfil y suscripción vigente -> /panel
 *
 * Es una función pura: quien la llama decide de dónde saca el contexto
 * (store del navegador en cliente, Supabase en el servidor).
 */
export function resolvePostAuthRoute(context: PostAuthContext): string {
  if (!hasUsableProfile(context.profile)) return ROUTES.entrevista;
  if (grantsAccess(context.subscription?.status)) return ROUTES.panel;
  return ROUTES.membresia;
}

/** Espacios, tabuladores y caracteres de control: no van en una ruta. */
function hasUnsafeChars(value: string): boolean {
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 32 || code === 127) return true;
  }
  return false;
}

/**
 * Valida una ruta que viene de fuera (query string, cabecera) antes de
 * redirigir. Solo rutas internas: nada de open redirect (§9).
 * Devuelve la ruta o null si no es de fiar.
 */
export function safeInternalPath(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length === 0 || value.length > 512) return null;
  // Debe ser absoluta dentro del sitio...
  if (!value.startsWith("/")) return null;
  // ...y no protocol-relative (`//evil.com`) ni con backslash (`/\evil.com`,
  // que algunos navegadores normalizan a `//`).
  if (value.startsWith("//") || value.includes("\\")) return null;
  if (hasUnsafeChars(value)) return null;
  return value;
}

/**
 * Como `safeInternalPath` pero además descarta los formularios de auth:
 * volver a /login tras iniciar sesión sería un bucle.
 *
 * La comparación es EXACTA a propósito: `/recuperar/nueva` sí es un destino
 * legítimo — es justo a donde apunta el enlace del correo de recuperación.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  const path = safeInternalPath(raw);
  if (!path) return null;
  const pathname = path.split("?")[0].split("#")[0];
  return AUTH_PATHS.includes(pathname) ? null : path;
}

/** `/login?next=/panel` con la ruta ya validada y codificada. */
export function loginPathWithNext(path: string | null | undefined): string {
  const next = safeNextPath(path);
  return next ? `${ROUTES.login}?next=${encodeURIComponent(next)}` : ROUTES.login;
}
