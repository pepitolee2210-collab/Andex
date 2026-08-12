/**
 * EMPLEO — emparejar un perfil con una vacante.
 *
 * Módulo PURO, misma disciplina que el motor de módulos (§7.1 / D3): entra
 * datos, sale una puntuación y **los códigos que la explican**. Ni una
 * palabra en español aquí dentro; el texto lo resuelve i18n.
 *
 * ── Las tres reglas que definen este motor ──
 *
 * 1. **Nunca esconde una vacante.** Ordena, marca y avisa, pero no filtra.
 *    Esconder la única oferta que había porque el algoritmo creyó que no
 *    encajaba es el peor fallo posible aquí. Quien decide es la persona.
 *
 * 2. **Todo resultado se puede explicar en una frase.** "Porque dijiste que
 *    buscas limpieza y está en tu ciudad." Para un público al que ya le
 *    vendieron humo, un algoritmo que no puede justificarse es un algoritmo
 *    en el que no se confía — y esa desconfianza se paga en cancelaciones.
 *
 * 3. **El perfil no guarda estatus migratorio.** No hay dato que comparar,
 *    y es a propósito (ver 0008_empleo.sql). Lo que hace este motor es
 *    señalar qué EXIGE el puesto; la persona decide sin decirnos por qué.
 */

export type EnglishLevel = "ninguno" | "basico" | "intermedio" | "avanzado";

const ENGLISH_ORDER: readonly EnglishLevel[] = [
  "ninguno",
  "basico",
  "intermedio",
  "avanzado",
];

const englishRank = (level: EnglishLevel | null): number =>
  level === null ? -1 : ENGLISH_ORDER.indexOf(level);

export type WorkProfile = {
  /** En orden de preferencia: el primero pesa más. */
  occupations: readonly string[];
  englishLevel: EnglishLevel | null;
  hasVehicle: boolean | null;
  searchStateUs: string | null;
  searchCity: string | null;
  desiredPayHourly: number | null;
  /** { manana: true, noche: false, … } */
  availability: Readonly<Record<string, boolean>>;
};

export type JobPosting = {
  id: string;
  occupationTags: readonly string[];
  stateUs: string | null;
  city: string | null;
  isRemote: boolean;
  payMin: number | null;
  payMax: number | null;
  payPeriod: "hour" | "day" | "week" | "month" | "year";
  requiresEnglish: EnglishLevel | null;
  requiresVehicle: boolean;
  requiresSsn: boolean | null;
  shiftTags: readonly string[];
  publishedAt: string | null;
};

/**
 * Por qué esta vacante está donde está.
 *
 * Se separan en dos familias a propósito: las que suman son razones para
 * mirarla, y las que advierten son cosas que hay que saber ANTES de perder
 * una mañana yendo a una entrevista. Las segundas no la esconden.
 */
export type MatchReason =
  // Suman
  | "occupation_primary"
  | "occupation_secondary"
  | "same_city"
  | "same_state"
  | "remote"
  | "english_enough"
  | "no_english_needed"
  | "pay_above_target"
  | "shift_match"
  | "no_vehicle_needed"
  | "recent"
  // Advierten
  | "english_gap"
  | "needs_vehicle"
  | "asks_ssn"
  | "other_state";

export type JobMatch = {
  jobId: string;
  /**
   * Bruto, sin recortar: puede ser negativo. **El orden se decide con éste.**
   *
   * Es la misma regla que D9 fijó para el motor de módulos, y la impuso una
   * prueba: recortando a 0–100 antes de ordenar, todas las buenas
   * coincidencias empataban en 100 y el ranking se aplanaba justo arriba,
   * que es donde de verdad importa.
   */
  raw: number;
  /** 0–100 sólo para enseñar. Nunca para ordenar. */
  score: number;
  reasons: readonly MatchReason[];
};

/**
 * Pesos.
 *
 * El oficio domina porque es lo único que la persona eligió explícitamente.
 * La cercanía va después: sin coche, media ciudad de distancia es un
 * empleo imposible aunque encaje perfecto. El idioma y el pago afinan.
 */
