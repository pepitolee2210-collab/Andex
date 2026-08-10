"use client";

/**
 * BÓVEDA · ESCÁNER — ajuste del recorte.
 *
 * La detección automática propone; el usuario decide. Si `detectDocument`
 * no encuentra el papel, se parte de casi toda la foto y no pasa nada: el
 * ajuste manual es el camino que siempre funciona.
 *
 * Tres decisiones que sostienen todo el componente:
 *
 *  · Las manijas son `<button>` de HTML, no círculos de SVG. Un botón real
 *    llega al lector de pantalla, entra en el orden de tabulación y acepta
 *    teclado sin trucos.
 *  · El punto visible mide 20 px pero el área que responde al dedo mide 44.
 *    Un objetivo de 20 px se falla una de cada tres veces.
 *  · Las flechas mueven 1 píxel DE PANTALLA (10 con Shift), no 1 píxel de
 *    la imagen. En una foto de 2.600 px vista en un móvil de 320, un píxel
 *    de imagen no se ve mover: la tecla parecería estropeada.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Info, TriangleAlert } from "lucide-react";
import { useReducedMotion } from "motion/react";
import {
  defaultQuad,
  detectDocument,
  isUsableQuad,
  orderCorners,
  type Point,
  type Quad,
} from "@/lib/scanner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Utilidad compartida: ImageData → URL de objeto ──────

/**
 * Convierte un `ImageData` en una URL mostrable y la revoca al desmontar.
 *
 * No se usa `toDataURL`: una foto de 2.600 px en base64 son varios megas de
 * cadena viviendo en memoria y en el árbol de React. Un blob es una
 * referencia, y se libera cuando toca.
 *
 * (La reutiliza `scan-preview.tsx` para la página ya procesada.)
 */
export function useImageDataUrl(image: ImageData | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!image) {
      setUrl(null);
      return;
    }
    let revoked: string | null = null;
    let cancelled = false;

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(image, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob || cancelled) return;
        revoked = URL.createObjectURL(blob);
        setUrl(revoked);
      },
      "image/jpeg",
      0.9,
    );

    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
      setUrl(null);
    };
  }, [image]);

  return url;
}

// ─── Copy ────────────────────────────────────────────────

export type CornerAdjusterCopy = {
  title: string;
  /** Instrucción principal. Ej.: "Mueve las esquinas hasta los bordes". */
  hint: string;
  /** Ayuda para quien navega con teclado. Se lee, no solo se muestra. */
  keyboardHint: string;
  /** Mientras se busca el documento en la foto. */
  detecting: string;
  /** Nombres de las cuatro esquinas, para el lector de pantalla. */
  corners: {
    topLeft: string;
    topRight: string;
    bottomRight: string;
    bottomLeft: string;
  };
  /** Aviso cuando el recorte no da un documento legible. */
  unusableWarning: string;
  /** Vuelve al cuadro por defecto. Ej.: "Usar la foto completa". */
  resetLabel: string;
  backLabel: string;
  continueLabel: string;
  /** Texto alternativo de la foto. */
  imageAlt: string;
};

// ─── Props ───────────────────────────────────────────────

export type CornerAdjusterProps = {
  /** La foto sin procesar, tal como salió de `imageDataFromBlob`. */
  image: ImageData;
  copy: CornerAdjusterCopy;
  /** Recorte inicial. Si no llega, se detecta automáticamente. */
  initialQuad?: Quad;
  onConfirm: (quad: Quad) => void;
  onBack: () => void;
  /** Lupa mientras se arrastra. Por defecto, sí. */
  magnifier?: boolean;
  /** Aviso corto en la cabecera (p. ej. "Te quedan 2 fotos"). */
  notice?: string;
  className?: string;
};

type CornerKey = keyof Quad;

const CORNER_ORDER: readonly CornerKey[] = [
  "topLeft",
  "topRight",
  "bottomRight",
  "bottomLeft",
];

