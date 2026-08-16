/**
 * TIENDA — copy de la sección (ES/EN).
 *
 * Tono: cada tarjeta dice **qué resuelve**, no qué es. «Qué hacer en tu
 * primera audiencia» le importa a alguien que tiene una citación en la
 * mano; «una miniaplicación interactiva» no le importa a nadie.
 *
 * Y siempre se dice **a dónde va y cuánto tarda** antes de que salga de
 * ANDEX. Un enlace que se abre sin avisar, en un producto cuyo argumento es
 * la confianza, es exactamente lo que no se puede hacer.
 *
 * ── Por qué la cabecera se parte en tres ──
 *
 * El diseño separa el módulo («Tienda») del nombre de la pantalla
 * («Miniaplicaciones»). Separarlos es lo que permite que el titular sea
 * corto sin perder el contexto, y deja el subtítulo para lo único que hay
 * que decir antes de nada: que esto **se compra aparte**.
 */

const es = {
  /** El módulo. Va encima del titular, pequeño. */
  overline: "Tienda",
  title: "Miniaplicaciones",
  subtitle:
    "Cada una resuelve una cosa en unos minutos y se compra por separado: no entra en tu suscripción. Se abren fuera de ANDEX, en su propio enlace.",
  back: "Volver al inicio",

  /** Los dos rótulos que parten el catálogo, con su recuento. */
  sections: {
    ready: "Puedes usarla ya",
    soon: "Todavía no está lista",
    countOne: "1 miniaplicación",
    count: "{n} miniaplicaciones",
  },

  apps: {
    "prime-academy": {
      title: "Prime Academy",
      body: "Vídeos y cursos en español sobre cómo avanzar en Estados Unidos: qué hacer, qué evitar y en qué orden. Lo lleva quien ya pasó por el proceso.",
      free: "Empezar es gratis, sin tarjeta",
    },
    "primera-audiencia": {
      title: "Qué hacer en tu primera audiencia",
      body: "Qué llevar, cómo se desarrolla, qué te van a preguntar y qué pasa después. Para que llegues sabiendo qué esperar.",
    },
    "primeros-dolares": {
      title: "Cómo conseguir tus primeros $300 a $400",
      body: "Formas concretas de generar tus primeros ingresos en tus primeras semanas, con lo que hace falta para empezar cada una.",
    },
  },

  card: {
    /** Se dice antes de salir: cuánto tarda y a dónde va. */
    minutes: "{n} minutos",
    open: "Abrir",
    /** Nombre accesible del enlace, para no tener diez «Abrir» iguales. */
    openAria: "Abrir {app}, fuera de ANDEX",
    /** Aviso de que la herramienta vive fuera. `{domain}` se destaca. */
    leaves: "Se abre fuera de ANDEX, en {domain}. Allí te registras.",
    /** Sin enlace configurado todavía no hay dominio que enseñar. */
    leavesSoon: "Cuando esté lista, se abrirá fuera de ANDEX, en su propio enlace.",
    soonBadge: "Muy pronto",
    notify: "Avísame cuando esté lista",
    notified: "Te avisamos cuando esté lista",
  },

  /** El aviso de las que tocan corte, dinero o trámite. */
  disclaimer:
    "Es información general para que sepas qué esperar, no asesoría legal sobre tu caso. Si tienes un problema concreto, busca a alguien que pueda revisarlo contigo.",

  official:
    "ANDEX no está afiliado a ninguna agencia gubernamental. Estos trámites son gratuitos en los portales oficiales.",

  /**
   * Cuando no hay ninguna abierta. Una sola acción y ningún catálogo
   * fingido: dos tarjetas de «muy pronto» sin nada real al lado son un
   * escaparate vacío con luces.
   */
  empty: {
    title: "Todavía no hay ninguna disponible",
    body: "Las estamos preparando. Cuando una se abra, te avisamos y aparece aquí.",
    cta: "Avísame de la primera",
    notified: "Te avisamos de la primera",
  },
};

const en: typeof es = {
  overline: "Tools",
  title: "Mini-apps",
  subtitle:
    "Each one solves a single thing in a few minutes and is bought separately: it is not part of your subscription. They open outside ANDEX, at their own link.",
  back: "Back to home",

  sections: {
    ready: "Ready to use",
    soon: "Not ready yet",
    countOne: "1 mini-app",
    count: "{n} mini-apps",
  },

  apps: {
    "prime-academy": {
      title: "Prime Academy",
      body: "Videos and courses in Spanish on how to move forward in the United States: what to do, what to avoid, and in what order. Run by someone who has been through it.",
      free: "Free to start, no card needed",
    },
    "primera-audiencia": {
      title: "What to do at your first hearing",
      body: "What to bring, how it unfolds, what they'll ask you and what happens next. So you arrive knowing what to expect.",
    },
    "primeros-dolares": {
      title: "How to make your first $300 to $400",
      body: "Concrete ways to earn your first income in your first weeks, with what it takes to start each one.",
    },
  },

  card: {
    minutes: "{n} minutes",
    open: "Open",
    openAria: "Open {app}, outside ANDEX",
    leaves: "Opens outside ANDEX, at {domain}. You sign up there.",
    leavesSoon: "When it's ready, it will open outside ANDEX, at its own link.",
    soonBadge: "Coming soon",
    notify: "Let me know when it's ready",
    notified: "We'll let you know when it's ready",
  },

  disclaimer:
    "This is general information so you know what to expect, not legal advice about your case. If you have a specific problem, find someone who can review it with you.",

  official:
    "ANDEX is not affiliated with any government agency. These procedures are free on the official portals.",

  empty: {
    title: "None available yet",
    body: "We're getting them ready. When one opens, we'll let you know and it will show up here.",
    cta: "Let me know about the first one",
    notified: "We'll let you know about the first one",
  },
};

export type TiendaDict = typeof es;
export const tienda = { es, en };
