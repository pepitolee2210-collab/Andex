/**
 * ANDEX i18n — PAYWALL PERSONALIZADO (§3.4).
 *
 * Principio §3.4.1: el paywall no vende funciones, muestra el plan que el
 * usuario acaba de construir. Nada de urgencia: sin contadores, sin cupos,
 * sin descuentos que expiren (§3.4.1 y §3.4.6 "sin patrones oscuros").
 *
 * Los montos llegan ya formateados desde el feature (formatUsd + PRICES),
 * nunca se fijan aquí en texto salvo en el eco literal del wireframe.
 */

import type { Lang } from "@/lib/types";

const es = {
  /** <title> del documento. No lleva el nombre: la pestaña no es el titular. */
  pageTitle: "Tu plan ANDEX",
  /** Exacto §3.4.2 */
  eyebrow: "ÚLTIMO PASO",
  /** Exacto §3.4.2 — con el nombre del paso 1 */
  title: (name: string) => `Tu plan está listo, ${name}.`,
  /** Fallback si el usuario saltó el paso 1 */
  titleNoName: "Tu plan está listo.",
  /** Exacto §3.4.2 */
  subtitle: "Esto es lo que armamos con tus respuestas.",

  /**
   * Lo que incluye la membresía, dicho aquí y no después. Las cuatro filas
   * fijas cierran con los módulos que TODAVÍA no están abiertos: si eso se
   * cuenta después del cobro, es una sorpresa; contado antes, es un plazo.
   */
  includes: {
    label: "Incluye",
    vault: {
      title: "Bóveda con avisos de vencimiento",
      meta: "Cifrada en tu teléfono, sin copia en servidor",
    },
    academy: {
      title: "Academia: inglés para el trabajo",
      meta: "Nueve temarios, con manual en PDF",
    },
    workshops: {
      title: "Talleres en vivo",
      meta: "De martes a viernes",
    },
    pending: {
      title: "Los cuatro módulos que faltan",
      meta: "Se abren durante el piloto",
    },
  },

  /** El aviso que acompaña al botón: quién cobra y qué no tocamos. */
  gatewayNotice:
    "El pago se hace en una pasarela externa. La aplicación nunca toca un número de tarjeta.",

  /** Tarjeta de resumen — eco del ranking (§3.4.3, personalización obligatoria). */
  summary: {
    ariaLabel: "Resumen de tu plan",
    /** Módulo #1 del ranking */
    topModule: (moduleName: string) => moduleName,
    /** Badge ámbar sobre el módulo #1 */
    priorityBadge: "TU PRIORIDAD",
    /** Módulo #2 + el resto */
    secondModule: (moduleName: string, remaining: number) =>
      `${moduleName} y los ${remaining} módulos restantes`,
    alerts: "Alertas de tus fechas límite",
    /** Referencia geográfica: estado (in_us) o país (pre_arrival) */
    community: (count: string, place: string) =>
      `Comunidad de ${count} familias en ${place}`,
    communityNoPlace: (count: string) => `Comunidad de ${count} familias`,
    /** Solo si seeking_for ≠ 'self' */
    familyLine: "Contenido de preparación para tu familiar",
    /** Solo si location_context = pre_arrival */
    currencyNote: "Se cobra en dólares. Tu banco aplica el cambio del día.",
  },

  plans: {
    chooseLabel: "Elige tu plan",
    monthly: {
      name: "Mensual",
      /** §3.4.4 */
      period: "/mes",
      pitch: "Flexible. Cancelas cuando quieras.",
      /**
       * La misma multiplicación que el anual, vista desde el otro lado.
       * No es un precio ni una amenaza: es lo que cuesta sostener el plan
       * mensual doce meses, y es la cifra con la que se compara el anual.
       * Sin ella, la resta del "Ahorras $28" había que hacerla de cabeza.
       */
      yearly: (amount: string) => `Son ${amount} al año`,
      select: "Elegir el plan mensual",
    },
    annual: {
      name: "Anual",
      period: "/año",
      /**
       * §3.4.2 pide «Más elegido». Se aparta a propósito: es una afirmación
       * sobre lo que ha hecho otra gente y todavía no la ha hecho nadie —el
       * piloto no ha empezado—. Es la misma prueba social fabricada por la
       * que la sección de reseñas de la landing sale vacía. «Recomendado»
       * dice lo mismo en primera persona y es verdad.
       */
      badge: "Recomendado",
      /** Exacto §3.4.2 */
      equivalent: (monthly: string) => `Equivale a ${monthly}/mes`,
      /** Exacto §3.4.2 — chip */
      savings: (amount: string) => `Ahorras ${amount} al año`,
      select: "Elegir el plan anual",
    },
    selectedAria: "Plan seleccionado",
  },

  /** EL SELLO (§2.9 + §3.4.4). Único elemento decorativo del producto. */
  seal: {
    title: "Tarifa congelada",
    /** Exacto §3.4.4 */
    body: (price: string) =>
      `Pagas ${price} mientras mantengas tu membresía, aunque el precio suba.`,
    ariaLabel: "Sello de tarifa congelada",
  },

  /** CTA — el verbo dice exactamente qué pasa. */
  cta: {
    annual: (price: string) => `Continuar con el plan anual — ${price}`,
    monthly: (price: string) => `Continuar con el plan mensual — ${price}`,
    /** Contingencia A, §3.4.8: solo cambia el copy del botón */
    trialAnnual: (days: number) => `Empezar mi prueba de ${days} días`,
    trialMonthly: (days: number) => `Empezar mi prueba de ${days} días`,
    trialNote: (days: number, price: string) =>
      `Gratis ${days} días. Después ${price}, y te avisamos 48 h antes del primer cobro.`,
    /** Contingencia B, §3.4.8 */
    freemium: "Entrar con la versión gratuita",
    freemiumNote:
      "La Bóveda y el directorio son gratis. La gestoría, la revisión humana y la academia van con membresía.",
  },

  /** Fila de confianza — emojis exactos del wireframe §3.4.2. */
  trust: {
    stripe: "🔒 Pago seguro con Stripe",
    cancel: "↩︎ Cancelas en un clic",
    guarantee: "🛡️ 14 días de garantía",
  },

  /** Divulgación de términos materiales, visible sin scroll (§3.4.6). */
  legal: {
    renewal:
      "La membresía se renueva automáticamente. Te avisamos 48 h antes de cada cobro.",
    consent: "Al continuar aceptas los Términos de servicio y la renovación automática.",
    termsLink: "Términos de servicio",
    privacyLink: "Política de privacidad",
  },

  /** Exacto §3.4.2 — salida sin castigo */
  back: "Volver a mis respuestas",

  /** Usuario que llega al paywall sin haber completado la entrevista (§4.7). */
  noProfile: {
    title: "Arma tu plan primero",
    body: "Responde 5 preguntas y verás qué módulos te tocan antes de decidir si pagas.",
    cta: "Responder las 5 preguntas",
  },

  /** Estado de reingreso: el perfil queda guardado (§3.4.7). */
  returning: {
    banner: "Tu plan sigue guardado tal como lo dejaste. No hay que repetir nada.",
  },
};

