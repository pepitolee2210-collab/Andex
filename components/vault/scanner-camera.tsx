"use client";

/**
 * BÓVEDA · ESCÁNER — captura.
 *
 * Dos caminos hacia la misma foto, y ninguno es "el plan B":
 *
 *  1. La cámara en vivo (`getUserMedia`), cuando el navegador la concede.
 *  2. Elegir una foto que ya está en el teléfono.
 *
 * El segundo camino se muestra SIEMPRE, con el mismo peso visual. Buena
 * parte de este público llega con la cámara del navegador bloqueada por el
 * sistema, o ya tiene la foto del permiso de trabajo guardada desde hace
 * meses. Esconder esa vía detrás de un error sería dejar fuera a quien más
 * necesita el módulo.
 *
 * El vídeo se muestra con `object-contain`, no `object-cover`: se ve
 * exactamente lo que se va a capturar. Con `cover` la pantalla queda más
 * bonita pero recorta los bordes del encuadre, y quien alinee el documento
 * con la guía se llevaría una foto distinta de la que vio.
 *
 * Todo el texto entra por props: este componente no importa los
 * diccionarios.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Camera, CameraOff, ChevronLeft, Images, Lock, ShieldCheck, X } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { KitButton, KitNotice, StatePanel } from "@/components/ui/kit";
import { cn } from "@/lib/utils";

// ─── Copy ────────────────────────────────────────────────

export type ScannerCameraCopy = {
  /** Título accesible de la pantalla. No siempre se pinta. */
  title: string;
  /** Instrucción sobre el visor. Ej.: "Encuadra el documento completo". */
  hint: string;
  /** La frase de confianza. Ej.: "La foto se queda en tu teléfono." */
  privacyNote: string;
  /** Estado mientras el navegador pide permiso. */
  requesting: string;
  captureLabel: string;
  galleryLabel: string;
  cancelLabel: string;
  /**
   * Versión corta para la barra del visor, donde la etiqueta vive en una
   * columna de ~90 px a 320 px de ancho. Si falta, se usa la larga.
   */
  galleryShortLabel?: string;
  cancelShortLabel?: string;
  /** Permiso denegado. */
  deniedTitle: string;
  deniedBody: string;
  /** Cómo volver a activarlo, en una línea. */
  deniedHowTo: string;
  /** La salida que SÍ funciona sin permiso: una foto del carrete. */
  uploadLabel: string;
  /** No hay cámara, o el navegador no la ofrece. */
  unavailableTitle: string;
  unavailableBody: string;
  /** Falló por cualquier otro motivo. */
  failedTitle: string;
  failedBody: string;
  retryLabel: string;
  /** Botón que abre la cámara del sistema (no la del navegador). */
  systemCameraLabel: string;
  /** La captura no se pudo guardar. */
  captureError: string;
};

// ─── Props ───────────────────────────────────────────────

export type ScannerCameraProps = {
  copy: ScannerCameraCopy;
  /** Una foto lista. Se llama con el JPEG recién capturado o elegido. */
  onCapture: (blob: Blob) => void;
  /**
   * Varias fotos elegidas de la galería de una vez. Si no se pasa, solo se
   * usa la primera.
   */
  onCaptureMany?: (blobs: Blob[]) => void;
  onCancel: () => void;
  /** Permite elegir varias fotos de la galería. Por defecto, sí. */
  allowMultiple?: boolean;
  className?: string;
};

type CameraStatus = "starting" | "live" | "denied" | "unavailable" | "failed";

function classifyError(error: unknown): CameraStatus {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
    return "denied";
  }
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    name === "OverconstrainedError"
  ) {
    return "unavailable";
  }
  return "failed";
}

