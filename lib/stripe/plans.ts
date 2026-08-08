/**
 * Planes de membresía — módulo PURO y seguro para el navegador.
 *
 * Vive separado de `lib/stripe/server.ts` a propósito: aquí no se importa el
 * SDK de Stripe ni se lee ninguna clave secreta, así que el paywall y el
 * checkout (client components) pueden usarlo sin arrastrar el servidor al
 * bundle.
 *
 * Los importes NUNCA se escriben aquí: salen de `PRICES` (lib/config.ts), que
 * es la única fuente (decisión D17 — ningún monto vive en el copy).
 */

import { PRICES } from "@/lib/config";
import type { PlanType } from "@/lib/types";

export const PLAN_TYPES: readonly PlanType[] = ["monthly", "annual"] as const;

/** §3.4.4 — el anual llega preseleccionado (anclaje legítimo, no oculta nada). */
export const PRESELECTED_PLAN: PlanType = "annual";

export function isPlanType(value: unknown): value is PlanType {
  return value === "monthly" || value === "annual";
}

/** Lee un plan de un query param sin confiar en él. Default: el preseleccionado. */
export function parsePlan(raw: string | string[] | undefined): PlanType {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return isPlanType(value) ? value : PRESELECTED_PLAN;
}

/** Importe en USD del plan (§3.4.4). Nunca se escribe un número en el copy. */
export function planPriceUsd(plan: PlanType): number {
  return plan === "annual" ? PRICES.annual.usd : PRICES.monthly.usd;
}

/**
 * Nombre de la variable de entorno con el `price_id` de Stripe.
 * Se declara en `PRICES` (lib/config.ts) para que config siga siendo la
 * única fuente de verdad de la estrategia de precios.
 */
export function planPriceEnvName(plan: PlanType): string {
  return plan === "annual" ? PRICES.annual.stripeEnv : PRICES.monthly.stripeEnv;
}
