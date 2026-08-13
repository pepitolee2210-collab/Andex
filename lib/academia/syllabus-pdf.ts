/**
 * MANUAL DEL TEMARIO EN PDF.
 *
 * ── Por qué `pdf-lib` y no el generador propio ──
 *
 * El de `lib/scanner/pdf.ts` incrusta JPEG en páginas de tamaño fijo, que es
 * todo lo que necesita un escáner. Aquí hace falta TEXTO —seleccionable,
 * copiable y que un lector de pantalla pueda leer— y eso es otro problema.
 *
 * D56 dejó escrito exactamente este caso: *"el día que haga falta texto
 * seleccionable… se trae y se tira esto"*. Y D61 quitó el peso como criterio
 * de rechazo. Así que se trae, y sólo aquí: la librería viaja en un `import()`
 * diferido y llega cuando alguien pulsa descargar, no antes.
 *
 * ── Una sola fuente de verdad ──
 *
 * El PDF se genera del MISMO `LessonTrack` que pinta la pantalla. No hay un
 * documento paralelo que se quede viejo: si se corrige una frase, se corrige
 * en los dos sitios a la vez porque son el mismo dato.
 */

import type { LessonTrack } from "./types";
import { lessonsBySituation, phraseCount } from "./types";

/** Textos del documento. Llegan de i18n: aquí no se escribe copy. */
export type SyllabusPdfCopy = {
  /** Marca en la portada. */
  brand: string;
  /** "Manual de estudio", o su equivalente. */
  kind: string;
  /** Etiqueta de la duración: recibe el número de semanas. */
  weeks: (n: number) => string;
  /** Etiqueta del total de frases. */
  phrases: (n: number) => string;
  /** Nombre visible de cada situación. */
  situations: Record<string, string>;
  /** Encabezado de la columna de pronunciación. */
  sayLabel: string;
  /** Aviso del pie. */
  footer: string;
  /** Texto de "página N de M". */
  page: (n: number, total: number) => string;
};

/** Carta, en puntos PostScript. */
const PAGE = { width: 612, height: 792 };
const MARGIN = 54;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

/** Paleta del sistema (§2.1), en 0–1 como los espera pdf-lib. */
const INK = [0.063, 0.165, 0.263] as const;
const TEAL = [0.059, 0.463, 0.427] as const;
const MUTED = [0.322, 0.439, 0.549] as const;

/**
 * Quita lo que la codificación WinAnsi de las fuentes estándar no sabe
 * escribir.
 *
 * Los acentos y la eñe sí entran —son Latin-1— pero las comillas
 * tipográficas y la raya larga que usa el copy del producto reventarían la
 * generación con una excepción, y perder el manual entero por un guion sería
 * absurdo.
 */
function toWinAnsi(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[^\x20-\xFF]/g, "");
}

type Font = { widthOfTextAtSize: (t: string, s: number) => number };

/** Parte el texto en líneas que caben en el ancho dado. */
function wrap(text: string, font: Font, size: number, maxWidth: number): string[] {
  const palabras = toWinAnsi(text).split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";

  for (const palabra of palabras) {
    const intento = actual ? `${actual} ${palabra}` : palabra;
    if (font.widthOfTextAtSize(intento, size) <= maxWidth) {
      actual = intento;
      continue;
    }
    if (actual) lineas.push(actual);
    actual = palabra;
  }
  if (actual) lineas.push(actual);
  return lineas.length > 0 ? lineas : [""];
}

/**
 * Construye el manual.
 *
 * Asíncrona y con `import()` dentro: así `pdf-lib` no entra en el chunk de la
 * pantalla, sólo en el de quien pulsa descargar.
 */
