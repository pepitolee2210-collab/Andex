"use client";

import { useId } from "react";
import { KitBadge, KitCard } from "@/components/ui/kit";
import { Seal } from "@/components/seal";
import { PRICES } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { PlanType } from "@/lib/types";
import { cn, formatUsd } from "@/lib/utils";

/**
 * Las dos tarjetas de plan (§3.4.2 y §3.4.4), con la forma del sistema de
 * diseño: una debajo de otra, el importe como titular de la tarjeta y la
 * elegida en navy. Sin rejilla de dos columnas — en un teléfono de 360px
 * dos tarjetas lado a lado dejan el precio en dos líneas.
 *
 * ANCLAJE LEGÍTIMO, no patrón oscuro (§3.4.4):
 *   · El anual llega preseleccionado y va arriba.
 *   · El mensual está **visible, al mismo nivel jerárquico y a un clic**:
 *     misma anchura, mismo tamaño, mismo tipo de control, sin acordeones ni
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
 *
 * NUNCA se le pone sombra en línea a estas tarjetas: de noche el token vale
 * `none` y una sombra escrita a mano cancelaría el filete que la sustituye.
 */

export type PlanCardsProps = {
  selected: PlanType;
  onSelect: (plan: PlanType) => void;
  dict: Dictionary;
};

/** El importe, como titular de la tarjeta. */
function Price({ amount, period }: { amount: string; period: string }) {
  return (
    <span className="text-h3 font-extrabold tracking-[-0.02em]">
      {amount}
      <span className="font-bold">{period}</span>
    </span>
  );
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

  const isAnnual = selected === "annual";
  const isMonthly = selected === "monthly";

  /** El texto de apoyo se apaga un paso, y sobre navy se apaga hacia claro. */
  const support = (inverted: boolean) =>
    cn(
      "mt-2 text-label",
      inverted ? "text-[color:var(--text-on-invert-quiet)]" : "text-muted",
    );

  return (
    <fieldset>
      <legend className="sr-only">{t.chooseLabel}</legend>

      <div className="stack-sm">
        {/* ── Anual (preseleccionado) — aquí vive EL SELLO ─── */}
        <KitCard
          tone={isAnnual ? "invert" : undefined}
          className="relative cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus-ring)]"
        >
          <input
            id={annualId}
            type="radio"
            name={groupName}
            value="annual"
            checked={isAnnual}
            onChange={() => onSelect("annual")}
            className="sr-only"
          />
          {/* Capa de clic: cubre la tarjeta entera, target muy por encima de
              los 44px exigidos (§9). */}
          <label htmlFor={annualId} className="absolute inset-0 cursor-pointer rounded-lg">
            <span className="sr-only">{t.annual.select}</span>
          </label>

          <div className="flex items-baseline justify-between gap-3">
            <Price amount={annualPrice} period={t.annual.period} />
            <KitBadge tone="accent">{t.annual.badge}</KitBadge>
          </div>
          <p className={support(isAnnual)}>{t.annual.equivalent(annualMonthly)}</p>
          <p className={support(isAnnual)}>{t.annual.savings(savings)}</p>

          {/*
            EL SELLO — §2.9: única aparición decorativa de todo el producto.
            El texto que lo acompaña es la promesa vinculante de §3.4.4: si se
            publica, hay que cumplirla (riesgo R2, `stripe_price_id` fijado por
            suscripción y nunca migrado).
          */}
          <div
            role="group"
            aria-label={seal.ariaLabel}
            className="relative mt-5 flex flex-col items-center gap-3"
          >
            <Seal title={seal.title} />
            <p
              className={cn(
                "text-center text-caption",
                isAnnual ? "text-[color:var(--text-on-invert-quiet)]" : "text-muted",
              )}
            >
              {seal.body(annualPrice)}
            </p>
          </div>
        </KitCard>

        {/* ── Mensual ─────────────────────────────────────── */}
        <KitCard
          tone={isMonthly ? "invert" : undefined}
          className="relative cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus-ring)]"
        >
          <input
            id={monthlyId}
            type="radio"
            name={groupName}
            value="monthly"
            checked={isMonthly}
            onChange={() => onSelect("monthly")}
            className="sr-only"
          />
          <label htmlFor={monthlyId} className="absolute inset-0 cursor-pointer rounded-lg">
            <span className="sr-only">{t.monthly.select}</span>
          </label>

          <Price amount={monthlyPrice} period={t.monthly.period} />
          <p className={support(isMonthly)}>{t.monthly.pitch}</p>
        </KitCard>
      </div>
    </fieldset>
  );
}
