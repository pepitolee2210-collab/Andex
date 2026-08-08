"use client";

/**
 * Contrato de autenticación — LADO CLIENTE.
 *
 * FIRMAS CONGELADAS (`useSessionUser`, `signUpWithPassword`,
 * `signInWithPassword`, `signInWithMagicLink`, `requestPasswordReset`,
 * `signOut`, `AuthResult`): las páginas client ya programan contra ellas.
 * Aquí solo se añaden exports nuevos.
 *
 * Doble modo (§ brief 6), decidido por `isDemoMode`:
 *   · Modo real → Supabase Auth (email+contraseña y magic link) desde el
 *     cliente de navegador, con `onAuthStateChange` para mantener el hook vivo.
 *   · Modo demo → cookie `andex_session` escrita por `/api/auth/demo`.
 *     La cookie es httpOnly, así que el hook la lee por fetch, no por JS.
 *
 * Los errores NUNCA se muestran crudos: se traducen con `lib/auth/errors.ts`
 * a las claves de `lib/i18n/dictionaries/auth.ts` (§2.7).
 */

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ROUTES, SITE_URL, isDemoMode } from "@/lib/config";
import { getDataStore } from "@/lib/data";
import { dictionaries, getClientLang, type AuthDict } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isValidEmail, sanitizeFreeText } from "@/lib/utils";
import type { SessionUser } from "./index";
import {
  DEMO_SESSION_ENDPOINT,
  findDemoAccount,
  normalizeEmail,
  rememberDemoAccount,
  toSessionUser,
} from "./demo-session";
import { authErrorKey, translateAuthError } from "./errors";
import { MIN_PASSWORD_LENGTH } from "./policy";
import { resolvePostAuthRoute, safeNextPath } from "./routing";

export type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string };

export type SimpleResult = { ok: boolean; error?: string };

export { MIN_PASSWORD_LENGTH, passwordStrength } from "./policy";
export type { PasswordStrength } from "./policy";
export { resolvePostAuthRoute, safeNextPath } from "./routing";

// ── Utilidades internas ──────────────────────────────────

function dict(): AuthDict {
  return dictionaries.auth[getClientLang()];
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/** URL absoluta a la que Supabase devuelve al usuario tras el correo. */
function callbackUrl(next?: string): string {
  const safe = safeNextPath(next);
  const base = `${SITE_URL}/callback`;
  return safe ? `${base}?next=${encodeURIComponent(safe)}` : base;
}

function fromSupabaseUser(user: User | null): SessionUser | null {
  if (!user) return null;
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const raw = meta?.first_name;
  return {
    id: user.id,
    email: user.email ?? "",
    // Sin nombre en los metadatos (magic link puro) se deja vacío: lo pide
    // el paso 1 del wizard. Nunca se deduce del correo.
    firstName: typeof raw === "string" ? raw.trim() : "",
  };
}

// ── Sesión demo: la cookie es httpOnly, se habla por fetch ──

/** Suscriptores del hook, para refrescar tras un login/logout en demo. */
const demoListeners = new Set<() => void>();

function notifyDemoSessionChanged(): void {
  demoListeners.forEach((listener) => listener());
}

async function readDemoSession(): Promise<SessionUser | null> {
  try {
    const response = await fetch(DEMO_SESSION_ENDPOINT, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (typeof payload !== "object" || payload === null) return null;
    return toSessionUser((payload as Record<string, unknown>).user);
  } catch {
    return null;
  }
}

async function writeDemoSession(user: SessionUser): Promise<boolean> {
  try {
    const response = await fetch(DEMO_SESSION_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(user),
    });
    if (!response.ok) return false;
    rememberDemoAccount(user);
    notifyDemoSessionChanged();
    return true;
  } catch {
    return false;
  }
}

async function clearDemoSession(): Promise<void> {
  try {
    await fetch(DEMO_SESSION_ENDPOINT, { method: "DELETE" });
  } catch {
    // Sin red no hay nada que hacer; la cookie caduca sola.
  }
  notifyDemoSessionChanged();
}

// ── Hook de sesión ───────────────────────────────────────

type SessionState = { user: SessionUser | null; loading: boolean };

/** Hook de sesión para client components. */
export function useSessionUser(): SessionState {
  const [state, setState] = useState<SessionState>({ user: null, loading: true });

  useEffect(() => {
    let alive = true;

    if (isDemoMode) {
      const load = () => {
        void readDemoSession().then((user) => {
          if (alive) setState({ user, loading: false });
        });
      };
      load();
      demoListeners.add(load);
      return () => {
        alive = false;
        demoListeners.delete(load);
      };
    }

    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (alive) setState({ user: fromSupabaseUser(data.user), loading: false });
    });

    // Mantiene el hook al día ante refresco de token, login en otra pestaña
    // y cierre de sesión.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setState({
        user: fromSupabaseUser(session?.user ?? null),
        loading: false,
      });
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}

