/**
 * ANDEX i18n — helper de idioma SOLO para Server Components / route handlers.
 * Vive separado de config.ts porque `next/headers` no puede importarse
 * desde código cliente.
 */

import { cookies } from "next/headers";
import type { Lang } from "@/lib/types";
import { COOKIES } from "@/lib/config";
import { getLangFromCookieValue } from "./config";

/** Lee la cookie `andex_lang` y devuelve el idioma activo ('es' default). */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return getLangFromCookieValue(store.get(COOKIES.lang)?.value);
}
