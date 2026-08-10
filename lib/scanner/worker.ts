/// <reference lib="webworker" />

/**
 * ESCÁNER — worker de procesamiento.
 *
 * Enderezar una hoja a 200 ppp son ~3,7 millones de píxeles con muestreo
 * bilineal. En el hilo principal eso congela la pantalla varios segundos en
 * un Android de gama baja: el usuario ve la app colgada justo después de
 * tomar la foto, que es el momento en que más desconfía.
 *
 * Aquí no se toca el DOM ni se hace red: sólo píxeles.
 */

import { scanPage, type EnhanceMode } from "./process";
import type { Quad } from "./geometry";

export type ScanWorkerRequest = {
  id: number;
  image: ImageData;
  quad: Quad;
  mode: EnhanceMode;
  maxSide?: number;
};

export type ScanWorkerResponse =
  | { id: number; ok: true; image: ImageData }
  | { id: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<ScanWorkerRequest>) => {
  const { id, image, quad, mode, maxSide } = event.data;
  try {
    const result = scanPage({ image, quad, mode, maxSide });
    // Se transfiere el buffer en vez de copiarlo: una imagen de 3,7 MP son
    // ~15 MB, y copiarlos de vuelta duplicaría el pico de memoria justo en
    // el dispositivo que menos tiene.
    (self as unknown as Worker).postMessage(
      { id, ok: true, image: result } satisfies ScanWorkerResponse,
      [result.data.buffer],
    );
  } catch (error) {
    (self as unknown as Worker).postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : "Error al procesar",
    } satisfies ScanWorkerResponse);
  }
};
