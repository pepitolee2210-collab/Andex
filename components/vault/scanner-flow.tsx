"use client";

/**
 * BÓVEDA · ESCÁNER — el orquestador.
 *
 *   idle → capturing → adjusting → previewing → review → PDF
 *
 * Se monta a pantalla completa (`fixed inset-0`) porque escanear es una
 * tarea de una sola cosa: la cámara necesita todo el alto y el pulgar
 * necesita el botón abajo. El contenedor se comporta como un diálogo —
 * `aria-modal`, foco atrapado, Escape cierra— para que quien navega con
 * teclado no se pierda por detrás de la pantalla.
 *
 * `idle` no es una pantalla de relleno: es donde se dice, ANTES de que el
 * navegador pida permiso, que la foto no sale del teléfono. Pedir la cámara
 * a bocajarro a alguien que está fotografiando su permiso de trabajo es la
 * mejor forma de que pulse "Denegar".
 *
 * Todo el copy entra por props: aquí no se importa `@/lib/i18n`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Download,
  ExternalLink,
  FileDown,
  Images,
  Loader2,
  Plus,
  Share2,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import {
  canSharePdf,
  downloadBlob,
  imageDataFromBlob,
  pagesToPdf,
  sharePdf,
  toJpeg,
  toThumbnail,
  type EnhanceMode,
  type PageSizeName,
  type Quad,
  type ScannedPage,
} from "@/lib/scanner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { CornerAdjuster, type CornerAdjusterCopy } from "./corner-adjuster";
import { PageList, fillTemplate, type PageListCopy } from "./page-list";
import { ScanPreview, type ScanPreviewCopy } from "./scan-preview";
import { ScannerCamera, type ScannerCameraCopy } from "./scanner-camera";

// ─── Copy ────────────────────────────────────────────────

export type ScannerStartCopy = {
  title: string;
  intro: string;
  /** El argumento de venta del módulo, dicho sin tecnicismos. */
  privacyTitle: string;
  privacyBody: string;
  startLabel: string;
  galleryLabel: string;
  cancelLabel: string;
};

export type ScannerReviewCopy = {
  title: string;
  subtitle: string;
  /** Etiqueta del selector de tamaño. Ej.: "Tamaño de la hoja". */
  pageSizeLegend: string;
  /** Nombre visible de cada tamaño. */
  pageSizes: Record<PageSizeName, string>;
  /** Por qué Carta por defecto, en una línea. */
  pageSizeNote: string;
  addPageLabel: string;
  finishLabel: string;
  cancelLabel: string;
};

export type ScannerProgressCopy = {
  /** Abriendo la foto elegida o capturada. */
  preparing: string;
  /** Guardando la página en la lista. */
  savingPage: string;
  /** Armando el PDF. */
  buildingPdf: string;
  /** Fotos pendientes de ajustar. Usa `{n}`. */
  queueRemaining: string;
};

export type ScannerErrorsCopy = {
  /** No se pudo abrir la foto. */
  imageFailed: string;
  /** No se pudo guardar la página. */
  pageFailed: string;
  /** No se pudo armar el PDF. */
  pdfFailed: string;
  dismissLabel: string;
  /** Confirmación al salir con páginas sin guardar. */
  discardTitle: string;
  discardBody: string;
  discardConfirmLabel: string;
  discardCancelLabel: string;
};

/**
 * Pantalla final. Existe por una razón concreta: en un teléfono la descarga
 * automática no llega a ninguna parte, así que hace falta un botón real que
 * la persona pulse para que el sistema abra su hoja de compartir.
 */
export type ScannerDoneCopy = {
  title: string;
  /** Qué acaba de pasar y qué puede hacer ahora. */
  body: string;
  /** Acción principal en móvil: abre la hoja del sistema. */
  shareLabel: string;
  /** Acción principal en escritorio, y alternativa en móvil. */
  downloadLabel: string;
  /** Abrir el PDF para verlo antes de decidir. */
  openLabel: string;
  /** Cierra el escáner. */
  doneLabel: string;
  /** Sólo si la hoja de compartir falla de verdad. */
  shareFailed: string;
};

