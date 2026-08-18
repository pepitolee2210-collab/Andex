"use client";

/**
 * COSTURA ENTRE SECCIONES.
 *
 * El problema que resuelve: apilar bandas de color con bordes rectos hace que
 * una página se lea como una pila de cajas. En móvil, donde solo se ve una
 * franja cada vez, ese corte seco es lo que la vuelve aburrida — el visitante
 * percibe "otra sección más" en vez de un recorrido continuo.
 *
 * Aquí el borde entre dos secciones es una curva que se dibuja con el propio
 * color de la sección siguiente, de modo que una sección *entra* en la otra.
 * Además la curva se aplana ligeramente con el scroll, lo que da sensación de
 * profundidad sin mover nada pesado (solo `transform`, compuesto en GPU).
 *
 * Se coloca al FINAL de una sección y pinta el color de la que viene debajo.
 */

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

export type SeamTone =
  | "page"
  | "surface"
  | "surface-alt"
  | "navy"
  | "navy-deep"
  | "navy-body"
  | "teal-soft";

const FILL: Record<SeamTone, string> = {
  page: "text-page",
  surface: "text-surface",
  "surface-alt": "text-surface-alt",
  navy: "text-navy",
  "navy-deep": "text-navy-deep",
  "navy-body": "text-navy-body",
  "teal-soft": "text-teal-soft",
};

export type SectionSeamProps = {
  /** Color de la sección que viene DEBAJO. */
  to: SeamTone;
  /**
   * `curve` es suave; `wedge` corta en diagonal, más rotundo; `arco` es el
   * arco del isotipo a escala de página — simétrico y alto, la sección de
   * abajo sube por el centro. Es el que da la forma a la landing.
   */
  shape?: "curve" | "wedge" | "arco";
  className?: string;
};

export function SectionSeam({ to, shape = "curve", className }: SectionSeamProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Se estira mientras la costura cruza la pantalla. `useScroll` con `target`
  // no depende de Lenis, así que funciona igual con scroll táctil nativo.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 0.5, 1], [1.35, 1, 0.75]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none relative -mb-px block", className)}
    >
      <motion.svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        fill="none"
        className={cn("block h-10 w-full sm:h-16 lg:h-20", FILL[to])}
        style={reduced ? undefined : { scaleY, transformOrigin: "bottom" }}
      >
        {shape === "arco" ? (
          // El arco de la marca. Simétrico y con la cima muy arriba: la
          // sección de abajo no «entra» por un lado, emerge por el centro.
          <path d="M0 90 C 360 -6, 1080 -6, 1440 90 Z" fill="currentColor" />
        ) : shape === "curve" ? (
          // Curva asimétrica: el punto bajo cae a la izquierda, donde vive el
          // texto. Una curva simétrica se lee como decoración; esta acompaña
          // la lectura.
          <path d="M0 90 L0 34 C 300 4, 780 -6, 1120 26 C 1268 40, 1360 52, 1440 58 L1440 90 Z" fill="currentColor" />
        ) : (
          <path d="M0 90 L0 44 L1440 0 L1440 90 Z" fill="currentColor" />
        )}
      </motion.svg>
    </div>
  );
}
