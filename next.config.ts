import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El presupuesto de performance de la landing (§3.1.1: <300 KB, LCP <2.5s en 4G)
  // se protege manteniendo la landing como Server Component sin librerías cliente pesadas.
  poweredByHeader: false,

  /**
   * El indicador de desarrollo de Next, apagado.
   *
   * Se planta en la esquina inferior derecha, que es exactamente donde vive
   * la quinta pestaña de la barra. Medido: tapa por completo el enlace de
   * Perfil —`document.elementFromPoint` sobre su centro devuelve
   * `NEXTJS-PORTAL`, no el enlace—, así que en desarrollo esa pestaña no se
   * puede pulsar y toda comprobación automática de esa esquina miente.
   *
   * Además salía en todas las capturas como un círculo negro con una «N»
   * encima de la interfaz, y se confundía con un elemento del producto.
   *
   * En producción no existe, así que esto no cambia nada de lo que ve el
   * usuario: sólo deja de estorbar a quien verifica.
   */
  devIndicators: false,
};

export default nextConfig;
