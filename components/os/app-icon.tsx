"use client";

/**
 * UN ICONO DEL INICIO.
 *
 * El icono se anima al TOCARLO, no al pasar el ratón por encima — ver
 * `AnimatedIcon`. En modo edición deja de navegar y aparece el botón de
 * quitar, que es un objetivo táctil de 44px aunque se dibuje pequeño: el
 * área de toque y el círculo que se ve no tienen por qué medir lo mismo, y
 * un botón de 24px es imposible de acertar con el pulgar.
 */

import Link from "next/link";
import { Minus } from "lucide-react";
import { AnimatedIcon, type AnimatedIconComponent } from "@/components/motion/animated-icon";
import { app, type AppSlug } from "@/lib/os/apps";
import { cn } from "@/lib/utils";

export type AppIconProps = {
  slug: AppSlug;
  label: string;
  icon: AnimatedIconComponent;
  editing: boolean;
  removeLabel: string;
  onRemove: () => void;
  onOpen: () => void;
  className?: string;
};

export function AppIcon({
  slug, label, icon, editing, removeLabel, onRemove, onOpen, className,
}: AppIconProps) {
  const meta = app(slug);
  const acento = `var(${meta?.accent ?? "--os-muted"})`;

  const cuerpo = (
    <>
      <span
        className="flex size-[60px] items-center justify-center rounded-[19px] border"
        style={{
          color: acento,
          background: "var(--os-card-hi)",
          borderColor: "var(--os-edge)",
        }}
      >
        <AnimatedIcon icon={icon} size={27} trigger={editing ? "loop" : "tap"} every={2600} />
      </span>
      <span className="max-w-full truncate text-[0.75rem]" style={{ color: "var(--os-muted)" }}>
        {label}
      </span>
    </>
  );

  return (
    <div className={cn("relative flex flex-col items-center gap-1.5", className)}>
      {editing ? (
        <>
          {/* En edición no navega: tocarlo aquí movería a la persona fuera
              de la pantalla que está ordenando. */}
          <span className="k-press flex flex-col items-center gap-1.5">{cuerpo}</span>
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            /* Se dibuja de 24px, pero el área de toque es de 44. */
            className="absolute -left-2 -top-2 flex size-11 items-center justify-center"
          >
            <span
              className="flex size-6 items-center justify-center rounded-full shadow-lg"
              style={{ background: "var(--os-ink)", color: "var(--os-void)" }}
            >
              <Minus aria-hidden="true" className="size-4" strokeWidth={3} />
            </span>
          </button>
        </>
      ) : meta?.href ? (
        <Link href={meta.href} className="k-press flex flex-col items-center gap-1.5">
          {cuerpo}
        </Link>
      ) : (
        <button type="button" onClick={onOpen} className="k-press flex flex-col items-center gap-1.5">
          {cuerpo}
        </button>
      )}
    </div>
  );
}
