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
 * ── UNA sola acción, y no es el escáner ──
 *
 * Aquí hubo dos botones y el de acento era «escanear gratis». Se quitó: el
 * escáner es una función, no el argumento. Lo que distingue a ANDEX es que
 * hay gente al otro lado, y una portada con dos llamadas obliga a elegir
 * antes de haber entendido qué se ofrece. Queda una: comenzar el viaje.
 *
 * El escáner sigue en la página, más abajo y con su propia sección, donde
 * ya se sabe qué es lo que se está probando.
 *
 * ── La confianza se demuestra, no se declara ──
 *
 * Tres hechos comprobables debajo de la promesa, en vez de adjetivos.
 * Uno de ellos dice su propio límite y otro dice lo que ANDEX NO es —que
 * no está afiliado a ninguna agencia—. Con un público al que le cobraron
 * cientos de dólares por trámites gratis, decir lo que no eres genera más
 * confianza que cualquier superlativo.
 *
 * En escritorio la columna no cambia: sólo se le añade al lado el recorrido
 * del producto, que es contenido nuestro y no existe en el diseño móvil.
 */

import Link from "next/link";
import { Check } from "lucide-react";
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
  /** La segunda línea del titular, en teal: qué buscamos. */
  titleAccent: string;
  /** Tres hechos comprobables. No adjetivos. */
  trustPoints: readonly string[];
  /** Dónde está el piloto. Va arriba, pequeño. */
  badge: string;
  accountCta: string;
  /** Lo que cuesta empezar, debajo del botón. */
  ctaHint: string;
  /** Anuncia el recorrido del producto: «Así funciona ANDEX». */
  tourLabel: string;
  /** No-afiliación: cierra la pantalla, no vive en una nota al pie. */
  disclaimer: string;
  /** Guion del recorrido del producto (sólo escritorio). */
  tour: TourDict;
};

