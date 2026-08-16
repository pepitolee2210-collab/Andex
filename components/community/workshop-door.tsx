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
 * Que el botón NO exista hasta que la sala abre es lo que hace que valga
 * algo cuando aparece. Ahí está la exclusividad, no en el CSS.
 *
 * ── La forma, del sistema de diseño ──
 *
 * Tres pesos de tarjeta, y no por capricho:
 *
 *   `card-lift`     la sala que está abierta AHORA (filete teal)
 *   `ax-card`       la que tiene fecha y todavía no toca (plana)
 *   `card-pending`  la que ni siquiera tiene fecha (contorno fino, título apagado)
 *
 * El punto verde (`LiveDot`) sale sólo cuando la sala está abierta de
 * verdad, y NUNCA va solo: siempre lleva su texto al lado. Un color sin
 * palabra no lo lee ni quien no distingue el verde ni quien mira de reojo.
 *
 * ── El reloj vive fuera ──
 *
 * El estado entra por props. Lo calcula la pantalla, que tiene un solo
 * intervalo para todas las puertas: N tarjetas con su propio `setInterval`
 * son N despertadores en un teléfono de gama media.
 */

import { Bell, Check, Lock, Video } from "lucide-react";
import {
  calendarDateIn,
  crossesDay,
  type DoorState,
  type Workshop,
} from "@/lib/community/schedule";
import {
  Glyph,
  Initials,
  InitialsStack,
  KitButton,
  KitCard,
  KitNotice,
  LiveDot,
} from "@/components/ui/kit";
import { cn } from "@/lib/utils";

export type DoorCopy = {
  closed: string;
  opening: string;
  live: string;
  undated: string;
  duration: string;
  join: string;
  noLink: string;
  noLinkWhy: string;
  buttonLater: string;
  remindMe: string;
  reminded: string;
  notifyDate: string;
  notifyDateDone: string;
  undatedNote: string;
  countdownDays: string;
  countdownHours: string;
  countdownMinutes: string;
  inside: string;
  signedUp: string;
  nextDay: string;
  prevDay: string;
};

/**
 * Quién conduce el taller.
 *
 * Vive en `lib/catalogs/talleres.ts` y hoy vale `null` en las dos series:
 * `hostCredential` no es adorno de currículum, es lo que decide qué puede
 * prometer el copy. Mientras no haya alguien habilitado confirmado, la fila
 * no se pinta — antes que inventar a una persona, no hay persona.
 */
export type WorkshopHost = {
  hostName?: string | null;
  hostCredential?: string | null;
};

/**
 * Presencia real en la sala.
 *
 * Existe el hueco, no el dato: la tabla `workshop_enrollments` está en
 * `0007_comunidad.sql` y todavía no la lee nadie. Sin esta prop no se pinta
 * ninguna cuenta, que es lo correcto — un «23 apuntadas» inventado es
 * justo el patrón que el PRD veta.
 */
export type WorkshopPresence = {
  /** Iniciales, nunca retratos: no inventamos caras. */
  initials: readonly string[];
  count: number;
  /** `true` = ya están dentro; `false` = apuntadas para después. */
  inside?: boolean;
};

export type WorkshopDoorProps = {
  workshop: Workshop & WorkshopHost;
  /** Lo calcula la pantalla. `null` mientras el reloj del navegador arranca. */
  state: DoorState | null;
  title: string;
  summary: string;
  caveat: string;
  copy: DoorCopy;
  lang: string;
  /** Zona del usuario, ya resuelta por el contenedor. */
  userZone: string;
  /** En «esta semana» el día va delante de la hora; en «hoy» sobra. */
  showDay?: boolean;
  signedUp?: boolean;
  onSignUp?: () => void;
  attendees?: WorkshopPresence;
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

/** «Rocío Alcántara» → «RA». Dos letras como mucho: más no se leen a 34px. */
function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toUpperCase();
}

