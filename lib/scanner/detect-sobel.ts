/**
 * ESCÁNER — detección de bordes propia (Sobel + Hough).
 *
 * ⚠️ Ya NO es el detector principal. Desde que se midió contra Scanic
 * (`comparativa.test.ts`) éste es el ÚLTIMO recurso: entra sólo si Scanic no
 * puede cargarse. Se conserva porque no tiene dependencias y está probado,
 * así que un fallo del paquete externo degrada la detección en vez de
 * borrarla.
 *
 * Encuentra el papel dentro de la foto para proponer el recorte ya hecho.
 * Es una AYUDA, no una autoridad: si falla devuelve `null` y el usuario
 * ajusta las esquinas a mano, que es el camino que siempre funciona.
 *
 * Son ~150 líneas sobre una miniatura de 320 px, así que cuesta
 * milisegundos incluso en un teléfono lento. Se escribió a mano por eso, no
 * por ahorrar kilobytes: el peso dejó de ser criterio de rechazo (D61).
 *
 * El método: se pasa la luminancia a escala LOGARÍTMICA, se desenfoca para
 * borrar el texto, se busca el gradiente con Sobel, se agrupan los puntos en
 * rectas con la transformada de Hough, y de esas rectas se eligen las dos
 * más horizontales y las dos más verticales. Sus cuatro intersecciones son
 * las esquinas del papel.
 *
 * ── Los dos pasos que no son obvios, y por qué están ──
 *
 * Ambos salieron de medir (`detect.test.ts`), no de teorizar. Sin ellos el
 * detector no fallaba: devolvía un recorte EQUIVOCADO con toda seguridad,
 * que es peor, porque la persona lo acepta sin mirar.
 *
 * **1. Escala logarítmica.** Una sombra multiplica la luz que llega, así que
 * en escala lineal el mismo borde de papel salta 210 niveles a plena luz y
 * sólo 73 bajo la sombra de la mano; Hough veía la mitad del papel. En
 * logaritmo un factor se vuelve una suma constante:
 *
 *     log(253) − log(43) = 1,77      (borde iluminado)
 *     log(88)  − log(15) = 1,77      (mismo borde, en sombra)
 *
 * El borde pasa a valer lo mismo esté donde esté. Error medido en el caso
 * de la sombra: del 17,9 % al 0,2 %.
 *
 * **2. Desenfoque previo.** El TEXTO del documento tiene mucho más contraste
 * que el borde del papel — sobre una mesa clara, 23 veces más—, así que el
 * umbral por percentil se calibraba con el texto y el borde del papel
 * quedaba por debajo: se recortaba el párrafo en vez de la hoja. Sobre la
 * miniatura de 320 px una línea de texto mide 3–4 px y el desenfoque la
 * borra; el borde del papel es una frontera larga y sobrevive.
 */

import { isUsableQuad, orderCorners, type Point, type Quad } from "./geometry";

/** Ancho de trabajo. Suficiente para ver los bordes, ridículo de procesar. */
const WORK_WIDTH = 320;
/** Resolución angular de la transformada, en grados. */
const THETA_STEPS = 180;

/**
 * Radio del desenfoque, como fracción del lado corto de la miniatura.
 * ~3 px a 320 px de ancho: suficiente para borrar una línea de texto y
 * demasiado poco para difuminar el borde de la hoja.
 */
const BLUR_RATIO = 1 / 100;

type Gray = { data: Float32Array; width: number; height: number };

function downscaleToGray(image: ImageData): Gray {
  const scale = Math.min(1, WORK_WIDTH / image.width);
  const w = Math.max(16, Math.round(image.width * scale));
  const h = Math.max(16, Math.round(image.height * scale));
  const out = new Float32Array(w * h);
  const src = image.data;

  // Promedio de área: cada píxel de destino promedia el bloque de origen
  // que le corresponde. Tomar una muestra suelta dejaría fuera bordes
  // finos, justo lo que se está buscando.
  const bx = image.width / w;
  const by = image.height / h;

  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * by);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * by));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * bx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * bx));
      let sum = 0;
      let n = 0;
      for (let sy = y0; sy < y1 && sy < image.height; sy++) {
        for (let sx = x0; sx < x1 && sx < image.width; sx++) {
          const o = (sy * image.width + sx) * 4;
          sum += src[o] * 0.299 + src[o + 1] * 0.587 + src[o + 2] * 0.114;
          n++;
        }
      }
      // Escala logarítmica (ver cabecera): iguala el mismo borde de papel
      // esté a plena luz o bajo una sombra. `1 +` evita log(0), y el factor
      // devuelve el rango a 0–255 para que los umbrales de más abajo sigan
      // significando lo mismo.
      out[y * w + x] = n > 0 ? Math.log(1 + sum / n) * LOG_SCALE : 0;
    }
  }
  return { data: out, width: w, height: h };
}

/** 255 / ln(256): devuelve la luminancia logarítmica al rango 0–255. */
const LOG_SCALE = 255 / Math.log(256);

