"use client";

/**
 * Sección de Solución (§3.1): los 7 módulos. Es la PRUEBA de la promesa de
 * §3.1.1 — "demuestra la personalización en vez de describirla": al elegir
 * rama en el hero, esta lista **cambia de orden y de título de verdad**,
 * sin recarga.
 *
 *   · orden   → `DEFAULT_ORDER[context]` de lib/catalogs/modules (§3.3.1)
 *   · títulos → `common.modules.titles[id][variant]` (§4.2.1), que llegan
 *     por props ya resueltos por idioma
 *   · subtítulo y nota → `landing.solution.*`
 *
 * Sin elección todavía: orden canónico 1→7 y variante por defecto. Así el
 * reordenamiento SIEMPRE es visible al elegir cualquiera de las dos ramas
 * (si el estado inicial ya fuera `DEFAULT_ORDER.in_us`, elegir "ya estoy en
 * EE. UU." no cambiaría nada y la demostración se caería).
 *
 * Las tarjetas son presentacionales, no `<ModuleCard>`: en la landing los
 * módulos no son accionables (todos están `coming_soon` y no hay ruta
 * pública), y un control sin acción es ruido para el teclado y el lector de
 * pantalla. Además así el color sale solo de tokens, sin el hex de acento
 * del catálogo.
 */

import { DEFAULT_ORDER } from "@/lib/catalogs/modules";
import type { LocationContext, ModuleId, ModuleSlug } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ModuleIcon } from "@/components/module-icon";
import { useBranch } from "./branch-context";
import { CtaLink } from "./cta-link";

export type LandingModule = {
  id: ModuleId;
  slug: ModuleSlug;
  /** Título §4.2.1 para cada variante de contenido, ya en el idioma activo. */
  titleInUs: string;
  titlePreArrival: string;
  /** Gancho corto de `landing.solution.moduleTeasers`. */
  teaser: string;
};

export type ModulesSectionCopy = {
  eyebrow: string;
  title: string;
  subtitleInUs: string;
  subtitlePreArrival: string;
  reorderedNote: string;
  doneForYouTitle: string;
  doneForYouBody: string;
  ctaLabel: string;
};

export type ModulesSectionProps = {
  /** Los 7 módulos en orden canónico (1→7). */
  modules: LandingModule[];
  /** Variante de título/subtítulo mientras el visitante no ha elegido. */
  defaultVariant: LocationContext;
  copy: ModulesSectionCopy;
  ctaHref: string;
};

export function ModulesSection({
  modules,
  defaultVariant,
  copy,
  ctaHref,
}: ModulesSectionProps) {
  const { branch } = useBranch();
  const variant: LocationContext = branch ?? defaultVariant;

  const byId = new Map(modules.map((m) => [m.id, m]));
  const order: ModuleId[] = branch
    ? DEFAULT_ORDER[branch]
    : modules.map((m) => m.id);
  const ordered = order
    .map((id) => byId.get(id))
    .filter((m): m is LandingModule => m !== undefined);

  return (
    <section
      id="modulos"
      aria-labelledby="modulos-titulo"
      className="border-t border-line px-4 py-14 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-label font-semibold tracking-wide text-muted">
          {copy.eyebrow}
        </p>
        <h2 id="modulos-titulo" className="mt-2 font-heading text-h1 text-ink">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-body-lg text-muted">
          {variant === "in_us" ? copy.subtitleInUs : copy.subtitlePreArrival}
        </p>
        {/* Anuncia el reordenamiento a quien no lo ve ocurrir. */}
        <p aria-live="polite" className="mt-2 text-body text-teal-deep">
          {branch ? copy.reorderedNote : ""}
        </p>

        {/* <ol>: aquí el orden significa algo (es la priorización).
            El PRIMERO ocupa la fila entera. Dos razones, y ninguna es
            decorativa: (1) siete tarjetas iguales en tres columnas dejaban
            un hueco huérfano al final; con 1 + 6 las filas cierran exactas.
            (2) El orden ya es la prioridad, así que destacar el primero
            adelanta en la portada lo que el panel hará después — la tarjeta
            principal cambia con la rama, delante del usuario. */}
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((m, index) => {
            const featured = index === 0;
            const title = variant === "in_us" ? m.titleInUs : m.titlePreArrival;
            return (
              <li
                key={m.slug}
                className={cn("h-full", featured && "sm:col-span-2 lg:col-span-3")}
              >
                <article
                  className={cn(
                    "flex h-full items-start gap-3 rounded-lg border bg-surface shadow-sm",
                    featured
                      ? "border-teal-deep gap-4 p-5 sm:p-6"
                      : "border-line p-4",
                  )}
                >
                  <span
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-md bg-teal-soft text-teal-deep",
                      featured ? "size-14" : "size-11",
                    )}
                  >
                    <ModuleIcon slug={m.slug} size={featured ? 28 : 22} />
                  </span>
                  <div className="min-w-0">
                    <h3
                      className={cn(
                        "font-heading text-ink",
                        featured ? "text-h2" : "text-h3",
                      )}
                    >
                      {title}
                    </h3>
                    <p
                      className={cn(
                        "mt-1 text-muted",
                        featured ? "max-w-2xl text-body-lg" : "text-body",
                      )}
                    >
                      {m.teaser}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 rounded-lg border border-line bg-surface-alt p-5 sm:p-6">
          <h3 className="font-heading text-h3 text-ink">
            {copy.doneForYouTitle}
          </h3>
          <p className="mt-2 max-w-3xl text-body text-muted">
            {copy.doneForYouBody}
          </p>
        </div>

        <div className="mt-8">
          <CtaLink position="modules" href={ctaHref} size="lg">
            {copy.ctaLabel}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