/** Aumento de la lupa y su radio en píxeles de pantalla. */
const LOUPE_ZOOM = 2.5;
const LOUPE_RADIUS = 56;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function CornerAdjuster({
  image,
  copy,
  initialQuad,
  onConfirm,
  onBack,
  magnifier = true,
  notice,
  className,
}: CornerAdjusterProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const reduced = useReducedMotion();
  const src = useImageDataUrl(image);

  const [quad, setQuad] = useState<Quad | null>(initialQuad ?? null);
  const [detecting, setDetecting] = useState(!initialQuad);
  const [dragging, setDragging] = useState<CornerKey | null>(null);

  // La detección recorre toda la foto: bloquea el hilo unas décimas. Se
  // aplaza un tick para que la pantalla llegue a pintar el aviso de
  // "buscando" antes de congelarse; si no, el usuario ve un salto en negro.
  useEffect(() => {
    if (initialQuad) {
      setQuad(initialQuad);
      setDetecting(false);
      return;
    }
    let cancelled = false;
    setDetecting(true);
    const timer = window.setTimeout(() => {
      const found = detectDocument(image);
      if (cancelled) return;
      setQuad(found ?? defaultQuad(image.width, image.height));
      setDetecting(false);
    }, 32);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [image, initialQuad]);

  const usable = useMemo(
    () => (quad ? isUsableQuad(quad, image.width, image.height) : false),
    [quad, image.width, image.height],
  );

  const points = useMemo(
    () =>
      quad
        ? CORNER_ORDER.map((key) => `${quad[key].x},${quad[key].y}`).join(" ")
        : "",
    [quad],
  );

  const setCorner = useCallback(
    (key: CornerKey, next: Point) => {
      setQuad((prev) =>
        prev
          ? {
              ...prev,
              [key]: {
                x: clamp(next.x, 0, image.width),
                y: clamp(next.y, 0, image.height),
              },
            }
          : prev,
      );
    },
    [image.width, image.height],
  );

  function pointFromEvent(clientX: number, clientY: number): Point | null {
    const rect = rectRef.current ?? frameRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * image.width,
      y: ((clientY - rect.top) / rect.height) * image.height,
    };
  }

  function handlePointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    key: CornerKey,
  ) {
    event.preventDefault();
    rectRef.current = frameRef.current?.getBoundingClientRect() ?? null;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(key);
  }

  function handlePointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
    key: CornerKey,
  ) {
    if (dragging !== key) return;
    const next = pointFromEvent(event.clientX, event.clientY);
    if (next) setCorner(key, next);
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    rectRef.current = null;
    setDragging(null);
  }

  function handleKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    key: CornerKey,
  ) {
    let dx = 0;
    let dy = 0;
    if (event.key === "ArrowLeft") dx = -1;
    else if (event.key === "ArrowRight") dx = 1;
    else if (event.key === "ArrowUp") dy = -1;
    else if (event.key === "ArrowDown") dy = 1;
    else return;

    event.preventDefault();
    const step = event.shiftKey ? 10 : 1;
    const rect = frameRef.current?.getBoundingClientRect();
    // Del píxel de pantalla al píxel de la imagen.
    const scaleX = rect && rect.width > 0 ? image.width / rect.width : 1;
    const scaleY = rect && rect.height > 0 ? image.height / rect.height : 1;

    setQuad((prev) =>
      prev
        ? {
            ...prev,
            [key]: {
              x: clamp(prev[key].x + dx * step * scaleX, 0, image.width),
              y: clamp(prev[key].y + dy * step * scaleY, 0, image.height),
            },
          }
        : prev,
    );
  }

  function handleConfirm() {
    if (!quad || !usable) return;
    // `orderCorners` es la red de seguridad: si alguien cruzó dos esquinas,
    // el motor recibe igualmente un cuadrilátero en orden canónico y el
    // documento no sale del revés.
    const ordered = orderCorners(CORNER_ORDER.map((key) => quad[key]));
    onConfirm(ordered ?? quad);
  }

  // Posición de la lupa: siempre en la esquina superior OPUESTA al dedo,
  // que es el único sitio donde no la tapa la mano.
  const dragPoint = dragging && quad ? quad[dragging] : null;
  const loupeOnLeft = dragPoint ? dragPoint.x / image.width > 0.5 : true;
  const rect = rectRef.current;
  const loupeStyle =
    dragPoint && rect && src
      ? {
          backgroundImage: `url("${src}")`,
          backgroundSize: `${rect.width * LOUPE_ZOOM}px ${rect.height * LOUPE_ZOOM}px`,
          backgroundPosition:
            `${LOUPE_RADIUS - (dragPoint.x / image.width) * rect.width * LOUPE_ZOOM}px ` +
            `${LOUPE_RADIUS - (dragPoint.y / image.height) * rect.height * LOUPE_ZOOM}px`,
          backgroundRepeat: "no-repeat",
        }
      : undefined;

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
        <p className="mt-1 text-body text-muted">{copy.hint}</p>
        <p id="andex-corner-keys" className="mt-1 text-caption text-muted">
          {copy.keyboardHint}
        </p>
      </div>

      {/* ── Lienzo ── */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-2 sm:px-6">
        <div
          ref={frameRef}
          style={{ aspectRatio: `${image.width} / ${image.height}` }}
          className="relative max-h-full w-full max-w-2xl touch-none select-none overflow-hidden rounded-lg bg-navy"
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={copy.imageAlt}
              draggable={false}
              className="absolute inset-0 size-full object-contain"
            />
          ) : (
            <div aria-hidden="true" className="andex-shimmer absolute inset-0" />
          )}

          {quad ? (
            <svg
              viewBox={`0 0 ${image.width} ${image.height}`}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 size-full"
            >
              <defs>
                {/* `white`/`black` son la luminancia de la máscara, no una
                    decisión de color: es la forma de recortar el velo. */}
                <mask id="andex-quad-mask">
                  <rect width={image.width} height={image.height} fill="white" />
                  <polygon points={points} fill="black" />
                </mask>
              </defs>
              <rect
                width={image.width}
                height={image.height}
                mask="url(#andex-quad-mask)"
                className="fill-navy/60"
              />
              <polygon
                points={points}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                className={cn(
                  "fill-transparent",
                  usable ? "stroke-teal" : "stroke-danger",
                )}
              />
            </svg>
          ) : null}

          {/* Manijas: punto de 20 px, zona sensible de 44. */}
          {quad
            ? CORNER_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={copy.corners[key]}
                  aria-describedby="andex-corner-keys"
                  onPointerDown={(event) => handlePointerDown(event, key)}
                  onPointerMove={(event) => handlePointerMove(event, key)}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onKeyDown={(event) => handleKeyDown(event, key)}
                  style={{
                    left: `${(quad[key].x / image.width) * 100}%`,
                    top: `${(quad[key].y / image.height) * 100}%`,
                  }}
                  className={cn(
                    "absolute flex size-11 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full",
                    dragging === key && "z-10",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block size-5 rounded-full border-2 border-white shadow-md",
                      usable ? "bg-teal" : "bg-danger",
                      !reduced && "transition-transform duration-150",
                      dragging === key && "scale-125",
                    )}
                  />
                </button>
              ))
            : null}

          {/* Lupa: en móvil el dedo tapa justo la esquina que se ajusta. */}
          {magnifier && loupeStyle ? (
            <div
              aria-hidden="true"
              style={loupeStyle}
              className={cn(
                "pointer-events-none absolute top-3 size-28 overflow-hidden rounded-full border-2 border-white shadow-lg",
                loupeOnLeft ? "left-3" : "right-3",
              )}
            >
              <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-teal" />
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-teal" />
            </div>
          ) : null}

          {detecting ? (
            <p
              role="status"
              className="absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-sm bg-navy/80 px-3 py-2 text-center text-body text-white"
            >
              {copy.detecting}
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Aviso y acciones ── */}
      <div className="shrink-0 border-t border-line bg-surface px-4 py-4 sm:px-6">
        {quad && !usable ? (
          <p
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-sm bg-danger-soft px-3 py-2 text-body text-danger"
          >
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {copy.unusableWarning}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" fullWidth onClick={onBack} className="sm:w-auto">
            {copy.backLabel}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setQuad(defaultQuad(image.width, image.height))}
            className="sm:w-auto"
          >
            {copy.resetLabel}
          </Button>
          <Button
            fullWidth
            disabled={!quad || !usable || detecting}
            onClick={handleConfirm}
            className="sm:w-auto"
          >
            {copy.continueLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
