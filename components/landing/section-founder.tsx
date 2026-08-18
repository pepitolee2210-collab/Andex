import { Quote } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";

/**
 * S4 · LA HISTORIA DEL FUNDADOR.
 *
 * Es la sección que sostiene el titular de la portada. «El camino que ya
 * recorrí» es una afirmación fuerte y sin esto se queda en eslogan: aquí
 * se dice qué camino, y se dice nombrando las cuatro cosas concretas —el
 * formulario, el crédito, los cobros abusivos, el idioma— en vez de hablar
 * de «retos» y «desafíos».
 *
 * Va en `<blockquote>` y no en párrafos sueltos porque es literalmente una
 * cita: alguien habla en primera persona. El marcado dice lo mismo que el
 * diseño, que es lo que hace que un lector de pantalla lo anuncie como cita
 * y no como cuerpo de página.
 *
 * Server Component: no hay estado. La entrada la ponen las primitivas
 * cliente `Reveal`, escalonadas para que el titular llegue antes que la
 * cita.
 */

export type SectionFounderCopy = {
  eyebrow: string;
  title: string;
  /** Los párrafos de la cita, en orden. */
  body: readonly string[];
};

export type SectionFounderProps = {
  copy: SectionFounderCopy;
  id?: string;
};

export function SectionFounder({ copy, id = "fundador" }: SectionFounderProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="px-5 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto w-full max-w-3xl">
        <Reveal>
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-full bg-teal-soft text-teal-deep"
          >
            <Quote className="size-5" />
          </span>
          <p className="mt-4 text-caption font-bold uppercase tracking-widest text-teal-deep">
            {copy.eyebrow}
          </p>
          <h2
            id={`${id}-titulo`}
            className="mt-3 font-heading text-h1 text-ink sm:text-display"
          >
            {copy.title}
          </h2>
        </Reveal>

        {/* El filete teal a la izquierda hace de comilla: marca dónde empieza
            la voz del fundador y dónde termina, sin necesidad de firmarla. */}
        <Reveal delay={0.1}>
          <blockquote className="mt-7 border-l-2 border-teal pl-5 sm:mt-9 sm:pl-6">
            {copy.body.map((parrafo, i) => (
              <p
                key={parrafo.slice(0, 40)}
                className={
                  i === 0
                    ? "text-body text-muted sm:text-body-lg"
                    : "mt-4 text-body text-muted sm:text-body-lg"
                }
              >
                {parrafo}
              </p>
            ))}
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
