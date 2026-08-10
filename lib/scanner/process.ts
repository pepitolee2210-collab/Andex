/**
 * ESCÁNER — enderezado y realce de la imagen.
 *
 * Funciones puras sobre `ImageData`: no tocan el DOM, así que corren igual
 * en el hilo principal o dentro de un Web Worker. En móvil van al worker,
 * porque enderezar una hoja a 200 ppp son ~3,7 millones de píxeles y hacerlo
 * en el hilo principal congelaría la pantalla varios segundos.
 *
 * No se usa OpenCV.js a propósito: pesa entre 8 y 11 MB. El público de este
 * producto usa Android de gama baja con datos contados, y todo lo que hace
 * falta aquí cabe en este archivo.
 */

import { naturalSize, project, projectionFromQuad, type Quad } from "./geometry";

/**
 * Cómo se procesa el documento después de enderezarlo.
 *
 * `document` es el modo por defecto y el que hay que usar para presentar
 * ante USCIS o una corte: **conserva el color**. Los sellos, las firmas en
 * tinta azul y los hologramas son parte de la prueba; un umbral los borra.
 * `bw` existe para texto denso, donde reduce muchísimo el peso del archivo.
 */
export type EnhanceMode = "document" | "gray" | "bw" | "photo";

export type WarpRequest = {
  image: ImageData;
  quad: Quad;
  mode: EnhanceMode;
  /**
   * Lado mayor máximo de la salida. 2200 px ≈ 200 ppp en una hoja Carta:
   * más que suficiente para leer y para el OCR de la oficina receptora, y
   * sin inflar el archivo hasta que no se pueda ni subir.
   */
  maxSide?: number;
};

const DEFAULT_MAX_SIDE = 2200;

// ─── Enderezado ──────────────────────────────────────────

/**
 * Convierte el cuadrilátero en un rectángulo recto.
 *
 * Se recorre el DESTINO y por cada píxel se busca su origen (mapeo
 * inverso). Hacerlo al revés —recorrer el origen y pintar el destino—
 * dejaría huecos sin pintar allí donde la imagen se estira.
 *
 * El muestreo es bilineal: promedia los cuatro píxeles vecinos. Con el
 * vecino más cercano, el texto pequeño de un pasaporte sale con los bordes
 * dentados y el OCR de la oficina receptora falla.
 */
export function warpQuad(req: WarpRequest): ImageData {
  const { image, quad } = req;
  const maxSide = req.maxSide ?? DEFAULT_MAX_SIDE;

  const natural = naturalSize(quad);
  const scale = Math.min(1, maxSide / Math.max(natural.width, natural.height));
  const outW = Math.max(1, Math.round(natural.width * scale));
  const outH = Math.max(1, Math.round(natural.height * scale));

  const proj = projectionFromQuad(quad);
  const src = image.data;
  const srcW = image.width;
  const srcH = image.height;
  const out = new ImageData(outW, outH);
  const dst = out.data;

  for (let y = 0; y < outH; y++) {
    // +0,5 muestrea el CENTRO del píxel, no su esquina: sin ese medio
    // píxel la imagen sale desplazada media muestra hacia arriba y a la
    // izquierda, que es un desenfoque sutil pero visible en texto pequeño.
    const v = (y + 0.5) / outH;

    for (let x = 0; x < outW; x++) {
      const u = (x + 0.5) / outW;
      const p = project(proj, u, v);

      const fx = Math.min(Math.max(p.x, 0), srcW - 1);
      const fy = Math.min(Math.max(p.y, 0), srcH - 1);
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const y1 = Math.min(y0 + 1, srcH - 1);
      const ax = fx - x0;
      const ay = fy - y0;

      const i00 = (y0 * srcW + x0) * 4;
      const i10 = (y0 * srcW + x1) * 4;
      const i01 = (y1 * srcW + x0) * 4;
      const i11 = (y1 * srcW + x1) * 4;
      const o = (y * outW + x) * 4;

      for (let c = 0; c < 3; c++) {
        const top = src[i00 + c] + (src[i10 + c] - src[i00 + c]) * ax;
        const bottom = src[i01 + c] + (src[i11 + c] - src[i01 + c]) * ax;
        dst[o + c] = top + (bottom - top) * ay;
      }
      dst[o + 3] = 255;
    }
  }

  return out;
}

