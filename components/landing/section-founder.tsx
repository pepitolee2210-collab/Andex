import { Quote } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import type { LandingImage } from "@/lib/landing-images";
import { MediaSeccion } from "./media-seccion";

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
 * ── El retrato ──
 *
 * Es OPCIONAL y la sección está compuesta para las dos versiones. Con foto,
 * dos columnas en escritorio: el rostro a la izquierda, la cita a la
 * derecha. Sin foto, una sola columna centrada, exactamente como estaba.
 * Ninguna de las dos es la versión degradada de la otra.
 *
 * `sizes` no es decoración: sin él, el navegador pide la variante de ancho
 * completo aunque la imagen ocupe un tercio de pantalla, y en el Android de
 * gama media con datos contados del brief eso son cientos de kilobytes
 * tirados. Y `priority` está deliberadamente APAGADO: esta sección vive por
 * debajo del pliegue y adelantar su descarga competiría con el recorrido de
 * la portada, que sí se ve de entrada.
 *
 * Server Component: no hay estado. La entrada la ponen las primitivas
 * cliente `Reveal`, escalonadas para que el titular llegue antes que la cita.
 */

export type SectionFounderCopy = {
  eyebrow: string;
  title: string;
  /** Los párrafos de la cita, en orden. */
  body: readonly string[];
  /** Qué se ve en cada imagen, en orden. Sale de `lib/i18n`. */
  imageAlts: readonly string[];
  /** «Foto {n} de {total}» para los puntos del carrusel. */
  imageNav: string;
};

export type SectionFounderProps = {
  copy: SectionFounderCopy;
  /** Las que existan en disco. Ver `lib/landing-images.ts`. */
  images?: readonly LandingImage[];
  id?: string;
};

export function SectionFounder({
  copy,
  images = [],
  id = "fundador",
}: SectionFounderProps) {
  const hayImagen = images.length > 0;
  const cita = (
    <>
      {/* El filete teal a la izquierda hace de comilla: marca dónde empieza
          la voz del fundador y dónde termina, sin necesidad de firmarla. */}
      <blockquote className="border-l-2 border-teal pl-5 sm:pl-6">
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
    </>
  );

  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="px-5 py-16 sm:px-6 sm:py-24"
    >
      <div
        className={
          hayImagen
            ? "mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-9 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14"
            : "mx-auto w-full max-w-3xl"
        }
      >
        {hayImagen ? (
          <Reveal className="lg:sticky lg:top-24">
            {/* `rounded-xl` y sin sombra en línea: de noche el token de
                sombra vale `none` y una escrita a mano cancelaría el filete
                que la sustituye. */}
            {/* El eco del arco detrás del retrato. Decorativo puro, y
                deliberadamente a media opacidad: es un rastro, no un marco. */}
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 440 440"
                className="pointer-events-none absolute -left-8 -top-6 -z-10 hidden w-[calc(100%+4rem)] opacity-50 lg:block"
              >
                <path
                  d="M20 400 A 200 200 0 0 1 420 400"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <MediaSeccion
                images={images}
                alts={copy.imageAlts}
                navLabel={copy.imageNav}
                aspect="aspect-[4/5]"
                sizes="(min-width: 1024px) 32rem, 100vw"
                objectPosition="center 30%"
                className="arco-sup bg-surface-alt"
              />
            </div>
          </Reveal>
        ) : null}

        <div>
          <Reveal>
            {/* El icono de comillas sólo cuando NO hay retrato: con foto, la
                cara ya dice que alguien habla, y dos señales para lo mismo
                es una de más. */}
            {hayImagen ? null : (
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-full bg-teal-soft text-teal-deep"
              >
                <Quote className="size-5" />
              </span>
            )}
            <p
              className={`text-caption font-bold uppercase tracking-widest text-teal-deep ${
                hayImagen ? "" : "mt-4"
              }`}
            >
              {copy.eyebrow}
            </p>
            <h2
              id={`${id}-titulo`}
              className="mt-3 font-heading text-h1 text-ink sm:text-display"
            >
              {copy.title}
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="mt-7 block sm:mt-9">
            {cita}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