export type ScannerFlowCopy = {
  start: ScannerStartCopy;
  camera: ScannerCameraCopy;
  adjuster: CornerAdjusterCopy;
  preview: ScanPreviewCopy;
  list: PageListCopy;
  review: ScannerReviewCopy;
  done: ScannerDoneCopy;
  progress: ScannerProgressCopy;
  errors: ScannerErrorsCopy;
};

// ─── Props ───────────────────────────────────────────────

export type ScannerFlowProps = {
  copy: ScannerFlowCopy;
  /** El PDF listo y las páginas que lo componen. */
  onComplete: (pdf: Blob, pages: ScannedPage[]) => void;
  onCancel: () => void;
  /** Nombre del archivo, sin extensión. Por defecto "documento". */
  fileName?: string;
  /** Título dentro del PDF. Por defecto, el mismo que `fileName`. */
  documentTitle?: string;
  /** Tamaño inicial de la hoja. Carta por defecto (§ trámites de EE. UU.). */
  defaultPageSize?: PageSizeName;
  /**
   * Si el PDF se lo lleva la persona (landing) en vez de guardarse en la
   * bóveda. Cuando es `true` el flujo termina en la pantalla de entrega, con
   * el botón de compartir/descargar; cuando es `false` se llama a
   * `onComplete` directamente y el archivo sigue su camino dentro de la app.
   */
  autoDownload?: boolean;
  className?: string;
};

type Stage = "idle" | "capturing" | "adjusting" | "previewing" | "review" | "done";
type Busy = "preparing" | "savingPage" | "buildingPdf";
type ErrorKind = "image" | "page" | "pdf";

