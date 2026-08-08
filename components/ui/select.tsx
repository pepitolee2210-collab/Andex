import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { ChevronDown, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Select nativo estilizado (§2.5, variante "select" de Input).
 * Mismos estados y contrato de accesibilidad que Input: label visible,
 * error con aria-invalid + aria-describedby, ayuda, disabled.
 *
 * Para listas largas con búsqueda (estados / países, Anexo C.1) NO usar
 * este componente: usar <Combobox>. Este es para listas cortas.
 */

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  /** Label visible, obligatorio. */
  label: string;
  error?: string;
  help?: string;
  className?: string;
  selectClassName?: string;
  /** <option> nativos. */
  children: ReactNode;
};

export function Select({
  label,
  error,
  help,
  className,
  selectClassName,
  id: idProp,
  disabled,
  children,
  ...rest
}: SelectProps) {
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
          "mb-1.5 block text-label font-medium",
          disabled ? "text-disabled" : "text-ink",
        )}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "block w-full min-h-11 appearance-none rounded-sm border bg-surface py-2 pl-3.5 pr-10 text-body text-ink",
            "transition-colors duration-150",
            error
              ? "border-danger focus:border-danger"
              : "border-line hover:border-muted focus:border-teal-deep",
            "disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-disabled",
            selectClassName,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 size-4.5 -translate-y-1/2",
            disabled ? "text-disabled" : "text-muted",
          )}
        />
      </div>
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
