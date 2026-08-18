import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * LAS IMÁGENES DE LA LANDING — declaradas aquí, opcionales de verdad.
 *
 * ── El problema que resuelve ──
 *
 * Una imagen referenciada que todavía no existe no falla en silencio: el
 * navegador pide el archivo, recibe un 404 y pinta el icono de imagen rota
 * en mitad de la sección. En una página cuyo argumento entero es la
 * confianza, un recuadro roto dice más que cualquier párrafo.
 *
 * Así que la landing NO da por hecho que el archivo esté. Estas funciones
 * corren en el servidor —la landing es un Server Component— y comprueban el
 * disco antes de devolver nada. Lo que devuelven es una LISTA con las que
 * existen, así que cada sección se compone con las que haya:
 *
 *   0 imágenes → la sección se compone sin imagen, como si nunca la hubiera
 *                tenido. Ninguna es la versión degradada de la otra.
 *   1 imagen   → imagen fija.
 *   2 o más    → carrusel, con su avance automático y sus frenos.
 *
 * En cuanto dejas un archivo en su sitio, aparece: sin tocar código, sin
 * desplegar nada distinto.
 *
 * ── Cómo añadir una ──
 *
 * Deja el archivo en `public/imagenes/` con el nombre exacto de la tabla de
 * abajo. Las medidas que figuran son las que se usan para reservar el hueco
 * y evitar que el texto salte cuando la imagen carga; no hace falta que el
 * archivo mida exactamente eso, pero sí que tenga la MISMA PROPORCIÓN, o se
 * recortará al encajarlo. Los prompts para generarlas están en
 * `public/imagenes/LEEME.md`.
 *
 * ── Sobre el retrato del fundador ──
 *
 * Que sea una foto real. La sección entera dice «yo pasé por esto», y una
 * cara generada por un modelo presentada como la de una persona real es
 * exactamente el tipo de cosa que este producto se niega a hacer en el copy:
 * no se inventan reseñas, ni contadores, ni cifras. Un rostro inventado es
 * más grave que un número inventado.
 */

export type LandingImage = {
  /** Ruta pública, servida desde `public/`. */
  src: string;
  width: number;
  height: number;
};

/**
 * Los conjuntos que la landing sabe colocar. La clave es el SITIO, no el
 * archivo: si mañana cambian las fotos, cambian los archivos y nada más.
 *
 * Todas las de un conjunto comparten proporción a propósito. Un carrusel
 * cuyas imágenes miden distinto salta de altura en cada paso, y ese salto
 * empuja media página hacia abajo cada cinco segundos.
 */
const CATALOGO = {
  /** Retrato del fundador (S4). Vertical 4:5. Una sola: es un retrato. */
  fundador: [{ src: "/imagenes/fundador.jpg", width: 1000, height: 1250 }],

  /** El inglés en vivo, dentro de la plataforma (S6). Apaisadas 3:2. */
  ingles: [
    { src: "/imagenes/ingles-1.jpg", width: 1500, height: 1000 },
    { src: "/imagenes/ingles-2.jpg", width: 1500, height: 1000 },
    { src: "/imagenes/ingles-3.jpg", width: 1500, height: 1000 },
  ],

  /**
   * La comunidad, en el respaldo institucional (S3). Panorámicas 3:1.
   *
   * Cinco, y la mezcla es deliberada: TRES de encuentros reales y DOS de la
   * comunidad dentro de la app. La comunidad de ANDEX es las dos cosas —la
   * feria del sábado y el grupo que sigue hablando el martes por la noche—,
   * y enseñar sólo la presencial dejaría fuera lo único que un miembro usa
   * todos los días. Al revés, sólo pantallas, y parecería otra red social.
   */
  comunidad: [
    { src: "/imagenes/comunidad-1.jpg", width: 1500, height: 500 },
    { src: "/imagenes/comunidad-2.jpg", width: 1500, height: 500 },
    { src: "/imagenes/comunidad-3.jpg", width: 1500, height: 500 },
    { src: "/imagenes/comunidad-4.jpg", width: 1500, height: 500 },
    { src: "/imagenes/comunidad-5.jpg", width: 1500, height: 500 },
  ],
} as const satisfies Record<string, readonly LandingImage[]>;

export type LandingImageKey = keyof typeof CATALOGO;

/** Las de un conjunto que existen en `public/`, en su orden. */
export function imagenesDe(clave: LandingImageKey): LandingImage[] {
  return CATALOGO[clave].filter((imagen) =>
    existsSync(join(process.cwd(), "public", imagen.src.replace(/^\//, ""))),
  );
}

/** Los tres conjuntos, resueltos de una vez. Lo que la landing necesita. */
export function imagenesLanding(): Record<LandingImageKey, LandingImage[]> {
  return {
    fundador: imagenesDe("fundador"),
    ingles: imagenesDe("ingles"),
    comunidad: imagenesDe("comunidad"),
  };
}
