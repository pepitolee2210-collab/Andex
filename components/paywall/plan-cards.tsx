"use client";

import { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Seal } from "@/components/seal";
import { PRICES } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { PlanType } from "@/lib/types";
import { cn, formatUsd } from "@/lib/utils";

/**
 * Las dos tarjetas de plan del paywall (§3.4.2 y §3.4.4).
 *
 * ANCLAJE LEGÍTIMO, no patrón oscuro (§3.4.4):
 *   · El anual llega preseleccionado.
 *   · El mensual está **visible, al mismo nivel jerárquico y a un clic**:
 *     misma rejilla, mismo tamaño, mismo tipo de control, sin acordeones ni
 *     pasos extra. §3.4.4 lo dice con todas las letras: "No se admite ningún
 *     patrón donde la opción cara esté preseleccionada y la barata escondida
 *     o requiera pasos extra".
 *   · No hay precio tachado que nunca existió, ni contador, ni cupos.
 *     "Ahorras $28 al año" es una resta verdadera (14×12 − 140), no un
 *     descuento inventado que caduca.
 *
 * EL SELLO (§2.9): la tarjeta del plan anual es su ÚNICA aparición en todo el
 * producto. Si aparece en un badge, en la confirmación o en el panel, deja de
 * significar "compromiso formal" y se convierte en decoración.
 *
 * Accesibilidad: grupo de radios REAL. El `<input type="radio">` va oculto
 * visualmente pero sigue recibiendo foco y teclado (flechas entre opciones,
 * gratis por ser un grupo nativo); un `<label>` en capa cubre la tarjeta para
 * que el clic funcione en cualquier punto, y el anillo de foco se pinta con
 * `has-[:focus-visible]`. Nada de meter el sello dentro de un `<button>` o de
 * un `<label>`: es contenido de flujo y ahí sería HTML inválido.
 */

export type PlanCardsProps = {
  selected: PlanType;
  onSelect: (plan: PlanType) => void;
  dict: Dictionary;
};

const CARD_BASE = cn(
  "relative flex flex-col gap-3 rounded-lg border-2 p-5",
  "transition-colors duration-150",
  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-deep has-[:focus-visible]:ring-offset-2",
);

function cardTone(isSelected: boolean): string {
  return isSelected
    ? "border-teal-deep bg-teal-soft"
    : "border-line bg-surface hover:border-muted";
}

export function PlanCards({ selected, onSelect, dict }: PlanCardsProps) {
  const t = dict.paywall.plans;
  const seal = dict.paywall.seal;
  const groupName = useId();
  const monthlyId = `${groupName}-monthly`;
  const annualId = `${groupName}-annual`;

  const monthlyPrice = formatUsd(PRICES.monthly.usd);
  const annualPrice = formatUsd(PRICES.annual.usd);
  const annualMonthly = formatUsd(PRICES.annual.monthlyEquivalentUsd);
  const savings = formatUsd(PRICES.annual.savingsUsd);

  return (
    <fieldset>
      <legend className="sr-only">{t.chooseLabel}</legend>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* ── Mensual ─────────────────────────────────────── */}
        <div className={cn(CARD_BASE, cardTone(selected === "monthly"))}>
          <input
            id={monthlyId}
            type="radio"
            name={groupName}
            value="monthly"
            checked={selected === "monthly"}
            onChange={() => onSelect("monthly")}
            className="sr-only"
          />
          {/* Capa de clic: cubre la tarjeta entera, target muy por encima de
              los 44px exigidos (§9). */}
          <label htmlFor={monthlyId} className="absolute inset-0 cursor-pointer rounded-lg">
            <span className="sr-only">{t.monthly.select}</span>
          </label>

          <p className="font-heading text-h3 text-ink">{t.monthly.name}</p>
          <p className="flex items-baseline gap-1">
            <span className="font-heading text-h1 text-ink">{monthlyPrice}</span>
            <span className="text-body text-muted">{t.monthly.period}</span>
          </p>
          <p className="text-body text-muted">{t.monthly.pitch}</p>
        </div>

        {/* ── Anual (preseleccionado) — aquí vive EL SELLO ─── */}
        <div className={cn(CARD_BASE, cardTone(selected === "annual"))}>
          <input
            id={annualId}
            type="radio"
            name={groupName}
            value="annual"
            checked={selected === "annual"}
            onChange={() => onSelect("annual")}
            className="sr-only"
          />
          <label htmlFor={annualId} className="absolute inset-0 cursor-pointer rounded-lg">
            <span className="sr-only">{t.annual.select}</span>
          </label>

          <p>
            <Badge variant="amber">{t.annual.badge}</Badge>
          </p>
          <p className="font-heading text-h3 text-ink">{t.annual.name}</p>
          <p className="flex items-baseline gap-1">
            <span className="font-heading text-h1 text-ink">{annualPrice}</span>
            <span className="text-body text-muted">{t.annual.period}</span>
          </p>
          <p className="text-body text-muted">{t.annual.equivalent(annualMonthly)}</p>
          <p>
            <Badge variant="teal">{t.annual.savings(savings)}</Badge>
          </p>

          {/*
            EL SELLO — §2.9: única aparición decorativa de todo el producto.
            El texto que lo acompaña es la promesa vinculante de §3.4.4: si se
            publica, hay que cumplirla (riesgo R2, `stripe_price_id` fijado por
            suscripción y nunca migrado).
          */}
          <div
            role="group"
            aria-label={seal.ariaLabel}
            className="mt-2 flex flex-col items-center gap-3"
          >
            <Seal title={seal.title} />
            <p className="text-center text-caption text-muted">
              {seal.body(annualPrice)}
            </p>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
