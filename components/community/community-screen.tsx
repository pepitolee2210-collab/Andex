"use client";

/**
 * COMUNIDAD — la pantalla de talleres en vivo.
 *
 * Cliente entero porque todo lo que importa aquí depende del reloj y de la
 * zona horaria del navegador, y ninguna de las dos cosas las sabe el
 * servidor. Lo único que hace el servidor es resolver el idioma y el texto.
 */

import { useEffect, useMemo, useState } from "react";
import { Globe, Users } from "lucide-react";
import { TALLERES } from "@/lib/catalogs/talleres";
import { resolveTimeZone } from "@/lib/community/schedule";
import type { ComunidadDict } from "@/lib/i18n/dictionaries/comunidad";
import { ModuleIcon } from "@/components/module-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkshopDoor } from "./workshop-door";

const UTAH = "America/Denver";

export type CommunityScreenProps = {
  lang: string;
  copy: ComunidadDict;
};

export function CommunityScreen({ lang, copy }: CommunityScreenProps) {
  /**
   * Arranca con la zona del taller y se corrige tras montar.
   *
   * Nunca se pregunta por IP: el navegador ya sabe su zona, es más exacto
   * que la geolocalización, no pide permiso y no cuesta un dato. En un
   * producto cuyo argumento entero es "no te sacamos información", pedir la
   * ubicación para algo que ya se sabe sería un autogol.
   */
  const [zone, setZone] = useState(UTAH);
  useEffect(() => setZone(resolveTimeZone(UTAH)), []);

  const [ahora, setAhora] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setAhora(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const horaUtah = useMemo(() => {
    if (!ahora) return null;
    return new Intl.DateTimeFormat(lang, {
      timeZone: UTAH,
      hour: "numeric",
      minute: "2-digit",
    }).format(ahora);
  }, [ahora, lang]);

  // "America/Denver" no le dice nada a nadie: se enseña la ciudad.
  const zonaLegible = zone.split("/").pop()?.replace(/_/g, " ") ?? zone;

  const puertaCopy = { ...copy.door, nextDay: copy.timezone.nextDay, prevDay: copy.timezone.prevDay };

  return (
    <article className="mx-auto w-full max-w-4xl">
      <header className="flex items-start gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-teal-soft text-teal-deep sm:size-12"
        >
          <ModuleIcon slug="comunidad" size={24} />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-h2 text-ink sm:text-h1">{copy.title}</h1>
          <p className="mt-1 text-body text-muted sm:text-body-lg">{copy.subtitle}</p>
        </div>
      </header>

      {/* ── La franja horaria ──
          Lo primero que se lee, porque es lo que hace que alguien en Manila
          o en Nueva York no se pierda el taller por confundir la hora. Se
          enseña también la de Utah: la referencia común mantiene a todo el
          mundo hablando del mismo momento. */}
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-line bg-surface-alt px-4 py-3">
        <p className="flex items-center gap-2 text-body text-ink">
          <Globe aria-hidden="true" className="size-4 shrink-0 text-teal-deep" />
          {copy.timezone.detected.replace("{zone}", zonaLegible)}
        </p>
        {horaUtah ? (
          <p className="text-caption text-muted">
            {copy.timezone.utahReference.replace("{time}", horaUtah)}
          </p>
        ) : null}
      </div>

      {/* ── Las puertas ── */}
      {TALLERES.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {TALLERES.map((taller) => {
            const textos = copy.workshops[taller.slug as keyof typeof copy.workshops];
            if (!textos) return null;
            return (
              <WorkshopDoor
                key={taller.id}
                workshop={taller}
                title={textos.title}
                summary={textos.summary}
                caveat={textos.caveat}
                copy={puertaCopy}
                lang={lang}
                userZone={zone}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Users />}
          title={copy.empty.title}
          description={copy.empty.body}
          className="mt-6 rounded-xl border border-dashed border-line bg-surface"
        />
      )}

      {/* Obligatorio por §6, y aquí más que nunca: un taller sobre cartas de
          USCIS es exactamente donde alguien podría creer que ANDEX habla en
          nombre del gobierno. */}
      <p className="mt-8 rounded-lg border border-line bg-amber-soft px-4 py-3 text-caption text-ink">
        {copy.disclaimer}
      </p>
    </article>
  );
}
