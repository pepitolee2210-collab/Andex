/**
 * Política de contraseñas del MVP — módulo puro, sin dependencias.
 *
 * El requisito duro es UNO solo y está escrito en el copy
 * (`auth.shared.passwordHelp`: "Usa al menos 8 caracteres. Mézclalos como
 * quieras."). No se exigen mayúsculas ni símbolos: las reglas de composición
 * empujan a la gente a `Password1!` y no hacen la contraseña más fuerte.
 * El medidor es orientativo, nunca bloquea.
 */

/** Mínimo exigido antes de enviar el formulario (§2.7: se dice ANTES). */
export const MIN_PASSWORD_LENGTH = 8;

/** Longitud a partir de la cual la barra se llena entera. */
const STRONG_LENGTH = 12;

/** 0 = no cumple el mínimo · 1 = básica · 2 = buena · 3 = fuerte. */
export type PasswordStrength = 0 | 1 | 2 | 3;

export function passwordStrength(password: string): PasswordStrength {
  if (password.length < MIN_PASSWORD_LENGTH) return 0;

  let score = 1;
  const variety =
    (/[a-zA-Z]/.test(password) ? 1 : 0) +
    (/\d/.test(password) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(password) ? 1 : 0);

  if (password.length >= STRONG_LENGTH) score += 1;
  if (variety >= 2) score += 1;

  return Math.min(score, 3) as PasswordStrength;
}
