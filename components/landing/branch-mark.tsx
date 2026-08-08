/**
 * Marca de rama — el distintivo de cada tarjeta de bifurcación.
 *
 * Por qué no un emoji: 🇺🇸 no se renderiza en Windows y cae a las letras
 * "US", mientras que ✈️ sí sale a todo color. Las dos tarjetas dejaban de
 * parecerse entre sí y una de ellas parecía rota. Un emoji tampoco se puede
 * teñir con los tokens ni reacciona al estado.
 *
 * Qué dibuja: el ORIGEN del camino de esa rama. Cada tarjeta lleva el
 * principio de su propia ruta, así que elegir una tarjeta es visiblemente
 * tomar un camino que lleva a ANDEX (§2.8: La Ruta codifica información).
 * Es el mismo lenguaje del hero, en miniatura — no un icono nuevo.
 */

import type { LocationContext } from "@/lib/types";
import { cn } from "@/lib/utils";

export type BranchMarkProps = {
  context: LocationContext;
  active?: boolean;
  className?: string;
};

export function BranchMark({ context, active = false, className }: BranchMarkProps) {
  const isInUs = context === "in_us";
  // §2.1.1: ambos son trazo, nunca fondo con texto encima.
  const stroke = isInUs ? "var(--text)" : "var(--teal-deep)";

  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {/* Halo: aparece solo al elegir, con el teal como superficie */}
      <circle
        cx={22}
        cy={22}
        r={21}
        fill="var(--teal-soft)"
        className="transition-opacity duration-200"
        opacity={active ? 1 : 0}
      />
      {/* El tramo de camino: in_us llega y se asienta (horizontal);
          pre_arrival despega (asciende hacia el destino). */}
      <path
        d={isInUs ? "M 10 30 L 34 30" : "M 10 32 C 20 32, 22 14, 34 14"}
        stroke={stroke}
        strokeWidth={2.25}
        strokeLinecap="round"
        opacity={active ? 1 : 0.75}
      />
      {/* El nodo de origen, gemelo del que abre el camino en el hero */}
      <circle
        cx={isInUs ? 10 : 10}
        cy={isInUs ? 30 : 32}
        r={4}
        fill="var(--surface)"
        stroke={stroke}
        strokeWidth={2.25}
      />
      {/* Punta: hacia dónde va este camino */}
      <path
        d={isInUs ? "M 29 25.5 L 34 30 L 29 34.5" : "M 29 9.5 L 34 14 L 29 18.5"}
        stroke={stroke}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.75}
      />
    </svg>
  );
}
