/**
 * Recursos oficiales externos del sidebar contextual (§4.2 "Enlaces externos",
 * tabla §6). Módulo PURO: estructura y URL, cero copy — las etiquetas viven en
 * `panel.resources` de lib/i18n.
 *
 * ⚠️ Espejo EXACTO del seed `external_resources` de
 * `supabase/migrations/0003_seed.sql` (mismas URLs, mismo `scope_type` /
 * `scope_value` / `location_context`). Existe porque el contrato
 * `lib/data/contract.ts` todavía NO expone un método para leer esa tabla y en
 * modo demo no hay base de datos. Cuando el agente de Datos añada
 * `getExternalResources(scope)` al contrato, este archivo se borra y la UI
 * consume el store. Ver reporte del agente Dashboard.
 *
 * REGLA DURA: aquí NO se inventa ninguna URL. Solo entran las que el PRD §6
 * escribe literalmente y que el seed ya validó. Un estado sin DMV sembrado no
 * muestra enlace de DMV: mejor un hueco honesto que un enlace inventado.
 */

import type { LocationContext, ModuleSlug } from "@/lib/types";

/** Clave de la etiqueta en `panel.resources`. */
export type ResourceLabelKey =
  | "uscisCase"
  | "eoirCourt"
  | "ds160"
  | "embassy"
  | "dmvUt"
  | "llcUt"
  | "ptin";

export type ExternalResource = {
  labelKey: ResourceLabelKey;
  moduleSlug: ModuleSlug;
  officialUrl: string;
  scopeType: "national" | "state" | "country";
  /** ISO de 2 letras; null cuando el alcance es nacional. */
  scopeValue: string | null;
  /** null = aplica a los dos contextos. */
  locationContext: LocationContext | null;
};

/**
 * Fecha de la última verificación de las URLs (§6: "cada recurso debe llevar
 * `last_verified_at` visible al usuario"). Es la fecha del seed; el job semanal
 * de verificación de §6 todavía no existe (pendiente, ver reporte).
 */
export const RESOURCES_VERIFIED_AT = "2026-08-07";

export const EXTERNAL_RESOURCES: readonly ExternalResource[] = [
  {
    labelKey: "uscisCase",
    moduleSlug: "boveda",
    officialUrl: "https://egov.uscis.gov/casestatus/",
    scopeType: "national",
    scopeValue: null,
    locationContext: null,
  },
  {
    labelKey: "eoirCourt",
    moduleSlug: "boveda",
    officialUrl: "https://portal.eoir.justice.gov",
    scopeType: "national",
    scopeValue: null,
    locationContext: null,
  },
  {
    labelKey: "ds160",
    moduleSlug: "migracion",
    officialUrl: "https://ceac.state.gov",
    scopeType: "national",
    scopeValue: null,
    locationContext: "pre_arrival",
  },
  {
    labelKey: "embassy",
    moduleSlug: "migracion",
    officialUrl: "https://mx.usembassy.gov/visas/",
    scopeType: "country",
    scopeValue: "MX",
    locationContext: "pre_arrival",
  },
  {
    labelKey: "embassy",
    moduleSlug: "migracion",
    officialUrl: "https://co.usembassy.gov/visas/",
    scopeType: "country",
    scopeValue: "CO",
    locationContext: "pre_arrival",
  },
  {
    labelKey: "embassy",
    moduleSlug: "migracion",
    officialUrl: "https://gt.usembassy.gov/visas/",
    scopeType: "country",
    scopeValue: "GT",
    locationContext: "pre_arrival",
  },
  {
    labelKey: "dmvUt",
    moduleSlug: "migracion",
    officialUrl: "https://dmv.utah.gov",
    scopeType: "state",
    scopeValue: "UT",
    locationContext: "in_us",
  },
  {
    labelKey: "llcUt",
    moduleSlug: "negocio",
    officialUrl: "https://corporations.utah.gov",
    scopeType: "state",
    scopeValue: "UT",
    locationContext: null,
  },
  {
    labelKey: "ptin",
    moduleSlug: "academia",
    officialUrl: "https://www.irs.gov/ptin",
    scopeType: "national",
    scopeValue: null,
    locationContext: null,
  },
];

export type ResourceScope = {
  context: LocationContext;
  /** Rama A: estado de EE. UU. (ISO 2). */
  stateUS: string | null;
  /** Rama B: país de residencia (ISO 2). */
  countryOfResidence: string | null;
};

/**
 * Recursos aplicables a un usuario, opcionalmente filtrados por módulo
 * (el sidebar contextual sirve los del módulo #1 y #2, §4.2).
 *
 * Un recurso aplica cuando su contexto coincide (o es nulo) Y su alcance
 * geográfico coincide: nacional siempre; `state` solo con ese estado;
 * `country` solo con ese país.
 */
export function resourcesFor(
  scope: ResourceScope,
  moduleSlugs?: readonly ModuleSlug[],
): ExternalResource[] {
  return EXTERNAL_RESOURCES.filter((resource) => {
    if (resource.locationContext && resource.locationContext !== scope.context) {
      return false;
    }
    if (moduleSlugs && !moduleSlugs.includes(resource.moduleSlug)) return false;
    if (resource.scopeType === "state") {
      return scope.stateUS != null && resource.scopeValue === scope.stateUS;
    }
    if (resource.scopeType === "country") {
      return (
        scope.countryOfResidence != null &&
        resource.scopeValue === scope.countryOfResidence
      );
    }
    return true;
  });
}
