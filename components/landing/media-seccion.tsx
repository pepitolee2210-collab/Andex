import Image from "next/image";

import { Carrusel } from "@/components/media/carrusel";
import type { LandingImage } from "@/lib/landing-images";

/**
 * LA MEDIA DE UNA SECCIÓN — una imagen o un carrusel, según cuántas haya.
 *
 * Existe para que las tres secciones con imagen no decidan cada una por su
 * cuenta qué hacer cuando llegan cero, una o varias. Esa decisión es la
 * misma en todas y estaba a punto de escribirse tres veces:
 *
 *   0 → no se pinta nada, y la sección se compone como si nunca hubiera
 *       tenido imagen;
 *   1 → una imagen fija, sin puntos ni temporizador que no llevarían a
 *       ninguna parte;
 *   2+ → el carrusel compartido, con su avance y sus frenos.
 *
 * ── Por qué `<Image>` con una y `<img>` con varias ──
 *
 * El de una es `next/image`: sirve la variante del tamaño que toca y
 * reserva el hueco para que el texto no salte al cargar. El carrusel usa
 * `<img>` porque su pista es un `scroll-snap` que mide en anchos de
 * contenedor, y el envoltorio de `next/image` le rompe ese cálculo.
 * Compensa: sólo la primera se carga con prisa, el resto en diferido.
 *
 * ── El texto alterno ──
 *
 * Uno por imagen, emparejado por posición. Si faltan —porque hay más
 * archivos que descripciones— se usa el último, que es peor que uno propio
 * pero mucho mejor que una imagen muda. El copy sale de `lib/i18n`, como
 * todo lo que se lee.
 */

export type MediaSeccionProps = {
  images: readonly LandingImage[];
  /** Qué se ve en cada una, en el mismo orden. */
  alts: readonly string[];
  /** «Foto {n} de {total}» — el nombre accesible de cada punto. */
  navLabel: string;
  /** Proporción del recorte, en clase de Tailwind. */
  aspect: string;
  /** `sizes` de la imagen fija: sin él se descarga siempre la más grande. */
  sizes: string;
  objectPosition?: string;
  className?: string;
};

export function MediaSeccion({
  images,
  alts,
  navLabel,
  aspect,
  sizes,
  objectPosition = "center 35%",
  className,
}: MediaSeccionProps) {
  if (images.length === 0) return null;

  const alt = (i: number) => alts[i] ?? alts[alts.length - 1] ?? "";

  if (images.length === 1) {
    const unica = images[0];
    return (
      <div className={className}>
        <Image
          src={unica.src}
          width={unica.width}
          height={unica.height}
          alt={alt(0)}
          sizes={sizes}
          className="h-auto w-full object-cover"
          style={{ objectPosition }}
        />
      </div>
    );
  }

  return (
    <Carrusel
      images={images.map((i) => i.src)}
      alts={images.map((_, i) => alt(i))}
      navLabel={navLabel}
      aspect={aspect}
      objectPosition={objectPosition}
      className={className}
    />
  );
}
