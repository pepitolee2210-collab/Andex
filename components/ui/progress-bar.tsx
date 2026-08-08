import { useId } from "react";
import { clamp, cn } from "@/lib/utils";

/**
 * ProgressBar (§2.5) — variantes lineal y steps.
 *
 * §3.2: la barra del wizard usa el teal #12B8A6 COMO SUPERFICIE
 * (bg-teal en el relleno, bg-teal-soft en el riel). Nunca lleva texto
 * encima: el texto "Paso X de Y" va fuera, visible, y alimenta
 * aria-valuetext.
 */

export type ProgressBarProps = {
  variant?: "linear" | "steps";
  /** Valor actual (para el wizard: el paso, 1..max). */
  value: number;
  /** Total (para el wizard: 5). */
  max: number;
  /**
   * Texto visible sobre la barra, p. ej. "Paso 2 de 5".
   * También se anuncia como aria-valuetext.
   */
  label?: string;
  /** Etiqueta accesible si no hay label visible. Default: "Progreso". */
  ariaLabel?: string;
  className?: string;
};

export function ProgressBar({
  variant = "linear",
  value,
  max,
  label,
  ariaLabel = "Progreso",
  className,
}: ProgressBarProps) {
  const labelId = useId();
  const now = clamp(value, 0, max);
  const pct = max > 0 ? (now / max) * 100 : 0;

  const a11y = {
    role: "progressbar" as const,
    "aria-valuemin": 0,
    "aria-valuemax": max,
    "aria-valuenow": now,
    "aria-valuetext": label,
    "aria-labelledby": label ? labelId : undefined,
    "aria-label": label ? undefined : ariaLabel,
  };

  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div id={labelId} className="mb-1.5 text-label font-medium text-muted">
          {label}
        </div>
      ) : null}

      {variant === "steps" ? (
        <div {...a11y} className="flex w-full gap-1.5">
          {Array.from({ length: max }, (_, i) => (
            <div
              key={i}
              aria-hidden="true"
              className={cn(
                "h-1.5 min-w-0 flex-1 rounded-full transition-colors duration-500",
                i < now ? "bg-teal" : "bg-teal-soft",
              )}
            />
          ))}
        </div>
      ) : (
        <div
          {...a11y}
          className="h-2 w-full overflow-hidden rounded-full bg-teal-soft"
        >
          <div
            className="h-full rounded-full bg-teal transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
