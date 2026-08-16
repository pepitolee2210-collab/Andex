import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { TiendaScreen } from "@/components/tienda/tienda-screen";

/**
 * TIENDA — miniaplicaciones.
 *
 * Dentro de `(panel)`, así que hereda la sesión y el control de acceso.
 * No es uno de los siete módulos del catálogo (§7.4): no toca el orden
 * canónico de la navegación que §4.3 congela.
 */

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.tienda.title };
}

export default async function TiendaPage() {
  const dict = getDictionary(await getLang());
  return <TiendaScreen copy={dict.tienda} />;
}
