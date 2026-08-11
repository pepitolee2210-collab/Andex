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
   * Lado mayor máximo de la salida. 3300 px es el lado largo de una hoja
   * Carta a 300 ppp, que es el mínimo con el que un OCR lee letra pequeña
   * sin inventarse caracteres. Los 2200 de antes eran 200 ppp: se leía, pero
   * se estaba tirando resolución de una cámara de 12 MP por una constante.
   *
   * Es un TOPE, no un objetivo: nunca se amplía por encima de los píxeles
   * que la foto tenía dentro del cuadrilátero (ver `warpQuad`). Ampliar no
   * añade detalle, sólo peso y una nitidez falsa.
   */
  maxSide?: number;
};

const DEFAULT_MAX_SIDE = 3300;

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
 * Percentiles locales del fondo y de la tinta, calculados en MINIATURA.
 *
 * Dropbox resuelve el realce como una ecuación de Poisson, pero lo que
 * aplica en la práctica es una transformación de **ganancia y
 * desplazamiento que varía despacio por la imagen**
 * (dropbox.tech/machine-learning/fast-document-rectification-and-enhancement).
 * Eso es exactamente lo que se estima aquí: por cada zona, cuánto vale su
 * papel y cuánto su tinta.
 *
 * Se calcula sobre una miniatura y luego se interpola, por dos razones. La
 * barata: cuesta una fracción. La importante: la iluminación varía despacio
 * y el texto no, así que estimar a resolución completa mete el propio texto
 * dentro de la estimación y deja halos claros alrededor de cada letra.
 */
const FIELD_SIDE = 48;

/**
 * Nivel del PAPEL por canal, celda a celda.
 *
 * Sólo se estima el papel, nunca la tinta. Intentarlo con la tinta fue un
 * error medido: una celda con texto y su vecina sin él daban transformaciones
 * distintas, y la costura entre las dos se veía como un parche rectangular
 * alrededor de cada párrafo. La iluminación varía despacio; el contenido no.
 *
 * Y por canal, no sobre el gris: dividir cada canal por SU propio nivel de
 * papel es, gratis, un balance de blancos. Con un único factor sacado de la
 * luminancia el tinte cálido de la bombilla sobrevive intacto y el papel
 * queda crema, que es la mitad de lo que delata a una foto.
 */
type PaperField = { r: Float32Array; g: Float32Array; b: Float32Array; w: number; h: number };

function percentileOf(bucket: number[], p: number): number {
  bucket.sort((a, b) => a - b);
  return bucket[Math.min(bucket.length - 1, Math.floor(bucket.length * p))];
}

function estimatePaper(data: Uint8ClampedArray, w: number, h: number): PaperField {
  const fw = Math.max(2, Math.min(FIELD_SIDE, w));
  const fh = Math.max(2, Math.min(FIELD_SIDE, h));
  const cellW = w / fw;
  const cellH = h / fh;
  // `Float32Array<ArrayBuffer>` explícito: sin la anotación, TypeScript
  // infiere `ArrayBufferLike` y luego rechaza reasignar el resultado de
  // `blurField`, que sí devuelve un búfer normal.
  const channels: Float32Array<ArrayBuffer>[] = [
    new Float32Array(fw * fh),
    new Float32Array(fw * fh),
    new Float32Array(fw * fh),
  ];
  const buckets = [[] as number[], [] as number[], [] as number[]];

  for (let cy = 0; cy < fh; cy++) {
    const y0 = Math.round(cy * cellH);
    const y1 = Math.min(h - 1, Math.round((cy + 1) * cellH));
    for (let cx = 0; cx < fw; cx++) {
      const x0 = Math.round(cx * cellW);
      const x1 = Math.min(w - 1, Math.round((cx + 1) * cellW));
      for (const b of buckets) b.length = 0;

      const stepX = Math.max(1, Math.round((x1 - x0 + 1) / 16));
      const stepY = Math.max(1, Math.round((y1 - y0 + 1) / 16));
      for (let y = y0; y <= y1; y += stepY) {
        for (let x = x0; x <= x1; x += stepX) {
          const o = (y * w + x) * 4;
          buckets[0].push(data[o]);
          buckets[1].push(data[o + 1]);
          buckets[2].push(data[o + 2]);
        }
      }
      // Percentil 85, no el máximo: un reflejo especular quemado no puede
      // decidir cuánto vale el papel de toda una zona.
      for (let c = 0; c < 3; c++) channels[c][cy * fw + cx] = percentileOf(buckets[c], 0.85);
    }
  }

  // Dilatación seguida de desenfoque. La dilatación arregla las celdas que
  // caen enteras sobre contenido oscuro —la banda azul de la cabecera, una
  // foto— donde el percentil alto ya no es papel sino tinta: sin esto, esas
  // celdas pedirían una ganancia enorme y la cabecera saldría lavada. Toman
  // prestado el nivel de sus vecinas, que sí ven papel.
  for (let c = 0; c < 3; c++) channels[c] = blurField(dilateField(channels[c], fw, fh), fw, fh);

  return { r: channels[0], g: channels[1], b: channels[2], w: fw, h: fh };
}

