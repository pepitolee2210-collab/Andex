/**
 * Pruebas del emparejamiento de empleo.
 *
 * Lo que se protege aquí no es una puntuación bonita: es que el motor NUNCA
 * esconda una vacante y que SIEMPRE pueda explicar por qué la puso donde la
 * puso. Si alguna de esas dos se rompe, el módulo deja de ser defendible
 * ante el usuario.
 */

import { describe, expect, it } from "vitest";
import {
  hourlyEquivalent,
  matchJob,
  profileCompleteness,
  rankJobs,
  type JobPosting,
  type WorkProfile,
} from "./matching";

const AHORA = new Date("2026-08-11T12:00:00Z");

const perfil = (over: Partial<WorkProfile> = {}): WorkProfile => ({
  occupations: over.occupations ?? ["limpieza", "mesero"],
  englishLevel: over.englishLevel !== undefined ? over.englishLevel : "basico",
  hasVehicle: over.hasVehicle !== undefined ? over.hasVehicle : false,
  searchStateUs: over.searchStateUs !== undefined ? over.searchStateUs : "UT",
  searchCity: over.searchCity !== undefined ? over.searchCity : "Salt Lake City",
  desiredPayHourly: over.desiredPayHourly !== undefined ? over.desiredPayHourly : 18,
  availability: over.availability ?? { manana: true, noche: false },
});

const vacante = (over: Partial<JobPosting> = {}): JobPosting => ({
  id: over.id ?? "v1",
  occupationTags: over.occupationTags ?? ["limpieza"],
  stateUs: over.stateUs !== undefined ? over.stateUs : "UT",
  city: over.city !== undefined ? over.city : "Salt Lake City",
  isRemote: over.isRemote ?? false,
  payMin: over.payMin !== undefined ? over.payMin : 19,
  payMax: over.payMax !== undefined ? over.payMax : 21,
  payPeriod: over.payPeriod ?? "hour",
  requiresEnglish: over.requiresEnglish !== undefined ? over.requiresEnglish : "ninguno",
  requiresVehicle: over.requiresVehicle ?? false,
  requiresSsn: over.requiresSsn !== undefined ? over.requiresSsn : null,
  shiftTags: over.shiftTags ?? ["manana"],
  publishedAt: over.publishedAt !== undefined ? over.publishedAt : "2026-08-10T00:00:00Z",
});

describe("oficio", () => {
  it("el primero de la lista pesa más que el segundo", () => {
    // El orden en que los eligió es la única señal de qué le importa más.
    const a = matchJob(perfil(), vacante({ occupationTags: ["limpieza"] }), AHORA);
    const b = matchJob(perfil(), vacante({ occupationTags: ["mesero"] }), AHORA);
    expect(a.raw).toBeGreaterThan(b.raw);
    expect(a.reasons).toContain("occupation_primary");
    expect(b.reasons).toContain("occupation_secondary");
  });

  it("un oficio que no busca no suma, pero tampoco descalifica", () => {
    const m = matchJob(perfil(), vacante({ occupationTags: ["soldadura"] }), AHORA);
    expect(m.reasons).not.toContain("occupation_primary");
    expect(m.score).toBeGreaterThan(0);
  });

  it("no distingue mayúsculas ni espacios sobrantes", () => {
    const m = matchJob(perfil(), vacante({ occupationTags: ["  LIMPIEZA "] }), AHORA);
    expect(m.reasons).toContain("occupation_primary");
  });
});

describe("nunca esconde nada", () => {
  it("devuelve todas las vacantes, encajen o no", () => {
    // La regla más importante del motor. Esconder la única oferta que había
    // porque el algoritmo creyó que no encajaba es el peor fallo posible.
    const jobs = [
      vacante({ id: "a" }),
      vacante({ id: "b", occupationTags: ["soldadura"], stateUs: "TX", city: "Austin" }),
      vacante({ id: "c", requiresVehicle: true, requiresEnglish: "avanzado" }),
    ];
    expect(rankJobs(perfil(), jobs, AHORA)).toHaveLength(3);
  });

  it("la que peor encaja queda la última, no fuera", () => {
    const jobs = [
      vacante({ id: "mala", occupationTags: ["soldadura"], stateUs: "TX", requiresVehicle: true, requiresEnglish: "avanzado" }),
      vacante({ id: "buena" }),
    ];
    const r = rankJobs(perfil(), jobs, AHORA);
    expect(r[0].jobId).toBe("buena");
    expect(r[1].jobId).toBe("mala");
  });

  it("el bruto ordena y el normalizado nunca sale de 0–100", () => {
    const pesima = vacante({
      id: "x", occupationTags: ["soldadura"], stateUs: "TX",
      requiresVehicle: true, requiresEnglish: "avanzado", publishedAt: null,
      shiftTags: [], payMin: 5, payMax: 5,
    });
    expect(matchJob(perfil(), pesima, AHORA).score).toBeGreaterThanOrEqual(0);
    expect(matchJob(perfil(), vacante(), AHORA).score).toBeLessThanOrEqual(100);
  });
});

