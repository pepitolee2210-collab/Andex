import { cn } from "@/lib/utils";

/**
 * EL RECORRIDO, SIEMPRE A LA VISTA.
 *
 * Cuatro pasos —bienvenida, membresía, cuenta, comunidad— y en cuál estás.
 * No es decoración: el embudo nuevo cobra ANTES de crear la cuenta, y eso es
 * un orden que nadie espera. Si la pantalla no dice qué viene después, el
 * momento de pagar se lee como el final del proceso y no como el segundo de
 * cuatro pasos.
 *
 * ── Cómo se anuncia ──
 *
 * En escritorio se ven los cuatro nombres. En un teléfono no caben, así que
 * se convierte en una barra de cuatro tramos: la misma información, sin
 * gastar el ancho. Para quien no ve ninguna de las dos, el `aria-label` dice
 * «Paso 2 de 4» en palabras — que es lo único que hace falta saber.
 */

export type PasosEmbudoProps = {
  /** Los cuatro nombres, de `dict.bienvenida.pasos`. */
  pasos: readonly string[];
  /** Cuál está activo, empezando en 1. */
  actual: number;
  /**
   * «Paso 2 de 4», YA compuesto. Se recibe hecho y no como función a
   * propósito: este componente lo monta una pantalla cliente, y una función
   * no cruza la frontera servidor→cliente — Next lo rechaza en tiempo de
   * ejecución, no de compilación, así que el fallo aparece como un 500 sin
   * pista.
   */
  etiqueta: string;
  className?: string;
};

export function PasosEmbudo({ pasos, actual, etiqueta, className }: PasosEmbudoProps) {
  return (
    <div
      role="group"
      aria-label={etiqueta}
      className={cn("min-w-0", className)}
    >
      {/* ── Escritorio: los nombres ── */}
      <ol className="hidden items-center gap-2.5 lg:flex">
        {pasos.map((paso, i) => {
          const n = i + 1;
          const hecho = n < actual;
          const activo = n === actual;
          return (
            <li key={paso} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex items-center gap-2 text-caption font-semibold",
                  activo
                    ? "text-[color:var(--text-on-invert)]"
                    : "text-[color:var(--text-on-invert-quiet)]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-[22px] items-center justify-center rounded-full text-[11px] font-extrabold",
                    activo &&
                      "bg-[color:var(--text-on-invert-accent)] text-[color:var(--navy-900)]",
                    hecho &&
                      "bg-[color:var(--accent-wash-invert)] text-[color:var(--teal-200)]",
                    !activo && !hecho &&
                      "bg-[color:var(--surface-on-invert)] text-[color:var(--text-on-invert-quiet)]",
                  )}
                >
                  {hecho ? "✓" : n}
                </span>
                {paso}
              </span>
              {n < pasos.length ? (
                <span
                  aria-hidden="true"
                  className="h-px w-5 bg-[color:var(--hairline-on-invert-soft)]"
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* ── Móvil: cuatro tramos ── */}
      <div aria-hidden="true" className="flex items-center gap-2 lg:hidden">
        <span className="tabular-nums text-caption text-[color:var(--text-on-invert-quiet)]">
          {actual} / {pasos.length}
        </span>
        <span className="flex flex-1 gap-1.5">
          {pasos.map((paso, i) => (
            <span
              key={paso}
              className={cn(
                "h-[3px] flex-1 rounded-full",
                i + 1 === actual && "bg-[color:var(--text-on-invert-accent)]",
                i + 1 < actual && "bg-[color:var(--accent-wash-invert)]",
                i + 1 > actual && "bg-[color:var(--hairline-on-invert-soft)]",
              )}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
