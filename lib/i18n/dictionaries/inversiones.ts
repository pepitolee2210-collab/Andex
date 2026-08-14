/**
 * INVERSIONES — copy de la sección (ES/EN).
 *
 * Dos audiencias en una pantalla: quien llegó hace un mes y necesita
 * ingresos, y quien tiene capital parado. El orden es ése — primero el
 * negocio, que es lo que necesita la mayoría de quien entra aquí.
 */

const es = {
  title: "Inversiones",
  subtitle: "Oportunidades de negocio para tus primeros días, y opciones para hacer crecer tu capital.",
  back: "Volver al inicio",

  negocio: {
    eyebrow: "EMPIEZA A GENERAR",
    headline: "Negocios que puedes arrancar en tus primeros días",
    body: "No necesitas años ni un local. Estos son los que más rápido empiezan a dar en Utah, con lo que hace falta para arrancar cada uno.",
    from: "Desde {amount}",
  },

  inversion: {
    eyebrow: "HAZ CRECER TU CAPITAL",
    headline: "Genera hasta 3–4% mensual",
    body: "Si ya tienes capital ahorrado, estas son las opciones disponibles con nuestros aliados. Hablas directo con ellos y te explican los términos.",
    returnLabel: "{min}–{max}% mensual",
    from: "Desde {amount}",
  },

  opportunities: {
    limpieza: {
      title: "Limpieza de casas y oficinas",
      body: "El más rápido de arrancar: productos, transporte y tus primeros clientes por referencia.",
    },
    comida: {
      title: "Comida preparada",
      body: "Vender comida hecha en casa a trabajadores y en eventos. Se empieza con pedidos y se crece a puesto.",
    },
    transporte: {
      title: "Transporte y mudanzas",
      body: "Mudanzas pequeñas, entregas y traslados. Con una camioneta ya se empieza.",
    },
    construccion: {
      title: "Trabajos de construcción",
      body: "Pintura, drywall, jardinería. Se cobra por trabajo y la herramienta se paga sola en semanas.",
    },
    capital: {
      title: "Capital en operación",
      body: "Tu dinero trabaja dentro de negocios que ya están operando y facturando.",
    },
    inmueble: {
      title: "Bienes raíces",
      body: "Participación en propiedades que generan renta. Entrada más alta, plazo más largo.",
    },
    socio: {
      title: "Socio de un negocio",
      body: "Entras como socio de un negocio en marcha, con participación de las ganancias.",
    },
  },

  cta: {
    label: "Hablar por WhatsApp",
    aria: "Hablar por WhatsApp sobre {opportunity}",
    /** El mensaje ya escrito. `{opportunity}` es lo único que cambia. */
    message: "Hola, vi la oportunidad de {opportunity} en ANDEX y quiero más información.",
    general: "Hablar con un asesor",
    generalMessage: "Hola, vi la sección de Inversiones en ANDEX y quiero más información.",
  },

  closing: {
    title: "¿No sabes por dónde empezar?",
    body: "Escríbenos y te decimos cuál te conviene según tu situación y lo que tengas disponible.",
  },

  unavailable: "El contacto no está disponible ahora mismo. Vuelve a intentarlo en un momento.",
};

const en: typeof es = {
  title: "Investments",
  subtitle: "Business opportunities for your first days, and options to grow your capital.",
  back: "Back to home",

  negocio: {
    eyebrow: "START EARNING",
    headline: "Businesses you can start in your first days",
    body: "You don't need years or a storefront. These are the fastest to get going in Utah, with what it takes to start each one.",
    from: "From {amount}",
  },

  inversion: {
    eyebrow: "GROW YOUR CAPITAL",
    headline: "Earn up to 3–4% monthly",
    body: "If you already have savings, these are the options available with our partners. You talk to them directly and they explain the terms.",
    returnLabel: "{min}–{max}% monthly",
    from: "From {amount}",
  },

  opportunities: {
    limpieza: {
      title: "House and office cleaning",
      body: "The fastest to start: supplies, transport, and your first clients by referral.",
    },
    comida: {
      title: "Prepared food",
      body: "Selling home-cooked food to workers and at events. Start with orders, grow into a stand.",
    },
    transporte: {
      title: "Transport and moving",
      body: "Small moves, deliveries and transfers. A truck is enough to start.",
    },
    construccion: {
      title: "Construction work",
      body: "Painting, drywall, landscaping. Paid by job, and the tools pay for themselves in weeks.",
    },
    capital: {
      title: "Working capital",
      body: "Your money works inside businesses that are already operating and invoicing.",
    },
    inmueble: {
      title: "Real estate",
      body: "A stake in rental properties. Higher entry, longer horizon.",
    },
    socio: {
      title: "Business partner",
      body: "You come in as a partner in a running business, with a share of the profits.",
    },
  },

  cta: {
    label: "Talk on WhatsApp",
    aria: "Talk on WhatsApp about {opportunity}",
    message: "Hi, I saw the {opportunity} opportunity on ANDEX and I'd like more information.",
    general: "Talk to an advisor",
    generalMessage: "Hi, I saw the Investments section on ANDEX and I'd like more information.",
  },

  closing: {
    title: "Not sure where to start?",
    body: "Message us and we'll tell you which one fits your situation and what you have available.",
  },

  unavailable: "Contact isn't available right now. Please try again in a moment.",
};

export type InversionesDict = typeof es;
export const inversiones = { es, en };
