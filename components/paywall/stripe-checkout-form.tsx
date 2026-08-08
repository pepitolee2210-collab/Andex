"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  PaymentRequestButtonElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {
  PaymentRequest,
  PaymentRequestPaymentMethodEvent,
  StripeCardNumberElementOptions,
  StripePaymentRequestButtonElementClickEvent,
} from "@stripe/stripe-js";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PAYWALL_MODE, TRIAL_DAYS } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import { classifyPaymentError, type PaymentErrorKey } from "@/lib/stripe/errors";
import { planPriceUsd } from "@/lib/stripe/plans";
import type { PlanType } from "@/lib/types";
import { formatUsd } from "@/lib/utils";
import { ConsentBlock } from "./consent-block";
import { elementBaseStyle } from "./stripe-appearance";

/**
 * Formulario de pago con Stripe Elements — elementos 3 a 7 del checkout
 * (§3.4.5), en su orden exacto:
 *
 *   3. Apple Pay y Google Pay ARRIBA, como botones primarios
 *   4. Divisor "o paga con tarjeta"
 *   5. Campos de Stripe Elements: número, vencimiento, CVC, código postal
 *   6. Botón "Pagar $140 y entrar" — el verbo dice exactamente qué pasa
 *   7. Nota "🔒 Conexión cifrada. ANDEX no almacena tu tarjeta."
 *
 * ANDEX **NUNCA** toca datos de tarjeta (§3.4.5 y §9): los tres campos son
 * iframes de Stripe. Este componente solo ve un `Element` opaco; el número
 * viaja del navegador del usuario a Stripe sin pasar por nuestro servidor.
 *
 * Errores (§3.4.7): siempre específicos. `classifyPaymentError` convierte el
 * `decline_code` del banco en el mensaje que dice qué pasó y qué hacer, y el
 * perfil NUNCA se pierde por un rechazo.
 */

export type PaymentMethodKind = "apple_pay" | "google_pay" | "card";

export type StripeCheckoutFormProps = {
  plan: PlanType;
  dict: Dictionary;
  clientSecret: string;
  /** `setup` cuando hay prueba gratuita: se guarda la tarjeta, no se cobra. */
  mode: "payment" | "setup";
  /** Nombre para `billing_details`; sale del perfil, no se vuelve a pedir. */
  billingName: string | null;
  /** Se llama justo antes de confirmar: registra el consentimiento (§3.4.6). */
  onBeforeConfirm: () => Promise<void>;
  onMethodChosen: (method: PaymentMethodKind) => void;
  onFieldFocus: (field: string) => void;
  onFailure: (declineCode: string | null) => void;
  onSuccess: () => void;
};

/** Campos del formulario, para `last_field` de `checkout_abandoned` (§7.5). */
const FIELD_NAMES = {
  number: "card_number",
  expiry: "card_expiry",
  cvc: "card_cvc",
  postal: "postal_code",
  consent: "consent",
} as const;