describe("siempre explica", () => {
  it("toda coincidencia buena trae al menos una razón", () => {
    expect(matchJob(perfil(), vacante(), AHORA).reasons.length).toBeGreaterThan(0);
  });

  it("avisa de que el puesto pide carro aunque la persona lo tenga", () => {
    // Es un requisito del puesto: hay que saberlo antes de ir.
    const conCarro = matchJob(perfil({ hasVehicle: true }), vacante({ requiresVehicle: true }), AHORA);
    expect(conCarro.reasons).toContain("needs_vehicle");
  });

  it("sin carro, el puesto que lo pide baja pero sigue explicado", () => {
    const sin = matchJob(perfil({ hasVehicle: false }), vacante({ requiresVehicle: true }), AHORA);
    const con = matchJob(perfil({ hasVehicle: true }), vacante({ requiresVehicle: true }), AHORA);
    expect(sin.raw).toBeLessThan(con.raw);
    expect(sin.reasons).toContain("needs_vehicle");
  });

  it("avisa cuando el puesto pide número de seguro social", () => {
    // Se marca porque es un hecho de la vacante. No se compara con ningún
    // dato de la persona: ese dato no existe en la base y no va a existir.
    const m = matchJob(perfil(), vacante({ requiresSsn: true }), AHORA);
    expect(m.reasons).toContain("asks_ssn");
  });

  it("no inventa el aviso cuando el empleador no lo declaró", () => {
    expect(matchJob(perfil(), vacante({ requiresSsn: null }), AHORA).reasons)
      .not.toContain("asks_ssn");
  });
});

describe("idioma", () => {
  it("no pedir inglés es la mejor señal de todas", () => {
    const nada = matchJob(perfil(), vacante({ requiresEnglish: "ninguno" }), AHORA);
    const basico = matchJob(perfil(), vacante({ requiresEnglish: "basico" }), AHORA);
    expect(nada.raw).toBeGreaterThan(basico.raw);
    expect(nada.reasons).toContain("no_english_needed");
  });

  it("marca la brecha en vez de descartar: eso es lo que enseña el taller", () => {
    const m = matchJob(perfil({ englishLevel: "basico" }), vacante({ requiresEnglish: "avanzado" }), AHORA);
    expect(m.reasons).toContain("english_gap");
    expect(m.score).toBeGreaterThan(0);
  });

  it("su nivel basta si iguala lo que piden", () => {
    const m = matchJob(perfil({ englishLevel: "intermedio" }), vacante({ requiresEnglish: "intermedio" }), AHORA);
    expect(m.reasons).toContain("english_enough");
  });

  it("sin nivel declarado no premia ni castiga", () => {
    const m = matchJob(perfil({ englishLevel: null }), vacante({ requiresEnglish: "avanzado" }), AHORA);
    expect(m.reasons).not.toContain("english_gap");
    expect(m.reasons).not.toContain("english_enough");
  });
});

describe("pago comparable", () => {
  it("convierte cualquier periodo a la hora", () => {
    expect(hourlyEquivalent(vacante({ payMin: 160, payMax: 160, payPeriod: "day" }))).toBe(20);
    expect(hourlyEquivalent(vacante({ payMin: 800, payMax: 800, payPeriod: "week" }))).toBe(20);
  });

  it("sin pago declarado no se inventa una cifra", () => {
    expect(hourlyEquivalent(vacante({ payMin: null, payMax: null }))).toBeNull();
  });

  it("premia lo que llega a lo que la persona necesita", () => {
    const m = matchJob(perfil({ desiredPayHourly: 18 }), vacante({ payMin: 19, payMax: 21 }), AHORA);
    expect(m.reasons).toContain("pay_above_target");
  });

  it("pagar poco no esconde la vacante", () => {
    const m = matchJob(perfil({ desiredPayHourly: 25 }), vacante({ payMin: 12, payMax: 12 }), AHORA);
    expect(m.reasons).not.toContain("pay_above_target");
    expect(m.score).toBeGreaterThan(0);
  });
});

describe("perfil incompleto", () => {
  const vacio: WorkProfile = {
    occupations: [], englishLevel: null, hasVehicle: null,
    searchStateUs: null, searchCity: null, desiredPayHourly: null, availability: {},
  };

  it("un perfil vacío vale 0 y lo dice todo lo que falta", () => {
    const c = profileCompleteness(vacio);
    expect(c.score).toBe(0);
    expect(c.missing).toHaveLength(6);
  });

  it("pide primero lo que más desbloquea", () => {
    // El oficio va primero siempre: sin él el motor no puede hacer nada.
    expect(profileCompleteness(vacio).missing[0]).toBe("occupations");
  });

  it("un perfil completo llega a 100", () => {
    expect(profileCompleteness(perfil()).score).toBe(100);
    expect(profileCompleteness(perfil()).missing).toEqual([]);
  });

  it("sólo con el oficio ya vale casi la mitad", () => {
    const c = profileCompleteness({ ...vacio, occupations: ["limpieza"] });
    expect(c.score).toBe(40);
  });

  it("aun sin perfil, el motor sigue devolviendo el catálogo entero", () => {
    // Un perfil vacío no puede dejar a nadie sin ver empleos.
    const jobs = [vacante({ id: "a" }), vacante({ id: "b" })];
    expect(rankJobs(vacio, jobs, AHORA)).toHaveLength(2);
  });
});
