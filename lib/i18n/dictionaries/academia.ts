/**
 * ACADEMIA — inglés para el trabajo (ES/EN).
 *
 * Ojo con qué está aquí y qué no: esto es el CHROME de la pantalla —títulos
 * de sección, botones, etiquetas—. El contenido del curso (las frases, sus
 * significados y su pronunciación) vive en `lib/catalogs/ingles.ts`, porque
 * es dato bilingüe por naturaleza y en la base viaja dentro de un JSONB.
 *
 * ── Lo que el rediseño se llevó por delante ──
 *
 * Ya no hay `pitch` (la tarjeta que argumentaba el módulo) ni `classes` (el
 * bloque que presentaba las clases en vivo). Los dos decían con un párrafo
 * lo que ahora dice el subtítulo en una línea: «No es un curso. Son las
 * frases exactas que vas a necesitar». El resto del espacio es para las
 * frases, que son el objeto de la pantalla.
 *
 * Tampoco hay `tracks.meta` («N lecciones · N frases · N semanas»): el
 * temario ya no se abre en el sitio, se entra en él, y lo que decide si
 * alguien entra es de qué oficio es y cuánto tiene dentro.
 */

const es = {
  /** Va encima del titular: dice de qué módulo es esta pantalla. */
  overline: "Academia",
  title: "Inglés para el trabajo",
  // El argumento entero del módulo, en una línea. Antes ocupaba una
  // tarjeta con insignia, titular y dos párrafos.
  subtitle: "No es un curso. Son las frases exactas que vas a necesitar.",
  /** Volver al nivel anterior dentro del módulo. */
  back: "Volver",

  /**
   * La clase en vivo. Es lo único de esta pantalla que tiene fecha, así que
   * va arriba: si hay clase hoy, es lo primero que hace falta saber.
   */
  liveClass: {
    title: "Clase en vivo",
    // «Hoy · 7:00 p.m. en tu hora». La hora es SIEMPRE la del navegador,
    // nunca la de Utah, y se dice que lo es.
    when: "{day} · {time} en tu hora",
    today: "Hoy",
    cta: "Entrar a la clase",
  },

  tracks: {
    // Los transversales van PRIMERO, y es una decisión de producto: nadie
    // sabe que necesita saber qué hacer cuando no le pagan, así que no se
    // puede esperar a que baje a buscarlo.
    everyoneLabel: "Sirve en cualquier trabajo",
    byTradeLabel: "Por oficio",
    // Lo que hay dentro, antes de entrar: «17 frases en 3 momentos».
    phrasesInMoments: "{phrases} frases en {moments} momentos",
    momentsBody: "Elige el momento. Las frases están agrupadas por cuándo las vas a usar.",
    phrases: "{n} frases",
    phrasesOne: "1 frase",
    empty: "Todavía no hay temarios publicados.",
  },

  /** Momentos del trabajo. Ordenan el temario en vez de la gramática. */
  situations: {
    entrevista: "La entrevista",
    primer_dia: "El primer día",
    en_el_turno: "Durante el turno",
    con_el_jefe: "Hablar con el jefe",
    problema: "Cuando algo sale mal",
    emergencia: "Emergencia",
    salud: "En el doctor",
    escuela: "En la escuela",
    vivienda: "Con el arrendador",
    dinero: "En el banco y las cuentas",
  },

  /** Lo que hay que saber, no que decir. Siempre con su fuente. */
  facts: {
    title: "Lo que hay que saber",
    source: "Fuente",
    // Obligatorio: explicar que un derecho existe no es aconsejar sobre un
    // caso, y la diferencia hay que dejarla escrita.
    disclaimer:
      "Esto es información general, no asesoría legal sobre tu caso. Si tienes un problema concreto, busca a alguien que pueda revisarlo contigo.",
  },

  phrase: {
    // Sólo lo usa el PDF. En la pantalla la pronunciación no lleva rótulo:
    // la cursiva y el teal ya dicen qué es, y «Se dice:» delante roba
    // ancho a la frase.
    sayLabel: "Se dice",
    // El botón que lee la frase en voz alta, si el navegador puede.
    listen: "Escuchar",
    listening: "Reproduciendo",
    unsupported: "Tu navegador no puede leerlo en voz alta.",
  },

  download: {
    /** Rótulo de la sección donde vive el manual. */
    label: "Para leer sin datos",
    cta: "Descargar el manual en PDF",
    building: "Preparando tu manual",
    failed: "No se pudo crear el manual. Inténtalo otra vez.",
    fileName: "manual",
  },

  /** Textos que van DENTRO del PDF. */
  pdf: {
    kind: "Manual de estudio",
    weeks: "{n} semanas",
    weeksOne: "1 semana",
    phrases: "{n} frases",
    phrasesOne: "1 frase",
    footer:
      "ANDEX · Inglés para el trabajo. Material de estudio; no sustituye asesoría profesional.",
    page: "Página {n} de {total}",
  },
};

const en: typeof es = {
  overline: "Academy",
  title: "English for work",
  subtitle: "This isn't a course. These are the exact phrases you're going to need.",
  back: "Back",

  liveClass: {
    title: "Live class",
    when: "{day} · {time} your time",
    today: "Today",
    cta: "Join the class",
  },

  tracks: {
    everyoneLabel: "Useful in any job",
    byTradeLabel: "By trade",
    phrasesInMoments: "{phrases} phrases across {moments} moments",
    momentsBody: "Pick the moment. The phrases are grouped by when you'll use them.",
    phrases: "{n} phrases",
    phrasesOne: "1 phrase",
    empty: "No tracks published yet.",
  },

  situations: {
    entrevista: "The interview",
    primer_dia: "The first day",
    en_el_turno: "During the shift",
    con_el_jefe: "Talking to the boss",
    problema: "When something goes wrong",
    emergencia: "Emergency",
    salud: "At the doctor",
    escuela: "At school",
    vivienda: "With the landlord",
    dinero: "Banking and bills",
  },

  facts: {
    title: "What you need to know",
    source: "Source",
    disclaimer:
      "This is general information, not legal advice about your case. If you have a specific problem, find someone who can review it with you.",
  },

  phrase: {
    sayLabel: "You say",
    listen: "Listen",
    listening: "Playing",
    unsupported: "Your browser can't read it out loud.",
  },

  download: {
    label: "To read without data",
    cta: "Download the manual as PDF",
    building: "Preparing your manual",
    failed: "We couldn't create the manual. Try again.",
    fileName: "manual",
  },

  pdf: {
    kind: "Study manual",
    weeks: "{n} weeks",
    weeksOne: "1 week",
    phrases: "{n} phrases",
    phrasesOne: "1 phrase",
    footer:
      "ANDEX · English for work. Study material; not a substitute for professional advice.",
    page: "Page {n} of {total}",
  },
};

export const academia = { es, en };
export type AcademiaDict = typeof es;
