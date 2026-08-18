import { Building2, Car, FileCheck2, GraduationCap, ShieldCheck } from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import type { LandingImage } from "@/lib/landing-images";
import { MediaSeccion } from "./media-seccion";

/**
 * S3 · RESPALDO INSTITUCIONAL Y SEGURIDAD.
 *
 * Va justo debajo de la portada porque la pregunta que deja la portada es
 * «¿y quién me dice que esto es serio?». Cinco hechos comprobables, cada uno
 * con lo que hay detrás en una línea: una insignia sin explicación es un
 * logotipo, y un logotipo suelto no responde nada.
 *
 * ── La insignia que se cambió, y por qué ──
 *
 * El documento maestro pide «Cifrado Bancario AES-256». «Nivel bancario» es
 * exactamente la fórmula que este público oyó de quien lo estafó, y la regla
 * del proyecto es explícita: nunca se promete de más en seguridad, y el
 * límite viaja en la misma frase que la promesa. AES-256 es verdad —la
 * bóveda cifra con AES-GCM en el navegador—, así que se conserva la parte
 * comprobable y se sustituye el adjetivo por el dato que de verdad la hace
 * fuerte: que los archivos no salen del teléfono.
 *
 * Server Component: no hay un solo estado aquí. La entrada la ponen las
 * primitivas cliente `Reveal*`, que son las que ya usa el resto de la página.
 */

export type TrustBadge = {
  label: string;
  note: string;
};

export type SectionTrustBarCopy = {
  title: string;
  badges: readonly TrustBadge[];
  /** Qué se ve en cada imagen, en orden. Sale de `lib/i18n`. */
  imageAlts: readonly string[];
  /** «Foto {n} de {total}» para los puntos del carrusel. */
  imageNav: string;
};

export type SectionTrustBarProps = {
  copy: SectionTrustBarCopy;
  /** Las que existan en disco. Ver `lib/landing-images.ts`. */
  images?: readonly LandingImage[];
  id?: string;
};

/**
 * Un icono por insignia, en el orden del documento. Se emparejan por
 * posición y no por texto: el copy vive en `lib/i18n` y puede cambiar de
 * idioma, pero el orden es el mismo en los dos.
 */
const ICONOS = [ShieldCheck, Building2, GraduationCap, FileCheck2, Car] as const;

export function SectionTrustBar({
  copy,
  images = [],
  id = "respaldo",
}: SectionTrustBarProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="border-y border-line bg-surface px-5 py-14 sm:px-6 sm:py-20"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* La banda de comunidad. Panorámica y baja a propósito: aquí no es
            el asunto, es el terreno sobre el que se apoya la frase que viene
            debajo. A la altura de una fotografía normal se comería la
            sección entera y las cinco insignias caerían fuera de pantalla. */}
        {images.length > 0 ? (
          <Reveal className="mb-10 block sm:mb-14">
            <MediaSeccion
              images={images}
              alts={copy.imageAlts}
              navLabel={copy.imageNav}
              aspect="aspect-[3/1]"
              sizes="(min-width: 1280px) 72rem, 100vw"
              objectPosition="center 45%"
              className="overflow-hidden rounded-xl bg-surface-alt"
            />
          </Reveal>
        ) : null}

        <Reveal className="mx-auto max-w-3xl text-center">
          <h2
            id={`${id}-titulo`}
            className="font-heading text-h2 text-ink sm:text-h1"
          >
            {copy.title}
          </h2>
        </Reveal>

        <RevealGroup
          as="ul"
          className="mt-9 grid grid-cols-1 gap-x-6 gap-y-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-x-5"
        >
          {copy.badges.map((badge, i) => {
            const Icono = ICONOS[i] ?? ShieldCheck;
            return (
              <RevealItem
                as="li"
                key={badge.label}
                /* En móvil van en fila —icono a la izquierda, texto a la
                   derecha— porque cinco bloques centrados uno bajo otro son
                   cinco pantallas de scroll. Desde `lg` se apilan, que es
                   donde la rejilla de cinco columnas los deja estrechos. */
                className="flex items-start gap-3 lg:flex-col lg:items-center lg:gap-2.5 lg:text-center"
              >
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-soft text-teal-deep"
                >
                  <Icono className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-body font-semibold leading-[1.35] text-ink">
                    {badge.label}
                  </span>
                  <span className="mt-1 block text-caption leading-[1.5] text-muted">
                    {badge.note}
                  </span>
                </span>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
