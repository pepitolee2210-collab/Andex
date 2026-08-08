/**
 * MODO DEMO — sesión sin backend.
 *
 * Sin credenciales de Supabase la app tiene que poder recorrer el embudo
 * completo (§3). La "sesión" es entonces la cookie `andex_session`
 * (`COOKIES.demoSession`) con un JSON `{id, email, firstName}`.
 *
 * ⚠️ ESTO NO ES SEGURIDAD. Es un maniquí para poder demostrar el producto:
 * la cookie la escribe un route handler propio (`/api/auth/demo`) sin
 * verificar contraseña alguna. En modo real manda Supabase Auth y RLS (§7.3).
 * El endpoint se apaga solo cuando hay credenciales configuradas.
 *
 * Este archivo es neutro (ni servidor ni cliente): lo importan el middleware,
 * `lib/auth/index.ts`, el route handler y `lib/auth/client.ts`.
 */

import type { SessionUser } from "./index";

/** Endpoint que escribe y borra la cookie de sesión demo. */
export const DEMO_SESSION_ENDPOINT = "/api/auth/demo";

/** 30 días: suficiente para que la demo sobreviva a la sesión del navegador. */
export const DEMO_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Cuentas creadas en ESTE navegador (modo demo). Permite que
 * `signInWithPassword` reconozca un correo ya registrado sin backend.
 * Vive en localStorage, junto al resto del demo-store.
 */
export const DEMO_ACCOUNTS_KEY = "andex_demo_accounts";

/** Parsea el valor crudo de la cookie. Nunca lanza: dato corrupto = sin sesión. */
export function parseDemoSession(raw: string | null | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    return toSessionUser(parsed);
  } catch {
    return null;
  }
}

/** Valida la forma `{id, email, firstName}` sin confiar en el origen. */
export function toSessionUser(value: unknown): SessionUser | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id.trim() : "";
  const email = typeof record.email === "string" ? record.email.trim() : "";
  const firstName =
    typeof record.firstName === "string" ? record.firstName.trim() : "";
  if (id.length === 0 || email.length === 0) return null;
  return { id, email, firstName };
}

export function serializeDemoSession(user: SessionUser): string {
  return encodeURIComponent(JSON.stringify(user));
}

// ── Registro de cuentas del navegador (solo cliente) ─────

type DemoAccounts = Record<string, SessionUser>;

function hasStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readAccounts(): DemoAccounts {
  if (!hasStorage()) return {};
  try {
    const raw = window.localStorage.getItem(DEMO_ACCOUNTS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: DemoAccounts = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const user = toSessionUser(value);
      if (user) out[key] = user;
    }
    return out;
  } catch {
    return {};
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Cuenta demo ya creada en este navegador, o null. */
export function findDemoAccount(email: string): SessionUser | null {
  return readAccounts()[normalizeEmail(email)] ?? null;
}

/** Guarda (o actualiza) la cuenta demo de este navegador. */
export function rememberDemoAccount(user: SessionUser): void {
  if (!hasStorage()) return;
  try {
    const accounts = readAccounts();
    accounts[normalizeEmail(user.email)] = user;
    window.localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Storage lleno o modo privado: la demo sigue, solo se pierde el registro.
  }
}
