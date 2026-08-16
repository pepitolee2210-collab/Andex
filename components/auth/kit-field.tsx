"use client";

/**
 * CAMPO DEL SISTEMA DE DISEÑO.
 *
 * En el diseño un campo es una fila dentro de una lista agrupada: rótulo en
 * versalitas, valor a 17px y —cuando hace falta— una nota debajo que dice
 * para qué sirve el dato. El aviso va al lado del dato, no al final de la
 * pantalla: es lo que manda en la pantalla de Registro.
 *
 * Las clases (`.ax-field`, `.fieldlbl`, `.fieldbox`, `.fieldhint`) ya viven
 * en `app/kit.css`; aquí sólo se ensamblan. Lo único que se añade es el
 * reinicio del `<input>`, porque el diseño lo dibuja como un `<span>` y un
 * control real trae fondo, borde y tipografía propios del navegador.
 *
 * Vive en `components/auth/` porque el Registro fue quien lo necesitó
 * primero; la Entrevista lo importa desde aquí. Su sitio natural sería
 * `components/ui`, y ahí debería mudarse cuando esa carpeta se toque.
 */

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * El control desnudo: hereda del campo y no dibuja caja propia.
 *
 * Deliberadamente SIN anchura: quien lo monta pone `w-full` o la que toque.
 * Con `w-full` aquí dentro, un selector estrecho al lado de un campo ancho
 * —el código de país junto al teléfono— se comía la fila entera, porque dos
 * utilidades de anchura compiten por orden en la hoja, no por orden en la
 * cadena de clases.
 */
export const KIT_INPUT_CLASS = cn(
  "fieldbox border-0 bg-transparent p-0 [font-family:inherit]",
  "placeholder:text-disabled",
  "focus:outline-2 focus:outline-offset-4 focus:outline-[color:var(--focus-ring)]",
);

export type KitFieldProps = {
  id: string;
  label: string;
  /** Para qué sirve el dato. Se sustituye por el error cuando lo hay. */
  hint?: string;
  error?: string;
  /** Control a la derecha del valor: mostrar u ocultar la contraseña. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function KitField({
  id,
  label,
  hint,
  error,
  action,
  children,
  className,
}: KitFieldProps) {
  const hintId = `${id}-hint`;
  return (
    <div className={cn("ax-field", className)}>
      <label htmlFor={id} className="fieldlbl">
        {label}
      </label>

      {action ? (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">{children}</div>
          {action}
        </div>
      ) : (
        children
      )}

      {error ? (
        <p id={hintId} role="alert" className="fieldhint text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="fieldhint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Props comunes del control para que quien lo monta no repita el cableado. */
export function kitInputProps(
  id: string,
  hasHint: boolean,
  hasError: boolean,
): Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className" | "aria-describedby" | "aria-invalid"
> {
  return {
    id,
    className: KIT_INPUT_CLASS,
    "aria-describedby": hasHint || hasError ? `${id}-hint` : undefined,
    "aria-invalid": hasError ? true : undefined,
  };
}
