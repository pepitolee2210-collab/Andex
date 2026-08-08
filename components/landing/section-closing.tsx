"use client";

/**
 * S10 · CIERRE — el último empujón.
 *
 * Tiene que sentirse como un FINAL, no como la sección número once. Tres
 * decisiones al servicio de eso:
 *
 *  1. **Cambio de terreno.** Toda la página vive sobre crema/blanco; aquí
 *     el fondo pasa a `bg-navy`. El salto de valor tonal hace de punto y
 *     final sin necesidad de ningún adorno.
 *  2. **Una sola columna, centrada, con aire de sobra** (`py-20 sm:py-28`).
 *     Nada compite con el CTA: no hay enlaces secundarios, ni columnas, ni
 *     una segunda idea.
 *  3. **El trazo que se completa** (ScrollTrigger, `scrub`): una hairline
 *     teal sobre el titular que se dibuja de dentro hacia fuera atada al
 *     scroll. No es una animación que "ocurre y ya": avanza exactamente lo
 *     que el usuario avanza, así que llegar al final de la página y
 *     completar el trazo son el mismo gesto. Es la sensación de llegada.
 *
 * El titular, el subtítulo, el CTA y la pista entran con `Reveal`, la
 * misma gramática de movimiento del resto de la landing, escalonados para
 * marcar jerarquía.
 *
 * `prefers-reduced-motion`: el efecto de GSAP no llega a montarse y el
 * trazo se queda dibujado entero (es su estado natural en el HTML; GSAP lo
 * pone a cero solo cuando va a animarlo). Sin JavaScript, idéntico.
 */

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";
import { CtaLink } from "./cta-link";

export type SectionClosingProps = {
  /** `dict.landing.closing.title` */
  title: string;
  /** `dict.landing.closing.subtitle` */
  subtitle: string;
  /** `dict.landing.closing.cta` */
  ctaLabel: string;
  /** `dict.landing.closing.hint` — va debajo del botón. */
  hint: string;
  /** Destino del CTA. Sugerido: `ROUTES.registro`. */
  ctaHref: string;
  /** `id` de la sección para el ancla. Default: `"cierre"`. */
  id?: string;
  className?: string;
};

export function SectionClosing({
  title,
  subtitle,
  ctaLabel,
  hint,
  ctaHref,
  id = "cierre",
  className,
}: SectionClosingProps) {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const strokeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    const stroke = strokeRef.current;
    if (!root || !stroke) return;

    let cancelled = false;
    let context: { revert: () => void } | null = null;

    // Import diferido, igual que en `components/motion/smooth-scroll.tsx`:
    // GSAP no entra en el chunk inicial de la página pública (§3.1.1).
    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      context = gsap.context(() => {
        gsap.set(stroke, { scaleX: 0 });
        gsap.to(stroke, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top 92%",
            end: "top 42%",
            scrub: 0.5,
          },
        });
      }, root);
    })();

    return () => {
      cancelled = true;
      context?.revert();
    };
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={cn("bg-navy px-4 py-20 sm:py-28", className)}
    >
      <div className="mx-auto max-w-3xl text-center">
        {/* El trazo. Nace dibujado: si GSAP no llega a cargar (o el sistema
            pide menos movimiento), se ve como lo que es, una regla fina. */}
        <span
          ref={strokeRef}
          aria-hidden="true"
          className="mx-auto block h-px w-full max-w-xs origin-center bg-teal"
        />

        <Reveal delay={0.05}>
          <h2
            id={`${id}-titulo`}
            className="mt-8 font-heading text-display text-white lg:text-display-lg"
          >
            {title}
          </h2>
        </Reveal>

        <Reveal delay={0.14}>
          <p className="mt-4 text-body-lg text-white/75">{subtitle}</p>
        </Reveal>

        <Reveal delay={0.22} className="mt-9 flex justify-center">
          <CtaLink
            position="footer"
            href={ctaHref}
            size="lg"
            describedBy={`${id}-hint`}
            className="shadow-lg"
          >
            {ctaLabel}
          </CtaLink>
        </Reveal>

        <Reveal delay={0.28}>
          <p id={`${id}-hint`} className="mt-4 text-body text-white/70">
            {hint}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
