/**
 * Opciones del PASO 4 del wizard — multi-select filtrado por rama (§3.2, paso 4).
 *
 * Solo estructura y orden; los labels visibles están en
 * `lib/i18n/dictionaries/wizard.ts`, indexados por `InterestTag`.
 *
 * ⚠️ El wizard debe guardar los intereses en **orden de selección**, no en el
 * orden de esta lista: §3.3.1 da PRIMARY_INTEREST (+30) al elemento [0] y
 * OTHER_INTEREST (+15) al resto. Ver docs/DECISIONES.md D14.
 */

import type { InterestTag, LocationContext } from "@/lib/types";

/** Base común a ambas ramas. */
export const COMMON_INTERESTS = [
  "legal_tramites",
  "empresa_llc",
  "finanzas",
  "certificaciones",
  "familia_educacion",
] as const satisfies readonly InterestTag[];

/** Solo rama A — dentro de EE. UU. */
export const IN_US_ONLY_INTERESTS = [
  "empleo",
  "comunidad_local",
  "licencia_conducir",
] as const satisfies readonly InterestTag[];

/** Solo rama B — fuera de EE. UU. */
export const PRE_ARRIVAL_ONLY_INTERESTS = [
  "visa_preparacion",
  "vida_en_usa",
  "finanzas_prellegada",
] as const satisfies readonly InterestTag[];

/**
 * Intereses visibles para una rama: comunes → propios de la rama → "Otro".
 * El campo "Otro" con texto libre es, según el PRD, la fuente de
 * investigación de producto más barata del MVP: revisar semanalmente.
 */
export function interestsForBranch(context: LocationContext): InterestTag[] {
  const branchOnly =
    context === "in_us" ? IN_US_ONLY_INTERESTS : PRE_ARRIVAL_ONLY_INTERESTS;
  return [...COMMON_INTERESTS, ...branchOnly, "other"];
}
