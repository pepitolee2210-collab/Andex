"use client";

/**
 * S5 · LOS 7 MÓDULOS — la prueba de la promesa (§3.1.1).
 *
 * Sustituye a `modules-section.tsx` y conserva su comportamiento intacto:
 * al elegir rama en el hero, esta rejilla **se reordena de verdad**, en vivo
 * y sin recarga.
 *
 *   · orden   → `DEFAULT_ORDER[branch]` de lib/catalogs/modules (§3.3.1);
 *               sin elección, el orden canónico de `MODULES` (1→7)
 *   · títulos → variante `in_us` / `pre_arrival` (§4.2.1), ya resueltos por
 *               idioma y entregados por props
 *
 * Sin elección se usa el orden canónico y NO `DEFAULT_ORDER.in_us`: si el
 * estado inicial ya fuera el de "ya estoy en EE. UU.", elegir esa rama no
 * movería nada y la demostración se caería justo en la mitad de los casos.
 *
 * ── Dos formas para dos contextos ──────────────────────────────────────
 * MÓVIL Y TABLET (<1024px): **carril horizontal con scroll-snap**. Siete
 * tarjetas apiladas a ancho completo eran ~2.450px de scroll vertical para
 * una sola sección: una lista muerta que nadie termina. En el carril, los
 * siete módulos caben en un gesto lateral —el patrón nativo del móvil— y la
 * sección baja a una pantalla. El scroll es del navegador (nada de emular
 * inercia a mano): `snap-x snap-mandatory` + `snap-center` por tarjeta.
 * Se acompaña de dos señales de que hay más: los puntos de posición y el
 * degradado del borde derecho.
 *
 * ESCRITORIO (`lg:`): la rejilla de siempre, con la fila destacada.
 *
 * ── El huérfano (solo en `lg:`) ────────────────────────────────────────
 * Siete tarjetas iguales en tres columnas dejan un hueco al final. Se
 * resuelve dándole al PRIMERO la fila entera: 1 + 6 cierra exacto en
 * `lg:` (1 + 2 filas de 3). Y no es un apaño de rejilla: el orden YA es la
 * prioridad, así que destacar el primero adelanta en la portada lo que el
 * panel hará después. La tarjeta grande cambia con la rama, delante del
 * usuario. En el carril el destacado sigue siendo el PRIMERO del rail —lo
 * primero que se ve sin mover un dedo—, con el mismo navy pero al ancho de
 * las demás: en un carril, "más grande" solo significaría "se ve menos".
 *
 * ── Movimiento: la promesa hecha visible ───────────────────────────────
 * `layout="position"` en cada <li> con <LayoutGroup>: al reordenarse, las
 * tarjetas se DESPLAZAN a su sitio nuevo en vez de saltar. Es la única
 * animación de la sección que no es decorativa — es literalmente lo que se
 * está vendiendo ("tu panel se ordena según tu caso"). En el carril ese
 * mismo desplazamiento ocurre en horizontal, y además el rail vuelve al
 * inicio para que el nuevo módulo nº1 quede a la vista: reordenar sin que
 * se vea el resultado no demuestra nada.
 * Se anima la posición y no el tamaño a propósito: `layout` completo
 * interpola el alto y el ancho con una escala, y eso deforma el texto de la
 * tarjeta que entra o sale de destacada. Con `"position"` el tamaño cambia
 * en seco y el recorrido queda limpio.
 * El `hover` (elevación + borde teal) vive en el <article> interior, un
 * elemento sin `transform` de Motion: si estuviera en el <li>, la proyección
 * de layout pisaría el `translate` del hover.
 *
 * Todo el copy llega por props: importar `@/lib/i18n` desde un componente
 * cliente metería los nueve diccionarios en ES y EN en el bundle público.
 */

import { useEffect, useRef, useState } from "react";
import {
  LayoutGroup,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { ModuleIcon } from "@/components/module-icon";
import { DEFAULT_ORDER, MODULES } from "@/lib/catalogs/modules";
import type { LocationContext, ModuleId, ModuleSlug } from "@/lib/types";
import { cn } from "@/lib/utils";

import { useBranch } from "./branch-context";
import { CtaLink } from "./cta-link";

/** Misma curva que el resto del sistema de movimiento (components/motion). */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Orden canónico 1→7 tomado del catálogo, no del orden de las props. */
const CANONICAL_ORDER: ModuleId[] = MODULES.map((m) => m.id);

export type LandingModule = {
  id: ModuleId;
  slug: ModuleSlug;
  /** Título §4.2.1 para cada variante de contenido, en el idioma activo. */
  titleInUs: string;
  titlePreArrival: string;
  /** `landing.modules.items[id].body` — una línea, en el idioma activo. */
  body: string;
};

export type ModulesSectionCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** "Reordenados para tu caso" — se anuncia por `aria-live`. */
  reorderedNote: string;
  ctaLabel: string;
};

