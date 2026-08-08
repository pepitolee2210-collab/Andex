"use client";

/**
 * S6 · SERVICIOS DIRECTOS (Gestoría ANDEX) — la sección EJECUTIVA.
 *
 * ── Por qué navy y por qué rompe con lo que la rodea
 * La landing anterior era plana: seis bloques idénticos de tarjetas blancas
 * sobre crema. Aquí el fondo cambia a `bg-navy` a sangre completa, así que
 * la página respira: crema → navy → crema. Es también la sección donde el
 * producto habla de dinero y de especialistas, y el navy es el único color
 * de la paleta que denota seriedad ejecutiva sin subir el volumen.
 *
 * ── Contraste sobre navy (§2.1.1)
 * `--navy` es CONSTANTE en claro y en oscuro (no se redefine en los bloques
 * de tema). Por eso el texto encima también tiene que ser constante:
 *
 *   · títulos      → `text-white`      (#FFFFFF sobre #102A43 = 14.6:1 ✓)
 *   · cuerpo       → `text-navy-soft`  (#EEF2F6 → ~13:1; al 85% ≈ 8.9:1 ✓)
 *   · superficies  → `bg-white/5` y `bg-white/10` (tinte, no color nuevo)
 *
 * NO se usa `text-muted` (en claro es #52708C: ilegible sobre navy) ni
 * `text-on-accent` (en oscuro vale #0B1929: desaparecería). Tampoco
 * `text-amber-deep` (#9A6B00 sobre navy ≈ 1.4:1). El único acento de color
 * es el filete `border-teal`, que es SUPERFICIE pura sin texto encima —
 * exactamente el uso que permite la regla de oro.
 *
 * ── El aviso de disponibilidad no es letra pequeña
 * §0.5 y el Anexo B dejan estos servicios FUERA de v1 hasta completar las
 * habilitaciones regulatorias. Por eso el aviso va ARRIBA de las tarjetas,
 * a `text-body-lg`, en la superficie más clara de la sección — y el CTA es
 * "Quiero que me avisen", no "Contratar". Prometer hoy lo que no se puede
 * entregar es justamente lo que esta audiencia ya sufrió con seis gestores
 * distintos (§ copy de `compare`).
 *
 * ── Movimiento
 * 1. Entrada escalonada de las tarjetas (`RevealGroup`/`RevealItem`: la
 *    misma gramática que el resto de la landing).
 * 2. Profundidad con GSAP ScrollTrigger: el bloque de encabezado se desplaza
 *    a distinta velocidad que la rejilla mientras la sección cruza la
 *    ventana. Se aplica a CONTENIDO REAL y no a un gráfico decorativo,
 *    porque el brief §1 solo admite dos elementos decorativos en todo el
 *    producto (La Ruta y el sello) y ninguno vive aquí.
 *    Solo en ≥1024px (en móvil no hay recorrido que justifique el coste) y
 *    nunca con `prefers-reduced-motion`. GSAP entra por `import()` diferido,
 *    igual que en `components/motion/smooth-scroll.tsx`: fuera del chunk
 *    inicial de la página pública.
 *
 * Todo el copy llega por props: importar `@/lib/i18n` desde un componente
 * cliente metería los nueve diccionarios en ES y EN en el bundle.
 */

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import {
  Building2,
  Car,
  Clock3,
  FileCheck2,
  Hash,
  Languages,
  Receipt,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export type ServiceItem = {
  title: string;
  body: string;
};

export type ServicesCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Aviso de disponibilidad por etapas (§0.5 / Anexo B). Obligatorio. */
  availability: string;
  items: readonly ServiceItem[];
  cta: string;
};

export type SectionServicesProps = {
  copy: ServicesCopy;
  /** Destino del CTA de aviso (p. ej. `ROUTES.registro`). */
  ctaHref: string;
  /** `id` del <section>: ancla del nav y clave de `landing_section_viewed`. */
  id?: string;
};

/**
 * Iconos por POSICIÓN en `items`, en el orden del diccionario:
 * DMV · ITIN (W-7) · LLC · impuestos · traducciones. El diccionario no trae
 * identificadores, así que el acoplamiento es por índice; si algún día crece
 * la lista, los extra caen en el genérico y nada se rompe.
 */
