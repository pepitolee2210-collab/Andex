/**
 * /recuperar — solicitud de enlace para cambiar la contraseña (§0.2-B).
 * La respuesta es neutra siempre: nunca se revela si el correo existe (§9).
 */

import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { RecuperarForm } from "@/components/auth/recuperar-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.auth.recuperar.eyebrow };
}

export default async function RecuperarPage() {
  const lang = await getLang();
  return <RecuperarForm lang={lang} />;
}
