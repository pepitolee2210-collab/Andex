import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Badge (§2.5) — variantes teal, amber, navy, neutral.
 *
 * Contraste (§2.1.1):
 * - teal    → superficie teal-soft + texto teal-deep (el teal puro jamás lleva texto).
 * - amber   → fondo ámbar puro + texto on-highlight (navy, 8.2:1 ✓). Único caso
 *             permitido de ámbar puro: es superficie de badge, texto navy encima.
 * - navy    → navy constante + texto blanco (14.6:1 ✓ en ambos temas).
 * - neutral → surface-alt + texto muted.
 */

export type BadgeVariant = "teal" | "amber" | "navy" | "neutral";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  teal: "bg-teal-soft text-teal-deep",
  amber: "bg-amber text-on-highlight",
  navy: "bg-navy text-white",
  neutral: "bg-surface-alt text-muted",
};

export type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1",
        "text-caption font-semibold tracking-wide",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
