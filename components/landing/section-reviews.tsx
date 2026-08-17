/**
 * LANDING · RESEÑAS
 *
 * ── Por qué esta sección hoy está vacía a propósito ──
 *
 * La maqueta pedía un carrusel de reseñas de clientes con sus estrellas.
 * ANDEX está en piloto en Utah y todavía no lo ha usado nadie, así que no
 * hay ni una reseña real.
 *
 * Rellenarlo con testimonios inventados sería, en un producto cuyo
 * argumento entero es la confianza, exactamente lo que hace dudar — y es
 * el mismo registro de quien cobró a este público cientos de dólares por
 * trámites gratis. Desde 2024, además, las reseñas falsas son sancionables
 * por la FTC en Estados Unidos, que es donde esto se publica.
 *
 * Así que el componente está hecho y espera datos. Mientras `RESENAS` esté
 * vacío pinta una sola frase que dice la verdad: que no hay todavía y que
 * cuando las haya irán con su nombre y sin retocar. Eso, con este público,
 * vale más que cinco estrellas fabricadas.
 *
 * Para encenderla basta con llenar `RESENAS` con reseñas verdaderas.
 */

import { Quote, Star } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/dictionaries/landing";

export type Resena = {
  /** El nombre con el que la persona quiere aparecer. */
  autor: string;
  /** Dónde está. «Ogden, Utah» hace la reseña comprobable. */
  lugar: string;
  /** Sus palabras, sin retocar. */
  texto: string;
  /** 1–5. */
  estrellas: number;
};

/**
 * VACÍO A PROPÓSITO. No se rellena hasta que existan reseñas reales, con
 * permiso de quien las escribió.
 */
export const RESENAS: readonly Resena[] = [];

export type SectionReviewsProps = { copy: LandingDict["reviews"] };

export function SectionReviews({ copy }: SectionReviewsProps) {
  return (
    <section
      aria-labelledby="reviews-titulo"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex size-11 items-center justify-center rounded-full bg-teal-soft text-teal-deep"
        >
          <Quote className="size-5" />
        </span>
        <p className="mt-4 text-caption font-bold uppercase tracking-widest text-teal-deep">
          {copy.eyebrow}
        </p>
        <h2 id="reviews-titulo" className="mt-3 font-heading text-h1 text-ink">
          {copy.title}
        </h2>
      </div>

      {RESENAS.length === 0 ? (
        <p className="mx-auto mt-6 max-w-2xl text-center text-body-lg text-muted">
          {copy.empty}
        </p>
      ) : (
        /* Tira horizontal con `scroll-snap`: el arrastre, la inercia y el
           teclado los da el navegador, y no cuesta una animación en JS. */
        <ul className="scrollbar-none mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
          {RESENAS.map((r) => (
            <li
              key={`${r.autor}-${r.lugar}`}
              className="w-[min(20rem,80vw)] shrink-0 snap-center rounded-xl border border-line bg-surface p-5 shadow-sm"
            >
              <p aria-label={`${r.estrellas} / 5`} className="flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    aria-hidden="true"
                    className={
                      i < r.estrellas
                        ? "size-4 fill-amber text-amber"
                        : "size-4 text-line"
                    }
                  />
                ))}
              </p>
              <blockquote className="mt-3 text-body text-ink">{r.texto}</blockquote>
              <footer className="mt-4 border-t border-line pt-3">
                <p className="text-body font-semibold text-ink">{r.autor}</p>
                <p className="text-caption text-muted">{r.lugar}</p>
              </footer>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