export async function buildSyllabusPdf(
  track: LessonTrack,
  copy: SyllabusPdfCopy,
): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const doc = await PDFDocument.create();
  doc.setTitle(`${copy.brand} - ${track.title}`);
  doc.setSubject(track.summary);
  doc.setCreator(copy.brand);

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const paginas: import("pdf-lib").PDFPage[] = [];
  let page = doc.addPage([PAGE.width, PAGE.height]);
  paginas.push(page);
  let y = PAGE.height - MARGIN;

  /** Salta de página si no cabe lo que viene. */
  const asegurar = (alto: number) => {
    if (y - alto >= MARGIN + 24) return;
    page = doc.addPage([PAGE.width, PAGE.height]);
    paginas.push(page);
    y = PAGE.height - MARGIN;
  };

  const escribir = (
    text: string,
    opts: { font?: Font; size?: number; color?: readonly [number, number, number]; x?: number; indent?: number },
  ) => {
    const font = (opts.font ?? regular) as typeof regular;
    const size = opts.size ?? 10;
    const color = opts.color ?? INK;
    const x = opts.x ?? MARGIN + (opts.indent ?? 0);
    const ancho = CONTENT_WIDTH - (opts.indent ?? 0);
    const lineas = wrap(text, font, size, ancho);
    const alturaLinea = size * 1.35;

    asegurar(lineas.length * alturaLinea);
    for (const linea of lineas) {
      y -= alturaLinea;
      page.drawText(linea, { x, y, size, font, color: rgb(color[0], color[1], color[2]) });
    }
  };

  // ── Portada ──
  escribir(copy.brand.toUpperCase(), { font: bold, size: 9, color: TEAL });
  y -= 6;
  escribir(track.title, { font: bold, size: 24 });
  y -= 4;
  escribir(track.summary, { size: 11, color: MUTED });
  y -= 10;
  escribir(
    `${copy.kind}  ·  ${copy.weeks(track.weeks)}  ·  ${copy.phrases(phraseCount(track))}`,
    { size: 9, color: MUTED },
  );

  y -= 14;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE.width - MARGIN, y },
    thickness: 1,
    color: rgb(TEAL[0], TEAL[1], TEAL[2]),
  });
  y -= 12;

  // ── Contenido, agrupado por momento del trabajo ──
  for (const grupo of lessonsBySituation(track)) {
    asegurar(72);
    y -= 12;
    escribir(copy.situations[grupo.situation] ?? grupo.situation, {
      font: bold,
      size: 13,
      color: TEAL,
    });
    y -= 2;

    for (const leccion of grupo.lessons) {
      asegurar(52);
      y -= 8;
      escribir(leccion.title, { font: bold, size: 11 });
      y -= 4;

      for (const frase of leccion.phrases) {
        // Una frase no se parte entre páginas: leerla a medias no sirve.
        asegurar(52);
        y -= 6;
        escribir(frase.en, { font: bold, size: 11, indent: 12 });
        escribir(`${copy.sayLabel}: ${frase.say}`, {
          font: italic,
          size: 9.5,
          color: TEAL,
          indent: 12,
        });
        escribir(frase.es, { size: 10, color: MUTED, indent: 12 });
        if (frase.note) {
          escribir(frase.note, { font: italic, size: 8.5, color: MUTED, indent: 12 });
        }
      }
    }
  }

  // ── Pie de cada página ──
  const total = paginas.length;
  paginas.forEach((p, i) => {
    p.drawText(toWinAnsi(copy.footer), {
      x: MARGIN,
      y: MARGIN - 22,
      size: 7.5,
      font: regular,
      color: rgb(MUTED[0], MUTED[1], MUTED[2]),
    });
    const etiqueta = toWinAnsi(copy.page(i + 1, total));
    p.drawText(etiqueta, {
      x: PAGE.width - MARGIN - regular.widthOfTextAtSize(etiqueta, 7.5),
      y: MARGIN - 22,
      size: 7.5,
      font: regular,
      color: rgb(MUTED[0], MUTED[1], MUTED[2]),
    });
  });

  const bytes = await doc.save();
  // `slice()` entrega un ArrayBuffer limpio: el de un Uint8Array puede ser un
  // SharedArrayBuffer y `Blob` lo rechaza en algunos navegadores.
  return new Blob([bytes.slice().buffer], { type: "application/pdf" });
}