/**
 * Desenfoque de caja separable, aplicado dos veces.
 *
 * Dos pasadas de caja se aproximan a una gaussiana y cuestan una fracción:
 * cada eje es una suma corrediza, así que el coste no depende del radio.
 * Aquí sirve para borrar el texto antes de buscar bordes.
 */
function blur(g: Gray, radius: number): Gray {
  const { width: w, height: h } = g;
  let src: Float32Array<ArrayBuffer> = g.data as Float32Array<ArrayBuffer>;
  let dst: Float32Array<ArrayBuffer> = new Float32Array(w * h);

  for (let pass = 0; pass < 2; pass += 1) {
    // Horizontal
    for (let y = 0; y < h; y += 1) {
      const fila = y * w;
      let suma = 0;
      for (let x = 0; x <= radius && x < w; x += 1) suma += src[fila + x];
      let cuenta = Math.min(radius + 1, w);
      for (let x = 0; x < w; x += 1) {
        dst[fila + x] = suma / cuenta;
        const sale = x - radius;
        const entra = x + radius + 1;
        if (sale >= 0) { suma -= src[fila + sale]; cuenta -= 1; }
        if (entra < w) { suma += src[fila + entra]; cuenta += 1; }
      }
    }
    [src, dst] = [dst, src];

    // Vertical
    for (let x = 0; x < w; x += 1) {
      let suma = 0;
      for (let y = 0; y <= radius && y < h; y += 1) suma += src[y * w + x];
      let cuenta = Math.min(radius + 1, h);
      for (let y = 0; y < h; y += 1) {
        dst[y * w + x] = suma / cuenta;
        const sale = y - radius;
        const entra = y + radius + 1;
        if (sale >= 0) { suma -= src[sale * w + x]; cuenta -= 1; }
        if (entra < h) { suma += src[entra * w + x]; cuenta += 1; }
      }
    }
    [src, dst] = [dst, src];
  }

  return { data: src, width: w, height: h };
}

/**
 * Estira el contraste al rango completo.
 *
 * Es lo que hace detectable el peor caso de todos: una hoja blanca sobre una
 * mesa clara. Ahí el borde del papel salta apenas 4 niveles de gris, por
 * debajo del piso de ruido de cualquier umbral razonable, y el detector se
 * rendía. Reescalando ese margen a 0–255 el mismo borde pasa a valer lo que
 * valdría sobre una mesa oscura.
 *
 * Va DESPUÉS del desenfoque a propósito: al revés amplificaría el grano del
 * sensor, que es justo lo que el desenfoque acaba de quitar.
 *
 * Y no se estira cuando el rango es minúsculo: una foto casi uniforme —una
 * pared, una mesa vacía— no tiene borde que encontrar, y amplificarla sólo
 * convertiría su ruido en bordes falsos.
 */
const MIN_RANGE = 2;

function stretchContrast(g: Gray): Gray {
  const { data, width, height } = g;
  // Percentiles y no mínimo/máximo: un píxel quemado o una mota oscura no
  // pueden decidir el reescalado de la imagen entera.
  const muestra = Float32Array.from(data).sort();
  const bajo = muestra[Math.floor(muestra.length * 0.02)];
  const alto = muestra[Math.floor(muestra.length * 0.98)];
  const rango = alto - bajo;
  if (rango < MIN_RANGE) return g;

  const out = new Float32Array(data.length);
  const k = 255 / rango;
  for (let i = 0; i < data.length; i += 1) {
    const v = (data[i] - bajo) * k;
    out[i] = v < 0 ? 0 : v > 255 ? 255 : v;
  }
  return { data: out, width, height };
}

/** Magnitud del gradiente (Sobel). Alta donde hay un borde. */
function sobel(g: Gray): Float32Array {
  const { data, width: w, height: h } = g;
  const mag = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -data[i - w - 1] - 2 * data[i - 1] - data[i + w - 1] +
        data[i - w + 1] + 2 * data[i + 1] + data[i + w + 1];
      const gy =
        -data[i - w - 1] - 2 * data[i - w] - data[i - w + 1] +
        data[i + w - 1] + 2 * data[i + w] + data[i + w + 1];
      mag[i] = Math.hypot(gx, gy);
    }
  }
  return mag;
}

type Line = { theta: number; rho: number; votes: number };

/**
 * Transformada de Hough: cada punto de borde vota por todas las rectas que
 * pasan por él. Las rectas reales acumulan muchos votos; el ruido, pocos.
 */
