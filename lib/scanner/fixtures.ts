/**
 * FOTOS SINTÉTICAS DE DOCUMENTOS — sólo para pruebas.
 *
 * Genera `ImageData` de un papel fotografiado, con las condiciones que de
 * verdad arruinan un escaneo: mesa clara, sombra de la mano, penumbra con
 * ruido, reflejo de lámpara, veta de madera.
 *
 * ── Por qué sintéticas y no fotos reales ──
 *
 * Porque de una foto real no se conocen las esquinas verdaderas, y sin eso
 * "el detector mejoró" es una opinión. Aquí las esquinas las dibujamos
 * nosotros, así que el error se puede medir en píxeles y comparar entre dos
 * implementaciones con un número.
 *
 * No sustituyen a probar con fotos de verdad — un sensor real tiene
 * aberraciones que esto no imita — pero atrapan las regresiones, que es lo
 * que una prueba automática puede hacer.
 */

import { projectionFromQuad, project, type Point, type Quad } from "./geometry";

export type PhotoOptions = {
  width?: number;
  height?: number;
  /** Color de la mesa, en RGB 0–255. */
  background?: readonly [number, number, number];
  /** Color del papel. */
  paper?: readonly [number, number, number];
  /** Rotación del papel, en radianes. */
  rotation?: number;
  /** Perspectiva: 0 = de frente, 0.3 = muy inclinado. */
  perspective?: number;
  /** Cuánto ocupa el papel del ancho de la foto. */
  fill?: number;
  illumination?: "flat" | "gradient" | "handShadow" | "glare";
  /** Ruido del sensor, en niveles de gris. */
  noise?: number;
  /** Veta de madera en la mesa. */
  woodGrain?: boolean;
  /** Semilla, para que el ruido sea reproducible. */
  seed?: number;
};

export type SyntheticPhoto = {
  image: ImageData;
  /** Las esquinas VERDADERAS, que es lo que hace medible la prueba. */
  truth: Quad;
};

/**
 * Generador pseudoaleatorio propio.
 *
 * `Math.random()` haría que una prueba fallara un día sí y otro no sin que
 * nadie hubiera tocado el código, que es la peor clase de prueba.
 */
