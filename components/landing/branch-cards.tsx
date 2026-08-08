"use client";

/**
 * Las DOS TARJETAS de bifurcación del hero + el CTA que aparece al elegir
 * (wireframe §3.1.1). Es la pantalla más importante de la landing: aquí se
 * mide `Selección de rama en landing ≥ 40%` (§0.6).
 *
 * Son ENLACES, no botones: sin JavaScript navegan a `/?ctx=…#tu-caso` y el
 * servidor reordena la página igual. Con JavaScript se intercepta el clic y
 * la reordenación ocurre en vivo, sin recarga (§3.1.1: "la página se
 * reordena en vivo"). Se respetan los modificadores del navegador
 * (ctrl/cmd/shift/alt y clic central) para no romper "abrir en otra pestaña".
 *
 * Orden de las tarjetas: "ya estoy aquí" primero y "estoy fuera" después,
 * exactamente como el wireframe. La sugerencia por IP NO altera este orden
 * ni preselecciona ninguna (§3.2 regla UX 7); solo viaja en analítica.
 *
 * La marca de cada tarjeta es el ORIGEN de su camino (ver `branch-mark`),
 * no un emoji: 🇺🇸 no se renderiza en Windows y caía a las letras "US"
 * mientras ✈️ salía a color, así que las dos tarjetas ni se parecían.
 *
 * Todo el copy llega por props: importar `@/lib/i18n` desde un componente
 * cliente metería los nueve diccionarios en ES y EN en el bundle.
 */

import type { MouseEvent } from "react";
import { Check } from "lucide-react";
import type { LocationContext } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBranch } from "./branch-context";
import { BranchMark } from "./branch-mark";
import { CtaLink } from "./cta-link";

/** Orden exacto del wireframe §3.1.1. */
const CARD_ORDER: readonly LocationContext[] = ["in_us", "pre_arrival"] as const;

export type BranchCardCopy = {
  emoji: string;
  title: string;
  description: string;
};

export type BranchCardsProps = {
  cards: Record<LocationContext, BranchCardCopy>;
  /** `/?ctx=<rama>#tu-caso` — el camino sin JavaScript. */
  hrefs: Record<LocationContext, string>;
  /** id del encabezado "¿Dónde estás ahora?" que etiqueta el grupo. */
  labelledBy: string;
  ctaLabel: string;
  /** Pista para lectores de pantalla sobre a dónde lleva el CTA. */
  ctaHint: string;
  ctaHref: string;
};

export function BranchCards({
  cards,
  hrefs,
  labelledBy,
  ctaLabel,
  ctaHint,
  ctaHref,
}: BranchCardsProps) {
  const { branch, select } = useBranch();

  function handleClick(event: MouseEvent<HTMLAnchorElement>, ctx: LocationContext) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return; // que el navegador haga lo suyo (nueva pestaña, etc.)
    }
    event.preventDefault();
    select(ctx);
  }

  return (
    <>
      <div
        role="group"
        aria-labelledby={labelledBy}
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        {CARD_ORDER.map((ctx) => {
          const card = cards[ctx];
          const active = branch === ctx;
          return (
            <a
              key={ctx}
              href={hrefs[ctx]}
              aria-current={active ? "true" : undefined}
              onClick={(event) => handleClick(event, ctx)}
              className={cn(
                "group relative flex min-h-11 items-start gap-4 rounded-xl border-2 p-5 sm:p-6",
                "transition-[background-color,border-color,box-shadow,transform] duration-200",
                active
                  ? "border-teal-deep bg-teal-soft shadow-lg"
                  : "border-line bg-surface shadow-sm hover:-translate-y-0.5 hover:border-teal-deep hover:shadow-lg",
              )}
            >
              <BranchMark
                context={ctx}
                active={active}
                className="mt-0.5 size-11"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-h3 text-ink">
                  {card.title}
                </span>
                <span className="mt-1 block text-body text-muted">
                  {card.description}
                </span>
              </span>
              <Check
                aria-hidden="true"
                className={cn(
                  "mt-1 size-5 shrink-0 text-teal-deep transition-opacity duration-200",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            </a>
          );
        })}
      </div>

      {/* El CTA aparece al elegir (§3.1.1). aria-live avisa a quien no ve
          el cambio; el desplazamiento que provoca es consecuencia directa
          de una acción del usuario, así que no cuenta como CLS. */}
      <div aria-live="polite" className="mt-5">
        {branch ? (
          <>
            <CtaLink
              position="hero"
              href={ctaHref}
              size="lg"
              describedBy="hero-cta-hint"
            >
              {ctaLabel}
            </CtaLink>
            <span id="hero-cta-hint" className="sr-only">
              {ctaHint}
            </span>
          </>
        ) : null}
      </div>
    </>
  );
}