const PAGE_SIZE_ORDER: readonly PageSizeName[] = ["letter", "a4"];

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function ScannerFlow({
  copy,
  onComplete,
  onCancel,
  fileName = "documento",
  documentTitle,
  defaultPageSize = "letter",
  autoDownload = true,
  className,
}: ScannerFlowProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const [stage, setStage] = useState<Stage>("idle");
  const [busy, setBusy] = useState<Busy | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const [source, setSource] = useState<ImageData | null>(null);
  const [quad, setQuad] = useState<Quad | null>(null);
  const [mode, setMode] = useState<EnhanceMode>("document");
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeName>(defaultPageSize);
  const [queueCount, setQueueCount] = useState(0);

  // ── Entrega del PDF ──
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [shareFailed, setShareFailed] = useState(false);
  /**
   * Se resuelve tras montar, nunca durante el render: `navigator.canShare`
   * no existe en el servidor y consultarlo en el primer render daría un
   * HTML distinto al del cliente.
   */
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(canSharePdf()), []);

  // El object URL vive mientras la pantalla de entrega esté abierta; si se
  // suelta antes, el enlace de descarga apunta a nada.
  useEffect(() => {
    if (!pdfUrl) return;
    return () => URL.revokeObjectURL(pdfUrl);
  }, [pdfUrl]);

  /** Fotos elegidas de golpe que todavía no se han ajustado. */
  const queueRef = useRef<Blob[]>([]);
  /** Última página procesada por `ScanPreview`, a la espera de confirmarse. */
  const processedRef = useRef<ImageData | null>(null);
  const pageIdRef = useRef(0);
  const galleryRef = useRef<HTMLInputElement>(null);

  const hasPages = pages.length > 0;

  // ── El contenedor se comporta como un diálogo ──
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.focus();

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      // Mientras haya un <dialog> nativo abierto, él manda: ya atrapa el
      // foco y ya cierra con Escape. Meterse en medio produce saltos.
      if (document.querySelector("dialog[open]")) return;
      if (event.key !== "Tab" || !node) return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.documentElement.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  const requestCancel = useCallback(() => {
    if (hasPages) setDiscardOpen(true);
    else onCancel();
  }, [hasPages, onCancel]);

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      requestCancel();
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [requestCancel]);

  // ── Cargar una foto ──
  const loadBlob = useCallback(async (blob: Blob) => {
    setBusy("preparing");
    setErrorKind(null);
    try {
      const image = await imageDataFromBlob(blob);
      processedRef.current = null;
      setSource(image);
      setQuad(null);
      setStage("adjusting");
    } catch {
      setErrorKind("image");
      setStage((current) => (current === "capturing" ? "capturing" : "idle"));
    } finally {
      setBusy(null);
    }
  }, []);

  function handleCapture(blob: Blob) {
    void loadBlob(blob);
  }

  function handleCaptureMany(blobs: Blob[]) {
    const [first, ...rest] = blobs;
    queueRef.current = rest;
    setQueueCount(rest.length);
    void loadBlob(first);
  }

  // ── Guardar la página que está en pantalla ──
  const commitPage = useCallback(async (): Promise<boolean> => {
    const processed = processedRef.current;
    if (!processed) return false;
    setBusy("savingPage");
    try {
      const jpeg = await toJpeg(processed);
      const thumbnail = toThumbnail(processed);
      pageIdRef.current += 1;
      const page: ScannedPage = {
        id: `pagina-${pageIdRef.current}`,
        jpeg,
        width: processed.width,
        height: processed.height,
        thumbnail,
      };
      setPages((previous) => [...previous, page]);
      processedRef.current = null;
      return true;
    } catch {
      setErrorKind("page");
      return false;
    } finally {
      setBusy(null);
    }
  }, []);

  function takeFromQueue(): Blob | null {
    const next = queueRef.current.shift() ?? null;
    setQueueCount(queueRef.current.length);
    return next;
  }

  async function handleAddPage() {
    if (!(await commitPage())) return;
    const next = takeFromQueue();
    if (next) {
      await loadBlob(next);
      return;
    }
    setSource(null);
    setQuad(null);
    setStage("capturing");
  }

  async function handleFinishPage() {
    if (!(await commitPage())) return;
    // Quien pulsa "Terminar" ha visto el contador de fotos pendientes: la
    // cola se descarta a propósito, no por descuido.
    queueRef.current = [];
    setQueueCount(0);
    setSource(null);
    setQuad(null);
    setStage("review");
  }

  // ── Exportar ──
  async function exportPdf() {
    if (pages.length === 0) return;
    setBusy("buildingPdf");
    setErrorKind(null);
    try {
      const pdf = await pagesToPdf(pages, {
        size: pageSize,
        title: documentTitle ?? fileName,
      });
      if (!autoDownload) {
        // El PDF se queda dentro de la app: no hay nada que entregar.
        onComplete(pdf, pages);
        return;
      }
      // Se para aquí a propósito. Descargar ahora sería un `click()` fuera
      // del gesto del usuario, que el móvil descarta; el archivo se entrega
      // en la pantalla siguiente, cuando la persona pulse.
      setPdf(pdf);
      setPdfUrl(URL.createObjectURL(pdf));
      setStage("done");
    } catch {
      setErrorKind("pdf");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    if (!pdf) return;
    setShareFailed(false);
    const result = await sharePdf(pdf, `${fileName}.pdf`, documentTitle ?? fileName);
    // "cancelled" es la persona cerrando la hoja: no se le enseña un error.
    if (result === "failed" || result === "unsupported") setShareFailed(true);
  }

  function reorderPages(from: number, to: number) {
    setPages((previous) => {
      if (from === to) return previous;
      if (from < 0 || to < 0 || from >= previous.length || to >= previous.length) {
        return previous;
      }
      const next = [...previous];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function deletePage(id: string) {
    setPages((previous) => previous.filter((page) => page.id !== id));
  }

  const notice =
    queueCount > 0
      ? fillTemplate(copy.progress.queueRemaining, { n: queueCount })
      : undefined;

  const errorMessage =
    errorKind === "image"
      ? copy.errors.imageFailed
      : errorKind === "page"
        ? copy.errors.pageFailed
        : errorKind === "pdf"
          ? copy.errors.pdfFailed
          : null;

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={copy.start.title}
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-hidden bg-page",
        className,
      )}
    >
      {/* ── Inicio: se pide la confianza antes que el permiso ── */}
      {stage === "idle" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-8 sm:px-6">
          <div className="m-auto w-full max-w-md text-center">
            <span
              aria-hidden="true"
              className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-teal-soft text-teal-deep"
            >
              <Camera className="size-7" />
            </span>
            <h1 className="font-heading text-h2 text-ink">{copy.start.title}</h1>
            <p className="mt-2 text-body text-muted">{copy.start.intro}</p>

            <div className="mt-6 rounded-lg border border-line bg-surface p-4 text-left">
              <p className="flex items-center gap-2 font-heading text-h3 text-ink">
                <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-teal-deep" />
                {copy.start.privacyTitle}
              </p>
              <p className="mt-1.5 text-body text-muted">{copy.start.privacyBody}</p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button size="lg" fullWidth onClick={() => setStage("capturing")}>
                <Camera aria-hidden="true" className="size-5" />
                {copy.start.startLabel}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => galleryRef.current?.click()}
              >
                <Images aria-hidden="true" className="size-5" />
                {copy.start.galleryLabel}
              </Button>
              <Button variant="ghost" fullWidth onClick={requestCancel}>
                {copy.start.cancelLabel}
              </Button>
            </div>
          </div>

          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            aria-hidden="true"
            tabIndex={-1}
            className="sr-only"
            onChange={(event) => {
              const files = event.target.files ? Array.from(event.target.files) : [];
              event.target.value = "";
              if (files.length === 0) return;
              if (files.length > 1) handleCaptureMany(files);
              else handleCapture(files[0]);
            }}
          />
        </div>
      ) : null}

      {/* ── Cámara ── */}
      {stage === "capturing" ? (
        <ScannerCamera
          copy={copy.camera}
          onCapture={handleCapture}
          onCaptureMany={handleCaptureMany}
          onCancel={hasPages ? () => setStage("review") : requestCancel}
        />
      ) : null}

      {/* ── Ajuste del recorte ── */}
      {stage === "adjusting" && source ? (
        <CornerAdjuster
          image={source}
          copy={copy.adjuster}
          initialQuad={quad ?? undefined}
          notice={notice}
          onConfirm={(next) => {
            setQuad(next);
            setStage("previewing");
          }}
          onBack={() => {
            setSource(null);
            setQuad(null);
            setStage(hasPages ? "review" : "capturing");
          }}
        />
      ) : null}

      {/* ── Resultado ── */}
      {stage === "previewing" && source && quad ? (
        <ScanPreview
          image={source}
          quad={quad}
          copy={copy.preview}
          mode={mode}
          notice={notice}
          onModeChange={setMode}
          onProcessed={(page) => {
            processedRef.current = page;
          }}
          onAdjust={() => setStage("adjusting")}
          onAddPage={() => void handleAddPage()}
          onFinish={() => void handleFinishPage()}
        />
      ) : null}

      {/* ── Revisión y exportación ── */}
      {stage === "review" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-4 pb-2 pt-4 sm:px-6">
            <h2 className="font-heading text-h3 text-ink">{copy.review.title}</h2>
            <p className="mt-1 text-body text-muted">{copy.review.subtitle}</p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-6">
            <PageList
              pages={pages}
              copy={copy.list}
              onReorder={reorderPages}
              onDelete={deletePage}
            />
          </div>

          <div className="shrink-0 border-t border-line bg-surface px-4 py-4 sm:px-6">
            <fieldset className="mb-3">
              <legend className="mb-2 text-label text-muted">
                {copy.review.pageSizeLegend}
              </legend>
              <div className="flex flex-wrap gap-2">
                {PAGE_SIZE_ORDER.map((size) => {
                  const active = size === pageSize;
                  return (
                    <label
                      key={size}
                      className={cn(
                        "inline-flex min-h-11 cursor-pointer items-center rounded-sm border px-4 text-body transition-colors",
                        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-teal-deep",
                        active
                          ? "border-teal-deep bg-teal-soft font-medium text-ink"
                          : "border-line bg-surface text-muted hover:bg-surface-alt hover:text-ink",
                      )}
                    >
                      <input
                        type="radio"
                        name="andex-scanner-page-size"
                        value={size}
                        checked={active}
                        onChange={() => setPageSize(size)}
                        className="sr-only"
                      />
                      {copy.review.pageSizes[size]}
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-caption text-muted">{copy.review.pageSizeNote}</p>
            </fieldset>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" fullWidth onClick={requestCancel} className="sm:w-auto">
                {copy.review.cancelLabel}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setStage("capturing")}
                className="sm:w-auto"
              >
                <Plus aria-hidden="true" className="size-5" />
                {copy.review.addPageLabel}
              </Button>
              <Button
                fullWidth
                disabled={!hasPages || busy !== null}
                onClick={() => void exportPdf()}
                className="sm:w-auto"
              >
                <FileDown aria-hidden="true" className="size-5" />
                {copy.review.finishLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Entrega ──
          El PDF ya existe; falta que salga del navegador. En el móvil eso
          sólo ocurre si la persona pulsa: la hoja de compartir del sistema
          exige un gesto real, y una descarga automática la descartaría. */}
      {stage === "done" && pdfUrl ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-8 sm:px-6">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-soft">
              <Check aria-hidden="true" className="size-8 text-teal-deep" />
            </div>
            <h2 className="mt-5 font-heading text-h2 text-ink">{copy.done.title}</h2>
            <p className="mt-2 text-body text-muted">{copy.done.body}</p>

            <div className="mt-8 flex flex-col gap-3">
              {canShare ? (
                <Button size="lg" fullWidth onClick={() => void handleShare()}>
                  <Share2 aria-hidden="true" className="size-5" />
                  {copy.done.shareLabel}
                </Button>
              ) : null}

              {/* Un <a download> de verdad, no un click sintético: al ser el
                  gesto directo de la persona, el navegador lo respeta. Y se
                  puede mantener pulsado para "guardar enlace". */}
              <Button
                href={pdfUrl}
                download={`${fileName}.pdf`}
                variant={canShare ? "secondary" : "primary"}
                size="lg"
                fullWidth
              >
                <Download aria-hidden="true" className="size-5" />
                {copy.done.downloadLabel}
              </Button>

              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 text-body text-teal-deep underline underline-offset-4 hover:text-ink"
              >
                <ExternalLink aria-hidden="true" className="size-4" />
                {copy.done.openLabel}
              </a>
            </div>

            {shareFailed ? (
              <p role="alert" className="mt-4 text-body text-danger">
                {copy.done.shareFailed}
              </p>
            ) : null}

            <div className="mt-8 border-t border-line pt-5">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => pdf && onComplete(pdf, pages)}
              >
                {copy.done.doneLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Error visible, nunca en la consola ── */}
      {errorMessage ? (
        <div
          role="alert"
          className="absolute inset-x-3 bottom-3 z-10 flex items-start gap-2 rounded-md border border-line bg-surface px-3 py-3 text-body text-danger shadow-lg"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span className="min-w-0 flex-1">{errorMessage}</span>
          <button
            type="button"
            aria-label={copy.errors.dismissLabel}
            onClick={() => setErrorKind(null)}
            className="-my-1 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ) : null}

      {/* ── Progreso: enderezar puede tardar un par de segundos en un
             teléfono lento, y una pantalla quieta parece rota ── */}
      {busy ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-page/85 px-6">
          <p
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-lg border border-line bg-surface px-5 py-4 text-body text-ink shadow-lg"
          >
            {reduced ? (
              <span aria-hidden="true" className="size-3 shrink-0 rounded-full bg-teal" />
            ) : (
              <Loader2 aria-hidden="true" className="size-5 shrink-0 animate-spin text-teal-deep" />
            )}
            {copy.progress[busy]}
          </p>
        </div>
      ) : null}

      <Modal
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title={copy.errors.discardTitle}
        closeLabel={copy.errors.discardCancelLabel}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDiscardOpen(false)}>
              {copy.errors.discardCancelLabel}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDiscardOpen(false);
                onCancel();
              }}
            >
              {copy.errors.discardConfirmLabel}
            </Button>
          </>
        }
      >
        <p className="text-body text-ink">{copy.errors.discardBody}</p>
      </Modal>
    </div>
  );
}
