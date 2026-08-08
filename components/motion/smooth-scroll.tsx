"use client";

/**
 * Scroll suave (Lenis) + puente con GSAP ScrollTrigger.
 *
 * Por qué juntos: Lenis toma el control del scroll, así que ScrollTrigger
 * deja de enterarse de la posición real si no se le sincroniza. Este
 * componente los casa una sola vez para toda la página.
 *
 * Se desactiva por completo cuando el sistema pide menos movimiento: el
 * scroll suave marea a quien tiene sensibilidad vestibular, y el propio
 * PRD exige respetar `prefers-reduced-motion` (§2.5). En ese caso el
 * navegador hace su scroll nativo y no se carga nada más.
 */

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    /**
     * En táctil ni siquiera se carga.
     *
     * Lenis ya tenía `syncTouch: false`, así que en un teléfono no hacía
     * nada útil — pero seguía descargando su código y manteniendo vivo un
     * bucle de animación en cada fotograma, gastando batería a cambio de
     * cero. El scroll nativo del móvil es mejor que cualquier emulación.
     *
     * Los efectos ligados al scroll no dependen de esto: usan `useScroll`
     * de Motion sobre el scroll real, así que en móvil siguen igual.
     */
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let lenis: import("lenis").default | null = null;
    let rafId = 0;
    let cancelled = false;

    void (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      lenis = new Lenis({
        duration: 1.1,
        // Curva de desaceleración suave: llega rápido y frena largo.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // En táctil NO se toca el scroll: el gesto nativo del móvil es
        // mejor que cualquier emulación y no cuesta batería.
        syncTouch: false,
      });

      lenis.on("scroll", ScrollTrigger.update);

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return null;
}
