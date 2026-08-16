/**
 * TIENDA — el catálogo de miniaplicaciones.
 *
 * Cada una vive FUERA de ANDEX, en su propio enlace. Aquí sólo se declara
 * que existe, qué resuelve y de dónde sale su URL.
 *
 * ── Cómo se enciende una ──
 *
 * Poniendo su variable de entorno. Si tiene enlace válido, la tarjeta lleva
 * a la aplicación; si no, se muestra como «muy pronto» con su captación de
 * interés. Nadie tiene que tocar código para publicar una.
 *
 * ── Por qué algunas llevan aviso legal ──
 *
 * «Qué hacer en tu primera audiencia» habla de un procedimiento en corte de
 * inmigración. Explicar qué esperar no es asesoría legal, pero la línea es
 * fina y este público ya pagó a quien se la saltó. Las que tocan corte,
 * dinero o trámite llevan `aviso: true` y la pantalla lo pinta.
 */

export type MiniAppId = "prime-academy" | "primera-audiencia" | "primeros-dolares";

export type MiniApp = {
  id: MiniAppId;
  /** Variable de entorno con su URL. Sin ella, sale como «muy pronto». */
  envVar: string;
  /** Nombre de la variable CSS del acento, sin `var()`. */
  accent: string;
  /** Icono de lucide-react, por nombre. */
  icon: string;
  /** Cuánto lleva usarla. `0` = no se mide en minutos (es un catálogo, no
   *  una herramienta de un solo uso), y entonces no se enseña el dato. */
  minutos: number;
  /** Si necesita el aviso de «esto no es asesoría». */
  aviso: boolean;
};

export const MINI_APPS: readonly MiniApp[] = [
  {
    id: "prime-academy",
    envVar: "NEXT_PUBLIC_APP_PRIME_ACADEMY",
    accent: "--teal-deep",
    icon: "GraduationCap",
    minutos: 0,
    aviso: false,
  },
  {
    id: "primera-audiencia",
    envVar: "NEXT_PUBLIC_APP_PRIMERA_AUDIENCIA",
    accent: "--navy",
    icon: "Scale",
    minutos: 10,
    aviso: true,
  },
  {
    id: "primeros-dolares",
    envVar: "NEXT_PUBLIC_APP_PRIMEROS_DOLARES",
    accent: "--success",
    icon: "Wallet",
    minutos: 8,
    aviso: true,
  },
] as const;

/**
 * Las URL se leen de un mapa explícito, no de `process.env[variable]`.
 *
 * Next sustituye `process.env.NEXT_PUBLIC_X` en tiempo de compilación
 * SÓLO cuando la ve escrita literalmente. Un acceso dinámico devuelve
 * `undefined` en el navegador y la tienda saldría vacía sin dar ningún
 * error — el peor fallo posible: silencioso y en producción.
 */
export const URLS_MINI_APPS: Record<MiniAppId, string | undefined> = {
  "prime-academy": process.env.NEXT_PUBLIC_APP_PRIME_ACADEMY,
  "primera-audiencia": process.env.NEXT_PUBLIC_APP_PRIMERA_AUDIENCIA,
  "primeros-dolares": process.env.NEXT_PUBLIC_APP_PRIMEROS_DOLARES,
};

export function urlDe(id: MiniAppId): string | undefined {
  return URLS_MINI_APPS[id];
}
