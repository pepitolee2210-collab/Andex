import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { parsePlan } from "@/lib/stripe/plans";
import { CheckoutScreen } from "@/components/paywall/checkout-screen";

/**
 * CHECKOUT (§3.4.5) — **pantalla separada, no modal**.
 *
 * Server Component mínimo: exige sesión, resuelve idioma y lee el plan.
 *
 * §9 — sin datos sensibles en URLs. `?plan=annual|monthly` dice qué cadencia
 * eligió el usuario: es una preferencia comercial, no su estatus migratorio
 * (mismo criterio que el `?ctx=` de la landing). Va en la URL a propósito,
 * para que "← Cambiar de plan", el botón atrás y un refresco funcionen sin
 * estado escondido. Cualquier valor raro cae al plan preseleccionado.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.checkout.title };
}

export default async function PagoPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  await requireUser();
  const [lang, params] = await Promise.all([getLang(), searchParams]);

  return <CheckoutScreen lang={lang} plan={parsePlan(params.plan)} />;
}
