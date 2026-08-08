"use client";

/**
 * `landing_section_viewed` (§7.5 + decisión D24) — instrumentación de qué
 * secciones de la landing llega a ver el visitante.
 *
 * Por qué existe: la tabla de requisitos de §3.1.1 pide "evento por sección
 * vista **y** por CTA". §7.5 solo listó el del CTA, así que D24 añadió este
 * evento con `{ section }`. Sin él la métrica §0.6 "tasa de inicio ≥25%" se
 * puede medir pero no explicar: se sabe cuánta gente no empieza la entrevista,
 * no en qué punto de la página se cayó.
 *
 * Cómo, sin tocar el presupuesto de §3.1.1 (<300 KB, LCP <2.5 s en 4G sobre
 * Android de gama media-baja):
 *
 *   · No envuelve nada. Recibe los `id` de las secciones y las busca en el
 *     DOM ya renderizado por el servidor, así que el árbol de `app/page.tsx`
 *     sigue siendo Server Component de arriba abajo.
 *   · `IntersectionObserver` (nativo, cero dependencias) en vez de escuchar
 *     scroll: no hay trabajo por frame ni layout thrashing.
 *   · Una sola emisión por sección y por carga; el observador se desconecta
 *     de cada elemento en cuanto dispara.
 *   · La analítica viaja por `trackLazy`, igual que el resto de la landing:
 *     el SDK de datos sigue fuera del chunk inicial.
 *   · Sin `IntersectionObserver` (navegador muy viejo) no pasa nada: no se
 *     emite y la página funciona igual. La analítica nunca rompe la UI.
 *
 * Umbral: 40% del alto de la sección visible. Las secciones de esta landing
 * son más altas que la ventana de un móvil, así que exigir el 100% no
 * dispararía nunca y exigir un píxel contaría como "vista" algo que solo
 * asomó al hacer scroll rápido.
 */

import { useEffect } from "react";
import { trackLazy } from "./track-lazy";

/** Umbral de visibilidad para considerar una sección "vista". */
const VISIBLE_RATIO = 0.4;

export type SectionViewTrackerProps = {
  /**
   * `id` de los elementos a observar, en orden de aparición. El mismo valor
   * viaja como propiedad `section` del evento: un solo nombre por sección,
   * sin tabla de traducción que se pueda desincronizar del DOM.
   */
  sections: readonly string[];
};

export function SectionViewTracker({ sections }: SectionViewTrackerProps) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const seen = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.id;
          if (!id || seen.has(id)) continue;
          seen.add(id);
          observer.unobserve(entry.target);
          trackLazy("landing_section_viewed", { section: id });
        }
      },
      { threshold: VISIBLE_RATIO },
    );

    for (const id of sections) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sections]);

  return null;
}
