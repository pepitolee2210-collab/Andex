/**
 * Traducción de errores de Supabase Auth al copy de `lib/i18n/auth`.
 *
 * Regla §2.7: el mensaje dice QUÉ pasó y CÓMO resolverlo. Nunca se disculpa,
 * nunca es vago. Por eso NO se muestra jamás el `message` crudo de Supabase
 * (viene en inglés y con jerga: "Invalid login credentials").
 *
 * Se mapea primero por `code` (estable desde supabase-js 2.x) y, si falta,
 * por subcadena del mensaje: los proyectos con versiones antiguas de GoTrue
 * todavía devuelven errores sin código.
 *
 * PRIVACIDAD (§9 / R5): en el flujo de recuperación NUNCA se traduce a
 * `emailNotFound`. Quien llama decide; ver `requestPasswordReset`.
 */

import type { AuthDict } from "@/lib/i18n";

export type AuthErrorKey = keyof AuthDict["errors"];

type ErrorShape = {
  code: string;
  message: string;
  status: number | null;
  name: string;
};

/** Lectura defensiva y sin `any` de lo que sea que nos hayan lanzado. */
function readError(error: unknown): ErrorShape {
  if (typeof error === "string") {
    return { code: "", message: error, status: null, name: "" };
  }
  if (typeof error !== "object" || error === null) {
    return { code: "", message: "", status: null, name: "" };
  }
  const record = error as Record<string, unknown>;
  const code = typeof record.code === "string" ? record.code : "";
  const message = typeof record.message === "string" ? record.message : "";
  const status = typeof record.status === "number" ? record.status : null;
  const name = typeof record.name === "string" ? record.name : "";
  return { code, message, status, name };
}

/** Códigos de GoTrue → clave del diccionario. */
const CODE_MAP: Record<string, AuthErrorKey> = {
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  user_already_exists: "emailAlreadyRegistered",
  email_exists: "emailAlreadyRegistered",
  user_not_found: "emailNotFound",
  weak_password: "weakPassword",
  over_email_send_rate_limit: "rateLimitedEmail",
  over_sms_send_rate_limit: "rateLimitedEmail",
  over_request_rate_limit: "tooManyAttempts",
  otp_expired: "linkExpired",
  flow_state_expired: "linkExpired",
  flow_state_not_found: "linkExpired",
  bad_code_verifier: "linkAlreadyUsed",
  session_expired: "sessionExpired",
  refresh_token_not_found: "sessionExpired",
  refresh_token_already_used: "sessionExpired",
  session_not_found: "sessionExpired",
  validation_failed: "emailInvalid",
  email_address_invalid: "emailInvalid",
  signup_disabled: "unknown",
  same_password: "samePassword",
};

/** Fallback por subcadena del mensaje (GoTrue antiguo, sin `code`). */
const MESSAGE_MAP: Array<[RegExp, AuthErrorKey]> = [
  [/invalid login credentials/i, "invalidCredentials"],
  [/email not confirmed/i, "emailNotConfirmed"],
  [/user already registered|already been registered/i, "emailAlreadyRegistered"],
  [/user not found/i, "emailNotFound"],
  [/password should be at least/i, "weakPassword"],
  [/password is (too weak|known to be weak)/i, "weakPassword"],
  [/should be different from the old password|same as the old/i, "samePassword"],
  [/for security purposes, you can only request/i, "rateLimitedEmail"],
  [/email rate limit exceeded/i, "rateLimitedEmail"],
  [/request rate limit reached|too many requests/i, "tooManyAttempts"],
  [/(token|otp) has expired|link is invalid or has expired/i, "linkExpired"],
  [/code (challenge|verifier)/i, "linkAlreadyUsed"],
  [/jwt expired|session (from session id )?not found/i, "sessionExpired"],
  [/unable to validate email address|invalid format/i, "emailInvalid"],
  [/failed to fetch|network ?error|load failed/i, "network"],
];

/** Clave del diccionario que corresponde a un error de Supabase. */
export function authErrorKey(error: unknown): AuthErrorKey {
  const { code, message, status, name } = readError(error);

  const byCode = CODE_MAP[code];
  if (byCode) return byCode;

  for (const [pattern, key] of MESSAGE_MAP) {
    if (pattern.test(message)) return key;
  }

  // Sin código ni mensaje reconocible: el estado HTTP todavía dice algo.
  if (status === 429) return "tooManyAttempts";
  if (status === 401 || status === 403) return "sessionExpired";
  if (name === "AuthRetryableFetchError" || name === "TypeError") return "network";
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "network";
  }

  return "unknown";
}

/** Mensaje ya traducido y listo para pintar bajo el campo. */
export function translateAuthError(error: unknown, dict: AuthDict): string {
  return dict.errors[authErrorKey(error)];
}
