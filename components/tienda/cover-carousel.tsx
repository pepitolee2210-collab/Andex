/**
 * El carrusel de portadas de la Tienda.
 *
 * La mecánica —scroll-snap, avance automático, los tres frenos— vive en
 * `components/media/carrusel.tsx` desde que la landing también lo usa. Aquí
 * quedan los valores de encuadre propios de esta pantalla, que son los que
 * hacen que las tres caras se vean enteras.
 */

export { Carrusel as CoverCarousel } from "@/components/media/carrusel";
export type { CarruselProps as CoverCarouselProps } from "@/components/media/carrusel";
