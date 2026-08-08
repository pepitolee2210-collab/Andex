import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El presupuesto de performance de la landing (§3.1.1: <300 KB, LCP <2.5s en 4G)
  // se protege manteniendo la landing como Server Component sin librerías cliente pesadas.
  poweredByHeader: false,
};

export default nextConfig;