function houghLines(mag: Float32Array, w: number, h: number): Line[] {
  // Umbral relativo al percentil: un umbral fijo deja sin bordes una foto
  // en penumbra y llena de ruido una a plena luz.
  const sorted = Float32Array.from(mag).sort();
  const threshold = Math.max(20, sorted[Math.floor(sorted.length * 0.9)]);

  const diag = Math.ceil(Math.hypot(w, h));
  const rhoOffset = diag;
  const rhoSize = diag * 2 + 1;
  const acc = new Int32Array(THETA_STEPS * rhoSize);

  const cos = new Float32Array(THETA_STEPS);
  const sin = new Float32Array(THETA_STEPS);
  for (let t = 0; t < THETA_STEPS; t++) {
    const a = (t * Math.PI) / THETA_STEPS;
    cos[t] = Math.cos(a);
    sin[t] = Math.sin(a);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mag[y * w + x] < threshold) continue;
      for (let t = 0; t < THETA_STEPS; t++) {
        const rho = Math.round(x * cos[t] + y * sin[t]) + rhoOffset;
        acc[t * rhoSize + rho]++;
      }
    }
  }

  // Máximos locales: sin esto, una sola recta produciría decenas de
  // candidatas casi idénticas y todas ganarían.
  const lines: Line[] = [];
  const minVotes = Math.max(18, Math.round(Math.min(w, h) * 0.25));
  for (let t = 0; t < THETA_STEPS; t++) {
    for (let r = 1; r < rhoSize - 1; r++) {
      const v = acc[t * rhoSize + r];
      if (v < minVotes) continue;
      if (v < acc[t * rhoSize + r - 1] || v < acc[t * rhoSize + r + 1]) continue;
      lines.push({ theta: (t * Math.PI) / THETA_STEPS, rho: r - rhoOffset, votes: v });
    }
  }
  return lines.sort((a, b) => b.votes - a.votes);
}

/** Intersección de dos rectas en forma normal. `null` si son paralelas. */
function intersect(a: Line, b: Line): Point | null {
  const det = Math.cos(a.theta) * Math.sin(b.theta) - Math.sin(a.theta) * Math.cos(b.theta);
  if (Math.abs(det) < 1e-6) return null;
  return {
    x: (a.rho * Math.sin(b.theta) - b.rho * Math.sin(a.theta)) / det,
    y: (b.rho * Math.cos(a.theta) - a.rho * Math.cos(b.theta)) / det,
  };
}

/**
 * Dos rectas del mismo grupo, lo más separadas posible.
 *
 * Se probó a sustituir esto por una búsqueda que puntuara todos los
 * cuadriláteros candidatos por área, para que un bloque de texto no ganara
 * al papel. Medido contra el banco: **empeoró**. Pasó de 7 casos correctos a
 * 6, porque el candidato de mayor área acaba siendo ruido del borde de la
 * foto. Queda anotado para que nadie lo reintente creyendo que es obvio; ese
 * caso lo resuelve el detector neuronal de la cascada.
 */
function pickPair(lines: readonly Line[], minGap: number): [Line, Line] | null {
  if (lines.length < 2) return null;
  const first = lines[0];
  for (const candidate of lines.slice(1)) {
    if (Math.abs(candidate.rho - first.rho) >= minGap) {
      return first.rho < candidate.rho ? [first, candidate] : [candidate, first];
    }
  }
  return null;
}

/**
 * Propone el recorte del documento. `null` cuando no hay una respuesta
 * fiable — es preferible a inventarse un recorte que el usuario tendría que
 * deshacer.
 */
export function detectWithSobelHough(image: ImageData): Quad | null {
  try {
    const small = downscaleToGray(image);
    const radius = Math.max(1, Math.round(Math.min(small.width, small.height) * BLUR_RATIO));
    const gray = stretchContrast(blur(small, radius));
    const mag = sobel(gray);
    const lines = houghLines(mag, gray.width, gray.height);
    if (lines.length < 4) return null;

    // Se separan por orientación. Un papel puede estar inclinado, pero no
    // 45°: con ±30° se cubre cualquier foto tomada a mano.
    const TOL = Math.PI / 6;
    const vertical = lines.filter(
      (l) => l.theta < TOL || l.theta > Math.PI - TOL,
    );
    const horizontal = lines.filter(
      (l) => Math.abs(l.theta - Math.PI / 2) < TOL,
    );

    const pairV = pickPair(vertical, gray.width * 0.35);
    const pairH = pickPair(horizontal, gray.height * 0.35);
    if (!pairV || !pairH) return null;

    const corners: Point[] = [];
    for (const v of pairV) {
      for (const hLine of pairH) {
        const p = intersect(v, hLine);
        if (!p) return null;
        corners.push(p);
      }
    }

    const scale = image.width / gray.width;
    const scaled = corners.map((p) => ({ x: p.x * scale, y: p.y * scale }));
    const quad = orderCorners(scaled);
    if (!quad) return null;

    // Las esquinas deben caer dentro de la foto, con holgura: una recta bien
    // detectada puede cruzarse un poco fuera del encuadre.
    const slack = Math.max(image.width, image.height) * 0.08;
    const inside = [quad.topLeft, quad.topRight, quad.bottomRight, quad.bottomLeft].every(
      (p) =>
        p.x >= -slack &&
        p.y >= -slack &&
        p.x <= image.width + slack &&
        p.y <= image.height + slack,
    );
    if (!inside) return null;

    return isUsableQuad(quad, image.width, image.height) ? quad : null;
  } catch {
    // La detección es un lujo: si algo falla, el ajuste manual sigue ahí.
    return null;
  }
}
