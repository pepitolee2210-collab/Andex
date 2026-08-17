"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { KitBadge, KitCard } from "@/components/ui/kit";
import { Seal } from "@/components/seal";
import { PRICES } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { PlanType } from "@/lib/types";
import { cn, formatUsd } from "@/lib/utils";

/**
 * Las dos tarjetas de plan (§3.4.2 y §3.4.4).
 *
 * ── EL ORDEN: MENSUAL PRIMERO ──────────────────────────────────────────
 *
 * Antes el anual iba arriba y el mensual quedaba debajo como una caja con
 * una sola línea: se leía como la opción que sobra. §3.4.4 exige lo
 * contrario —"la opción mensual está visible, al mismo nivel jerárquico y
 * a un clic"— y ponerla primero es la forma más literal de cumplirlo: lo
 * barato se lee antes que lo caro, y el anual convence por la resta que
 * enseña, no por llegar primero.
 *
 * El anual sigue PRESELECCIONADO, que es lo que pide §3.4.4 al pie de la
 * letra. Eso es anclaje legítimo mientras la otra opción esté a un clic, y
 * ahora además está antes.
 *
 * ── LA MISMA ANATOMÍA EN LAS DOS ───────────────────────────────────────
 *
 * Las dos tarjetas traen las mismas cuatro filas: nombre, importe, filete y
 * la misma aritmética vista desde su lado —$14/mes son $168 al año; $140/año
 * equivalen a $11.60 al mes—. Ninguna de las dos cifras está inventada: son
 * la misma multiplicación mirada desde arriba y desde abajo, y de ahí sale
 * el "Ahorras $28" sin necesidad de un precio tachado que nunca existió
 * (§3.4.6). Antes sólo la anual llevaba equivalencia, así que la comparación
 * la tenía que hacer el usuario de cabeza.
 *
 * ── EL BADGE DICE "RECOMENDADO", NO "MÁS ELEGIDO" ──────────────────────
 *
 * §3.4.2 pide "Más elegido". Se aparta a propósito, y ésta es la razón: es
 * una afirmación sobre lo que ha hecho otra gente, y todavía no la ha hecho
 * nadie —el producto está en piloto y no ha elegido plan ni una familia—.
 * Es exactamente la prueba social fabricada por la que la sección de reseñas
 * de la landing sale vacía, y desde 2024 la FTC la sanciona. "Recomendado"
 * dice lo mismo en primera persona y es verdad: lo recomendamos nosotros.
 *
 * ── EL SELLO (§2.9) ────────────────────────────────────────────────────
 *
 * Sigue siendo su única aparición en todo el producto, dentro de la tarjeta
 * anual. Lo que cambia es que ya no ocupa media tarjeta él solo: va en fila
 * con la promesa que certifica, que es lo que hay que leer.
 *
 * ── Accesibilidad ──────────────────────────────────────────────────────
 *
 * Grupo de radios REAL. El `<input type="radio">` va oculto visualmente pero
 * sigue recibiendo foco y teclado (flechas entre opciones, gratis por ser un
 * grupo nativo); un `<label>` en capa cubre la tarjeta para que el clic
 * funcione en cualquier punto, y el anillo de foco se pinta con
 * `has-[:focus-visible]`. Nuevo respecto a la versión anterior: hay un
 * indicador VISIBLE de selección. Antes lo único que distinguía a la
 * elegida era el fondo navy, y "es un fondo bonito" y "está marcada" no se
 * distinguen mirando.
 *
 * Nada de meter el sello dentro de un `<button>` o de un `<label>`: es
 * contenido de flujo y ahí sería HTML inválido.
 *
 * NUNCA se le pone sombra en línea a estas tarjetas: de noche el token vale
 * `none` y una sombra escrita a mano cancelaría el filete que la sustituye.
 */

export type PlanCardsProps = {
  selected: PlanType;
  onSelect: (plan: PlanType) => void;
  dict: Dictionary;
};

/**
 * Una opción: la tarjeta entera, con su radio, su indicador y su cabecera.
 *
 * Existe para que las dos tarjetas no puedan divergir. La versión anterior
 * repetía a mano el input, la capa de clic y el anillo de foco en cada una,
 * y por eso la mensual acabó con la mitad de la anatomía de la anual.
 */
