/**
 * Geolocalización por IP — SOLO para preseleccionar, jamás para autoenviar
 * (regla UX 7 del wizard §3.2: "se sugiere, el usuario confirma").
 *
 * En Vercel llegan headers x-vercel-ip-*; en local no hay señal y se
 * devuelve null (los selectores quedan sin preselección, siempre editables).
 */

import { headers } from "next/headers";

export type GeoHint = {
  /** ISO 3166-1 alpha-2, ej. 'MX', 'US' */
  country: string | null;
  /** Código de región cuando country === 'US', ej. 'UT' */
  usState: string | null;
};

export async function getGeoHint(): Promise<GeoHint> {
  const h = await headers();
  const country = h.get("x-vercel-ip-country")?.toUpperCase() ?? null;
  const region = h.get("x-vercel-ip-country-region")?.toUpperCase() ?? null;
  return {
    country,
    usState: country === "US" ? region : null,
  };
}

/** Sugerencia de rama para el hero/wizard: 'in_us' si la IP es de EE. UU. */
export function suggestedContext(geo: GeoHint): "in_us" | "pre_arrival" | null {
  if (!geo.country) return null;
  return geo.country === "US" ? "in_us" : "pre_arrival";
}
