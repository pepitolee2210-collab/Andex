/**
 * ANDEX i18n — PERFIL (§3.2 regla UX 8, §3.4.6, §3.4.7).
 *
 * Todo lo del wizard se puede cambiar aquí, con recálculo del ranking
 * y toast de confirmación. La cancelación es de UN CLIC, por el mismo
 * medio (web), sin llamada, sin formulario y sin retención por chat.
 */

import type { Lang } from "@/lib/types";

const es = {
  title: "Tu perfil",
  subtitle: "Cambia lo que quieras. Tu plan se recalcula al guardar.",

  sections: {
    account: "Tu cuenta",
    location: "Tu ubicación",
    situation: "Tu situación",
    interests: "Tus intereses",
    goal: "Tu objetivo de 30 días",
    family: "¿Para quién buscas ayuda?",
    preferences: "Idioma y apariencia",
    subscription: "Tu membresía",
    danger: "Tu cuenta",
  },

  account: {
    firstNameLabel: "Nombre",
    lastNameLabel: "Apellido",
    emailLabel: "Correo electrónico",
    emailHelp: "Aquí llegan tus alertas y tus recibos.",
    phoneLabel: "Teléfono",
    changePassword: "Cambiar mi contraseña",
    save: "Guardar cambios",
  },

  location: {
    contextLabel: "¿Dónde estás ahora?",
    inUsLabel: "🇺🇸 Ya estoy en Estados Unidos",
    preArrivalLabel: "✈️ Estoy fuera de Estados Unidos",
    stateLabel: "Estado",
    countryLabel: "País de residencia",
    nationalityLabel: "Nacionalidad",
    timeLabel: "Tiempo en Estados Unidos",
    travelPlanLabel: "Plan de viaje",
    /** §3.2.2 — misma confirmación textual que en el wizard */
    changeBranchTitle: "¿Cambiar tu ubicación?",
    changeBranchBody:
      "Vas a cambiar tu ubicación. Se borrarán los datos que ya escribiste de la opción anterior. ¿Continuar?",
    changeBranchAccept: "Sí, cambiar",
    changeBranchCancel: "Dejarlo como está",
  },

  interests: {
    help: "Marca todas las que quieras. La primera que elijas es la que más pesa.",
    reorderHint: "Arrastra para cambiar el orden de prioridad.",
    /**
     * CLAVES NUEVAS (agente Dashboard). El orden de los intereses decide el
     * PRIMARY_INTEREST del motor (§3.3.1, D14), así que tiene que poder
     * cambiarse. Se hace con un botón por interés en vez de arrastrando:
     * arrastrar no funciona con teclado ni con lector de pantalla (§9).
     */
    orderTitle: "Tu orden de prioridad",
    makePrimary: "Poner primero",
    primaryBadge: "Principal",
  },

  goal: {
    help: "Se muestra tal cual lo escribas, arriba en tu panel.",
    counter: (used: number, max: number) => `${used} de ${max} caracteres`,
  },

  /** Recálculo del ranking al guardar (§4.7). */
  toasts: {
    saved: "Guardado.",
    /** Exacto del brief: confirmación de recálculo */
    recalculated: "Tu plan se actualizó.",
    saveFailed:
      "No se guardaron los cambios: se perdió la conexión. Lo que escribiste sigue en pantalla; toca Guardar otra vez.",
  },

  preferences: {
    languageLabel: "Idioma",
    languageHelp: "Cambia toda la aplicación, incluidos los correos.",
    themeLabel: "Apariencia",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeSystem: "Según mi dispositivo",
    notificationsLabel: "Avisos por correo",
    notificationsDeadlines: "Fechas límite de mis documentos",
    notificationsEvents: "Eventos y talleres de mi comunidad",
    notificationsProduct: "Novedades de ANDEX",
  },

  /** Estado de la suscripción (§3.4.7). */
  subscription: {
    planLabel: "Tu plan",
    planAnnual: "Anual",
    planMonthly: "Mensual",
    priceLabel: "Precio",
    priceAnnual: (price: string) => `${price} al año`,
    priceMonthly: (price: string) => `${price} al mes`,
    /** Promesa del sello — se repite aquí porque es vinculante */
    lockedRate: (price: string) =>
      `Tu tarifa está congelada en ${price} mientras mantengas la membresía.`,

    statusLabel: "Estado",
    statusActive: "Activa",
    statusTrialing: "En prueba",
    statusPastDue: "Pago pendiente",
    statusCanceled: "Cancelada",

    renewsOn: (date: string) => `Se renueva el ${date}.`,
    trialEndsOn: (date: string) => `Tu prueba termina el ${date}.`,
    accessUntil: (date: string) => `Tienes acceso hasta el ${date}.`,
    renewalNotice: "Te avisamos por correo 48 h antes de cada cobro.",

    invoicesTitle: "Recibos",
    invoicesHelp: "Cada cobro te llega por correo. Aquí puedes verlos todos.",
    invoicesEmpty: "Todavía no hay recibos.",
    paymentMethodLabel: "Método de pago",
    paymentMethodCard: (brand: string, last4: string) =>
      `${brand} terminada en ${last4}`,
    updatePaymentMethod: "Cambiar mi método de pago",

    /** Aviso past_due §3.4.7 — 7 días de solo lectura */
    pastDueTitle: "Tu último pago no se procesó",
    pastDueBody: (days: number, date: string) =>
      `Tu banco rechazó el cobro. Tienes acceso de solo lectura ${days} días, hasta el ${date}. Actualiza tu método de pago y todo vuelve a la normalidad.`,
    pastDueCta: "Actualizar mi método de pago",

    /** CANCELACIÓN EN UN CLIC (§3.4.6): mismo medio, sin retención. */
    cancel: "Cancelar membresía",
    cancelConfirmTitle: "¿Cancelar tu membresía?",
    /** Confirmación honesta: qué pasa, hasta cuándo, sin ofertas de retención */
    cancelConfirmBody: (date: string) =>
      `Tu acceso sigue hasta el ${date} y no se te vuelve a cobrar. Tu cuenta, tus documentos y tus respuestas se quedan como están.`,
    cancelConfirmAccept: "Sí, cancelar",
    cancelConfirmCancel: "Seguir con mi membresía",
    canceledToast: (date: string) =>
      `Membresía cancelada. Tienes acceso hasta el ${date}.`,
    canceledBanner: (date: string) =>
      `Cancelaste tu membresía. Tienes acceso hasta el ${date}.`,
    cancelFailed:
      "No pudimos registrar la cancelación: se perdió la conexión. Toca Cancelar membresía otra vez; no se hizo ningún cobro nuevo.",

    /** Motivo opcional — se pide DESPUÉS de cancelar, nunca como obstáculo */
    reasonTitle: "¿Nos cuentas por qué? (opcional)",
    reasonHelp: "Ya está cancelada. Esto solo nos ayuda a mejorar.",
    reasonPlaceholder: "Escribe lo que quieras",
    reasonSubmit: "Enviar",
    reasonSkip: "No, gracias",

    /** Reactivación §3.4.7 — vuelve al mismo ranking */
    reactivate: "Reactivar mi membresía",
    reactivateBody:
      "Vuelves a tu mismo plan y a tu mismo orden de módulos. No hay que repetir la entrevista.",
    reactivatedToast: "Membresía reactivada. Bienvenido de vuelta.",

    /** Sin suscripción activa */
    noneTitle: "No tienes una membresía activa",
    noneBody: "Tu perfil y tus respuestas siguen guardados. Actívala cuando quieras.",
    noneCta: "Ver los planes",
  },

  danger: {
    logout: "Cerrar sesión",
    deleteAccount: "Eliminar mi cuenta",
    deleteConfirmTitle: "¿Eliminar tu cuenta?",
    deleteConfirmBody:
      "Se borran tu perfil, tus documentos y tus respuestas. Esto no se puede deshacer. Si solo quieres dejar de pagar, cancela la membresía y conserva tus datos.",
    deleteConfirmAccept: "Sí, eliminar todo",
    deleteConfirmCancel: "Mejor no",
  },
};

