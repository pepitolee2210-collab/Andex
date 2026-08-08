"use client";

/**
 * Gestión de la membresía desde /perfil (§3.4.6 y §3.4.7).
 *
 * §3.4.6, requisito NO negociable: "Cancelación tan simple como la suscripción
 * — un clic desde Perfil, mismo medio (web), sin llamada ni formulario ni
 * retención por chat". Aquí no hay ofertas de última hora, ni descuentos, ni
 * pasos extra: un botón, una confirmación honesta que dice qué pasa y hasta
 * cuándo, y ya está.
 *
 * D18 — el motivo se pregunta DESPUÉS de haber cancelado, con "No, gracias"
 * visible: preguntar antes convertiría la encuesta en un obstáculo.
 */

import { useRef, useState } from "react";
import { PAST_DUE_GRACE_DAYS, ROUTES } from "@/lib/config";
import { getDataStore } from "@/lib/data";
import { track } from "@/lib/analytics/track";
import { formatUsd, sanitizeFreeText } from "@/lib/utils";
import type { SubscriptionInfo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { usePanel } from "./panel-context";
import { daysBetween, formatDate } from "./panel-utils";

const REASON_MAX = 240;

export function SubscriptionCard() {
  const { dict, lang, subscription, profile, setSubscription } = usePanel();
  const s = dict.perfil.subscription;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  /** `subscription_canceled` se emite UNA sola vez, pase lo que pase (§7.5). */
  const canceledEventRef = useRef(false);

  if (!subscription) {
    return (
      <SectionShell title={dict.perfil.sections.subscription}>
        <h3 className="font-heading text-h3 text-ink">{s.noneTitle}</h3>
        <p className="mt-1 text-body text-muted">{s.noneBody}</p>
        <Button href={ROUTES.membresia} className="mt-4">
          {s.noneCta}
        </Button>
      </SectionShell>
    );
  }

  const price = formatUsd(subscription.priceUsd);
  const periodEnd = formatDate(subscription.currentPeriodEnd, lang);
  const annual = subscription.plan === "annual";

  const statusLabel =
    subscription.status === "active"
      ? s.statusActive
      : subscription.status === "trialing"
        ? s.statusTrialing
        : subscription.status === "past_due"
          ? s.statusPastDue
          : s.statusCanceled;

  const canceling = subscription.cancelAtPeriodEnd || subscription.status === "canceled";

  async function handleCancel() {
    setBusy(true);
    try {
      const next = await getDataStore().cancelSubscription();
      setSubscription(next);
      canceledEventRef.current = false;
      setConfirmOpen(false);
      toast.success(s.canceledToast(formatDate(next.currentPeriodEnd, lang)));
      // D18 — el motivo, después de cancelar y siempre opcional.
      setReasonOpen(true);
    } catch {
      toast.error(s.cancelFailed);
    } finally {
      setBusy(false);
    }
  }

  /**
   * Cierra el paso del motivo y emite `subscription_canceled` exactamente una
   * vez, con motivo o sin él. Da igual por dónde salga el usuario (Enviar,
   * "No, gracias", Escape o clic fuera): la cancelación ya está hecha y el
   * evento no puede duplicarse ni perderse.
   */
  function finishCancellation(reasonText: string | null) {
    setReasonOpen(false);
    setReason("");
    if (canceledEventRef.current) return;
    canceledEventRef.current = true;
    track("subscription_canceled", {
      plan_type: subscription?.plan ?? null,
      days_active: daysBetween(profile?.createdAt, new Date()),
      reason: reasonText,
    });
  }

  async function handleReactivate() {
    setBusy(true);
    try {
      const next: SubscriptionInfo = await getDataStore().reactivateSubscription();
      setSubscription(next);
      toast.success(s.reactivatedToast);
    } catch {
      toast.error(dict.common.errors.network);
    } finally {
      setBusy(false);
    }
  }

  function submitReason() {
    const cleaned = sanitizeFreeText(reason, REASON_MAX);
    finishCancellation(cleaned.length > 0 ? cleaned : null);
  }

  return (
    <SectionShell title={dict.perfil.sections.subscription}>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-caption text-muted">{s.planLabel}</dt>
          <dd className="text-body text-ink">{annual ? s.planAnnual : s.planMonthly}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">{s.priceLabel}</dt>
          <dd className="text-body text-ink">
            {annual ? s.priceAnnual(price) : s.priceMonthly(price)}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted">{s.statusLabel}</dt>
          <dd className="mt-0.5">
            <Badge variant={subscription.status === "past_due" ? "amber" : "teal"}>
              {statusLabel}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted">{s.invoicesTitle}</dt>
          <dd className="text-body text-muted">{s.invoicesEmpty}</dd>
        </div>
      </dl>

      <p className="mt-4 text-body text-muted">
        {canceling
          ? s.accessUntil(periodEnd)
          : subscription.status === "trialing"
            ? s.trialEndsOn(periodEnd)
            : s.renewsOn(periodEnd)}
      </p>
      <p className="mt-1 text-caption text-muted">{s.renewalNotice}</p>
      {/* La tarifa congelada es una promesa vinculante: se repite aquí. */}
      <p className="mt-1 text-caption text-muted">{s.lockedRate(price)}</p>

      {/* §3.4.7 — past_due: 7 días de solo lectura, aviso claro, sin borrar nada. */}
      {subscription.status === "past_due" ? (
        <div className="mt-4 rounded-sm border border-line bg-amber-soft p-3">
          <p className="text-body text-ink">
            <strong className="font-semibold">{s.pastDueTitle}.</strong>{" "}
            {s.pastDueBody(PAST_DUE_GRACE_DAYS, periodEnd)}
          </p>
          <Button href={ROUTES.membresia} variant="secondary" className="mt-3">
            {s.pastDueCta}
          </Button>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {canceling ? (
          <>
            <Button onClick={handleReactivate} loading={busy}>
              {s.reactivate}
            </Button>
            <p className="w-full text-caption text-muted">{s.reactivateBody}</p>
          </>
        ) : (
          // UN CLIC (§3.4.6). La confirmación existe para informar, no para retener.
          <Button variant="ghost" onClick={() => setConfirmOpen(true)}>
            {s.cancel}
          </Button>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={s.cancelConfirmTitle}
        closeLabel={s.cancelConfirmCancel}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              {s.cancelConfirmCancel}
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={busy}>
              {s.cancelConfirmAccept}
            </Button>
          </>
        }
      >
        <p className="text-body text-ink">{s.cancelConfirmBody(periodEnd)}</p>
      </Modal>

      <Modal
        open={reasonOpen}
        onClose={() => finishCancellation(null)}
        title={s.reasonTitle}
        closeLabel={s.reasonSkip}
        footer={
          <>
            <Button variant="ghost" onClick={() => finishCancellation(null)}>
              {s.reasonSkip}
            </Button>
            <Button onClick={submitReason}>{s.reasonSubmit}</Button>
          </>
        }
      >
        <p className="text-body text-muted">{s.reasonHelp}</p>
        <Input
          className="mt-3"
          label={s.reasonTitle}
          placeholder={s.reasonPlaceholder}
          maxLength={REASON_MAX}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Modal>
    </SectionShell>
  );
}

function SectionShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id="membresia"
      aria-labelledby="seccion-membresia"
      className="scroll-mt-20 rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-5"
    >
      <h2
        id="seccion-membresia"
        className="mb-4 font-heading text-h3 text-ink"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
