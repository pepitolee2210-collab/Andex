"use client";

import { useId, useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OptionChips — chips de opción única o múltiple (todo el wizard §3.2
 * los usa: tiempo en EE. UU., plan de viaje, situación, intereses…).
 *
 * Accesibilidad:
 * - Única  → role="radiogroup" + role="radio", roving tabindex, flechas
 *   mueven y seleccionan (patrón WAI-ARIA de radio group).
 * - Múltiple → role="group" + role="checkbox", Tab entre chips, las
 *   flechas mueven el foco sin seleccionar, Espacio/Enter alternan.
 * - Estado seleccionado: borde teal-deep + fondo teal-soft + texto ink
 *   (§2.1.1: el texto nunca pisa teal puro).
 * - Targets ≥44px (min-h-11), radius-sm (§2.3, chips).
 */

export type ChipOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type BaseProps = {
  /** Etiqueta visible del grupo (obligatoria para AT). */
  label: string;
  /** Oculta visualmente la etiqueta pero la deja para lectores. */
  hideLabel?: boolean;
  options: ChipOption[];
  className?: string;
};

export type OptionChipsSingleProps = BaseProps & {
  multiple?: false;
  value: string | null;
  onChange: (value: string) => void;
};

export type OptionChipsMultipleProps = BaseProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

export type OptionChipsProps = OptionChipsSingleProps | OptionChipsMultipleProps;

export function OptionChips(props: OptionChipsProps) {
  const { label, hideLabel, options, className } = props;
  const labelId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const isSelected = (value: string) =>
    props.multiple ? props.value.includes(value) : props.value === value;

  function select(value: string) {
    if (props.multiple) {
      const set = new Set(props.value);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      // conserva el orden de options (§3.2: el orden de intereses importa)
      props.onChange(options.filter((o) => set.has(o.value)).map((o) => o.value));
    } else {
      props.onChange(value);
    }
  }

  function focusChip(index: number) {
    const enabled = options
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => !o.disabled);
    if (enabled.length === 0) return;
    const pos =
      ((index % enabled.length) + enabled.length) % enabled.length;
    const target = enabled[pos];
    refs.current[target.i]?.focus();
    // En radiogroup, mover el foco con flechas también selecciona.
    if (!props.multiple) select(target.o.value);
  }

  function handleKeyDown(e: React.KeyboardEvent, currentIndex: number) {
    const enabledIdx = options
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => !o.disabled)
      .findIndex(({ i }) => i === currentIndex);
    if (enabledIdx === -1) return;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusChip(enabledIdx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusChip(enabledIdx - 1);
        break;
      case "Home":
        e.preventDefault();
        focusChip(0);
        break;
      case "End":
        e.preventDefault();
        focusChip(-1);
        break;
    }
  }

  // Roving tabindex (solo opción única): tabulable el seleccionado o,
  // si no hay selección, el primer chip habilitado.
  const firstEnabled = options.findIndex((o) => !o.disabled);
  function chipTabIndex(opt: ChipOption, index: number): number {
    if (props.multiple) return 0;
    if (opt.disabled) return -1;
    if (props.value === null || !options.some((o) => o.value === props.value && !o.disabled)) {
      return index === firstEnabled ? 0 : -1;
    }
    return isSelected(opt.value) ? 0 : -1;
  }

  return (
    <div className={className}>
      <div
        id={labelId}
        className={cn(
          "mb-2 text-label font-medium text-ink",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </div>
      <div
        role={props.multiple ? "group" : "radiogroup"}
        aria-labelledby={labelId}
        className="chiplist"
      >
        {options.map((opt, i) => {
          const selected = isSelected(opt.value);
          return (
            <button
              key={opt.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role={props.multiple ? "checkbox" : "radio"}
              aria-checked={selected}
              disabled={opt.disabled}
              tabIndex={chipTabIndex(opt, i)}
              onClick={() => select(opt.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              /* La píldora del sistema de diseño. Antes era un rectángulo
                 con filete: dos formas distintas para el mismo gesto de
                 elegir, según la pantalla. `.ax-chip` es la del kit y ya
                 trae sus 44px, su sombra y su pulsación. */
              className={cn(
                "ax-chip",
                selected && "on",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              {selected ? (
                <Check aria-hidden="true" className="size-4 shrink-0" />
              ) : null}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
