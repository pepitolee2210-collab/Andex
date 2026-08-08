/**
 * Opciones del PASO 3 del wizard — estructura y orden (§3.2, paso 3).
 *
 * Aquí solo vive la ESTRUCTURA. Los labels visibles están en
 * `lib/i18n/dictionaries/wizard.ts`, indexados por `tag`.
 *
 * Nota para quien pinte la UI: `declined` es "Prefiero no responder" y §3.2
 * exige que tenga **el mismo peso visual** que las demás opciones — no
 * arrinconada al final en gris. El motor funciona bien sin este dato.
 */

import type { LocationContext, SituationTag } from "@/lib/types";

export type SituationOption = {
  tag: SituationTag | "other" | "declined";
  branch: LocationContext;
};

/** Rama A — "Ya estoy en Estados Unidos". Orden exacto del PRD. */
export const SITUATIONS_IN_US = [
  { tag: "recien_llegado", branch: "in_us" },
  { tag: "tramite_proceso", branch: "in_us" },
  { tag: "permiso_trabajo", branch: "in_us" },
  { tag: "residente", branch: "in_us" },
  { tag: "ciudadano", branch: "in_us" },
  { tag: "visa_temporal", branch: "in_us" },
  { tag: "resolviendo", branch: "in_us" },
  { tag: "other", branch: "in_us" },
  { tag: "declined", branch: "in_us" },
] as const satisfies readonly SituationOption[];

/** Rama B — "Estoy fuera de Estados Unidos". Orden exacto del PRD. */
export const SITUATIONS_PRE_ARRIVAL = [
  { tag: "visa_turismo", branch: "pre_arrival" },
  { tag: "visa_estudiante", branch: "pre_arrival" },
  { tag: "visa_aprobada", branch: "pre_arrival" },
  { tag: "visa_negada", branch: "pre_arrival" },
  { tag: "explorando", branch: "pre_arrival" },
  { tag: "reunificacion", branch: "pre_arrival" },
  { tag: "inversion_remota", branch: "pre_arrival" },
  { tag: "other", branch: "pre_arrival" },
  { tag: "declined", branch: "pre_arrival" },
] as const satisfies readonly SituationOption[];

export function situationsForContext(
  context: LocationContext,
): readonly SituationOption[] {
  return context === "in_us" ? SITUATIONS_IN_US : SITUATIONS_PRE_ARRIVAL;
}
