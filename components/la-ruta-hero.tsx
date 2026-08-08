"use client";

/**
 * LA RUTA — variante hero (§2.8 + §3.1.1).
 *
 * Decisión de diseño: aquí La Ruta NO es una ilustración al lado del texto,
 * es la ESTRUCTURA del hero. Los dos caminos atraviesan la sección completa
 * y el titular vive en el espacio negativo entre ellos. §2.8 dice que La Ruta
 * "no es decoración: codifica información" — hacerla el andamiaje de la
 * pantalla es la lectura más literal de esa frase.
 *
 * Los dos caminos nacen donde están las dos tarjetas de bifurcación: la que
 * el usuario elige es, literalmente, el principio de un camino que lleva a
 * ANDEX. Al elegir, ese trazo se enciende y el otro se atenúa a un hilo.
 *
 * Colores (§2.1.1, regla de oro):
 *   · pre_arrival → --teal-deep (el viaje)
 *   · in_us       → --text (el suelo; antes era --text-muted, que leía como
 *                   "secundario" para la mitad de la audiencia)
 *   · nodo de convergencia → --teal PURO, superficie sin texto encima.
 *     Su etiqueta va fuera, en --text.
 *
 * Dos composiciones, una por rango, para que las etiquetas sean legibles en
 * ambos: en móvil un recorrido compacto sobre el titular; en escritorio el
 * espinazo a sangre. Nunca se ven las dos a la vez.
 *
 * RESTRICCIÓN §2.8: una sola aparición por pantalla.
 */

import type { LocationContext } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBranch } from "./landing/branch-context";

export type LaRutaHeroProps = {
  /** Etiqueta de la rama de arriba (pre_arrival). */
  branchTopLabel?: string;
  /** Etiqueta de la rama de abajo (in_us). */
  branchBottomLabel?: string;
  centerLabel?: string;
  centerSublabel?: string;
  ariaLabel?: string;
  className?: string;
};

/** Estado de un trazo según la rama elegida. */
function pathState(
  own: LocationContext,
  chosen: LocationContext | null,
): "idle" | "on" | "off" {
  if (!chosen) return "idle";
  return chosen === own ? "on" : "off";
}

export function LaRutaHero({
  branchTopLabel = "Fuera de EE. UU.",
  branchBottomLabel = "Ya en EE. UU.",
  centerLabel = "ANDEX",
  centerSublabel = "un camino",
  ariaLabel = "La Ruta: dos caminos que convergen en ANDEX",
  className,
}: LaRutaHeroProps) {
  const { branch } = useBranch();
  const top = pathState("pre_arrival", branch);
  const bottom = pathState("in_us", branch);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("laruta select-none", className)}
      data-branch={branch ?? undefined}
    >
      {/* ── ESCRITORIO: el espinazo a sangre ──────────────────
          Los caminos entran por el borde izquierdo, cruzan la
          sección y convergen a la derecha. El titular ocupa el
          hueco central, que las curvas dejan libre por diseño. */}
      {/* `preserveAspectRatio="none"`: los caminos son casi horizontales en
          la mayor parte de su recorrido, así que estirarlos verticalmente no
          se nota — y a cambio los bordes quedan clavados arriba y abajo sea
          cual sea el alto de la sección. Con "meet" el dibujo se
          apaisaba y los trazos cruzaban el titular. */}
      <svg
        viewBox="0 0 1200 480"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="none"
        className="hidden h-full w-full lg:block"
      >
        {/* Los caminos ABRAZAN el contenido: corren pegados al borde
            superior e inferior durante dos tercios del ancho y solo
            convergen en la columna derecha, que el texto deja libre. */}
        <path
          d="M 0 26 C 440 26, 720 26, 1010 236"
          pathLength={1}
          className="laruta-path"
          data-state={top}
          stroke="var(--teal-deep)"
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M 0 454 C 440 454, 720 454, 1010 244"
          pathLength={1}
          className="laruta-path"
          data-state={bottom}
          style={{ animationDelay: "0.15s" }}
          stroke="var(--text)"
          strokeWidth={2.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

      </svg>

      {/* Nodos de origen en HTML, no en el SVG: con `preserveAspectRatio
          none` un círculo se deformaría en óvalo. Aquí siguen redondos. */}
      <span
        aria-hidden="true"
        className="laruta-dot absolute left-0 top-[5.4%] hidden lg:block"
        data-state={top}
        data-branch="pre_arrival"
      />
      <span
        aria-hidden="true"
        className="laruta-dot absolute left-0 top-[94.6%] hidden lg:block"
        data-state={bottom}
        data-branch="in_us"
      />

      {/* Etiquetas de escritorio. Van SOBRE y BAJO el nodo de origen, nunca
          a su lado: pegadas al nodo el círculo tachaba la primera letra. */}
      <span
        aria-hidden="true"
        className="laruta-label absolute left-6 top-[5.4%] hidden -translate-y-1/2 lg:block"
        data-state={top}
      >
        {branchTopLabel}
      </span>
      <span
        aria-hidden="true"
        className="laruta-label absolute left-6 top-[94.6%] hidden -translate-y-1/2 lg:block"
        data-state={bottom}
      >
        {branchBottomLabel}
      </span>
      <span
        aria-hidden="true"
        className="laruta-late absolute left-[85%] top-[57%] hidden -translate-x-1/2 text-center leading-tight lg:block"
      >
        <span className="block font-heading text-label font-bold tracking-widest text-ink">
          {centerLabel}
        </span>
        {centerSublabel ? (
          <span className="mt-0.5 block text-caption text-muted">
            {centerSublabel}
          </span>
        ) : null}
      </span>

      {/* ── MÓVIL Y TABLET: recorrido compacto ────────────────
          Ocupa poco alto a propósito: en el diseño anterior el
          diagrama empujaba la pregunta por debajo del pliegue,
          que es justo lo que §3.1.1 no quiere. */}
      <div className="lg:hidden">
        <svg
          viewBox="0 0 320 84"
          fill="none"
          aria-hidden="true"
          className="block h-auto w-full max-w-[20rem]"
        >
          <path
            d="M 10 16 C 110 16, 150 42, 250 42"
            pathLength={1}
            className="laruta-path"
            data-state={top}
            stroke="var(--teal-deep)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d="M 10 68 C 110 68, 150 42, 250 42"
            pathLength={1}
            className="laruta-path"
            data-state={bottom}
            style={{ animationDelay: "0.15s" }}
            stroke="var(--text)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle cx={10} cy={16} r={4} stroke="var(--teal-deep)" strokeWidth={2} fill="var(--bg)" />
          <circle cx={10} cy={68} r={4} stroke="var(--text)" strokeWidth={2} fill="var(--bg)" />
          <g className="laruta-late">
            <circle cx={252} cy={42} r={13} fill="var(--teal-soft)" />
            <circle cx={252} cy={42} r={6} fill="var(--teal)" />
          </g>
          <text
            x={272}
            y={39}
            className="laruta-late fill-[var(--text)] font-heading text-[11px] font-bold tracking-widest"
          >
            {centerLabel}
          </text>
          <text x={272} y={54} className="laruta-late fill-[var(--text-muted)] text-[10px]">
            {centerSublabel}
          </text>
        </svg>
      </div>
    </div>
  );
}
