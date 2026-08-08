"use client";

/**
 * HERO (§3.1.1) — el gancho emocional.
 *
 * Composición en dos columnas: a la izquierda la promesa y la acción, a la
 * derecha el producto funcionando. La decisión de fondo es que el hero
 * DEMUESTRA en vez de describir — por eso la columna derecha no es una
 * ilustración sino la interfaz real recorriendo sus pantallas.
 *
 * El titular se revela línea a línea desde detrás de una máscara. Es el
 * recurso editorial clásico y aquí además significa algo: las líneas
 * aparecen como aparece el camino, una después de otra.
 *
 * La Ruta (§2.8) sigue siendo el elemento firma y aparece UNA sola vez:
 * como trazo que nace bajo el titular y viaja hacia el producto.
 */

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TourDict } from "@/lib/i18n/dictionaries/tour";
import { PhoneTour } from "./phone-tour";
import { CtaLink } from "./cta-link";

const EASE = [0.22, 1, 0.36, 1] as const;

export type HeroCopy = {
  badge: string;
  titleLines: readonly string[];
  subtitle: string;
  cta: string;
  ctaHint: string;
  socialProof: string;
  scrollHint: string;
  /** Guion del recorrido del producto que se ve en el teléfono. */
  tour: TourDict;
};

export type SectionHeroProps = {
  copy: HeroCopy;
  ctaHref: string;
  /** Título accesible completo, en una sola cadena, para lectores de pantalla. */
  plainTitle: string;
  className?: string;
};

/** Una línea del titular, revelada desde detrás de una máscara. */
function MaskedLine({
  children,
  delay,
  reduced,
}: {
  children: ReactNode;
  delay: number;
  reduced: boolean | null;
}) {
  if (reduced) return <span className="block">{children}</span>;
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.85, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function SectionHero({
  copy,
  ctaHref,
  plainTitle,
  className,
}: SectionHeroProps) {
  const reduced = useReducedMotion();
  const lines = copy.titleLines;
  // El resto del contenido entra cuando el titular ya se ha asentado.
  const afterTitle = reduced ? 0 : 0.12 * lines.length + 0.35;

  return (
    <section
      id="hero"
      aria-labelledby="hero-titulo"
      className={cn("relative overflow-hidden px-4 pb-16 pt-10 sm:pb-20 lg:pb-28 lg:pt-16", className)}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* ── Columna izquierda: promesa y acción ─────────── */}
        <div>
          <motion.p
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="inline-block rounded-full bg-amber px-3 py-1.5 text-caption font-bold uppercase tracking-wide text-on-highlight sm:px-3.5 sm:tracking-widest"
          >
            {copy.badge}
          </motion.p>

          {/* El título accesible va completo y en un solo nodo; las líneas
              visibles son decorativas para no leerlas troceadas. */}
          {/* A 320px el titular a 40px ocupaba seis líneas y empujaba el CTA
              fuera de pantalla. Arranca en h1 (32px) y crece con el ancho:
              la promesa sigue siendo lo más grande de la página, pero deja
              ver la acción sin hacer scroll. */}
          <h1
            id="hero-titulo"
            className="mt-6 font-heading text-h1 text-ink sm:text-display lg:text-display-lg"
          >
            <span className="sr-only">{plainTitle}</span>
            <span aria-hidden="true">
              {lines.map((line, i) => (
                <MaskedLine key={line} delay={0.12 * i + 0.1} reduced={reduced}>
                  {line}
                </MaskedLine>
              ))}
            </span>
          </h1>

          {/* La Ruta, aparición única: nace bajo el titular y viaja hacia el
              producto de la derecha. Se dibuja cuando el titular termina. */}
          <svg
            aria-hidden="true"
            viewBox="0 0 320 12"
            fill="none"
            preserveAspectRatio="none"
            className="mt-7 h-3 w-full max-w-sm"
          >
            <motion.path
              d="M 2 6 H 318"
              stroke="var(--teal-deep)"
              strokeWidth={2}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              initial={reduced ? false : { strokeDashoffset: 1 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 1, delay: afterTitle, ease: EASE }}
            />
          </svg>

          <motion.p
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: afterTitle, ease: EASE }}
            className="mt-6 max-w-xl text-body-lg text-muted"
          >
            {copy.subtitle}
          </motion.p>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: afterTitle + 0.12, ease: EASE }}
            className="mt-8"
          >
            <CtaLink position="hero" href={ctaHref} size="lg" className="group w-full sm:w-auto">
              {copy.cta}
              <ArrowRight
                aria-hidden="true"
                className="ml-2 inline size-5 transition-transform duration-200 group-hover:translate-x-1"
              />
            </CtaLink>
            <p className="mt-3 text-caption text-muted">{copy.ctaHint}</p>
          </motion.div>

          <motion.p
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: afterTitle + 0.24 }}
            className="mt-8 flex items-center gap-3 border-t border-line pt-6 text-body text-muted"
          >
            {/* Sin avatares inventados: esta audiencia reconoce el stock
                falso al instante y es la firma de las webs que la estafan. */}
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-teal-deep" />
            {copy.socialProof}
          </motion.p>
        </div>

        {/* ── Columna derecha: el producto funcionando ─────── */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: reduced ? 0 : 0.35, ease: EASE }}
        >
          <PhoneTour copy={copy.tour} />
        </motion.div>
      </div>
    </section>
  );
}
