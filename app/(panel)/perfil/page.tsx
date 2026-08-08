import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { PerfilView } from "@/components/panel/perfil-view";

/**
 * PERFIL — todo lo que se respondió en la entrevista se puede cambiar aquí,
 * con recálculo del ranking y toast de confirmación (§3.2 regla UX 8), y la
 * membresía se cancela en un clic (§3.4.6).
 *
 * Sigue siendo accesible con la membresía vencida: §3.4.7 bloquea el panel,
 * nunca la cuenta ni el perfil.
 */

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.perfil.title };
}

export default function PerfilPage() {
  return <PerfilView />;
}