export type SectionHeroProps = {
  copy: HeroCopy;
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
export function SectionHero({ copy, accountHref, className }: SectionHeroProps) {
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
      <div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:px-6 lg:py-20 xl:py-24">
        {/* ── La portada, tal cual el diseño ─────────────── */}
        {/* La altura descuenta lo que la landing pone encima —la cinta y la
            barra de navegación— para que la portada quepa entera en la
            primera pantalla, que es de lo que va. */}
        {/* ── El alto ──
            Aquí se forzaba `100svh` menos la cinta y la barra, y el bloque
            del centro llevaba `justify-center`. El resultado en un teléfono
            eran DOS HUECOS MUERTOS de unos 200px —uno bajo el distintivo y
            otro sobre el botón— con el contenido flotando en medio: la
            portada no estaba compuesta, estaba estirada.

            Ahora la altura la da el contenido y el ritmo lo dan los
            márgenes. Ocupa casi la pantalla igual, pero porque lo que hay
            dentro la llena, no porque se la obligue. */}
        <div className="flex flex-col items-center px-6 pb-14 pt-3 text-center max-[680px]:pb-10 max-[680px]:pt-1 sm:px-8 lg:items-stretch lg:px-0 lg:pb-0 lg:pt-0 lg:text-left">
          {/* 1 · El alcance.
              Aquí iba la marca otra vez, con su símbolo — y la barra de
              navegación ya la lleva justo encima. Dos ANDEX apilados no
              refuerzan nada: gastan sesenta píxeles de la única pantalla
              donde cada píxel decide si alguien sigue leyendo.

              Queda el alcance real. No es una medalla: decir «piloto en
              Utah» de entrada evita prometer una cobertura que todavía no
              existe. */}
          <div className="flex min-h-11 items-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--hairline-on-invert)] px-3.5 py-1.5 text-caption font-semibold text-[color:var(--text-on-invert)]">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-[color:var(--text-on-invert-accent)]"
              />
              {copy.badge}
            </span>
          </div>

          {/* 2 · La promesa.
              El color va escrito en cada elemento y no heredado: `globals.css`
              da color propio a `h1`, y una regla de elemento gana siempre a lo
              heredado del contenedor. Sin esto el titular sale navy sobre
              navy — invisible. */}
          <div className="flex flex-col items-center pt-6 max-[680px]:pt-2 sm:pt-10 lg:flex-1 lg:items-stretch lg:justify-center lg:py-14">
            <h1
              id="hero-titulo"
              className="hero-entra font-heading text-[1.9375rem] font-extrabold leading-[1.08] tracking-[-0.028em] text-[color:var(--text-on-invert)] sm:text-[2.75rem] lg:text-[3.5rem]"
              style={{ animationDelay: "60ms" }}
            >
              <span className="sr-only">{copy.title}</span>
              <span aria-hidden="true">
                {lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                {/* La segunda línea, en teal: separa QUIÉNES SOMOS de QUÉ
                    BUSCAMOS sin necesidad de otro titular. */}
                <span className="mt-2 block text-[color:var(--text-on-invert-accent)]">
                  {copy.titleAccent}
                </span>
              </span>
            </h1>



            {/* Los tres hechos. Cada uno con su visto: se leen como una
                lista de lo que ya es cierto, no como características. */}
            {/* Los tres hechos suben a segunda capa: entre el titular y
                ellos ya no hay un subtítulo que repita lo mismo en largo. */}
            <ul className="mt-8 flex flex-col gap-3.5 text-left max-[680px]:mt-5 max-[680px]:gap-2.5 sm:mt-11 sm:gap-4">
              {copy.trustPoints.map((punto, i) => (
                <li
                  key={punto}
                  className="hero-entra flex gap-3 text-body leading-[1.5] text-[color:var(--text-on-invert)]"
                  style={{ animationDelay: `${240 + i * 70}ms` }}
                >
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 size-5 shrink-0 text-[color:var(--text-on-invert-accent)]"
                  />
                  <span className="min-w-0">{punto}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3 · Las dos acciones y el aviso */}
          <div
            className="hero-entra mt-10 flex flex-col gap-3.5 max-[680px]:mt-6 sm:mt-12 lg:mt-0 lg:pb-2"
            style={{ animationDelay: "470ms" }}
          >
            <Link
              href={accountHref}
              onClick={() =>
                trackLazy("landing_cta_clicked", { cta_position: "hero" })
              }
              className="ax-btn btn-onInvert btn-lg wide"
            >
              {copy.accountCta}
            </Link>

            {/* Lo que cuesta empezar, pegado al botón: es lo que decide si
                alguien lo toca ahora o lo deja para luego. */}
            <p className="text-center text-caption leading-[1.55] text-[color:var(--text-on-invert-quiet)]">
              {copy.ctaHint}
            </p>
          </div>
        </div>

        {/* ── El producto funcionando ──
            En escritorio va al lado, entero.

            En MÓVIL va debajo y SANGRADO por el borde inferior: sólo se ve
            la parte de arriba. Un teléfono entero dentro de un teléfono se
            lee raro y se come una pantalla completa —el recorrido mide
            unos 676px de alto—, y cortarlo dice lo mismo con la mitad:
            que hay producto de verdad y que continúa.

            Tiene un coste y conviene saberlo: el recorrido es cliente y
            animado, así que en móvil se carga JavaScript que antes no se
            cargaba. En un Android de gama media con datos contados, eso
            no es gratis. */}
        {/* El producto funcionando. EL MISMO en las dos anchuras: en
            escritorio va al lado, en móvil debajo — y entero, sin recortar.
            Se probó una versión estática distinta para móvil y no tenía
            sentido mantener dos mockups que dicen lo mismo. */}
        <div className="mt-12 w-full pb-14 max-[680px]:mt-8 max-[680px]:pb-10 lg:mt-0 lg:pb-0">
          {/* Anuncia lo que viene. Sin esto, el teléfono aparecía suelto
              debajo del botón y se leía como un adorno.

              El teal de acento (`--text-on-invert-accent`) daba 5.88:1 sobre
              el navy plano, pero este rótulo cae justo dentro del halo que
              ilumina el teléfono: fotografiado, el fondo real ahí es #445A6D
              y el contraste se hundía a 2.86:1. El teal claro aguanta el
              halo con 5.34:1 y mantiene el acento. Medido, no estimado. */}
          <p
            className="hero-entra mb-5 text-center text-caption font-bold uppercase tracking-[0.16em] text-[color:var(--teal-200)] lg:hidden"
            style={{ animationDelay: "560ms" }}
          >
            {copy.tourLabel}
          </p>
          <div className="hero-sube" style={{ animationDelay: "620ms" }}>
            <PhoneTour copy={copy.tour} />
          </div>
        </div>
      </div>
    </section>
  );
}
