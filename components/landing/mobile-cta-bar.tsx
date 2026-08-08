"use client";

/**
 * BARRA DE ACCIÓN FIJA — solo móvil.
 *
 * En un teléfono, el CTA del hero desaparece a los dos dedos de scroll y el
 * siguiente no llega hasta muy abajo. Durante la mayor parte del recorrido no
 * hay ninguna forma de empezar sin volver arriba. Esta barra resuelve eso: se
 * asoma cuando el hero sale de pantalla y acompaña el resto del camino.
 *
 * Tres decisiones para que ayude en vez de estorbar:
 *
 *  · **No aparece sobre el hero.** Ahí ya hay un CTA grande; taparlo con otro
 *    sería ruido. Entra cuando el hero se ha ido.
 *  · **Se esconde al bajar y vuelve al subir.** Bajar es leer; subir es
 *    buscar. Solo aparece cuando el gesto sugiere que la persona busca algo.
 *  · **Se retira en el cierre.** Abajo del todo ya hay un CTA a pantalla
 *    completa; dos a la vez compiten entre sí.
 *
 * Lleva `env(safe-area-inset-bottom)` para no quedar bajo la barra de gestos
 * de los iPhone modernos.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { CtaLink } from "./cta-link";

export type MobileCtaBarProps = {
  label: string;
  hint: string;
  href: string;
  /** id de la sección tras la cual aparece. Default: "hero". */
  afterId?: string;
  /** id de la sección donde vuelve a ocultarse. Default: "cierre". */
  hideAtId?: string;
};

export function MobileCtaBar({
  label,
  hint,
  href,
  afterId = "hero",
  hideAtId = "cierre",
}: MobileCtaBarProps) {
  const reduced = useReducedMotion();
  const [pastHero, setPastHero] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const [goingUp, setGoingUp] = useState(true);
  const lastY = useRef(0);

  // Observadores para saber dónde estamos, sin escuchar cada píxel de scroll.
  useEffect(() => {
    const hero = document.getElementById(afterId);
    const end = document.getElementById(hideAtId);
    const obs: IntersectionObserver[] = [];

    if (hero) {
      const o = new IntersectionObserver(
        ([e]) => setPastHero(!e.isIntersecting),
        { rootMargin: "-40% 0px 0px 0px" },
      );
      o.observe(hero);
      obs.push(o);
    }
    if (end) {
      const o = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting), {
        rootMargin: "0px 0px -20% 0px",
      });
      o.observe(end);
      obs.push(o);
    }
    return () => obs.forEach((o) => o.disconnect());
  }, [afterId, hideAtId]);

  // Dirección del gesto. `passive` para no bloquear el scroll táctil.
  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY.current) > 8) {
        setGoingUp(y < lastY.current);
        lastY.current = y;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visible = pastHero && !atEnd && (goingUp || reduced);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={reduced ? false : { y: "120%" }}
          animate={{ y: 0 }}
          exit={reduced ? undefined : { y: "120%" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pt-3 backdrop-blur-lg lg:hidden"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <CtaLink position="footer" href={href} size="lg" className="group w-full">
            {label}
            <ArrowRight
              aria-hidden="true"
              className="ml-2 inline size-5 transition-transform duration-200 group-hover:translate-x-1"
            />
          </CtaLink>
          <p className="mt-1.5 text-center text-caption text-muted">{hint}</p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