export type PerfilDict = typeof es;

const en = {
  title: "Your profile",
  subtitle: "Change whatever you want. Your plan recalculates when you save.",

  sections: {
    account: "Your account",
    location: "Your location",
    situation: "Your situation",
    interests: "Your interests",
    goal: "Your 30-day goal",
    family: "Who are you looking for help for?",
    preferences: "Language and appearance",
    subscription: "Your membership",
    danger: "Your account",
  },

  account: {
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    emailLabel: "Email",
    emailHelp: "This is where your alerts and receipts go.",
    phoneLabel: "Phone",
    changePassword: "Change my password",
    save: "Save changes",
  },

  location: {
    contextLabel: "Where are you right now?",
    inUsLabel: "🇺🇸 I'm already in the United States",
    preArrivalLabel: "✈️ I'm outside the United States",
    stateLabel: "State",
    countryLabel: "Country of residence",
    nationalityLabel: "Nationality",
    timeLabel: "Time in the United States",
    travelPlanLabel: "Travel plan",
    changeBranchTitle: "Change your location?",
    changeBranchBody:
      "You're about to change your location. The details you entered for the previous option will be erased. Continue?",
    changeBranchAccept: "Yes, change it",
    changeBranchCancel: "Leave it as is",
  },

  interests: {
    help: "Check as many as you want. The first one you pick carries the most weight.",
    reorderHint: "Drag to change the priority order.",
    orderTitle: "Your priority order",
    makePrimary: "Move to first",
    primaryBadge: "Primary",
  },

  goal: {
    help: "It shows exactly as you write it, at the top of your dashboard.",
    counter: (used: number, max: number) => `${used} of ${max} characters`,
  },

  toasts: {
    saved: "Saved.",
    recalculated: "Your plan has been updated.",
    saveFailed:
      "Your changes weren't saved: the connection dropped. What you typed is still on screen; tap Save again.",
  },

  preferences: {
    languageLabel: "Language",
    languageHelp: "Changes the whole app, emails included.",
    themeLabel: "Appearance",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "Match my device",
    notificationsLabel: "Email alerts",
    notificationsDeadlines: "Deadlines for my documents",
    notificationsEvents: "Events and workshops in my community",
    notificationsProduct: "ANDEX updates",
  },

  subscription: {
    planLabel: "Your plan",
    planAnnual: "Annual",
    planMonthly: "Monthly",
    priceLabel: "Price",
    priceAnnual: (price: string) => `${price} a year`,
    priceMonthly: (price: string) => `${price} a month`,
    lockedRate: (price: string) =>
      `Your rate is locked at ${price} for as long as you keep the membership.`,

    statusLabel: "Status",
    statusActive: "Active",
    statusTrialing: "In trial",
    statusPastDue: "Payment pending",
    statusCanceled: "Canceled",

    renewsOn: (date: string) => `Renews on ${date}.`,
    trialEndsOn: (date: string) => `Your trial ends on ${date}.`,
    accessUntil: (date: string) => `You have access until ${date}.`,
    renewalNotice: "We email you 48 hours before every charge.",

    invoicesTitle: "Receipts",
    invoicesHelp: "Every charge is emailed to you. You can see them all here.",
    invoicesEmpty: "No receipts yet.",
    paymentMethodLabel: "Payment method",
    paymentMethodCard: (brand: string, last4: string) =>
      `${brand} ending in ${last4}`,
    updatePaymentMethod: "Change my payment method",

    pastDueTitle: "Your last payment didn't go through",
    pastDueBody: (days: number, date: string) =>
      `Your bank declined the charge. You have read-only access for ${days} days, until ${date}. Update your payment method and everything goes back to normal.`,
    pastDueCta: "Update my payment method",

    cancel: "Cancel membership",
    cancelConfirmTitle: "Cancel your membership?",
    cancelConfirmBody: (date: string) =>
      `Your access continues until ${date} and you won't be charged again. Your account, your documents, and your answers stay as they are.`,
    cancelConfirmAccept: "Yes, cancel",
    cancelConfirmCancel: "Keep my membership",
    canceledToast: (date: string) =>
      `Membership canceled. You have access until ${date}.`,
    canceledBanner: (date: string) =>
      `You canceled your membership. You have access until ${date}.`,
    cancelFailed:
      "We couldn't register the cancellation: the connection dropped. Tap Cancel membership again; no new charge was made.",

    reasonTitle: "Want to tell us why? (optional)",
    reasonHelp: "It's already canceled. This just helps us improve.",
    reasonPlaceholder: "Write whatever you want",
    reasonSubmit: "Send",
    reasonSkip: "No, thanks",

    reactivate: "Reactivate my membership",
    reactivateBody:
      "You go back to the same plan and the same module order. No need to redo the interview.",
    reactivatedToast: "Membership reactivated. Welcome back.",

    noneTitle: "You don't have an active membership",
    noneBody: "Your profile and your answers are still saved. Activate it whenever you want.",
    noneCta: "See the plans",
  },

  danger: {
    logout: "Log out",
    deleteAccount: "Delete my account",
    deleteConfirmTitle: "Delete your account?",
    deleteConfirmBody:
      "This erases your profile, your documents, and your answers. It can't be undone. If you only want to stop paying, cancel the membership and keep your data.",
    deleteConfirmAccept: "Yes, delete everything",
    deleteConfirmCancel: "Never mind",
  },
} satisfies PerfilDict;

export const perfil: Record<Lang, PerfilDict> = { es, en };
