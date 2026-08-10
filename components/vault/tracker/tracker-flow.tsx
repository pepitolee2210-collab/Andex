"use client";

/**
 * BÓVEDA · CONSULTA GUIADA — el detalle de un trámite.
 *
 * ANDEX no consulta nada: prepara a la persona y la deja en la puerta del
 * portal oficial, que es gratuito y no es nuestro (§6). Todo el valor está en
 * llegar allí sabiendo qué número hace falta, de dónde sacarlo y qué se va a
 * ver al otro lado.
 *
 * El orden de la pantalla es el orden real de la tarea:
 *   qué necesitas → dónde encontrarlo → tu número → qué vas a ver → ir.
 *
 * **La validación de formato es la pieza importante.** Un número de recibo
 * mal copiado devuelve "no encontramos tu caso" en el sitio del gobierno, y
 * quien lo lea va a entender que su caso desapareció. Por eso se comprueba
 * antes de copiar y, si no cuadra, se avisa con calma y con la forma exacta
 * que debe tener — el mismo texto del diccionario que explica el formato.
 *
 * El número escrito NO se guarda, ni se manda a ningún sitio, ni entra en la
 * analítica: vive en el estado de este componente y muere al salir.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowLeft,
  Car,
  Check,
  ClipboardCopy,
  ExternalLink,
  FileText,
  Gavel,
  Info,
  LifeBuoy,
  Plane,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { track } from "@/lib/analytics/track";
import { ROUTES } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VaultCommonCopy, VaultTrackerCopy } from "../vault-format";

// ─── Los cuatro trámites ─────────────────────────────────

export const TRACKER_FLOWS = ["uscis", "eoir", "i94", "dmv"] as const;
export type TrackerFlowId = (typeof TRACKER_FLOWS)[number];

/**
 * Portales oficiales. URLs EXACTAS y verificadas; aquí no se inventa ninguna
 * ni se acorta a un buscador. Un enlace equivocado en esta pantalla manda a
 * alguien a un sitio que se hace pasar por el gobierno.
 */
export const TRACKER_PORTALS: Record<TrackerFlowId, string> = {
  uscis: "https://egov.uscis.gov/",
  eoir: "https://portal.eoir.justice.gov/",
  i94: "https://i94.cbp.dhs.gov/",
  dmv: "https://dld.utah.gov/",
};

export const TRACKER_ICONS: Record<TrackerFlowId, LucideIcon> = {
  uscis: FileText,
  eoir: Gavel,
  i94: Plane,
  dmv: Car,
};

/**
 * Forma común de los cuatro bloques del diccionario. Cada trámite trae lo
 * suyo (el A-number sólo lo pide EOIR, la lista de papeles sólo el DMV), así
 * que lo que no comparten los cuatro es opcional.
 */
type FlowCopy = {
  name: string;
  summary: string;
  needs: string;
  willSee: string;
  whereToFind?: string;
  inputLabel?: string;
  warning?: string;
  whyItMatters?: string;
  checklist?: string;
  checklistWarning?: string;
};

// ─── Validación de los números ───────────────────────────

/**
 * Normaliza y valida. Devuelve el número tal y como lo espera el portal, o
 * `null` si no tiene la forma que debe tener.
 *
 * Se es indulgente con lo que la gente escribe (minúsculas, espacios,
 * guiones) y estricto con lo que se copia: al portal va la forma canónica.
 */
type Normalizer = (raw: string) => string | null;

const NORMALIZERS: Record<TrackerFlowId, Normalizer | null> = {
  // Recibo de USCIS: 3 letras de centro de servicio + 10 dígitos.
  uscis: (raw) => {
    const value = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return /^[A-Z]{3}[0-9]{10}$/.test(value) ? value : null;
  },
  // Número A: la letra A y 9 dígitos. Mucha gente lo dicta sin la A y otra
  // gente lo escribe con 8 dígitos (los antiguos): con 9 se le pone la A
  // delante; con 8 no se adivina nada, se avisa del formato.
  eoir: (raw) => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const value = /^[0-9]{9}$/.test(cleaned) ? `A${cleaned}` : cleaned;
    return /^A[0-9]{9}$/.test(value) ? value : null;
  },
  // El I-94 se busca con los datos del pasaporte y el DMV no pide número:
  // no hay nada que copiar.
  i94: null,
  dmv: null,
};

/** Copia al portapapeles con respaldo para navegadores que no lo permiten. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Sin permiso o fuera de contexto seguro: se intenta el respaldo.
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}

/** Cuánto se queda el aviso de "copiado" antes de irse solo. */
const TOAST_MS = 5000;

// ─── Componente ──────────────────────────────────────────

export type TrackerFlowProps = {
  id: TrackerFlowId;
  copy: VaultTrackerCopy;
  common: VaultCommonCopy;
  onBack: () => void;
};

