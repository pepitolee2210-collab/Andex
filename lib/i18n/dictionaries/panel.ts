/**
 * ANDEX i18n — DASHBOARD ADAPTATIVO (§4).
 *
 * Principio §4.1: el dashboard no le dice al usuario quién es;
 * le muestra por dónde empezar. La adaptación es jerárquica, nunca
 * restrictiva — los 7 módulos siempre están, siempre son accesibles.
 */

import type { Lang, ModuleId } from "@/lib/types";

const es = {
  /** CLAVE NUEVA (agente Dashboard) — <title> del documento. */
  pageTitle: "Tu panel",

  /** Saludo §4.2.1 — emoji 👋 exacto del PRD, solo aquí. */
  greeting: (name: string) => `Hola, ${name} 👋`,
  greetingNoName: "Hola 👋",

  /** Subtítulo por modo (§4.2.1). */
  subtitle: {
    /** in_us — usa el estado */
    inUs: (state: string) => `Tu prioridad en ${state} este mes`,
    inUsNoState: "Tu prioridad de este mes",
    /** pre_arrival — usa el país */
    preArrival: (country: string) => `Tu camino desde ${country} a Estados Unidos`,
    preArrivalNoCountry: "Tu camino a Estados Unidos",
  },

  /** Chip compacto de La Ruta en el topbar (§2.8). */
  locationChip: {
    inUs: (state: string) => `🇺🇸 ${state}`,
    preArrival: (country: string) => `✈️ ${country}`,
    edit: "Cambiar mi ubicación",
  },

  /**
   * CLAVES NUEVAS (agente Dashboard) — shell del panel §2.4: topbar de 56px,
   * drawer lateral, tab bar inferior y sidebar izquierdo colapsable.
   * §4.3: navegación, acceso a perfil/configuración/ayuda y el botón
   * "Explorar todos los módulos" son FIJOS para todos los usuarios.
   */
  shell: {
    home: "Inicio",
    modulesNavTitle: "Tus módulos",
    /** Nombres cortos de módulo — el wireframe §2.4 los abrevia en el sidebar. */
    moduleNav: {
      1: "Bóveda",
      2: "Migración",
      3: "Finanzas",
      4: "Negocio",
      5: "Comunidad",
      6: "Academia",
      7: "Empleo",
    } satisfies Record<ModuleId, string>,
    primaryNavAria: "Navegación principal",
    tabBarAria: "Secciones principales",
    menu: "Menú",
    menuTitle: "Ir a",
    collapse: "Contraer el menú",
    expand: "Ampliar el menú",
    notifications: "Avisos",
    notificationsEmpty:
      "No tienes avisos nuevos. Aquí te llegarán tus fechas límite y los eventos de tu comunidad.",
    account: "Tu cuenta",
    settings: "Configuración",
    help: "Ayuda",
    investments: "Inversiones",
    /** §4.3 — botón fijo, para todos, en todas las pantallas del panel. */
    exploreAll: "Explorar todos los módulos",
    /** past_due §3.4.7 — acceso de solo lectura */
    readOnly: "Solo lectura",
    readOnlyHint:
      "Puedes leerlo todo, pero no guardar cambios hasta que se actualice tu pago.",
    readOnlyBlocked: "Actualiza tu pago para volver a guardar cambios.",
  },

  /** Hero card §4.4 */
  hero: {
    badge: "⭐ RECOMENDADO PARA TI",
    /** primary (teal-deep) */
    start: "Empezar aquí",
    /** ghost — mecanismo de corrección del usuario, nunca escondido */
    dismiss: "No es lo que busco",
    dismissAria: "Descartar esta recomendación y recalcular",
    dismissedToast: "Listo, lo tomamos en cuenta. Recalculamos tu orden.",
    /** §4.7 — a la tercera se oculta 7 días */
    dismissedThriceToast:
      "Ocultamos la recomendación por una semana. Abajo tienes los 7 módulos completos.",
    /** §4.7 — usuario que saltó el wizard: hero genérica */
    genericTitle: "Completa tu perfil para personalizar tu plan",
    genericBody:
      "Son 5 preguntas. Con ellas ordenamos los módulos según lo que necesitas de verdad.",
    genericCta: "Responder las 5 preguntas",
    /** Perfil incompleto (abandonó en el paso 3) */
    resumeTitle: "Te faltan unas preguntas",
    resumeBody: (step: number) =>
      `Quedaste en el paso ${step}. Retomamos ahí mismo, o sigues explorando por tu cuenta.`,
    resumeCta: "Retomar la entrevista",
  },

  /** Grid de módulos (§4.3: el botón siempre está, para todos). */
  grid: {
    title: "Explora todos los módulos",
    subtitle: "Los 7 están abiertos siempre. Arriba, los que más te sirven hoy.",
    /** Sugerencia secundaria (módulo #2, tira horizontal) */
    secondaryLabel: "También te puede servir",
    open: "Abrir",
    ariaCard: (moduleTitle: string) => `Abrir el módulo ${moduleTitle}`,
  },

  /** Objetivo de 30 días — texto del paso 5, editable (§4.2). */
  goal: {
    label: "Tu objetivo de estos 30 días",
    empty: "Todavía no elegiste un objetivo para este mes.",
    emptyCta: "Elegir mi objetivo",
    edit: "Cambiar objetivo",
    editTitle: "¿Qué quieres resolver primero?",
    save: "Guardar objetivo",
    savedToast: "Tu objetivo quedó actualizado.",
    placeholder: "Ej.: renovar mi permiso de trabajo antes de diciembre",
    counter: (used: number, max: number) => `${used} de ${max} caracteres`,
  },

  /** Banner de transición §3.2.3 — permanente y discreto, solo en pre_arrival. */
  arrivalBanner: {
    /** Exacto §3.2.3 */
    title: "¿Ya llegaste a Estados Unidos?",
    body: "Cuéntanos y tu panel cambia al contenido de aquí.",
    cta: "Sí, ya llegué",
    dismiss: "Todavía no",
    /** Mini-flujo de 2 campos */
    flowTitle: "Bienvenido. Dos datos y listo.",
    stateLabel: "¿En qué estado estás?",
    statePlaceholder: "Escribe para buscar tu estado",
    stateError: "Elige tu estado para continuar.",
    arrivalDateLabel: "¿Qué día llegaste?",
    arrivalDateHelp: "Si no recuerdas el día exacto, una fecha aproximada sirve.",
    confirm: "Confirmar mi llegada",
    cancel: "Ahora no",
    /** Pantalla de bienvenida tras migrar el contexto — exacto §3.2.3 */
    welcomeTitle: (state: string) => `Bienvenido a ${state}.`,
    welcomeSubtitle: "Esto es lo primero que deberías resolver.",
    welcomeCta: "Ver mi nueva prioridad",
    recalculatedToast: "Recalculamos tu plan con tu nueva ubicación.",
  },

  /** Sidebar contextual (§4.2). */
  sidebar: {
    eventsTitle: "Próximos eventos",
    eventsInUs: (state: string) => `Eventos en ${state}`,
    eventsEmpty: "Todavía no hay eventos publicados para tu zona.",
    alertsTitle: "Alertas",
    alertsSubtitle: "Fechas límite que estás siguiendo",
    alertsEmpty:
      "No tienes fechas límite guardadas. Agrégalas desde la Bóveda y te avisamos a 90, 60 y 30 días.",
    profileTitle: "Tu perfil",
    profileEdit: "Ver y editar mi perfil",
    linksTitle: "Enlaces oficiales",
    linksInUs: (state: string) => `Trámites de ${state}`,
    linksPreArrival: (country: string) => `Consulado de EE. UU. en ${country}`,
    linksCostTitle: "Costo estimado del trámite",
    linkVerifiedAt: (date: string) => `Verificado el ${date}`,
    linkOpensExternal: "Se abre en el sitio oficial",
    /** Disclaimer §6 — acompaña SIEMPRE a los enlaces externos */
    linksDisclaimer:
      "ANDEX no está afiliado a ninguna agencia gubernamental. Estos trámites son gratuitos en los portales oficiales.",
  },

  /**
   * CLAVES NUEVAS (agente Dashboard) — etiquetas de los recursos oficiales
   * de la tabla §6. Espejo del seed `external_resources` (0003_seed.sql):
   * las URLs y el alcance viven en `components/panel/external-links.ts`,
   * aquí solo el texto visible. Nunca se inventa un enlace ni una tarifa.
   */
  resources: {
    uscisCase: "Consultar el estado oficial de mi caso (USCIS)",
    eoirCourt: "Consultar mis fechas de corte de inmigración (EOIR)",
    ds160: "Llenar el formulario de visa DS-160",
    embassy: (country: string) => `Citas consulares — Embajada de EE. UU. en ${country}`,
    dmvUt: "Agendar cita para mi licencia de manejo (DMV Utah)",
    llcUt: "Registrar mi LLC en Utah (Division of Corporations)",
    ptin: "Solicitar mi PTIN del IRS (preparador de impuestos)",
    /** §4.2 sidebar pre_arrival: la tarifa la fija cada consulado; no se inventa. */
    costPending:
      "La tarifa oficial la publica cada consulado y cambia. Confírmala en el sitio de tu embajada antes de pagar nada.",
  },

  /** Sección "Para tu familia" — solo si seeking_for ≠ 'self' (§3.2.5 / §4.2). */
  family: {
    title: "Para tu familia",
    subtitle: "Contenido de preparación para quien todavía está fuera de Estados Unidos.",
    cta: "Ver la guía de preparación",
  },

  /** Avisos de estado de la suscripción (§3.4.7). */
  notices: {
    pastDueTitle: "Tu último pago no se procesó",
    pastDueBody: (days: number) =>
      `Tienes ${days} días de acceso de solo lectura. Actualiza tu método de pago para seguir guardando y editando.`,
    pastDueCta: "Actualizar mi pago",
    canceledTitle: "Tu membresía termina pronto",
    canceledBody: (date: string) =>
      `Tienes acceso completo hasta el ${date}. Tu cuenta y tus datos se quedan como están.`,
    canceledCta: "Reactivar mi membresía",
    expiredTitle: "Tu membresía venció",
    expiredBody:
      "Tus datos y tu perfil están intactos. Reactiva y vuelves a tu mismo plan, sin repetir la entrevista.",
    expiredCta: "Reactivar mi membresía",
  },

  /** Estados vacíos y carga. */
  empty: {
    loading: "Armando tu panel…",
    rankingFailed:
      "No pudimos cargar tu orden personalizado. Estos son los 7 módulos; toca Reintentar para recalcularlo.",
  },
};

