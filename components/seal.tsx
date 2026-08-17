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
 * La talla NO la fija §2.9 —fija la forma: el círculo, la rotación, el
 * punteado y el ámbar—. `compact` existe porque en la tarjeta anual el sello
 * va en fila con la promesa que certifica, y a talla completa se comía el
 * ancho: quedaba un sello enorme y su texto en una columna de cuatro
 * palabras. Lo que hay que leer es la frase; el sello dice de qué registro
 * es, no es el registro.
 */

export type SealProps = {
  /** Línea principal, p. ej. "Tarifa congelada". */
  title: string;
  /** Línea secundaria, p. ej. "Tu precio no sube nunca". */
  subtitle?: string;
  /** Misma forma, menor diámetro: para cuando va junto a su texto. */
  compact?: boolean;
  className?: string;
};

export function Seal({ title, subtitle, compact = false, className }: SealProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg border-2 border-dotted border-amber-deep bg-amber-soft",
        compact ? "p-2.5" : "p-3.5",
        className,
      )}
    >
      <div
        className={cn(
          "flex rotate-[-9deg] flex-col items-center justify-center gap-1 rounded-full border-2 border-amber-deep text-center",
          /* 112px, no 96: a 96 la palabra «CONGELADA» en versalitas se
             salía del círculo y tocaba el borde. Medido, no estimado. */
          compact ? "size-28 px-2" : "size-32 px-3",
        )}
      >
        <span
          className={cn(
            "font-bold uppercase leading-tight text-ink",
            /* 13px en la talla compacta. La geometría del sello está
               calibrada para su texto: a 14px con versalitas «CONGELADA»
               mide 92px, exactamente el hueco entre paddings, y la rotación
               de −9° empujaba la esquina contra el círculo. No es prosa
               —la frase de al lado dice lo mismo entero—, así que baja sin
               perder nada. 13 es el suelo que verifica el recorrido. */
            compact
              ? "text-[0.8125rem] tracking-normal"
              : "text-label tracking-widest",
          )}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="text-caption leading-tight text-ink">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
}
