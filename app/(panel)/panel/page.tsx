import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { Dashboard } from "@/components/panel/dashboard";

/**
 * DASHBOARD ADAPTATIVO (§4) — "el corazón del MVP".
 *
 * El servidor solo resuelve el idioma y el título. Todo lo demás es cliente:
 * el perfil, el ranking y la suscripción viven en la capa de datos, que en
 * modo demo es el navegador (brief §6). El layout de (panel) ya exigió sesión
 * y montó el proveedor con el control de acceso de §3.4.7.
 *
 * §9 — ninguna respuesta del usuario viaja en la URL.
 */

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.panel.pageTitle };
}

export default function PanelPage() {
  return <Dashboard />;
}
