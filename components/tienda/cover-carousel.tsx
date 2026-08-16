"use client";

/**
 * EL CARRUSEL DE PORTADAS.
 *
 * ── El encuadre ──
 *
 * Las tres fotos no tienen la misma proporción: una es vertical (0.91) y
 * dos son 5:4 (1.25). Con un recorte 16:9 —lo primero que se probó— la
 * vertical perdía la cabeza. El contenedor es **4:3** y el encuadre se
 * ancla arriba (`center 20%`): es lo que deja ver las tres caras enteras,
 * que aquí es el contenido — la foto es la prueba de quién está detrás.
 *
 * ── El desplazamiento ──
 *
 * Lo lleva el navegador con `scroll-snap`, no un `transform` animado desde
 * JavaScript. Eso da gratis el arrastre con el dedo, la inercia, el rebote
 * del final y el teclado, y ocurre en el hilo del compositor: en un
 * Android de gama media, que es el objetivo, una animación en JS es justo
 * donde aparece el tirón.
 *
 * ── El avance automático ──
 *
 * Cada 5 segundos, y con tres frenos que no son opcionales:
 *
 *   · **Se para si tocas.** Quien elige una foto la ha elegido; que se la
 *     quiten a los tres segundos es perder el control de lo que mira.
 *     Vuelve a arrancar tras 10 s de quietud.
 *   · **Se para con la pestaña en segundo plano.** Un temporizador
 *     corriendo detrás gasta batería y datos sin que nadie lo vea.
 *   · **No existe con `prefers-reduced-motion`.** Ahí no se atenúa: se
 *     apaga.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Cada cuánto pasa a la siguiente. */
const INTERVALO_MS = 5000;
/** Cuánto espera tras un toque antes de volver a andar solo. */
const REANUDAR_MS = 10_000;

export type CoverCarouselProps = {
  images: readonly string[];
  /** Qué se ve en cada foto, en el mismo orden. */
  alts: readonly string[];
  /** «Foto {n} de {total}» — el nombre accesible de cada punto. */
  navLabel: string;
  className?: string;
};

export function CoverCarousel({ images, alts, navLabel, className }: CoverCarouselProps) {
  const pistaRef = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  /** Momento del último toque. `0` = nunca; nada que esperar. */
  const tocadoRef = useRef(0);

  /**
   * Cuál se está viendo. Se calcula del scroll y no de un contador propio,
   * porque el dedo puede moverlo sin pasar por aquí: un contador aparte se
   * desincroniza en cuanto alguien arrastra.
   */
  const alDesplazar = useCallback(() => {
    const pista = pistaRef.current;
    if (!pista || pista.clientWidth === 0) return;
    setActual(Math.round(pista.scrollLeft / pista.clientWidth));
  }, []);

  useEffect(() => {
    const pista = pistaRef.current;
    if (!pista) return;
    pista.addEventListener("scroll", alDesplazar, { passive: true });
    return () => pista.removeEventListener("scroll", alDesplazar);
  }, [alDesplazar]);

  const ir = useCallback((i: number, suave = true) => {
    const pista = pistaRef.current;
    if (!pista) return;
    pista.scrollTo({
      left: i * pista.clientWidth,
      behavior: suave ? "smooth" : "auto",
    });
  }, []);

  /** Cualquier toque o arrastre pausa el avance. */
  const marcarTocado = useCallback(() => {
    tocadoRef.current = Date.now();
  }, []);

  // ── El avance automático ──
  useEffect(() => {
    if (images.length < 2) return;
    if (typeof window === "undefined") return;

    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (quieto.matches) return;

    const id = window.setInterval(() => {
      // La pestaña en segundo plano no gasta batería moviendo fotos.
      if (document.hidden) return;
      // Tras un toque, silencio hasta que se enfríe.
      if (tocadoRef.current && Date.now() - tocadoRef.current < REANUDAR_MS) return;

      const pista = pistaRef.current;
      if (!pista || pista.clientWidth === 0) return;
      const visible = Math.round(pista.scrollLeft / pista.clientWidth);
      ir((visible + 1) % images.length);
    }, INTERVALO_MS);

    return () => window.clearInterval(id);
  }, [images.length, ir]);

  return (
    <div
      className={cn("relative", className)}
      onPointerDown={marcarTocado}
      onTouchStart={marcarTocado}
      onWheel={marcarTocado}
    >
      {/* `aria-live` en `off`: una foto que cambia sola no debe interrumpir
          a quien está leyendo el titular con un lector de pantalla. */}
      <div
        ref={pistaRef}
        aria-live="off"
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {images.map((src, i) => (
          <div key={src} className="w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alts[i] ?? ""}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              className="aspect-[4/3] w-full object-cover"
              style={{ objectPosition: "center 20%" }}
            />
          </div>
        ))}
      </div>

      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => {
                marcarTocado();
                ir(i);
              }}
              aria-label={navLabel
                .replace("{n}", String(i + 1))
                .replace("{total}", String(images.length))}
              aria-current={i === actual ? "true" : undefined}
              /* El punto se ve pequeño pero el botón mide 44px: el área
                 táctil no se recorta por estética. */
              className="flex size-11 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block h-1.5 rounded-full shadow-sm transition-all duration-200",
                  i === actual ? "w-5 bg-white" : "w-1.5 bg-white/55",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
