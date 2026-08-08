/**
 * Personalización obligatoria del paywall (§3.4.3) — módulo PURO.
 *
 * > "La tarjeta de resumen **debe** reflejar datos reales del perfil. Un
 * >  paywall genérico anula todo el trabajo de los cinco pasos anteriores."
 *
 * Los seis elementos de la tabla de §3.4.3 salen de aquí, todos de datos
 * reales:
 *
 *   1. Nombre en el titular          ← paso 1 (`profile.firstName`)
 *   2. Módulo #1 + badge PRIORIDAD   ← `user_module_ranking[0]`
 *   3. Módulo #2 nombrado            ← `user_module_ranking[1]`
 *   4. Referencia geográfica         ← `state_us` / `country_of_residence`
 *   5. Línea de familia              ← `seeking_for ≠ 'self'`
 *   6. Nota de moneda                ← `location_context = 'pre_arrival'`
 *   (+) Títulos por `contentVariant` ← §4.2.1
 *
 * DEGRADACIÓN (§4.7): si falta el ranking se usa `DEFAULT_ORDER` del contexto,
 * que sigue siendo específico de la rama del usuario. **Nunca** se cae a un
 * texto genérico: eso es justo lo que §3.4.3 prohíbe.
 */

import { countryByCode, COUNTRY_NOT_LISTED } from "@/lib/catalogs/countries";
import { DEFAULT_ORDER } from "@/lib/catalogs/modules";
import { stateByCode } from "@/lib/catalogs/states";
import type { StoredRanking } from "@/lib/data";
import { formatReason, type Dictionary } from "@/lib/i18n";
import type {
  Lang,
  LocationContext,
  ModuleId,
  ReasonCode,
  StoredProfile,
} from "@/lib/types";

/** Total de módulos del producto (§7.4). El resto se deriva, no se escribe. */
const TOTAL_MODULES = 7;

/**
 * Familias del piloto de Utah — §3.4.3 lo usa como referencia geográfica
 * ("2,400 familias en Utah"). Fuente única en `lib/config.ts`; se reexporta
 * aquí por comodidad de los consumidores del paywall.
 */
export { PILOT_FAMILIES } from "@/lib/config";

export type PaywallPersonalization = {
  /** null si el usuario saltó el paso 1: el titular usa la variante sin nombre. */
  firstName: string | null;
  locationContext: LocationContext;
  /** Variante de contenido con la que se nombran los módulos (§4.2.1). */
  contentVariant: LocationContext;

  topModuleId: ModuleId;
  topModuleTitle: string;
  /** Eco literal del motor: "Porque dijiste que quieres…" (§3.3.1 + i18n). */
  topModuleReason: string;

  secondModuleId: ModuleId;
  secondModuleTitle: string;
  /** Los que quedan tras nombrar el #1 y el #2. */
  remainingModules: number;

  /** Estado (rama A) o país (rama B). null solo si el perfil no lo trae. */
  place: string | null;
  /** §3.4.3: solo si `seeking_for ≠ 'self'`. */
  showFamilyLine: boolean;
  /** §3.4.3: solo si `location_context = 'pre_arrival'`. */
  showCurrencyNote: boolean;

  /** true cuando el ranking faltaba y se usó el orden por defecto del contexto. */
  usedDefaultOrder: boolean;
};

/**
 * Estado (rama A) o país de residencia (rama B), en el idioma del usuario.
 *
 * §3.2.2: las dos ramas nunca conviven, así que se lee la que corresponda al
 * contexto y no "la que haya". El caso `XX` ("Mi país no está en la lista",
 * Anexo C.2) usa el texto libre que el usuario escribió.
 */
export function resolvePlace(profile: StoredProfile, lang: Lang): string | null {
  if (profile.locationContext === "in_us") {
    const state = stateByCode(profile.stateUS);
    if (!state) return null;
    return lang === "en" ? state.nameEn : state.nameEs;
  }

  const code = profile.countryOfResidence;
  if (code === COUNTRY_NOT_LISTED) {
    const other = profile.countryOther?.trim();
    return other && other.length > 0 ? other : null;
  }

  const country = countryByCode(code);
  if (!country) return null;
  return lang === "en" ? country.nameEn : country.nameEs;
}

/** Título del módulo en su variante de contenido (§4.2.1). */
export function moduleTitle(
  dict: Dictionary,
  moduleId: ModuleId,
  variant: LocationContext,
): string {
  return dict.common.modules.titles[moduleId][variant];
}

/**
 * Arma la personalización completa. `ranking` puede faltar (§4.7): en ese caso
 * se cae al orden por defecto del contexto, nunca a un texto genérico.
 */
export function buildPersonalization(
  profile: StoredProfile,
  ranking: StoredRanking | null,
  lang: Lang,
  dict: Dictionary,
): PaywallPersonalization {
  const context = profile.locationContext;
  const scores = ranking?.scores ?? [];
  const usedDefaultOrder = scores.length < 2;

  const order: ModuleId[] = usedDefaultOrder
    ? DEFAULT_ORDER[context]
    : scores.map((s) => s.moduleId);

  const topModuleId = order[0];
  const secondModuleId = order[1];

  // `contentVariant` lo decide el motor por módulo; sin ranking, el contexto
  // del perfil es exactamente la misma señal.
  const contentVariant = scores[0]?.contentVariant ?? context;

  const topReasonCode: ReasonCode =
    scores[0]?.reason ?? ({ type: "context_default", context } as const);

  const topModuleTitle = moduleTitle(dict, topModuleId, contentVariant);
  const secondModuleTitle = moduleTitle(
    dict,
    secondModuleId,
    scores[1]?.contentVariant ?? contentVariant,
  );

  const firstName = profile.firstName.trim();

  return {
    firstName: firstName.length > 0 ? firstName : null,
    locationContext: context,
    contentVariant,

    topModuleId,
    topModuleTitle,
    topModuleReason: formatReason(topReasonCode, lang, {
      moduleTitle: topModuleTitle,
    }),

    secondModuleId,
    secondModuleTitle,
    remainingModules: TOTAL_MODULES - 2,

    place: resolvePlace(profile, lang),
    showFamilyLine: profile.seekingFor !== "self",
    showCurrencyNote: context === "pre_arrival",

    usedDefaultOrder,
  };
}
