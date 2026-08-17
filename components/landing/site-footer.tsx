/**
 * S10 · PIE DE PÁGINA.
 *
 * Server Component a propósito: no hay una sola interacción aquí, así que
 * no hay razón para gastar un kilobyte de JavaScript del presupuesto de la
 * landing (§3.1.1) en renderizar enlaces.
 *
 * ── Reparto de las tres columnas. El diccionario da siete enlaces y tres
 *    títulos, sin decir cuál va dónde:
 *      · Producto → Módulos, Servicios directos, Precios (lo que se
 *        compra, en el orden en que aparece en la página)
 *      · ANDEX    → Comunidad, Soporte (quiénes somos y cómo alcanzarnos)
 *      · Legal    → Términos, Política de privacidad
 *    Poner "Soporte" bajo Legal habría dejado la columna de marca con un
 *    solo enlace y la de Legal con tres; así queda 3 / 2 / 2 y cada título
 *    describe de verdad lo que cuelga de él.
 *
 * ── Sin redes sociales. No hay URLs reales que poner, y un icono que no
 *    lleva a ninguna parte es peor que su ausencia: en una audiencia que ya
 *    desconfía, un enlace muerto es la primera señal de que el sitio no es
 *    lo que dice ser.
 *
 * ── El disclaimer de no afiliación gubernamental (§6) es OBLIGATORIO y
 *    permanente. No es letra pequeña opcional ni se esconde tras un enlace:
 *    va en el cuerpo del pie, a tamaño de lectura.
 *
 * Las rutas legales salen de `ROUTES` (decisión D26): una ruta duplicada es
 * una ruta que se rompe el día que cambia en un solo sitio. Los anclas de
 * sección son cadenas locales porque `site-nav.tsx` es `"use client"` y
 * compartir un valor a través de esa frontera lo convierte en referencia de
 * cliente, ilegible desde el servidor.
 */

import { ROUTES } from "@/lib/config";
import { cn } from "@/lib/utils";

const ANCHORS = {
  modulos: "#modulos",
  precios: "#precios",
} as const;

export type SiteFooterLinks = {
  modulos: string;
  precios: string;
  servicios: string;
  comunidad: string;
  terminos: string;
  privacidad: string;
  contacto: string;
};

export type SiteFooterProps = {
  /** Nombre de marca. Sugerido: `dict.common.brand.name`. */
  brand: string;
  /** `dict.landing.footer.tagline` */
  tagline: string;
  /** `dict.landing.footer.columns` */
  columns: { product: string; company: string; legal: string };
  /** `dict.landing.footer.links` */
  links: SiteFooterLinks;
  /** `dict.landing.footer.disclaimer` — §6, obligatorio. */
  disclaimer: string;
  /** Ya formateado: `dict.landing.footer.rights(new Date().getFullYear())`. */
  rights: string;
  className?: string;
};

const LINK_CLASS =
  "inline-flex min-h-11 items-center rounded-md text-body text-muted transition-colors duration-150 hover:text-ink";

export function SiteFooter({
  brand,
  tagline,
  columns,
  links,
  disclaimer,
  rights,
  className,
}: SiteFooterProps) {
  const groups: Array<{ title: string; items: Array<{ label: string; href: string }> }> =
    [
      {
        title: columns.product,
        items: [
          { label: links.modulos, href: ANCHORS.modulos },
          { label: links.precios, href: ANCHORS.precios },
        ],
      },
      {
        title: columns.company,
        items: [{ label: links.contacto, href: ROUTES.contacto }],
      },
      {
        title: columns.legal,
        items: [
          { label: links.terminos, href: ROUTES.terminos },
          { label: links.privacidad, href: ROUTES.privacidad },
        ],
      },
    ];

  return (
    <footer
      className={cn("border-t border-line bg-surface px-5 py-12 sm:py-16", className)}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {/* Marca. A 320px va sola arriba; desde 1024 ocupa su columna. */}
          <div className="lg:pr-8">
            <span className="block font-heading text-h3 font-bold tracking-tight text-ink">
              {brand}
            </span>
            <p className="mt-2 max-w-sm text-body text-muted">{tagline}</p>
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="font-heading text-label font-semibold uppercase tracking-widest text-ink">
                {group.title}
              </h2>
              <ul className="mt-2 flex flex-col">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className={LINK_CLASS}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* §6 — no afiliación gubernamental. Obligatorio y permanente. */}
        <p className="mt-10 border-t border-line pt-6 text-body text-muted">
          {disclaimer}
        </p>
        <p className="mt-2 text-caption text-muted">{rights}</p>
      </div>
    </footer>
  );
}