const W = {
  occupationPrimary: 45,
  occupationSecondary: 28,
  sameCity: 22,
  sameState: 10,
  remote: 14,
  englishEnough: 12,
  noEnglishNeeded: 16,
  payAboveTarget: 12,
  shiftMatch: 8,
  noVehicleNeeded: 6,
  recent: 5,
  // Penalizaciones: bajan el puesto en la lista, nunca lo eliminan.
  englishGap: -14,
  needsVehicle: -18,
  otherState: -12,
} as const;

const MS_RECIENTE = 7 * 24 * 60 * 60 * 1000;

/**
 * Lo máximo que puede sumar una vacante, contando que hay señales que se
 * excluyen entre sí: remoto O (mismo estado + misma ciudad); pedir inglés O
 * no pedirlo; oficio principal O secundario. Sirve para normalizar a 0–100
 * sin recortar, que es lo que aplanaba el ranking.
 */
const MAX_RAW =
  W.occupationPrimary +
  Math.max(W.remote, W.sameState + W.sameCity) +
  W.noEnglishNeeded +
  W.payAboveTarget +
  W.shiftMatch +
  W.noVehicleNeeded +
  W.recent;

/** Pago por hora comparable, sea cual sea el periodo declarado. */
export function hourlyEquivalent(job: JobPosting): number | null {
  const base = job.payMax ?? job.payMin;
  if (base === null) return null;
  switch (job.payPeriod) {
    case "hour":
      return base;
    // Jornadas de referencia: 8 h/día, 40 h/semana, 173 h/mes, 2080 h/año.
    case "day":
      return base / 8;
    case "week":
      return base / 40;
    case "month":
      return base / 173;
    case "year":
      return base / 2080;
  }
}

const norm = (v: string | null): string => (v ?? "").trim().toLowerCase();

export function matchJob(
  profile: WorkProfile,
  job: JobPosting,
  now: Date,
): JobMatch {
  const reasons: MatchReason[] = [];
  let score = 0;

  // ── Oficio ──
  const wanted = profile.occupations.map(norm);
  const offered = job.occupationTags.map(norm);
  const hit = wanted.findIndex((o) => offered.includes(o));
  if (hit === 0) {
    score += W.occupationPrimary;
    reasons.push("occupation_primary");
  } else if (hit > 0) {
    score += W.occupationSecondary;
    reasons.push("occupation_secondary");
  }

  // ── Dónde ──
  if (job.isRemote) {
    score += W.remote;
    reasons.push("remote");
  } else if (profile.searchStateUs && job.stateUs) {
    if (norm(profile.searchStateUs) === norm(job.stateUs)) {
      score += W.sameState;
      reasons.push("same_state");
      if (profile.searchCity && job.city && norm(profile.searchCity) === norm(job.city)) {
        score += W.sameCity;
        reasons.push("same_city");
      }
    } else {
      // Se marca, no se esconde: hay quien se muda por un buen trabajo.
      score += W.otherState;
      reasons.push("other_state");
    }
  }

  // ── Idioma ──
  // La brecha de inglés no descarta: es exactamente la que el taller de
  // "Inglés para el trabajo" viene a cerrar, y la interfaz debe ofrecer la
  // lección de ese oficio justo aquí.
  if (job.requiresEnglish === null || job.requiresEnglish === "ninguno") {
    score += W.noEnglishNeeded;
    reasons.push("no_english_needed");
  } else if (profile.englishLevel !== null) {
    if (englishRank(profile.englishLevel) >= englishRank(job.requiresEnglish)) {
      score += W.englishEnough;
      reasons.push("english_enough");
    } else {
      score += W.englishGap;
      reasons.push("english_gap");
    }
  }

  // ── Transporte ──
  if (job.requiresVehicle) {
    if (profile.hasVehicle === false) {
      score += W.needsVehicle;
    }
    // Se avisa siempre, tenga coche o no: es un requisito del puesto.
    reasons.push("needs_vehicle");
  } else if (profile.hasVehicle === false) {
    score += W.noVehicleNeeded;
    reasons.push("no_vehicle_needed");
  }

  // ── Lo que el puesto exige ──
  // Hecho sobre la vacante, no sobre la persona: no se compara con nada
  // guardado porque no guardamos nada. Sólo se avisa.
  if (job.requiresSsn === true) reasons.push("asks_ssn");

  // ── Pago ──
  const hourly = hourlyEquivalent(job);
  if (hourly !== null && profile.desiredPayHourly !== null && hourly >= profile.desiredPayHourly) {
    score += W.payAboveTarget;
    reasons.push("pay_above_target");
  }

  // ── Turno ──
  const libres = Object.entries(profile.availability)
    .filter(([, ok]) => ok)
    .map(([k]) => norm(k));
  if (libres.length > 0 && job.shiftTags.some((t) => libres.includes(norm(t)))) {
    score += W.shiftMatch;
    reasons.push("shift_match");
  }

  // ── Novedad ──
  if (job.publishedAt) {
    const edad = now.getTime() - new Date(job.publishedAt).getTime();
    if (edad >= 0 && edad <= MS_RECIENTE) {
      score += W.recent;
      reasons.push("recent");
    }
  }

  return {
    jobId: job.id,
    raw: score,
    score: Math.max(0, Math.min(100, Math.round((score / MAX_RAW) * 100))),
    reasons,
  };
}

