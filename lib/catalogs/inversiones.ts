/**
 * INVERSIONES — el catálogo de oportunidades.
 *
 * Dos caminos, porque son dos personas distintas:
 *
 *   `negocio`    quien acaba de llegar y necesita generar ingresos ya
 *   `inversion`  quien tiene capital y busca rendimiento
 *
 * Cada oportunidad lleva su etiqueta de rendimiento y su inversión inicial
 * cuando aplica. Los textos visibles NO viven aquí: salen de i18n, como
 * todo el copy del producto.
 */

export type OpportunityKind = "negocio" | "inversion";

export type Opportunity = {
  id: string;
  kind: OpportunityKind;
  /** Nombre de la variable CSS del acento, sin `var()`. */
  accent: string;
  /** Icono de lucide-react, por nombre. */
  icon: string;
  /** Rendimiento mensual, como rango. `null` si no aplica. */
  monthlyReturn: { min: number; max: number } | null;
  /** Capital de entrada en USD. `null` si no requiere. */
  fromUsd: number | null;
};

export const OPORTUNIDADES: readonly Opportunity[] = [
  // ── Para quien acaba de llegar ──
  {
    id: "limpieza",
    kind: "negocio",
    accent: "--teal-deep",
    icon: "Sparkles",
    monthlyReturn: null,
    fromUsd: 300,
  },
  {
    id: "comida",
    kind: "negocio",
    accent: "--amber-deep",
    icon: "UtensilsCrossed",
    monthlyReturn: null,
    fromUsd: 500,
  },
  {
    id: "transporte",
    kind: "negocio",
    accent: "--info",
    icon: "Truck",
    monthlyReturn: null,
    fromUsd: 1500,
  },
  {
    id: "construccion",
    kind: "negocio",
    accent: "--warning",
    icon: "Hammer",
    monthlyReturn: null,
    fromUsd: 800,
  },

  // ── Para quien quiere invertir ──
  // Una sola opción, a propósito. Entrar desde $100 es lo que la hace
  // alcanzable para quien acaba de llegar; poner al lado una de $20,000
  // convertiría la sección en un escaparate donde casi todo queda fuera
  // de alcance, que es justo lo contrario de lo que hace falta aquí.
  {
    id: "fondo",
    kind: "inversion",
    accent: "--success",
    icon: "TrendingUp",
    monthlyReturn: { min: 3, max: 4 },
    fromUsd: 100,
  },
] as const;

export function oportunidadesPor(kind: OpportunityKind): Opportunity[] {
  return OPORTUNIDADES.filter((o) => o.kind === kind);
}

export function oportunidadPorId(id: string): Opportunity | undefined {
  return OPORTUNIDADES.find((o) => o.id === id);
}
