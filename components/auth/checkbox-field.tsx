"use client";

/**
 * Casilla de verificación con etiqueta rica (puede llevar énfasis dentro).
 * No existe en `components/ui` y no se puede tocar esa carpeta, así que vive
 * aquí, en la del agente de Auth.
 *
 * §3.4.6: **nunca premarcada**. El estado inicial lo decide quien la usa y
 * en este producto siempre es `false`.
 * §9: el área táctil es toda la etiqueta y mide ≥44 px de alto.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CheckboxFieldProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
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
          "flex min-h-11 items-start gap-3 py-1.5",
          disabled ? "cursor-not-allowed text-disabled" : "cursor-pointer",
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "mt-0.5 size-5 shrink-0 rounded-sm accent-teal-deep",
            error && "outline outline-2 outline-offset-2 outline-danger",
          )}
        />
        <span className="text-body text-ink">{children}</span>
      </label>
      {error ? (
        <p id={errorId} role="alert" className="ml-8 text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