// ─── Realce ──────────────────────────────────────────────

/**
 * Media local mediante imagen integral.
 *
 * Una imagen integral permite obtener la suma de cualquier rectángulo con
 * cuatro lecturas, así que el desenfoque cuesta lo mismo con una ventana de
 * 5 píxeles que con una de 200. Sin esto, la ventana que hace falta para
 * corregir la iluminación (~1/8 del ancho) sería inviable en un móvil.
 */
function localMean(gray: Float32Array, w: number, h: number, radius: number): Float32Array {
  const integral = new Float64Array((w + 1) * (h + 1));

  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += gray[y * w + x];
      integral[(y + 1) * (w + 1) + (x + 1)] = integral[y * (w + 1) + (x + 1)] + rowSum;
    }
  }

  const mean = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - radius);
    const y1 = Math.min(h - 1, y + radius);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - radius);
      const x1 = Math.min(w - 1, x + radius);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum =
        integral[(y1 + 1) * (w + 1) + (x1 + 1)] -
        integral[y0 * (w + 1) + (x1 + 1)] -
        integral[(y1 + 1) * (w + 1) + x0] +
        integral[y0 * (w + 1) + x0];
      mean[y * w + x] = sum / area;
    }
  }
  return mean;
}

function toGray(data: Uint8ClampedArray, count: number): Float32Array {
  const gray = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const o = i * 4;
    // Coeficientes de luminancia: el ojo humano ve el verde mucho más
    // brillante que el azul. Un promedio simple oscurece el texto en tinta.
    gray[i] = data[o] * 0.299 + data[o + 1] * 0.587 + data[o + 2] * 0.114;
  }
  return gray;
}

/**
 * Deja el documento con aspecto de escaneado.
 *
 * Lo que de verdad arruina una foto de un papel no es el color: es la
 * iluminación desigual —la sombra de la propia mano, el reflejo de la
 * lámpara. Se corrige dividiendo cada píxel por la media de su entorno, que
 * aplana la sombra sin tocar el contenido.
 */
export function enhance(image: ImageData, mode: EnhanceMode): ImageData {
  if (mode === "photo") return image;

  const { width: w, height: h, data } = image;
  const count = w * h;
  const gray = toGray(data, count);

  // La ventana debe ser bastante mayor que una letra: si se acerca al
  // tamaño del texto, el algoritmo confunde las propias letras con sombra
  // y las borra. Un octavo del lado corto funciona en todos los tamaños.
  const radius = Math.max(8, Math.round(Math.min(w, h) / 8));
  const mean = localMean(gray, w, h, radius);

  const out = new ImageData(w, h);
  const dst = out.data;

  if (mode === "bw") {
    for (let i = 0; i < count; i++) {
      // Umbral relativo (Sauvola simplificado): el 88 % de la media local.
      // Un umbral fijo pinta de negro cualquier página fotografiada en
      // penumbra y de blanco cualquiera a plena luz.
      const on = gray[i] < mean[i] * 0.88 ? 0 : 255;
      const o = i * 4;
      dst[o] = dst[o + 1] = dst[o + 2] = on;
      dst[o + 3] = 255;
    }
    return out;
  }

  for (let i = 0; i < count; i++) {
    const o = i * 4;
    // Ganancia local: lleva la media de la zona a blanco. Se limita a 3x
    // para que una esquina en sombra profunda no explote en ruido.
    const gain = Math.min(3, 235 / Math.max(mean[i], 1));

    if (mode === "gray") {
      const v = gray[i] * gain;
      // Curva de contraste alrededor del gris medio: separa el texto del
      // papel sin llegar a un blanco y negro duro.
      const c = (v - 128) * 1.15 + 128;
      const g = c < 0 ? 0 : c > 255 ? 255 : c;
      dst[o] = dst[o + 1] = dst[o + 2] = g;
    } else {
      for (let ch = 0; ch < 3; ch++) {
        const v = data[o + ch] * gain;
        const c = (v - 128) * 1.12 + 128;
        dst[o + ch] = c < 0 ? 0 : c > 255 ? 255 : c;
      }
    }
    dst[o + 3] = 255;
  }

  return out;
}

/** Enderezado y realce en una sola pasada. */
export function scanPage(req: WarpRequest): ImageData {
  return enhance(warpQuad(req), req.mode);
}
