/**
 * ANDEX i18n — CHECKOUT (§3.4.5) y estados de pago (§3.4.7).
 *
 * Pantalla separada, no modal. ANDEX nunca toca datos de tarjeta:
 * los campos son de Stripe Elements.
 *
 * Errores §2.7 + §3.4.7: específicos ("Tu banco rechazó el cargo"),
 * nunca genéricos, y siempre con la salida a la mano.
 */

import type { Lang } from "@/lib/types";

const es = {
  /** Exacto §3.4.5, punto 1 — siempre visible */
  changePlan: "← Cambiar de plan",

  title: "Confirma y entra",
  subtitle: "Un paso y tu panel queda abierto.",

  /** §3.4.5, punto 2 */
  order: {
    heading: "Resumen del pedido",
    conceptLabel: "Concepto",
    conceptAnnual: "Membresía ANDEX — plan anual",
    conceptMonthly: "Membresía ANDEX — plan mensual",
    renewalLabel: "Renovación",
    renewalAnnual: "Cada 12 meses, hasta que canceles",
    renewalMonthly: "Cada mes, hasta que canceles",
    firstChargeLabel: "Primer cobro",
    firstChargeToday: "Hoy",
    firstChargeAfterTrial: (date: string) => `El ${date}, al terminar tu prueba`,
    totalLabel: "Total de hoy",
    totalCurrency: "USD",
    nextChargeLabel: "Próximo cobro",
    nextChargeValue: (date: string) => `El ${date}`,
  },

  /** §3.4.5, puntos 3 y 4 */
  wallets: {
    applePay: "Pagar con Apple Pay",
    googlePay: "Pagar con Google Pay",
    divider: "o paga con tarjeta",
  },

  /** §3.4.5, punto 5 — etiquetas para los campos de Stripe Elements */
  card: {
    numberLabel: "Número de tarjeta",
    expiryLabel: "Vencimiento",
    expiryPlaceholder: "MM/AA",
    cvcLabel: "CVC",
    cvcHelp: "Los 3 dígitos del reverso de tu tarjeta.",
    postalLabel: "Código postal",
    postalHelp: "El que aparece en el estado de cuenta de tu tarjeta.",
    nameLabel: "Nombre como aparece en la tarjeta",
  },

  /** §3.4.5, punto 6 — el verbo dice exactamente qué pasa */
  submit: {
    pay: (price: string) => `Pagar ${price} y entrar`,
    trial: (days: number) => `Empezar mi prueba de ${days} días`,
    processing: "Procesando tu pago…",
    /** Nunca cerrar la pestaña mientras corre el cargo */
    processingHint: "No cierres esta página.",
  },

  /** §3.4.5, punto 7 */
  secureNote: "🔒 Conexión cifrada. ANDEX no almacena tu tarjeta.",

  /** Consentimiento afirmativo expreso §3.4.6 — casilla NUNCA premarcada */
  consent: {
    checkbox:
      "Entiendo que la membresía se renueva automáticamente y que puedo cancelarla en un clic.",
    error: "Marca la casilla para confirmar que entiendes la renovación automática.",
  },

  /** ERRORES DE PAGO §3.4.7 — cada uno nombra la causa y ofrece otro camino. */
  errors: {
    /** Exacto del PRD como ejemplo de mensaje específico */
    cardDeclined:
      "Tu banco rechazó el cargo. Llámalos para autorizarlo o prueba con otra tarjeta; tu plan queda guardado.",
    insufficientFunds:
      "La tarjeta no tiene fondos suficientes para este cargo. Prueba con otra tarjeta o inténtalo cuando tengas saldo.",
    expiredCard:
      "Esta tarjeta ya venció. Revisa la fecha o usa otra tarjeta.",
    incorrectCvc:
      "El código CVC no coincide. Son los 3 dígitos del reverso de la tarjeta.",
    incorrectNumber:
      "El número de tarjeta no es válido. Revísalo dígito por dígito.",
    incorrectPostalCode:
      "El código postal no coincide con el de tu tarjeta. Usa el que aparece en tu estado de cuenta.",
    processingError:
      "El procesador de pagos no respondió a tiempo. Espera un minuto y toca Pagar otra vez: no se hizo ningún cargo.",
    authenticationRequired:
      "Tu banco pide confirmar el cargo. Abre la app de tu banco, autoriza la compra y vuelve a intentar.",
    currencyNotSupported:
      "Tu tarjeta no acepta cargos en dólares. Prueba con otra tarjeta o con Apple Pay o Google Pay.",
    network:
      "Se perdió la conexión antes de terminar. Revisa tu internet y toca Pagar otra vez: si el cargo pasó, no se repite.",
    generic:
      "El pago no se completó y no se hizo ningún cargo. Prueba con otra tarjeta o inténtalo en unos minutos.",
    /** Reintento sin perder el perfil §3.4.7 */
    profileSafe: "Tu perfil y tu plan siguen guardados.",
    tryAnotherMethod: "Probar con otro método",
  },

  /** Éxito — §3.4.7 recibo por correo */
  success: {
    eyebrow: "LISTO",
    title: (name: string) => `Ya estás dentro, ${name}.`,
    titleNoName: "Ya estás dentro.",
    body: "Tu panel está abierto con tu prioridad de este mes arriba del todo.",
    receipt: (email: string) => `Te enviamos el recibo a ${email}.`,
    renewalReminder:
      "Te avisamos 48 h antes de cada renovación, con el enlace para cancelar.",
    cta: "Ir a mi panel",
    trialTitle: (days: number) => `Tu prueba de ${days} días empezó.`,
    trialBody: (date: string) =>
      `El primer cobro sería el ${date}. Te avisamos 48 h antes y puedes cancelar en un clic hasta ese día.`,
  },

  /** Abandono §3.4.7: el perfil queda guardado */
  abandon: {
    title: "¿Dejamos el pago para después?",
    body: "Tu plan queda guardado. Cuando vuelvas entras directo aquí, sin repetir la entrevista.",
    stay: "Seguir con el pago",
    leave: "Salir por ahora",
  },

  /**
   * MODO DEMOSTRACIÓN — sin credenciales de Stripe (decisión D2).
   * No es copy de producción: existe para que quien recorre el embudo sepa
   * que está viendo una simulación. Se enseña en pantalla a propósito; el
   * PRD prohíbe engañar al usuario y eso incluye a quien prueba el producto.
   */
  demo: {
    badge: "MODO DEMOSTRACIÓN",
    title: "Este pago es una simulación",
    body: "Stripe no está configurado en este entorno. No se piden datos de tarjeta y no se cobra absolutamente nada: el botón activa una membresía de prueba guardada en este navegador para poder seguir el recorrido.",
    submit: "Simular el pago y entrar",
    noticeOnSuccess: "Membresía de prueba. No hubo ningún cargo real.",
  },
};

