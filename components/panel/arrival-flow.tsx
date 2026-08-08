"use client";

/**
 * Evento de transición "Ya llegué" (§3.2.3) — alta prioridad de retención.
 *
 * El PRD es explícito: un usuario `pre_arrival` que llega a EE. UU. es el
 * momento de mayor necesidad de todo el ciclo de vida y el de mayor riesgo de
 * abandono si la app le sigue mostrando contenido de preparación. Por eso:
 *
 *   1. Banner PERMANENTE y discreto en el dashboard `pre_arrival`.
 *   2. Mini-flujo de 2 campos: estado + fecha de llegada.
 *   3. `recordLocationTransition()` migra el contexto y RECALCULA todo el ranking.
 *   4. Pantalla propia de bienvenida — "Merece su propia pantalla, no un toggle
 *      escondido en Configuración".
 *
 * Eventos §7.5: `transition_banner_shown`, `transition_banner_clicked`,
 * `location_context_changed` {from, to, trigger_source, days_since_signup}.
 */

import { useEffect, useRef, useState } from "react";
import { ArrowRight, PlaneLanding } from "lucide-react";
import { track } from "@/lib/analytics/track";
import type { StoredProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { usePanel } from "./panel-context";
import { daysBetween, stateComboboxItems, todayInputValue } from "./panel-utils";

/** El banner es permanente; "Todavía no" solo lo calla durante esta sesión. */
const SNOOZE_KEY = "andex_panel_arrival_snoozed";

export type ArrivalFlowProps = {
  /** Se llama tras migrar el contexto, con el perfil ya actualizado. */
  onArrived: (profile: StoredProfile) => void;
};

export function ArrivalFlow({ onArrived }: ArrivalFlowProps) {
  const { dict, lang, profile, readOnly, applyTransition } = usePanel();
  const b = dict.panel.arrivalBanner;

  const [snoozed, setSnoozed] = useState(false);
  const [open, setOpen] = useState(false);
  const [stateUS, setStateUS] = useState<string | null>(null);
  const [arrivalDate, setArrivalDate] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const shownRef = useRef(false);

  const isPreArrival = profile?.locationContext === "pre_arrival";

  useEffect(() => {
    try {
      setSnoozed(window.sessionStorage.getItem(SNOOZE_KEY) === "1");
    } catch {
      /* sessionStorage bloqueado: el banner se muestra, que es lo correcto */
    }
  }, []);

  // §7.5 — `transition_banner_shown` una sola vez por montaje del banner.
  useEffect(() => {
    if (!isPreArrival || snoozed || shownRef.current || !profile) return;
    shownRef.current = true;
    track("transition_banner_shown", {
      days_since_signup: daysBetween(profile.createdAt, new Date()),
    });
  }, [isPreArrival, snoozed, profile]);

  if (!profile || !isPreArrival || snoozed) return null;

  function snooze() {
    try {
      window.sessionStorage.setItem(SNOOZE_KEY, "1");
    } catch {
      /* ignorar */
    }
    setSnoozed(true);
  }

  function openFlow() {
    track("transition_banner_clicked");
    setStateUS(null);
    setArrivalDate(todayInputValue());
    setError(undefined);
    setOpen(true);
  }

  async function confirm() {
    if (!stateUS) {
      setError(b.stateError);
      return;
    }
    setSaving(true);
    const from = profile?.locationContext ?? "pre_arrival";
    const createdAt = profile?.createdAt ?? null;

    const updated = await applyTransition({
      toContext: "in_us",
      stateUS,
      arrivalDate: arrivalDate || undefined,
      trigger: "banner",
    });
    setSaving(false);

    if (!updated) {
      toast.error(dict.perfil.toasts.saveFailed);
      return;
    }

    track("location_context_changed", {
      from,
      to: "in_us",
      trigger_source: "banner",
      days_since_signup: daysBetween(createdAt, new Date()),
    });

    setOpen(false);
    toast.success(b.recalculatedToast);
    onArrived(updated);
  }

  return (
    <>
      {/* Banner permanente y discreto (§3.2.3): informa, no interrumpe. */}
      <section
        aria-labelledby="banner-llegada"
        className="rounded-lg border border-line bg-teal-soft p-4"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface text-teal-deep"
          >
            <PlaneLanding className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="banner-llegada" className="font-heading text-h3 text-ink">
              {b.title}
            </h2>
            <p className="mt-0.5 text-body text-muted">{b.body}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openFlow} disabled={readOnly}>
              {b.cta}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <Button variant="ghost" onClick={snooze}>
              {b.dismiss}
            </Button>
          </div>
        </div>
        {readOnly ? (
          <p className="mt-2 text-caption text-muted">{dict.panel.shell.readOnlyBlocked}</p>
        ) : null}
      </section>

      {/* Mini-flujo de 2 campos: estado + fecha de llegada (§3.2.3). */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={b.flowTitle}
        variant="fullscreen-mobile"
        closeLabel={dict.common.aria.closeModal}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {b.cancel}
            </Button>
            <Button
              onClick={confirm}
              loading={saving}
              loadingLabel={dict.common.actions.loading}
            >
              {b.confirm}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Combobox
            label={b.stateLabel}
            placeholder={b.statePlaceholder}
            items={stateComboboxItems(lang)}
            value={stateUS}
            onChange={(value) => {
              setStateUS(value);
              setError(undefined);
            }}
            error={error}
            emptyText={dict.wizard.step2.inUs.stateEmpty}
            groupLabels={dict.wizard.step2.inUs.stateGroups}
          />

          <ArrivalDateField
            label={b.arrivalDateLabel}
            help={b.arrivalDateHelp}
            value={arrivalDate}
            max={todayInputValue()}
            onChange={setArrivalDate}
          />
        </div>
      </Modal>
    </>
  );
}

/**
 * Campo de fecha. No usa <Input> de UI porque su `type` está acotado a
 * text/email/tel/password y aquí hace falta el selector nativo de fecha
 * (mucho mejor en móvil que escribir un formato). Mismas clases, mismo
 * contrato de accesibilidad: label visible y ayuda asociada.
 */
function ArrivalDateField({
  label,
  help,
  value,
  max,
  onChange,
}: {
  label: string;
  help: string;
  value: string;
  max: string;
  onChange: (value: string) => void;
}) {
  const id = "andex-arrival-date";
  const helpId = `${id}-help`;
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-label font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        max={max}
        aria-describedby={helpId}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "block w-full min-h-11 rounded-sm border border-line bg-surface px-3.5 text-body text-ink",
          "transition-colors duration-150 hover:border-muted focus:border-teal-deep",
        )}
      />
      <p id={helpId} className="mt-1.5 text-caption text-muted">
        {help}
      </p>
    </div>
  );
}
