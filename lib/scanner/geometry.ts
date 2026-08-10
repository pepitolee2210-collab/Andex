/**
 * ESCÁNER — geometría del enderezado.
 *
 * Toda la matemática de la corrección de perspectiva vive aquí: es código
 * puro, sin canvas ni DOM, para poder probarlo con números en vez de a ojo.
 *
 * El problema: una foto de un documento tomada a mano es un cuadrilátero
 * cualquiera. Hay que convertirlo en un rectángulo perfecto. Eso es una
 * homografía — la misma transformación que usa un proyector inclinado.
 *
 * Se usa la formulación de "cuadrado unidad → cuadrilátero" (Heckbert) en
 * lugar de resolver un sistema de 8×8 e invertir la matriz. Dos razones:
 * es la dirección que hace falta para muestrear (por cada píxel de salida
 * se busca su origen), y evita la inversión, que con un cuadrilátero casi
 * degenerado —el usuario arrastró mal una esquina— es donde aparecen los
 * infinitos y las divisiones por cero.
 */

export type Point = { x: number; y: number };

/**
 * Las cuatro esquinas del documento, SIEMPRE en este orden. Que el orden
 * sea explícito evita el error más común del enderezado: una imagen
 * volteada o girada 90° porque las esquinas llegaron en otro orden.
 */
export type Quad = {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
};

/**
 * Coeficientes de la proyección del cuadrado unidad al cuadrilátero.
 *   X = (a·u + b·v + c) / (g·u + h·v + 1)
 *   Y = (d·u + e·v + f) / (g·u + h·v + 1)
 * con (u,v) en [0,1]².
 */
export type Projection = {
  a: number; b: number; c: number;
  d: number; e: number; f: number;
  g: number; h: number;
};

/** Proyección del cuadrado unidad al cuadrilátero dado. */
export function projectionFromQuad(q: Quad): Projection {
  const { topLeft: p0, topRight: p1, bottomRight: p2, bottomLeft: p3 } = q;

  const sx = p0.x - p1.x + p2.x - p3.x;
  const sy = p0.y - p1.y + p2.y - p3.y;

  // Sin fuga de perspectiva (lados paralelos) la transformación es afín y
  // los términos g/h desaparecen. Tratarlo aparte evita dividir por cero.
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) {
    return {
      a: p1.x - p0.x, b: p2.x - p1.x, c: p0.x,
      d: p1.y - p0.y, e: p2.y - p1.y, f: p0.y,
      g: 0, h: 0,
    };
  }

  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const det = dx1 * dy2 - dy1 * dx2;

  // Cuadrilátero degenerado (tres puntos alineados): se devuelve la afín,
  // que produce una imagen fea pero nunca un NaN propagado a todo el lienzo.
  if (Math.abs(det) < 1e-9) {
    return {
      a: p1.x - p0.x, b: p2.x - p1.x, c: p0.x,
      d: p1.y - p0.y, e: p2.y - p1.y, f: p0.y,
      g: 0, h: 0,
    };
  }

  const g = (sx * dy2 - sy * dx2) / det;
  const h = (dx1 * sy - dy1 * sx) / det;

  return {
    a: p1.x - p0.x + g * p1.x,
    b: p3.x - p0.x + h * p3.x,
    c: p0.x,
    d: p1.y - p0.y + g * p1.y,
    e: p3.y - p0.y + h * p3.y,
    f: p0.y,
    g,
    h,
  };
}

/** Punto del cuadrilátero que corresponde a (u,v) del cuadrado unidad. */
export function project(p: Projection, u: number, v: number): Point {
  const w = p.g * u + p.h * v + 1;
  // `w` sólo se anula en el horizonte de fuga, fuera del documento.
  const iw = Math.abs(w) < 1e-12 ? 1e12 : 1 / w;
  return {
    x: (p.a * u + p.b * v + p.c) * iw,
    y: (p.d * u + p.e * v + p.f) * iw,
  };
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Tamaño de salida que conserva el detalle del original.
 *
 * Se toma el lado MÁS LARGO de cada par opuesto: si el documento está
 * inclinado, el borde cercano a la cámara tiene más píxeles reales que el
 * lejano. Quedarse con el corto tiraría resolución que sí se capturó.
 */
export function naturalSize(q: Quad): { width: number; height: number } {
  const width = Math.max(
    dist(q.topLeft, q.topRight),
    dist(q.bottomLeft, q.bottomRight),
  );
  const height = Math.max(
    dist(q.topLeft, q.bottomLeft),
    dist(q.topRight, q.bottomRight),
  );
  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Ordena cuatro puntos sueltos en el orden canónico del `Quad`.
 *
 * La detección automática y el arrastre del usuario pueden entregarlos en
 * cualquier orden; sin normalizar, el documento saldría del revés. Se
 * ordena por ángulo respecto al centro, que es estable aunque el papel
 * esté girado o muy inclinado.
 */
export function orderCorners(points: readonly Point[]): Quad | null {
  if (points.length !== 4) return null;

  const cx = points.reduce((s, p) => s + p.x, 0) / 4;
  const cy = points.reduce((s, p) => s + p.y, 0) / 4;

  const byAngle = [...points].sort(
    (p, r) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(r.y - cy, r.x - cx),
  );

  // `atan2` arranca en el eje X negativo, así que el primero del giro es el
  // punto "más arriba a la izquierda"; se rota la lista para empezar ahí.
  let start = 0;
  let best = Infinity;
  byAngle.forEach((p, i) => {
    const score = p.x + p.y;
    if (score < best) {
      best = score;
      start = i;
    }
  });

  const [topLeft, topRight, bottomRight, bottomLeft] = [
    byAngle[start],
    byAngle[(start + 1) % 4],
    byAngle[(start + 2) % 4],
    byAngle[(start + 3) % 4],
  ];

  return { topLeft, topRight, bottomRight, bottomLeft };
}

/** Cuadrilátero por defecto: casi toda la imagen, con un margen del 5 %. */
export function defaultQuad(width: number, height: number): Quad {
  const mx = width * 0.05;
  const my = height * 0.05;
  return {
    topLeft: { x: mx, y: my },
    topRight: { x: width - mx, y: my },
    bottomRight: { x: width - mx, y: height - my },
    bottomLeft: { x: mx, y: height - my },
  };
}

/** Área del cuadrilátero (fórmula del cordón de zapato). */
export function quadArea(q: Quad): number {
  const p = [q.topLeft, q.topRight, q.bottomRight, q.bottomLeft];
  let s = 0;
  for (let i = 0; i < 4; i++) {
    const a = p[i];
    const b = p[(i + 1) % 4];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

/**
 * ¿El recorte es utilizable? Se rechaza lo que produciría un documento
 * ilegible: un cuadrilátero diminuto o uno tan retorcido que el enderezado
 * estiraría los píxeles hasta deshacerlos.
 */
export function isUsableQuad(q: Quad, imgW: number, imgH: number): boolean {
  const area = quadArea(q);
  if (area < imgW * imgH * 0.03) return false;

  const { width, height } = naturalSize(q);
  if (width < 40 || height < 40) return false;

  // Un lado no puede ser menos de un tercio de su opuesto: eso ya no es
  // perspectiva, es un cuadrilátero mal puesto.
  const top = dist(q.topLeft, q.topRight);
  const bottom = dist(q.bottomLeft, q.bottomRight);
  const left = dist(q.topLeft, q.bottomLeft);
  const right = dist(q.topRight, q.bottomRight);
  if (Math.min(top, bottom) < Math.max(top, bottom) / 3) return false;
  if (Math.min(left, right) < Math.max(left, right) / 3) return false;

  return true;
}
