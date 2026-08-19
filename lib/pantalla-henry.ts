/**
 * EL HUECO DE LA PANTALLA dentro de la foto de Henry.
 *
 * En porcentajes del lienzo de 1000×1250. Medido sobre el archivo buscando
 * la mancha oscura conexa más grande: sale en x 370–628 e y 543–1133, o sea
 * 259×591 px. En porcentajes y no en píxeles porque la foto se escala con su
 * columna, y unos píxeles fijos dejarían de valer en cuanto cambiara el
 * ancho de la ventana.
 *
 * La proporción resultante es 0.438. El mockup del recorrido mide 312×648
 * (0.481), así que no encajan solos: la caja interior se rehace con la
 * proporción del HUECO y lo que sobra se recorta por abajo, que es la franja
 * donde sólo está el asa de inicio.
 *
 * ── Por qué vive en su propio archivo ──
 *
 * No está en `lib/landing-images.ts` porque ese módulo comprueba el disco
 * con `node:fs`, y quien necesita estas medidas es un componente CLIENTE.
 * Importarlo de allí arrastraba `node:fs` al paquete del navegador y la
 * portada entera dejaba de compilar: «UnhandledSchemeError: Reading from
 * "node:fs" is not handled by plugins».
 */
export const PANTALLA_HENRY = {
  left: 37.0,
  top: 43.44,
  width: 25.9,
  height: 47.28,
  /** Ancho del mockup del recorrido, en px. De él sale la escala. */
  anchoMockup: 312,
  /**
   * Radio de las esquinas de la pantalla, en fracción de su ancho.
   *
   * Medido contando la sangría fila a fila desde el borde: la curva se
   * anula a los 35 px por arriba y 36 por abajo, sobre 259 de ancho — o sea
   * 13.5–13.9%. Se usa 14.5%, un pelo MÁS: la curva de un teléfono es un
   * «squircle» y no un arco de círculo, así que un radio corto deja las
   * cuatro puntas del recorrido asomando por fuera del negro y la pantalla
   * se lee pegada encima de la foto en vez de encendida dentro de ella.
   * Pasarse un poco sólo deja un filo de negro, que es lo que hay en un
   * teléfono de verdad.
   */
  radio: 0.145,
} as const;
