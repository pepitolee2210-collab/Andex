"use client";

/**
 * INGLÉS PARA EL TRABAJO — la pantalla del módulo.
 *
 * Tres bloques, en el orden en que sirven:
 *
 *  1. **El argumento**, una vez y corto: esto no es un curso de inglés.
 *  2. **La clase en vivo**, con su puerta y su horario en la hora de quien
 *     mira. Va antes que el temario porque es lo único que tiene fecha: si
 *     hay clase hoy, es lo primero que se necesita saber.
 *  3. **Los temarios**, para estudiar solo entre clase y clase.
 *
 * La puerta es EL MISMO componente que usa Comunidad. No es ahorro de
 * código: es que una sesión en vivo se comporta igual esté donde esté —los
 * mismos cuatro estados, la misma cuenta atrás, la misma regla de no enseñar
 * un botón sin sala—. Duplicarla haría que dentro de seis meses se
 * comportaran distinto sin que nadie lo decidiera.
 */

import { OsHeader } from "@/components/os/primitives";
import { ROUTES } from "@/lib/config";
import { useEffect, useState } from "react";
import { GraduationCap, Sparkles } from "lucide-react";
import { RUTAS_POR_OFICIO, RUTAS_TRANSVERSALES } from "@/lib/catalogs/ingles";
import { resolveTimeZone, type Workshop } from "@/lib/community/schedule";
import type { AcademiaDict } from "@/lib/i18n/dictionaries/academia";
import { ModuleIcon } from "@/components/module-icon";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkshopDoor, type DoorCopy } from "@/components/community/workshop-door";
import { TrackCard } from "./track-card";

const UTAH = "America/Denver";

export type AcademiaScreenProps = {
  lang: string;
  copy: AcademiaDict;
  /** La serie de la clase de inglés, del mismo catálogo que Comunidad. */
  workshop: Workshop | null;
  workshopTitle: string;
  workshopSummary: string;
  workshopCaveat: string;
  doorCopy: DoorCopy;
};

export function AcademiaScreen({
  lang,
  copy,
  workshop,
  workshopTitle,
  workshopSummary,
  workshopCaveat,
  doorCopy,
}: AcademiaScreenProps) {
  // Del navegador, nunca de la IP. Ver `lib/community/schedule.ts`.
  const [zone, setZone] = useState(UTAH);
  useEffect(() => setZone(resolveTimeZone(UTAH)), []);

  return (
    <article className="mx-auto w-full max-w-4xl">
      {/* La cabecera del sistema: la misma en las cuatro pantallas, para
          que entrar en una no se sienta como cambiar de aplicación. */}
      <OsHeader
        title={copy.title}
        subtitle={copy.subtitle}
        backHref={ROUTES.panel}
        backLabel={copy.back}
        className="px-0"
      />

      {/* ── El argumento ──
          Una sola vez, arriba. Quien ya lo entendió no vuelve a leerlo
          porque baja directo al temario. */}
      <section
        aria-labelledby="academia-por-que"
        className="mt-5 rounded-xl border border-line bg-teal-soft p-4 shadow-sm sm:p-5"
      >
        <p className="flex items-center gap-2 text-caption font-bold uppercase tracking-widest text-teal-deep">
          <Sparkles aria-hidden="true" className="size-4" />
          {copy.pitch.badge}
        </p>
        <h2 id="academia-por-que" className="mt-2 font-heading text-h2 text-ink">
          {copy.pitch.headline}
        </h2>
        <p className="mt-2 text-body text-ink">{copy.pitch.body}</p>
        <p className="mt-3 border-t border-line pt-3 text-body font-medium text-ink">
          {copy.pitch.highlight}
        </p>
      </section>

      {/* ── La clase en vivo ── */}
      {workshop ? (
        <section aria-labelledby="academia-clases" className="mt-8">
          <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
            {copy.classes.eyebrow}
          </p>
          <h2 id="academia-clases" className="mt-1 font-heading text-h2 text-ink">
            {copy.classes.title}
          </h2>
          <p className="mt-1 text-body text-muted">{copy.classes.body}</p>
          <WorkshopDoor
            workshop={workshop}
            title={workshopTitle}
            summary={workshopSummary}
            caveat={workshopCaveat}
            copy={doorCopy}
            lang={lang}
            userZone={zone}
            className="mt-4"
          />
        </section>
      ) : null}

      {/* ── Lo que le sirve a todo el mundo ──
          VA PRIMERO, y es una decisión de producto: nadie sabe que necesita
          saber qué hacer cuando no le pagan o cuando algo es peligroso. Si
          esto se pone debajo de los oficios, sólo lo encuentra quien ya
          sabía que existía — o sea, casi nadie. */}
      {RUTAS_TRANSVERSALES.length > 0 ? (
        <section aria-labelledby="academia-todos" className="mt-10">
          <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
            {copy.tracks.everyoneEyebrow}
          </p>
          <h2 id="academia-todos" className="mt-1 font-heading text-h2 text-ink">
            {copy.tracks.everyoneTitle}
          </h2>
          <p className="mt-1 max-w-2xl text-body text-muted">{copy.tracks.everyoneBody}</p>
          <div className="mt-4 space-y-3">
            {RUTAS_TRANSVERSALES.map((track) => (
              <TrackCard key={track.id} track={track} copy={copy} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Los temarios por oficio ── */}
      <section aria-labelledby="academia-temarios" className="mt-10">
        <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
          {copy.tracks.eyebrow}
        </p>
        <h2 id="academia-temarios" className="mt-1 font-heading text-h2 text-ink">
          {copy.tracks.title}
        </h2>
        <p className="mt-1 max-w-2xl text-body text-muted">{copy.tracks.byTradeBody}</p>

        {RUTAS_POR_OFICIO.length > 0 ? (
          <div className="mt-4 space-y-3">
            {RUTAS_POR_OFICIO.map((track) => (
              <TrackCard key={track.id} track={track} copy={copy} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<GraduationCap />}
            title={copy.tracks.empty}
            className="mt-4 rounded-xl border border-dashed border-line bg-surface"
          />
        )}
      </section>
    </article>
  );
}
