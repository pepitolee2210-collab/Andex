"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { ROUTES, TERMS_VERSION, isStripeConfigured } from "@/lib/config";
import { track } from "@/lib/analytics/track";
import { getDataStore } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { planPriceUsd } from "@/lib/stripe/plans";
import type {
  AnalyticsEventName,
  AnalyticsProps,
  Lang,
  PlanType,
  StoredProfile,
} from "@/lib/types";
import { DemoCheckout } from "./demo-checkout";
import { OrderSummary } from "./order-summary";
import { clearPaywallSession, msSincePaywall } from "./session-keys";
import { elementsAppearance } from "./stripe-appearance";
import {
  StripeCheckoutForm,
  type PaymentMethodKind,
} from "./stripe-checkout-form";

/**
 * CHECKOUT — §3.4.5. Pantalla F del MVP.
 *
 * **PANTALLA SEPARADA, NO MODAL** (§3.4.5, primera línea). Un modal encima del
 * paywall obliga a decidir sin poder releer nada; una pantalla propia se puede
 * abandonar y retomar, que es justo lo que §3.4.7 exige.
 *
 * Los 7 elementos, en orden:
 *   1. "← Cambiar de plan", SIEMPRE visible      ← aquí
 *   2. Resumen del pedido                        ← <OrderSummary />
 *   3. Apple Pay y Google Pay, arriba            ┐
 *   4. Divisor "o paga con tarjeta"              │
 *   5. Campos de Stripe Elements                 ├ <StripeCheckoutForm />
 *   6. Botón "Pagar $140 y entrar"               │
 *   7. Nota de conexión cifrada                  ┘
 *
 * §3.4.7 — casos borde cubiertos aquí:
 *   · Pago rechazado → mensaje específico del banco y el perfil intacto.
 *   · Abandono → `checkout_abandoned` + correo de recuperación encolado; al
 *     volver, el paywall sigue armado (no se toca el perfil).
 */

export type CheckoutScreenProps = {
  lang: Lang;
  plan: PlanType;
};

/** Instancia única de Stripe.js. `null` si no hay clave pública. */
let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise(): Promise<Stripe | null> | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

type IntentState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ready"; clientSecret: string; mode: "payment" | "setup" }
  | { phase: "error"; message: string };

/**
 * Envía un evento durante la descarga de la página. `track()` no sirve aquí:
 * hace un `import()` dinámico que el navegador ya no espera a resolver.
 */
function beaconEvent(name: AnalyticsEventName, props: AnalyticsProps): void {
  try {
    const body = JSON.stringify({ name, props });
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/events", body);
      return;
    }
    void fetch("/api/events", { method: "POST", body, keepalive: true });
  } catch {
    /* la analítica jamás rompe nada */
  }
}

