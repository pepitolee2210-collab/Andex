"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleCheckBig } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES, TRIAL_DAYS, isStripeConfigured } from "@/lib/config";
import { getDataStore } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import type { Lang, StoredProfile, SubscriptionInfo } from "@/lib/types";

/**
 * Confirmación del pago y entrada al panel (§3.4.7, §3.4.6 "Recibo").
 *
 * Deliberadamente sobria: aquí NO va el sello (§2.9 — se usa una sola vez en
 * todo el producto, en la tarjeta del plan anual) ni La Ruta (§2.8 la sitúa en
 * landing, wizard, paywall y dashboard; el nodo 6 ya se cerró en el paywall).
 * Repetir cualquiera de los dos los convertiría en decoración.
 *
 * Espera activa: en producción, el estado de la suscripción lo escribe el
 * webhook de Stripe, que puede tardar un par de segundos. Si el usuario
 * entrara al panel antes de que llegue, el guardián de acceso lo devolvería al
 * paywall recién pagado — la peor primera impresión posible. Por eso se
 * consulta el store unas cuantas veces antes de abrir el botón, y pasado el
 * tiempo máximo se abre igual: no se deja a nadie encerrado en esta pantalla.
 */

export type SuccessScreenProps = {
  lang: Lang;
};

/** Reintentos de lectura de la suscripción mientras llega el webhook. */
const POLL_ATTEMPTS = 8;
const POLL_INTERVAL_MS = 1500;

export function SuccessScreen({ lang }: SuccessScreenProps) {
  const dict = useMemo(() => getDictionary(lang), [lang]);
  const c = dict.checkout.success;

  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let alive = true;
    const store = getDataStore();

    void store
      .getProfile()
      .then((loaded) => {
        if (alive) setProfile(loaded);
      })
      .catch(() => {
        /* el nombre es un detalle: hay variante sin nombre */
      });

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = () => {
      attempts += 1;
      void store
        .getSubscription()
        .then((found) => {
          if (!alive) return;
          if (found) {
            setSubscription(found);
            setSettled(true);
            return;
          }
          if (attempts >= POLL_ATTEMPTS) {
            setSettled(true);
            return;
          }
          timer = setTimeout(poll, POLL_INTERVAL_MS);
        })
        .catch(() => {
          if (alive) setSettled(true);
        });
    };

    poll();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const firstName = profile?.firstName.trim() ?? "";
  const isTrial = subscription?.status === "trialing";

  const trialDate =
    isTrial && subscription
      ? new Intl.DateTimeFormat(lang === "es" ? "es-MX" : "en-US", {
          // Zona de facturación, no la del usuario: el cargo ocurre en un
          // instante fijo y quien esté en Asia leería otro día.
          timeZone: "America/Denver",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(subscription.currentPeriodEnd))
      : null;

  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center gap-5 px-4 py-12 sm:px-6"
    >
      <CircleCheckBig aria-hidden="true" className="size-10 text-teal-deep" />

      <p className="text-label font-semibold uppercase tracking-widest text-teal-deep">
        {c.eyebrow}
      </p>

      <h1 className="font-heading text-h1 text-ink">
        {isTrial && trialDate
          ? c.trialTitle(TRIAL_DAYS)
          : firstName
            ? c.title(firstName)
            : c.titleNoName}
      </h1>

      <p className="text-body-lg text-ink">
        {isTrial && trialDate ? c.trialBody(trialDate) : c.body}
      </p>

      {/* Modo demo: se repite que no hubo cargo. Nadie debe salir de aquí
          creyendo que pagó (§3.4.6, sin patrones oscuros). */}
      {!isStripeConfigured ? (
        <p className="flex flex-wrap items-center gap-2 rounded-md border-2 border-dashed border-amber-deep bg-amber-soft p-4 text-body text-ink">
          <Badge variant="amber">{dict.checkout.demo.badge}</Badge>
          {dict.checkout.demo.noticeOnSuccess}
        </p>
      ) : null}

      {/* §3.4.6 — recibo por correo y aviso 48 h antes de cada renovación. */}
      <ul className="flex flex-col gap-2 text-body text-muted">
        {profile?.email ? <li>{c.receipt(profile.email)}</li> : null}
        <li>{c.renewalReminder}</li>
      </ul>

      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          href={ROUTES.panel}
          loading={!settled}
          loadingLabel={dict.common.actions.loading}
        >
          {c.cta}
        </Button>
      </div>
    </main>
  );
}
