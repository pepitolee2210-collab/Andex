"use client";

/**
 * PORTADA — la primera pantalla del producto (§3.1.1).
 *
 * Es la réplica de `onboarding.jsx → Portada` del sistema de diseño, con
 * nuestro contenido. Lo que manda, literal del diseño: «El precio y su
 * límite en la misma vista. Fondo navy: es la única pantalla del producto
 * que lo usa a sangre.»
 *
 * Tres bloques y nada más, en el orden del diseño:
 *
 *  1. la marca arriba, pequeña, con el símbolo en reverso;
 *  2. el centro, que es la promesa: titular a 40px, la frase que explica
 *     qué es ANDEX y —en teal— lo que cuesta empezar («cinco preguntas,
 *     dos minutos, no pedimos tarjeta»);
 *  3. abajo las dos acciones y el aviso de no-afiliación, que va aquí
 *     porque aquí es donde surge la pregunta.
 *
 * El escáner gratuito es la acción de acento: se puede probar el producto
 * sin cuenta, y esa es la demostración más fuerte que tenemos. Crear la
 * cuenta va debajo, en el botón claro sobre navy.
 *
 * En escritorio la columna no cambia: sólo se le añade al lado el recorrido
 * del producto, que es contenido nuestro y no existe en el diseño móvil.
 */

import Link from "next/link";
import { ScanLine } from "lucide-react";
import { Glyph } from "@/components/ui/kit";
import { cn } from "@/lib/utils";
import type { TourDict } from "@/lib/i18n/dictionaries/tour";
import { PhoneTour } from "./phone-tour";
import { trackLazy } from "./track-lazy";

export type HeroCopy = {
  /** La marca, arriba a la izquierda. */
  brand: string;
  /** El titular partido en las líneas del diseño (decorativo). */
  titleLines: readonly string[];
  /** El titular completo en un solo nodo, para lectores de pantalla. */
  title: string;
  /** Qué es ANDEX, en una frase. */
  subtitle: string;
  /** La promesa y su límite, en la misma vista. */
  promiseLines: readonly string[];
  scanCta: string;
  accountCta: string;
  /** No-afiliación: cierra la pantalla, no vive en una nota al pie. */
  disclaimer: string;
  /** Guion del recorrido del producto (sólo escritorio). */
  tour: TourDict;
};

export type SectionHeroProps = {
  copy: HeroCopy;
  /** Ancla de la sección donde se prueba el escáner sin registrarse. */
  scanHref: string;
  accountHref: string;
  className?: string;
};

/**
 * Aquí NO hay animación de entrada, y es una decisión.
 *
 * El titular se revelaba línea a línea desde detrás de una máscara. Dos
 * motivos para quitarlo: el sistema de diseño veta expresamente las
 * microinteracciones vistosas en la primera pantalla —«si hay que elegir
 * entre bonito y creíble, creíble», porque buena parte de este público ya
 * fue estafada por webs que se veían así—, y además el efecto se quedaba
 * colgado en su estado inicial, con el titular fuera de la máscara y la
 * pantalla sin título. Lo primero que se lee no puede depender de que una
 * animación termine.
 */
export function SectionHero({
  copy,
  scanHref,
  accountHref,
  className,
}: SectionHeroProps) {
  const lines = copy.titleLines;

  return (
    <section
      id="hero"
      aria-labelledby="hero-titulo"
      className={cn(
        "w-full bg-navy text-[color:var(--text-on-invert)]",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-4 lg:py-20">
        {/* ── La portada, tal cual el diseño ─────────────── */}
        {/* La altura descuenta lo que la landing pone encima —la cinta y la
            barra de navegación— para que la portada quepa entera en la
            primera pantalla, que es de lo que va. */}
        <div className="flex min-h-[calc(100svh-11.25rem)] flex-col px-5 pb-6 lg:min-h-0 lg:px-0 lg:pb-0">
          {/* 1 · La marca */}
          <div className="flex min-h-11 items-center gap-2.5">
            {/* El símbolo en reverso: esta pantalla es siempre navy, de día
                y de noche, así que la versión clara no cambia con el tema. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marca/andex-mark-reverse.svg"
              alt=""
              aria-hidden="true"
              className="h-6 w-auto"
            />
            <span className="font-heading text-[0.9375rem] font-extrabold tracking-[0.2em]">
              {copy.brand}
            </span>
          </div>

          {/* 2 · La promesa.
              El color va escrito en cada elemento y no heredado: `globals.css`
              da color propio a `h1`, y una regla de elemento gana siempre a lo
              heredado del contenedor. Sin esto el titular sale navy sobre
              navy — invisible. */}
          <div className="flex flex-1 flex-col justify-center">
            <h1
              id="hero-titulo"
              className="font-heading text-[2.5rem] font-extrabold leading-[1.02] tracking-[-0.03em] text-[color:var(--text-on-invert)]"
            >
              <span className="sr-only">{copy.title}</span>
              <span aria-hidden="true">
                {lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </h1>

            <p className="mt-[18px] max-w-[30ch] text-body-lg leading-[1.5] text-[color:var(--text-on-invert-quiet)]">
              {copy.subtitle}
            </p>

            {/* El precio de entrada y su límite, en la misma vista. */}
            <p className="mt-[26px] text-body font-bold text-[color:var(--text-on-invert-accent)]">
              {copy.promiseLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>

          {/* 3 · Las dos acciones y el aviso */}
          <div className="flex flex-col gap-3 pb-1.5">
            <a
              href={scanHref}
              onClick={() =>
                trackLazy("landing_cta_clicked", { cta_position: "scanner" })
              }
              className="ax-btn btn-accent btn-lg wide"
            >
              <Glyph name="scan-line" icon={ScanLine} strokeWidth={2} />
              {copy.scanCta}
            </a>

            <Link
              href={accountHref}
              onClick={() =>
                trackLazy("landing_cta_clicked", { cta_position: "hero" })
              }
              className="ax-btn btn-onInvert btn-lg wide"
            >
              {copy.accountCta}
            </Link>

            <p className="pt-2.5 text-caption leading-[1.5] text-[color:var(--text-on-invert-quiet)]">
              {copy.disclaimer}
            </p>
          </div>
        </div>

        {/* ── Escritorio: el producto funcionando, al lado ── */}
        <div className="hidden lg:block">
          <PhoneTour copy={copy.tour} />
        </div>
      </div>
    </section>
  );
}
