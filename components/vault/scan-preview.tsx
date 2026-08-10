"use client";

/**
 * BÓVEDA · ESCÁNER — resultado y modo de realce.
 *
 * El modo por defecto es COLOR, y eso se explica en pantalla en una frase.
 * No es una preferencia estética: los sellos, las firmas en tinta y los
 * hologramas son parte de la prueba, y el blanco y negro los borra. Alguien
 * puede presentar un documento inválido por elegir mal aquí, así que la
 * razón se dice antes de que elija, no después.
 *
 * Cada cambio de modo vuelve a procesar la página desde la foto original.
 * Nunca se procesa sobre lo ya procesado: encadenar realces destruye el
 * documento.
 */

import { useEffect, useId, useRef, useState } from "react";
import { Info, RefreshCw, TriangleAlert } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { processPage, type EnhanceMode, type Quad } from "@/lib/scanner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useImageDataUrl } from "./corner-adjuster";

// ─── Copy ────────────────────────────────────────────────

export type ScanPreviewCopy = {
  title: string;
  /** Etiqueta del grupo de modos. Ej.: "Cómo se ve el documento". */
  modeLegend: string;
  /** Nombre visible de cada modo. */
  modes: Record<EnhanceMode, string>;
  /**
   * La frase que evita un documento inválido. Ej.: "Se queda en color
   * porque los sellos y las firmas son parte de la prueba."
   */
  colorReason: string;
  /** Aviso extra al salir del color. */
  colorWarning: string;
  processing: string;
  processingError: string;
  retryLabel: string;
  adjustLabel: string;
  addPageLabel: string;
  finishLabel: string;
  imageAlt: string;
};

// ─── Props ───────────────────────────────────────────────

export type ScanPreviewProps = {
  /** La foto ORIGINAL. El realce siempre parte de aquí. */
  image: ImageData;
  /** Recorte confirmado en el paso anterior. */
  quad: Quad;
  copy: ScanPreviewCopy;
  mode: EnhanceMode;
  onModeChange: (mode: EnhanceMode) => void;
  /** La página lista, cada vez que termina de procesarse. */
  onProcessed?: (page: ImageData, mode: EnhanceMode) => void;
  onAdjust: () => void;
  onAddPage: () => void;
  onFinish: () => void;
  /** Aviso corto en la cabecera (p. ej. "Te quedan 2 fotos"). */
  notice?: string;
  className?: string;
};

const MODE_ORDER: readonly EnhanceMode[] = ["document", "gray", "bw", "photo"];

export function ScanPreview({
  image,
  quad,
  copy,
  mode,
  onModeChange,
  onProcessed,
  onAdjust,
  onAddPage,
  onFinish,
  notice,
  className,
}: ScanPreviewProps) {
  const [processed, setProcessed] = useState<ImageData | null>(null);
  const [processing, setProcessing] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const reduced = useReducedMotion();
  const src = useImageDataUrl(processed);
  const modeGroupName = useId();

  // El callback puede cambiar de identidad en cada render del padre; si
  // entrara en las dependencias, se reprocesaría la página sin motivo.
  const onProcessedRef = useRef(onProcessed);
  useEffect(() => {
    onProcessedRef.current = onProcessed;
  }, [onProcessed]);

  useEffect(() => {
    let cancelled = false;
    setProcessing(true);
    setFailed(false);

    processPage(image, quad, mode)
      .then((result) => {
        if (cancelled) return;
        setProcessed(result);
        onProcessedRef.current?.(result, mode);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setProcessing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [image, quad, mode, attempt]);

  const busy = processing || failed || !src;
  const colorLoss = mode === "bw" || mode === "gray";

  return (
    <div className={cn("flex min-h-0 w-full flex-1 flex-col bg-page", className)}>
      {/* ── Cabecera ── */}
      <div className="shrink-0 px-4 pb-2 pt-4 sm:px-6">
        {notice ? (
          <p className="mb-2 inline-flex items-center gap-2 rounded-sm bg-surface-alt px-3 py-1.5 text-caption text-muted">
            <Info aria-hidden="true" className="size-4 shrink-0" />
            {notice}
          </p>
        ) : null}
        <h2 className="font-heading text-h3 text-ink">{copy.title}</h2>
      </div>

      {/* ── La página ── */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-2 sm:px-6">
        <div
          className="relative flex max-h-full w-full max-w-2xl items-center justify-center"
          aria-busy={processing || undefined}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={copy.imageAlt}
              className={cn(
                "max-h-full w-auto max-w-full rounded-lg border border-line object-contain shadow-md",
                !reduced && "transition-opacity duration-200",
                processing && "opacity-50",
              )}
            />
          ) : (
            <div
              aria-hidden="true"
              className="andex-shimmer h-64 w-full max-w-sm rounded-lg"
            />
          )}

          {processing ? (
            <p
              role="status"
              className="absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-sm bg-navy/80 px-3 py-2 text-center text-body text-white"
            >
              {copy.processing}
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Modo de realce ── */}
      <div className="shrink-0 border-t border-line bg-surface px-4 py-4 sm:px-6">
        {failed ? (
          <div
            role="alert"
            className="mb-3 flex flex-wrap items-center gap-3 rounded-sm bg-danger-soft px-3 py-2 text-body text-danger"
          >
            <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
            <span className="min-w-0 flex-1">{copy.processingError}</span>
            <Button
              variant="secondary"
              onClick={() => setAttempt((n) => n + 1)}
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              {copy.retryLabel}
            </Button>
          </div>
        ) : null}

        {/* Radios de verdad, no botones con aria-checked: así las flechas
            recorren las opciones sin que haya que programarlo. */}
        <fieldset className="mb-3" disabled={processing}>
          <legend className="mb-2 text-label text-muted">{copy.modeLegend}</legend>
          <div className="flex flex-wrap gap-2">
            {MODE_ORDER.map((option) => {
              const active = option === mode;
              return (
                <label
                  key={option}
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center rounded-sm border px-4 text-body transition-colors",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-deep",
                    "has-[:disabled]:cursor-default has-[:disabled]:opacity-50",
                    active
                      ? "border-teal-deep bg-teal-soft font-medium text-ink"
                      : "border-line bg-surface text-muted hover:bg-surface-alt hover:text-ink",
                  )}
                >
                  <input
                    type="radio"
                    name={modeGroupName}
                    value={option}
                    checked={active}
                    onChange={() => onModeChange(option)}
                    className="sr-only"
                  />
                  {copy.modes[option]}
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* La razón del color por defecto. Siempre visible; si el usuario
            sale del color, sube de tono. */}
        <p
          className={cn(
            "mb-4 flex items-start gap-2 rounded-sm px-3 py-2 text-body",
            colorLoss
              ? "bg-amber-soft text-amber-deep"
              : "bg-surface-alt text-muted",
          )}
        >
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{colorLoss ? copy.colorWarning : copy.colorReason}</span>
        </p>

        {/* ── Acciones ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" fullWidth onClick={onAdjust} className="sm:w-auto">
            {copy.adjustLabel}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={busy}
            onClick={onAddPage}
            className="sm:w-auto"
          >
            {copy.addPageLabel}
          </Button>
          <Button
            fullWidth
            disabled={busy}
            onClick={onFinish}
            className="sm:w-auto"
          >
            {copy.finishLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
