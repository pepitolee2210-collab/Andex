/**
 * S8 · PRECIOS — la sección COMERCIAL.
 *
 * Server Component a propósito: no hay un solo estado que guardar. El hover
 * es CSS (y el bloque global de `prefers-reduced-motion` de `globals.css` ya
 * le quita la duración), y la entrada la ponen las primitivas cliente
 * `Reveal*`, que sí usan `useReducedMotion()`. Lo único que viaja como
 * JavaScript propio son las dos cifras vivas de la tarjeta anual, aisladas
 * en `pricing-figures.tsx` (contador y rebote, con anime.js diferido).
 *
 * ── Anclaje legítimo, jamás patrón oscuro (§3.4.4)
 * El anual llega DESTACADO —badge ámbar "Más elegido", borde teal
 * permanente, halo suave, sombra alta, el precio contándose al entrar y CTA
 * primario— pero el mensual está en la misma rejilla, con el mismo tamaño,
 * el mismo padding y su propio botón visible: elegirlo cuesta exactamente un
 * clic, igual que el anual. §3.4.4 lo exige con todas las letras. Y aparece
 * PRIMERO en el DOM, así que también es el primero en el orden de lectura y
 * de tabulación.
 *
 * En móvil las dos tarjetas se apilan y el anual perdía su ventaja: quedaba
 * como un segundo bloque idéntico más abajo. El halo (`ring-teal/25`, un
 * teal de SUPERFICIE sin texto encima) más la sombra alta lo devuelven a
 * primer plano SIN encogerlo al mensual ni esconderlo — jerarquía por
 * énfasis, no por castigo al otro.
 *
 * Lo que NO hay, porque §3.4.1 y §3.4.6 lo prohíben: contador, cupos, precio
 * tachado que nunca existió, casilla premarcada, descuento que expira. El
 * "Ahorras $28 al año" del diccionario es una resta verdadera (14×12 − 140),
 * no una rebaja inventada.
 *
 * ── El sello NO se usa aquí (§2.9)
 * `components/seal.tsx` aparece UNA sola vez en todo el producto: la tarjeta
 * anual del paywall. Si se repitiera en la landing dejaría de significar
 * "compromiso formal" y sería decoración. La promesa de tarifa congelada sí
 * se cuenta, con un tratamiento propio y deliberadamente más discreto: caja
 * `bg-amber-soft` con filete ámbar a la izquierda. Sin círculo, sin rotación
 * y sin borde punteado — nada que se confunda con el sello.
 *
 * ── Contraste (§2.1.1)
 * Fondo `bg-teal-soft` (superficie suave, distinta del crema de la sección
 * anterior: eso es el ritmo de la página). Encima solo `text-ink` y
 * `text-muted`, que resuelven bien en los dos temas. El ámbar puro solo
 * aparece como fondo del badge con `text-on-highlight` (navy, 8.2:1) y como
 * filete sin texto encima — los dos usos permitidos.
 *
 * ── Precios
 * Llegan ya compuestos por el diccionario desde el page:
 *   price:      t.pricing.monthly.price(formatUsd(PRICES.monthly.usd))
 *   equivalent: t.pricing.annual.equivalent(formatUsd(PRICES.annual.monthlyEquivalentUsd))
 *   savings:    t.pricing.annual.savings(formatUsd(PRICES.annual.savingsUsd))
 * El componente nunca formatea moneda ni conoce `PRICES`: recibe cadenas
 * finales y las pinta. Así el copy sigue saliendo solo de `lib/i18n`.
 */

import { Check, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

import { AnimatedPrice, SavingsBadge } from "./pricing-figures";

export type PricingPlanCopy = {
  name: string;
  /** Cadena completa, p. ej. "$14 / mes". */
  price: string;
  tagline: string;
  features: readonly string[];
  cta: string;
};

export type PricingAnnualCopy = PricingPlanCopy & {
  badge: string;
  /** "Equivale a $11.60 al mes" */
  equivalent: string;
  /** "Ahorras $28 al año" */
  savings: string;
  sealTitle: string;
  sealBody: string;
};

export type PricingCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  monthly: PricingPlanCopy;
  annual: PricingAnnualCopy;
  trust: readonly string[];
  note: string;
};

