"use client";

/**
 * EL DOCK.
 *
 * Medido del prototipo: 152px de alto, esquinas de 28 sólo arriba, fondo
 * blanco al 6% con desenfoque de 17. Dentro, dos piezas:
 *
 *   1. la píldora del sitio en el que estás (67×23), con su punto;
 *   2. una fila DESLIZABLE de baldosas de 50px — en el prototipo son 7 y no
 *      caben en 390px, así que se desplaza en horizontal a propósito.
 *
 * Lo que aquí se añade sobre el original: `scroll-snap` en la fila y el
 * desplazamiento contenido (`overscroll-x-contain`), para que arrastrarla
 * no dispare el gesto de "atrás" del navegador. En un HTML exportado eso
 * no importa; en un producto real, sí.
 */

import Link from "next/link";
import { AnimatedIcon, type AnimatedIconComponent } from "@/components/motion/animated-icon";
import { app, type AppSlug } from "@/lib/os/apps";
import { cn } from "@/lib/utils";

export type DockProps = {
  apps: readonly AppSlug[];
  labels: Record<AppSlug, string>;
  iconos: Record<AppSlug, AnimatedIconComponent>;
  /** La app en la que se está, o `null` en el inicio. */
  activa: AppSlug | null;
  /** Texto de la píldora: el nombre de la pantalla actual. */
  sitio: string;
  onSoon: (slug: AppSlug) => void;
  className?: string;
};

export function Dock({ apps, labels, iconos, activa, sitio, onSoon, className }: DockProps) {
  return (
    <div className={cn("k-dock fixed inset-x-0 bottom-0 z-40 pb-2 pt-3", className)}>
      {/* La píldora del sitio. */}
      <div className="flex justify-center">
        <span
          className="inline-flex h-[23px] items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold"
          style={{ background: "var(--os-chip)", color: "var(--os-ink)" }}
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full"
            style={{ background: "var(--acc-escaner)" }}
          />
          {sitio}
        </span>
      </div>

      {/* La fila. Se desplaza: siete baldosas no caben en 390px. */}
      {/* `justify-around`, no un scroller alineado a la izquierda.
          Con las siete del prototipo la fila se desborda y llena el ancho
          sola; con cuatro se quedaba pegada a la izquierda y dejaba medio
          dock vacío — se veía roto, no minimalista. Repartidas, ocupan el
          ancho igual que en el original.
          Es seguro porque el dock son SIEMPRE cuatro: si algún día
          crecieran, `justify-around` dejaría la primera fuera de alcance al
          desbordar y habría que volver al scroller. */}
      <ul className="mt-3 flex items-start justify-around gap-2 px-4 pb-1">
        {apps.map((slug) => {
          const meta = app(slug);
          const acento = `var(${meta?.accent ?? "--acc-ajustes"})`;
          const esActiva = activa === slug;

          const cuerpo = (
            <>
              <span
                className="k-tile flex items-center justify-center"
                /* 50px, no 64: la baldosa del dock es más pequeña que la de
                   la rejilla. Son dos tamaños distintos en el original. */
                style={{
                  color: acento,
                  ["--acc"]: acento,
                  ["--os-tile-size"]: "50px",
                  ["--os-tile-radius"]: "16px",
                } as React.CSSProperties}
              >
                <AnimatedIcon icon={iconos[slug]} size={23} trigger="tap" />
              </span>
              <span
                className="w-[64px] truncate text-center text-[12px]"
                style={{
                  color: esActiva ? "var(--os-ink)" : "var(--os-label)",
                  fontWeight: esActiva ? 800 : 700,
                }}
              >
                {labels[slug]}
              </span>
            </>
          );

          return (
            <li key={slug} className="shrink-0 snap-start">
              {meta?.href ? (
                <Link
                  href={meta.href}
                  aria-current={esActiva ? "page" : undefined}
                  className="k-press flex w-[64px] flex-col items-center gap-1.5"
                >
                  {cuerpo}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onSoon(slug)}
                  className="k-press flex w-[64px] flex-col items-center gap-1.5"
                >
                  {cuerpo}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
