"use client";

/**
 * S9 · PREGUNTAS FRECUENTES — acordeón.
 *
 * ── Decisión: UNO ABIERTO A LA VEZ, con el primero abierto de entrada.
 *    Son cinco preguntas cortas y ninguna se compara con otra: nadie
 *    necesita dos abiertas al mismo tiempo, y el modo exclusivo mantiene
 *    la lista corta y escaneable en un teléfono. El primero abierto no es
 *    decoración: si los cinco llegan cerrados, mucha gente lee cinco
 *    titulares y se va sin descubrir que se despliegan. Volver a pulsar la
 *    pregunta abierta la cierra (no hay estado del que no se pueda salir).
 *
 * ── Accesibilidad (patrón WAI-ARIA Accordion):
 *    · cada pregunta es un `<button aria-expanded aria-controls>` dentro de
 *      un `<h3>`, así el lector de pantalla la anuncia como encabezado Y
 *      como control, y la lista sigue siendo navegable por encabezados;
 *    · la respuesta es una región con `id` y `aria-labelledby` apuntando a
 *      su pregunta;
 *    · teclado: Tab entra y sale, Enter/Espacio abren (son botones de
 *      verdad), y ↑ ↓ Inicio Fin saltan entre preguntas sin salir del
 *      acordeón.
 *
 * ── Movimiento: `AnimatePresence` + `height: "auto"`. Es la única forma
 *    honesta de animar una altura desconocida sin medir a mano ni fijar un
 *    max-height inventado que recorte respuestas largas. `overflow-hidden`
 *    durante la transición evita que el texto se desborde mientras crece.
 *    El chevron gira 180°. Con `prefers-reduced-motion` todo pasa a 0 s:
 *    abre y cierra al instante, sin perder función.
 */

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

/** Misma curva que el resto del sistema de movimiento. */
const EASE = [0.22, 1, 0.36, 1] as const;

export type FaqItem = {
  q: string;
  a: string;
};

export type SectionFaqProps = {
  /** `dict.landing.faq.eyebrow` */
  eyebrow: string;
  /** `dict.landing.faq.title` */
  title: string;
  /** `dict.landing.faq.items` — 5 pares pregunta/respuesta. */
  items: readonly FaqItem[];
  /** `id` de la sección para el ancla. Default: `"faq"`. */
  id?: string;
  className?: string;
};

export function SectionFaq({
  eyebrow,
  title,
  items,
  id = "faq",
  className,
}: SectionFaqProps) {
  const reduced = useReducedMotion();
  const uid = useId();
  // El primero abierto: demuestra que la lista se despliega.
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const duration = reduced ? 0 : 0.34;

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = items.length - 1;
    let next: number | null = null;

    if (event.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;

    if (next === null) return;
    event.preventDefault();
    buttonsRef.current[next]?.focus();
  }

  return (
    <section
      id={id}
      aria-labelledby={`${uid}-title`}
      className={cn("border-t border-line px-4 py-14 sm:py-20", className)}
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <p className="text-label font-semibold tracking-wide text-muted">
            {eyebrow}
          </p>
          <h2
            id={`${uid}-title`}
            className="mt-2 font-heading text-h1 text-ink"
          >
            {title}
          </h2>
        </Reveal>

        <div className="mt-8 divide-y divide-line border-y border-line">
          {items.map((item, index) => {
            const open = openIndex === index;
            const buttonId = `${uid}-q-${index}`;
            const panelId = `${uid}-a-${index}`;

            return (
              <div key={item.q}>
                <h3>
                  <button
                    ref={(node) => {
                      buttonsRef.current[index] = node;
                    }}
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? null : index)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                    className={cn(
                      "flex w-full min-h-14 items-center justify-between gap-4 py-4 text-left",
                      "font-heading text-h3 text-ink",
                      "transition-colors duration-150 hover:text-teal-deep",
                    )}
                  >
                    <span className="min-w-0">{item.q}</span>
                    <motion.span
                      aria-hidden="true"
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: reduced ? 0 : 0.3, ease: EASE }}
                      className={cn(
                        "inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                        open ? "bg-teal-soft text-teal-deep" : "text-muted",
                      )}
                    >
                      <ChevronDown className="size-5" />
                    </motion.span>
                  </button>
                </h3>

                {/* La región vive SIEMPRE en el DOM para que el
                    `aria-controls` del botón apunte a algo real; lo que
                    entra y sale es su contenido. Desmontar el texto (en vez
                    de esconderlo con altura 0) es lo correcto: dentro de un
                    contenedor colapsado el texto seguiría siendo legible
                    para el lector de pantalla y enfocable con Tab.

                    `initial={false}` para que el primer item NO se anime al
                    cargar: nace abierto, no "se abre solo" delante del
                    usuario. */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="overflow-hidden"
                >
                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        key="panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 pr-4 text-body text-muted sm:pr-10">
                          {item.a}
                        </p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
