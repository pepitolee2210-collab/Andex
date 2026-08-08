import { NextRequest, NextResponse } from "next/server";
import { COOKIES } from "@/lib/config";

/**
 * Preferencias de idioma y tema por cookie.
 * GET /api/prefs?lang=en&back=/ — funciona SIN JavaScript (§3.1.1:
 * el toggle de idioma de la landing es un enlace, no un botón JS).
 */

const YEAR = 60 * 60 * 24 * 365;

function safeBack(raw: string | null): string {
  // Solo rutas internas: evita open redirect
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang");
  const theme = searchParams.get("theme");
  const back = safeBack(searchParams.get("back"));

  const res = NextResponse.redirect(new URL(back, req.url), 303);

  if (lang === "es" || lang === "en") {
    res.cookies.set(COOKIES.lang, lang, { path: "/", maxAge: YEAR, sameSite: "lax" });
  }
  if (theme === "light" || theme === "dark" || theme === "system") {
    if (theme === "system") {
      res.cookies.delete(COOKIES.theme);
    } else {
      res.cookies.set(COOKIES.theme, theme, { path: "/", maxAge: YEAR, sameSite: "lax" });
    }
  }
  return res;
}