export type SectionPricingProps = {
  copy: PricingCopy;
  /** Destino del CTA mensual (p. ej. `ROUTES.registro`). */
  monthlyHref: string;
  /** Destino del CTA anual. */
  annualHref: string;
  /** `id` del <section>: ancla del nav y clave de `landing_section_viewed`. */
  id?: string;
};

const CARD_BASE =
  "flex h-full flex-col rounded-xl bg-surface p-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-8";

function FeatureList({ features }: { features: readonly string[] }) {
  return (
    <ul className="mt-6 flex flex-col gap-2.5">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2.5 text-body text-ink">
          <Check
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-teal-deep"
          />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export function SectionPricing({
  copy,
  monthlyHref,
  annualHref,
  id = "precios",
}: SectionPricingProps) {
  const titleId = `${id}-titulo`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="bg-teal-soft px-5 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <Reveal
          as="p"
          className="text-label font-semibold uppercase tracking-widest text-teal-deep"
        >
          {copy.eyebrow}
        </Reveal>

        <Reveal delay={0.06}>
          <h2 id={titleId} className="mt-3 max-w-3xl font-heading text-h1 text-ink">
            {copy.title}
          </h2>
        </Reveal>

        <Reveal as="p" delay={0.12} className="mt-3 max-w-2xl text-body text-muted sm:text-body-lg">
          {copy.subtitle}
        </Reveal>

        <RevealGroup
          stagger={0.1}
          className="mt-9 grid grid-cols-1 items-stretch gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5"
        >
          {/* ── MENSUAL — primero en DOM, tabulación y lectura ────── */}
          <RevealItem className="h-full">
            <article className={`${CARD_BASE} border border-line shadow-sm`}>
              <h3 className="font-heading text-h3 text-ink">
                {copy.monthly.name}
              </h3>
              <p className="mt-3 font-heading text-h1 text-ink">
                {copy.monthly.price}
              </p>
              <p className="mt-2 text-body text-muted">{copy.monthly.tagline}</p>

              <FeatureList features={copy.monthly.features} />

              {/* `mt-auto` pega los dos botones al mismo borde inferior aunque
                  las listas de beneficios midan distinto: misma jerarquía
                  también en lo visual (§3.4.4). */}
              <div className="mt-auto pt-8">
                <Button href={monthlyHref} variant="secondary" size="lg" fullWidth>
                  {copy.monthly.cta}
                </Button>
              </div>
            </article>
          </RevealItem>

          {/* ── ANUAL — destacado, no escondido el otro ───────────── */}
          <RevealItem className="h-full">
            <article
              className={`${CARD_BASE} border-2 border-teal-deep shadow-lg ring-4 ring-teal/25`}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h3 className="font-heading text-h3 text-ink">
                  {copy.annual.name}
                </h3>
                <Badge variant="amber">{copy.annual.badge}</Badge>
              </div>

              <p className="mt-3 font-heading text-h1 text-ink">
                <AnimatedPrice value={copy.annual.price} />
              </p>
              <p className="mt-1 text-body text-muted">{copy.annual.equivalent}</p>
              <p className="mt-3">
                <SavingsBadge>{copy.annual.savings}</SavingsBadge>
              </p>
              <p className="mt-3 text-body text-muted">{copy.annual.tagline}</p>

              <FeatureList features={copy.annual.features} />

              {/* Tarifa congelada — tratamiento propio y discreto. El sello
                  de §2.9 se queda en el paywall. */}
              <div className="mt-6 rounded-lg border-l-4 border-amber bg-amber-soft p-4">
                <p className="flex items-center gap-2 text-label font-semibold uppercase tracking-wide text-ink">
                  <ShieldCheck
                    aria-hidden="true"
                    className="size-4.5 shrink-0 text-amber-deep"
                  />
                  {copy.annual.sealTitle}
                </p>
                <p className="mt-1.5 text-body text-ink">{copy.annual.sealBody}</p>
              </div>

              <div className="mt-auto pt-8">
                <Button href={annualHref} size="lg" fullWidth>
                  {copy.annual.cta}
                </Button>
              </div>
            </article>
          </RevealItem>
        </RevealGroup>

        {/* Las tres líneas de confianza + la nota legal de renovación. */}
        <Reveal delay={0.08} className="mt-10">
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {copy.trust.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-body text-ink">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-teal-deep"
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-3xl text-body text-muted">{copy.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
