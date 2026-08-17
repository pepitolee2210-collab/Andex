import { cn } from "@/lib/utils";

/**
 * El sello de tarifa congelada (§2.9) — ÚNICO elemento decorativo
 * permitido del sistema, y se usa UNA sola vez en todo el producto:
 * la tarjeta del plan anual del paywall. Si aparece en badges,
 * confirmaciones o el dashboard, pierde su significado.
 *
 * Spec §2.9: círculo con borde de 2px rotado −9°, borde punteado en el
 * contenedor, fondo ámbar suave. Texto navy (text-ink: navy en claro,
 * legible en oscuro). Viene del lenguaje visual de los documentos
 * oficiales: apostillas, certificaciones — "esto es un compromiso
 * formal".
 *
 * HOY NO SE USA EN PRODUCTO. El muro de pago era su única aparición y se
 * retiró de ahí por decisión de diseño. Queda montado en `app/design` —el
 * escaparate del sistema— para que la pieza no se pierda si vuelve.
 */

export type SealProps = {
  /** Línea principal, p. ej. "Tarifa congelada". */
  title: string;
  /** Línea secundaria, p. ej. "Tu precio no sube nunca". */
  subtitle?: string;
  className?: string;
};

export function Seal({ title, subtitle, className }: SealProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg border-2 border-dotted border-amber-deep bg-amber-soft p-3.5",
        className,
      )}
    >
      <div className="flex size-32 rotate-[-9deg] flex-col items-center justify-center gap-1 rounded-full border-2 border-amber-deep px-3 text-center">
        <span className="text-label font-bold uppercase leading-tight tracking-widest text-ink">
          {title}
        </span>
        {subtitle ? (
          <span className="text-caption leading-tight text-ink">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}
