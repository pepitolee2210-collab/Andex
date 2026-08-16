"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { Glyph, KitButton, KitNotice } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import { PAYWALL_MODE, ROUTES, TRIAL_DAYS } from "@/lib/config";
import { hasDashboardAccess } from "@/lib/auth/routing";
import { track } from "@/lib/analytics/track";
import { getDataStore, type StoredRanking } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { PRESELECTED_PLAN, planPriceUsd } from "@/lib/stripe/plans";
import type { Lang, PlanType, StoredProfile } from "@/lib/types";
import { formatUsd } from "@/lib/utils";
import { buildPersonalization } from "./personalization";
import { PlanCards } from "./plan-cards";
import { PlanSummary } from "./plan-summary";
import { CHECKOUT_VISITED_KEY, PAYWALL_SEEN_AT_KEY } from "./session-keys";

/**
 * PAYWALL PERSONALIZADO — §3.4. Pantalla E del MVP.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * PRINCIPIO (§3.4.1). El paywall NO vende funciones: **muestra el plan que
 * el usuario acaba de construir con sus respuestas**. El titular es "Tu plan
 * está listo, María", no "Desbloquea Premium".
 *
 * > "Con esta audiencia la confianza es el producto. Cada elemento de esta
 * >  pantalla existe para reducir la sospecha, no para aumentar la urgencia."
 *
 * PROHIBIDO en esta pantalla (§3.4.1 y §3.4.6), y no por estilo:
 *   · contadores regresivos          · "solo quedan X cupos"
 *   · descuentos que expiran         · precios tachados que nunca existieron
 *   · casillas premarcadas           · botón de cancelar escondido
 * Si alguien añade cualquiera de esos elementos, está incumpliendo un
 * requisito del PRD, no ajustando la conversión.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * UN SOLO COMPONENTE, TRES VARIANTES (§3.4.8 y §9). `PAYWALL_MODE` de
 * `lib/config.ts` decide entre cobro directo, prueba de 7 días y freemium.
 * La anatomía de la pantalla no cambia: cambia el copy del botón y la nota
 * que lo acompaña. Mover el punto de cobro es configuración, no código nuevo.
 *
 * Es un client component porque la capa de datos vive en el navegador en modo
 * demo (brief §6) y el mismo contrato sirve para Supabase en producción.
 */

export type PaywallScreenProps = { lang: Lang };

type LoadState =
  | { phase: "loading" }
  | { phase: "no-profile" }
  | { phase: "ready"; profile: StoredProfile; ranking: StoredRanking | null }
  | { phase: "error" };

