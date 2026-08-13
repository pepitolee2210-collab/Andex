import { useId, type InputHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Input (§2.5) — text / email / tel / password.
 * Estados: default / focus / error / disabled / con texto de ayuda.
 *
 * Reglas:
 * - Label SIEMPRE visible (nunca placeholder-como-label).
 * - Error → aria-invalid + mensaje asociado por aria-describedby.
 * - Ayuda → asociada por aria-describedby.
 * - Target ≥44px (min-h-11), radius-sm (§2.3), tipografía body 16px
 *   (también evita el zoom automático de iOS).
 */

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "children"
> & {
  /** Label visible, obligatorio. */
  label: string;
  /**
   * `date` se añade al inventario de §2.5 por la Bóveda: la fecha de
   * vencimiento de un permiso de trabajo se teclea mal con demasiada
   * facilidad, y el selector nativo abre la rueda del sistema operativo, que
   * en un móvil es mucho más fiable que escribir día, mes y año a mano.
   */
  type?: "text" | "email" | "tel" | "password" | "date";
  /** Mensaje de error: qué pasó y cómo resolverlo (§2.7). */
  error?: string;
  /** Texto de ayuda bajo el campo. */
  help?: string;
  /** Clases del contenedor externo. */
  className?: string;
  /** Clases del <input> en sí. */
  inputClassName?: string;
};

export function Input({
  label,
  type = "text",
  error,
  help,
  className,
  inputClassName,
  id: idProp,
  disabled,
  ...rest
}: InputProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const describedBy =
    [error ? errorId : null, help ? helpId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={cn("w-full", className)}>
      <label
        htmlFor={id}
        className={cn(
          // La ETIQUETA nunca baja de contraste, ni con el campo
          // deshabilitado: describe un dato que la persona sí tiene que
          // poder leer —su propio correo, por ejemplo—. `text-disabled`
          // (#8A9BAD) da 2,85:1 sobre blanco y reprueba AA. Es el mismo
          // fallo que ya se corrigió en el placeholder unas líneas abajo,
          // y aquí se había quedado. Lo destapó una auditoría de /perfil.
          "mb-1.5 block text-label font-medium",
          disabled ? "text-muted" : "text-ink",
        )}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "block w-full min-h-11 rounded-sm border bg-surface px-3.5 text-body text-ink",
          // §2.1.1 / §9 — el placeholder es TEXTO que el usuario tiene que
          // leer, así que le aplica el piso AA. `text-disabled` (#8A9BAD) da
          // 2.85:1 sobre blanco y reprueba; `text-muted` da 5.18:1 en claro y
          // 6.85:1 en oscuro. `disabled:text-disabled` se queda como está: los
          // controles inhabilitados sí están exentos de 1.4.3.
          "placeholder:text-muted",
          "transition-colors duration-150",
          error
            ? "border-danger focus:border-danger"
            : "border-line hover:border-muted focus:border-teal-deep",
          "disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-disabled",
          inputClassName,
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="mt-1.5 flex items-start gap-1 text-caption text-danger">
          <CircleAlert aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
      {help ? (
        <p id={helpId} className="mt-1.5 text-caption text-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}
