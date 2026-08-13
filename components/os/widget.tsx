"use client";

/**
 * WIDGETS DEL INICIO — las tres piezas del prototipo, con sus medidas.
 *
 * Nada de esto es una elección: sale de medir `andex-inicio.html` elemento
 * a elemento (`scratchpad/anatomia.mjs`). Las tres formas son diseños
 * distintos, no un mismo bloque escalado:
 *
 *   grande   350×159 · cabecera + número de 28px + chip + dos filas
 *   pequeño  ~165×150 · cabecera + frase de dos líneas + botón
 *   mediano  ancho completo · cabecera + número + descripción
 *
 * El widget dice ESTADO. Por eso el grande lleva el número y las dos
 * últimas filas: la pregunta "¿cómo voy?" se contesta sin entrar.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, FileText, Lock } from "lucide-react";
import { app, type AppSlug } from "@/lib/os/apps";
import type { WidgetSize } from "@/lib/os/home";
import { cn } from "@/lib/utils";

export type WidgetContent = {
  title: string;
  /** El número grande. Sólo en mediano y grande. */
  figure?: string;
  /** La frase que acompaña. */
  body: string;
  /** Hasta dos filas de archivo, sólo en grande. */
  rows?: { text: string; meta?: string }[];
  /** Chip verde tipo "Cifrado". */
  badge?: string;
  /** Botón del widget pequeño. */
  action?: string;
  actionIcon?: ReactNode;
};

export type OsWidgetProps = {
  slug: AppSlug;
  size: WidgetSize;
  icon: ReactNode;
  content: WidgetContent;
  editing: boolean;
  removeLabel: string;
  onRemove: () => void;
  onOpen: () => void;
};

export function OsWidget({
  slug, size, icon, content, editing, removeLabel, onRemove, onOpen,
}: OsWidgetProps) {
  const meta = app(slug);
  const acento = `var(${meta?.accent ?? "--acc-ajustes"})`;
  const pequeno = size === "pequeno";

  /* Cabecera: icono de 15px con el acento, título, y el chevron pegado al
     borde derecho. Idéntica en los tres tamaños. */
  const cabecera = (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="flex size-[15px] shrink-0 items-center justify-center" style={{ color: acento }}>
        {icon}
      </span>
      <span className="min-w-0 truncate text-[13px] font-extrabold" style={{ color: "var(--os-ink)" }}>
        {content.title}
      </span>
      <ChevronRight aria-hidden="true" className="ml-auto size-[15px] shrink-0" style={{ color: "var(--os-faint)" }} />
    </div>
  );

  const interior = pequeno ? (
    <>
      {cabecera}
      {/* 48px de alto: dos líneas exactas. Con tres, el botón se sale. */}
      <p className="mt-3 line-clamp-3 text-[13px] leading-[1.35]" style={{ color: "var(--os-ink)" }}>
        {content.body}
      </p>
      {content.action ? (
        <span
          className="mt-auto inline-flex h-[33px] items-center justify-center gap-1.5 rounded-[12px] px-3 text-[12px] font-bold"
          style={{ background: "var(--os-chip)", color: acento }}
        >
          {content.actionIcon}
          {content.action}
        </span>
      ) : null}
    </>
  ) : (
    <>
      {cabecera}
      <div className="mt-3.5 flex items-start gap-3">
        {content.figure ? (
          <span className="text-[28px] font-extrabold leading-none" style={{ letterSpacing: "-1px" }}>
            {content.figure}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 text-[11px] font-medium leading-[1.3]" style={{ color: "var(--os-muted)" }}>
          {content.body}
        </span>
        {content.badge ? (
          <span
            className="inline-flex h-[25px] shrink-0 items-center gap-1 rounded-full px-2.5 text-[10.5px] font-bold"
            style={{ background: "rgb(52 211 153 / 0.15)", color: "var(--acc-boveda)" }}
          >
            <Lock aria-hidden="true" className="size-[11px]" />
            {content.badge}
          </span>
        ) : null}
      </div>

      {content.rows && content.rows.length > 0 ? (
        <ul className="mt-4 space-y-[11px]">
          {content.rows.slice(0, 2).map((fila) => (
            <li key={fila.text} className="flex items-center gap-2">
              <FileText aria-hidden="true" className="size-[15px] shrink-0" style={{ color: "var(--os-muted)" }} />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{fila.text}</span>
              {fila.meta ? (
                <span className="shrink-0 text-[11px] font-medium" style={{ color: "var(--os-muted)" }}>
                  {fila.meta}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );

  const clase = cn(
    "k-glass k-press flex w-full flex-col p-4 text-left",
    pequeno ? "min-h-[150px]" : "min-h-[159px]",
  );

  return (
    <div className={cn("relative", pequeno ? "col-span-1" : "col-span-2")}>
      {editing ? (
        <>
          <div className={clase}>{interior}</div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="absolute -left-2 -top-2 flex size-11 items-center justify-center"
          >
            <span
              className="flex size-6 items-center justify-center rounded-full text-[1rem] font-bold leading-none shadow-lg"
              style={{ background: "var(--os-ink)", color: "var(--os-void)" }}
            >
              −
            </span>
          </button>
        </>
      ) : meta?.href ? (
        <Link href={meta.href} className={clase}>{interior}</Link>
      ) : (
        <button type="button" onClick={onOpen} className={clase}>{interior}</button>
      )}
    </div>
  );
}
