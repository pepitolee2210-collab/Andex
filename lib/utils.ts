/** Utilidades mínimas compartidas. Sin dependencias externas. */

/** Une clases condicionales. Uso: cn("a", cond && "b"). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** "$250" — USD sin decimales; con decimales solo si los hay ($20.83). */
export function formatUsd(amount: number): string {
  return Number.isInteger(amount)
    ? `$${amount.toLocaleString("en-US")}`
    : `$${amount.toFixed(2)}`;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Patrón "Otro" §3.2.1 regla 5: todo texto libre se sanitiza antes de
 * persistirse. Máx 120 caracteres, sin caracteres de control.
 * El escape de render lo hace React; esto limpia lo que se guarda.
 */
export function sanitizeFreeText(value: string, maxLen = 120): string {
  let cleaned = "";
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    cleaned += code < 32 || code === 127 ? " " : ch;
  }
  return cleaned.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Fecha ISO (YYYY-MM-DD) de hoy, en UTC. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