export function PaywallScreen({ lang }: PaywallScreenProps) {
  const dict = useMemo(() => getDictionary(lang), [lang]);
  const t = dict.paywall;
  const router = useRouter();

  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [plan, setPlan] = useState<PlanType>(PRESELECTED_PLAN);
  const [returning, setReturning] = useState(false);
  const viewedRef = useRef(false);

  // ── Carga del perfil y del ranking reales ────────────────
  useEffect(() => {
    let alive = true;
    const store = getDataStore();

    void (async () => {
      try {
        const [profile, ranking, subscription] = await Promise.all([
          store.getProfile(),
          store.getRanking(),
          store.getSubscription(),
        ]);
        if (!alive) return;

        // Ya tiene acceso: el paywall no le pinta nada (y cobrarle dos veces
        // sería exactamente lo contrario de lo que pide §3.4.6).
        if (hasDashboardAccess(subscription)) {
          router.replace(ROUTES.panel);
          return;
        }

        // §4.7 / §3.2 regla 6: sin perfil no hay plan que mostrar. Se le
        // manda a armarlo, nunca a un paywall genérico.
        if (!profile) {
          setState({ phase: "no-profile" });
          return;
        }

        setState({ phase: "ready", profile, ranking });
      } catch {
        if (alive) setState({ phase: "error" });
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  // ── §3.4.7: quien abandonó el checkout vuelve y su plan sigue armado ──
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(CHECKOUT_VISITED_KEY) === "1") {
        setReturning(true);
      }
    } catch {
      /* sessionStorage bloqueado: el banner es un extra, no un requisito */
    }
  }, []);

  // ── §7.5 `paywall_viewed` — una sola vez, con datos reales ──
  const personalization =
    state.phase === "ready"
      ? buildPersonalization(state.profile, state.ranking, lang, dict)
      : null;

  useEffect(() => {
    if (!personalization || viewedRef.current) return;
    viewedRef.current = true;

    track("paywall_viewed", {
      top_module_id: personalization.topModuleId,
      location_context: personalization.locationContext,
      plan_preselected: PRESELECTED_PLAN,
    });

    // Marca temporal para `time_from_paywall_ms` de `payment_succeeded` (§7.5).
    try {
      window.sessionStorage.setItem(PAYWALL_SEEN_AT_KEY, String(Date.now()));
    } catch {
      /* sin sessionStorage el evento irá sin el tiempo, no se rompe nada */
    }
  }, [personalization]);

  const selectPlan = useCallback(
    (next: PlanType) => {
      setPlan((previous) => {
        if (previous === next) return previous;
        // §7.5 `plan_selected` { plan_type, switched_from }: el cambio de
        // preselección es la señal de que el anclaje no mandó solo.
        track("plan_selected", { plan_type: next, switched_from: previous });
        return next;
      });
    },
    [],
  );

  // ── Estados de carga ─────────────────────────────────────

  if (state.phase === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <p aria-live="polite" className="text-body text-muted">
          {dict.common.actions.loading}
        </p>
      </main>
    );
  }

  if (state.phase === "error") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-heading text-h2 text-ink">{t.pageTitle}</h1>
        <p className="text-body text-muted">{dict.common.errors.server}</p>
        <Button href={ROUTES.entrevista} variant="secondary">
          {t.back}
        </Button>
      </main>
    );
  }

  if (state.phase === "no-profile") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-heading text-h2 text-ink">{t.noProfile.title}</h1>
        <p className="text-body text-muted">{t.noProfile.body}</p>
        <Button href={ROUTES.entrevista}>{t.noProfile.cta}</Button>
      </main>
    );
  }

  // ── Pantalla completa (anatomía §3.4.2, en su orden) ─────

  const p = personalization!;
  const priceLabel = formatUsd(planPriceUsd(plan));

  /**
   * §3.4.8 — el mismo componente sirve las tres variantes. Solo cambia el
   * copy del botón y su nota; la anatomía, el resumen y las tarjetas son
   * idénticos, que es justo lo que pide el documento.
   */
  const ctaLabel =
    PAYWALL_MODE === "trial"
      ? plan === "annual"
        ? t.cta.trialAnnual(TRIAL_DAYS)
        : t.cta.trialMonthly(TRIAL_DAYS)
      : plan === "annual"
        ? t.cta.annual(priceLabel)
        : t.cta.monthly(priceLabel);

  const ctaNote =
    PAYWALL_MODE === "trial" ? t.cta.trialNote(TRIAL_DAYS, priceLabel) : null;

  function goToCheckout() {
    try {
      // Permite reconocer al que vuelve tras abandonar el pago (§3.4.7).
      window.sessionStorage.setItem(CHECKOUT_VISITED_KEY, "1");
    } catch {
      /* opcional */
    }
    // `plan` NO es dato sensible (§9): dice qué cadencia eligió, no nada de
    // su situación migratoria. Va en la URL para que "← Cambiar de plan",
    // el botón atrás y un refresco funcionen sin estado oculto.
    router.push(`${ROUTES.pago}?plan=${plan}`);
  }

  return (
    <main
      id="contenido"
      className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pb-6 pt-1"
    >
      {/* La salida sin castigo (§3.4.2) vive arriba a la izquierda, como en
          toda pantalla de detalle del sistema, y dice a dónde lleva: volver
          no borra nada. Una sola salida, no dos. */}
      <div className="navrow">
        <Link href={ROUTES.entrevista} className="navback">
          <Glyph name="chevron-left" icon={ChevronLeft} size={22} strokeWidth={2.1} />
          {t.back}
        </Link>
      </div>

      {/* Sobretítulo + titular con el NOMBRE REAL (§3.4.2, §3.4.3). */}
      <header>
        <p className="navover">{t.eyebrow}</p>
        <h1 className="largeTitle">
          {p.firstName ? t.title(p.firstName) : t.titleNoName}
        </h1>
        <p className="navsub">{t.subtitle}</p>
      </header>

      {returning ? (
        <KitNotice className="mt-5">{t.returning.banner}</KitNotice>
      ) : null}

      {/* Los dos planes: el importe primero, porque es lo que se vino a ver
          (§3.4.4). El sello vive dentro de la anual. */}
      <div className="mt-5">
        <PlanCards selected={plan} onSelect={selectPlan} dict={dict} />
      </div>

      {/* Qué incluye —y qué todavía no—, con las dos primeras filas salidas
          del ranking real (§3.4.3). */}
      <PlanSummary personalization={p} dict={dict} lang={lang} />

      {/* CTA. En freemium la entrada gratis es la acción principal y el plan
          de pago queda a un clic, visible, sin esconderse (§3.4.8 B). */}
      <div className="mt-8 flex flex-col gap-3">
        {PAYWALL_MODE === "freemium" ? (
          <>
            <Button size="lg" fullWidth href={ROUTES.panel}>
              {t.cta.freemium}
            </Button>
            <p className="text-center text-caption text-muted">
              {t.cta.freemiumNote}
            </p>
            <Button size="lg" fullWidth variant="secondary" onClick={goToCheckout}>
              {plan === "annual"
                ? t.cta.annual(priceLabel)
                : t.cta.monthly(priceLabel)}
            </Button>
          </>
        ) : (
          <>
            <KitButton wide onClick={goToCheckout}>
              {ctaLabel}
            </KitButton>
            {ctaNote ? (
              <p className="text-center text-caption text-muted">{ctaNote}</p>
            ) : null}
          </>
        )}

        {/* Quién cobra, y qué no tocamos nunca. Va pegado al botón porque es
            ahí donde surge la pregunta. */}
        <KitNotice iconName="external-link" icon={ExternalLink}>
          {t.gatewayNotice}
        </KitNotice>
      </div>

      {/* Fila de confianza (§3.4.2). Los tres son hechos verificables, no
          adornos: Stripe procesa, cancelar es un clic (§3.4.6) y la garantía
          está pendiente de política escrita (ver docs/DECISIONES.md D20). */}
      <ul className="mt-6 flex flex-col items-center gap-2 text-caption text-muted sm:flex-row sm:justify-center sm:gap-6">
        <li>{t.trust.stripe}</li>
        <li>{t.trust.cancel}</li>
        <li>{t.trust.guarantee}</li>
      </ul>

      {/* Divulgación de términos materiales ANTES del cobro (§3.4.6). */}
      <p className="mt-6 text-center text-caption text-muted">
        {t.legal.renewal}
      </p>
      <p className="mt-2 text-center text-caption text-muted">
        {t.legal.consent}{" "}
        <Link href={ROUTES.terminos} className="underline hover:text-ink">
          {t.legal.termsLink}
        </Link>
        {" · "}
        <Link href={ROUTES.privacidad} className="underline hover:text-ink">
          {t.legal.privacyLink}
        </Link>
      </p>
    </main>
  );
}
