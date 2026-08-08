"use client";

import { useId, type Ref } from "react";
import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { PAYWALL_MODE, ROUTES, TRIAL_DAYS } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { PlanType } from "@/lib/types";
import { planPriceUsd } from "@/lib/stripe/plans";
import { formatUsd } from "@/lib/utils";

/**
 * Consentimiento + divulgación de términos materiales — §3.4.6, las dos filas
 * no negociables que van pegadas al botón de pagar:
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ "Divulgación clara de términos materiales antes del cobro"           │
 * │   → precio, cadencia y renovación automática visibles SIN SCROLL en  │
 * │     el botón de pago. Por eso este bloque va inmediatamente encima    │
 * │     del botón y no en un pie de página ni tras un desplegable.        │
 * ├──────────────────────────────────────────────────────────────────────┤
 * │ "Consentimiento afirmativo expreso"                                   │
 * │   → checkbox **NO premarcado**. `defaultChecked` aquí sería un        │
 * │     patrón oscuro explícitamente prohibido por §3.4.6. El estado lo   │
 * │     controla el padre y arranca en `false`, siempre.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * El registro (versión de términos + timestamp + IP) lo hace el servidor en
 * `POST /api/consent`: el navegador no conoce su propia IP.
 */

export type ConsentBlockProps = {
  plan: PlanType;
  dict: Dictionary;
  /** Estado del checkbox. NUNCA se inicializa en true. */
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Mensaje cuando se intenta pagar sin marcar. */
  error?: string;
  disabled?: boolean;
  /** Para devolver el foco aquí si el usuario intenta pagar sin marcar. */
  inputRef?: Ref<HTMLInputElement>;
};

export function ConsentBlock({
  plan,
  dict,
  checked,
  onChange,
  error,
  disabled,
  inputRef,
}: ConsentBlockProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const price = formatUsd(planPriceUsd(plan));
  const cadence =
    plan === "annual"
      ? dict.checkout.order.renewalAnnual
      : dict.checkout.order.renewalMonthly;

  return (
    <div className="flex flex-col gap-4">
      {/*
        Términos materiales, sin scroll y sin letra chica: qué se cobra, cada
        cuánto y que se renueva solo. §3.4.6, fila 1.
      */}
      <div className="rounded-md border border-line bg-surface-alt p-4">
        <p className="text-body text-ink">
          {price} · {cadence}
        </p>
        <p className="mt-1 text-caption text-muted">
          {dict.paywall.legal.renewal}
        </p>
        {PAYWALL_MODE === "trial" ? (
          <p className="mt-1 text-caption text-muted">
            {dict.paywall.cta.trialNote(TRIAL_DAYS, price)}
          </p>
        ) : null}
        <p className="mt-2 text-caption text-muted">
          <Link href={ROUTES.terminos} className="underline hover:text-ink">
            {dict.common.legal.terms}
          </Link>
          {" · "}
          <Link href={ROUTES.privacidad} className="underline hover:text-ink">
            {dict.common.legal.privacy}
          </Link>
        </p>
      </div>

      {/* Consentimiento afirmativo expreso. Sin `defaultChecked`. §3.4.6, fila 2. */}
      <div>
        <label
          htmlFor={id}
          className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-body text-ink"
        >
          <input
            id={id}
            ref={inputRef}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="mt-1 size-5 shrink-0 rounded-sm border border-line accent-teal-deep"
          />
          <span>{dict.checkout.consent.checkbox}</span>
        </label>
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="mt-1 flex items-start gap-1 text-caption text-danger"
          >
            <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
