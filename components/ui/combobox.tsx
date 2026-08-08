"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Combobox con búsqueda (Anexo C.1: obligatorio para estados/países —
 * "componente de búsqueda con teclado, no un <select> nativo de 52
 * entradas. En mobile, buscar escribiendo es más rápido que hacer
 * scroll").
 *
 * Patrón WAI-ARIA combobox + listbox:
 * - input role="combobox" con aria-expanded / aria-controls /
 *   aria-activedescendant (el foco DOM nunca sale del input).
 * - Flechas mueven la opción activa, Enter selecciona, Escape cierra y
 *   restaura, Tab cierra. La opción activa se mantiene visible con
 *   scrollIntoView({ block: "nearest" }).
 * - Grupos con encabezado y separador (bloques "Piloto" / "Acceso
 *   rápido" / "Todos" del Anexo C.1); los encabezados llegan por props.
 * - Búsqueda insensible a acentos ("mexico" encuentra "México").
 * - Targets ≥44px en input y opciones (mobile-first).
 */

export type ComboboxItem = {
  value: string;
  label: string;
  /** Clave de grupo; el encabezado visible viene de groupLabels. */
  group?: string;
};

export type ComboboxProps = {
  items: ComboboxItem[];
  value: string | null;
  onChange: (value: string) => void;
  /** Label visible del campo (mismo contrato que Input). */
  label: string;
  placeholder?: string;
  /**
   * Encabezado visible por clave de grupo, p. ej.
   * { piloto: "Piloto", rapido: "Acceso rápido", todos: "Todos" }.
   * El orden de los grupos es el de su primera aparición en items.
   */
  groupLabels?: Record<string, string>;
  /** Mensaje cuando no hay coincidencias. Default: "Sin resultados". */
  emptyText?: string;
  error?: string;
  help?: string;
  disabled?: boolean;
  /** Nombre de campo para formularios (input hidden con el value). */
  name?: string;
  id?: string;
  className?: string;
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function Combobox({
  items,
  value,
  onChange,
  label,
  placeholder,
  groupLabels = {},
  emptyText = "Sin resultados",
  error,
  help,
  disabled,
  name,
  id: idProp,
  className,
}: ComboboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listboxId = `${id}-listbox`;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  const selected = useMemo(
    () => items.find((it) => it.value === value) ?? null,
    [items, value],
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Si el value cambia desde fuera (o al cerrar), el texto refleja la selección.
  useEffect(() => {
    if (!open) setQuery(selected?.label ?? "");
  }, [selected, open]);

  // Con el texto igual al label seleccionado se muestra la lista completa
  // (reabrir no debe filtrar por la selección previa).
  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q || (selected && normalize(selected.label) === q)) return items;
    return items.filter((it) => normalize(it.label).includes(q));
  }, [items, query, selected]);

  /** Lista plana en orden agrupado + índice de arranque de cada grupo. */
  const groupedFlat = useMemo(() => {
    const order: Array<string | undefined> = [];
    for (const it of filtered) {
      if (!order.includes(it.group)) order.push(it.group);
    }
    const flat: ComboboxItem[] = [];
    const groups: Array<{ key: string | undefined; start: number; count: number }> = [];
    for (const key of order) {
      const members = filtered.filter((it) => it.group === key);
      groups.push({ key, start: flat.length, count: members.length });
      flat.push(...members);
    }
    return { flat, groups };
  }, [filtered]);

  const optionId = (index: number) => `${id}-opt-${index}`;

  // La opción activa permanece visible al navegar con flechas.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document
      .getElementById(optionId(activeIndex))
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  function openList(startAtSelected = true) {
    setOpen(true);
    if (startAtSelected && selected) {
      const idx = groupedFlat.flat.findIndex((it) => it.value === selected.value);
      setActiveIndex(idx >= 0 ? idx : groupedFlat.flat.length > 0 ? 0 : -1);
    } else {
      setActiveIndex(groupedFlat.flat.length > 0 ? 0 : -1);
    }
  }

  function closeList(restoreText: boolean) {
    setOpen(false);
    setActiveIndex(-1);
    if (restoreText) setQuery(selected?.label ?? "");
  }

  function commit(item: ComboboxItem) {
    onChange(item.value);
    setQuery(item.label);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function move(delta: number) {
    const n = groupedFlat.flat.length;
    if (n === 0) return;
    setActiveIndex((prev) => {
      if (prev < 0) return delta > 0 ? 0 : n - 1;
      return (prev + delta + n) % n;
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openList();
        else move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openList();
        else move(-1);
        break;
      case "Enter":
        if (open && activeIndex >= 0 && groupedFlat.flat[activeIndex]) {
          e.preventDefault();
          commit(groupedFlat.flat[activeIndex]);
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          closeList(true);
        }
        break;
      case "Tab":
        if (open) closeList(true);
        break;
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (rootRef.current?.contains(e.relatedTarget as Node | null)) return;
    closeList(true);
  }

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

      <div ref={rootRef} className="relative" onBlur={handleBlur}>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            setActiveIndex(0);
          }}
          onClick={() => {
            if (!open && !disabled) openList();
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "block w-full min-h-11 rounded-sm border bg-surface py-2 pl-3.5 pr-11 text-body text-ink",
            // Piso AA del placeholder — ver la nota en components/ui/input.tsx.
            "placeholder:text-muted transition-colors duration-150",
            error
              ? "border-danger focus:border-danger"
              : "border-line hover:border-muted focus:border-teal-deep",
            "disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-disabled",
          )}
        />
        {/* Botón decorativo de apertura: el control accesible es el input. */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onClick={() => {
            if (open) closeList(true);
            else {
              openList();
              inputRef.current?.focus();
            }
          }}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted disabled:text-disabled"
        >
          <ChevronDown
            className={cn(
              "size-4.5 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </button>

        {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label={label}
            // preventDefault: el clic en opciones no debe robar el foco al input
            onMouseDown={(e) => e.preventDefault()}
            className="absolute top-full z-20 mt-1 max-h-72 w-full overflow-y-auto overscroll-contain rounded-sm border border-line bg-surface py-1 shadow-md"
          >
            {groupedFlat.flat.length === 0 ? (
              <div className="px-3.5 py-3 text-body text-muted">{emptyText}</div>
            ) : (
              groupedFlat.groups.map((g, gi) => {
                const heading =
                  g.key !== undefined ? groupLabels[g.key] ?? g.key : null;
                return (
                  <div
                    key={g.key ?? "__none__"}
                    role="group"
                    // El encabezado visible va aria-hidden y su texto viaja por
                    // aria-label: dentro de un listbox, los nodos que no son
                    // option confunden a los lectores de pantalla.
                    aria-label={heading ?? undefined}
                    className={cn(gi > 0 && "mt-1 border-t border-line pt-1")}
                  >
                    {heading ? (
                      <div
                        aria-hidden="true"
                        className="px-3.5 pb-1 pt-2 text-caption font-semibold uppercase tracking-wide text-muted"
                      >
                        {heading}
                      </div>
                    ) : null}
                    {groupedFlat.flat
                      .slice(g.start, g.start + g.count)
                      .map((item, li) => {
                        const flatIndex = g.start + li;
                        const isActive = flatIndex === activeIndex;
                        const isSelected = item.value === value;
                        return (
                          <div
                            key={item.value}
                            id={optionId(flatIndex)}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => commit(item)}
                            onMouseMove={() => {
                              if (!isActive) setActiveIndex(flatIndex);
                            }}
                            className={cn(
                              "flex min-h-11 cursor-pointer items-center gap-2 px-3.5 py-2 text-body text-ink",
                              isActive && "bg-teal-soft",
                              isSelected && "font-medium",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {item.label}
                            </span>
                            {isSelected ? (
                              <Check
                                aria-hidden="true"
                                className="size-4 shrink-0 text-teal-deep"
                              />
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                );
              })
            )}
          </div>
        ) : null}
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
