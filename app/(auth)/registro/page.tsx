/**
 * /registro — segundo paso del embudo (§3): landing → REGISTRO → entrevista.
 *
 * Server Component: resuelve el idioma desde la cookie y se lo pasa al
 * formulario. Así no hay desajuste de hidratación (el servidor ya sabe el
 * idioma; `getClientLang()` en el primer render no).
 */

import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { RegistroForm } from "@/components/auth/registro-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.auth.registro.eyebrow };
}

export default async function RegistroPage() {
  const lang = await getLang();
  return <RegistroForm lang={lang} />;
}
