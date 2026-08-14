/**
 * ACADEMIA — inglés para el trabajo (ES/EN).
 *
 * Ojo con qué está aquí y qué no: esto es el CHROME de la pantalla —títulos
 * de sección, botones, etiquetas—. El contenido del curso (las frases, sus
 * significados y su pronunciación) vive en `lib/catalogs/ingles.ts`, porque
 * es dato bilingüe por naturaleza y en la base viaja dentro de un JSONB.
 */

const es = {
  back: "Volver al inicio",
  title: "Inglés para el trabajo",
  subtitle:
    "No es un curso de inglés. Son las frases exactas de tu entrevista y de tu primer día.",

  /** El argumento del módulo, arriba y sin rodeos. */
  pitch: {
    badge: "Aprende lo que vas a usar",
    headline: "Empieza por el trabajo que buscas",
    body:
      "Cada temario está armado alrededor de un oficio y de los momentos que de verdad ocurren: la entrevista, el primer día, cuando algo sale mal. Nada de gramática que no vayas a necesitar.",
    // La razón por la que el módulo funciona, dicha una vez y bien.
    highlight:
      "Cada frase trae su pronunciación escrita como suena en español, para que puedas practicarla esta noche en tu casa.",
  },

  classes: {
    eyebrow: "Clases en vivo",
    title: "Practica con un maestro y con gente como tú",
    body: "Martes a viernes. Entras desde aquí, sin instalar nada.",
  },

  tracks: {
    eyebrow: "Los temarios",
    title: "Elige tu oficio",
    // Los transversales van aparte y ARRIBA: nadie sabe que necesita saber
    // qué hacer cuando no le pagan, así que no se puede esperar a que lo
    // busque.
    everyoneEyebrow: "Para cualquier trabajo",
    everyoneTitle: "Esto le sirve a todo el mundo",
    everyoneBody:
      "No depende de a qué te dediques. Es lo que hay que saber para que te paguen bien, para no lastimarte, y para resolver la vida fuera del trabajo.",
    byTradeBody: "El inglés exacto del trabajo que buscas.",
    // Se dice el tamaño real antes de entrar: nadie empieza algo que no sabe
    // cuánto dura.
    meta: "{lessons} lecciones · {phrases} frases · {weeks} semanas",
    lessonsOne: "1 lección",
    phrasesOne: "1 frase",
    weeksOne: "1 semana",
    open: "Ver el temario",
    close: "Cerrar",
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
    sayLabel: "Se dice",
    // El botón que lee la frase en voz alta, si el navegador puede.
    listen: "Escuchar",
    listening: "Reproduciendo",
    unsupported: "Tu navegador no puede leerlo en voz alta.",
  },

  download: {
    title: "Llévate el manual",
    body:
      "Un PDF con todas las frases, sus significados y cómo se pronuncian. Se abre sin internet, así que puedes estudiarlo donde sea.",
    cta: "Descargar el manual",
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
  back: "Back to home",
  title: "English for work",
  subtitle:
    "This isn't an English course. These are the exact phrases for your interview and your first day.",

  pitch: {
    badge: "Learn what you'll actually use",
    headline: "Start with the job you're looking for",
    body:
      "Every track is built around one trade and the moments that really happen: the interview, the first day, when something goes wrong. No grammar you won't need.",
    highlight:
      "Every phrase comes with its pronunciation written the way it sounds in Spanish, so you can practice tonight at home.",
  },

  classes: {
    eyebrow: "Live classes",
    title: "Practice with a teacher and with people like you",
    body: "Tuesday to Friday. Join from here, nothing to install.",
  },

  tracks: {
    eyebrow: "The tracks",
    title: "Pick your trade",
    everyoneEyebrow: "For any job",
    everyoneTitle: "This is for everyone",
    everyoneBody:
      "It doesn't depend on what you do. It's what you need to know to get paid right, to stay safe, and to handle life outside work.",
    byTradeBody: "The exact English of the job you're looking for.",
    meta: "{lessons} lessons · {phrases} phrases · {weeks} weeks",
    lessonsOne: "1 lesson",
    phrasesOne: "1 phrase",
    weeksOne: "1 week",
    open: "See the track",
    close: "Close",
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
    title: "Take the manual with you",
    body:
      "A PDF with every phrase, what it means and how to say it. It opens without internet, so you can study anywhere.",
    cta: "Download the manual",
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
