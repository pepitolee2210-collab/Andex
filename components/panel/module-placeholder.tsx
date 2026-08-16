"use client";

/**
 * MÓDULO EN CONSTRUCCIÓN — la pantalla del sistema de diseño
 * (`screens.jsx` → `Construccion`, componente `ComingSoonModule`).
 *
 * Sirve a los cuatro módulos que abren durante el piloto: migración,
 * finanzas, negocio y empleo.
 *
 * ── Qué manda aquí, según el diseño ──
 *
 * «Dice qué falta y cuándo, **sin lista de espera ni contador**.» Y de la
 * ficha del componente: *"Never promise a date. «Falta poco» is the
 * strongest thing this screen may say."* Por eso no hay fecha de apertura,
 * ni cuenta atrás, ni «ya somos N esperando»: es exactamente el registro
 * visual de quien estafó a este público, y el PRD lo veta.
 *
 * ── La forma, de arriba abajo ──
 *
 *   1. Insignia «En construcción» (`tone="building"`).
 *   2. El nombre del módulo, grande.
 *   3. Una línea que dice el estado y nada más.
 *   4. Lo que se va a poder hacer, NUMERADO — no con vistos. Un número
 *      dice «esto es una lista de cosas por venir»; un visto dice «esto ya
 *      está hecho», que aquí sería mentira.
 *   5. La pregunta abierta, 240 caracteres. *"The free-text answer is a
 *      real product signal"*: es la investigación de producto más barata
 *      que se va a hacer, y por eso se le da el doble de sitio que al
 *      campo libre de la entrevista (§3.2.1 regla 3 lo acota a 120).
 *
 * ── La confirmación ocurre EN EL MISMO BOTÓN ──
 *
 * Sin toast y sin modal, como en el resto del sistema («Apuntarme» →
 * «Te avisamos 30 min antes»). El botón cambia de tono, de icono y de
 * texto, y el texto escrito se queda en pantalla: quien acaba de contar
 * algo quiere seguir viéndolo.
 *
 * Aquí se emite `module_opened` (§7.5), el evento clave del MVP: se
 * dispara al abrirse la pantalla, así que cuenta igual una entrada desde
 * la hero card, desde el grid o desde un enlace directo.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellRing, Check, ChevronLeft } from "lucide-react";
import { ROUTES } from "@/lib/config";
import { track } from "@/lib/analytics/track";
import { getDataStore } from "@/lib/data";
import type { ModuleId } from "@/lib/types";
import { sanitizeFreeText } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Glyph,
  KitBadge,
  KitButton,
  PromiseItem,
  SectionLabel,
} from "@/components/ui/kit";
import { usePanel } from "./panel-context";
import { moduleTitle } from "./panel-utils";

/**
 * Tope del campo libre. El PRD no fija uno para esta pregunta (a diferencia de
 * §3.2.1 regla 3, que acota el wizard a 120): aquí se da el doble de espacio
 * a propósito, porque este texto es "la investigación de producto más barata
 * que vas a hacer" y cortar la respuesta a la mitad la desperdicia.
 */
const FREE_TEXT_MAX = 240;

/** Rótulos que además nombran a lo que va debajo. */
const PROMESAS_ID = "modulo-promesas";
const PREGUNTA_ID = "modulo-pregunta";

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
      <div className="w-full" aria-busy="true">
        <Skeleton variant="card" className="h-32 rounded-xl" />
        <Skeleton lines={4} className="mt-6" />
      </div>
    );
  }

  const variant = profile.locationContext;
  const title = moduleTitle(dict, moduleId, variant);
  const copy = dict.modules.byModule[moduleId][variant];
  const p = dict.modules.placeholder;

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
    <article className="w-full">
      {/* En el diseño el «Atrás» sustituye a la marca dentro de la barra de
          navegación. Aquí la barra la dibuja el armazón, así que la vuelta
          abre la pantalla: mismo control, una fila más abajo. */}
      <Link href={ROUTES.panel} className="navback">
        <Glyph name="chevron-left" icon={ChevronLeft} size={22} strokeWidth={2.1} />
        {p.back}
      </Link>

      <div className="mt-1.5">
        <KitBadge tone="building">{p.badge}</KitBadge>
      </div>

      <h1 className="largeTitle">{title}</h1>
      <p className="mt-3 text-body text-muted">{p.statusLine}</p>

      {/* ── Lo que se va a poder hacer ── */}
      <SectionLabel as="h2" id={PROMESAS_ID}>
        {p.featuresTitle}
      </SectionLabel>
      <div aria-labelledby={PROMESAS_ID} className="flex flex-col gap-3.5">
        {copy.features.map((feature, i) => (
          <PromiseItem key={feature} n={i + 1}>
            {feature}
          </PromiseItem>
        ))}
      </div>

      {/* ── La pregunta abierta ── */}
      <SectionLabel as="h2" id={PREGUNTA_ID}>
        {p.captureQuestion}
      </SectionLabel>

      <textarea
        id="captura-texto"
        rows={3}
        value={freeText}
        maxLength={FREE_TEXT_MAX}
        placeholder={p.capturePlaceholder}
        disabled={readOnly}
        readOnly={submitted}
        aria-labelledby={PREGUNTA_ID}
        aria-describedby="captura-contador"
        onChange={(e) => setFreeText(e.target.value)}
        className="textarea"
      />
      <p id="captura-contador" className="charcount">
        {p.captureCounter(freeText.length, FREE_TEXT_MAX)}
      </p>

      {error ? (
        <p role="alert" className="mt-2 text-body text-danger">
          {error}
        </p>
      ) : null}

      {/* La confirmación pasa aquí dentro: sin toast, sin modal. */}
      <div role="status" className="mt-3">
        <KitButton
          wide
          kind={submitted ? "quiet" : "primary"}
          iconName={submitted ? "check" : "bell"}
          icon={submitted ? Check : BellRing}
          onClick={submitted ? undefined : handleSubmit}
          disabled={readOnly || submitting}
        >
          {submitted ? p.submitted : submitting ? p.submitting : p.submit}
        </KitButton>
      </div>

      {readOnly ? (
        <p className="mt-3 text-body text-muted">{dict.panel.shell.readOnlyBlocked}</p>
      ) : null}
    </article>
  );
}
