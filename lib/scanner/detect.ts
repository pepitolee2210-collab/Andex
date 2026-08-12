/**
 * ESCÁNER — detección automática de los bordes del documento.
 *
 * Encuentra el papel dentro de la foto para proponer el recorte ya hecho.
 * Es una AYUDA, no una autoridad: si falla devuelve `null` y el usuario
 * ajusta las esquinas a mano, que es el camino que siempre funciona.
 *
 * Son ~150 líneas sobre una miniatura de 320 px, así que cuesta
 * milisegundos incluso en un teléfono lento. Se escribió a mano por eso, no
 * por ahorrar kilobytes: el peso dejó de ser criterio de rechazo (D61).
 *
 * ⚠️ Falla en el caso clásico —papel claro sobre mesa clara, sin gradiente
 * que encontrar—. Cuando toque mejorarlo, Scanic o un detector aprendido
 * entran sin discutir el tamaño; sólo hay que medirlos contra esto primero
 * (docs/evidencia-escaner.md).
 *
 * El método: gradiente de Sobel para encontrar los bordes, transformada de
 * Hough para agrupar esos puntos en líneas rectas, y de esas líneas se
 * eligen las dos más horizontales y las dos más verticales. Sus cuatro
 * intersecciones son las esquinas del papel.
 */

import { isUsableQuad, orderCorners, type Point, type Quad } from "./geometry";

/** Ancho de trabajo. Suficiente para ver los bordes, ridículo de procesar. */
const WORK_WIDTH = 320;
/** Resolución angular de la transformada, en grados. */
const THETA_STEPS = 180;

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
      out[y * w + x] = n > 0 ? sum / n : 0;
    }
  }
  return { data: out, width: w, height: h };
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

/** Dos rectas del mismo grupo, lo más separadas posible. */
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
export function detectDocument(image: ImageData): Quad | null {
  try {
    const gray = downscaleToGray(image);
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

    // De vuelta a la escala de la imagen original.
    const scale = image.width / gray.width;
    const scaled = corners.map((p) => ({ x: p.x * scale, y: p.y * scale }));

    const quad = orderCorners(scaled);
    if (!quad) return null;

    // Las esquinas deben caer dentro de la foto, con un margen de
    // tolerancia: una recta bien detectada puede cruzarse un poco fuera.
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