const SERVICE_ICONS: readonly LucideIcon[] = [
  Car,
  Hash,
  Building2,
  Receipt,
  Languages,
];

/**
 * Rejilla de 6 columnas en escritorio para que CINCO tarjetas cierren sus
 * filas: 3 + 2. Con `lg:grid-cols-3` la última fila dejaba un hueco huérfano
 * y la sección volvía a parecer una lista sin rematar.
 */
function cellSpan(index: number, total: number): string {
  const desktop = total === 5 && index >= 3 ? "lg:col-span-3" : "lg:col-span-2";
  // Fila impar en tablet: la última ocupa el ancho para no quedar coja.
  const tablet = total % 2 === 1 && index === total - 1 ? "sm:col-span-2" : "";
  return cn(desktop, tablet);
}

export function SectionServices({
  copy,
  ctaHref,
  id = "servicios",
}: SectionServicesProps) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleId = `${id}-titulo`;

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const header = headerRef.current;
    if (!section || !header) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      // `matchMedia` deja que GSAP mate y rearme el efecto solo cuando cambia
      // el ancho o la preferencia del sistema, sin listeners a mano.
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          gsap.fromTo(
            header,
            { y: 36 },
            {
              y: -36,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.6,
              },
            },
          );
        },
      );

      dispose = () => {
        mm.revert();
      };
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reduced]);

  const total = copy.items.length;

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={titleId}
      className="bg-navy px-4 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        {/* Capa que se desplaza a distinta velocidad que la rejilla. */}
        <div ref={headerRef} className="max-w-3xl will-change-transform">
          <Reveal
            as="p"
            className="text-label font-semibold uppercase tracking-widest text-navy-soft/70"
          >
            {copy.eyebrow}
          </Reveal>

          <Reveal delay={0.06}>
            <h2
              id={titleId}
              className="mt-3 font-heading text-h1 text-white"
            >
              {copy.title}
            </h2>
          </Reveal>

          <Reveal
            as="p"
            delay={0.12}
            className="mt-4 text-body-lg text-navy-soft/85"
          >
            {copy.subtitle}
          </Reveal>
        </div>

        {/* AVISO DE DISPONIBILIDAD — antes de las tarjetas, a propósito.
            El filete teal es superficie pura: no lleva texto encima. */}
        <Reveal delay={0.18} className="mt-8 overflow-hidden rounded-lg bg-white/10">
          <div className="flex items-start gap-4 border-l-4 border-teal p-5 sm:p-6">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-md bg-white/10 text-white"
            >
              <Clock3 className="size-5" />
            </span>
            <p className="text-body-lg text-white">{copy.availability}</p>
          </div>
        </Reveal>

        <RevealGroup
          as="ul"
          stagger={0.08}
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          {copy.items.map((item, index) => {
            const Icon = SERVICE_ICONS[index] ?? FileCheck2;
            return (
              <RevealItem
                as="li"
                key={item.title}
                className={cn("h-full", cellSpan(index, total))}
              >
                {/* El hover vive en un elemento distinto del que anima Motion:
                    si compartieran nodo, el `transform` en línea del reveal
                    pisaría el `-translate-y` de la clase. */}
                <article className="flex h-full flex-col gap-3 rounded-lg bg-white/5 p-5 ring-1 ring-white/10 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/10 sm:p-6">
                  <span
                    aria-hidden="true"
                    className="flex size-11 items-center justify-center rounded-md bg-white/10 text-white"
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="font-heading text-h3 text-white">
                    {item.title}
                  </h3>
                  <p className="text-body text-navy-soft/85">{item.body}</p>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {/* `primary` es la única variante del kit legible sobre navy en los
            dos temas: en claro es teal-deep con texto blanco, en oscuro teal
            claro con texto navy. `secondary` usa `text-ink` y aquí se
            volvería invisible. */}
        <Reveal delay={0.1} className="mt-10">
          <Button href={ctaHref} size="lg">
            {copy.cta}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
