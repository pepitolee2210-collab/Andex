/**
 * EL CATÁLOGO DE APLICACIONES DEL INICIO.
 *
 * Una "app" aquí no es un módulo del PRD: es una casilla de la pantalla de
 * inicio. La diferencia importa. El PRD tiene siete módulos y algunos
 * todavía no existen; el inicio enseña lo que se puede TOCAR hoy, más lo
 * que se anuncia a propósito.
 *
 * El acento no es un hex sino el nombre de la variable CSS. Los valores
 * viven en `app/motion.css`, que es donde el sistema guarda su paleta —
 * §2.1 prohíbe hex fuera de las hojas de estilo, y con razón: un color
 * suelto en un `.ts` se salta la matriz de contraste sin dejar rastro.
 */

export type AppSlug =
  | "boveda"
  | "escaner"
  | "ia"
  | "legal"
  | "ingles"
  | "comunidad"
  | "avisos"
  | "ajustes";

export type OsApp = {
  slug: AppSlug;
  /** Nombre de la variable CSS del acento, sin `var()`. */
  accent: string;
  /** A dónde lleva. `null` = todavía no tiene pantalla propia. */
  href: string | null;
  /**
   * Si sale de fábrica en el inicio. Las que no, se encuentran en la Store
   * — que es también donde vuelven las que alguien quitó.
   */
  defaultHome: boolean;
};

/** Ocho casillas por página: rejilla de 4 × 2. */
export const SLOTS_POR_PAGINA = 8;

export const OS_APPS: readonly OsApp[] = [
  { slug: "boveda",    accent: "--acc-boveda",    href: "/modulo/boveda",    defaultHome: true },
  { slug: "escaner",   accent: "--acc-escaner",   href: "/modulo/boveda",    defaultHome: true },
  { slug: "ia",        accent: "--acc-ia",        href: null,                defaultHome: true },
  { slug: "legal",     accent: "--acc-legal",     href: null,                defaultHome: true },
  { slug: "ingles",    accent: "--acc-ingles",    href: "/modulo/academia",  defaultHome: true },
  { slug: "comunidad", accent: "--acc-comunidad", href: "/modulo/comunidad", defaultHome: true },
  { slug: "avisos",    accent: "--acc-avisos",    href: null,                defaultHome: true },
  { slug: "ajustes",   accent: "--acc-ajustes",   href: "/perfil",           defaultHome: true },
] as const;

const POR_SLUG = new Map(OS_APPS.map((a) => [a.slug, a]));

export function app(slug: AppSlug): OsApp | undefined {
  return POR_SLUG.get(slug);
}

/** Comprueba que una cadena cualquiera es una app conocida. */
export function isAppSlug(value: unknown): value is AppSlug {
  return typeof value === "string" && POR_SLUG.has(value as AppSlug);
}
