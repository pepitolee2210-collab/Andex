/**
 * ESCÁNER — generador de PDF.
 *
 * Escribe un PDF con una imagen JPEG por página, sin librerías.
 *
 * Por qué a mano: `pdf-lib` y `jsPDF` pesan entre 250 y 400 KB. Para lo que
 * hace falta aquí —incrustar JPEG ya comprimido en páginas de tamaño fijo—
 * el formato PDF es literalmente texto plano con los bytes del JPEG dentro
 * de un stream `DCTDecode`. Son unas 200 líneas y ~2 KB, en un producto
 * cuyo público usa Android de gama baja con datos contados.
 *
 * Clave: el JPEG se incrusta TAL CUAL, sin recodificar. El PDF pesa
 * prácticamente lo mismo que las fotos y no pierde ni un ápice de calidad.
 */

/** 1 punto PostScript = 1/72 de pulgada. Es la unidad interna del PDF. */
const PT_PER_INCH = 72;

export type PageSizeName = "letter" | "a4";

/**
 * Tamaños de página.
 *
 * ⚠️ El valor por defecto es CARTA, no A4.
 *
 * A4 es el estándar internacional, pero este producto presenta documentos
 * ante USCIS, cortes de inmigración, el IRS y el DMV — instituciones
 * estadounidenses, donde el papel es Carta (8,5 × 11 pulgadas). Un
 * expediente en A4 llega con los márgenes descuadrados y, en el peor caso,
 * con contenido recortado al imprimirse. A4 se conserva para quien todavía
 * está fuera y presenta ante un consulado.
 */
export const PAGE_SIZES: Record<PageSizeName, { width: number; height: number }> = {
  letter: { width: 8.5 * PT_PER_INCH, height: 11 * PT_PER_INCH }, // 612 × 792
  a4: { width: 595.276, height: 841.89 }, // 210 × 297 mm
};

export type PdfPage = {
  /** Bytes del JPEG, sin recodificar. */
  jpeg: Uint8Array;
  /** Dimensiones reales del JPEG, en píxeles. */
  width: number;
  height: number;
};

export type PdfOptions = {
  size?: PageSizeName;
  /** Margen en pulgadas. 0,25" evita que una impresora recorte el borde. */
  marginInches?: number;
  title?: string;
  /** Fecha del documento. Se inyecta para poder probarlo de forma estable. */
  now?: Date;
};

// ─── Utilidades de bytes ─────────────────────────────────

/** Texto ASCII a bytes. El PDF mezcla texto y binario en el mismo archivo. */
function ascii(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) out[i] = text.charCodeAt(i) & 0xff;
  return out;
}

