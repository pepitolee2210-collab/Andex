"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { FREE_TEXT_MAX } from "./draft-utils";

/**
 * Campo de texto libre del patrón "Otro" (§3.2.1) y del objetivo propio
 * del paso 5.
 *
 * Reglas que implementa:
 * - Se revela DEBAJO de la opción, sin cambiar de pantalla (regla 1: lo
 *   garantiza el consumidor al renderizarlo en el mismo paso).
 * - Máximo 120 caracteres, con contador visible y anunciado (regla 3).
 * - Dejarlo en blanco es válido (regla 4): nunca bloquea, nunca marca error.
 * - El saneado ocurre al persistir (regla 5, `sanitizeFreeText`); mientras
 *   se escribe no se toca lo que el usuario teclea.
 */

const NEAR_LIMIT = 20;

export type FreeTextFieldProps = {
  label: string;
  placeholder?: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  /** `${used} de ${max} caracteres` */
  counter: (used: number, max: number) => string;
  /** `Te quedan ${left} caracteres` — cerca del tope. */
  counterNearLimit: (left: number) => string;
  max?: number;
  autoFocus?: boolean;
};

export function FreeTextField({
  label,
  placeholder,
  help,
  value,
  onChange,
  counter,
  counterNearLimit,
  max = FREE_TEXT_MAX,
  autoFocus,
}: FreeTextFieldProps) {
  const autoId = useId();
  const id = `${autoId}-free`;
  const counterId = `${id}-counter`;
  const used = value.length;
  const left = max - used;

  return (
    <div className="mt-3">
      <Input
        id={id}
        label={label}
        placeholder={placeholder}
        help={help}
        value={value}
        maxLength={max}
        autoComplete="off"
        // eslint-disable-next-line jsx-a11y/no-autofocus -- el campo aparece
        // como consecuencia directa de elegir "Otro"; el foco sigue a la acción.
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={help ? `${id}-help ${counterId}` : counterId}
      />
      <p
        id={counterId}
        aria-live="polite"
        className="mt-1.5 text-caption text-muted"
      >
        {left <= NEAR_LIMIT ? counterNearLimit(left) : counter(used, max)}
      </p>
    </div>
  );
}
