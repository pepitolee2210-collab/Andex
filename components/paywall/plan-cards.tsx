"use client";

import { useId } from "react";
import { Check } from "lucide-react";
import { KitCard } from "@/components/ui/kit";
import { PRICES } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { PlanType } from "@/lib/types";
import { cn, formatUsd } from "@/lib/utils";

/**
 * Las dos tarjetas de plan (§3.4.2 y §3.4.4), con la gramática de las hojas
 * de suscripción de Apple.
 *
 * ── QUÉ SE TOMÓ PRESTADO, Y POR QUÉ ────────────────────────────────────
 *
 * No es un tema visual pegado encima: son cuatro decisiones concretas, y
 * cada una arregla algo que la versión anterior hacía peor.
 *
 *  1. **La elegida no cambia de color, se enmarca.** Antes la tarjeta
 *     seleccionada se invertía entera a navy. Eso obliga a repintar cada
 *     texto de dentro —tres colores condicionales— y hace que las dos dejen
 *     de ser comparables justo cuando hay que compararlas: una oscura y la
 *     otra clara. Apple nunca invierte; marca con un filete de acento de 2px
 *     y una palomita. La superficie no se mueve, así que los dos precios
 *     siguen leyéndose igual.
 *
 *  2. **La palomita va al final de la fila del nombre.** Es donde el ojo
 *     termina de leer la línea, y donde la pone iOS en cualquier lista de
 *     selección. El radio nativo sigue debajo, invisible pero vivo.
 *
 *  3. **El distintivo flota sobre el borde superior.** Es el gesto que hace
 *     que una tarjeta parezca «el plan destacado» sin agrandarla ni encoger
 *     a la otra —que es justo lo que §3.4.4 prohíbe—. Ocupa cero altura
 *     dentro de la tarjeta.
 *
 *  4. **Radio de 26px (`--radius-xl`, el de hojas y modales).** El de
 *     tarjeta son 20 y se quedaba corto: con este tamaño de bloque, la
 *     esquina más abierta es la diferencia entre una caja y una hoja.
 *
 * ── EL ORDEN: MENSUAL PRIMERO ──────────────────────────────────────────
 *
 * §3.4.4 exige que "la opción mensual está visible, al mismo nivel
 * jerárquico y a un clic". Ponerla primero es la forma más literal de
 * cumplirlo. El anual sigue PRESELECCIONADO, que también lo pide el PRD: es
 * anclaje legítimo mientras la otra esté a un clic, y ahora está antes.
 *
 * ── LA MISMA ANATOMÍA EN LAS DOS ───────────────────────────────────────
 *
 * Nombre, importe y la misma aritmética vista desde su lado: $14/mes son
 * $168 al año; $140/año equivalen a $11.60 al mes. De esas dos cifras sale
 * el "Ahorras $28" sin ningún precio tachado que nunca existió (§3.4.6), y
 * la resta se puede comprobar en la propia pantalla.
 *
 * ── SIN SELLO (§2.9) ───────────────────────────────────────────────────
 *
 * El sello de tarifa congelada se retiró por decisión de producto. §2.9 dice
 * que no aparezca en ningún otro sitio, no que tenga que aparecer aquí, y la
 * prueba lo verifica como "como máximo una vez": cero pasa.
 *
 * ── Accesibilidad ──────────────────────────────────────────────────────
 *
 * Grupo de radios REAL. El `<input type="radio">` va oculto visualmente pero
 * sigue recibiendo foco y teclado (flechas entre opciones, gratis por ser un
 * grupo nativo); un `<label>` en capa cubre la tarjeta para que el clic
 * funcione en cualquier punto, y el anillo de foco se pinta con
 * `has-[:focus-visible]`.
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
 * Una opción. Existe para que las dos tarjetas no puedan divergir: la
 * versión anterior repetía a mano el input, la capa de clic y el anillo de
 * foco, y por eso la mensual acabó con la mitad de la anatomía de la anual.
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
  savings,
  badge,
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
  /** "Ahorras $28 al año" — píldora junto al importe, sólo en la anual. */
  savings?: string;
  /** Distintivo que flota sobre el borde superior. */
  badge?: string;
}) {
  return (
    <KitCard
      className={cn(
        "relative cursor-pointer rounded-xl border-2 transition-colors duration-200",
        checked
          ? "border-[color:var(--teal-deep)] bg-[color:var(--accent-wash)]"
          : "border-[color:var(--line)]",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2",
        "has-[:focus-visible]:outline-offset-2",
        "has-[:focus-visible]:outline-[color:var(--focus-ring)]",
      )}
    >
      {/* El distintivo, montado sobre el borde. Fuera del flujo: no empuja
          nada hacia abajo, así que la tarjeta recomendada no crece por
          llevarlo y las dos siguen midiendo casi lo mismo (§3.4.4). */}
      {badge ? (
        <span
          className={cn(
            "absolute -top-3 right-5 rounded-full px-3 py-1",
            "text-caption font-bold uppercase tracking-wide",
            /* El texto NO es `--text-on-invert`. De noche el sistema
               invierte la rampa: `--teal-deep` pasa de verde oscuro a verde
               claro, y crema sobre verde claro daba 1.43:1 —medido—. Con
               `--teal-100` el par se invierte solo con el tema: 5.87:1 de
               día, 8.94:1 de noche. */
            "bg-[color:var(--teal-deep)] text-[color:var(--teal-100)]",
          )}
        >
          {badge}
        </span>
      ) : null}

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
      <label htmlFor={id} className="absolute inset-0 cursor-pointer rounded-xl">
        <span className="sr-only">{selectLabel}</span>
      </label>

      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-body font-semibold text-ink">{name}</span>
        {checked ? <span className="sr-only">{selectedAria}</span> : null}

        {/* La palomita, al final de la fila: donde acaba de leer el ojo. */}
        <span
          aria-hidden="true"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
            "transition-colors duration-200",
            checked
              ? "border-[color:var(--teal-deep)] bg-[color:var(--teal-deep)]"
              : "border-[color:var(--line-strong)]",
          )}
        >
          {checked ? (
            /* Mismo par invertible que la insignia: de noche el círculo
               es verde claro y una palomita crema desaparecía dentro. */
            <Check className="size-4 text-[color:var(--teal-100)]" strokeWidth={3} />
          ) : null}
        </span>
      </div>

      {/* El importe y, pegado a él, lo que ahorra. `tabular-nums` para que
          $14 y $140 caigan en la misma rejilla: dos precios que bailan se
          comparan peor. */}
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <p className="font-heading text-h1 font-extrabold tabular-nums tracking-[-0.02em] text-ink">
          {amount}
          <span className="text-body-lg font-bold text-muted">{period}</span>
        </p>
        {savings ? (
          <span className="rounded-full bg-amber-soft px-2.5 py-1 text-caption font-semibold tabular-nums text-ink">
            {savings}
          </span>
        ) : null}
      </div>

      <p className="mt-1.5 text-body text-muted">{equivalence}</p>
      {pitch ? <p className="mt-0.5 text-body text-muted">{pitch}</p> : null}
    </KitCard>
  );
}

export function PlanCards({ selected, onSelect, dict }: PlanCardsProps) {
  const t = dict.paywall.plans;
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

      {/* Más aire que el `stack-sm` del sistema: el distintivo flota por
          encima del borde y con 12px de separación quedaba pegado a la
          tarjeta de arriba. */}
      <div className="flex flex-col gap-4">
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

        {/* ── Anual — recomendado y preseleccionado ── */}
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
          savings={t.annual.savings(savings)}
          badge={t.annual.badge}
        />
      </div>
    </fieldset>
  );
}
