"use client";

/**
 * EL DOCK DEL SHELL.
 *
 * Es la única navegación del producto: la misma barra, en el mismo sitio, en
 * todas las pantallas. Antes cada zona tenía la suya —el inicio su dock, los
 * módulos la barra de pestañas del panel— y entrar en la Bóveda parecía
 * cambiar de aplicación.
 *
 * Aquí sólo se resuelve QUÉ está activo y CÓMO se llama este sitio. El
 * dibujo es el mismo `Dock` del inicio: si algún día cambia el diseño de la
 * barra, cambia en un solo archivo.
 */

import { ROUTES } from "@/lib/config";
import { getClientLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import type { AppSlug } from "@/lib/os/apps";
import { Dock } from "@/components/os/dock";
import { ShieldCheckIcon } from "@/components/icons/shield-check";
import { ScanTextIcon } from "@/components/icons/scan-text";
import { SparklesIcon } from "@/components/icons/sparkles";
import { GavelIcon } from "@/components/icons/gavel";
import { GraduationCapIcon } from "@/components/icons/graduation-cap";
import { UsersIcon } from "@/components/icons/users";
import { BellIcon } from "@/components/icons/bell";
import { SettingsIcon } from "@/components/icons/settings";
import { toast } from "@/components/ui/toaster";

const ICONOS = {
  boveda: ShieldCheckIcon,
  escaner: ScanTextIcon,
  ia: SparklesIcon,
  legal: GavelIcon,
  ingles: GraduationCapIcon,
  comunidad: UsersIcon,
  avisos: BellIcon,
  ajustes: SettingsIcon,
} as const;

/** Las cuatro de siempre: es un atajo, no el catálogo. */
const DOCK: readonly AppSlug[] = ["boveda", "escaner", "ia", "legal"];

/**
 * Qué app corresponde a la ruta actual.
 *
 * El Escáner no tiene ruta propia —vive dentro de la Bóveda—, así que en
 * `/modulo/boveda` la app activa es Bóveda y no las dos. Marcar dos a la vez
 * haría dudar de dónde se está.
 */
function appDeLaRuta(pathname: string): AppSlug | null {
  if (pathname.startsWith(ROUTES.modulo("boveda"))) return "boveda";
  if (pathname.startsWith(ROUTES.modulo("academia"))) return "ingles";
  if (pathname.startsWith(ROUTES.modulo("comunidad"))) return "comunidad";
  if (pathname.startsWith(ROUTES.perfil)) return "ajustes";
  return null;
}

export function ShellDock({ pathname }: { pathname: string }) {
  const copy = getDictionary(getClientLang()).os;
  const activa = appDeLaRuta(pathname);

  return (
    <Dock
      apps={DOCK}
      labels={copy.apps}
      iconos={ICONOS}
      activa={activa}
      /* La píldora dice dónde estás. En el inicio, "Inicio"; dentro de una
         app, su nombre. Es la única señal de ubicación que queda tras
         quitar la barra superior, así que tiene que ser exacta. */
      sitio={activa ? copy.apps[activa] : copy.dockHome}
      onSoon={() => toast.info(copy.soonBody)}
    />
  );
}
