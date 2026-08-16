"use client";

/**
 * Casilla de verificación con la forma de FILA del sistema de diseño.
 *
 * En el diseño el consentimiento no es una casilla suelta: es una fila con
 * su ficha de icono a la izquierda, el compromiso como título y, debajo, la
 * salida («puedes borrar tus datos cuando quieras»). Poner la salida junto
 * al compromiso es deliberado — con este público, la letra pequeña escondida
 * es exactamente lo que hace desconfiar.
 *
 * §3.4.6: **nunca premarcada**. El estado inicial lo decide quien la usa y
 * en este producto siempre es `false`.
 *
 * §9: el objetivo táctil es la fila entera (52px de alto por `.row`), y el
 * `<input>` real —transparente, 44×44— vive sobre la ficha. Es un control
 * nativo, así que teclado, lector de pantalla y autocompletado siguen
 * funcionando; los enlaces legales que van dentro del texto quedan libres,
 * que es lo que se rompía al tapar la fila entera con el control.
 */

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Glyph } from "@/components/ui/kit";
import { cn } from "@/lib/utils";

export type CheckboxFieldProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** El compromiso, en una línea. Admite énfasis y enlaces dentro. */
  children: ReactNode;
  /** La salida o la consecuencia, debajo del compromiso. */
  meta?: ReactNode;
  /** Marca el control como obligatorio. */
  required?: boolean;
  /** Mensaje de error: qué pasó y cómo resolverlo (§2.7). */
  error?: string;
  disabled?: boolean;
};

export function CheckboxField({
  id,
  checked,
  onChange,
  children,
  meta,
  required = false,
  error,
  disabled = false,
}: CheckboxFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "row tappable",
          disabled ? "cursor-not-allowed text-disabled" : "cursor-pointer",
        )}
      >
        <span
          className={cn(
            "rowicon relative",
            checked
              ? "tone-accent"
              : // Sin marcar necesita leerse como una casilla vacía, no como
                // una ficha de icono: el filete es lo que lo dice.
                "tone-quiet shadow-[inset_0_0_0_1.5px_var(--line-strong)]",
            error && "outline outline-2 outline-offset-2 outline-danger",
          )}
        >
          {checked ? <Glyph name="check" icon={Check} strokeWidth={2.4} /> : null}
          <input
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="absolute -inset-1 z-10 size-11 cursor-pointer opacity-0"
          />
        </span>

        <span className="rowmain">
          <span className="rowtitle">{children}</span>
          {meta ? <span className="rowmeta">{meta}</span> : null}
        </span>
      </label>

      {error ? (
        <p id={errorId} role="alert" className="fieldhint px-4 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