function dilateField(src: Float32Array, w: number, h: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let max = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const yy = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -1; dx <= 1; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          const v = src[yy * w + xx];
          if (v > max) max = v;
        }
      }
      out[y * w + x] = max;
    }
  }
  return out;
}

function blurField(src: Float32Array, w: number, h: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(w * h);
  const R = 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -R; dy <= R; dy++) {
        const yy = Math.min(h - 1, Math.max(0, y + dy));
        for (let dx = -R; dx <= R; dx++) {
          const xx = Math.min(w - 1, Math.max(0, x + dx));
          sum += src[yy * w + xx];
          n++;
        }
      }
      out[y * w + x] = sum / n;
    }
  }
  return out;
}

/** Lee el campo en coordenadas de la imagen grande, interpolando. */
function sampleField(field: Float32Array, f: PaperField, x: number, y: number, w: number, h: number): number {
  const fx = Math.min(f.w - 1, Math.max(0, (x / w) * f.w - 0.5));
  const fy = Math.min(f.h - 1, Math.max(0, (y / h) * f.h - 0.5));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(f.w - 1, x0 + 1);
  const y1 = Math.min(f.h - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const a = field[y0 * f.w + x0] * (1 - tx) + field[y0 * f.w + x1] * tx;
  const b = field[y1 * f.w + x0] * (1 - tx) + field[y1 * f.w + x1] * tx;
  return a * (1 - ty) + b * ty;
}

/**
 * Deja el documento con aspecto de escaneado.
 *
 * ── Por qué no basta con dividir por la media ──
 *
 * La versión anterior sólo multiplicaba: `pixel * (235 / media_local)`. El
 * problema es de aritmética, no de ajuste: multiplicar aclara el papel **y
 * la tinta a la vez**. No existe una ganancia que lleve el fondo a blanco y
 * deje el negro en negro, así que el resultado era una foto aclarada — que
 * es justo lo que se le nota.
 *
 * Ahora se resuelve una recta por píxel con DOS anclas: el nivel del papel
 * de su zona va a 255, y el de su tinta va a ~0. Eso es la ganancia y el
 * desplazamiento de Dropbox: el fondo se blanquea y el texto se hunde, en
 * vez de irse los dos hacia arriba.
 *
 * ── Por qué el color se corrige en el VALOR y no en RGB ──
 *
 * Aplicar la corrección a los tres canales por igual conserva el tinte
 * cálido de la bombilla y el papel queda crema. Dropbox convierte a HSV y
 * respeta tono y saturación *"to prevent color shifts"*. Aquí se hace lo
 * mismo por la vía corta: la recta se aplica a la luminancia y el color se
 * reconstruye con la razón original de cada canal. El papel va a blanco y el
 * sello azul sigue azul, que en este producto es prueba documental (D54).
 */
export function enhance(image: ImageData, mode: EnhanceMode): ImageData {
  if (mode === "photo") return image;

  const { width: w, height: h, data } = image;
  const count = w * h;
  const paper = estimatePaper(data, w, h);

  const fields = [paper.r, paper.g, paper.b];

  /**
   * Valor normalizado de un canal: el píxel dividido por el nivel de papel
   * de su zona, en ese mismo canal. El fondo queda blanco y neutro —esto es
   * el balance de blancos— y la sombra desaparece porque el campo ya la
   * lleva dentro.
   *
   * Se calcula al vuelo y NUNCA se guarda la imagen normalizada entera. Un
   * `Float32Array(count * 3)` para una hoja a 300 ppp son 14,5 millones de
   * píxeles por 3 canales por 4 bytes: 174 MB en un solo búfer. En el
   * Android de gama baja al que apunta este producto eso no es lentitud, es
   * quedarse sin memoria a mitad del escaneo.
   */
  const norm = (i: number, c: number, x: number, y: number): number => {
    const level = Math.max(sampleField(fields[c], paper, x, y, w, h), 1);
    return (data[i * 4 + c] / level) * 255;
  };

  // ── El punto negro, GLOBAL y sacado de una muestra ──
  // Aquí está la lección de la primera versión: estimado por celda producía
  // parches visibles alrededor de cada párrafo. Una vez quitada la sombra,
  // la tinta de un documento es igual de oscura en toda la hoja, así que un
  // único punto negro da el mismo negro sin costuras. Y con ~20.000
  // muestras el percentil ya no se mueve: no hace falta recorrerlo todo.
  const muestras: number[] = [];
  const paso = Math.max(1, Math.floor(count / 20000));
  for (let i = 0; i < count; i += paso) {
    const x = i % w;
    const y = (i / w) | 0;
    muestras.push(Math.min(norm(i, 0, x, y), norm(i, 1, x, y), norm(i, 2, x, y)));
  }
  // Percentil 2: por debajo hay ruido y motas, no tinta.
  const negro = Math.min(200, percentileOf(muestras, 0.02)) * 0.92;
  // Se deja margen: llevar la tinta a 0 exacto quema los grises de un sello
  // y de una firma a lápiz.
  const rango = Math.max(60, 255 - negro);

  const out = new ImageData(w, h);
  const dst = out.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const o = i * 4;

      if (mode === "bw" || mode === "gray") {
        const lum =
          0.299 * norm(i, 0, x, y) + 0.587 * norm(i, 1, x, y) + 0.114 * norm(i, 2, x, y);
        const v = ((lum - negro) / rango) * 255;
        const c = v < 0 ? 0 : v > 255 ? 255 : v;
        dst[o] = dst[o + 1] = dst[o + 2] = mode === "bw" ? (c < 128 ? 0 : 255) : c;
        dst[o + 3] = 255;
        continue;
      }

      // Color: la misma recta a cada canal por separado. Al normalizar ya
      // por canal, el azul del sello sigue siendo más azul que rojo, así que
      // se oscurece sin volverse negro. Aplastarlo sería borrar prueba
      // documental (D54).
      for (let c = 0; c < 3; c++) {
        const v = ((norm(i, c, x, y) - negro) / rango) * 255;
        dst[o + c] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      dst[o + 3] = 255;
    }
  }

  return mode === "bw" ? out : sharpen(out);
}