export function WorkshopDoor({
  workshop,
  state,
  title,
  summary,
  caveat,
  copy,
  lang,
  userZone,
  showDay,
  signedUp,
  onSignUp,
  attendees,
  className,
}: WorkshopDoorProps) {
  const session = state && state.kind !== "none" ? state.session : null;
  const live = state?.kind === "live";
  /** Lo que está pasando ahora: en vivo o a punto de abrir. */
  const abierta = state?.kind === "live" || state?.kind === "opening";
  const sinFecha = state?.kind === "none";

  /**
   * `hour12` se fuerza a propósito.
   *
   * En `es-MX` el motor resuelve el reloj de 24 horas y escribe «19:00».
   * Este producto se usa en Estados Unidos, donde nadie dice «las
   * diecinueve»: el cartel de la iglesia, el mensaje de WhatsApp y el
   * volante del taller dicen «7:00 p.m.». Dejarlo al motor obliga a quien
   * mira a traducir la hora antes de saber si llega.
   */
  const fmtHora = new Intl.DateTimeFormat(lang, {
    timeZone: userZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const fmtDia = new Intl.DateTimeFormat(lang, {
    timeZone: userZone,
    weekday: "long",
    day: "numeric",
  });

  const duracion = fill(copy.duration, {
    n: Math.max(0, workshop.endMinutes - workshop.startMinutes),
  });

  /** El sobretítulo: cuándo es, o que ya está pasando. */
  const cabecera = ((): string => {
    if (!state) return copy.closed;
    switch (state.kind) {
      case "live":
        return `${copy.live} · ${duracion}`;
      case "opening":
        return fill(copy.opening, { time: countdown(state.msToStart, copy) });
      case "none":
        return copy.undated;
      default:
        return [
          showDay ? fmtDia.format(state.session.startsAt) : null,
          fmtHora.format(state.session.startsAt),
          duracion,
        ]
          .filter(Boolean)
          .join(" · ");
    }
  })();

  /**
   * Sólo se avisa del salto de día cuando de verdad lo hay, y se dice hacia
   * qué lado. Es el error que hace que alguien pierda el taller por 24 horas
   * enteras: las 6 de la tarde del martes en Utah son las 9 de la mañana del
   * MIÉRCOLES en Manila.
   */
  const salto = ((): string | null => {
    if (!session) return null;
    if (!crossesDay(session, userZone, workshop.timeZone)) return null;
    const mio = calendarDateIn(session.startsAt, userZone);
    const suyo = calendarDateIn(session.startsAt, workshop.timeZone);
    const despues =
      mio.year > suyo.year ||
      (mio.year === suyo.year &&
        (mio.month > suyo.month || (mio.month === suyo.month && mio.day > suyo.day)));
    return despues ? copy.nextDay : copy.prevDay;
  })();

  const entrar = abierta && workshop.joinUrl !== null;
  const nota = sinFecha ? copy.undatedNote : session && !abierta ? copy.buttonLater : null;
  const hayFila = entrar || !abierta || attendees !== undefined;

  return (
    <KitCard
      tone={abierta ? "lift" : sinFecha ? "pending" : undefined}
      /* El diseño aprieta un punto las tarjetas que no están pasando ahora:
         20px la sala abierta, 18px el resto. */
      className={cn(!abierta && "p-[18px]", className)}
    >
      {live ? (
        <p className="flex items-center gap-2">
          <LiveDot />
          <span className="min-w-0 text-micro uppercase text-success">{cabecera}</span>
        </p>
      ) : (
        <p
          className={cn(
            "text-micro uppercase",
            abierta ? "text-success" : sinFecha ? "text-disabled" : "text-ink",
          )}
        >
          {cabecera}
        </p>
      )}

      <p
        className={cn(
          "mt-2 text-pretty font-bold leading-[1.24] tracking-[-0.018em]",
          abierta ? "text-[21px]" : "text-[18px]",
          sinFecha ? "text-muted" : "text-ink",
        )}
      >
        {title}
      </p>

      <p className="mt-2 text-pretty text-body leading-[1.45] text-muted">{summary}</p>

      {/* ── Quién lo conduce ──
          Iniciales en tipografía, nunca un retrato: no inventamos caras. */}
      {workshop.hostName ? (
        <div className="mt-3.5 flex items-center gap-[11px]">
          <Initials accent={abierta}>{iniciales(workshop.hostName)}</Initials>
          <span className="min-w-0">
            <span className="block text-[16px] font-semibold leading-[1.25] text-ink">
              {workshop.hostName}
            </span>
            {workshop.hostCredential ? (
              <span className="mt-0.5 block text-pretty text-label leading-[1.35] text-disabled">
                {workshop.hostCredential}
              </span>
            ) : null}
          </span>
        </div>
      ) : null}

      {/* ── La puerta, y quién está al otro lado ── */}
      {hayFila ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-[13px]">
          {entrar && workshop.joinUrl ? (
            /* Un enlace, no un botón: la sala vive fuera de ANDEX y tiene
               que poder abrirse en otra pestaña. Lleva las clases del
               sistema porque `KitButton` sólo sabe dibujar `<button>`.
               El enlace se usa tal cual, sin añadirle ni un dato de quien
               entra: §9 — nada del usuario viaja en una URL. */
            <a
              href={workshop.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn btn-accent btn-sm"
            >
              <Glyph name="video" icon={Video} size={17} strokeWidth={2} />
              {copy.join}
            </a>
          ) : !abierta ? (
            /* Confirmación en el sitio: el mismo botón cambia de estado, sin
               aviso flotante ni ventana. Vuelve atrás si se toca otra vez. */
            <div role="status">
              <KitButton
                size="sm"
                kind={sinFecha || signedUp ? "quiet" : "ghost"}
                /* Sin fecha el botón es la única acción de la tarjeta y se
                   ve; con fecha compite con el título, así que va desnudo
                   —como en el diseño— pero conserva sus 44px y su hundido. */
                className={sinFecha || signedUp ? undefined : "shadow-none"}
                iconName={signedUp ? "check" : "bell"}
                icon={signedUp ? Check : Bell}
                onClick={onSignUp}
              >
                {sinFecha
                  ? signedUp
                    ? copy.notifyDateDone
                    : copy.notifyDate
                  : signedUp
                    ? copy.reminded
                    : copy.remindMe}
              </KitButton>
            </div>
          ) : null}

          {attendees ? (
            <span className="flex shrink-0 items-center gap-2">
              <InitialsStack>
                {attendees.initials.slice(0, 2).map((i) => (
                  <Initials key={i}>{i}</Initials>
                ))}
              </InitialsStack>
              <span className="whitespace-nowrap text-label text-muted">
                {fill(attendees.inside ? copy.inside : copy.signedUp, { n: attendees.count })}
              </span>
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Sala abierta y todavía sin enlace. Se dice, en vez de pintar un
          botón que no lleva a ninguna parte: eso gasta la confianza que
          este producto no puede permitirse gastar. */}
      {abierta && !workshop.joinUrl ? (
        <KitNotice iconName="lock" icon={Lock} className="mt-4">
          {copy.noLink}
        </KitNotice>
      ) : null}

      {nota ? (
        <p className="mt-3 text-pretty text-label leading-[1.45] text-disabled">{nota}</p>
      ) : null}

      {salto ? (
        <p className="mt-3 text-pretty text-label font-semibold leading-[1.45] text-warning">
          {salto}
        </p>
      ) : null}

      {/* El límite, siempre visible y en la misma tarjeta que la promesa. */}
      <p className="mt-3 border-t border-line pt-3 text-pretty text-label leading-[1.45] text-disabled">
        {caveat}
      </p>
    </KitCard>
  );
}