// ── Registro ─────────────────────────────────────────────

export async function signUpWithPassword(input: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}): Promise<AuthResult> {
  const d = dict();
  const email = normalizeEmail(input.email);
  const firstName = sanitizeFreeText(input.firstName, 100);
  const lastName = input.lastName ? sanitizeFreeText(input.lastName, 100) : "";

  if (email.length === 0) return fail(d.errors.emailRequired);
  if (!isValidEmail(email)) return fail(d.errors.emailInvalid);
  if (input.password.length === 0) return fail(d.errors.passwordRequired);
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return fail(d.errors.passwordTooShort);
  }

  if (isDemoMode) {
    if (findDemoAccount(email)) return fail(d.errors.emailAlreadyRegistered);
    const user: SessionUser = {
      id: crypto.randomUUID(),
      email,
      firstName,
    };
    const written = await writeDemoSession(user);
    return written ? { ok: true, user } : fail(d.errors.network);
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        // El trigger `handle_new_user` (0004_auth.sql) copia estos campos a
        // public.users al insertar en auth.users.
        data: { first_name: firstName, last_name: lastName || null },
        emailRedirectTo: callbackUrl(ROUTES.entrevista),
      },
    });

    if (error) return fail(translateAuthError(error, d));

    // Supabase ofusca a propósito el alta de un correo ya existente: en vez
    // de error devuelve un usuario con `identities` vacío. Sin este chequeo
    // el usuario creería que se registró y nunca recibiría el correo.
    if (data.user && data.user.identities?.length === 0) {
      return fail(d.errors.emailAlreadyRegistered);
    }

    const user = fromSupabaseUser(data.user);
    if (!data.session || !user) {
      // Proyecto con confirmación de correo activada: la cuenta existe pero
      // aún no hay sesión. El copy dice exactamente qué hacer.
      return fail(d.errors.emailNotConfirmed);
    }
    return { ok: true, user };
  } catch (error) {
    return fail(translateAuthError(error, d));
  }
}

// ── Inicio de sesión ─────────────────────────────────────

export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const d = dict();
  const email = normalizeEmail(input.email);

  if (email.length === 0) return fail(d.errors.emailRequired);
  if (!isValidEmail(email)) return fail(d.errors.emailInvalid);
  if (input.password.length === 0) return fail(d.errors.passwordRequired);

  if (isDemoMode) {
    // DEMO: no hay backend ni hash de contraseña que verificar. Si el correo
    // se registró en ESTE navegador, cualquier contraseña entra. Es una
    // demostración del flujo, no un control de acceso.
    const account = findDemoAccount(email);
    // Correo desconocido → mismo mensaje que credencial equivocada: no se
    // revela si una cuenta existe (§9 / R5).
    if (!account) return fail(d.errors.invalidCredentials);
    const written = await writeDemoSession(account);
    return written ? { ok: true, user: account } : fail(d.errors.network);
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: input.password,
    });
    if (error) return fail(translateAuthError(error, d));

    const user = fromSupabaseUser(data.user);
    if (!user) return fail(d.errors.invalidCredentials);
    return { ok: true, user };
  } catch (error) {
    return fail(translateAuthError(error, d));
  }
}

