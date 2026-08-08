/**
 * /recuperar/nueva — pantalla de contraseña nueva.
 * Se llega desde el enlace del correo, que pasa antes por `/callback` para
 * canjear el código por una sesión de recuperación.
 */

import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { NuevaPasswordForm } from "@/components/auth/nueva-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.auth.recuperar.newPasswordTitle };
}

export default async function NuevaPasswordPage() {
  const lang = await getLang();
  return <NuevaPasswordForm lang={lang} />;
}
