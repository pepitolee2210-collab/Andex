"use client";

/**
 * LAS PIEZAS DE UNA PANTALLA DEL SISTEMA.
 *
 * El prototipo repite el mismo patrón en Bóveda, Escáner, Asistente,
 * X Legal, Notificaciones, Store y Ajustes. Medido de sus exports
 * (`scratchpad/anat2.mjs`), siempre lo mismo:
 *
 *   cabecera   botón redondo de 40 · título 20/800 · subtítulo 11.5/500
 *              al 54% · acción redonda de 40 a la derecha
 *   banner     80 de alto · baldosa de 40 · título 13.5/800 · cuerpo
 *              11.5/500 al 78%
 *   chips      31 de alto · activo blanco 100% en peso 700 · resto 54%
 *              en peso 500
 *   fila       64 de alto · baldosa de 38 · título 13.5/700 · meta
 *              11/500 al 54% · chevron de 17
 *
 * Por eso viven aquí y no dentro de la Bóveda: son de las siete pantallas.
 *
 * Lo que estas piezas NO hacen: nada de lógica. No leen datos, no guardan,
 * no deciden. Reciben lo que hay que pintar y lo pintan. Así se pueden
 * meter en una pantalla que ya funciona sin poner en riesgo lo que hace.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Botón redondo de 40px ──
   Se DIBUJA de 40 como el prototipo, pero el área pulsable es de 44: el
   `padding` negativo del contenedor no mueve nada de sitio y el pulgar
   acierta. Es la única licencia, y es la misma que ya se tomó con "Editar". */
function BotonRedondo({
  label, onClick, href, children,
}: { label: string; onClick?: () => void; href?: string; children: ReactNode }) {
  const clase =
    "k-press flex size-11 shrink-0 items-center justify-center rounded-full";
  const cuerpo = (
    <span
      className="flex size-10 items-center justify-center rounded-full"
      style={{ background: "var(--os-chip)", color: "var(--os-ink)" }}
    >
      {children}
    </span>
  );
  return href ? (
    <Link href={href} aria-label={label} className={clase}>{cuerpo}</Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={clase}>{cuerpo}</button>
  );
}

export type OsHeaderProps = {
  title: string;
  subtitle?: string;
  /** A dónde vuelve el botón de atrás. Sin esto, no se dibuja. */
  backHref?: string;
  backLabel?: string;
  /** El botón de la derecha: buscar, historial, información… */
  action?: { label: string; icon: ReactNode; onClick?: () => void; href?: string };
  className?: string;
};

export function OsHeader({
  title, subtitle, backHref, backLabel, action, className,
}: OsHeaderProps) {
  return (
    <header className={cn("flex items-center gap-3 px-5", className)}>
      {backHref && backLabel ? (
        <BotonRedondo label={backLabel} href={backHref}>
          <ChevronLeft aria-hidden="true" className="size-[19px]" strokeWidth={2.5} />
        </BotonRedondo>
      ) : null}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[20px] font-extrabold leading-tight" style={{ letterSpacing: "-0.4px" }}>
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11.5px] font-medium" style={{ color: "var(--os-muted)" }}>
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? (
        <BotonRedondo label={action.label} onClick={action.onClick} href={action.href}>
          {action.icon}
        </BotonRedondo>
      ) : null}
    </header>
  );
}

/* ── Banner ──
   El del prototipo dice "Todo está cifrado". Aquí es genérico porque la
   misma forma sirve para el aviso de seguridad, el de "no es asesoría
   legal" y el de la clase en vivo. */
export type OsBannerProps = {
  icon: ReactNode;
  title: string;
  body: string;
  /** Nombre de la variable CSS del acento, sin `var()`. */
  accent?: string;
  className?: string;
};

export function OsBanner({ icon, title, body, accent = "--acc-boveda", className }: OsBannerProps) {
  return (
    <div className={cn("k-glass flex items-start gap-3 p-3.5", className)}>
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-[13px]"
        style={{
          color: `var(${accent})`,
          background: `color-mix(in srgb, var(${accent}) 15%, transparent)`,
        }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-extrabold">{title}</p>
        <p className="mt-1 text-[11.5px] font-medium leading-[1.4]" style={{ color: "var(--os-label)" }}>
          {body}
        </p>
      </div>
    </div>
  );
}

/* ── Chips de filtro ──
   Se deslizan en horizontal: en el prototipo el cuarto queda cortado a
   propósito, que es lo que avisa de que hay más. */
export type OsChipsProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** Nombre accesible del grupo. */
  label: string;
  className?: string;
};

export function OsChips<T extends string>({
  options, value, onChange, label, className,
}: OsChipsProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "flex gap-2 overflow-x-auto overscroll-x-contain px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {options.map((o) => {
        const activo = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(o.value)}
            /* Se ve de 31px de alto; se toca en 44. */
            className="k-press flex h-11 shrink-0 items-center"
          >
            <span
              className="flex h-[31px] items-center rounded-full px-3.5 text-[11.5px] transition-colors"
              style={{
                background: activo ? "var(--os-chip)" : "transparent",
                color: activo ? "var(--os-ink)" : "var(--os-muted)",
                fontWeight: activo ? 700 : 500,
                backdropFilter: activo ? "blur(8px)" : undefined,
              }}
            >
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Fila ──
   64px con baldosa de 38. Es la fila de un documento, de un aviso, de un
   servicio de X Legal y de una app de la Store: la misma en las cuatro. */
export type OsRowProps = {
  icon: ReactNode;
  title: string;
  meta?: string;
  /** Nombre de la variable CSS del acento de la baldosa. */
  accent?: string;
  /** Texto a la derecha, en lugar del chevron. */
  trailing?: ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
};

export function OsRow({
  icon, title, meta, accent = "--acc-escaner", trailing, onClick, href, className,
}: OsRowProps) {
  const interior = (
    <>
      <span
        aria-hidden="true"
        className="flex size-[38px] shrink-0 items-center justify-center rounded-[12px]"
        style={{
          color: `var(${accent})`,
          background: `color-mix(in srgb, var(${accent}) 15%, transparent)`,
        }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-bold">{title}</span>
        {meta ? (
          <span className="mt-0.5 block truncate text-[11px] font-medium" style={{ color: "var(--os-muted)" }}>
            {meta}
          </span>
        ) : null}
      </span>
      {trailing ?? (
        <ChevronRight aria-hidden="true" className="size-[17px] shrink-0" style={{ color: "var(--os-faint)" }} />
      )}
    </>
  );

  const clase = cn("k-glass k-press flex min-h-16 w-full items-center gap-3 p-3 text-left", className);

  if (href) return <Link href={href} className={clase}>{interior}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={clase}>{interior}</button>;
  return <div className={clase}>{interior}</div>;
}