export function StripeCheckoutForm({
  plan,
  dict,
  clientSecret,
  mode,
  billingName,
  onBeforeConfirm,
  onMethodChosen,
  onFieldFocus,
  onFailure,
  onSuccess,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const c = dict.checkout;

  const [consent, setConsent] = useState(false); // §3.4.6: NUNCA premarcado
  const [consentError, setConsentError] = useState<string | undefined>();
  const [postalCode, setPostalCode] = useState("");
  const [errorKey, setErrorKey] = useState<PaymentErrorKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [walletKind, setWalletKind] = useState<PaymentMethodKind | null>(null);

  const consentRef = useRef<HTMLInputElement | null>(null);
  // Los callbacks se leen desde refs dentro del listener de Stripe, que se
  // registra una sola vez: así no se re-suscribe en cada render.
  const consentValueRef = useRef(consent);
  consentValueRef.current = consent;
  /** `checkout_method_chosen` se emite UNA vez, con el método real elegido. */
  const methodChosenRef = useRef(false);

  /**
   * Primer contacto con un campo de tarjeta = eligió tarjeta (§7.5,
   * `checkout_method_chosen`). No se emite al montar el elemento: eso marcaría
   * "card" también a quien acaba pagando con Apple Pay y arruinaría la métrica.
   */
  const noteCardField = useCallback(
    (field: string) => {
      onFieldFocus(field);
      if (methodChosenRef.current) return;
      methodChosenRef.current = true;
      onMethodChosen("card");
    },
    [onFieldFocus, onMethodChosen],
  );

  const price = formatUsd(planPriceUsd(plan));
  const isTrial = PAYWALL_MODE === "trial";

  const elementOptions: StripeCardNumberElementOptions = {
    style: elementBaseStyle(),
    // El código postal se pide aparte (§3.4.5 lo lista como campo propio).
    showIcon: true,
  };

  // ── §3.4.6: el consentimiento se exige en TODOS los caminos de pago ──
  const requireConsent = useCallback((): boolean => {
    if (consentValueRef.current) {
      setConsentError(undefined);
      return true;
    }
    setConsentError(c.consent.error);
    consentRef.current?.focus();
    return false;
  }, [c.consent.error]);

  // ── Elemento 3: Apple Pay / Google Pay ───────────────────
  useEffect(() => {
    if (!stripe) return;

    const amountCents = Math.round(planPriceUsd(plan) * 100);
    const request = stripe.paymentRequest({
      country: "US",
      currency: "usd",
      total: {
        label: plan === "annual" ? c.order.conceptAnnual : c.order.conceptMonthly,
        // Con prueba gratuita hoy no se cobra: la hoja del wallet debe decir
        // la verdad, no el precio futuro.
        amount: isTrial ? 0 : amountCents,
      },
      requestPayerName: true,
      requestPayerEmail: false,
    });

    let alive = true;
    void request.canMakePayment().then((result) => {
      if (!alive || !result) return;
      setWalletKind(result.applePay ? "apple_pay" : "google_pay");
      setPaymentRequest(request);
    });

    return () => {
      alive = false;
    };
  }, [stripe, plan, isTrial, c.order.conceptAnnual, c.order.conceptMonthly]);

  // Confirmación por wallet. Se registra aparte del efecto anterior para no
  // recrear el PaymentRequest cada vez que cambia un callback.
  useEffect(() => {
    if (!paymentRequest || !stripe) return;

    const onPaymentMethod = async (event: PaymentRequestPaymentMethodEvent) => {
      try {
        await onBeforeConfirm();

        // `handleActions: false` deja el 3-D Secure para DESPUÉS de cerrar la
        // hoja del wallet; si no, el banco abre su ventana detrás y el usuario
        // no la ve.
        const confirmed =
          mode === "setup"
            ? await stripe.confirmCardSetup(
                clientSecret,
                { payment_method: event.paymentMethod.id },
                { handleActions: false },
              )
            : await stripe.confirmCardPayment(
                clientSecret,
                { payment_method: event.paymentMethod.id },
                { handleActions: false },
              );

        if (confirmed.error) {
          event.complete("fail");
          const info = classifyPaymentError(confirmed.error);
          setErrorKey(info.key);
          onFailure(info.declineCode);
          return;
        }

        event.complete("success");

        const status =
          "setupIntent" in confirmed
            ? confirmed.setupIntent.status
            : confirmed.paymentIntent.status;

        if (status === "requires_action") {
          const followUp =
            mode === "setup"
              ? await stripe.confirmCardSetup(clientSecret)
              : await stripe.confirmCardPayment(clientSecret);
          if (followUp.error) {
            const info = classifyPaymentError(followUp.error);
            setErrorKey(info.key);
            onFailure(info.declineCode);
            return;
          }
        }

        onSuccess();
      } catch (caught) {
        event.complete("fail");
        const info = classifyPaymentError(caught);
        setErrorKey(info.key);
        onFailure(info.declineCode);
      }
    };

    paymentRequest.on("paymentmethod", onPaymentMethod);

    return () => {
      paymentRequest.off("paymentmethod", onPaymentMethod);
    };
  }, [
    paymentRequest,
    stripe,
    clientSecret,
    mode,
    onBeforeConfirm,
    onFailure,
    onSuccess,
  ]);

  /**
   * Clic en el botón del wallet. §3.4.6: sin consentimiento afirmativo expreso
   * no se abre ni la hoja de Apple Pay / Google Pay. `preventDefault()` es la
   * vía que ofrece Stripe para validar antes de mostrarla.
   */
  const handleWalletClick = useCallback(
    (event: StripePaymentRequestButtonElementClickEvent) => {
      if (!requireConsent()) {
        event.preventDefault();
        return;
      }
      if (walletKind && !methodChosenRef.current) {
        methodChosenRef.current = true;
        onMethodChosen(walletKind);
      }
    },
    [requireConsent, walletKind, onMethodChosen],
  );

  // ── Elemento 6: pagar con tarjeta ────────────────────────
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !stripe || !elements) return;
    if (!requireConsent()) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setSubmitting(true);
    setErrorKey(null);

    try {
      // El consentimiento se registra ANTES del cargo: si el orden se
      // invirtiera, existiría un cobro sin constancia de aceptación (§3.4.6).
      await onBeforeConfirm();

      const paymentMethod = {
        card: cardNumber,
        billing_details: {
          ...(billingName ? { name: billingName } : {}),
          address: { postal_code: postalCode.trim() || undefined },
        },
      };

      const result =
        mode === "setup"
          ? await stripe.confirmCardSetup(clientSecret, {
              payment_method: paymentMethod,
            })
          : await stripe.confirmCardPayment(clientSecret, {
              payment_method: paymentMethod,
            });

      if (result.error) {
        const info = classifyPaymentError(result.error);
        setErrorKey(info.key);
        onFailure(info.declineCode);
        setSubmitting(false);
        return;
      }

      onSuccess();
    } catch (caught) {
      const info = classifyPaymentError(caught);
      setErrorKey(info.key);
      onFailure(info.declineCode);
      setSubmitting(false);
    }
  }

  const fieldClass =
    "block w-full min-h-11 rounded-sm border border-line bg-surface px-3.5 py-3.5 " +
    "transition-colors duration-150 focus-within:border-teal-deep";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* ── 3. Apple Pay / Google Pay, arriba y primarios ── */}
      {paymentRequest ? (
        <div className="flex flex-col gap-2">
          <div
            role="group"
            aria-label={
              walletKind === "apple_pay" ? c.wallets.applePay : c.wallets.googlePay
            }
          >
            <PaymentRequestButtonElement
              onClick={handleWalletClick}
              options={{
                paymentRequest,
                style: { paymentRequestButton: { type: "default", height: "48px" } },
              }}
            />
          </div>
        </div>
      ) : null}

      {/* ── 4. Divisor "o paga con tarjeta" ── */}
      {paymentRequest ? (
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          <span className="text-caption text-muted">{c.wallets.divider}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
      ) : null}

      {/* ── 5. Campos de Stripe Elements ── */}
      <div className="flex flex-col gap-4">
        <div>
          <span className="mb-1.5 block text-label font-medium text-ink">
            {c.card.numberLabel}
          </span>
          <div className={fieldClass}>
            <CardNumberElement
              options={elementOptions}
              onFocus={() => noteCardField(FIELD_NAMES.number)}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-label font-medium text-ink">
              {c.card.expiryLabel}
            </span>
            <div className={fieldClass}>
              <CardExpiryElement
                options={{ style: elementBaseStyle() }}
                onFocus={() => noteCardField(FIELD_NAMES.expiry)}
              />
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-label font-medium text-ink">
              {c.card.cvcLabel}
            </span>
            <div className={fieldClass}>
              <CardCvcElement
                options={{ style: elementBaseStyle() }}
                onFocus={() => noteCardField(FIELD_NAMES.cvc)}
              />
            </div>
            <p className="mt-1.5 text-caption text-muted">{c.card.cvcHelp}</p>
          </div>
        </div>

        <Input
          label={c.card.postalLabel}
          help={c.card.postalHelp}
          value={postalCode}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={10}
          onFocus={() => noteCardField(FIELD_NAMES.postal)}
          onChange={(event) => setPostalCode(event.target.value)}
        />
      </div>

      {/* Error de pago: específico, nunca genérico (§3.4.7). El perfil sigue
          guardado y se dice explícitamente. */}
      {errorKey ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-danger bg-danger-soft p-4 text-body text-ink"
        >
          <CircleAlert aria-hidden="true" className="mt-1 size-4.5 shrink-0 text-danger" />
          <span>
            {c.errors[errorKey]}{" "}
            <span className="text-muted">{c.errors.profileSafe}</span>
          </span>
        </div>
      ) : null}

      {/* Consentimiento + términos materiales, pegados al botón (§3.4.6). */}
      <ConsentBlock
        plan={plan}
        dict={dict}
        checked={consent}
        onChange={(next) => {
          setConsent(next);
          if (next) setConsentError(undefined);
          onFieldFocus(FIELD_NAMES.consent);
        }}
        error={consentError}
        disabled={submitting}
        inputRef={consentRef}
      />

      {/* ── 6. Botón: el verbo dice exactamente qué pasa ── */}
      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          loadingLabel={c.submit.processing}
          disabled={!stripe || !elements}
        >
          {isTrial ? c.submit.trial(TRIAL_DAYS) : c.submit.pay(price)}
        </Button>
        {submitting ? (
          <p aria-live="polite" className="text-center text-caption text-muted">
            {c.submit.processing} {c.submit.processingHint}
          </p>
        ) : null}
      </div>

      {/* ── 7. Nota de conexión cifrada ── */}
      <p className="text-center text-caption text-muted">{c.secureNote}</p>
    </form>
  );
}
