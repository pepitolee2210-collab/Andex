/**
 * Los nombres de evento de §7.5 como VALOR en tiempo de ejecución.
 * (Son 28, no 27: el brief §8 dice "27" pero la tabla §7.5 y
 * `AnalyticsEventName` de lib/types.ts listan 28. Ver reporte.)
 *
 * Por qué existe: `AnalyticsEventName` (lib/types.ts, Sesión 0 — CONGELADO)
 * es un tipo, y un tipo no se puede recorrer para validar la entrada de un
 * endpoint. Aquí vive la misma lista como array `as const`.
 *
 * Sincronía garantizada por el compilador, en las dos direcciones:
 *   · `satisfies AnalyticsEventName[]` → aquí no puede colarse un nombre que
 *     no exista en el tipo.
 *   · `_exhaustive` más abajo → si types.ts añade un nombre y no se añade
 *     aquí, `npx tsc --noEmit` falla.
 *
 * Al añadir un evento: primero types.ts (su dueño es Sesión 0), luego aquí.
 */

import type { AnalyticsEventName } from "@/lib/types";

export const ANALYTICS_EVENT_NAMES = [
  "landing_viewed",
  "landing_cta_clicked",
  "landing_section_viewed",
  "onboarding_started",
  "onboarding_step_completed",
  "onboarding_abandoned",
  "onboarding_completed",
  "onboarding_skipped",
  "location_branch_selected",
  "location_scope_selected",
  "other_option_used",
  "situation_declined",
  "seeking_for_selected",
  "location_context_changed",
  "transition_banner_shown",
  "transition_banner_clicked",
  "ranking_computed",
  "paywall_viewed",
  "plan_selected",
  "checkout_started",
  "checkout_method_chosen",
  "checkout_abandoned",
  "payment_succeeded",
  "payment_failed",
  "subscription_canceled",
  "hero_card_clicked",
  "hero_card_dismissed",
  "module_opened",
  "interest_signal_submitted",
  "vault_scan_started",
  "vault_document_saved",
  "vault_portal_opened",
] as const satisfies readonly AnalyticsEventName[];

/**
 * Test de sincronía tipada: falla la compilación si a la lista le falta
 * algún nombre declarado en `AnalyticsEventName`.
 */
type MissingEventName = Exclude<
  AnalyticsEventName,
  (typeof ANALYTICS_EVENT_NAMES)[number]
>;
const _exhaustive: MissingEventName extends never ? true : never = true;
void _exhaustive;

const EVENT_NAME_SET: ReadonlySet<string> = new Set(ANALYTICS_EVENT_NAMES);

/** Guard de runtime para validar entrada no confiable (body de POST /api/events). */
export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && EVENT_NAME_SET.has(value);
}
