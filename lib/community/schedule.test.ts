/**
 * Pruebas del horario de los talleres.
 *
 * Es aritmética de fechas con zonas horarias: el código que más
 * silenciosamente se equivoca de todo el proyecto. Un fallo aquí no rompe
 * nada visiblemente, sólo hace que alguien se conecte una hora tarde y se
 * pierda el taller.
 */

import { describe, expect, it } from "vitest";
import {
  DOORS_OPEN_MS,
  calendarDateIn,
  crossesDay,
  doorState,
  nextSession,
  wallTimeToInstant,
  zoneOffsetMs,
  type Workshop,
} from "./schedule";

const UTAH = "America/Denver";

/** Martes a viernes, 18:00–20:00 hora de Utah. */
const TALLER: Workshop = {
  id: "prueba",
  weekdays: [2, 3, 4, 5],
  startMinutes: 18 * 60,
  endMinutes: 20 * 60,
  timeZone: UTAH,
  joinUrl: "https://example.test/sala",
};

describe("desfase de la zona", () => {
  it("Utah está a UTC-7 en invierno", () => {
    expect(zoneOffsetMs(new Date("2026-01-15T12:00:00Z"), UTAH)).toBe(-7 * 3600_000);
  });

  it("y a UTC-6 en verano", () => {
    // Es el fallo clásico: guardar el desfase una vez y darlo por bueno
    // todo el año hace que medio año el taller salga a la hora equivocada.
    expect(zoneOffsetMs(new Date("2026-07-15T12:00:00Z"), UTAH)).toBe(-6 * 3600_000);
  });
});

describe("hora de pared a instante absoluto", () => {
  it("las 18:00 de un martes de invierno son la 01:00 UTC del miércoles", () => {
    const t = wallTimeToInstant(2026, 1, 13, 18 * 60, UTAH);
    expect(t.toISOString()).toBe("2026-01-14T01:00:00.000Z");
  });

  it("las 18:00 de un martes de verano son las 00:00 UTC del miércoles", () => {
    const t = wallTimeToInstant(2026, 7, 14, 18 * 60, UTAH);
    expect(t.toISOString()).toBe("2026-07-15T00:00:00.000Z");
  });

  it("sigue siendo las 18:00 el día que cambia la hora", () => {
    // En 2026 el horario de verano de EE. UU. empieza el 8 de marzo.
    // El salto es a las 2 de la madrugada, así que las 18:00 existen y no
    // son ambiguas, pero el desfase del día YA cambió.
    const antes = wallTimeToInstant(2026, 3, 7, 18 * 60, UTAH);
    const despues = wallTimeToInstant(2026, 3, 8, 18 * 60, UTAH);
    expect(antes.toISOString()).toBe("2026-03-08T01:00:00.000Z");
    expect(despues.toISOString()).toBe("2026-03-09T00:00:00.000Z");
    // De un día para otro, 23 horas de diferencia y no 24.
    expect(despues.getTime() - antes.getTime()).toBe(23 * 3600_000);
  });
});

describe("próxima sesión", () => {
  it("un lunes, la próxima es el martes", () => {
    // Lunes 12 de enero de 2026, mediodía en Utah.
    const ahora = new Date("2026-01-12T19:00:00Z");
    const s = nextSession(TALLER, ahora)!;
    expect(calendarDateIn(s.startsAt, UTAH)).toEqual({ year: 2026, month: 1, day: 13 });
  });

  it("un viernes por la noche salta al martes siguiente", () => {
    // El fin de semana no hay taller: el cálculo tiene que dar la vuelta a
    // la semana, no devolver el sábado.
    const ahora = new Date("2026-01-17T05:00:00Z"); // viernes 22:00 en Utah
    const s = nextSession(TALLER, ahora)!;
    expect(calendarDateIn(s.startsAt, UTAH)).toEqual({ year: 2026, month: 1, day: 20 });
  });

  it("durante la sesión, la próxima es la que está ocurriendo", () => {
    // Quien abre la app a las 18:30 quiere entrar AHORA, no enterarse de
    // la de mañana.
    const ahora = new Date("2026-01-14T01:30:00Z"); // martes 18:30 en Utah
    const s = nextSession(TALLER, ahora)!;
    expect(s.startsAt.toISOString()).toBe("2026-01-14T01:00:00.000Z");
  });

  it("justo al terminar ya apunta a la siguiente", () => {
    const ahora = new Date("2026-01-14T03:00:01Z"); // martes 20:00:01 en Utah
    const s = nextSession(TALLER, ahora)!;
    expect(calendarDateIn(s.startsAt, UTAH)).toEqual({ year: 2026, month: 1, day: 14 });
  });

  it("un taller sin días no tiene próxima sesión", () => {
    expect(nextSession({ ...TALLER, weekdays: [] }, new Date())).toBeNull();
  });
});

describe("estado de la puerta", () => {
  const martes18 = new Date("2026-01-14T01:00:00Z");

  it("cerrada cuando falta mucho", () => {
    const d = doorState(TALLER, new Date(martes18.getTime() - 3 * 3600_000));
    expect(d.kind).toBe("closed");
  });

  it("abriendo en los últimos 15 minutos", () => {
    const d = doorState(TALLER, new Date(martes18.getTime() - 10 * 60_000));
    expect(d.kind).toBe("opening");
    if (d.kind === "opening") expect(d.msToStart).toBe(10 * 60_000);
  });

  it("el borde exacto de los 15 minutos ya cuenta como abriendo", () => {
    const d = doorState(TALLER, new Date(martes18.getTime() - DOORS_OPEN_MS));
    expect(d.kind).toBe("opening");
  });

  it("en vivo durante la sesión", () => {
    const d = doorState(TALLER, new Date(martes18.getTime() + 30 * 60_000));
    expect(d.kind).toBe("live");
    if (d.kind === "live") expect(d.msToEnd).toBe(90 * 60_000);
  });

  it("al segundo de empezar ya está en vivo, no abriendo", () => {
    const d = doorState(TALLER, new Date(martes18.getTime() + 1000));
    expect(d.kind).toBe("live");
  });
});

describe("el día cambia, no sólo la hora", () => {
  it("el martes de Utah es miércoles en Manila", () => {
    // Éste es el error que hace perder el taller por un día entero:
    // enseñar "9:00" sin decir que es el día siguiente.
    const s = nextSession(TALLER, new Date("2026-01-12T19:00:00Z"))!;
    expect(calendarDateIn(s.startsAt, "Asia/Manila")).toEqual({
      year: 2026,
      month: 1,
      day: 14,
    });
    expect(crossesDay(s, "Asia/Manila", UTAH)).toBe(true);
  });

  it("en Nueva York es el mismo día", () => {
    const s = nextSession(TALLER, new Date("2026-01-12T19:00:00Z"))!;
    expect(crossesDay(s, "America/New_York", UTAH)).toBe(false);
  });

  it("en Ciudad de México es el mismo día", () => {
    const s = nextSession(TALLER, new Date("2026-01-12T19:00:00Z"))!;
    expect(crossesDay(s, "America/Mexico_City", UTAH)).toBe(false);
  });

  it("en Madrid ya es el día siguiente", () => {
    const s = nextSession(TALLER, new Date("2026-01-12T19:00:00Z"))!;
    expect(crossesDay(s, "Europe/Madrid", UTAH)).toBe(true);
  });
});