export function TrackerFlow({ id, copy, common, onBack }: TrackerFlowProps) {
  const flow: FlowCopy = copy[id];
  const normalize = NORMALIZERS[id];
  const wantsNumber = normalize !== null && flow.inputLabel !== undefined;

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  // `<Input>` no reenvía ref, así que el campo se localiza por su id — el
  // mismo que el componente usa para atar label, error y aria-describedby.
  const inputId = useId();

  function field(): HTMLInputElement | null {
    const node = document.getElementById(inputId);
    return node instanceof HTMLInputElement ? node : null;
  }

  // Al abrir un trámite el foco se va a su título: quien navega con teclado o
  // con lector de pantalla aterriza donde empieza el contenido nuevo.
  useEffect(() => {
    headingRef.current?.focus();
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleCopy() {
    if (!normalize) return;
    const normalized = normalize(value);

    if (!normalized) {
      // Con calma y con la forma exacta: el mismo texto que explica el
      // formato es el que corrige el error.
      setError(flow.needs);
      field()?.focus();
      return;
    }

    setError(null);
    // Se enseña lo que se va a pegar, sin espacios ni guiones.
    setValue(normalized);

    if (await copyToClipboard(normalized)) {
      setToast(copy.copied);
    } else {
      // Sin portapapeles queda el camino manual: el número seleccionado.
      field()?.select();
    }
  }

  const Icon = TRACKER_ICONS[id];

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-body text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4 shrink-0" />
        {common.back}
      </button>

      <div className="mt-2 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-soft text-teal-deep"
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-h2 text-ink outline-none"
          >
            {flow.name}
          </h3>
          <p className="mt-1 text-body text-muted">{flow.summary}</p>
        </div>
      </div>

      {/* La advertencia de la corte va arriba y con peso: faltar a una
          audiencia puede acabar en una orden de deportación en ausencia. */}
      {flow.warning ? (
        <p className="mt-4 flex items-start gap-2.5 rounded-lg border border-danger bg-danger-soft p-3.5 text-body font-medium text-ink">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
          <span className="min-w-0">{flow.warning}</span>
        </p>
      ) : null}

      {/* 1 — Qué necesitas y dónde está. */}
      <section className="mt-5">
        <h4 className="font-heading text-h3 text-ink">
          {flow.checklist ?? copy.whatYouNeed}
        </h4>
        <p className="mt-1.5 text-body text-ink">{flow.needs}</p>
        {flow.whereToFind ? (
          <p className="mt-2 text-body text-muted">{flow.whereToFind}</p>
        ) : null}
        {flow.checklistWarning ? (
          <p className="mt-3 flex items-start gap-2.5 rounded-lg bg-amber-soft p-3.5 text-body text-ink">
            <TriangleAlert
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-amber-deep"
            />
            <span className="min-w-0">{flow.checklistWarning}</span>
          </p>
        ) : null}
      </section>

      {/* 2 — Tu número, listo para pegar. El `aria-live` del contenedor hace
          que el aviso de formato se oiga: aparece mientras el foco sigue en
          el botón de copiar. */}
      {wantsNumber && flow.inputLabel ? (
        <section
          aria-live="polite"
          className="mt-5 rounded-lg border border-line bg-surface-alt p-3.5 sm:p-4"
        >
          <Input
            id={inputId}
            label={flow.inputLabel}
            value={value}
            error={error ?? undefined}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={24}
            inputClassName="bg-surface font-mono tracking-wide"
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
          />
          <Button
            variant="secondary"
            className="mt-3"
            onClick={handleCopy}
            disabled={value.trim().length === 0}
          >
            <ClipboardCopy aria-hidden="true" className="size-4.5" />
            {copy.copyNumber}
          </Button>
        </section>
      ) : null}

      {/* 3 — Qué vas a ver al otro lado. */}
      <section className="mt-5">
        <h4 className="font-heading text-h3 text-ink">{copy.whatYouWillSee}</h4>
        <p className="mt-1.5 text-body text-ink">{flow.willSee}</p>
        {flow.whyItMatters ? (
          <p className="mt-3 flex items-start gap-2.5 rounded-lg bg-teal-soft p-3.5 text-body text-ink">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal-deep" />
            <span className="min-w-0">{flow.whyItMatters}</span>
          </p>
        ) : null}
      </section>

      {/* 4 — La puerta del portal oficial. */}
      <div className="mt-6">
        <Button
          href={TRACKER_PORTALS[id]}
          target="_blank"
          rel="noopener noreferrer"
          fullWidth
          className="sm:w-auto"
          // §1.2 / §7.5 — qué trámite se consulta de verdad es lo que decide
          // qué módulo se construye después. Viaja el trámite, nunca el
          // número: ese dato no sale de la pantalla.
          onClick={() => track("vault_portal_opened", { procedure: id })}
        >
          {copy.goToPortal}
          <ExternalLink aria-hidden="true" className="size-4.5" />
        </Button>
        <p className="mt-2 flex items-center gap-1.5 text-caption text-muted">
          <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
          {copy.opensExternal}
        </p>
      </div>

      {/* 5 — Si se complica, hay alguien. */}
      <section className="mt-6 rounded-lg border border-line bg-surface p-4">
        <h4 className="flex items-center gap-2 font-heading text-h3 text-ink">
          <LifeBuoy aria-hidden="true" className="size-5 shrink-0 text-teal-deep" />
          {copy.help.title}
        </h4>
        <p className="mt-1.5 text-body text-muted">{copy.help.body}</p>
        <Button href={ROUTES.contacto} variant="secondary" className="mt-3">
          {copy.help.cta}
        </Button>
        <p className="mt-2 text-caption text-muted">{copy.help.availability}</p>
      </section>

      {/* Confirmación de copiado. `role="status"` lo anuncia sin robar el foco;
          `bottom-20` lo deja por encima de la barra de pestañas del móvil. */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-sm items-center gap-2.5 rounded-md bg-navy px-4 py-3 text-body text-white shadow-lg sm:bottom-6"
        >
          <Check aria-hidden="true" className="size-5 shrink-0" />
          <span className="min-w-0">{toast}</span>
        </div>
      ) : null}
    </div>
  );
}
