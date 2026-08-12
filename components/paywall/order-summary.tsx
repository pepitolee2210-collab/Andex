"use client";

import { PAYWALL_MODE, TRIAL_DAYS } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { Lang, PlanType } from "@/lib/types";
import { planPriceUsd } from "@/lib/stripe/plans";
import { formatUsd } from "@/lib/utils";

/**
 * Resumen del pedido — elemento 2 de los 7 del checkout (§3.4.5):
 * **concepto, cadencia de renovación y total de hoy en USD**.
 *
 * Es también la primera mitad del requisito de §3.4.6 ("divulgación clara de
 * términos materiales antes del cobro"): va arriba del todo, antes de que el
 * usuario toque ningún método de pago. La segunda mitad se repite junto al
 * botón de pagar, sin scroll.
 *
 * Nada de precios tachados ni de "antes $X" (§3.4.6, sin patrones oscuros):
 * el único número es lo que se va a cobrar hoy.
 */

export type OrderSummaryProps = {
  plan: PlanType;
  dict: Dictionary;
  lang: Lang;
};

/**
 * Zona de facturación.
 *
 * Las fechas de cobro se enseñan SIEMPRE en esta zona, nunca en la de quien
 * mira, y son dos problemas resueltos de una vez:
 *
 *  · **Corrección.** El cargo ocurre en un instante fijo. Alguien en Manila
 *    que ve "12 de agosto" porque allí ya es de madrugada leería una fecha
 *    de renovación que no es la que Stripe va a usar.
 *  · **Hidratación.** `new Date()` se evalúa en el servidor y otra vez en el
 *    navegador. Con el formato en la zona de cada uno, un usuario lejano
 *    recibía un HTML que no coincidía con el suyo y React abortaba la
 *    hidratación de la pantalla de pago (error #418, reproducido con el
 *    navegador en Asia/Manila).
 */
const BILLING_TZ = "America/Denver";

/** Fecha larga en el idioma del usuario, sin librerías. */
function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
    timeZone: BILLING_TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(base: Date, months: number): Date {
  const next = new Date(base.getTime());
  next.setMonth(next.getMonth() + months);
  return next;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2">
      <dt className="text-body text-muted">{label}</dt>
      <dd className="text-body text-ink">{value}</dd>
    </div>
  );
}

export function OrderSummary({ plan, dict, lang }: OrderSummaryProps) {
  const t = dict.checkout.order;
  const isTrial = PAYWALL_MODE === "trial";

  const now = new Date();
  const trialEnd = addDays(now, TRIAL_DAYS);
  const periodEnd = addMonths(isTrial ? trialEnd : now, plan === "annual" ? 12 : 1);

  const fullPrice = planPriceUsd(plan);
  // Con prueba gratuita hoy no se cobra nada: decirlo con el número, no con
  // una promesa. Sin prueba, el total de hoy es el precio del plan.
  const todayTotal = isTrial ? 0 : fullPrice;

  return (
    <section
      aria-labelledby="resumen-pedido"
      className="rounded-lg border border-line bg-surface p-5 shadow-sm"
    >
      <h2 id="resumen-pedido" className="font-heading text-h3 text-ink">
        {t.heading}
      </h2>

      <dl className="mt-3 divide-y divide-line">
        <Row
          label={t.conceptLabel}
          value={plan === "annual" ? t.conceptAnnual : t.conceptMonthly}
        />
        <Row
          label={t.renewalLabel}
          value={plan === "annual" ? t.renewalAnnual : t.renewalMonthly}
        />
        <Row
          label={t.firstChargeLabel}
          value={
            isTrial
              ? t.firstChargeAfterTrial(formatDate(trialEnd, lang))
              : t.firstChargeToday
          }
        />
        <Row
          label={t.nextChargeLabel}
          value={t.nextChargeValue(formatDate(periodEnd, lang))}
        />
      </dl>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line pt-4">
        <span className="text-body-lg font-medium text-ink">{t.totalLabel}</span>
        <span className="font-heading text-h2 text-ink">
          {formatUsd(todayTotal)} {t.totalCurrency}
        </span>
      </div>
    </section>
  );
}