export type PaywallDict = typeof es;

const en = {
  pageTitle: "Your ANDEX plan",
  eyebrow: "LAST STEP",
  title: (name: string) => `Your plan is ready, ${name}.`,
  titleNoName: "Your plan is ready.",
  subtitle: "This is what we built from your answers.",

  includes: {
    label: "Included",
    vault: {
      title: "Vault with expiry alerts",
      meta: "Encrypted on your phone, no copy on a server",
    },
    academy: {
      title: "Academy: English for work",
      meta: "Nine courses, each with a PDF manual",
    },
    workshops: {
      title: "Live workshops",
      meta: "Tuesday through Friday",
    },
    pending: {
      title: "The four modules still missing",
      meta: "They open during the pilot",
    },
  },

  gatewayNotice:
    "Payment happens on an external gateway. The app never touches a card number.",

  summary: {
    ariaLabel: "Summary of your plan",
    topModule: (moduleName: string) => moduleName,
    priorityBadge: "YOUR PRIORITY",
    secondModule: (moduleName: string, remaining: number) =>
      `${moduleName} and the remaining ${remaining} modules`,
    alerts: "Alerts for your deadlines",
    community: (count: string, place: string) =>
      `A community of ${count} families in ${place}`,
    communityNoPlace: (count: string) => `A community of ${count} families`,
    familyLine: "Preparation content for your family member",
    currencyNote: "You're charged in U.S. dollars. Your bank applies the day's exchange rate.",
  },

  plans: {
    chooseLabel: "Choose your plan",
    monthly: {
      name: "Monthly",
      period: "/month",
      pitch: "Flexible. Cancel whenever you want.",
      yearly: (amount: string) => `That is ${amount} a year`,
      select: "Choose the monthly plan",
    },
    annual: {
      name: "Annual",
      period: "/year",
      badge: "Recommended",
      equivalent: (monthly: string) => `Works out to ${monthly}/month`,
      savings: (amount: string) => `You save ${amount} a year`,
      select: "Choose the annual plan",
    },
    selectedAria: "Selected plan",
  },

  seal: {
    title: "Locked-in rate",
    body: (price: string) =>
      `You pay ${price} for as long as you keep your membership, even if the price goes up.`,
    ariaLabel: "Locked-in rate seal",
  },

  cta: {
    annual: (price: string) => `Continue with the annual plan — ${price}`,
    monthly: (price: string) => `Continue with the monthly plan — ${price}`,
    trialAnnual: (days: number) => `Start my ${days}-day trial`,
    trialMonthly: (days: number) => `Start my ${days}-day trial`,
    trialNote: (days: number, price: string) =>
      `Free for ${days} days. Then ${price}, and we'll remind you 48 hours before the first charge.`,
    freemium: "Continue with the free version",
    freemiumNote:
      "The Vault and the directory are free. Filing help, human review, and the academy come with the membership.",
  },

  trust: {
    stripe: "🔒 Secure payment with Stripe",
    cancel: "↩︎ Cancel in one click",
    guarantee: "🛡️ 14-day guarantee",
  },

  legal: {
    renewal:
      "Your membership renews automatically. We notify you 48 hours before every charge.",
    consent: "By continuing you accept the Terms of Service and automatic renewal.",
    termsLink: "Terms of Service",
    privacyLink: "Privacy Policy",
  },

  back: "Back to my answers",

  noProfile: {
    title: "Build your plan first",
    body: "Answer 5 questions and you'll see which modules are yours before deciding whether to pay.",
    cta: "Answer the 5 questions",
  },

  returning: {
    banner: "Your plan is still saved exactly as you left it. Nothing to redo.",
  },
} satisfies PaywallDict;

export const paywall: Record<Lang, PaywallDict> = { es, en };
