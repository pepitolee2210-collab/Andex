"use client";

/**
 * S4 · PROBLEMA vs SOLUCIÓN — la sección donde el usuario se reconoce.
 *
 * Es la más emocional de la página y la que más peso vertical se lleva.
 * Todo el diseño está al servicio de una sola idea: esto es lo que duele
 * hoy y esto otro es el alivio.
 *
 * ── Temperatura ────────────────────────────────────────────────────────
 * Lado frío: `bg-surface-alt` (gris azulado frío) sobre el crema cálido de
 * la página, borde DISCONTINUO, cero sombra, texto `text-muted`. Se siente
 * provisional, sin terminar — como el problema.
 * Lado cálido: `bg-surface` sólido, filete `border-teal-deep`, `shadow-lg`
 * en escritorio, texto `text-ink` a contraste pleno. Pesa, está acabado.
 *
 * ── Un solo DOM, dos gramáticas ────────────────────────────────────────
 * MÓVIL: el par entero es UNA tarjeta. Arriba el dolor, una línea
 * discontinua con una flecha descendente, y abajo el alivio. Apilar dos
 * tarjetas sueltas dejaba el contraste en manos de la memoria del lector
 * ("¿esto de qué era la solución?"); dentro de una sola tarjeta el
 * antes→después se lee de un vistazo, sin scroll de por medio.
 * `lg:`: el envoltorio se vuelve una fila flex transparente y sus dos
 * mitades caen enfrentadas bajo sus cabeceras, exactamente como antes. No
 * hay marcado duplicado ni texto repetido para lectores de pantalla.
 *
 * ── Movimiento: el orden cuenta la historia ────────────────────────────
 * La entrada va ligada al SCROLL, no a un temporizador: `useScroll` con
 * `target` en cada par y `useTransform` repartiendo el recorrido. Primero
 * asoma la tarjeta, después se escribe el dolor, luego aparece la flecha y
 * al final llega el alivio. El usuario controla el ritmo con el dedo, así
 * que funciona igual en táctil (no depende de Lenis, que en móvil está
 * desactivado a propósito).
 * Se anima el CONTENIDO de cada mitad, nunca su caja: los fondos frío y
 * cálido están puestos desde el primer fotograma, así que la tarjeta nunca
 * se ve a medio construir ni da saltos de alto.
 * Con `prefers-reduced-motion` no se aplica un solo estilo animado: todo
 * queda visible y colocado (§2.5, piso no negociable).
 */

import { useRef } from "react";
import { ArrowDown, Check, X } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export type CompareRow = {
  /** Lo que se vive hoy. */
  before: string;
  /** Lo mismo, con ANDEX. */
  after: string;
};

export type CompareSectionCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** "Sin ANDEX" */
  beforeTitle: string;
  /** "Con ANDEX" */
  afterTitle: string;
  rows: readonly CompareRow[];
};

export type SectionCompareProps = {
  copy: CompareSectionCopy;
};

/** Retardo de la cabecera de alivio, en escritorio. */
const AFTER_DELAY = 0.3;

/**
 * Etiqueta de columna dentro de la tarjeta.
 * `lg:sr-only` en vez de `lg:hidden`: en escritorio la cabecera visible ya
 * dice "Sin ANDEX", pero esa cabecera no está asociada programáticamente a
 * cada tarjeta. Manteniéndola como texto solo-lector, cada tarjeta se
 * anuncia con su lado en TODOS los tamaños de pantalla.
 */
function CardLabel({ children, tone }: { children: string; tone: "cold" | "warm" }) {
  return (
    <p
      className={cn(
        "mb-3 text-caption font-semibold uppercase tracking-widest lg:sr-only",
        tone === "cold" ? "text-muted" : "text-teal-deep",
      )}
    >
      {children}
    </p>
  );
}

type ComparePairProps = {
  row: CompareRow;
  beforeTitle: string;
  afterTitle: string;
};