function makeRandom(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/** ¿Está el punto dentro del cuadrilátero convexo? */
function insideQuad(q: Quad, x: number, y: number): boolean {
  const pts = [q.topLeft, q.topRight, q.bottomRight, q.bottomLeft];
  let sign = 0;
  for (let i = 0; i < 4; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % 4];
    const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
    if (cross === 0) continue;
    const s = cross > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return true;
}

/**
 * ImageData que funciona en los dos sitios.
 *
 * En el navegador se usa la clase nativa: un objeto con la misma forma pasa
 * los tipos de TypeScript pero `putImageData` lo rechaza, y ahí se rompen
 * las librerías que dibujan en un canvas. En Node la clase global no existe,
 * así que se cae al objeto plano — suficiente para nuestro código, que sólo
 * lee `data`, `width` y `height`.
 */
function blankImage(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  if (typeof ImageData === "function") return new ImageData(data, width, height);
  return { data, width, height, colorSpace: "srgb" } as ImageData;
}

export function makeDocumentPhoto(options: PhotoOptions = {}): SyntheticPhoto {
  const width = options.width ?? 900;
  const height = options.height ?? 1200;
  const bg = options.background ?? [43, 43, 48];
  const paper = options.paper ?? [253, 253, 251];
  const rotation = options.rotation ?? 0.03;
  const perspective = options.perspective ?? 0;
  const fill = options.fill ?? 0.72;
  const illumination = options.illumination ?? "flat";
  const noise = options.noise ?? 0;
  const rand = makeRandom(options.seed ?? 12345);

  // ── Las cuatro esquinas verdaderas ──
  const cx = width / 2;
  const cy = height / 2;
  const halfW = (width * fill) / 2;
  // Proporción Carta (8,5 × 11).
  const halfH = Math.min((halfW * 11) / 8.5, (height * 0.86) / 2);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const corner = (dx: number, dy: number, shrink: number): Point => {
    const sx = dx * shrink;
    return { x: cx + sx * cos - dy * sin, y: cy + sx * sin + dy * cos };
  };

  // La perspectiva estrecha el borde superior: es lo que hace una foto
  // tomada desde arriba en ángulo.
  const truth: Quad = {
    topLeft: corner(-halfW, -halfH, 1 - perspective),
    topRight: corner(halfW, -halfH, 1 - perspective),
    bottomRight: corner(halfW, halfH, 1),
    bottomLeft: corner(-halfW, halfH, 1),
  };

  const out = blankImage(width, height);
  const px = out.data;

  // ── Mesa ──
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const o = (y * width + x) * 4;
      let veta = 0;
      if (options.woodGrain) {
        // Vetas: rayas irregulares con bastante contraste. Es el caso que
        // más falsos bordes produce.
        veta = Math.sin(x * 0.08 + Math.sin(y * 0.01) * 3) * 22;
      }
      px[o] = bg[0] + veta;
      px[o + 1] = bg[1] + veta * 0.7;
      px[o + 2] = bg[2] + veta * 0.4;
      px[o + 3] = 255;
    }
  }

  // ── Papel ──
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!insideQuad(truth, x + 0.5, y + 0.5)) continue;
      const o = (y * width + x) * 4;
      px[o] = paper[0];
      px[o + 1] = paper[1];
      px[o + 2] = paper[2];
    }
  }

  // ── Contenido del documento ──
  // Se pinta en coordenadas del papel (u, v) y se proyecta, así el texto
  // sigue la perspectiva igual que lo haría en una foto real.
  const proj = projectionFromQuad(truth);
  const paint = (u: number, v: number, tone: number) => {
    const p = project(proj, u, v);
    const x = Math.round(p.x);
    const y = Math.round(p.y);
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const o = (y * width + x) * 4;
    px[o] = tone;
    px[o + 1] = tone;
    px[o + 2] = tone;
  };

  // Banda de cabecera oscura.
  for (let v = 0.04; v < 0.12; v += 0.0004) {
    for (let u = 0.06; u < 0.94; u += 0.0004) paint(u, v, 30);
  }
  // Líneas de texto.
  for (let linea = 0; linea < 16; linea += 1) {
    const v0 = 0.2 + linea * 0.042;
    for (let v = v0; v < v0 + 0.012; v += 0.0006) {
      const largo = 0.5 + rand() * 0.35;
      for (let u = 0.1; u < 0.1 + largo; u += 0.0005) paint(u, v, 45);
    }
  }

  // ── Iluminación ──
  if (illumination !== "flat") {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const o = (y * width + x) * 4;
        let k = 1;
        if (illumination === "gradient") {
          k = 1 - 0.55 * ((x / width) * 0.5 + (y / height) * 0.5);
        } else if (illumination === "handShadow") {
          // Sombra de la propia mano en la esquina inferior derecha: la que
          // más veces arruina una foto de un documento.
          const d = Math.hypot(x - width * 0.86, y - height * 0.88);
          const r = Math.min(width, height) * 0.65;
          k = d < r ? 0.35 + 0.65 * (d / r) : 1;
        } else if (illumination === "glare") {
          const d = Math.hypot(x - width * 0.62, y - height * 0.3);
          const r = Math.min(width, height) * 0.28;
          k = d < r ? 1 + 0.9 * (1 - d / r) : 1;
        }
        px[o] *= k;
        px[o + 1] *= k;
        px[o + 2] *= k;
      }
    }
  }

  // ── Ruido del sensor ──
  if (noise > 0) {
    for (let i = 0; i < width * height; i += 1) {
      const o = i * 4;
      const n = (rand() - 0.5) * 2 * noise;
      px[o] += n;
      px[o + 1] += n;
      px[o + 2] += n;
    }
  }

  return { image: out, truth };
}

/**
 * Error de una detección: distancia media de las cuatro esquinas a las
 * verdaderas, en proporción del lado corto de la imagen.
 *
 * Relativo y no en píxeles absolutos para que el número signifique lo mismo
 * en una foto de 900 px y en una de 4000.
 */
export function cornerError(detected: Quad, truth: Quad, imageWidth: number): number {
  const pares: [Point, Point][] = [
    [detected.topLeft, truth.topLeft],
    [detected.topRight, truth.topRight],
    [detected.bottomRight, truth.bottomRight],
    [detected.bottomLeft, truth.bottomLeft],
  ];
  const suma = pares.reduce((acc, [a, b]) => acc + Math.hypot(a.x - b.x, a.y - b.y), 0);
  return suma / 4 / imageWidth;
}
