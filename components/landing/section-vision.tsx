/**
 * LANDING · QUÉ ES ANDEX, Y LAS CIFRAS
 *
 * ── Por qué estas cuatro cifras y no otras ──
 *
 * La maqueta pedía «+1K inmigrantes» y «+4 estrellas». No existen: el
 * producto está en piloto y todavía no ha salido. Inventarlas con este
 * público no es marketing flojo, es el mismo patrón de quien les cobró
 * cientos de dólares por trámites gratis — y desde 2024 las métricas
 * infladas son además sancionables por la FTC.
 *
 * Las cuatro que hay se pueden comprobar abriendo la aplicación: siete
 * módulos, nueve temarios, cero documentos en servidor y cero dólares para
 * escanear. Dos de ellas —el cero y el cero— dicen algo más fuerte que
 * cualquier número inflado, porque son promesas verificables.
 *
 * Cada cifra lleva su matiz debajo. Un «7» solo no dice nada; «7 módulos ·
 * tres abiertos, cuatro durante el piloto» dice la verdad entera, incluida
 * la parte que aún no está.
 */

import type { LandingDict } from "@/lib/i18n/dictionaries/landing";

export type SectionVisionProps = { copy: LandingDict["vision"] };

export function SectionVision({ copy }: SectionVisionProps) {
  return (
    <section
      aria-labelledby="vision-titulo"
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
          {copy.eyebrow}
        </p>
        <h2
          id="vision-titulo"
          className="mt-3 font-heading text-h1 text-ink sm:text-display"
        >
          {copy.title}
        </h2>
        <p className="mt-4 text-body-lg text-muted">{copy.body}</p>
      </div>

      {/* Las cifras. Sin tarjeta ni sombra: son un dato, no un producto. */}
      <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:mt-16 lg:grid-cols-4">
        {copy.stats.map((stat) => (
          <div key={stat.label} className="border-t border-line pt-5">
            <dd className="font-heading text-display text-ink sm:text-display-lg">
              {stat.value}
            </dd>
            <dt className="mt-1 text-body font-semibold text-ink">{stat.label}</dt>
            {/* El matiz va con la cifra, no en una nota al pie: un «7» sin
                el «tres abiertos» sería verdad a medias. */}
            <p className="mt-1.5 text-caption text-muted">{stat.detail}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
