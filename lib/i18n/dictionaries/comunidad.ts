/**
 * COMUNIDAD — copy de los talleres en vivo (ES/EN).
 *
 * El tono busca una cosa concreta: que se sienta que **la sala existe y que
 * tienes un asiento**. Para alguien a quien ya le vendieron humo, "exclusivo"
 * no significa lujoso — significa cierto. Por eso el copy habla de días,
 * horas y puertas, no de experiencias premium.
 *
 * ── La forma viene del sistema de diseño ──
 *
 * La pantalla se parte en tres filetes rotulados —«Hoy», «Esta semana»,
 * «Todavía sin fecha»— y cada rótulo lleva su recuento. Ese recuento no es
 * decoración: dice cuánto hay antes de que nadie tenga que desplazarse.
 *
 * ── Lo que NO se dice ──
 *
 * No hay ni una cuenta de personas dentro de la sala. El diseño las enseña
 * («14 dentro», «23 apuntadas») y aquí no, porque no existen todavía: un
 * contador inventado es exactamente el patrón que el PRD veta, y con este
 * público el precio de que se note es la confianza entera.
 */

const es = {
  overline: "Comunidad y Vida Local",
  title: "Talleres en vivo",
  subtitle: "De martes a viernes. Con quien sabe del tema, no con un video.",

  sections: {
    today: "Hoy",
    week: "Esta semana",
    undated: "Todavía sin fecha",
    count: "{n} talleres",
    countOne: "1 taller",
  },

  timezone: {
    // Se detecta del navegador, nunca de la IP: es más exacto, no pide
    // permiso y no cuesta un dato. En un producto cuyo argumento es "no te
    // sacamos información", pedir la ubicación para algo que ya se sabe
    // sería un autogol.
    detected: "Los horarios están en tu hora ({zone}).",
    utahReference: "En Utah son las {time}",
    change: "Cambiar mi zona horaria",
    // Cuando la sesión cae otro día para quien mira. Es el error que hace
    // perder el taller por 24 horas enteras.
    nextDay: "Ojo: para ti es el día siguiente",
    prevDay: "Ojo: para ti es el día anterior",
  },

  door: {
    /** Antes de que arranque el reloj del navegador. */
    closed: "Próxima sesión",
    opening: "La sala abre en {time}",
    live: "Sala abierta ahora",
    undated: "Sin fecha · duración por confirmar",
    duration: "{n} min",
    join: "Entrar a la sala",
    // El botón no existe hasta que hay a dónde entrar. Prometer "entrar
    // ahora" sin destino es peor que no prometer nada.
    noLink: "El enlace se publica poco antes de empezar",
    noLinkWhy:
      "Cada sesión tiene su propio enlace. Así nadie que no esté invitado puede entrar a la sala.",
    /** La nota de la tarjeta que todavía no toca. */
    buttonLater: "El botón de entrar aparece cuando la sala abra.",
    remindMe: "Apuntarme",
    // Un hecho, no una promesa. "Te avisamos 30 min antes" sería prometer
    // un aviso que hoy no tiene nada detrás.
    reminded: "Ya te apuntaste",
    notifyDate: "Avísame cuando haya fecha",
    notifyDateDone: "Te avisamos cuando haya fecha",
    undatedNote: "Cuando haya fecha, te avisamos.",
    countdownDays: "{n} días",
    countdownHours: "{n} h {m} min",
    countdownMinutes: "{n} min",
    // Presencia. Sin datos reales no se pinta ninguna de las dos.
    inside: "{n} dentro",
    signedUp: "{n} apuntadas",
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
  overline: "Community and Local Life",
  title: "Live workshops",
  subtitle: "Tuesday through Friday. With someone who knows, not with a video.",

  sections: {
    today: "Today",
    week: "This week",
    undated: "No date yet",
    count: "{n} workshops",
    countOne: "1 workshop",
  },

  timezone: {
    detected: "Times are shown in your time ({zone}).",
    utahReference: "In Utah it's {time}",
    change: "Change my time zone",
    nextDay: "Heads up: for you that's the next day",
    prevDay: "Heads up: for you that's the previous day",
  },

  door: {
    closed: "Next session",
    opening: "The room opens in {time}",
    live: "Room open now",
    undated: "No date · length to be confirmed",
    duration: "{n} min",
    join: "Enter the room",
    noLink: "The link is posted shortly before we start",
    noLinkWhy:
      "Each session has its own link. That way nobody who wasn't invited can get into the room.",
    buttonLater: "The button to enter shows up when the room opens.",
    remindMe: "Sign me up",
    reminded: "You're signed up",
    notifyDate: "Tell me when there's a date",
    notifyDateDone: "We'll tell you when there's a date",
    undatedNote: "When there's a date, we'll let you know.",
    countdownDays: "{n} days",
    countdownHours: "{n} h {m} min",
    countdownMinutes: "{n} min",
    inside: "{n} inside",
    signedUp: "{n} signed up",
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