/**
 * Ordena el catálogo entero para un perfil.
 *
 * Devuelve TODAS las vacantes, nunca un subconjunto: filtrar es decisión de
 * la persona, no del motor. Lo que hace es ponerlas en el orden en que le
 * sirven.
 */
export function rankJobs(
  profile: WorkProfile,
  jobs: readonly JobPosting[],
  now: Date,
): JobMatch[] {
  return jobs
    .map((job) => matchJob(profile, job, now))
    // Por el BRUTO, no por el normalizado: ver `JobMatch.raw`.
    .sort((a, b) => b.raw - a.raw || a.jobId.localeCompare(b.jobId));
}

/**
 * Cuánto perfil hay relleno, y qué falta.
 *
 * No es una barra de progreso decorativa: es lo que permite decir "con tres
 * datos más te enseñamos empleos que ahora no ves". Eso convierte rellenar
 * el perfil en desbloquear algo, en vez de en rellenar un formulario — y es
 * la diferencia entre un perfil vacío y uno útil.
 *
 * El oficio pesa más que todo lo demás junto porque sin él no hay
 * emparejamiento posible: es el único campo sin el cual el motor no puede
 * hacer nada.
 */
export type ProfileField =
  | "occupations"
  | "englishLevel"
  | "searchStateUs"
  | "hasVehicle"
  | "availability"
  | "desiredPayHourly";

const FIELD_WEIGHT: Record<ProfileField, number> = {
  occupations: 40,
  searchStateUs: 20,
  englishLevel: 15,
  hasVehicle: 10,
  availability: 10,
  desiredPayHourly: 5,
};

export function profileCompleteness(profile: WorkProfile): {
  score: number;
  missing: ProfileField[];
} {
  const filled: Record<ProfileField, boolean> = {
    occupations: profile.occupations.length > 0,
    searchStateUs: Boolean(profile.searchStateUs),
    englishLevel: profile.englishLevel !== null,
    hasVehicle: profile.hasVehicle !== null,
    availability: Object.values(profile.availability).some(Boolean),
    desiredPayHourly: profile.desiredPayHourly !== null,
  };

  let score = 0;
  const missing: ProfileField[] = [];
  for (const [field, weight] of Object.entries(FIELD_WEIGHT) as [ProfileField, number][]) {
    if (filled[field]) score += weight;
    else missing.push(field);
  }

  // Los que faltan salen ordenados por lo que aportan: la interfaz pregunta
  // primero lo que más desbloquea.
  missing.sort((a, b) => FIELD_WEIGHT[b] - FIELD_WEIGHT[a]);
  return { score, missing };
}
