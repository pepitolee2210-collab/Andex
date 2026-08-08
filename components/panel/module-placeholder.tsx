"use client";

/**
 * PANTALLA PLACEHOLDER DE MÓDULO (§4.6).
 *
 * "Cada módulo abre a una pantalla completa, no a un toast de 'próximamente'."
 * Los cinco elementos que exige el PRD, en orden:
 *
 *   1. Header del módulo con su icono, nombre y color.
 *   2. Descripción de qué va a resolver, en lenguaje del usuario.
 *   3. Lista de las 3–4 funcionalidades que traerá.
 *   4. Captura de interés: "¿Qué es lo primero que necesitas de este módulo?"
 *      + campo libre + "Avísame cuando esté listo" → `module_interest_signals`.
 *   5. Enlace de retorno al dashboard.
 *
 * El contenido cambia según `contentVariant` (§4.2): un `pre_arrival` que abre
 * M7 lee "cómo funciona el mercado laboral", no vacantes.
 *
 * Aquí se emite `module_opened` (§7.5), el evento clave del MVP: se dispara al
 * abrirse la pantalla, así que cuenta igual una entrada desde la hero card,
 * desde el grid, desde el sidebar o desde un enlace directo.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, BellRing, Check } from "lucide-react";
import { ROUTES } from "@/lib/config";
import { track } from "@/lib/analytics/track";
import { getDataStore } from "@/lib/data";
import { moduleById } from "@/lib/catalogs/modules";
import type { ModuleId } from "@/lib/types";
import { sanitizeFreeText } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModuleIcon } from "@/components/module-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { usePanel } from "./panel-context";
import { moduleTitle } from "./panel-utils";

/**
 * Tope del campo libre. El PRD no fija uno para esta pregunta (a diferencia de
 * §3.2.1 regla 3, que acota el wizard a 120): aquí se da el doble de espacio
 * a propósito, porque este texto es "la investigación de producto más barata
 * que vas a hacer" y cortar la respuesta a la mitad la desperdicia.
 */
const FREE_TEXT_MAX = 240;

export function ModulePlaceholder({ moduleId }: { moduleId: ModuleId }) {
  const { dict, loading, profile, readOnly, openModule } = usePanel();
  /** Último módulo por el que ya se emitió el evento (no un simple booleano:
   *  al navegar de un módulo a otro React reutiliza este componente). */
  const openedRef = useRef<ModuleId | null>(null);

  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // §7.5 — `module_opened` {module_id, position_in_grid, was_recommended}.
  // Una sola vez por montaje: el guard sobrevive al doble render de desarrollo.
  useEffect(() => {
    if (loading || !profile) return;
    if (openedRef.current === moduleId) return;
    openedRef.current = moduleId;
    openModule(moduleId);
  }, [loading, profile, moduleId, openModule]);

  // Al cambiar de módulo, la captura de interés empieza en blanco.
  useEffect(() => {
    setFreeText("");
    setSubmitted(false);
    setError(null);
  }, [moduleId]);

  if (loading || !profile) {
    return (
      <div className="mx-auto w-full max-w-2xl" aria-busy="true">
        <Skeleton variant="card" className="h-32 rounded-xl" />
        <Skeleton lines={4} className="mt-6" />
      </div>
    );
  }

  const meta = moduleById(moduleId);
  const variant = profile.locationContext;
  const title = moduleTitle(dict, moduleId, variant);
  const copy = dict.modules.byModule[moduleId][variant];
  const p = dict.modules.placeholder;

  // D16 — el accent color del seed §7.4 solo como TINTE de superficie tras el
  // icono; jamás como color de texto ni fondo pleno (§2.1.1).
  const accentTile: CSSProperties = {
    backgroundColor: `color-mix(in srgb, ${meta.accentColor} 14%, transparent)`,
  };

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const cleaned = sanitizeFreeText(freeText, FREE_TEXT_MAX);
    try {
      await getDataStore().submitInterestSignal({
        moduleId,
        freeText: cleaned.length > 0 ? cleaned : null,
        wantsNotification: true,
      });
      track("interest_signal_submitted", {
        module_id: moduleId,
        has_free_text: cleaned.length > 0,
      });
      setSubmitted(true);
    } catch {
      setError(p.submitFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="mx-auto w-full max-w-2xl">
      {/* 1 — Header: icono, nombre y color del módulo. */}
      <header className="rounded-xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <span
            style={accentTile}
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-md text-ink"
          >
            <ModuleIcon slug={meta.slug} size={26} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-h1 text-ink">{title}</h1>
              <Badge variant="neutral">{p.badge}</Badge>
            </div>
            <p className="mt-1 text-caption text-muted">{p.statusLine}</p>
          </div>
        </div>

        {/* 2 — Qué va a resolver, en lenguaje del usuario. */}
        <p className="mt-4 text-body-lg text-ink">{copy.purpose}</p>
      </header>

      {/* 3 — Las 3–4 funcionalidades que traerá. */}
      <section aria-labelledby="funcionalidades" className="mt-6">
        <h2 id="funcionalidades" className="font-heading text-h3 text-ink">
          {p.featuresTitle}
        </h2>
        <ul className="mt-3 space-y-2">
          {copy.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-body text-ink">
              <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-teal-deep" />
              <span className="min-w-0">{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 4 — Captura de interés. */}
      <section
        aria-labelledby="captura-interes"
        className="mt-6 rounded-lg border border-line bg-surface p-4 shadow-sm sm:p-5"
      >
        {submitted ? (
          <div aria-live="polite">
            <h2
              id="captura-interes"
              className="flex items-center gap-2 font-heading text-h3 text-ink"
            >
              <BellRing aria-hidden="true" className="size-5 text-teal-deep" />
              {p.submittedTitle}
            </h2>
            <p className="mt-1.5 text-body text-muted">{p.submittedBody}</p>
          </div>
        ) : (
          <>
            <h2 id="captura-interes" className="font-heading text-h3 text-ink">
              {p.captureQuestion}
            </h2>
            <p className="mt-1 text-body text-muted">{p.captureHelp}</p>

            <label htmlFor="captura-texto" className="sr-only">
              {p.captureQuestion}
            </label>
            <textarea
              id="captura-texto"
              rows={3}
              value={freeText}
              maxLength={FREE_TEXT_MAX}
              placeholder={p.capturePlaceholder}
              disabled={readOnly}
              aria-describedby="captura-contador"
              onChange={(e) => setFreeText(e.target.value)}
              // `placeholder:text-muted` y no `text-disabled`: piso AA del
              // placeholder, ver la nota en components/ui/input.tsx.
              className="mt-3 block w-full rounded-sm border border-line bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-muted transition-colors duration-150 hover:border-muted focus:border-teal-deep disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-disabled"
            />
            <p id="captura-contador" className="mt-1.5 text-caption text-muted">
              {p.captureCounter(freeText.length, FREE_TEXT_MAX)}
            </p>

            {error ? (
              <p role="alert" className="mt-2 text-caption text-danger">
                {error}
              </p>
            ) : null}

            <Button
              className="mt-4"
              onClick={handleSubmit}
              loading={submitting}
              loadingLabel={p.submitting}
              disabled={readOnly}
            >
              {p.submit}
            </Button>
            {readOnly ? (
              <p className="mt-2 text-caption text-muted">
                {dict.panel.shell.readOnlyBlocked}
              </p>
            ) : null}
          </>
        )}
      </section>

      {/* 5 — Enlace de retorno al dashboard. */}
      <p className="mt-6">
        <Link
          href={ROUTES.panel}
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-body text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {p.backToPanel}
        </Link>
      </p>
    </article>
  );
}