function concat(chunks: readonly Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/** Fecha en el formato del PDF: D:AAAAMMDDHHmmSS. */
function pdfDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

/** Escapa un texto para un literal de cadena del PDF. */
function pdfText(s: string): string {
  return s.replace(/[\\()]/g, (c) => `\\${c}`);
}

/**
 * ¿El JPEG es en escala de grises?
 *
 * Importa: declarar `DeviceRGB` sobre un JPEG de un solo canal produce un
 * PDF que unos lectores abren y otros rechazan. Se lee el marcador SOF
 * (Start Of Frame), que es donde el JPEG declara sus componentes.
 */
function isGrayscaleJpeg(jpeg: Uint8Array): boolean {
  for (let i = 2; i < jpeg.length - 9; ) {
    if (jpeg[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = jpeg[i + 1];
    // SOF0..SOF3 y SOF5..SOF7 llevan el número de componentes.
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7)
    ) {
      return jpeg[i + 9] === 1;
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = (jpeg[i + 2] << 8) | jpeg[i + 3];
    if (len <= 0) break;
    i += 2 + len;
  }
  return false;
}

// ─── El generador ────────────────────────────────────────

/**
 * Construye el PDF. Cada imagen se centra en su página respetando su
 * proporción: un pasaporte apaisado no se estira para llenar una hoja
 * vertical, se coloca a su tamaño real dentro del área útil.
 */
export function buildPdf(pages: readonly PdfPage[], options: PdfOptions = {}): Uint8Array {
  if (pages.length === 0) {
    throw new Error("Un PDF necesita al menos una página.");
  }

  const size = PAGE_SIZES[options.size ?? "letter"];
  const margin = (options.marginInches ?? 0.25) * PT_PER_INCH;
  const now = options.now ?? new Date();
  const title = options.title ?? "Documento ANDEX";

  const chunks: Uint8Array[] = [];
  const offsets: number[] = []; // offsets[n] = byte donde arranca el objeto n
  let cursor = 0;

  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? ascii(data) : data;
    chunks.push(bytes);
    cursor += bytes.length;
  };

  const startObject = (id: number) => {
    offsets[id] = cursor;
    push(`${id} 0 obj\n`);
  };

  push("%PDF-1.4\n");
  // Comentario con bytes altos: marca el archivo como binario para las
  // herramientas que transfieren en modo texto y romperían los JPEG.
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  // Reparto de identificadores: 1 catálogo, 2 páginas, 3 metadatos y
  // después tres objetos por página (página, contenido, imagen).
  const CATALOG = 1;
  const PAGES = 2;
  const INFO = 3;
  const objOfPage = (i: number) => 4 + i * 3;
  const objOfContent = (i: number) => 5 + i * 3;
  const objOfImage = (i: number) => 6 + i * 3;
  const totalObjects = 3 + pages.length * 3;

  startObject(CATALOG);
  push(`<< /Type /Catalog /Pages ${PAGES} 0 R >>\nendobj\n`);

  startObject(PAGES);
  const kids = pages.map((_, i) => `${objOfPage(i)} 0 R`).join(" ");
  push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);

  startObject(INFO);
  push(
    `<< /Title (${pdfText(title)}) /Producer (ANDEX) ` +
      `/CreationDate (${pdfDate(now)}) >>\nendobj\n`,
  );

  pages.forEach((page, i) => {
    // Se encaja la imagen dentro del área útil conservando su proporción.
    const availW = size.width - margin * 2;
    const availH = size.height - margin * 2;
    const scale = Math.min(availW / page.width, availH / page.height);
    const drawW = page.width * scale;
    const drawH = page.height * scale;
    const x = (size.width - drawW) / 2;
    const y = (size.height - drawH) / 2;

    startObject(objOfPage(i));
    push(
      `<< /Type /Page /Parent ${PAGES} 0 R ` +
        `/MediaBox [0 0 ${size.width.toFixed(2)} ${size.height.toFixed(2)}] ` +
        `/Resources << /XObject << /Im0 ${objOfImage(i)} 0 R >> >> ` +
        `/Contents ${objOfContent(i)} 0 R >>\nendobj\n`,
    );

    // `cm` coloca y escala; `Do` dibuja. La imagen es de 1×1 en su espacio,
    // así que la matriz lleva directamente el tamaño final en puntos.
    const content =
      `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ` +
      `${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`;
    startObject(objOfContent(i));
    push(`<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

    const space = isGrayscaleJpeg(page.jpeg) ? "DeviceGray" : "DeviceRGB";
    startObject(objOfImage(i));
    push(
      `<< /Type /XObject /Subtype /Image /Width ${page.width} ` +
        `/Height ${page.height} /ColorSpace /${space} /BitsPerComponent 8 ` +
        `/Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
    );
    push(page.jpeg);
    push("\nendstream\nendobj\n");
  });

  // Tabla de referencias cruzadas: dice en qué byte empieza cada objeto.
  // Si un offset baila, el lector no abre el archivo — de ahí que se lleve
  // la cuenta byte a byte durante toda la escritura.
  const xrefAt = cursor;
  push(`xref\n0 ${totalObjects + 1}\n`);
  push("0000000000 65535 f \n");
  for (let id = 1; id <= totalObjects; id++) {
    push(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }

  push(
    `trailer\n<< /Size ${totalObjects + 1} /Root ${CATALOG} 0 R ` +
      `/Info ${INFO} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`,
  );

  return concat(chunks);
}
