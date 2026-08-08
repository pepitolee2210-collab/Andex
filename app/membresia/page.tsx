import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth";
import { PaywallScreen } from "@/components/paywall/paywall-screen";

/**
 * Fase 3 del embudo — PAYWALL PERSONALIZADO (§3.4).
 *
 * Server Component mínimo: exige sesión y resuelve el idioma. Todo lo demás
 * lo hace `PaywallScreen`, que necesita ser cliente porque el perfil y el
 * ranking viven en la capa de datos del navegador en modo demo (brief §6) y
 * la UI no debe distinguir entre demo y producción.
 *
 * §9 — sin datos sensibles en URLs: esta ruta no acepta ni produce query
 * params. Lo único que viaja a `/pago` es el plan elegido, que es una
 * preferencia comercial, no un estatus migratorio.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.paywall.pageTitle };
}

export default async function MembresiaPage() {
  // Redirige a /login?next=/membresia si no hay sesión.
  await requireUser();
  const lang = await getLang();

  return <PaywallScreen lang={lang} />;
}
