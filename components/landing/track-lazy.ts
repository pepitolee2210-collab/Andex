"use client";

/**
 * Envoltorio de CARGA DIFERIDA sobre `track()` de `@/lib/analytics/track`.
 *
 * Por qué existe (presupuesto de performance §3.1.1: < 300 KB de primera
 * carga, LCP < 2.5 s en 4G sobre Android de gama media-baja):
 *
 *   `@/lib/analytics/track` importa `getDataStore()` de `@/lib/data`, que
 *   importa ESTÁTICAMENTE `supabase-store.ts` → `@supabase/ssr` +
 *   `@supabase/supabase-js`. Un import estático desde un componente cliente
 *   de la landing arrastraría todo el SDK de Supabase al chunk inicial de la
 *   página pública, que no necesita base de datos para nada.
 *
 *   Con `import()` dinámico, webpack corta ese árbol en un chunk aparte que
 *   se descarga DESPUÉS de la hidratación (lo dispara `landing_viewed`), sin
 *   tocar la ruta crítica de render. La analítica sigue pasando por el
 *   `track()` oficial (brief §8): esto no la reimplementa, solo la difiere.
 *
 * Cuándo se puede borrar este archivo: cuando `lib/analytics/track.ts`
 * (Sesión 0) cargue la capa de datos de forma perezosa por su cuenta.
 * Ver el reporte del agente de Landing.
 *
 * Fire-and-forget: la analítica jamás bloquea ni rompe la UI.
 */

import type { AnalyticsEventName, AnalyticsProps } from "@/lib/types";

export function trackLazy(
  name: AnalyticsEventName,
  props?: AnalyticsProps,
): void {
  void import("@/lib/analytics/track")
    .then((m) => m.track(name, props))
    .catch(() => {
      /* sin red o con el chunk caído no pasa nada: es analítica */
    });
}
