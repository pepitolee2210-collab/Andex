import { Check } from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import type { LandingImage } from "@/lib/landing-images";
import { MediaSeccion } from "./media-seccion";

/**
 * S6 · INGLÉS LABORAL EN VIVO.
 *
 * El documento maestro la quiere destacada, y lo está por el terreno: fondo
 * navy en mitad de una página crema. El salto tonal la separa sin necesidad
 * de un marco, una sombra ni un «¡NUEVO!».
 *
 * Es la única sección de un módulo con página propia, y hay una razón: es lo
 * que se paga y no se ve. Los documentos y los trámites se entienden solos
 * leyendo el nombre del módulo; que las clases sean EN VIVO, cuatro días por
 * semana y sin cuota aparte, no — y eso es exactamente lo que separa a esta
 * membresía de una carpeta de PDF.
 *
 * ── El ámbar ──
 * El documento pide acentos en ámbar y teal. El ámbar entra sólo como
 * superficie del distintivo, con texto navy encima: la regla del proyecto
 * prohíbe el ámbar puro debajo de texto claro —blanco sobre ámbar da
 * 1.77:1— y `--on-highlight` es el navy que sí resuelve sobre él.
 *
 * Server Component: no hay estado.
 */

export type EnglishPoint = {
  title: string;
  body: string;
};

export type SectionEnglishCopy = {
  eyebrow: string;
  title: string;
  points: readonly EnglishPoint[];
  /** Qué se ve en cada imagen, en orden. Sale de `lib/i18n`. */
  imageAlts: readonly string[];
  /** «Foto {n} de {total}» para los puntos del carrusel. */
  imageNav: string;
  /** La tarjeta de la próxima sesión, que se escapa de la foto. */
  sesion: { label: string; title: string; note: string };
};

export type SectionEnglishProps = {
  copy: SectionEnglishCopy;
  /** Las que existan en disco. Ver `lib/landing-images.ts`. */
  images?: readonly LandingImage[];
  id?: string;
};

export function SectionEnglish({
  copy,
  images = [],
  id = "ingles",
}: SectionEnglishProps) {
  const hayImagen = images.length > 0;
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="relative bg-navy-body px-5 py-16 text-[color:var(--text-on-invert)] sm:px-6 sm:py-24"
    >
      <div className="mx-auto w-full max-w-5xl">
        <Reveal className="max-w-3xl">
          <span className="inline-flex items-center rounded-full bg-amber px-3 py-1 text-caption font-bold uppercase tracking-wide text-[color:var(--on-highlight)]">
            {copy.eyebrow}
          </span>
          <h2
            id={`${id}-titulo`}
            className="mt-4 font-heading text-h1 text-[color:var(--text-on-invert)] sm:text-display"
          >
            {copy.title}
          </h2>
        </Reveal>

        {/* Con imagen, los cuatro puntos bajan a una sola columna y la
            foto ocupa la otra mitad: cuatro tarjetas a dos columnas MÁS una
            imagen al lado dejaban las tarjetas en tiras de texto partido.
            Sin imagen, la rejilla de dos por dos de siempre. */}
        <div
          className={
            hayImagen
              ? "mt-9 grid grid-cols-1 items-start gap-7 sm:mt-12 lg:grid-cols-2 lg:gap-12"
              : "contents"
          }
        >
          {hayImagen ? (
            <Reveal className="relative lg:order-2">
              {/* Aquí el arco va abajo, no arriba: la sección de al lado ya
                  lleva la cabeza redondeada y repetir la misma forma dos
                  veces seguidas la convierte en un patrón, no en un gesto. */}
              <MediaSeccion
                images={images}
                alts={copy.imageAlts}
                navLabel={copy.imageNav}
                aspect="aspect-[3/2]"
                sizes="(min-width: 1024px) 34rem, 100vw"
                className="arco-inf bg-[color:var(--surface-on-invert)]"
              />
              {/* El mismo gesto de la portada, repetido una vez: producto
                  real asomando por el borde. */}
              <div
                className="vidrio legible flota absolute -left-2 -top-5 w-[12rem] p-3.5 sm:-left-5 sm:w-[13rem]"
                style={{ ["--giro" as string]: "-3.6deg", transform: "rotate(-3.6deg)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption font-bold uppercase tracking-[0.14em] text-[color:var(--teal-200)]">
                    {copy.sesion.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className="late size-1.5 shrink-0 rounded-full bg-[color:var(--text-on-invert-accent)]"
                  />
                </div>
                <p className="mt-2.5 text-body font-semibold leading-[1.3] text-[color:var(--text-on-invert)]">
                  {copy.sesion.title}
                </p>
                <p className="mt-1 text-caption tabular-nums text-[color:var(--text-on-glass-quiet)]">
                  {copy.sesion.note}
                </p>
              </div>
            </Reveal>
          ) : null}

        <RevealGroup
          as="ul"
          className={
            hayImagen
              ? "grid grid-cols-1 gap-4 lg:order-1"
              : "mt-9 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5"
          }
        >
          {copy.points.map((punto) => (
            <RevealItem
              as="li"
              key={punto.title}
              className="flex gap-3 rounded-xl bg-[color:var(--surface-on-invert)] p-5 ring-1 ring-[color:var(--hairline-on-invert-soft)]"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--text-on-invert-accent)]"
              >
                <Check
                  className="size-3.5 text-[color:var(--navy-900)]"
                  strokeWidth={3}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-body font-semibold leading-[1.35] text-[color:var(--text-on-invert)]">
                  {punto.title}
                </span>
                <span className="mt-1.5 block text-body leading-[1.55] text-[color:var(--text-on-invert-quiet)]">
                  {punto.body}
                </span>
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
        </div>
      </div>
    </section>
  );
}
