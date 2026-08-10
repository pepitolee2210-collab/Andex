"use client";

/**
 * CTA de la landing instrumentado con `landing_cta_clicked` (§7.5).
 *
 * `cta_position` identifica cada punto de conversión de la página:
 * 'header' · 'hero' · 'modules' · 'footer'. Es lo único que este
 * componente añade sobre `<Button href>`; el resto lo hace el kit.
 */

import type { ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { trackLazy } from "./track-lazy";

/**
 * Punto de la página desde el que se pulsó (§7.5 `landing_cta_clicked`).
 * Saber cuál convierte decide qué sección se rehace y cuál se recorta.
 */
export type CtaPosition =
  | "banner"
  | "header"
  | "hero"
  | "modules"
  // El CTA que aparece tras probar el escáner: mide si demostrar el
  // producto convierte mejor que describirlo.
  | "scanner"
  | "services"
  | "pricing_monthly"
  | "pricing_annual"
  | "footer";

export type CtaLinkProps = {
  position: CtaPosition;
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** id de un texto que describe el destino (puede ser sr-only). */
  describedBy?: string;
  className?: string;
};

export function CtaLink({
  position,
  href,
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  describedBy,
  className,
}: CtaLinkProps) {
  return (
    <Button
      href={href}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={className}
      aria-describedby={describedBy}
      onClick={() => trackLazy("landing_cta_clicked", { cta_position: position })}
    >
      {children}
    </Button>
  );
}
