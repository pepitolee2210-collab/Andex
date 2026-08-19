/**
 * Middleware de sesión y protección de rutas.
 *
 * Tres trabajos, en este orden:
 *
 * 1. Publica la ruta pedida en la cabecera `x-andex-pathname` para que
 *    `requireUser()` (lib/auth) sepa a dónde devolver al usuario tras el
 *    login y el layout de auth sepa a dónde volver al cambiar de idioma.
 * 2. Modo real: refresca la sesión de Supabase en cada navegación (patrón de
 *    @supabase/ssr). Sin esto el token caduca y el usuario "se cae" sin
 *    motivo aparente a mitad del embudo.
 * 3. Protege las pantallas con sesión: sin usuario, a `/login?next=<ruta>`.
 *
 * NO toca `/`, `/design`, `/api/*` ni los assets (ver `config.matcher`).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { COOKIES, ROUTES, isSupabaseConfigured } from "@/lib/config";
import { parseDemoSession } from "@/lib/auth/demo-session";
import { PATHNAME_HEADER, loginPathWithNext } from "@/lib/auth/routing";

/** `ROUTES.modulo` es una función; el prefijo se deriva de ella, no se copia. */
const MODULO_PREFIX = ROUTES.modulo("").replace(/\/$/, "");

/** §3: todo lo que hay detrás del registro exige sesión. */
const PROTECTED_PREFIXES: readonly string[] = [
  ROUTES.entrevista,
  ROUTES.membresia,
  ROUTES.panel,
  MODULO_PREFIX,
  ROUTES.perfil,
];

/*
 * `/pago` YA NO está aquí, y es la consecuencia directa del embudo nuevo:
 * se cobra antes de que exista la cuenta, así que exigir sesión para entrar
 * a pagar cerraria la puerta antes de abrirla.
 *
 * Lo que se paga sin sesión queda anotado en `lib/pago-pendiente.ts` y la
 * cuenta se crea después contra ese registro. `/pago/exito` tampoco exige
 * sesión por lo mismo: es la pantalla que recoge a quien acaba de pagar y
 * todavía no es nadie.
 */

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(PATHNAME_HEADER, pathname);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  let hasSession = false;

  if (isSupabaseConfigured) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            // Patrón oficial de @supabase/ssr: el token refrescado se escribe
            // en la petición (para el render de esta misma navegación) y en
            // la respuesta (para el navegador).
            for (const { name, value } of cookiesToSet) {
              req.cookies.set(name, value);
            }
            response = NextResponse.next({ request: { headers: requestHeaders } });
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      },
    );

    try {
      // getUser() valida el token contra el servidor de auth y dispara el
      // refresco. No usar getSession(): no verifica nada.
      const { data } = await supabase.auth.getUser();
      hasSession = Boolean(data.user);
    } catch {
      // Supabase caído o credenciales inválidas: se trata como sin sesión.
      hasSession = false;
    }
  } else {
    // Modo demo: la sesión es la cookie andex_session (lib/auth/demo-session).
    hasSession =
      parseDemoSession(req.cookies.get(COOKIES.demoSession)?.value) !== null;
  }

  if (!hasSession && isProtected(pathname)) {
    const url = req.nextUrl.clone();
    url.search = "";
    // `loginPathWithNext` valida la ruta (nada de open redirect, §9) y solo
    // deja pasar el pathname: ningún dato sensible viaja en la URL.
    const target = loginPathWithNext(pathname);
    const [path, query] = target.split("?");
    url.pathname = path;
    if (query) url.search = `?${query}`;

    const redirectResponse = NextResponse.redirect(url);
    // Conservar las cookies ya refrescadas: si se pierden, el siguiente
    // request vuelve a refrescar y se puede invalidar el refresh token.
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  /**
   * Todo menos: rutas de API, artefactos de Next, el favicon y cualquier
   * archivo con extensión (imágenes, fuentes, robots.txt…).
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)"],
};
