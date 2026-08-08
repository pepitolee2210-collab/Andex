"use client";

/**
 * Analítica de producto (§7.5). Los nombres de evento están tipados en
 * lib/types.ts — usar SOLO esos nombres, con las propiedades de la tabla §7.5.
 *
 * El evento clave del MVP: `module_opened` con `was_recommended`
 * (mide la precisión real del motor).
 *
 * Fire-and-forget: la analítica jamás bloquea ni rompe la UI.
 *
 * ⚡ La capa de datos se carga con `import()` DIFERIDO, no estático. Motivo:
 * `@/lib/data` arrastra `supabase-store` → `@supabase/supabase-js` (~40 KB
 * gzip). Con un import estático, cualquier página que emita un evento se
 * llevaría el SDK de Supabase en su chunk inicial — incluida la landing
 * pública, que no toca la base de datos. El presupuesto de §3.1.1 (<300 KB,
 * LCP <2.5 s en 4G sobre Android de gama baja) no lo tolera.
 */

import type { AnalyticsEventName, AnalyticsProps } from "@/lib/types";

export function track(name: AnalyticsEventName, props?: AnalyticsProps): void {
  if (typeof window === "undefined") return;

  void import("@/lib/data")
    .then(({ getDataStore }) => getDataStore().trackEvent(name, props))
    .catch(() => {
      /* nunca romper la UI por analítica */
    });
}
