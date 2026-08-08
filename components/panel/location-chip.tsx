"use client";

/**
 * La Ruta en el dashboard (§2.8, fila "Dashboard" de la tabla): chip compacto
 * en el topbar — `🇺🇸 Utah` o `✈️ Colombia`.
 *
 * Es la ÚNICA aparición de La Ruta en el panel: aquí no va la barra de 6 nodos
 * (§2.8: "aparece una sola vez por pantalla"; en el dashboard el usuario ya no
 * está recorriendo el embudo, está en su destino).
 *
 * Codifica información real: dice dónde está el usuario hoy. Es un enlace a
 * /perfil porque es justo donde se cambia ese dato.
 */

import Link from "next/link";
import { ROUTES } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { Lang, StoredProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { scopeName } from "./panel-utils";

export type LocationChipProps = {
  dict: Dictionary;
  lang: Lang;
  profile: StoredProfile;
  className?: string;
};

export function LocationChip({ dict, lang, profile, className }: LocationChipProps) {
  const chip = dict.panel.locationChip;
  const scope = scopeName(profile, lang);
  // Sin ámbito geográfico el chip mentiría; se omite antes que inventar un lugar.
  if (!scope) return null;

  const label =
    profile.locationContext === "in_us" ? chip.inUs(scope) : chip.preArrival(scope);

  return (
    <Link
      href={ROUTES.perfil}
      aria-label={`${dict.common.aria.locationChip}: ${scope}. ${chip.edit}`}
      title={chip.edit}
      className={cn(
        "inline-flex min-h-11 max-w-[8.5rem] items-center gap-1 rounded-full border border-line bg-surface-alt px-3",
        "text-caption font-medium text-ink transition-colors hover:border-teal-deep sm:max-w-none",
        className,
      )}
    >
      <span className="truncate">{label}</span>
    </Link>
  );
}
