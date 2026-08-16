/**
 * ANDEX i18n — PERFIL (§3.2 regla UX 8, §3.4.6, §3.4.7).
 *
 * Todo lo del wizard se puede cambiar aquí, con recálculo del ranking
 * y toast de confirmación. La cancelación es de UN CLIC, por el mismo
 * medio (web), sin llamada, sin formulario y sin retención por chat.
 *
 * ── Lo que cambió al portar la pantalla del sistema de diseño ──
 *
 * Perfil dejó de ser un formulario largo y pasó a ser una LISTA: cada fila
 * dice qué guarda y abre su propio detalle. Por eso aparecen `rows` (los
 * rótulos de esas filas, con su dato al lado) y desaparecen las etiquetas
 * de sección con forma de titular.
 *
 * El control de tema vive aquí, en su propio grupo, con dos opciones y
 * ninguna tercera: el diseño lo dice explícitamente —"no sigue al sistema
 * ni a la hora, a propósito"—, porque la app se usa bajo sol directo y de
 * noche en la misma media hora, y si alguien lo eligió no se le mueve.
 *
 * El aviso de pago vencido se redactó de nuevo siguiendo la pantalla
 * "Pago vencido": qué pasa con la bóveda si no se paga, dicho sin amenaza
 * y sin cuenta atrás, y diciendo en la misma frase que nadie borra nada.
 */

import type { Lang } from "@/lib/types";

