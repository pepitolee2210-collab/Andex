/**
 * MODO DEMO — cookie de sesión `andex_session`.
 *
 * Existe porque la app tiene que poder recorrer el embudo completo (§3) sin
 * credenciales de Supabase. La cookie es httpOnly (así el middleware y los
 * Server Components la ven, y ningún script de terceros puede leerla), por lo
 * que el cliente la consulta y la escribe por aquí.
 *
 *   GET    → { user } de la cookie, o { user: null }
 *   POST   → escribe la cookie con {id, email, firstName}
 *   DELETE → la borra (cerrar sesión)
 *
 * ⚠️ Esto NO autentica a nadie: no hay contraseña que verificar. Por eso el
 * endpoint devuelve 404 en cuanto hay Supabase configurado — en producción la
 * sesión la emite Supabase Auth y la frontera de seguridad es RLS (§7.3).
 */

import { NextResponse, type NextRequest } from "next/server";
import { COOKIES, isDemoMode } from "@/lib/config";
import {
  DEMO_SESSION_MAX_AGE,
  parseDemoSession,
  serializeDemoSession,
  toSessionUser,
} from "@/lib/auth/demo-session";

/** Nunca cachear una respuesta que depende de la cookie de sesión. */
export const dynamic = "force-dynamic";

function notAvailable(): NextResponse {
  return NextResponse.json(
    { error: "demo_mode_disabled" },
    { status: 404, headers: { "cache-control": "no-store" } },
  );
}

function noStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function GET(req: NextRequest) {
  if (!isDemoMode) return notAvailable();
  const user = parseDemoSession(req.cookies.get(COOKIES.demoSession)?.value);
  return noStore({ user });
}

export async function POST(req: NextRequest) {
  if (!isDemoMode) return notAvailable();

  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    return noStore({ error: "invalid_json" }, 400);
  }

  const user = toSessionUser(payload);
  if (!user) return noStore({ error: "invalid_session" }, 400);

  const response = noStore({ user });
  response.cookies.set(COOKIES.demoSession, serializeDemoSession(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DEMO_SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export async function DELETE() {
  if (!isDemoMode) return notAvailable();
  const response = noStore({ user: null });
  // maxAge 0 en vez de delete(): así se borra con el MISMO path con el que
  // se escribió, sin depender del path por defecto de la petición.
  response.cookies.set(COOKIES.demoSession, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