export type PanelDict = typeof es;

const en = {
  pageTitle: "Your dashboard",

  greeting: (name: string) => `Hi, ${name} 👋`,
  greetingNoName: "Hi 👋",

  subtitle: {
    inUs: (state: string) => `Your priority in ${state} this month`,
    inUsNoState: "Your priority this month",
    preArrival: (country: string) => `Your path from ${country} to the United States`,
    preArrivalNoCountry: "Your path to the United States",
  },

  locationChip: {
    inUs: (state: string) => `🇺🇸 ${state}`,
    preArrival: (country: string) => `✈️ ${country}`,
    edit: "Change my location",
  },

  shell: {
    home: "Home",
    modulesNavTitle: "Your modules",
    moduleNav: {
      1: "Vault",
      2: "Immigration",
      3: "Finances",
      4: "Business",
      5: "Community",
      6: "Academy",
      7: "Jobs",
    },
    primaryNavAria: "Main navigation",
    tabBarAria: "Main sections",
    menu: "Menu",
    menuTitle: "Go to",
    collapse: "Collapse the menu",
    expand: "Expand the menu",
    notifications: "Alerts",
    notificationsEmpty:
      "No new alerts. Your deadlines and your community's events will show up here.",
    account: "Your account",
    settings: "Settings",
    help: "Help",
    investments: "Investments",
    exploreAll: "Explore all the modules",
    readOnly: "Read-only",
    readOnlyHint:
      "You can read everything, but you can't save changes until your payment is updated.",
    readOnlyBlocked: "Update your payment to save changes again.",
  },

  hero: {
    badge: "⭐ RECOMMENDED FOR YOU",
    start: "Start here",
    dismiss: "This isn't what I need",
    dismissAria: "Dismiss this recommendation and recalculate",
    dismissedToast: "Got it, we took that into account. We reordered your modules.",
    dismissedThriceToast:
      "We're hiding the recommendation for a week. All 7 modules are right below.",
    genericTitle: "Complete your profile to personalize your plan",
    genericBody:
      "It's 5 questions. With them we sort the modules by what you actually need.",
    genericCta: "Answer the 5 questions",
    resumeTitle: "You have a few questions left",
    resumeBody: (step: number) =>
      `You stopped at step ${step}. We'll pick up right there, or keep exploring on your own.`,
    resumeCta: "Resume the interview",
  },

  grid: {
    title: "Explore all the modules",
    subtitle: "All 7 are always open. The ones most useful to you today are on top.",
    secondaryLabel: "This could help too",
    open: "Open",
    ariaCard: (moduleTitle: string) => `Open the ${moduleTitle} module`,
  },

  goal: {
    label: "Your goal for these 30 days",
    empty: "You haven't picked a goal for this month yet.",
    emptyCta: "Choose my goal",
    edit: "Change goal",
    editTitle: "What do you want to solve first?",
    save: "Save goal",
    savedToast: "Your goal has been updated.",
    placeholder: "e.g., renew my work permit before December",
    counter: (used: number, max: number) => `${used} of ${max} characters`,
  },

  arrivalBanner: {
    title: "Did you already arrive in the United States?",
    body: "Tell us and your dashboard switches to content for life here.",
    cta: "Yes, I'm here",
    dismiss: "Not yet",
    flowTitle: "Welcome. Two details and you're set.",
    stateLabel: "Which state are you in?",
    statePlaceholder: "Type to search for your state",
    stateError: "Choose your state to continue.",
    arrivalDateLabel: "What day did you arrive?",
    arrivalDateHelp: "If you don't remember the exact day, an approximate date works.",
    confirm: "Confirm my arrival",
    cancel: "Not now",
    welcomeTitle: (state: string) => `Welcome to ${state}.`,
    welcomeSubtitle: "This is the first thing you should take care of.",
    welcomeCta: "See my new priority",
    recalculatedToast: "We recalculated your plan with your new location.",
  },

  sidebar: {
    eventsTitle: "Upcoming events",
    eventsInUs: (state: string) => `Events in ${state}`,
    eventsEmpty: "No events posted for your area yet.",
    alertsTitle: "Alerts",
    alertsSubtitle: "Deadlines you're tracking",
    alertsEmpty:
      "You have no saved deadlines. Add them from the Vault and we'll alert you at 90, 60, and 30 days.",
    profileTitle: "Your profile",
    profileEdit: "View and edit my profile",
    linksTitle: "Official links",
    linksInUs: (state: string) => `${state} procedures`,
    linksPreArrival: (country: string) => `U.S. consulate in ${country}`,
    linksCostTitle: "Estimated cost of the procedure",
    linkVerifiedAt: (date: string) => `Verified on ${date}`,
    linkOpensExternal: "Opens on the official site",
    linksDisclaimer:
      "ANDEX is not affiliated with any government agency. These procedures are free on the official portals.",
  },

  resources: {
    uscisCase: "Check my case's official status (USCIS)",
    eoirCourt: "Check my immigration court dates (EOIR)",
    ds160: "Fill out the DS-160 visa form",
    embassy: (country: string) => `Consular appointments — U.S. Embassy in ${country}`,
    dmvUt: "Book my driver's license appointment (Utah DMV)",
    llcUt: "Register my LLC in Utah (Division of Corporations)",
    ptin: "Apply for my IRS PTIN (tax preparer)",
    costPending:
      "Each consulate publishes its own fee and it changes. Confirm it on your embassy's site before paying anything.",
  },

  family: {
    title: "For your family",
    subtitle: "Preparation content for whoever is still outside the United States.",
    cta: "See the preparation guide",
  },

  notices: {
    pastDueTitle: "Your last payment didn't go through",
    pastDueBody: (days: number) =>
      `You have ${days} days of read-only access. Update your payment method to keep saving and editing.`,
    pastDueCta: "Update my payment",
    canceledTitle: "Your membership ends soon",
    canceledBody: (date: string) =>
      `You have full access until ${date}. Your account and your data stay as they are.`,
    canceledCta: "Reactivate my membership",
    expiredTitle: "Your membership expired",
    expiredBody:
      "Your data and profile are intact. Reactivate and you're back on the same plan, without redoing the interview.",
    expiredCta: "Reactivate my membership",
  },

  empty: {
    loading: "Building your dashboard…",
    rankingFailed:
      "We couldn't load your personalized order. Here are the 7 modules; tap Try again to recalculate it.",
  },
} satisfies PanelDict;

export const panel: Record<Lang, PanelDict> = { es, en };
