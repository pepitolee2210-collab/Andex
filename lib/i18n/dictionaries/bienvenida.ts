/**
 * BIENVENIDA — la primera pantalla del embudo nuevo.
 *
 * Antes de pedir nada, Henry cuenta qué es esto. El video todavía no existe:
 * el marco está montado y rotulado como pendiente, y en cuanto el archivo
 * esté sólo hay que dejarlo.
 *
 * ── Por qué no hay salida ──
 *
 * Aquí no se puede saltar: quien entra no conoce ANDEX de nada y esto es lo
 * único que se lo explica antes de pedirle dinero. Lo que sí se respeta es
 * que el play lo dé la persona — el público objetivo usa Android de gama
 * media con datos contados—, y por eso la duración y los subtítulos se dicen
 * ANTES del play: quien paga sus megas quiere saber cuántos va a gastar.
 */

const es = {
  title: "Bienvenida",
  eyebrow: (minutos: string) => `Bienvenida · ${minutos}`,
  duracionCorta: "2 minutos",
  heading: "Antes de empezar, deja que te lo cuente yo.",

  /** El estado del marco mientras el archivo no está. */
  pendiente: {
    label: "Video pendiente · 16:9",
    note: "El marco ya está montado; sólo hay que dejar el archivo.",
  },
  /** Lo que se ve sobre el video antes de darle al play. */
  duracion: "2:14",
  subtitulos: "Subtítulos ES · EN",
  playAria: "Reproducir el video de bienvenida",

  puntosTitle: "Lo que te cuenta",
  puntos: [
    "Por qué existe ANDEX, contado por quien pasó el proceso.",
    "Qué vas a encontrar dentro: los siete módulos y el inglés en vivo.",
    "Qué NO hacemos, y a dónde te llevamos cuando toca un portal oficial.",
  ],

  cta: "Continuar",
  nota: "El video queda guardado en tu cuenta. No se reproduce solo: no gastamos tus datos sin que lo pidas.",

  /** El recorrido, arriba: cuatro pasos y en cuál estás. */
  pasos: ["Bienvenida", "Membresía", "Tu cuenta", "Comunidad"],
  pasoActual: (n: number, total: number) => `Paso ${n} de ${total}`,
  /** Descripción del retrato que hace de cartel del video. */
  posterAlt: "Henry, fundador de ANDEX",
};

const en: typeof es = {
  title: "Welcome",
  eyebrow: (minutos: string) => `Welcome · ${minutos}`,
  duracionCorta: "2 minutes",
  heading: "Before we start, let me tell you myself.",

  pendiente: {
    label: "Video pending · 16:9",
    note: "The frame is already built; the file just needs dropping in.",
  },
  duracion: "2:14",
  subtitulos: "Subtitles ES · EN",
  playAria: "Play the welcome video",

  puntosTitle: "What he covers",
  puntos: [
    "Why ANDEX exists, told by someone who went through it.",
    "What you will find inside: the seven modules and live English.",
    "What we do NOT do, and where we take you when an official portal is the answer.",
  ],

  cta: "Continue",
  nota: "The video stays in your account. It does not autoplay: we do not spend your data unless you ask.",

  pasos: ["Welcome", "Membership", "Your account", "Community"],
  pasoActual: (n: number, total: number) => `Step ${n} of ${total}`,
  posterAlt: "Henry, founder of ANDEX",
};

export const bienvenida = { es, en };

/**
 * Lo que recibe la pantalla: TODO cadenas, sin funciones.
 *
 * Los textos con parámetro —el sobretítulo y «Paso n de N»— se componen en
 * la página, que corre en el servidor. Si viajaran como función, Next
 * rechazaría el render con un 500 en ejecución, no en compilación.
 */
export type BienvenidaDict = Omit<typeof es, "eyebrow" | "pasoActual"> & {
  eyebrow: string;
  pasoActual: string;
};

/** Compone las cadenas con parámetro y devuelve algo que sí cruza. */
export function bienvenidaCopy(lang: "es" | "en"): BienvenidaDict {
  const t = bienvenida[lang];
  return {
    ...t,
    eyebrow: t.eyebrow(t.duracionCorta),
    pasoActual: t.pasoActual(1, t.pasos.length),
  };
}
