/**
 * Helpers de presentación del panel. Puros, sin React.
 *
 * Resuelven el "ámbito" del usuario (estado de EE. UU. o país de residencia),
 * que es lo que alimenta el chip de La Ruta (§2.8), el subtítulo de los dos
 * modos (§4.2.1) y los enlaces oficiales del sidebar (§4.2).
 */

import type { ComboboxItem } from "@/components/ui/combobox";
import type { Dictionary } from "@/lib/i18n";
import type { Lang, LocationContext, ModuleId, StoredProfile } from "@/lib/types";
import {
  COUNTRY_NOT_LISTED,
  countriesGrouped,
  countryByCode,
} from "@/lib/catalogs/countries";
import { stateByCode, statesGrouped } from "@/lib/catalogs/states";

/** Nombre visible del estado de EE. UU., o null si no hay dato. */
export function stateName(code: string | null | undefined, lang: Lang): string | null {
  const state = stateByCode(code);
  if (!state) return null;
  return lang === "en" ? state.nameEn : state.nameEs;
}

/**
 * Nombre visible del país de residencia. Con el código de salida 'XX'
 * ("Mi país no está en la lista", Anexo C.2) se usa el texto que escribió el
 * usuario; si lo dejó en blanco, no hay nombre que mostrar.
 */
export function countryName(
  profile: Pick<StoredProfile, "countryOfResidence" | "countryOther">,
  lang: Lang,
): string | null {
  if (profile.countryOfResidence === COUNTRY_NOT_LISTED) {
    const other = (profile.countryOther ?? "").trim();
    return other.length > 0 ? other : null;
  }
  const country = countryByCode(profile.countryOfResidence);
  if (!country) return null;
  return lang === "en" ? country.nameEn : country.nameEs;
}

/**
 * Ámbito geográfico del usuario: estado en rama A, país en rama B.
 * D28 lo hace obligatorio en el paso 2, pero un perfil antiguo o migrado
 * puede no tenerlo: por eso puede devolver null y todo el copy tiene variante
 * "sin ámbito".
 */
export function scopeName(profile: StoredProfile, lang: Lang): string | null {
  return profile.locationContext === "in_us"
    ? stateName(profile.stateUS, lang)
    : countryName(profile, lang);
}

/**
 * Estados de EE. UU. para el combobox, en los TRES bloques del Anexo C.1
 * (piloto → más buscados → todos). Mismas claves de grupo que el paso 2 del
 * wizard, así que reutiliza `wizard.step2.inUs.stateGroups` como encabezados.
 */
export function stateComboboxItems(lang: Lang): ComboboxItem[] {
  const { pilot, quickAccess, rest } = statesGrouped();
  const label = (es: string, en: string) => (lang === "en" ? en : es);
  return [
    ...pilot.map((s) => ({ value: s.code, label: label(s.nameEs, s.nameEn), group: "pilot" })),
    ...quickAccess.map((s) => ({
      value: s.code,
      label: label(s.nameEs, s.nameEn),
      group: "popular",
    })),
    ...rest.map((s) => ({ value: s.code, label: label(s.nameEs, s.nameEn), group: "all" })),
  ];
}

/** Países para el combobox, con la salida 'XX' del Anexo C.2 al final. */
export function countryComboboxItems(
  lang: Lang,
  notListedLabel: string,
): ComboboxItem[] {
  const { quickAccess, rest } = countriesGrouped();
  const label = (es: string, en: string) => (lang === "en" ? en : es);
  return [
    ...quickAccess.map((c) => ({
      value: c.code,
      label: label(c.nameEs, c.nameEn),
      group: "latam",
    })),
    ...rest.map((c) => ({ value: c.code, label: label(c.nameEs, c.nameEn), group: "rest" })),
    { value: COUNTRY_NOT_LISTED, label: notListedLabel, group: "rest" },
  ];
}

/** Título canónico del módulo según la variante de contenido (§4.2.1). */
export function moduleTitle(
  dict: Dictionary,
  moduleId: ModuleId,
  variant: LocationContext,
): string {
  return dict.common.modules.titles[moduleId][variant];
}

/** Descripción corta del módulo (seed §7.4). */
export function moduleDescription(dict: Dictionary, moduleId: ModuleId): string {
  return dict.common.modules.descriptions[moduleId];
}

/** Fecha larga localizada. Sin copy: es formato, no texto. */
export function formatDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-419", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Fecha de hoy en formato de input date (YYYY-MM-DD), en hora local. */
export function todayInputValue(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Días completos entre dos fechas ISO (para `days_since_signup` de §7.5). */
export function daysBetween(fromIso: string | null | undefined, to: Date): number | null {
  if (!fromIso) return null;
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return null;
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}
