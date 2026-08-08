/**
 * Traducción de errores de pago de Stripe a las claves del diccionario
 * (§3.4.7: "Mensaje específico ('Tu banco rechazó el cargo'), no genérico").
 *
 * Módulo PURO: no importa el SDK ni copy. Devuelve una CLAVE; el texto lo
 * resuelve `lib/i18n/dictionaries/checkout.ts` en el idioma del usuario.
 *
 * También devuelve el `decline_code` crudo, que es lo que pide el evento
 * `payment_failed` de §7.5 — sin él no se puede saber por qué se cae la gente
 * en el último paso.
 */

/** Claves de `checkout.errors` que son un mensaje completo para el usuario. */
export type PaymentErrorKey =
  | "cardDeclined"
  | "insufficientFunds"
  | "expiredCard"
  | "incorrectCvc"
  | "incorrectNumber"
  | "incorrectPostalCode"
  | "processingError"
  | "authenticationRequired"
  | "currencyNotSupported"
  | "network"
  | "generic";

export type PaymentErrorInfo = {
  key: PaymentErrorKey;
  /** Para `payment_failed` de §7.5. `null` cuando el fallo no viene del banco. */
  declineCode: string | null;
};

/**
 * Forma mínima del error de Stripe que necesitamos. Se declara aquí en vez de
 * importar `Stripe.StripeError` para que este módulo siga siendo usable desde
 * el cliente (donde el error llega de `@stripe/stripe-js`, otro paquete con
 * otra forma de tipo pero los mismos campos).
 */
export type StripeLikeError = {
  type?: string;
  code?: string;
  decline_code?: string;
  message?: string;
};

/** `decline_code` del banco → mensaje. Lo que no está aquí es un rechazo genérico. */
const BY_DECLINE_CODE: Record<string, PaymentErrorKey> = {
  insufficient_funds: "insufficientFunds",
  expired_card: "expiredCard",
  incorrect_cvc: "incorrectCvc",
  invalid_cvc: "incorrectCvc",
  incorrect_number: "incorrectNumber",
  invalid_number: "incorrectNumber",
  incorrect_zip: "incorrectPostalCode",
  currency_not_supported: "currencyNotSupported",
  authentication_required: "authenticationRequired",
  processing_error: "processingError",
  try_again_later: "processingError",
  issuer_not_available: "processingError",
};

/** `code` del error de Stripe (no del banco) → mensaje. */
const BY_CODE: Record<string, PaymentErrorKey> = {
  expired_card: "expiredCard",
  incorrect_cvc: "incorrectCvc",
  invalid_cvc: "incorrectCvc",
  incomplete_cvc: "incorrectCvc",
  incorrect_number: "incorrectNumber",
  invalid_number: "incorrectNumber",
  incomplete_number: "incorrectNumber",
  invalid_expiry_month: "expiredCard",
  invalid_expiry_year: "expiredCard",
  incomplete_expiry: "expiredCard",
  incorrect_zip: "incorrectPostalCode",
  incomplete_zip: "incorrectPostalCode",
  processing_error: "processingError",
  authentication_required: "authenticationRequired",
  payment_intent_authentication_failure: "authenticationRequired",
  currency_not_supported: "currencyNotSupported",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(source: Record<string, unknown>, key: string): string | undefined {
  const value = source[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Clasifica cualquier error del checkout. Nunca lanza y nunca devuelve vacío:
 * si no reconoce nada cae en `generic`, que ya dice "no se hizo ningún cargo".
 */
export function classifyPaymentError(error: unknown): PaymentErrorInfo {
  if (!isRecord(error)) return { key: "generic", declineCode: null };

  const type = readString(error, "type");
  const code = readString(error, "code");
  const declineCode = readString(error, "decline_code") ?? null;

  // Sin red no hubo intento de cobro: el mensaje lo dice explícitamente.
  if (type === "api_connection_error" || code === "network_error") {
    return { key: "network", declineCode };
  }

  if (declineCode) {
    return {
      key: BY_DECLINE_CODE[declineCode] ?? "cardDeclined",
      declineCode,
    };
  }

  if (code) {
    const mapped = BY_CODE[code];
    if (mapped) return { key: mapped, declineCode: null };
    // `card_declined` sin decline_code: el banco no dio motivo.
    if (code === "card_declined") return { key: "cardDeclined", declineCode: null };
  }

  if (type === "card_error") return { key: "cardDeclined", declineCode: null };

  return { key: "generic", declineCode: null };
}
