/**
 * /callback — canje del enlace de correo por sesión (magic link y
 * recuperación de contraseña).
 *
 * Supabase manda al usuario aquí con una de estas dos formas, según la
 * versión de la plantilla de correo del proyecto:
 *   · `?code=…`                  → flujo PKCE, se canjea con
 *                                  `exchangeCodeForSession`.
 *   · `?token_hash=…&type=…`     → plantilla nueva, se verifica con
 *                                  `verifyOtp`.
 * Se soportan las dos para que el enlace funcione sin depender de qué
 * plantilla tenga configurada el proyecto.
 *
 * SEGURIDAD: el destino final se valida con `safeNextPath` — solo rutas
 * internas. Un `?next=https://otro-sitio` no redirige a ninguna parte fuera
 * de ANDEX (open redirect, §9).
 *
 * Este handler NO se ejecuta en modo demo: sin Supabase no hay enlaces que
 * canjear (el magic link entra directo, ver lib/auth/client.ts).
 */

import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { ROUTES, isDemoMode } from "@/lib/config";
import { getPostAuthRoute } from "@/lib/auth";
import { authErrorKey } from "@/lib/auth/errors";
import { safeNextPath } from "@/lib/auth/routing";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function asOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null;
  return OTP_TYPES.find((type) => type === raw) ?? null;
}

/** Códigos cortos que entiende /login. Nunca copy en la URL (§2.7, §9). */
function errorCodeFor(error: unknown): string {
  switch (authErrorKey(error)) {
    case "linkExpired":
      return "link_expired";
    case "linkAlreadyUsed":
      return "link_used";
    case "sessionExpired":
      return "session_expired";
    default:
      return "unknown";
  }
}

function redirectTo(req: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, req.nextUrl.origin));
}

export async function GET(req: NextRequest) {
  if (isDemoMode) return redirectTo(req, ROUTES.login);

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = asOtpType(searchParams.get("type"));

  // Supabase puede devolver el error directamente en la URL (enlace vencido
  // antes incluso de tocar el servidor de auth).
  const providerError =
    searchParams.get("error_code") ?? searchParams.get("error");
  if (providerError && !code && !tokenHash) {
    const key = /expired|otp_expired/i.test(providerError)
      ? "link_expired"
      : "unknown";
    return redirectTo(req, `${ROUTES.login}?error=${key}`);
  }

  if (!code && !tokenHash) {
    return redirectTo(req, `${ROUTES.login}?error=unknown`);
  }

  const supabase = await getSupabaseServerClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash ?? "",
        type: otpType ?? "email",
      });

  if (error) {
    return redirectTo(req, `${ROUTES.login}?error=${errorCodeFor(error)}`);
  }

  // Recuperación de contraseña: el destino lo manda el tipo de enlace, no la
  // URL, para que nadie pueda desviar ese flujo a otra pantalla.
  if (otpType === "recovery") {
    return redirectTo(req, `${ROUTES.recuperar}/nueva`);
  }

  const requested = safeNextPath(searchParams.get("next"));
  if (requested) return redirectTo(req, requested);

  // Sin destino pedido, manda la regla del embudo (§3, §3.4.7).
  return redirectTo(req, await getPostAuthRoute());
}
