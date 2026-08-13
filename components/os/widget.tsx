"use client";

/**
 * UN WIDGET DEL INICIO.
 *
 * La idea que hace que esta pantalla valga la pena: un widget dice ESTADO,
 * no es un enlace con adornos. "12 documentos · el permiso vence en 40
 * días" resuelve la pregunta sin entrar a ningún sitio. Un enlace que
 * ponga "Bóveda" no resuelve nada que el icono no resolviera ya.
 *
 * De ahí sale el contrato: un widget sin datos NO se pinta a medias — dice
 * lo que sabe. Si la bóveda está vacía, lo dice; si no hay fecha en ningún
 * documento, lo dice, porque eso es justo lo que hay que corregir.
 *
 * Tres tamaños, y cada uno es un diseño distinto, no el mismo escalado:
 *   pequeño  media fila     título + una línea + acción
 *   mediano  fila completa  número grande + descripción
 *   grande   fila completa  número + estado + lista corta
 */

import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { app, type AppSlug } from "@/lib/os/apps";
import type { WidgetSize } from "@/lib/os/home";
import { cn } from "@/lib/utils";

/** Lo que un widget necesita saber para decir algo cierto. */
export type WidgetContent = {
  title: string;
  /** El dato grande. Sólo en mediano y grande. */
  figure?: string;
  /** La línea que explica el dato. */
  body: string;
  /** Hasta dos líneas más, sólo en grande. */
  rows?: { text: string; meta?: string }[];
  /** Insignia corta, tipo "Cifrado". */
  badge?: string;
  action?: string;
};

export type OsWidgetProps = {
  slug: AppSlug;
  size: WidgetSize;
  content: WidgetContent;
  editing: boolean;
  removeLabel: string;
  onRemove: () => void;
  onOpen: () => void;
};

export function OsWidget({
  slug, size, content, editing, removeLabel, onRemove, onOpen,
}: OsWidgetProps) {
  const meta = app(slug);
  const acento = `var(${meta?.accent ?? "--os-muted"})`;
  const grande = size === "grande";
  const pequeno = size === "pequeno";

  const interior = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <span className="text-[0.9375rem] font-semibold" style={{ color: acento }}>
          {content.title}
        </span>
        {content.badge ? (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.75rem]"
            style={{ background: "var(--os-card-hi)", color: "var(--os-muted)" }}
          >
            <Lock aria-hidden="true" className="size-3" />
            {content.badge}
          </span>
        ) : (
          <ChevronRight aria-hidden="true" className="ml-auto size-4" style={{ color: "var(--os-faint)" }} />
        )}
      </div>

      {content.figure && !pequeno ? (
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-[2rem] font-bold leading-none">{content.figure}</span>
          <span className="min-w-0 text-[0.875rem]" style={{ color: "var(--os-muted)" }}>
            {content.body}
          </span>
        </p>
      ) : (
        <p className="mt-1.5 text-[0.875rem]" style={{ color: "var(--os-muted)" }}>
          {content.body}
        </p>
      )}

      {grande && content.rows && content.rows.length > 0 ? (
        <ul
          className="mt-3 space-y-1.5 border-t pt-2.5"
          style={{ borderColor: "var(--os-edge)" }}
        >
          {content.rows.slice(0, 2).map((fila) => (
            <li key={fila.text} className="flex items-baseline gap-2 text-[0.875rem]">
              <span className="min-w-0 flex-1 truncate">{fila.text}</span>
              {fila.meta ? (
                <span className="shrink-0" style={{ color: "var(--os-muted)" }}>{fila.meta}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {pequeno && content.action ? (
        <span
          className="mt-auto inline-flex w-fit items-center rounded-full px-3 py-1.5 text-[0.8125rem] font-medium"
          style={{ background: "var(--os-card-hi)", color: acento }}
        >
          {content.action}
        </span>
      ) : null}
    </div>
  );

  const clase = cn(
    "k-glass k-press relative block p-3.5 text-left",
    pequeno ? "col-span-1 min-h-[124px]" : "col-span-2",
  );

  return (
    <div className={pequeno ? "col-span-1" : "col-span-2"}>
      <div className="relative">
        {editing ? (
          <>
            <div className={cn(clase, "w-full")}>{interior}</div>
            <button
              type="button"
              onClick={onRemove}
              aria-label={removeLabel}
              className="absolute -left-2 -top-2 flex size-11 items-center justify-center"
            >
              <span
                className="flex size-6 items-center justify-center rounded-full shadow-lg text-[1rem] font-bold leading-none"
                style={{ background: "var(--os-ink)", color: "var(--os-void)" }}
              >
                −
              </span>
            </button>
          </>
        ) : meta?.href ? (
          <Link href={meta.href} className={cn(clase, "w-full")}>{interior}</Link>
        ) : (
          <button type="button" onClick={onOpen} className={cn(clase, "w-full")}>{interior}</button>
        )}
      </div>
    </div>
  );
}
