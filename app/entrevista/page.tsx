import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { getGeoHint, suggestedContext } from "@/lib/geo";
import { WizardFlow } from "@/components/wizard/wizard-flow";

/**
 * Fase 2 del embudo — MICRO-ENTREVISTA (§3.2).
 *
 * Server Component mínimo: resuelve idioma y la pista de geolocalización por
 * IP (que solo PRESELECCIONA, §3.2 regla 7) y entrega el control al wizard,
 * que necesita ser cliente por el guardado parcial y el estado de los pasos.
 *
 * §9 — sin datos sensibles en URLs: esta ruta no acepta ni produce query
 * params con respuestas; el avance entre pasos es estado, no navegación.
 */

// La pista de IP se lee de headers: la página se resuelve por petición.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.wizard.pageTitle };
}

export default async function EntrevistaPage() {
  const lang = await getLang();
  const geo = await getGeoHint();

  return (
    <WizardFlow
      lang={lang}
      geoCountry={geo.country}
      suggestedBranch={suggestedContext(geo)}
    />
  );
}
