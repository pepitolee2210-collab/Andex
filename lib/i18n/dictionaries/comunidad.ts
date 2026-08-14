/**
 * COMUNIDAD — copy de los talleres en vivo (ES/EN).
 *
 * El tono busca una cosa concreta: que se sienta que **la sala existe y que
 * tienes un asiento**. Para alguien a quien ya le vendieron humo, "exclusivo"
 * no significa lujoso — significa cierto. Por eso el copy habla de días,
 * horas y puertas, no de experiencias premium.
 */

const es = {
  back: "Volver al inicio",
  title: "Comunidad",
  subtitle: "Talleres en vivo, en español, con gente que está en lo mismo que tú.",

  timezone: {
    // Se detecta del navegador, nunca de la IP: es más exacto, no pide
    // permiso y no cuesta un dato. En un producto cuyo argumento es "no te
    // sacamos información", pedir la ubicación para algo que ya se sabe
    // sería un autogol.
    detected: "Horarios en tu hora ({zone})",
    utahReference: "En Utah son las {time}",
    change: "Cambiar mi zona horaria",
    // Cuando la sesión cae otro día para quien mira. Es el error que hace
    // perder el taller por 24 horas enteras.
    nextDay: "Ojo: para ti es el día siguiente",
    prevDay: "Ojo: para ti es el día anterior",
  },

  door: {
    closed: "Próxima sesión",
    opening: "La sala abre en {time}",
    live: "En vivo ahora",
    join: "Entrar a la sala",
    // El botón no existe hasta que hay a dónde entrar. Prometer "entrar
    // ahora" sin destino es peor que no prometer nada.
    noLink: "El enlace se publica poco antes de empezar",
    noLinkWhy:
      "Cada sesión tiene su propio enlace. Así nadie que no esté invitado puede entrar a la sala.",
    remindMe: "Avísame",
    reminded: "Te avisaremos",
    countdownDays: "{n} días",
    countdownHours: "{n} h {m} min",
    countdownMinutes: "{n} min",
    endsAt: "Termina a las {time}",
    ended: "Terminó · la próxima es el {day}",
  },

  workshops: {
    "entender-tu-carta": {
      title: "Entiende la carta que te llegó",
      summary:
        "Qué significa cada aviso de USCIS, qué plazos empiezan a correr y qué papeles te van a pedir.",
      // El límite, dicho de frente. No es letra pequeña: es lo que separa
      // educar de ejercer la abogacía sin licencia.
      caveat:
        "Es información general, no asesoría legal sobre tu caso. No compartas datos de tu expediente en el chat: la sala es de todos.",
    },
    "ingles-para-el-trabajo": {
      title: "Inglés para el trabajo",
      summary:
        "Las frases exactas de una entrevista y del primer día: limpieza, restaurante, cuidado de niños, jardinería y bodega.",
      caveat: "Traemos las frases escritas como suenan, para que puedas practicarlas en casa.",
    },
  },

  empty: {
    title: "Todavía no hay talleres programados",
    body: "En cuanto haya fecha, aparece aquí y te avisamos.",
  },

  disclaimer:
    "ANDEX no está afiliado a ninguna agencia del gobierno. Lo que se explica en los talleres es información general.",
};

const en: typeof es = {
  back: "Back to home",
  title: "Community",
  subtitle: "Live workshops, in Spanish, with people going through the same thing.",

  timezone: {
    detected: "Times shown in your time ({zone})",
    utahReference: "In Utah it's {time}",
    change: "Change my time zone",
    nextDay: "Heads up: for you that's the next day",
    prevDay: "Heads up: for you that's the previous day",
  },

  door: {
    closed: "Next session",
    opening: "The room opens in {time}",
    live: "Live now",
    join: "Enter the room",
    noLink: "The link is posted shortly before we start",
    noLinkWhy:
      "Each session has its own link. That way nobody who wasn't invited can get into the room.",
    remindMe: "Remind me",
    reminded: "We'll remind you",
    countdownDays: "{n} days",
    countdownHours: "{n} h {m} min",
    countdownMinutes: "{n} min",
    endsAt: "Ends at {time}",
    ended: "Ended · next one is {day}",
  },

  workshops: {
    "entender-tu-carta": {
      title: "Understand the letter you got",
      summary:
        "What each USCIS notice means, which deadlines start running, and what paperwork they'll ask you for.",
      caveat:
        "This is general information, not legal advice about your case. Don't share your case details in the chat: the room is shared.",
    },
    "ingles-para-el-trabajo": {
      title: "English for work",
      summary:
        "The exact phrases for an interview and your first day: cleaning, restaurant, childcare, landscaping and warehouse.",
      caveat: "We bring the phrases written the way they sound, so you can practice at home.",
    },
  },

  empty: {
    title: "No workshops scheduled yet",
    body: "As soon as there's a date, it shows up here and we'll let you know.",
  },

  disclaimer:
    "ANDEX is not affiliated with any government agency. What we explain in the workshops is general information.",
};

export const comunidad = { es, en };
export type ComunidadDict = typeof es;
