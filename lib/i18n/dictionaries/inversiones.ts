/**
 * INVERSIONES — copy de la sección (ES/EN).
 *
 * Dos audiencias en una pantalla: quien llegó hace un mes y necesita
 * ingresos, y quien tiene capital parado. El orden es ése — primero el
 * negocio, que es lo que necesita la mayoría de quien entra aquí.
 *
 * ── Dos cosas que no se pueden caer de aquí ──
 *
 * 1. **El límite viaja con la promesa.** «Hasta 3–4% mensual» no se escribe
 *    nunca sin «el rendimiento pasado no garantiza el futuro y el capital
 *    puede perderse» en la misma tarjeta. Este público ya oyó promesas de
 *    rendimiento de quien lo estafó.
 * 2. **El dinero se mueve fuera de ANDEX.** Ni suscripción ni cobro aquí:
 *    ANDEX no toca una tarjeta en esta pantalla, y lo dice.
 */

const es = {
  title: "Inversiones",
  back: "Volver al inicio",

  negocio: {
    /** El rótulo de sección, en versalitas. */
    label: "Negocios para arrancar",
    /** El dato que decide: cuánto hace falta para empezar. */
    from: "Desde {amount} de capital",
  },

  inversion: {
    label: "Fondos de inversión",
    /** El rango sale del catálogo, no del texto. */
    headline: "Hasta {min}–{max}% mensual",
    /** La promesa y su límite, en la misma frase. */
    body: "Desde {amount}. El rendimiento pasado no garantiza el futuro y el capital puede perderse.",
  },

  opportunities: {
    limpieza: { title: "Limpieza de casas y oficinas" },
    comida: { title: "Comida preparada" },
    transporte: { title: "Transporte y mudanzas" },
    construccion: { title: "Trabajos de construcción" },
    fondo: { title: "Fondos de inversión" },
  },

  cta: {
    label: "Hablar por WhatsApp",
    /** El mensaje ya escrito. `{opportunity}` es lo único que cambia. */
    message: "Hola, vi la oportunidad de {opportunity} en ANDEX y quiero más información.",
    general: "Hablar con un asesor",
    generalMessage: "Hola, vi la sección de Inversiones en ANDEX y quiero más información.",
  },

  closing: {
    title: "¿No sabes por dónde empezar?",
    body: "Escríbenos y te decimos cuál te conviene según tu situación y lo que tengas disponible.",
  },

  /** Cómo termina todo esto, y quién cobra qué. Cierra la pantalla. */
  whatsappNote:
    "Cada oportunidad cierra en una conversación por WhatsApp con una persona del equipo. No entra en tu suscripción y ANDEX no cobra nada aquí: el dinero se trata fuera de la aplicación.",

  unavailable: "El contacto no está disponible ahora mismo. Vuelve a intentarlo en un momento.",
};

const en: typeof es = {
  title: "Investments",
  back: "Back to home",

  negocio: {
    label: "Businesses to get started",
    from: "From {amount} in capital",
  },

  inversion: {
    label: "Investment funds",
    headline: "Up to {min}–{max}% monthly",
    body: "From {amount}. Past returns do not guarantee future ones, and you can lose your capital.",
  },

  opportunities: {
    limpieza: { title: "House and office cleaning" },
    comida: { title: "Prepared food" },
    transporte: { title: "Transport and moving" },
    construccion: { title: "Construction work" },
    fondo: { title: "Investment funds" },
  },

  cta: {
    label: "Talk on WhatsApp",
    message: "Hi, I saw the {opportunity} opportunity on ANDEX and I'd like more information.",
    general: "Talk to an advisor",
    generalMessage: "Hi, I saw the Investments section on ANDEX and I'd like more information.",
  },

  closing: {
    title: "Not sure where to start?",
    body: "Message us and we'll tell you which one fits your situation and what you have available.",
  },

  whatsappNote:
    "Every opportunity closes in a WhatsApp conversation with someone from the team. It is not part of your subscription and ANDEX charges nothing here: the money is handled outside the app.",

  unavailable: "Contact isn't available right now. Please try again in a moment.",
};

export type InversionesDict = typeof es;
export const inversiones = { es, en };
