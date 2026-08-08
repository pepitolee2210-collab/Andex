/**
 * /login — entrada de quien ya tiene cuenta.
 *
 * Lee dos parámetros, ambos sin información sensible (§9):
 *   `next`  — ruta interna que el middleware interceptó. Se valida aquí, en
 *             el servidor, antes de que llegue al cliente.
 *   `error` — código corto que deja `/callback` cuando el enlace del correo
 *             ya no sirve. Se traduce aquí; a la URL nunca va copy.
 */

import type { Metadata } from "next";
import { safeNextPath } from "@/lib/auth/routing";
import { getDictionary, type AuthDict } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.auth.login.eyebrow };
}

/** Códigos que puede dejar `/callback` → clave del diccionario (§2.7). */
const CALLBACK_ERRORS: Record<string, keyof AuthDict["errors"]> = {
  link_expired: "linkExpired",
  link_used: "linkAlreadyUsed",
  session_expired: "sessionExpired",
  unknown: "unknown",
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const lang = await getLang();
  const dict = getDictionary(lang);
  const params = await searchParams;

  const next = safeNextPath(firstValue(params.next));
  const errorCode = firstValue(params.error);
  const errorKey = errorCode ? CALLBACK_ERRORS[errorCode] : undefined;

  return (
    <LoginForm
      lang={lang}
      next={next}
      initialError={errorKey ? dict.auth.errors[errorKey] : null}
    />
  );
}
