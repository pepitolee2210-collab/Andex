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

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import type { LandingDict } from "@/lib/i18n/dictionaries/landing";

export type SectionVisionProps = { copy: LandingDict["vision"] };

export function SectionVision({ copy }: SectionVisionProps) {
  return (
    <section
      id="solucion"
      aria-labelledby="vision-titulo"
      className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24"
    >
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
          {copy.eyebrow}
        </p>
        <h2
          id="vision-titulo"
          className="mt-3 font-heading text-h1 text-ink sm:text-display"
        >
          {copy.title}
        </h2>
        <p className="mt-4 text-body text-muted sm:text-body-lg">{copy.body}</p>
      </Reveal>

      {/* Las cifras. Sin tarjeta ni sombra: son un dato, no un producto. */}
      {/* Escalonadas: entran una detrás de otra, no las cuatro de golpe.
          En móvil van a dos columnas con más aire vertical que horizontal,
          porque el matiz de debajo necesita dos líneas. */}
      <RevealGroup
        as="div"
        className="mt-11 grid grid-cols-2 gap-x-5 gap-y-9 sm:mt-16 sm:gap-x-6 lg:grid-cols-4"
      >
        {copy.stats.map((stat) => (
          <RevealItem key={stat.label} className="border-t border-line pt-4 sm:pt-5">
            {/* `p` y no `dd`/`dt`: al escalonar las cifras desapareció el
                `<dl>` que las envolvía, y una definición suelta fuera de su
                lista es HTML inválido. La relación cifra–etiqueta la da el
                orden y el tamaño, que es como se lee de todas formas. */}
            <p className="font-heading text-h1 text-ink sm:text-display lg:text-display-lg">
              {stat.value}
            </p>
            <p className="mt-1 text-body font-semibold text-ink">{stat.label}</p>
            {/* El matiz va con la cifra, no en una nota al pie: un «7» sin
                el «tres abiertos» sería verdad a medias. */}
            <p className="mt-1.5 text-caption text-muted">{stat.detail}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
