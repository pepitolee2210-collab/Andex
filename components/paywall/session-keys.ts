/**
 * Claves de `sessionStorage` compartidas entre el paywall y el checkout.
 *
 * Son estado EFÍMERO de navegación, no datos del usuario: nada de esto viaja
 * a la base ni a la URL, y se pierde al cerrar la pestaña sin consecuencias.
 *
 * · PAYWALL_SEEN_AT_KEY  → momento en que se vio el paywall. Alimenta
 *   `time_from_paywall_ms` de `payment_succeeded` (§7.5), que es la métrica
 *   de fricción del último tramo del embudo.
 * · CHECKOUT_VISITED_KEY → el usuario ya estuvo en el checkout. Permite
 *   reconocer al que vuelve y decirle que su plan sigue armado (§3.4.7),
 *   sin repetir la entrevista.
 */

export const PAYWALL_SEEN_AT_KEY = "andex_paywall_seen_at";
export const CHECKOUT_VISITED_KEY = "andex_checkout_visited";

/** Milisegundos desde que se vio el paywall. `null` si no hay marca. */
export function msSincePaywall(): number | null {
  try {
    const raw = window.sessionStorage.getItem(PAYWALL_SEEN_AT_KEY);
    if (!raw) return null;
    const seenAt = Number(raw);
    if (!Number.isFinite(seenAt) || seenAt <= 0) return null;
    return Math.max(0, Date.now() - seenAt);
  } catch {
    return null;
  }
}

/** Limpia las marcas del embudo de pago (tras un pago exitoso). */
export function clearPaywallSession(): void {
  try {
    window.sessionStorage.removeItem(PAYWALL_SEEN_AT_KEY);
    window.sessionStorage.removeItem(CHECKOUT_VISITED_KEY);
  } catch {
    /* sessionStorage bloqueado: no hay nada que limpiar */
  }
}
