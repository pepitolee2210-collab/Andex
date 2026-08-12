/**
 * TALLERES — cuándo ocurre cada sesión, y en la hora de quien mira.
 *
 * Módulo PURO: sin React, sin i18n, sin `Date.now()` implícito. La hora
 * actual SIEMPRE entra por parámetro, porque si no estas funciones no se
 * pueden probar y este es exactamente el código que se rompe en silencio.
 *
 * ── Las tres cosas que rompen un horario internacional ──
 *
 *  1. **Utah cambia de hora.** Es horario de montaña: UTC−7 en invierno y
 *     UTC−6 en verano. Guardar "las 6 de la tarde son las 01:00 UTC" hace
 *     que medio año el taller salga a la hora equivocada. Aquí se guarda la
 *     hora de pared más la zona (`America/Denver`) y el desfase se calcula
 *     para cada fecha concreta.
 *  2. **Cambia el DÍA, no sólo la hora.** Las 6 de la tarde del martes en
 *     Utah son las 9 de la mañana del MIÉRCOLES en Manila. Enseñar sólo
 *     "9:00" hace que alguien pierda el taller por un día entero.
 *  3. **La zona del usuario se pregunta al navegador, no a su IP.** El
 *     navegador ya la sabe, es más exacta que la geolocalización y no cuesta
 *     ni un permiso ni un dato. En un producto cuyo argumento es "no te
 *     sacamos información", pedir la ubicación para algo que ya se sabe
 *     sería un autogol.
 */

/** 0 = domingo, 1 = lunes… 6 = sábado (igual que `Date.getUTCDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Un taller recurrente.
 *
 * Todo son datos planos y serializables a propósito: el día que exista el
 * panel de administración, escribirá exactamente esta forma en la base de
 * datos y nada más tendrá que cambiar.
 */
export type Workshop = {
  id: string;
  /** Días en los que se repite, en la zona del taller. */
  weekdays: readonly Weekday[];
  /** Minutos desde medianoche, hora de pared del taller. 18:00 → 1080. */
  startMinutes: number;
  endMinutes: number;
  /** Zona IANA. Nunca un desfase fijo: el desfase cambia dos veces al año. */
  timeZone: string;
  /**
   * Enlace de la sesión. `null` mientras no esté publicado, y el botón de
   * entrar no existe. Es deliberado: un enlace fijo y permanente deja entrar
   * para siempre a cualquiera que lo consiga una vez, y en una sala donde se
   * habla de casos de inmigración eso tiene consecuencias reales.
   */
  joinUrl: string | null;
};

/** Cuánto antes se abre la sala. */
export const DOORS_OPEN_MS = 15 * 60 * 1000;

/**
 * Cuántos milisegundos va la zona por delante de UTC en ese instante.
 *
 * No hay API directa, así que se formatea el instante en la zona, se lee la
 * hora de pared resultante y se compara con la de UTC. La diferencia es el
 * desfase vigente ESE día, con su horario de verano ya aplicado.
 */
export function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  const wall = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    // Algunos motores devuelven "24" para la medianoche.
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return wall - instant.getTime();
}

/**
 * Convierte una hora de pared de una zona en el instante absoluto.
 *
 * Se itera dos veces: el desfase del primer intento puede no ser el que rige
 * en la fecha resultante —justo en el fin de semana del cambio de hora— y
 * una segunda pasada ya converge.
 */
export function wallTimeToInstant(
  year: number,
  month: number,
  day: number,
  minutes: number,
  timeZone: string,
): Date {
  const asUtc = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60);
  let instant = asUtc - zoneOffsetMs(new Date(asUtc), timeZone);
  instant = asUtc - zoneOffsetMs(new Date(instant), timeZone);
  return new Date(instant);
}

/** La fecha de calendario (año, mes, día) que se ve en esa zona. */
export function calendarDateIn(instant: Date, timeZone: string): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export type Session = { startsAt: Date; endsAt: Date };

/**
 * La próxima sesión que todavía no ha terminado.
 *
 * Una sesión EN CURSO cuenta como la próxima: quien abre la app a las 18:30
 * quiere entrar ahora, no enterarse de la de mañana.
 *
 * Se recorren días de calendario en la zona DEL TALLER, no en la del
 * usuario. Es la misma razón del punto 2 de arriba: para alguien en Manila
 * ya es miércoles cuando en Utah sigue siendo el martes del taller.
 */
export function nextSession(workshop: Workshop, now: Date): Session | null {
  if (workshop.weekdays.length === 0) return null;

  const today = calendarDateIn(now, workshop.timeZone);

  // 14 días de margen: cubre de sobra cualquier hueco entre repeticiones.
  for (let offset = 0; offset < 14; offset += 1) {
    const probe = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
    const weekday = probe.getUTCDay() as Weekday;
    if (!workshop.weekdays.includes(weekday)) continue;

    const y = probe.getUTCFullYear();
    const m = probe.getUTCMonth() + 1;
    const d = probe.getUTCDate();

    const startsAt = wallTimeToInstant(y, m, d, workshop.startMinutes, workshop.timeZone);
    const endsAt = wallTimeToInstant(y, m, d, workshop.endMinutes, workshop.timeZone);

    if (endsAt.getTime() > now.getTime()) return { startsAt, endsAt };
  }

  return null;
}

/**
 * En qué estado está la puerta.
 *
 * `live` sólo si además hay enlace: prometer "entrar ahora" y no tener a
 * dónde llevar a nadie es peor que no prometer nada.
 */
export type DoorState =
  | { kind: "none" }
  | { kind: "closed"; session: Session; msToStart: number }
  | { kind: "opening"; session: Session; msToStart: number }
  | { kind: "live"; session: Session; msToEnd: number };

export function doorState(workshop: Workshop, now: Date): DoorState {
  const session = nextSession(workshop, now);
  if (!session) return { kind: "none" };

  const msToStart = session.startsAt.getTime() - now.getTime();
  if (msToStart <= 0) {
    return { kind: "live", session, msToEnd: session.endsAt.getTime() - now.getTime() };
  }
  if (msToStart <= DOORS_OPEN_MS) return { kind: "opening", session, msToStart };
  return { kind: "closed", session, msToStart };
}

/**
 * Zona horaria del navegador.
 *
 * Nunca la IP. Si el motor no la da —muy raro— se cae a la del taller, que
 * al menos enseña una hora correcta aunque no sea la suya.
 */
export function resolveTimeZone(fallback: string): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

/** ¿La sesión cae en un día distinto para el usuario que para el taller? */
export function crossesDay(session: Session, userZone: string, workshopZone: string): boolean {
  const a = calendarDateIn(session.startsAt, userZone);
  const b = calendarDateIn(session.startsAt, workshopZone);
  return a.year !== b.year || a.month !== b.month || a.day !== b.day;
}

/**
 * Las próximas N sesiones.
 *
 * El panel de administración las genera por adelantado para poder pegarle a
 * cada una SU enlace de Zoom. Es la razón entera de que sesión y serie sean
 * cosas distintas: sin esto habría que reutilizar un enlace fijo, que es
 * justo lo que no se puede hacer.
 */
export function upcomingSessions(
  workshop: Workshop,
  now: Date,
  count: number,
): Session[] {
  const out: Session[] = [];
  let cursor = now;
  for (let i = 0; i < count; i += 1) {
    const s = nextSession(workshop, cursor);
    if (!s) break;
    out.push(s);
    // Un milisegundo después del final: así la siguiente vuelta no vuelve a
    // devolver la misma sesión.
    cursor = new Date(s.endsAt.getTime() + 1);
  }
  return out;
}
