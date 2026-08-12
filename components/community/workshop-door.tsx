"use client";

/**
 * LA PUERTA — una sesión de taller, con sus cuatro estados.
 *
 * El encargo era que se sintiera exclusivo. La decisión de diseño que hay
 * detrás: para alguien a quien ya le vendieron humo, **exclusivo no es
 * lujoso, es cierto**. Los degradados y el cristal esmerilado le dicen
 * "esto es marketing"; lo que le hace sentir que entra a algo importante es
 * saber que la sala existe, que va a pasar a una hora concreta y que tiene
 * un sitio dentro.
 *
 * De ahí que la tarjeta SEA la puerta, con estados que avanzan solos:
 *
 *   cerrada  → el horario, la cuenta atrás en días
 *   abriendo → 15 min antes, cuenta atrás viva al segundo
 *   en vivo  → late, y aparece el botón
 *   terminada→ dice cuándo es la próxima
 *
 * Que el botón NO exista hasta que la sala abre es lo que hace que valga
 * algo cuando aparece. Ahí está la exclusividad, no en el CSS.
 */

import { useEffect, useState } from "react";
import { ArrowRight, Clock, Lock, Radio, ShieldCheck } from "lucide-react";
import {
  DOORS_OPEN_MS,
  crossesDay,
  doorState,
  type DoorState,
  type Workshop,
} from "@/lib/community/schedule";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DoorCopy = {
  closed: string;
  opening: string;
  live: string;
  join: string;
  noLink: string;
  noLinkWhy: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  endsAt: string;
  nextDay: string;
  prevDay: string;
};

export type WorkshopDoorProps = {
  workshop: Workshop;
  title: string;
  summary: string;
  caveat: string;
  copy: DoorCopy;
  lang: string;
  /** Zona del usuario, ya resuelta por el contenedor. */
  userZone: string;
  className?: string;
};

const fill = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

function countdown(ms: number, copy: DoorCopy): string {
  const min = Math.max(0, Math.floor(ms / 60_000));
  if (min >= 1440) return fill(copy.countdownDays, { n: Math.floor(min / 1440) });
  if (min >= 60) return fill(copy.countdownHours, { n: Math.floor(min / 60), m: min % 60 });
  return fill(copy.countdownMinutes, { n: min });
}

export function WorkshopDoor({
  workshop,
  title,
  summary,
  caveat,
  copy,
  lang,
  userZone,
  className,
}: WorkshopDoorProps) {
  /**
   * `null` en el primer render, siempre.
   *
   * El estado depende de la hora actual, y el servidor y el navegador no
   * comparten reloj: calcularlo en el servidor haría que React encontrara
   * un HTML distinto al hidratar. Además nadie debería ver una cuenta atrás
   * congelada en el instante en que se generó la página.
   */
  const [state, setState] = useState<DoorState | null>(null);

  useEffect(() => {
    const tick = () => setState(doorState(workshop, new Date()));
    tick();
    // Cada segundo sólo cuando la sala está por abrir; el resto del tiempo
    // basta cada minuto. Una cuenta atrás de tres días refrescada al
    // segundo es batería tirada en el teléfono al que apunta el producto.
    const next = doorState(workshop, new Date());
    const fino = next.kind === "opening" || next.kind === "live";
    const id = setInterval(tick, fino ? 1000 : 30_000);
    return () => clearInterval(id);
  }, [workshop]);

  const fmtHora = new Intl.DateTimeFormat(lang, {
    timeZone: userZone,
    hour: "numeric",
    minute: "2-digit",
  });
  const fmtDia = new Intl.DateTimeFormat(lang, {
    timeZone: userZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const session = state && state.kind !== "none" ? state.session : null;
  const live = state?.kind === "live";
  const opening = state?.kind === "opening";

  // Sólo se avisa del salto de día cuando de verdad lo hay. Es el error que
  // hace que alguien pierda el taller por 24 horas enteras.
  const salto = session ? crossesDay(session, userZone, workshop.timeZone) : false;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-colors",
        live
          ? "border-teal-deep bg-teal-soft shadow-lg"
          : opening
            ? "border-amber-deep/40 bg-amber-soft"
            : "border-line bg-surface shadow-sm",
        className,
      )}
    >
      {/* El pulso de "en vivo". `motion-reduce` lo apaga: un latido continuo
          es justo lo que §2.5 manda poder desactivar. */}
      {live ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 animate-pulse bg-teal-deep motion-reduce:animate-none"
        />
      ) : null}

      <div className="p-5 sm:p-6">
        {/* ── Estado ── */}
        <p
          className={cn(
            "flex items-center gap-2 text-caption font-bold uppercase tracking-widest",
            live ? "text-teal-deep" : opening ? "text-amber-deep" : "text-muted",
          )}
        >
          {live ? (
            <>
              <Radio aria-hidden="true" className="size-4 animate-pulse motion-reduce:animate-none" />
              {copy.live}
            </>
          ) : opening && state?.kind === "opening" ? (
            <>
              <Clock aria-hidden="true" className="size-4" />
              {fill(copy.opening, { time: countdown(state.msToStart, copy) })}
            </>
          ) : (
            <>
              <Clock aria-hidden="true" className="size-4" />
              {copy.closed}
            </>
          )}
        </p>

        <h3 className="mt-2 font-heading text-h3 text-ink">{title}</h3>
        <p className="mt-1.5 text-body text-muted">{summary}</p>

        {/* ── Cuándo, en SU hora ── */}
        {session ? (
          <div className="mt-4 rounded-lg border border-line bg-page px-4 py-3">
            <p className="text-body font-semibold capitalize text-ink">
              {fmtDia.format(session.startsAt)}
            </p>
            <p className="mt-0.5 text-body text-ink">
              {fmtHora.format(session.startsAt)} – {fmtHora.format(session.endsAt)}
            </p>
            {salto ? (
              <p className="mt-1.5 text-caption font-medium text-amber-deep">{copy.nextDay}</p>
            ) : null}
          </div>
        ) : (
          /* Reserva el hueco mientras el reloj del cliente arranca, para
             que la tarjeta no dé un salto al hidratar. */
          <div className="mt-4 h-[86px] rounded-lg border border-line bg-page" aria-hidden="true" />
        )}

        {/* ── La puerta ── */}
        <div className="mt-5">
          {workshop.joinUrl && (live || opening) ? (
            <Button href={workshop.joinUrl} size="lg" fullWidth className="group">
              {copy.join}
              <ArrowRight
                aria-hidden="true"
                className="ml-1 size-5 transition-transform duration-200 group-hover:translate-x-1"
              />
            </Button>
          ) : (
            /* Sin enlace no hay botón, y se dice por qué. Un botón que no
               lleva a ninguna parte gasta la confianza que este producto no
               puede permitirse gastar. */
            <div className="rounded-lg border border-dashed border-line px-4 py-3">
              <p className="flex items-center gap-2 text-body text-muted">
                <Lock aria-hidden="true" className="size-4 shrink-0" />
                {copy.noLink}
              </p>
              <p className="mt-1 text-caption text-muted">{copy.noLinkWhy}</p>
            </div>
          )}
        </div>

        {/* ── El límite, siempre visible ── */}
        <p className="mt-4 flex items-start gap-2 border-t border-line pt-3 text-caption text-muted">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">{caveat}</span>
        </p>
      </div>
    </article>
  );
}

export { DOORS_OPEN_MS };
