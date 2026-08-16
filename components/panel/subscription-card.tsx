"use client";

/**
 * SUSCRIPCIÓN — la sección de Perfil (§3.4.6 y §3.4.7) y la pantalla
 * "Pago vencido" del sistema de diseño (`ui_kits/app/screens.jsx`).
 *
 * ── La forma ──
 *
 * En el diseño la membresía es UNA fila dentro de la lista de Perfil: plan,
 * precio y qué pasa después, con su insignia de estado. Todo lo demás
 * —recibos, tarifa congelada, cancelar, reactivar— vive detrás de esa fila.
 * Antes era una rejilla de cuatro definiciones y tres párrafos siempre
 * abiertos, que es mucha letra para un dato que casi nadie viene a mirar.
 *
 * ── Pago vencido ──
 *
 * Cuando el cobro no pasa, encima de la fila aparece la tarjeta ámbar del
 * diseño. Dice lo que de verdad importa —"puedes leer tus documentos, pero
 * no añadir nuevos"— y a continuación que **nadie borra nada**. Sin amenaza
 * y sin cuenta atrás: un contador corriendo es exactamente el registro
 * visual de quien ya estafó a este público (§3.4.1), y la bóveda es local,
 * así que dejar de pagar no puede borrar un solo documento.
 *
 * ── Lo que no cambia ──
 *
 * §3.4.6, requisito NO negociable: "Cancelación tan simple como la
 * suscripción — un clic desde Perfil, mismo medio (web), sin llamada ni
 * formulario ni retención por chat". Aquí no hay ofertas de última hora, ni
 * descuentos, ni pasos extra.
 *
 * D18 — el motivo se pregunta DESPUÉS de haber cancelado, con "No, gracias"
 * visible: preguntar antes convertiría la encuesta en un obstáculo.
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, CreditCard } from "lucide-react";
import { PAST_DUE_GRACE_DAYS, ROUTES } from "@/lib/config";
import { getDataStore } from "@/lib/data";
import { track } from "@/lib/analytics/track";
import { formatUsd, sanitizeFreeText } from "@/lib/utils";
import type { SubscriptionInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import {
  Glyph,
  KitBadge,
  KitButton,
  KitCard,
  ListGroup,
  ListRow,
  SectionLabel,
  type BadgeTone,
} from "@/components/ui/kit";
import { usePanel } from "./panel-context";
import { daysBetween, formatDate } from "./panel-utils";

const REASON_MAX = 240;

export function SubscriptionCard() {
  const { dict, lang, subscription, profile, setSubscription } = usePanel();
  const router = useRouter();
  const s = dict.perfil.subscription;

  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  /** `subscription_canceled` se emite UNA sola vez, pase lo que pase (§7.5). */
  const canceledEventRef = useRef(false);

  if (!subscription) {
    return (
      <>
        <SectionLabel as="h2">{dict.perfil.sections.subscription}</SectionLabel>
        <KitCard>
          <h3 className="rowtitle">{s.noneTitle}</h3>
          <p className="mt-2 text-body text-muted">{s.noneBody}</p>
          <KitButton
            className="mt-4"
            size="sm"
            onClick={() => router.push(ROUTES.membresia)}
          >
            {s.noneCta}
          </KitButton>
        </KitCard>
      </>
    );
  }

  const price = formatUsd(subscription.priceUsd);
  const periodEnd = formatDate(subscription.currentPeriodEnd, lang);
  const annual = subscription.plan === "annual";
  const pastDue = subscription.status === "past_due";
  const canceling = subscription.cancelAtPeriodEnd || subscription.status === "canceled";

  const statusLabel = canceling
    ? s.statusCanceled
    : subscription.status === "active"
      ? s.statusActive
      : subscription.status === "trialing"
        ? s.statusTrialing
        : pastDue
          ? s.statusPastDue
          : s.statusCanceled;

  /** El color nunca viaja solo: la insignia siempre lleva su texto. */
  const statusTone: BadgeTone = canceling
    ? "none"
    : subscription.status === "active"
      ? "ok"
      : subscription.status === "trialing"
        ? "accent"
        : pastDue
          ? "soon"
          : "none";

  /** Qué pasa después, en media línea: es lo que se lee sin abrir la fila. */
  const when = canceling
    ? s.accessShort(periodEnd)
    : subscription.status === "trialing"
      ? s.trialShort(periodEnd)
      : s.renewsShort(periodEnd);

  const planPrice = annual ? s.priceAnnual(price) : s.priceMonthly(price);

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

  /**
   * Las dos confirmaciones sustituyen a la hoja de detalle en vez de
   * apilarse encima: dos diálogos abiertos a la vez es una trampa de foco.
   */
  function askToCancel() {
    setDetailOpen(false);
    setConfirmOpen(true);
  }

  return (
    <>
      <SectionLabel as="h2">{dict.perfil.sections.subscription}</SectionLabel>

      {/* §3.4.7 — pago vencido: qué se puede hacer, qué no, y que no se
          borra nada. La tarjeta ámbar del diseño, sin cuenta atrás. */}
      {pastDue ? (
        <KitCard tone="highlight" className="mb-2.5">
          <p
            className="font-bold uppercase"
            style={{
              fontSize: "var(--size-micro)",
              letterSpacing: "var(--track-label)",
              color: "var(--amber-700)",
            }}
          >
            {s.pastDueEyebrow}
          </p>
          <p
            className="mt-3 text-body-lg font-bold text-ink"
            style={{ letterSpacing: "-.018em", lineHeight: 1.3 }}
          >
            {s.pastDueTitle}
          </p>
          <p
            className="mt-2.5"
            style={{ fontSize: 16, lineHeight: 1.5, color: "var(--amber-700)" }}
          >
            {s.pastDueBody(PAST_DUE_GRACE_DAYS)}
          </p>
          <KitButton
            className="mt-[18px]"
            size="sm"
            onClick={() => router.push(ROUTES.membresia)}
          >
            {s.pastDueCta}
          </KitButton>
        </KitCard>
      ) : null}

      <ListGroup>
        <ListRow
          iconName="credit-card"
          icon={CreditCard}
          title={annual ? s.planAnnual : s.planMonthly}
          meta={s.rowMeta(planPrice, when)}
          badge={<KitBadge tone={statusTone}>{statusLabel}</KitBadge>}
          trail={
            <Glyph
              name="chevron-right"
              icon={ChevronRight}
              size={18}
              strokeWidth={2}
              className="shrink-0 text-disabled"
            />
          }
          onClick={() => setDetailOpen(true)}
        />
      </ListGroup>

      {/* ── La hoja de la membresía ── */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={dict.perfil.sections.subscription}
        closeLabel={dict.common.aria.closeModal}
        variant="fullscreen-mobile"
      >
        <p className="text-body-lg font-bold text-ink">
          {annual ? s.planAnnual : s.planMonthly}
        </p>
        <p className="mt-1 text-body text-muted">{planPrice}</p>

        <p className="mt-4 text-body text-ink">
          {canceling
            ? s.accessUntil(periodEnd)
            : subscription.status === "trialing"
              ? s.trialEndsOn(periodEnd)
              : s.renewsOn(periodEnd)}
        </p>
        <p className="mt-1 text-body text-muted">{s.renewalNotice}</p>
        {/* La tarifa congelada es una promesa vinculante: se repite aquí. */}
        <p className="mt-1 text-body text-muted">{s.lockedRate(price)}</p>

        <SectionLabel as="h3">{s.invoicesTitle}</SectionLabel>
        <p className="text-body text-muted">{s.invoicesEmpty}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {canceling ? (
            <>
              <Button onClick={handleReactivate} loading={busy}>
                {s.reactivate}
              </Button>
              <p className="w-full text-body text-muted">{s.reactivateBody}</p>
            </>
          ) : (
            // UN CLIC (§3.4.6). La confirmación existe para informar, no para retener.
            <Button variant="ghost" onClick={askToCancel}>
              {s.cancel}
            </Button>
          )}
        </div>
      </Modal>

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
    </>
  );
}