function ComparePair({ row, beforeTitle, afterTitle }: ComparePairProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // 0 → el par asoma por el borde inferior de la ventana.
  // 1 → su centro llega al 60 % de la altura, muy antes de que se pueda
  //     quedar sin recorrido: la secuencia SIEMPRE termina de contarse.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center 0.6"],
  });

  const shellY = useTransform(scrollYProgress, [0, 0.4], [28, 0]);
  const coldOpacity = useTransform(scrollYProgress, [0.04, 0.3], [0, 1]);
  const coldY = useTransform(scrollYProgress, [0.04, 0.3], [10, 0]);
  const arrowOpacity = useTransform(scrollYProgress, [0.28, 0.44], [0, 1]);
  const arrowScale = useTransform(scrollYProgress, [0.28, 0.5], [0.5, 1]);
  const warmOpacity = useTransform(scrollYProgress, [0.36, 0.68], [0, 1]);
  const warmY = useTransform(scrollYProgress, [0.36, 0.68], [10, 0]);

  return (
    <motion.div
      ref={ref}
      style={reduced ? undefined : { y: shellY }}
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-surface shadow-sm",
        "lg:flex lg:items-stretch lg:gap-6 lg:overflow-visible lg:rounded-none",
        "lg:border-0 lg:bg-transparent lg:shadow-none",
      )}
    >
      {/* ── Dolor ── frío, áspero, sin sombra ── */}
      <article
        className={cn(
          "relative border-b border-dashed border-line bg-surface-alt p-5 sm:p-6",
          "lg:flex-1 lg:rounded-lg lg:border lg:border-dashed",
        )}
      >
        <motion.div
          style={reduced ? undefined : { opacity: coldOpacity, y: coldY }}
        >
          <CardLabel tone="cold">{beforeTitle}</CardLabel>
          <div className="flex items-start gap-3">
            <X aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
            <p className="text-body text-muted">{row.before}</p>
          </div>
        </motion.div>

        {/* La transformación, dibujada: la flecha se sienta justo sobre la
            costura discontinua entre las dos mitades. Solo en móvil — en
            escritorio esa relación ya la dicen las dos columnas. */}
        <motion.span
          aria-hidden="true"
          style={
            reduced ? undefined : { opacity: arrowOpacity, scale: arrowScale }
          }
          className={cn(
            "absolute bottom-0 left-1/2 z-10 flex size-8 -translate-x-1/2 translate-y-1/2",
            "items-center justify-center rounded-full border border-line bg-surface",
            "text-teal-deep shadow-sm lg:hidden",
          )}
        >
          <ArrowDown className="size-4" />
        </motion.span>
      </article>

      {/* ── Alivio ── cálido, sólido, elevado ──
          En móvil el filete teal de la izquierda es lo que marca el lado
          bueno sin cerrar un segundo borde dentro de la misma tarjeta;
          `pl-4` + 4px de filete deja el texto alineado con la mitad de
          arriba. `pt-7` reserva sitio para la flecha. */}
      <article
        className={cn(
          "border-l-4 border-teal-deep bg-surface pb-5 pl-4 pr-5 pt-7",
          "sm:pb-6 sm:pl-5 sm:pr-6 lg:flex-1 lg:rounded-lg lg:border lg:border-l lg:p-6 lg:shadow-lg",
        )}
      >
        <motion.div
          style={reduced ? undefined : { opacity: warmOpacity, y: warmY }}
        >
          <CardLabel tone="warm">{afterTitle}</CardLabel>
          <div className="flex items-start gap-3">
            <Check
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-success"
            />
            <p className="text-body text-ink">{row.after}</p>
          </div>
        </motion.div>
      </article>
    </motion.div>
  );
}

export function SectionCompare({ copy }: SectionCompareProps) {
  return (
    <section
      id="comparativa"
      aria-labelledby="comparativa-titulo"
      className="bg-page px-4 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        {/* Encabezado centrado: rompe el eje izquierdo del resto de la
            página y avisa de que esto se lee distinto. */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-widest text-muted">
            {copy.eyebrow}
          </p>
          <h2
            id="comparativa-titulo"
            className="mt-3 font-heading text-h1 text-ink"
          >
            {copy.title}
          </h2>
          <p className="mt-4 text-body-lg text-muted">{copy.subtitle}</p>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:mt-14 lg:gap-3">
          {/* Cabeceras de columna: solo existen cuando hay dos columnas.
              `aria-hidden` porque cada tarjeta ya se etiqueta sola. La
              rejilla de 2 columnas con `gap-6` cae exactamente sobre las
              mitades de cada par (`flex-1` + `gap-6`). */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
            <Reveal>
              <p
                aria-hidden="true"
                className="flex items-center gap-2 font-heading text-h3 text-muted"
              >
                <X aria-hidden="true" className="size-5 shrink-0 text-danger" />
                {copy.beforeTitle}
              </p>
            </Reveal>
            <Reveal delay={AFTER_DELAY}>
              <p
                aria-hidden="true"
                className="flex items-center gap-2 font-heading text-h3 text-teal-deep"
              >
                <Check
                  aria-hidden="true"
                  className="size-5 shrink-0 text-success"
                />
                {copy.afterTitle}
              </p>
            </Reveal>
          </div>

          {copy.rows.map((row, index) => (
            <ComparePair
              key={`par-${index}`}
              row={row}
              beforeTitle={copy.beforeTitle}
              afterTitle={copy.afterTitle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
