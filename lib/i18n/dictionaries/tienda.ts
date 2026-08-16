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
 */

const es = {
  title: "Tienda",
  subtitle: "Herramientas que viven fuera de ANDEX. Te registras allí y, si algo se paga, se paga allí.",
  back: "Volver al inicio",

  intro: {
    eyebrow: "HECHAS PARA UN MOMENTO",
    headline: "Cada una resuelve un problema, no te enseña un tema",
    body: "Cada una vive en su propia plataforma, con su propio registro y su propio cobro. No entra en tu suscripción de ANDEX: si no compras nada allí, no pagas nada más aquí.",
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
    /** Aviso de que la herramienta vive fuera. */
    leaves: "Se abre fuera de ANDEX, en {domain}. Allí te registras.",
    soonBadge: "Muy pronto",
    soonBody: "Todavía no está lista. Te avisamos cuando lo esté.",
    notify: "Avísame cuando esté lista",
    notified: "Listo. Te avisamos en cuanto esté.",
  },

  /** El aviso de las que tocan corte, dinero o trámite. */
  disclaimer: "Es información general para que sepas qué esperar, no asesoría legal sobre tu caso. Si tienes un problema concreto, busca a alguien que pueda revisarlo contigo.",

  official: "ANDEX no está afiliado a ninguna agencia gubernamental. Estos trámites son gratuitos en los portales oficiales.",

  empty: {
    title: "Todavía no hay ninguna disponible",
    body: "Estamos preparando las primeras. Vuelve pronto.",
  },
};

const en: typeof es = {
  title: "Tools",
  subtitle: "Tools that live outside ANDEX. You register there, and if anything costs money, you pay there.",
  back: "Back to home",

  intro: {
    eyebrow: "BUILT FOR A MOMENT",
    headline: "Each one solves a problem — it doesn't teach you a subject",
    body: "Each one lives on its own platform, with its own sign-up and its own billing. It is not part of your ANDEX subscription: if you buy nothing there, you pay nothing more here.",
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
    leaves: "Opens outside ANDEX, at {domain}. You sign up there.",
    soonBadge: "Coming soon",
    soonBody: "It isn't ready yet. We'll let you know when it is.",
    notify: "Let me know when it's ready",
    notified: "Done. We'll let you know as soon as it's ready.",
  },

  disclaimer: "This is general information so you know what to expect, not legal advice about your case. If you have a specific problem, find someone who can review it with you.",

  official: "ANDEX is not affiliated with any government agency. These procedures are free on the official portals.",

  empty: {
    title: "None available yet",
    body: "We're preparing the first ones. Check back soon.",
  },
};

export type TiendaDict = typeof es;
export const tienda = { es, en };
