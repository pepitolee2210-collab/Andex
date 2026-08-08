import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { SuccessScreen } from "@/components/paywall/success-screen";

/**
 * Confirmación del pago — cierre del embudo (§3, §3.4.7).
 *
 * Server Component mínimo: sesión + idioma. El estado real de la membresía lo
 * lee el cliente a través del contrato de datos, porque en producción lo
 * escribe el webhook de Stripe y puede tardar un par de segundos en llegar.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.checkout.success.titleNoName };
}

export default async function PagoExitoPage() {
  await requireUser();
  const lang = await getLang();

  return <SuccessScreen lang={lang} />;
}
