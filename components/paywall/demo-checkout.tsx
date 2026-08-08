"use client";

import { useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n";
import type { PlanType } from "@/lib/types";
import { ConsentBlock } from "./consent-block";

/**
 * Checkout SIMULADO — modo demo, sin credenciales de Stripe (decisión D2).
 *
 * Regla de honestidad, no de estilo: la pantalla **dice en grande que es una
 * simulación y que no se cobra nada**. El PRD prohíbe engañar al usuario
 * (§3.4.6, sin patrones oscuros) y esa regla no tiene una excepción para el
 * desarrollador que prueba el producto: un checkout que parece real y no lo
 * es sería exactamente el mismo engaño.
 *
 * El resto del flujo es idéntico al real: mismo resumen del pedido, mismo
 * consentimiento afirmativo expreso sin premarcar, mismo destino
 * (`/pago/exito`) y mismo evento `payment_succeeded`. Lo único que cambia es
 * que no hay campos de tarjeta — porque no hay nada que cobrar.
 */

export type DemoCheckoutProps = {
  plan: PlanType;
  dict: Dictionary;
  /** Registra el consentimiento antes de "cobrar", igual que en el real. */
  onBeforeConfirm: () => Promise<void>;
  onActivate: () => Promise<void>;
};

export function DemoCheckout({
  plan,
  dict,
  onBeforeConfirm,
  onActivate,
}: DemoCheckoutProps) {
  const c = dict.checkout;
  const [consent, setConsent] = useState(false); // NUNCA premarcado
  const [consentError, setConsentError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const consentRef = useRef<HTMLInputElement | null>(null);

  async function handleClick() {
    if (submitting) return;
    if (!consent) {
      setConsentError(c.consent.error);
      consentRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onBeforeConfirm();
      await onActivate();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Aviso imposible de pasar por alto: esto no cobra. */}
      <div
        role="note"
        className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-amber-deep bg-amber-soft p-5"
      >
        <span className="flex items-center gap-2">
          <FlaskConical aria-hidden="true" className="size-4.5 shrink-0 text-amber-deep" />
          <Badge variant="amber">{c.demo.badge}</Badge>
        </span>
        <h2 className="font-heading text-h3 text-ink">{c.demo.title}</h2>
        <p className="text-body text-ink">{c.demo.body}</p>
      </div>

      <ConsentBlock
        plan={plan}
        dict={dict}
        checked={consent}
        onChange={(next) => {
          setConsent(next);
          if (next) setConsentError(undefined);
        }}
        error={consentError}
        disabled={submitting}
        inputRef={consentRef}
      />

      <Button
        size="lg"
        fullWidth
        loading={submitting}
        loadingLabel={c.submit.processing}
        onClick={handleClick}
      >
        {c.demo.submit}
      </Button>

      <p className="text-center text-caption text-muted">{c.secureNote}</p>
    </div>
  );
}
