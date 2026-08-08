"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Star, X } from "lucide-react";
import type { ModuleSlug } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleIcon } from "@/components/module-icon";

/**
 * ModuleCard (§4.4 anatomía de la hero card, §4.5 estados).
 *
 * Variantes: hero (radius-xl) · grid (radius-lg) · list.
 * Estados:   recommended · available · coming-soon · loading.
 *
 * | Estado       | Apariencia                          |
 * |--------------|-------------------------------------|
 * | recommended  | Borde teal, badge ámbar, tamaño hero |
 * | available    | Tarjeta estándar, icono a color      |
 * | coming-soon  | Icono en gris, badge "Pronto"        |
 * | loading      | Skeleton                             |
 *
 * TODO el copy llega por props (el componente no importa lib/i18n).
 * Los defaults en español son la red de seguridad, no la fuente.
 *
 * Color: `accentColor` (hex del seed §7.4) se usa SOLO como superficie
 * suave detrás del icono, nunca como color de texto ni de fondo pleno
 * (§2.1.1). El icono va en text-ink; en coming-soon, en text-disabled.
 */

export type ModuleCardVariant = "hero" | "grid" | "list";
export type ModuleCardState =
  | "recommended"
  | "available"
  | "coming-soon"
  | "loading";

export type ModuleCardProps = {
  slug: ModuleSlug;
  /** Título del módulo, ya resuelto por idioma y contentVariant (§4.2.1). */
  title: string;
  variant?: ModuleCardVariant;
  state?: ModuleCardState;
  /** Hex del seed §7.4 — solo superficie tras el icono. */
  accentColor?: string;
  /** §4.4 — "Porque dijiste que…". Se muestra en la hero card. */
  reason?: string;
  /** Descripción corta para grid / list. */
  description?: string;
  /** Enlace del módulo (ROUTES.modulo(slug)). Si falta, se usa onOpen. */
  href?: string;
  onOpen?: () => void;
  /** §4.4 — "No es lo que busco": mecanismo de corrección del usuario. */
  onDismiss?: () => void;
  // ── Copy (por props) ──
  recommendedLabel?: string;
  comingSoonLabel?: string;
  openLabel?: string;
  dismissLabel?: string;
  /** aria-label de la ✕ de la esquina de la hero card. */
  dismissIconLabel?: string;
  className?: string;
};

function accentSurface(accentColor?: string): CSSProperties | undefined {
  if (!accentColor) return undefined;
  // Tinte suave del acento del módulo: superficie, nunca texto.
  return {
    backgroundColor: `color-mix(in srgb, ${accentColor} 14%, transparent)`,
  };
}

function IconTile({
  slug,
  accentColor,
  muted,
  size,
}: {
  slug: ModuleSlug;
  accentColor?: string;
  muted: boolean;
  size: "sm" | "lg";
}) {
  return (
    <span
      style={muted ? undefined : accentSurface(accentColor)}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md",
        size === "lg" ? "size-12" : "size-11",
        muted ? "bg-surface-alt text-disabled" : "text-ink",
      )}
    >
      <ModuleIcon slug={slug} size={size === "lg" ? 26 : 22} />
    </span>
  );
}

export function ModuleCard({
  slug,
  title,
  variant = "grid",
  state = "available",
  accentColor,
  reason,
  description,
  href,
  onOpen,
  onDismiss,
  recommendedLabel = "Recomendado para ti",
  comingSoonLabel = "Pronto",
  openLabel = "Empezar aquí",
  dismissLabel = "No es lo que busco",
  dismissIconLabel = "Descartar recomendación",
  className,
}: ModuleCardProps) {
  const isHero = variant === "hero";
  const comingSoon = state === "coming-soon";
  const recommended = state === "recommended";

  // ── loading ──────────────────────────────────────────────
  if (state === "loading") {
    return (
      <Skeleton
        variant="card"
        className={cn(isHero ? "rounded-xl p-6" : "rounded-lg", className)}
      />
    );
  }

  const shell = cn(
    "group relative block w-full bg-surface text-left transition-shadow duration-150",
    "border shadow-sm hover:shadow-md",
    recommended ? "border-teal-deep" : "border-line",
    isHero ? "rounded-xl p-6" : "rounded-lg p-4",
    className,
  );

  // ── hero (§4.4) ──────────────────────────────────────────
  // La hero card lleva botones propios (Empezar / No es lo que busco),
  // así que NO se envuelve en un control: anidar botones rompe el
  // teclado. Los dos botones son la superficie accionable.
  if (isHero) {
    return (
      <article className={shell}>
        <div className="flex items-start justify-between gap-3">
          <Badge variant="amber">
            <Star aria-hidden="true" className="size-3.5" />
            {recommendedLabel}
          </Badge>
          {onDismiss ? (
            <button
              type="button"
              aria-label={dismissIconLabel}
              onClick={onDismiss}
              className="-mr-2 -mt-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <X aria-hidden="true" className="size-4.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <IconTile
            slug={slug}
            accentColor={accentColor}
            muted={comingSoon}
            size="lg"
          />
          <h2 className="font-heading text-h2 text-ink">{title}</h2>
          {comingSoon ? <Badge variant="neutral">{comingSoonLabel}</Badge> : null}
        </div>

        {reason ? (
          <p className="mt-3 text-body text-muted">{reason}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="primary" href={href} onClick={onOpen}>
            {openLabel}
          </Button>
          {onDismiss ? (
            <Button variant="ghost" onClick={onDismiss}>
              {dismissLabel}
            </Button>
          ) : null}
        </div>
      </article>
    );
  }

  // ── grid / list ──────────────────────────────────────────
  // Tarjeta entera accionable (§4.5: "se puede tocar, abre una pantalla
  // real"). Foco visible por la regla global :focus-visible.
  const body: ReactNode =
    variant === "list" ? (
      <div className="flex items-center gap-3">
        <IconTile
          slug={slug}
          accentColor={accentColor}
          muted={comingSoon}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-h3 text-ink">{title}</h3>
            {recommended ? (
              <Badge variant="amber">{recommendedLabel}</Badge>
            ) : null}
            {comingSoon ? <Badge variant="neutral">{comingSoonLabel}</Badge> : null}
          </div>
          {description ? (
            <p className="mt-0.5 line-clamp-2 text-body text-muted">{description}</p>
          ) : null}
        </div>
        <ChevronRight
          aria-hidden="true"
          className="size-5 shrink-0 text-muted transition-transform duration-150 group-hover:translate-x-0.5"
        />
      </div>
    ) : (
      <>
        <div className="mb-3 flex items-start justify-between gap-2">
          <IconTile
            slug={slug}
            accentColor={accentColor}
            muted={comingSoon}
            size="sm"
          />
          {recommended ? <Badge variant="amber">{recommendedLabel}</Badge> : null}
          {comingSoon ? <Badge variant="neutral">{comingSoonLabel}</Badge> : null}
        </div>
        <h3 className="font-heading text-h3 text-ink">{title}</h3>
        {description ? (
          <p className="mt-1 line-clamp-3 text-body text-muted">{description}</p>
        ) : null}
      </>
    );

  if (href) {
    return (
      <Link href={href} onClick={onOpen} className={cn(shell, "min-h-11")}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onOpen} className={cn(shell, "min-h-11")}>
      {body}
    </button>
  );
}
