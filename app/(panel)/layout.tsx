/**
 * Shell del panel (§2.4) — capa de servidor.
 *
 * Solo hace dos cosas aquí: exigir sesión (§3, embudo) y resolver el idioma.
 * Todo lo demás vive en client components porque en modo demo los datos están
 * en el navegador (brief §6) y el servidor no puede verlos.
 *
 * Control de acceso por suscripción (§3.4.7): lo aplica `PanelProvider`, que
 * es quien puede leer el store — sin suscripción manda a /membresia, con
 * `past_due` deja el panel en solo lectura y, cancelada y vencida, lo bloquea
 * dejando cuenta y perfil intactos.
 */

import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { getLang } from "@/lib/i18n/server";
import { PanelProvider } from "@/components/panel/panel-context";
import { PanelShell } from "@/components/panel/panel-shell";

export default async function PanelLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireUser();
  const lang = await getLang();

  return (
    <PanelProvider lang={lang}>
      <PanelShell>{children}</PanelShell>
    </PanelProvider>
  );
}