/**
 * Máscara de desenfoque suave.
 *
 * El remuestreo bilineal del enderezado ablanda la imagen, y una foto de
 * móvil ya venía blanda de origen. Un escaneo se reconoce por el filo del
 * texto tanto como por el fondo blanco, así que sin este paso el resultado
 * sigue pareciendo una foto por muy limpio que esté el papel.
 *
 * El núcleo es 3x3 y la cantidad, discreta: pasarse genera halos alrededor
 * de las letras, que delatan el retoque más que la falta de nitidez.
 */
const SHARPEN_AMOUNT = 0.6;

function sharpen(image: ImageData): ImageData {
  const { width: w, height: h, data } = image;
  const out = new ImageData(w, h);
  const dst = out.data;
  dst.set(data);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const o = (y * w + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        const c = data[o + ch];
        // Media de los cuatro vecinos ortogonales: el desenfoque contra el
        // que se compara. La diferencia es el detalle que se realza.
        const blur =
          (data[o - 4 + ch] +
            data[o + 4 + ch] +
            data[o - w * 4 + ch] +
            data[o + w * 4 + ch]) /
          4;
        const v = c + (c - blur) * SHARPEN_AMOUNT;
        dst[o + ch] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
  }

  return out;
}

/** Enderezado y realce en una sola pasada. */
export function scanPage(req: WarpRequest): ImageData {
  return enhance(warpQuad(req), req.mode);
}
