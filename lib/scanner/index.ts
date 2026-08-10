"use client";

/**
 * ESCÁNER DE DOCUMENTOS — API pública.
 *
 * Todo ocurre en el dispositivo: la foto no sale del teléfono en ningún
 * momento del proceso. No es una decisión técnica, es la decisión de
 * producto más importante de este módulo.
 *
 * El PRD marca los datos migratorios como riesgo alto (§R5): estatus,
 * nacionalidad, número de caso. Aquí se manejan pasaportes, permisos de
 * trabajo y notificaciones de corte — el expediente completo de una
 * persona. Un servidor que procese esas imágenes es un servidor que puede
 * ser requerido, filtrado o robado.
 *
 * Procesar en el dispositivo elimina esa categoría entera de riesgo, y
 * además permite decir la única frase que esta audiencia necesita oír:
 * *ni nosotros podemos ver tus documentos*.
 */

import { buildPdf, type PageSizeName, type PdfPage } from "./pdf";
import type { EnhanceMode } from "./process";
import type { Quad } from "./geometry";

export { buildPdf, PAGE_SIZES, type PageSizeName } from "./pdf";
export { scanPage, enhance, warpQuad, type EnhanceMode } from "./process";
export {
  defaultQuad,
  isUsableQuad,
  naturalSize,
  orderCorners,
  quadArea,
  type Point,
  type Quad,
} from "./geometry";
export { detectDocument } from "./detect";

/** Una página ya escaneada, lista para el PDF. */
export type ScannedPage = {
  id: string;
  /** JPEG final, listo para incrustar. */
  jpeg: Blob;
  width: number;
  height: number;
  /** Miniatura para la lista, en data URL. Pequeña a propósito. */
  thumbnail: string;
};

// ─── Worker ──────────────────────────────────────────────

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<
  number,
  { resolve: (img: ImageData) => void; reject: (e: Error) => void }
>();

function getWorker(): Worker | null {
  if (typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent) => {
      const data = e.data as { id: number; ok: boolean; image?: ImageData; error?: string };
      const slot = pending.get(data.id);
      if (!slot) return;
      pending.delete(data.id);
      if (data.ok && data.image) slot.resolve(data.image);
      else slot.reject(new Error(data.error ?? "Error al procesar"));
    };
    worker.onerror = () => {
      // Si el worker muere, se rechaza todo lo pendiente y se olvida: la
      // siguiente llamada usará el camino del hilo principal.
      pending.forEach((s) => s.reject(new Error("El procesador se detuvo")));
      pending.clear();
      worker = null;
    };
    return worker;
  } catch {
    return null;
  }
}

/**
 * Endereza y realza una página. Usa el worker cuando existe y cae al hilo
 * principal si el navegador no lo soporta: más lento, pero funciona.
 */
export async function processPage(
  image: ImageData,
  quad: Quad,
  mode: EnhanceMode,
  maxSide?: number,
): Promise<ImageData> {
  const w = getWorker();
  if (!w) {
    const { scanPage } = await import("./process");
    return scanPage({ image, quad, mode, maxSide });
  }

  const id = nextId++;
  return new Promise<ImageData>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, image, quad, mode, maxSide });
  });
}

// ─── Utilidades de imagen ────────────────────────────────

/** `ImageData` desde un archivo o una foto de la cámara. */
export async function imageDataFromBlob(
  blob: Blob,
  maxSide = 2600,
): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("El navegador no permite procesar imágenes.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return ctx.getImageData(0, 0, w, h);
}

function canvasFrom(image: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext("2d")!.putImageData(image, 0, 0);
  return canvas;
}

/** `ImageData` a JPEG. 0,82 es el punto donde deja de notarse la pérdida. */
export function toJpeg(image: ImageData, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvasFrom(image).toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo guardar la imagen."))),
      "image/jpeg",
      quality,
    );
  });
}

/** Miniatura ligera para la lista de páginas. */
export function toThumbnail(image: ImageData, maxSide = 240): string {
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(canvasFrom(image), 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

// ─── Exportación ─────────────────────────────────────────

export type ExportOptions = {
  size?: PageSizeName;
  title?: string;
};

/** Junta las páginas escaneadas en un único PDF. */
export async function pagesToPdf(
  pages: readonly ScannedPage[],
  options: ExportOptions = {},
): Promise<Blob> {
  const prepared: PdfPage[] = await Promise.all(
    pages.map(async (p) => ({
      jpeg: new Uint8Array(await p.jpeg.arrayBuffer()),
      width: p.width,
      height: p.height,
    })),
  );
  const bytes = buildPdf(prepared, options);
  // `slice()` entrega un ArrayBuffer limpio: el de un Uint8Array puede ser
  // un SharedArrayBuffer y `Blob` lo rechaza en algunos navegadores.
  return new Blob([bytes.slice().buffer], { type: "application/pdf" });
}

/** Descarga un blob con el nombre dado. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Se libera en el siguiente ciclo: revocar de inmediato cancela la
  // descarga en Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
