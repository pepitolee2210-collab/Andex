import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { workshopBySlug } from "@/lib/catalogs/talleres";
import { AcademiaScreen } from "@/components/academia/academia-screen";

/**
 * INGLÉS PARA EL TRABAJO — módulo 6 (§5-M6).
 *
 * Segmento estático: `/modulo/academia` gana a `/modulo/[slug]`.
 *
 * El servidor resuelve idioma, texto y qué serie de taller le toca a este
 * módulo. Todo lo que depende del reloj o de la zona horaria del navegador
 * —el estado de la puerta, la cuenta atrás, en qué hora se enseña— ocurre en
 * el cliente: el servidor no conoce ninguna de las dos cosas.
 *
 * La clase de inglés es la MISMA serie que aparece en Comunidad, no una
 * copia. Una sola fuente: si cambia el horario, cambia en los dos sitios.
 */

const SERIE_INGLES = "ingles-para-el-trabajo";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.academia.title };
}

export default async function AcademiaPage() {
  const lang = await getLang();
  const dict = getDictionary(lang);

  const serie = workshopBySlug(SERIE_INGLES) ?? null;
  const textos = dict.comunidad.workshops[SERIE_INGLES];

  return (
    <AcademiaScreen
      lang={lang}
      copy={dict.academia}
      workshop={serie}
      workshopTitle={textos.title}
      workshopSummary={textos.summary}
      workshopCaveat={textos.caveat}
      doorCopy={{
        ...dict.comunidad.door,
        nextDay: dict.comunidad.timezone.nextDay,
        prevDay: dict.comunidad.timezone.prevDay,
      }}
    />
  );
}
