/**
 * ACADEMIA — inglés práctico para el trabajo.
 *
 * ── La decisión que define el módulo ──
 *
 * No es un curso de inglés. Es **el inglés de una entrevista concreta y de
 * un primer día concreto**, y por eso se organiza por OFICIO y por SITUACIÓN,
 * nunca por nivel gramatical.
 *
 * Quien busca trabajo de limpieza no necesita el presente perfecto: necesita
 * saber contestar "¿tienes experiencia?" el jueves que viene. Un temario
 * ordenado por dificultad pone esa frase en la lección 14 y la persona
 * abandona en la 3.
 *
 * ── Y la parte que de verdad se usa ──
 *
 * Cada frase lleva su pronunciación **escrita como suena en español**. El
 * alfabeto fonético internacional no lo lee nadie; "uér du ai clok in" lo lee
 * cualquiera que sepa leer español, y es la diferencia entre practicar en
 * casa o no practicar.
 *
 * Los tipos son un espejo exacto de `lesson_tracks` y `lessons` en
 * `0009_lugares_y_ingles.sql`: el día que el panel de administración escriba
 * el contenido, sólo cambia de dónde salen los datos.
 */

/** Momento real del trabajo en que se usa la lección. */
export type LessonSituation =
  | "entrevista"
  | "primer_dia"
  | "en_el_turno"
  | "con_el_jefe"
  | "problema"
  | "emergencia";

/** Orden en que se vive un trabajo, que es el orden en que se enseña. */
export const SITUATION_ORDER: readonly LessonSituation[] = [
  "entrevista",
  "primer_dia",
  "en_el_turno",
  "con_el_jefe",
  "problema",
  "emergencia",
];

export type EnglishLevel = "ninguno" | "basico" | "intermedio" | "avanzado";

/**
 * Una frase, en las tres formas que hacen falta.
 *
 * `say` no es opcional por capricho: sin ella la frase sólo sirve a quien ya
 * sabe leer inglés, que es justo quien no necesita el módulo.
 */
export type Phrase = {
  /** Lo que se dice. */
  en: string;
  /** Lo que significa. */
  es: string;
  /** Cómo se pronuncia, escrito como suena en español. */
  say: string;
  /** Cuándo usarla, si no es evidente. */
  note?: string;
};

export type Lesson = {
  id: string;
  /** Orden dentro de la ruta. */
  position: number;
  title: string;
  situation: LessonSituation;
  phrases: readonly Phrase[];
};

/**
 * Una ruta de aprendizaje: todo el inglés de un oficio.
 *
 * `occupationTag` es la bisagra con el resto del producto. La misma etiqueta
 * vive en `work_profile.occupations` (lo que la persona busca), en
 * `job_postings.occupation_tags` (lo que el puesto es) y en
 * `workshop_series.occupation_tags` (de qué va el taller del jueves). Eso es
 * lo que permite decir, dentro de una vacante: *"esta pide inglés básico; el
 * taller del jueves lo enseña"*.
 */
export type LessonTrack = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  occupationTag: string;
  level: EnglishLevel;
  /** Cuánto dura el temario completo, en semanas. */
  weeks: number;
  lessons: readonly Lesson[];
};

/** Cuántas frases tiene una ruta entera. */
export function phraseCount(track: LessonTrack): number {
  return track.lessons.reduce((n, l) => n + l.phrases.length, 0);
}

/** Lecciones agrupadas por situación, en el orden en que se vive un trabajo. */
export function lessonsBySituation(
  track: LessonTrack,
): { situation: LessonSituation; lessons: Lesson[] }[] {
  const grupos = new Map<LessonSituation, Lesson[]>();
  for (const lesson of track.lessons) {
    const lista = grupos.get(lesson.situation) ?? [];
    lista.push(lesson);
    grupos.set(lesson.situation, lista);
  }
  return SITUATION_ORDER.filter((s) => grupos.has(s)).map((situation) => ({
    situation,
    lessons: (grupos.get(situation) ?? []).sort((a, b) => a.position - b.position),
  }));
}
