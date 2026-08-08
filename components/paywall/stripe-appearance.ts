"use client";

import type { Appearance, StripeElementStyle } from "@stripe/stripe-js";

/**
 * Estilos de los iframes de Stripe Elements a partir de los TOKENS del sistema.
 *
 * Los campos de tarjeta viven dentro de un iframe de Stripe: no los alcanza
 * ninguna clase de Tailwind ni el CSS de la página. Stripe solo acepta valores
 * literales de color, así que hay que pasárselos.
 *
 * REGLA DEL BRIEF: cero hex fuera de `app/globals.css`. Por eso aquí no se
 * escribe ningún color: se LEEN las variables CSS ya definidas
 * (`--text`, `--text-disabled`, `--danger`, …). Consecuencias buenas:
 * el tema oscuro y cualquier reajuste de la paleta llegan solos, sin tocar
 * este archivo.
 *
 * Si una variable no se puede leer (SSR, CSS aún sin aplicar) se OMITE la
 * propiedad y Stripe usa su valor por defecto, en vez de inventar un color.
 */

function cssToken(name: string): string | undefined {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return undefined;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value.length > 0 ? value : undefined;
}

/** Familia tipográfica heredada del documento (la fija el layout, §2.2). */
function fontFamily(): string | undefined {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return undefined;
  }
  const value = getComputedStyle(document.body).fontFamily.trim();
  return value.length > 0 ? value : undefined;
}

/**
 * Estilo de CardNumber / CardExpiry / CardCvc. `fontSize` es 16px a propósito:
 * es el mínimo del sistema (§2.2.1) y además evita el zoom automático de iOS.
 */
export function elementBaseStyle(): StripeElementStyle {
  const ink = cssToken("--text");
  const disabled = cssToken("--text-disabled");
  const danger = cssToken("--danger");
  const family = fontFamily();

  return {
    base: {
      fontSize: "16px",
      ...(ink ? { color: ink } : {}),
      ...(family ? { fontFamily: family } : {}),
      "::placeholder": disabled ? { color: disabled } : {},
    },
    invalid: danger ? { color: danger, iconColor: danger } : {},
  };
}

/**
 * Apariencia global del proveedor `<Elements>`. Se usa para el botón de
 * Apple Pay / Google Pay y para cualquier Element futuro.
 */
export function elementsAppearance(): Appearance {
  const surface = cssToken("--surface");
  const ink = cssToken("--text");
  const muted = cssToken("--text-muted");
  const line = cssToken("--line");
  const teal = cssToken("--teal-deep");
  const danger = cssToken("--danger");
  const family = fontFamily();

  return {
    theme: "stripe",
    variables: {
      ...(teal ? { colorPrimary: teal } : {}),
      ...(surface ? { colorBackground: surface } : {}),
      ...(ink ? { colorText: ink } : {}),
      ...(muted ? { colorTextSecondary: muted } : {}),
      ...(danger ? { colorDanger: danger } : {}),
      ...(family ? { fontFamily: family } : {}),
      ...(line ? { colorTextPlaceholder: line } : {}),
      // Radios del sistema (§2.3): inputs a 8px.
      borderRadius: "8px",
      fontSizeBase: "16px",
    },
  };
}
