/**
 * EL INICIO — copy de la pantalla de sistema (ES/EN).
 *
 * Dos decisiones de tono:
 *
 *  1. **Los widgets dicen estado, no invitan.** "12 documentos guardados",
 *     no "gestiona tus documentos". Quien abre esto tiene un trámite encima;
 *     lo que necesita es saber cómo va, no que le animen.
 *
 *  2. **Nada se llama "Store" en español.** La palabra sugiere comprar, y
 *     este producto ya cobra una suscripción: insinuar un segundo cobro
 *     dentro es exactamente la desconfianza que hay que evitar. Se llama
 *     "Tus aplicaciones", que es lo que es.
 */

const es = {
  greeting: "Hola, {name}",
  greetingAnon: "Hola",
  edit: "Editar",
  done: "Listo",
  pageOf: "Página {n} de {total}",
  goToPage: "Ir a la página {n}",

  apps: {
    boveda: "Bóveda",
    escaner: "Escáner",
    ia: "Asistente",
    legal: "X Legal",
    ingles: "Inglés",
    comunidad: "Comunidad",
    avisos: "Avisos",
    ajustes: "Ajustes",
  },

  /** Qué dice cada widget según su tamaño. */
  widgets: {
    boveda: {
      title: "Bóveda",
      countOne: "1 documento guardado",
      count: "{n} documentos guardados",
      empty: "Todavía no hay nada guardado",
      encrypted: "Cifrado",
      soonest: "{name} vence en {days} días",
      soonestOne: "{name} vence mañana",
      soonestToday: "{name} vence hoy",
      noDates: "Ninguno tiene fecha puesta",
      action: "Escanear",
    },
    ingles: {
      title: "Inglés",
      next: "Próxima clase {when}",
      live: "La clase está abierta",
      none: "Sin clase programada",
      action: "Entrar",
    },
    ia: {
      title: "Asistente",
      body: "Pregúntame por tus trámites",
      action: "Preguntar",
    },
    legal: {
      title: "X Legal",
      body: "Abogados de inmigración",
      action: "Ver servicios",
    },
    comunidad: { title: "Comunidad", body: "Talleres en vivo", action: "Ver" },
    escaner: { title: "Escáner", body: "Convierte una foto en PDF", action: "Escanear" },
    avisos: { title: "Avisos", body: "Lo que necesita tu atención", action: "Ver" },
    ajustes: { title: "Ajustes", body: "Tu cuenta y tus datos", action: "Abrir" },
  },

  editing: {
    title: "Ordena tu inicio",
    help: "Arrastra para mover. Toca − para quitar.",
    remove: "Quitar {app}",
    addApp: "Añadir app",
    addWidget: "Añadir widget",
    reset: "Volver al inicio de fábrica",
    resetDone: "Inicio restablecido",
  },

  store: {
    title: "Tus aplicaciones",
    subtitle: "Todo esto ya viene con tu cuenta. Nada se compra aparte.",
    onHome: "En tu inicio",
    removed: "Quitadas",
    add: "Añadir",
    added: "Añadida a tu inicio",
    empty: "No has quitado ninguna.",
  },

  /** Nombre del sitio en la píldora del dock. */
  dockHome: "Inicio",
  soon: "Muy pronto",
  soonBody: "Esta parte todavía no está lista. Te avisamos cuando lo esté.",
};

const en: typeof es = {
  greeting: "Hi, {name}",
  greetingAnon: "Hi",
  edit: "Edit",
  done: "Done",
  pageOf: "Page {n} of {total}",
  goToPage: "Go to page {n}",

  apps: {
    boveda: "Vault",
    escaner: "Scanner",
    ia: "Assistant",
    legal: "X Legal",
    ingles: "English",
    comunidad: "Community",
    avisos: "Alerts",
    ajustes: "Settings",
  },

  widgets: {
    boveda: {
      title: "Vault",
      countOne: "1 document saved",
      count: "{n} documents saved",
      empty: "Nothing saved yet",
      encrypted: "Encrypted",
      soonest: "{name} expires in {days} days",
      soonestOne: "{name} expires tomorrow",
      soonestToday: "{name} expires today",
      noDates: "None of them has a date set",
      action: "Scan",
    },
    ingles: {
      title: "English",
      next: "Next class {when}",
      live: "Class is open",
      none: "No class scheduled",
      action: "Join",
    },
    ia: {
      title: "Assistant",
      body: "Ask me about your paperwork",
      action: "Ask",
    },
    legal: {
      title: "X Legal",
      body: "Immigration attorneys",
      action: "See services",
    },
    comunidad: { title: "Community", body: "Live workshops", action: "Open" },
    escaner: { title: "Scanner", body: "Turn a photo into a PDF", action: "Scan" },
    avisos: { title: "Alerts", body: "What needs your attention", action: "Open" },
    ajustes: { title: "Settings", body: "Your account and your data", action: "Open" },
  },

  editing: {
    title: "Arrange your home",
    help: "Drag to move. Tap − to remove.",
    remove: "Remove {app}",
    addApp: "Add app",
    addWidget: "Add widget",
    reset: "Reset to the default home",
    resetDone: "Home reset",
  },

  store: {
    title: "Your apps",
    subtitle: "All of this comes with your account. Nothing is sold separately.",
    onHome: "On your home",
    removed: "Removed",
    add: "Add",
    added: "Added to your home",
    empty: "You haven't removed any.",
  },

  dockHome: "Home",
  soon: "Coming soon",
  soonBody: "This part isn't ready yet. We'll let you know when it is.",
};

export type OsDict = typeof es;
export const os = { es, en };