const es = {
  title: "Perfil",

  /** Rótulos de sección: separan, no compiten. Los del diseño, literales. */
  sections: {
    account: "Cuenta",
    plan: "Tu plan",
    subscription: "Suscripción",
    data: "Tus datos",
  },

  /** La tarjeta de identidad: quién eres y desde cuándo. */
  identity: {
    /** «Utah · desde mayo de 2025» */
    meta: (scope: string, since: string) => `${scope} · desde ${since}`,
    /** Un perfil antiguo puede no tener ámbito: entonces sólo la fecha. */
    metaNoScope: (since: string) => `Desde ${since}`,
  },

  /** Las filas de la lista. Cada una abre su detalle. */
  rows: {
    account: "Mis datos",
    accountMeta: "Nombre, correo, teléfono",

    language: "Idioma",

    theme: "Tema",
    themeHelp:
      "De noche la pantalla no brilla. Se queda como lo dejes, no cambia solo.",
    themeDay: "Día",
    themeNight: "Noche",
    themeAria: "Tema de la aplicación",

    location: "Dónde estoy",
    locationEmpty: "Sin ubicación",

    situation: "Tu situación",
    situationEmpty: "Sin responder",

    interests: "Tus intereses",
    interestsCount: (count: number) =>
      count === 1 ? "1 tema marcado" : `${count} temas marcados`,
    interestsEmpty: "Ninguno marcado",

    goal: "Tu objetivo de 30 días",
    goalEmpty: "Todavía sin escribir",

    family: "Para quién buscas ayuda",

    logout: "Cerrar sesión",
    /** Promesa y límite en la misma frase (§2.7). */
    logoutMeta: "Se cierra en este teléfono. Tus documentos se quedan aquí.",
  },

  /**
   * El cierre de la pantalla. Dice el límite del cifrado en la misma frase
   * que lo promete: este público ya oyó "nivel bancario" de quien lo estafó.
   */
  vaultNotice:
    "Los documentos están cifrados en este teléfono y no hay copia en otro sitio. Si lo pierdes, no podemos recuperarlos.",

  account: {
    firstNameLabel: "Nombre",
    lastNameLabel: "Apellido",
    emailLabel: "Correo electrónico",
    emailHelp: "Aquí llegan tus alertas y tus recibos.",
    phoneLabel: "Teléfono",
    save: "Guardar cambios",
  },

  location: {
    contextLabel: "¿Dónde estás ahora?",
    inUsLabel: "Ya estoy en EE. UU.",
    preArrivalLabel: "Estoy fuera de EE. UU.",
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
    /**
     * El orden de los intereses decide el PRIMARY_INTEREST del motor
     * (§3.3.1, D14), así que tiene que poder cambiarse. Se hace con un botón
     * por interés en vez de arrastrando: arrastrar no funciona con teclado
     * ni con lector de pantalla (§9).
     */
    orderTitle: "Tu orden de prioridad",
    makePrimary: "Poner primero",
    primaryBadge: "Principal",
  },

  /** Recálculo del ranking al guardar (§4.7). */
  toasts: {
    /** Exacto del brief: confirmación de recálculo */
    recalculated: "Tu plan se actualizó.",
    saveFailed:
      "No se guardaron los cambios: se perdió la conexión. Lo que escribiste sigue en pantalla; toca Guardar otra vez.",
  },

  preferences: {
    languageHelp: "Cambia toda la aplicación, incluidos los correos.",
  },

  /** Estado de la suscripción (§3.4.7). */
  subscription: {
    planAnnual: "Plan anual",
    planMonthly: "Plan mensual",
    priceAnnual: (price: string) => `${price} al año`,
    priceMonthly: (price: string) => `${price} al mes`,
    /** El dato de la fila: precio y qué pasa después, en una línea. */
    rowMeta: (price: string, when: string) => `${price} · ${when}`,
    renewsShort: (date: string) => `se renueva el ${date}`,
    trialShort: (date: string) => `la prueba termina el ${date}`,
    accessShort: (date: string) => `tienes acceso hasta el ${date}`,
    /** Promesa del sello — se repite aquí porque es vinculante */
    lockedRate: (price: string) =>
      `Tu tarifa está congelada en ${price} mientras mantengas la membresía.`,

    statusActive: "Activa",
    statusTrialing: "En prueba",
    statusPastDue: "Pago vencido",
    statusCanceled: "Cancelada",

    renewsOn: (date: string) => `Se renueva el ${date}.`,
    trialEndsOn: (date: string) => `Tu prueba termina el ${date}.`,
    accessUntil: (date: string) => `Tienes acceso hasta el ${date}.`,
    renewalNotice: "Te avisamos por correo 48 h antes de cada cobro.",

    invoicesTitle: "Recibos",
    invoicesEmpty: "Todavía no hay recibos.",

    /**
     * §3.4.7 — pago vencido. La pantalla del diseño manda: qué pasa con la
     * bóveda si no se paga, sin amenaza y sin cuenta atrás, y diciendo que
     * los documentos no se tocan.
     */
    pastDueEyebrow: "Pago vencido",
    pastDueTitle: "Puedes leer tus documentos, pero no añadir nuevos",
    pastDueBody: (days: number) =>
      `Tienes ${days} días para actualizar el pago. Tus documentos siguen en tu teléfono y nadie los borra.`,
    pastDueCta: "Actualizar el pago",

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
};

export type PerfilDict = typeof es;

const en = {
  title: "Profile",

  sections: {
    account: "Account",
    plan: "Your plan",
    subscription: "Subscription",
    data: "Your data",
  },

  identity: {
    meta: (scope: string, since: string) => `${scope} · since ${since}`,
    metaNoScope: (since: string) => `Since ${since}`,
  },

  rows: {
    account: "My details",
    accountMeta: "Name, email, phone",

    language: "Language",

    theme: "Theme",
    themeHelp:
      "At night the screen doesn't glare. It stays how you leave it, it doesn't change on its own.",
    themeDay: "Day",
    themeNight: "Night",
    themeAria: "App theme",

    location: "Where I am",
    locationEmpty: "No location",

    situation: "Your situation",
    situationEmpty: "Not answered",

    interests: "Your interests",
    interestsCount: (count: number) =>
      count === 1 ? "1 topic checked" : `${count} topics checked`,
    interestsEmpty: "None checked",

    goal: "Your 30-day goal",
    goalEmpty: "Not written yet",

    family: "Who you're looking for help for",

    logout: "Log out",
    logoutMeta: "It logs out on this phone. Your documents stay here.",
  },

  vaultNotice:
    "Your documents are encrypted on this phone and there's no copy anywhere else. If you lose it, we can't recover them.",

  account: {
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    emailLabel: "Email",
    emailHelp: "This is where your alerts and receipts go.",
    phoneLabel: "Phone",
    save: "Save changes",
  },

  location: {
    contextLabel: "Where are you right now?",
    inUsLabel: "I'm already in the U.S.",
    preArrivalLabel: "I'm outside the U.S.",
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
    orderTitle: "Your priority order",
    makePrimary: "Move to first",
    primaryBadge: "Primary",
  },

  toasts: {
    recalculated: "Your plan has been updated.",
    saveFailed:
      "Your changes weren't saved: the connection dropped. What you typed is still on screen; tap Save again.",
  },

  preferences: {
    languageHelp: "Changes the whole app, emails included.",
  },

  subscription: {
    planAnnual: "Annual plan",
    planMonthly: "Monthly plan",
    priceAnnual: (price: string) => `${price} a year`,
    priceMonthly: (price: string) => `${price} a month`,
    rowMeta: (price: string, when: string) => `${price} · ${when}`,
    renewsShort: (date: string) => `renews on ${date}`,
    trialShort: (date: string) => `the trial ends on ${date}`,
    accessShort: (date: string) => `you have access until ${date}`,
    lockedRate: (price: string) =>
      `Your rate is locked at ${price} for as long as you keep the membership.`,

    statusActive: "Active",
    statusTrialing: "In trial",
    statusPastDue: "Payment overdue",
    statusCanceled: "Canceled",

    renewsOn: (date: string) => `Renews on ${date}.`,
    trialEndsOn: (date: string) => `Your trial ends on ${date}.`,
    accessUntil: (date: string) => `You have access until ${date}.`,
    renewalNotice: "We email you 48 hours before every charge.",

    invoicesTitle: "Receipts",
    invoicesEmpty: "No receipts yet.",

    pastDueEyebrow: "Payment overdue",
    pastDueTitle: "You can read your documents, but not add new ones",
    pastDueBody: (days: number) =>
      `You have ${days} days to update the payment. Your documents stay on your phone and nobody deletes them.`,
    pastDueCta: "Update the payment",

    cancel: "Cancel membership",
    cancelConfirmTitle: "Cancel your membership?",
    cancelConfirmBody: (date: string) =>
      `Your access continues until ${date} and you won't be charged again. Your account, your documents, and your answers stay as they are.`,
    cancelConfirmAccept: "Yes, cancel",
    cancelConfirmCancel: "Keep my membership",
    canceledToast: (date: string) =>
      `Membership canceled. You have access until ${date}.`,
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
} satisfies PerfilDict;

export const perfil: Record<Lang, PerfilDict> = { es, en };