function PlanOption({
  id,
  group,
  value,
  checked,
  onSelect,
  name,
  amount,
  period,
  equivalence,
  pitch,
  selectLabel,
  selectedAria,
  badge,
  recommended = false,
  children,
}: {
  id: string;
  group: string;
  value: PlanType;
  checked: boolean;
  onSelect: (plan: PlanType) => void;
  /** "Mensual" / "Anual". */
  name: string;
  /** "$14" — la cifra sola, sin periodo. */
  amount: string;
  /** "/mes" — pegado a la cifra, un paso más bajo. */
  period: string;
  /** La misma multiplicación desde el otro lado. */
  equivalence: string;
  /** Qué significa elegirlo, en una frase. §3.4.4 la fija para el mensual. */
  pitch?: string;
  selectLabel: string;
  selectedAria: string;
  badge?: string;
  recommended?: boolean;
  /** El sello, sólo en la anual. */
  children?: React.ReactNode;
}) {
  return (
    <KitCard
      /* Elegida → navy. Sin elegir pero recomendada → el filete teal de
         `card-lift`, que la distingue sin gritar. Sin elegir y normal →
         superficie de tarjeta a secas. */
      tone={checked ? "invert" : recommended ? "lift" : undefined}
      className={cn(
        "relative cursor-pointer transition-[transform,box-shadow] duration-200",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2",
        "has-[:focus-visible]:outline-offset-2",
        "has-[:focus-visible]:outline-[color:var(--focus-ring)]",
      )}
    >
      <input
        id={id}
        type="radio"
        name={group}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      {/* Capa de clic: cubre la tarjeta entera, target muy por encima de los
          44px exigidos (§9). */}
      <label htmlFor={id} className="absolute inset-0 cursor-pointer rounded-lg">
        <span className="sr-only">{selectLabel}</span>
      </label>

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* El indicador. Es lo que convierte dos tarjetas bonitas en una
              elección: se ve cuál está marcada sin tener que deducirlo del
              color de fondo. */}
          <span
            aria-hidden="true"
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
              checked
                ? "border-[color:var(--text-on-invert)] bg-[color:var(--text-on-invert)]"
                : "border-[color:var(--line)]",
            )}
          >
            {checked ? (
              <Check
                className="size-3.5 text-[color:var(--surface-invert)]"
                strokeWidth={3}
              />
            ) : null}
          </span>
          <span className="truncate text-label font-bold uppercase tracking-widest">
            {name}
          </span>
          {checked ? <span className="sr-only">{selectedAria}</span> : null}
        </div>

        {badge ? (
          <KitBadge tone="accent" className="shrink-0">
            {badge}
          </KitBadge>
        ) : null}
      </div>

      {/* El importe. `tabular-nums` para que $14 y $140 caigan en la misma
          rejilla vertical: dos precios que bailan se comparan peor. */}
      <p className="mt-3 font-heading text-display font-extrabold tabular-nums tracking-[-0.02em]">
        {amount}
        <span className="text-h3 font-bold">{period}</span>
      </p>

      {/* El filete separa el precio de lo que significa. Es la única línea
          de la tarjeta y por eso se lee. */}
      <hr
        className={cn(
          "mt-4 border-0 border-t",
          checked ? "border-[color:var(--text-on-invert-quiet)]/30" : "border-line",
        )}
      />

      <p
        className={cn(
          "mt-3 text-body",
          checked ? "text-[color:var(--text-on-invert-quiet)]" : "text-muted",
        )}
      >
        {equivalence}
      </p>

      {pitch ? (
        <p
          className={cn(
            "mt-1.5 text-body",
            checked ? "text-[color:var(--text-on-invert-quiet)]" : "text-muted",
          )}
        >
          {pitch}
        </p>
      ) : null}

      {children}
    </KitCard>
  );
}

export function PlanCards({ selected, onSelect, dict }: PlanCardsProps) {
  const t = dict.paywall.plans;
  const seal = dict.paywall.seal;
  const groupName = useId();

  const monthlyPrice = formatUsd(PRICES.monthly.usd);
  const annualPrice = formatUsd(PRICES.annual.usd);
  const annualMonthly = formatUsd(PRICES.annual.monthlyEquivalentUsd);
  const savings = formatUsd(PRICES.annual.savingsUsd);
  /* La otra mitad de la resta. No es un precio: es lo que cuesta el plan
     mensual sostenido doce meses, que es con lo que se compara el anual. */
  const monthlyYearly = formatUsd(PRICES.monthly.usd * 12);

  const isAnnual = selected === "annual";

  return (
    <fieldset>
      <legend className="sr-only">{t.chooseLabel}</legend>

      <div className="stack-sm">
        {/* ── Mensual — primero en lectura y en tabulación (§3.4.4) ── */}
        <PlanOption
          id={`${groupName}-monthly`}
          group={groupName}
          value="monthly"
          checked={!isAnnual}
          onSelect={onSelect}
          name={t.monthly.name}
          amount={monthlyPrice}
          period={t.monthly.period}
          equivalence={t.monthly.yearly(monthlyYearly)}
          pitch={t.monthly.pitch}
          selectLabel={t.monthly.select}
          selectedAria={t.selectedAria}
        />

        {/* ── Anual — recomendado y preseleccionado. Aquí vive EL SELLO ── */}
        <PlanOption
          id={`${groupName}-annual`}
          group={groupName}
          value="annual"
          checked={isAnnual}
          onSelect={onSelect}
          name={t.annual.name}
          amount={annualPrice}
          period={t.annual.period}
          equivalence={t.annual.equivalent(annualMonthly)}
          selectLabel={t.annual.select}
          selectedAria={t.selectedAria}
          badge={t.annual.badge}
          recommended
        >
          {/* El ahorro, como dato y no como grito: es la resta de las dos
              cifras que la tarjeta ya enseña ($168 − $140), así que quien
              quiera puede comprobarla en la pantalla. */}
          <p className="mt-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1",
                "text-caption font-semibold tabular-nums",
                isAnnual
                  ? "bg-[color:var(--text-on-invert)]/12 text-[color:var(--text-on-invert)]"
                  : "bg-amber-soft text-ink",
              )}
            >
              {t.annual.savings(savings)}
            </span>
          </p>

          {/*
            EL SELLO — §2.9: única aparición decorativa de todo el producto.
            En fila con su promesa, no encima: lo que obliga es la frase, el
            sello sólo dice de qué registro es. El texto que lo acompaña es la
            promesa vinculante de §3.4.4: si se publica, hay que cumplirla
            (riesgo R2, `stripe_price_id` fijado por suscripción y nunca
            migrado).
          */}
          <div
            role="group"
            aria-label={seal.ariaLabel}
            className="relative mt-5 flex items-center gap-4"
          >
            <Seal title={seal.title} compact className="shrink-0" />
            <p
              className={cn(
                "min-w-0 text-body",
                isAnnual ? "text-[color:var(--text-on-invert-quiet)]" : "text-muted",
              )}
            >
              {seal.body(annualPrice)}
            </p>
          </div>
        </PlanOption>
      </div>
    </fieldset>
  );
}
