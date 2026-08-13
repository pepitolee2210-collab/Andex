/**
 * ANDEX i18n — punto de entrada único.
 *
 * Uso en Server Components:
 *   import { getLang } from "@/lib/i18n/server";
 *   import { getDictionary } from "@/lib/i18n";
 *   const dict = getDictionary(await getLang());
 *
 * Uso en Client Components:
 *   import { getClientLang } from "@/lib/i18n/config";
 *   const dict = getDictionary(getClientLang());
 *
 * Regla del brief §4.8: ningún string visible se escribe en JSX.
 * Todo sale de aquí.
 */

import type {
  InterestTag,
  Lang,
  LocationContext,
  SituationTag,
} from "@/lib/types";

import { common } from "./dictionaries/common";
import { landing } from "./dictionaries/landing";
import { tour } from "./dictionaries/tour";
import { boveda } from "./dictionaries/boveda";
import { academia } from "./dictionaries/academia";
import { comunidad } from "./dictionaries/comunidad";
import { auth } from "./dictionaries/auth";
import { wizard } from "./dictionaries/wizard";
import { paywall } from "./dictionaries/paywall";
import { checkout } from "./dictionaries/checkout";
import { panel } from "./dictionaries/panel";
import { modules } from "./dictionaries/modules";
import { perfil } from "./dictionaries/perfil";
import { os } from "./dictionaries/os";

export { DEFAULT_LANG, LANGS, getClientLang, getLangFromCookieValue } from "./config";
export { formatReason, goalLabel, interestLabel } from "./reasons";
export type { ReasonContext } from "./reasons";

export type { CommonDict } from "./dictionaries/common";
export type { LandingDict } from "./dictionaries/landing";
export type { TourDict } from "./dictionaries/tour";
export type { BovedaDict } from "./dictionaries/boveda";
export type { AcademiaDict } from "./dictionaries/academia";
export type { ComunidadDict } from "./dictionaries/comunidad";
export type { AuthDict } from "./dictionaries/auth";
export type { WizardDict } from "./dictionaries/wizard";
export type { PaywallDict } from "./dictionaries/paywall";
export type { CheckoutDict } from "./dictionaries/checkout";
export type { PanelDict } from "./dictionaries/panel";
export type { ModulesDict } from "./dictionaries/modules";
export type { PerfilDict } from "./dictionaries/perfil";
export type { OsDict } from "./dictionaries/os";

export type Dictionary = {
  common: (typeof common)[Lang];
  landing: (typeof landing)[Lang];
  tour: (typeof tour)[Lang];
  boveda: (typeof boveda)[Lang];
  academia: (typeof academia)[Lang];
  comunidad: (typeof comunidad)[Lang];
  auth: (typeof auth)[Lang];
  wizard: (typeof wizard)[Lang];
  paywall: (typeof paywall)[Lang];
  checkout: (typeof checkout)[Lang];
  panel: (typeof panel)[Lang];
  modules: (typeof modules)[Lang];
  perfil: (typeof perfil)[Lang];
  os: (typeof os)[Lang];
};

/** Ensambla el diccionario completo para un idioma. */
export function getDictionary(lang: Lang): Dictionary {
  return {
    common: common[lang],
    landing: landing[lang],
    tour: tour[lang],
    boveda: boveda[lang],
    academia: academia[lang],
    comunidad: comunidad[lang],
    auth: auth[lang],
    wizard: wizard[lang],
    paywall: paywall[lang],
    checkout: checkout[lang],
    panel: panel[lang],
    modules: modules[lang],
    perfil: perfil[lang],
    os: os[lang],
  };
}

/**
 * Label visible de una opción del PASO 3, resolviendo las dos filas
 * especiales del catálogo (`other`, `declined`) que no pertenecen al enum.
 * Casa por clave con `SITUATIONS_IN_US` / `SITUATIONS_PRE_ARRIVAL`
 * de `lib/catalogs/situations.ts`.
 */
export function situationLabel(
  tag: SituationTag | "other" | "declined",
  branch: LocationContext,
  lang: Lang,
): string {
  const step3 = wizard[lang].step3;
  if (tag === "other") return step3.special.other;
  if (tag === "declined") return step3.special.declined;
  const table =
    branch === "in_us" ? step3.situationsInUs : step3.situationsPreArrival;
  return (table as Record<string, string>)[tag] ?? step3.special.other;
}

/**
 * Label de checkbox del PASO 4 (§3.2). Distinto de `interestLabel` de
 * `reasons.ts`, que devuelve la forma que encaja dentro de una razón
 * ("Porque te interesa el empleo y las oportunidades laborales.").
 */
export function interestOptionLabel(tag: InterestTag, lang: Lang): string {
  return wizard[lang].step4.interests[tag];
}

/** Diccionarios crudos por dominio, por si un feature solo necesita uno. */
export const dictionaries = {
  common,
  landing,
  tour,
  boveda,
  auth,
  wizard,
  paywall,
  checkout,
  panel,
  modules,
  perfil,
  comunidad,
  academia,
} as const;
