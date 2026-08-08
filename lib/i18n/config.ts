/**
 * ANDEX i18n — configuración de idioma (§2.7).
 *
 * Este archivo NO importa `next/headers` para poder usarse desde client
 * components sin romper el build. El helper de servidor `getLang()` vive
 * en `lib/i18n/server.ts`.
 *
 * Cookie: `andex_lang` ('es' default | 'en') — se cambia vía
 * GET /api/prefs?lang=..&back=.. (funciona sin JS) o client-side + refresh.
 */

import type { Lang } from "@/lib/types";
import { COOKIES } from "@/lib/config";

export type { Lang };

export const LANGS = ["es", "en"] as const;

export const DEFAULT_LANG: Lang = "es";

/** Convierte el valor crudo de la cookie en un Lang válido. 'es' por defecto. */
export function getLangFromCookieValue(value: string | null | undefined): Lang {
  return value === "en" ? "en" : "es";
}

/**
 * Helper client ligero: lee `andex_lang` de document.cookie.
 * En servidor (o sin cookie) devuelve 'es'. Para server components
 * usa `getLang()` de `@/lib/i18n/server`.
 */
export function getClientLang(): Lang {
  if (typeof document === "undefined") return DEFAULT_LANG;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIES.lang}=([^;]*)`),
  );
  return getLangFromCookieValue(match?.[1]);
}