export function ScannerCamera({
  copy,
  onCapture,
  onCaptureMany,
  onCancel,
  allowMultiple = true,
  className,
}: ScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const systemCameraRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<CameraStatus>("starting");
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [captureFailed, setCaptureFailed] = useState(false);
  const reduced = useReducedMotion();

  // El flujo de la cámara es un recurso del sistema: si no se apaga, el
  // indicador del teléfono se queda encendido y la batería se va. Se corta
  // en el cleanup y también si el componente se desmonta mientras el
  // permiso todavía se estaba resolviendo.
  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          try {
            await video.play();
          } catch {
            // Autoplay bloqueado: el vídeo aparece igual en cuanto el
            // usuario toca la pantalla. No es motivo para tumbar la vista.
          }
        }
        if (!cancelled) setStatus("live");
      } catch (error) {
        if (!cancelled) setStatus(classifyError(error));
      }
    }

    setStatus("starting");
    void start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const video = videoRef.current;
      if (video) video.srcObject = null;
    };
  }, [attempt]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || busy) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      setCaptureFailed(true);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCaptureFailed(true);
      return;
    }

    setCaptureFailed(false);
    setBusy(true);
    ctx.drawImage(video, 0, 0, width, height);
    // 0,92 en la captura: aquí todavía no se ha recortado nada, así que
    // conviene guardar más de lo que hará falta. El JPEG final del PDF ya
    // baja a 0,82.
    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (!blob) {
          setCaptureFailed(true);
          return;
        }
        onCapture(blob);
      },
      "image/jpeg",
      0.92,
    );
  }, [busy, onCapture]);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const list = event.target.files;
    const files = list ? Array.from(list) : [];
    // Se limpia el input para que volver a elegir la MISMA foto dispare el
    // evento otra vez.
    event.target.value = "";
    if (files.length === 0) return;
    if (files.length > 1 && onCaptureMany) onCaptureMany(files);
    else onCapture(files[0]);
  }

  const live = status === "live";
  const starting = status === "starting";

  return (
    <div
      className={cn(
        "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden",
        // Oscuro sólo mientras se ve el visor, y por necesidad de la cámara:
        // sobre crema el ojo se calibra con la pantalla y no se nota si la
        // foto sale oscura. Sin visor, la pantalla vuelve a ser la de siempre.
        live || starting ? "bg-navy" : "bg-page",
        className,
      )}
    >
      {/* Los dos inputs son distintos a propósito:
          · galería  → sin `capture`, porque `capture` fuerza la cámara del
            sistema y nunca abre el carrete. Sería justo lo contrario de lo
            que promete el botón.
          · cámara del sistema → con `capture="environment"`, la vía de
            escape cuando el navegador tiene bloqueado el permiso. */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple={allowMultiple}
        onChange={handleFiles}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={systemCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFiles}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* ── Visor ── */}
      {(live || starting) && (
        <div className="relative min-h-0 flex-1">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            aria-label={copy.title}
            className="absolute inset-0 size-full object-contain"
          />

          {/* Guía de encuadre: cuatro escuadras, nada más. No es un recorte
              —eso se ajusta en el paso siguiente—, es una referencia para
              que el documento entre entero y derecho. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center p-5"
          >
            <div
              className={cn(
                "relative h-full max-h-[78%] w-full max-w-2xl",
                live && !reduced && "animate-pulse",
              )}
            >
              <span className="absolute left-0 top-0 size-10 rounded-tl-md border-l-2 border-t-2 border-white/90" />
              <span className="absolute right-0 top-0 size-10 rounded-tr-md border-r-2 border-t-2 border-white/90" />
              <span className="absolute bottom-0 right-0 size-10 rounded-br-md border-b-2 border-r-2 border-white/90" />
              <span className="absolute bottom-0 left-0 size-10 rounded-bl-md border-b-2 border-l-2 border-white/90" />
            </div>
          </div>

          {starting ? (
            <p
              role="status"
              className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-body text-white"
            >
              {copy.requesting}
            </p>
          ) : null}

          <p className="pointer-events-none absolute inset-x-4 top-4 text-center text-body text-white">
            {copy.hint}
          </p>
        </div>
      )}

      {/* ── SIN CÁMARA ──
          El permiso está denegado, no hay cámara, o falló. En los tres casos
          la pantalla dice lo mismo en estructura: qué pasa, cómo se arregla
          y —lo importante— la salida que funciona AHORA sin arreglar nada,
          que es elegir una foto del carrete.

          El diseño pone aquí un botón «Abrir los ajustes». Una página web no
          puede abrir los ajustes del navegador, así que en su sitio va la
          instrucción concreta: prometer un botón que no hace nada, en la
          pantalla donde más gente abandona, es lo peor que se puede hacer. */}
      {!live && !starting && (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-8 pt-2">
          <div className="navrow">
            <button type="button" onClick={onCancel} className="navback">
              <ChevronLeft aria-hidden="true" className="size-6 shrink-0" />
              {copy.cancelLabel}
            </button>
          </div>

          <div className="m-auto w-full max-w-sm py-8">
            {/* Siempre `camera-off`: es el glifo que el sistema de diseño
                le da a esta pantalla, y el único de los dos que tiene gesto
                dentro de una ficha de estado. */}
            <StatePanel
              iconName="camera-off"
              icon={CameraOff}
              tone="warn"
              title={
                status === "denied"
                  ? copy.deniedTitle
                  : status === "unavailable"
                    ? copy.unavailableTitle
                    : copy.failedTitle
              }
              body={
                status === "denied"
                  ? copy.deniedBody
                  : status === "unavailable"
                    ? copy.unavailableBody
                    : copy.failedBody
              }
            >
              <div className="mt-7 w-full space-y-3">
                <KitButton
                  iconName="image"
                  icon={Images}
                  wide
                  onClick={() => galleryRef.current?.click()}
                >
                  {copy.uploadLabel}
                </KitButton>
                <KitButton
                  kind="ghost"
                  iconName="camera"
                  icon={Camera}
                  wide
                  onClick={() => systemCameraRef.current?.click()}
                >
                  {copy.systemCameraLabel}
                </KitButton>
              </div>

              {status === "denied" ? (
                <KitNotice iconName="lock" icon={Lock} className="mt-4 w-full">
                  {copy.deniedHowTo}
                </KitNotice>
              ) : null}

              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="mt-3 min-h-11 w-full text-caption font-semibold text-teal-deep underline underline-offset-4"
              >
                {copy.retryLabel}
              </button>
            </StatePanel>
          </div>
        </div>
      )}

      {/* ── Barra inferior: al alcance del pulgar ── */}
      {(live || starting) && (
        <div className="shrink-0 bg-navy px-3 pb-5 pt-3">
          {captureFailed ? (
            <p role="alert" className="mb-3 text-center text-body text-white">
              {copy.captureError}
            </p>
          ) : null}

          <p className="mb-3 flex items-center justify-center gap-2 text-center text-caption text-white/80">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
            {copy.privacyNote}
          </p>

          <div className="grid grid-cols-3 items-center gap-2">
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-white transition-colors hover:bg-white/10"
            >
              <Images aria-hidden="true" className="size-6" />
              <span className="text-balance text-caption leading-tight">
                {copy.galleryShortLabel ?? copy.galleryLabel}
              </span>
            </button>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={capture}
                disabled={!live || busy}
                aria-label={copy.captureLabel}
                aria-busy={busy || undefined}
                className={cn(
                  "flex size-18 items-center justify-center rounded-full border-4 border-white bg-white/20",
                  "transition-[transform,background-color] duration-150 active:scale-95",
                  "disabled:opacity-40",
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-14 rounded-full bg-white"
                />
              </button>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-white transition-colors hover:bg-white/10"
            >
              <X aria-hidden="true" className="size-6" />
              <span className="text-balance text-caption leading-tight">
                {copy.cancelShortLabel ?? copy.cancelLabel}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
