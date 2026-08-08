import { cn } from "@/lib/utils";

/**
 * Skeleton (§2.5) — variantes card, text, avatar, con shimmer sutil
 * (`.andex-shimmer`, definido en globals.css; se congela con
 * prefers-reduced-motion por la regla global).
 *
 * Decorativo puro: siempre aria-hidden. El estado de carga lo anuncia
 * el consumidor (p. ej. aria-busy en la región que carga).
 */

export type SkeletonVariant = "card" | "text" | "avatar";

export type SkeletonProps = {
  variant?: SkeletonVariant;
  /** Solo variante text: número de líneas (última al 60%). */
  lines?: number;
  className?: string;
};

export function Skeleton({ variant = "text", lines = 3, className }: SkeletonProps) {
  if (variant === "avatar") {
    return (
      <div
        aria-hidden="true"
        className={cn("andex-shimmer size-12 rounded-full", className)}
      />
    );
  }

  if (variant === "card") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "rounded-lg border border-line bg-surface p-4 shadow-sm",
          className,
        )}
      >
        <div className="andex-shimmer mb-4 size-12 rounded-md" />
        <div className="andex-shimmer mb-2.5 h-4 w-3/4 rounded-full" />
        <div className="andex-shimmer h-3 w-1/2 rounded-full" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className={cn("space-y-2.5", className)}>
      {Array.from({ length: Math.max(1, lines) }, (_, i) => (
        <div
          key={i}
          className={cn(
            "andex-shimmer h-4 rounded-full",
            i === lines - 1 && lines > 1 ? "w-3/5" : "w-full",
          )}
        />
      ))}
    </div>
  );
}
