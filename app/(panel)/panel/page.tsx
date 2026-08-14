import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { HomeView } from "@/components/os/home-view";

/**
 * EL PANEL ES AHORA LA PANTALLA DEL SISTEMA.
 *
 * Antes aquí vivía el dashboard adaptativo: tarjeta de objetivo, tarjetas de
 * recomendación y rejilla de módulos. Se sustituye por el inicio —la misma
 * vista que `/inicio`— porque dice lo mismo de otra forma:
 *
 *   antes  "Trámites y Estatus Migratorio · Empezar aquí"   una invitación
 *   ahora  "12 documentos · el permiso vence en 40 días"    un estado
 *
 * Quien abre la aplicación tiene un trámite encima; lo que necesita es saber
 * cómo va, no que le animen a empezar. El `Dashboard` sigue en el repo y su
 * lógica de ranking se recupera cuando toque llevar la recomendación a un
 * widget.
 *
 * §9 — ninguna respuesta del usuario viaja en la URL.
 */

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.panel.pageTitle };
}

export default function PanelPage() {
  return <HomeView />;
}
