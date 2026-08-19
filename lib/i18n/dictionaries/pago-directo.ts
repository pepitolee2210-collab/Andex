/**
 * PAGO DIRECTO — paso 2 del embudo nuevo, y el que cambia de verdad.
 *
 * Aquí se cobra ANTES de que exista la cuenta, y el cobro entero ocurre en
 * la caja alojada de Stripe: el correo y la tarjeta los pide Stripe, no
 * nosotros. Esta pantalla sólo tiene que hacer dos cosas bien:
 *
 *  · dejar clarísimo QUÉ se está comprando y por cuánto, antes de salir del
 *    sitio;
 *  · decir qué pasa después — que se vuelve aquí a crear la cuenta con ese
 *    mismo correo—, porque salir hacia otro dominio y no ver una cuenta por
 *    ningún lado se lee como haber tirado el dinero.
 */

const es = {
  title: "Membresía",
  eyebrow: "Membresía",
  heading: "Elige tu plan y entra.",
  lead: "El precio está aquí, delante, antes de que escribas un solo dato. Cancelas en un clic desde tu perfil.",

  planes: {
    aria: "Elige tu plan",
    mensual: { name: "Mensual", period: "/mes", detail: (anual: string) => `Son ${anual} al año` },
    anual: {
      name: "Anual",
      period: "/año",
      badge: "Recomendado",
      savings: (importe: string) => `Ahorras ${importe}`,
      detail: (mes: string) => `Equivale a ${mes} al mes`,
    },
    selected: "Plan seleccionado",
  },

  cta: (importe: string) => `Continuar al pago seguro · ${importe}`,
  /* Lo que pasa DESPUÉS de pagar, dicho antes de pagar. Sin esta frase,
     salir de nuestro dominio hacia Stripe y no ver una cuenta por ningún
     lado se lee como haber tirado el dinero. */
  despues: "Stripe te pedirá tu correo y tu tarjeta. Al terminar vuelves aquí para crear tu cuenta con ese mismo correo.",
  errorPasarela: "No pudimos abrir la pasarela de pago. Vuelve a intentarlo; no se te ha cobrado nada.",
  legal:
    "Al pagar aceptas los Términos de servicio y la renovación automática. Te avisamos 48 horas antes de cada cobro y cancelas en un clic.",

  resumen: {
    title: "Tu pedido",
    concepto: { monthly: "Membresía mensual", annual: "Membresía anual" },
    cadencia: { monthly: "Se renueva cada mes", annual: "Se renueva cada año" },
    total: "Total hoy",
    garantias: [
      "Cancelas en un clic, desde tu perfil, sin llamadas.",
      "Te avisamos 48 horas antes de cada renovación.",
      "Sin contadores, sin cupos falsos, sin descuentos que expiran.",
    ],
  },

  pasarela:
    "El cobro lo procesa Stripe. ANDEX nunca ve ni guarda tu número de tarjeta.",
  yaTengoCuenta: "¿Ya tienes cuenta?",
  iniciarSesion: "Inicia sesión",

  /** Lo que se ve mientras el cobro va en camino. */
  procesando: "Procesando el pago…",
};

const en: typeof es = {
  title: "Membership",
  eyebrow: "Membership",
  heading: "Pick your plan and come in.",
  lead: "The price is right here, before you type a single detail. Cancel in one click from your profile.",

  planes: {
    aria: "Choose your plan",
    mensual: { name: "Monthly", period: "/month", detail: (anual: string) => `That is ${anual} a year` },
    anual: {
      name: "Annual",
      period: "/year",
      badge: "Recommended",
      savings: (importe: string) => `You save ${importe}`,
      detail: (mes: string) => `Works out to ${mes} a month`,
    },
    selected: "Selected plan",
  },

  cta: (importe: string) => `Continue to secure checkout · ${importe}`,
  despues: "Stripe will ask for your email and your card. When you are done you come back here to create your account with that same email.",
  errorPasarela: "We could not open the payment page. Try again; you have not been charged.",
  legal:
    "By paying you accept the Terms of service and automatic renewal. We tell you 48 hours before each charge and you cancel in one click.",

  resumen: {
    title: "Your order",
    concepto: { monthly: "Monthly membership", annual: "Annual membership" },
    cadencia: { monthly: "Renews every month", annual: "Renews every year" },
    total: "Total today",
    garantias: [
      "Cancel in one click, from your profile, with no phone calls.",
      "We tell you 48 hours before each renewal.",
      "No counters, no fake seats, no discounts that expire.",
    ],
  },

  pasarela: "Stripe processes the charge. ANDEX never sees or stores your card number.",
  yaTengoCuenta: "Already have an account?",
  iniciarSesion: "Log in",

  procesando: "Processing the payment…",
};

export const pagoDirecto = { es, en };

/**
 * Lo que recibe la pantalla: TODO cadenas ya compuestas.
 *
 * Igual que en la bienvenida — una función no cruza la frontera
 * servidor→cliente, y Next lo rechaza en ejecución, no en compilación.
 */
export type PagoDirectoDict = {
  eyebrow: string;
  heading: string;
  lead: string;
  planesAria: string;
  planSelected: string;
  mensual: { name: string; price: string; period: string; detail: string };
  anual: {
    name: string;
    price: string;
    period: string;
    badge: string;
    savings: string;
    detail: string;
  };
  cta: string;
  despues: string;
  errorPasarela: string;
  legal: string;
  resumen: {
    title: string;
    concepto: string;
    cadencia: string;
    total: string;
    importe: string;
    garantias: readonly string[];
  };
  pasarela: string;
  yaTengoCuenta: string;
  iniciarSesion: string;
  procesando: string;
};