export type SectionModulesProps = {
  /** Los 7 módulos. El orden de este array es indiferente. */
  modules: readonly LandingModule[];
  /** Variante de título mientras el visitante no ha elegido rama. */
  defaultVariant: LocationContext;
  copy: ModulesSectionCopy;
  ctaHref: string;
};

export function SectionModules({
  modules,
  defaultVariant,
  copy,
  ctaHref,
}: SectionModulesProps) {
  const { branch } = useBranch();
  const reduced = useReducedMotion();
  const variant: LocationContext = branch ?? defaultVariant;

  const byId = new Map(modules.map((m) => [m.id, m]));
  const order: ModuleId[] = branch ? DEFAULT_ORDER[branch] : CANONICAL_ORDER;
  const ordered = order
    .map((id) => byId.get(id))
    .filter((m): m is LandingModule => m !== undefined);

  /** Cambia con la rama: reengancha los observadores tras el reordenamiento. */
  const orderKey = ordered.map((m) => m.slug).join("|");

  const railRef = useRef<HTMLOListElement>(null);
  /** Índice de la tarjeta que domina el viewport del carril. */
  const [active, setActive] = useState(0);
  /**
   * ¿El carril desborda de verdad? Decide el `tabIndex`: una zona con scroll
   * tiene que poder recorrerse con teclado (§9), pero en `lg:` es una rejilla
   * sin scroll y un tab stop ahí solo sería ruido.
   */
  const [scrollable, setScrollable] = useState(false);

  // Degradados de borde ligados al scroll REAL del carril (Motion actualiza
  // el estilo sin volver a renderizar). El de la derecha se apaga al llegar
  // al final: deja de insinuar algo que ya no existe.
  const { scrollXProgress } = useScroll({ container: railRef });
  const fadeRight = useTransform(scrollXProgress, [0.88, 0.99], [1, 0]);
  const fadeLeft = useTransform(scrollXProgress, [0.01, 0.1], [0, 1]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const measure = () => {
      setScrollable(rail.scrollWidth - rail.clientWidth > 8);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [orderKey]);

  // Punto activo. IntersectionObserver con el propio carril como `root`:
  // marca la tarjeta más presente en la ventana, sin escuchar el scroll ni
  // renderizar en cada píxel.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    // Los <li> son los únicos hijos del carril, así que su orden en el DOM
    // es el orden visible — incluso después de reordenar por rama.
    const cards = Array.from(rail.querySelectorAll<HTMLLIElement>(":scope > li"));
    if (cards.length === 0) return;

    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target, entry.intersectionRatio);
        }
        let bestIndex = 0;
        let bestRatio = -1;
        cards.forEach((card, index) => {
          const ratio = ratios.get(card) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        });
        setActive(bestIndex);
      },
      { root: rail, threshold: [0, 0.35, 0.6, 0.9, 1] },
    );

    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, [orderKey]);

  // Al elegir rama, el carril vuelve al principio: el módulo nº1 recién
  // ascendido tiene que quedar delante de los ojos, no tres tarjetas atrás.
  const lastBranch = useRef(branch);
  useEffect(() => {
    // Solo cuando la rama CAMBIA de verdad: al montar ya puede venir elegida
    // desde `?ctx=` y ahí no hay nada que devolver al inicio.
    if (lastBranch.current === branch) return;
    lastBranch.current = branch;

    const rail = railRef.current;
    if (!rail || rail.scrollLeft === 0) return;
    rail.scrollTo({ left: 0, behavior: reduced ? "auto" : "smooth" });
  }, [branch, reduced]);

  return (
    <section
      id="modulos"
      aria-labelledby="modulos-titulo"
      className="border-y border-line bg-surface-alt px-4 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
          <div className="min-w-0">
            <p className="text-caption font-semibold uppercase tracking-widest text-muted">
              {copy.eyebrow}
            </p>
            <h2 id="modulos-titulo" className="mt-3 font-heading text-h1 text-ink">
              {copy.title}
            </h2>
          </div>
          <p className="max-w-md text-body text-muted lg:text-right">
            {copy.subtitle}
          </p>
        </div>

        {/* El reordenamiento se ve; esto lo cuenta a quien no lo ve.
            La altura fija evita que el aviso empuje la rejilla al aparecer. */}
        <p
          aria-live="polite"
          className="mt-5 min-h-7 text-body font-semibold text-teal-deep"
        >
          {branch ? copy.reorderedNote : ""}
        </p>

        {/* `-mx-4` saca el carril a sangre para que el degradado muera en el
            borde de la pantalla; el `px-4` de dentro devuelve la alineación
            de la primera tarjeta con el resto de la página. El ancho total
            queda EXACTAMENTE en el del viewport: nada desborda. */}
        <LayoutGroup>
          <div className="relative -mx-4 lg:mx-0">
            {/* <ol> porque aquí el orden significa algo: es la priorización. */}
            <ol
              ref={railRef}
              tabIndex={scrollable ? 0 : undefined}
              aria-labelledby="modulos-titulo"
              className={cn(
                "flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-4 py-4",
                "scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                "lg:grid lg:snap-none lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:py-0",
              )}
            >
              {ordered.map((m, index) => {
                const featured = index === 0;
                const title =
                  variant === "in_us" ? m.titleInUs : m.titlePreArrival;

                return (
                  <motion.li
                    key={m.slug}
                    layout={reduced ? false : "position"}
                    initial={reduced ? false : { opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.55,
                      // Escalón corto y acotado: en la rejilla marca ritmo,
                      // y en el carril no deja esperando a la tarjeta que
                      // acaba de entrar con el dedo.
                      delay: Math.min(index, 2) * 0.06,
                      ease: EASE,
                      layout: { type: "spring", stiffness: 320, damping: 34 },
                    }}
                    className={cn(
                      "h-full flex-none basis-[78%] snap-center sm:basis-[46%]",
                      featured && "lg:col-span-3",
                    )}
                  >
                    {/* El navy solo aparece en la tarjeta destacada: es el
                        único bloque de la sección que debe leerse como
                        "esto es lo primero para ti". Texto blanco y
                        `text-navy-soft` porque ambos son constantes de marca
                        (no cambian en modo oscuro), a diferencia de
                        `text-on-accent`, que ahí se vuelve oscuro. */}
                    <article
                      className={cn(
                        // En el carril la tarjeta es vertical: el título
                        // estrena la línea entera y deja de partirse en dos.
                        // En `lg:` vuelve el icono al costado.
                        "flex h-full flex-col gap-3 rounded-lg border p-4",
                        "sm:p-5 lg:flex-row lg:items-start lg:gap-4",
                        "transition-[color,background-color,border-color,box-shadow,transform] duration-300",
                        featured
                          ? "border-navy bg-navy shadow-md lg:gap-5 lg:p-8 lg:shadow-lg"
                          : "border-line bg-surface shadow-sm hover:-translate-y-1 hover:border-teal-deep hover:shadow-lg lg:p-5",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-md",
                          featured
                            ? "bg-teal-deep text-on-accent lg:size-14"
                            : "bg-teal-soft text-teal-deep",
                        )}
                      >
                        <ModuleIcon
                          slug={m.slug}
                          size={22}
                          className={featured ? "lg:size-7" : undefined}
                        />
                      </span>

                      <div className="min-w-0">
                        <h3
                          className={cn(
                            "font-heading",
                            featured
                              ? "text-h3 text-white lg:text-h2"
                              : "text-body-lg font-semibold text-ink lg:text-h3",
                          )}
                        >
                          {title}
                        </h3>
                        <p
                          className={cn(
                            "mt-2 text-body",
                            featured
                              ? "max-w-2xl text-navy-soft lg:text-body-lg"
                              : "text-muted",
                          )}
                        >
                          {m.body}
                        </p>
                      </div>
                    </article>
                  </motion.li>
                );
              })}
            </ol>

            {/* Insinuación de que hay más: el contenido se desvanece contra
                el fondo de la sección en los bordes con recorrido pendiente.
                Decorativos y sin eventos: nunca tapan un gesto. */}
            <motion.div
              aria-hidden="true"
              style={{ opacity: fadeLeft }}
              className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-surface-alt to-surface-alt/0 lg:hidden"
            />
            <motion.div
              aria-hidden="true"
              style={{ opacity: fadeRight }}
              className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-surface-alt to-surface-alt/0 lg:hidden"
            />
          </div>
        </LayoutGroup>

        {/* Puntos de posición: dónde estoy de siete. Decorativos —el carril
            ya se anuncia como lista de 7 elementos— y sin ser botones: siete
            targets de 44px no caben en 320px, y aquí el gesto es el dedo. */}
        <div
          aria-hidden="true"
          className={cn(
            "mt-1 flex items-center justify-center gap-2 lg:hidden",
            !scrollable && "invisible",
          )}
        >
          {ordered.map((m, index) => (
            <span
              key={m.slug}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === active ? "w-6 bg-teal-deep" : "w-2 bg-line",
              )}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <CtaLink position="modules" href={ctaHref} size="lg">
            {copy.ctaLabel}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