/** Magic link (§0.2-B). En demo: inicia sesión directo simulando el enlace. */
export async function signInWithMagicLink(_email: string): Promise<SimpleResult> {
  const d = dict();
  const email = normalizeEmail(_email);

  if (email.length === 0) return { ok: false, error: d.errors.emailRequired };
  if (!isValidEmail(email)) return { ok: false, error: d.errors.emailInvalid };

  if (isDemoMode) {
    // Sin servidor de correo no hay enlace que enviar: se entra directo,
    // que es lo que pasaría al tocar el botón del correo.
    const account: SessionUser = findDemoAccount(email) ?? {
      id: crypto.randomUUID(),
      email,
      firstName: "",
    };
    const written = await writeDemoSession(account);
    return written ? { ok: true } : { ok: false, error: d.errors.network };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Igual que el registro: quien entra por enlace y no tiene perfil
        // acaba en la entrevista (§3).
        emailRedirectTo: callbackUrl(),
        shouldCreateUser: true,
      },
    });
    if (error) return { ok: false, error: translateAuthError(error, d) };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: translateAuthError(error, d) };
  }
}

// ── Recuperación de contraseña ───────────────────────────

/**
 * Pide el enlace de restablecimiento.
 *
 * NUNCA revela si el correo existe (§9 / R5): salvo que el propio dato esté
 * mal escrito o que el servidor pida esperar, la respuesta es siempre `ok`.
 * La pantalla muestra el mismo mensaje neutro en todos los casos.
 */
export async function requestPasswordReset(_email: string): Promise<SimpleResult> {
  const d = dict();
  const email = normalizeEmail(_email);

  if (email.length === 0) return { ok: false, error: d.errors.emailRequired };
  if (!isValidEmail(email)) return { ok: false, error: d.errors.emailInvalid };

  if (isDemoMode) return { ok: true };

  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl(`${ROUTES.recuperar}/nueva`),
    });
    if (error) {
      const key = authErrorKey(error);
      // Solo se devuelven los errores que NO dicen nada sobre la existencia
      // de la cuenta: límite de envío y falta de conexión.
      if (key === "rateLimitedEmail" || key === "tooManyAttempts") {
        return { ok: false, error: d.errors[key] };
      }
      if (key === "network") return { ok: false, error: d.errors.network };
    }
    return { ok: true };
  } catch (error) {
    if (authErrorKey(error) === "network") {
      return { ok: false, error: d.errors.network };
    }
    return { ok: true };
  }
}

/**
 * Fija la contraseña nueva tras abrir el enlace del correo (`/recuperar/nueva`).
 * Export ADICIONAL: no estaba en el stub, no cambia ninguna firma congelada.
 */
export async function updatePassword(input: {
  password: string;
  confirmPassword: string;
}): Promise<AuthResult> {
  const d = dict();

  if (input.password.length === 0) return fail(d.errors.passwordRequired);
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return fail(d.errors.passwordTooShort);
  }
  if (input.password !== input.confirmPassword) {
    return fail(d.errors.passwordMismatch);
  }

  if (isDemoMode) {
    // En demo no existe una contraseña que cambiar: se confirma el cambio
    // sobre la sesión abierta para poder recorrer la pantalla completa.
    const user = await readDemoSession();
    if (!user) return fail(d.errors.linkExpired);
    return { ok: true, user };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.updateUser({
      password: input.password,
    });
    if (error) return fail(translateAuthError(error, d));
    const user = fromSupabaseUser(data.user);
    // Sin sesión de recuperación el enlace ya no vale.
    if (!user) return fail(d.errors.linkExpired);
    return { ok: true, user };
  } catch (error) {
    return fail(translateAuthError(error, d));
  }
}

// ── Cierre de sesión ─────────────────────────────────────

export async function signOut(): Promise<void> {
  if (isDemoMode) {
    await clearDemoSession();
    return;
  }
  try {
    await getSupabaseBrowserClient().auth.signOut();
  } catch {
    // Ya sin sesión válida: el objetivo (quedar fuera) está cumplido.
  }
}

// ── Destino tras autenticarse ────────────────────────────

/**
 * Resuelve la ruta post-login leyendo el estado real del usuario a través de
 * `getDataStore()` (localStorage en demo, Supabase con RLS en real).
 * Export ADICIONAL pensado para las pantallas de login y de contraseña nueva.
 */
export async function resolvePostAuthRouteForCurrentUser(): Promise<string> {
  try {
    const store = getDataStore();
    const [profile, subscription] = await Promise.all([
      store.getProfile(),
      store.getSubscription(),
    ]);
    return resolvePostAuthRoute({ profile, subscription });
  } catch {
    // Sin datos legibles, el destino seguro es el inicio del embudo.
    return ROUTES.entrevista;
  }
}