export type CheckoutDict = typeof es;

const en = {
  changePlan: "← Change plan",

  title: "Confirm and get in",
  subtitle: "One step and your dashboard is open.",

  order: {
    heading: "Order summary",
    conceptLabel: "Item",
    conceptAnnual: "ANDEX membership — annual plan",
    conceptMonthly: "ANDEX membership — monthly plan",
    renewalLabel: "Renewal",
    renewalAnnual: "Every 12 months, until you cancel",
    renewalMonthly: "Every month, until you cancel",
    firstChargeLabel: "First charge",
    firstChargeToday: "Today",
    firstChargeAfterTrial: (date: string) => `On ${date}, when your trial ends`,
    totalLabel: "Total today",
    totalCurrency: "USD",
    nextChargeLabel: "Next charge",
    nextChargeValue: (date: string) => `On ${date}`,
  },

  wallets: {
    applePay: "Pay with Apple Pay",
    googlePay: "Pay with Google Pay",
    divider: "or pay with a card",
  },

  card: {
    numberLabel: "Card number",
    expiryLabel: "Expiration",
    expiryPlaceholder: "MM/YY",
    cvcLabel: "CVC",
    cvcHelp: "The 3 digits on the back of your card.",
    postalLabel: "ZIP code",
    postalHelp: "The one on your card's billing statement.",
    nameLabel: "Name as it appears on the card",
  },

  submit: {
    pay: (price: string) => `Pay ${price} and get in`,
    trial: (days: number) => `Start my ${days}-day trial`,
    processing: "Processing your payment…",
    processingHint: "Don't close this page.",
  },

  secureNote: "🔒 Encrypted connection. ANDEX doesn't store your card.",

  consent: {
    checkbox:
      "I understand the membership renews automatically and that I can cancel it in one click.",
    error: "Check the box to confirm you understand the automatic renewal.",
  },

  errors: {
    cardDeclined:
      "Your bank declined the charge. Call them to authorize it or try another card; your plan stays saved.",
    insufficientFunds:
      "This card doesn't have enough funds for the charge. Try another card or try again when it does.",
    expiredCard: "This card has expired. Check the date or use another card.",
    incorrectCvc:
      "The CVC doesn't match. It's the 3 digits on the back of the card.",
    incorrectNumber: "That card number isn't valid. Check it digit by digit.",
    incorrectPostalCode:
      "The ZIP code doesn't match your card's. Use the one on your billing statement.",
    processingError:
      "The payment processor didn't respond in time. Wait a minute and tap Pay again: no charge was made.",
    authenticationRequired:
      "Your bank wants you to confirm the charge. Open your bank's app, approve the purchase, and try again.",
    currencyNotSupported:
      "Your card doesn't accept charges in U.S. dollars. Try another card, or Apple Pay or Google Pay.",
    network:
      "The connection dropped before finishing. Check your internet and tap Pay again: if the charge went through, it won't repeat.",
    generic:
      "The payment didn't go through and no charge was made. Try another card or try again in a few minutes.",
    profileSafe: "Your profile and your plan are still saved.",
    tryAnotherMethod: "Try another method",
  },

  success: {
    eyebrow: "DONE",
    title: (name: string) => `You're in, ${name}.`,
    titleNoName: "You're in.",
    body: "Your dashboard is open with this month's priority right at the top.",
    receipt: (email: string) => `We sent the receipt to ${email}.`,
    renewalReminder:
      "We notify you 48 hours before every renewal, with the link to cancel.",
    cta: "Go to my dashboard",
    trialTitle: (days: number) => `Your ${days}-day trial has started.`,
    trialBody: (date: string) =>
      `The first charge would be on ${date}. We'll remind you 48 hours ahead and you can cancel in one click until then.`,
  },

  abandon: {
    title: "Leave the payment for later?",
    body: "Your plan stays saved. When you come back you land right here, without redoing the interview.",
    stay: "Continue with payment",
    leave: "Leave for now",
  },

  demo: {
    badge: "DEMO MODE",
    title: "This payment is a simulation",
    body: "Stripe isn't configured in this environment. No card details are requested and nothing is charged: the button activates a trial membership stored in this browser so you can keep going through the flow.",
    submit: "Simulate the payment and get in",
    noticeOnSuccess: "Trial membership. No real charge was made.",
  },
} satisfies CheckoutDict;

export const checkout: Record<Lang, CheckoutDict> = { es, en };
