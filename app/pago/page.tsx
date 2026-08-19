import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { isDemoMode, PRICES, ROUTES } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import { bienvenida } from "@/lib/i18n/dictionaries/bienvenida";
import { pagoDirecto, type PagoDirectoDict } from "@/lib/i18n/dictionaries/pago-directo";
import { getLang } from "@/lib/i18n/server";
import { parsePlan } from "@/lib/stripe/plans";
import type { Lang, PlanType } from "@/lib/types";
import { formatUsd } from "@/lib/utils";
import { CheckoutScreen } from "@/components/paywall/checkout-screen";
import { PagoScreen } from "@/components/embudo/pago-screen";

/**
 * PASO 2 DEL EMBUDO — el pago.
 *
 * Dos caminos entran por aquí y la diferencia es si ya hay cuenta:
 *
 *  · SIN sesión — el embudo nuevo. Se cobra antes de registrar, así que la
 *    pantalla recoge el correo, anota el pago y manda a `/registro`. Es el
 *    camino por defecto: se llega desde la bienvenida.
 *  · CON sesión — quien ya tiene cuenta y viene del muro de membresía. Sigue
 *    funcionando igual que siempre, con `CheckoutScreen`.
 *
 * `requireUser()` ya no se llama: exigir sesión para entrar a pagar cerraría
 * la puerta antes de abrirla. El middleware tampoco protege esta ruta — ver
 * el comentario de `PROTECTED_PREFIXES`.
 *
 * §9 — sin datos sensibles en URLs. `?plan=annual|monthly` dice qué cadencia
 * eligió: es una preferencia comercial, no su estatus migratorio.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.checkout.title };
}

/** Compone las cadenas con parámetro: una función no cruza a un cliente. */
function copyDePago(lang: Lang, plan: PlanType): PagoDirectoDict {
  const t = pagoDirecto[lang];
  const importe = formatUsd(plan === "annual" ? PRICES.annual.usd : PRICES.monthly.usd);

  return {
    eyebrow: t.eyebrow,
    heading: t.heading,
    lead: t.lead,
    planesAria: t.planes.aria,
    planSelected: t.planes.selected,
    mensual: {
      name: t.planes.mensual.name,
      price: formatUsd(PRICES.monthly.usd),
      period: t.planes.mensual.period,
      detail: t.planes.mensual.detail(formatUsd(PRICES.monthly.usd * 12)),
    },
    anual: {
      name: t.planes.anual.name,
      price: formatUsd(PRICES.annual.usd),
      period: t.planes.anual.period,
      badge: t.planes.anual.badge,
      savings: t.planes.anual.savings(formatUsd(PRICES.annual.savingsUsd)),
      detail: t.planes.anual.detail(formatUsd(PRICES.annual.monthlyEquivalentUsd)),
    },
    cta: t.cta(importe),
    despues: t.despues,
    errorPasarela: t.errorPasarela,
    legal: t.legal,
    resumen: {
      title: t.resumen.title,
      concepto: t.resumen.concepto[plan],
      cadencia: t.resumen.cadencia[plan],
      total: t.resumen.total,
      importe,
      garantias: t.resumen.garantias,
    },
    pasarela: t.pasarela,
    yaTengoCuenta: t.yaTengoCuenta,
    iniciarSesion: t.iniciarSesion,
    procesando: t.procesando,
  };
}

export default async function PagoPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const [lang, params, user] = await Promise.all([
    getLang(),
    searchParams,
    getSessionUser(),
  ]);
  const plan = parsePlan(params.plan);

  // Quien ya tiene cuenta sigue por el checkout de siempre.
  if (user) return <CheckoutScreen lang={lang} plan={plan} />;

  const dict = getDictionary(lang);
  const funnel = bienvenida[lang];
  const pasos = funnel.pasos;

  return (
    <PagoScreen
      copy={copyDePago(lang, plan)}
      marca={dict.common.brand.name}
      pasos={pasos}
      pasoActual={funnel.pasoActual(2, pasos.length)}
      planInicial={plan}
      demo={isDemoMode}
      demoAviso={isDemoMode ? dict.checkout.demo.body : undefined}
    />
  );
}