export function CheckoutScreen({ lang, plan }: CheckoutScreenProps) {
  const dict = useMemo(() => getDictionary(lang), [lang]);
  const c = dict.checkout;
  const router = useRouter();

  const demoMode = !isStripeConfigured;
  const [intent, setIntent] = useState<IntentState>({ phase: "idle" });
  const [profile, setProfile] = useState<StoredProfile | null>(null);

  const paidRef = useRef(false);
  const abandonSentRef = useRef(false);
  const lastFieldRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const amountUsd = planPriceUsd(plan);

  // ── §7.5 `checkout_started` { plan_type, amount } ────────
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    track("checkout_started", { plan_type: plan, amount: amountUsd });
  }, [plan, amountUsd]);

  // ── Perfil: solo para el nombre de facturación. No se vuelve a pedir. ──
  useEffect(() => {
    let alive = true;
    void getDataStore()
      .getProfile()
      .then((loaded) => {
        if (alive) setProfile(loaded);
      })
      .catch(() => {
        // Sin perfil el pago sigue siendo posible: Stripe no lo necesita.
      });
    return () => {
      alive = false;
    };
  }, []);

  // ── Intención de pago (solo con Stripe configurado) ──────
  useEffect(() => {
    if (demoMode) return;

    let alive = true;
    setIntent({ phase: "loading" });

    void (async () => {
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ plan }),
        });
        const payload: unknown = await response.json().catch(() => null);
        if (!alive) return;

        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            typeof (payload as Record<string, unknown>).error === "string"
              ? ((payload as Record<string, unknown>).error as string)
              : c.errors.generic;
          setIntent({ phase: "error", message });
          return;
        }

        const data = payload as {
          clientSecret?: unknown;
          mode?: unknown;
        } | null;

        if (!data || typeof data.clientSecret !== "string") {
          setIntent({ phase: "error", message: c.errors.generic });
          return;
        }

        setIntent({
          phase: "ready",
          clientSecret: data.clientSecret,
          mode: data.mode === "setup" ? "setup" : "payment",
        });
      } catch {
        if (alive) setIntent({ phase: "error", message: c.errors.network });
      }
    })();

    return () => {
      alive = false;
    };
  }, [demoMode, plan, c.errors.generic, c.errors.network]);

  // ── §3.4.7: abandono. El perfil NO se toca; solo se avisa. ──
  const reportAbandon = useCallback(() => {
    if (paidRef.current || abandonSentRef.current) return;
    abandonSentRef.current = true;

    beaconEvent("checkout_abandoned", {
      plan_type: plan,
      last_field: lastFieldRef.current,
    });

    // Correo de recuperación a las 24 h (§3.4.7). Uno solo, sin secuencia:
    // el endpoint lo encola; falta el scheduler (ver reporte).
    try {
      if (typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/checkout/abandonado", "{}");
      }
    } catch {
      /* no bloquear la salida del usuario */
    }
  }, [plan]);

  useEffect(() => {
    window.addEventListener("pagehide", reportAbandon);
    return () => window.removeEventListener("pagehide", reportAbandon);
  }, [reportAbandon]);

  // ── §3.4.6: consentimiento afirmativo expreso, con IP ────
  const recordConsent = useCallback(async () => {
    try {
      const response = await fetch("/api/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          consents: [
            { type: "terms", granted: true },
            { type: "privacy", granted: true },
          ],
        }),
      });
      if (response.ok) return;
    } catch {
      /* se intenta el respaldo de abajo */
    }

    // Respaldo: si el servidor no pudo registrarlo, al menos queda constancia
    // con versión y timestamp (sin IP, que el navegador no conoce). Un cobro
    // sin ningún rastro de consentimiento sería peor.
    try {
      await getDataStore().recordConsent({
        type: "terms",
        version: TERMS_VERSION,
        granted: true,
      });
    } catch {
      console.warn("[andex] no se pudo registrar el consentimiento del checkout");
    }
  }, []);

  // ── Resultado del pago ───────────────────────────────────
  const handleSuccess = useCallback(() => {
    paidRef.current = true;
    track("payment_succeeded", {
      plan_type: plan,
      amount: amountUsd,
      time_from_paywall_ms: msSincePaywall(),
    });
    clearPaywallSession();
    // `replace`, no `push`: volver atrás desde la confirmación no debe
    // devolver a un formulario de pago ya consumido.
    router.replace(ROUTES.pagoExito);
  }, [plan, amountUsd, router]);

  const handleFailure = useCallback(
    (declineCode: string | null) => {
      // §3.4.7: el perfil no se pierde por un rechazo. Aquí no se borra ni se
      // modifica nada; solo se registra el motivo para poder actuar sobre él.
      track("payment_failed", { plan_type: plan, decline_code: declineCode });
    },
    [plan],
  );

  const handleMethodChosen = useCallback((method: PaymentMethodKind) => {
    track("checkout_method_chosen", { method });
  }, []);

  const handleFieldFocus = useCallback((field: string) => {
    lastFieldRef.current = field;
  }, []);

  // ── Modo demo: activar la membresía simulada ─────────────
  const activateDemo = useCallback(async () => {
    const store = getDataStore();
    if (!store.activateDemoSubscription) {
      console.warn("[andex] el store activo no soporta suscripción de demo");
      return;
    }
    await store.activateDemoSubscription(plan);
    handleSuccess();
  }, [plan, handleSuccess]);

  const billingName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() || null
    : null;

  const stripe = getStripePromise();

  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-12 pt-6 sm:px-6"
    >
      {/* ── 1. "← Cambiar de plan", SIEMPRE visible (§3.4.5) ── */}
      <div className="sticky top-0 z-10 -mx-4 bg-page/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <Link
          href={ROUTES.membresia}
          onClick={reportAbandon}
          className="inline-flex min-h-11 items-center text-body text-muted underline hover:text-ink"
        >
          {c.changePlan}
        </Link>
      </div>

      <h1 className="mt-4 font-heading text-h1 text-ink">{c.title}</h1>
      <p className="mt-2 text-body-lg text-muted">{c.subtitle}</p>

      {/* ── 2. Resumen del pedido (§3.4.5) ── */}
      <div className="mt-6">
        <OrderSummary plan={plan} dict={dict} lang={lang} />
      </div>

      {/* ── 3 a 7 ── */}
      <div className="mt-8">
        {demoMode ? (
          <DemoCheckout
            plan={plan}
            dict={dict}
            onBeforeConfirm={recordConsent}
            onActivate={activateDemo}
          />
        ) : intent.phase === "ready" && stripe ? (
          <Elements
            stripe={stripe}
            options={{
              clientSecret: intent.clientSecret,
              appearance: elementsAppearance(),
              locale: lang,
            }}
          >
            <StripeCheckoutForm
              plan={plan}
              dict={dict}
              clientSecret={intent.clientSecret}
              mode={intent.mode}
              billingName={billingName}
              onBeforeConfirm={recordConsent}
              onMethodChosen={handleMethodChosen}
              onFieldFocus={handleFieldFocus}
              onFailure={handleFailure}
              onSuccess={handleSuccess}
            />
          </Elements>
        ) : intent.phase === "error" || !stripe ? (
          <div className="flex flex-col gap-4">
            <p
              role="alert"
              className="rounded-md border border-danger bg-danger-soft p-4 text-body text-ink"
            >
              {intent.phase === "error" ? intent.message : c.errors.generic}{" "}
              <span className="text-muted">{c.errors.profileSafe}</span>
            </p>
            <Button href={ROUTES.membresia} variant="secondary" fullWidth>
              {c.changePlan}
            </Button>
          </div>
        ) : (
          <p aria-live="polite" className="text-body text-muted">
            {dict.common.actions.loading}
          </p>
        )}
      </div>

      {/* Nota de moneda para quien todavía no ha llegado (§3.4.3): el cargo
          es en dólares y lo convierte su banco. */}
      {profile?.locationContext === "pre_arrival" ? (
        <p className="mt-6 text-center text-caption text-muted">
          {dict.paywall.summary.currencyNote}
        </p>
      ) : null}
    </main>
  );
}
