/**
 * PAGO DIRECTO — paso 2 del embudo nuevo, y el que cambia de verdad.
 *
 * Aquí se cobra ANTES de que exista la cuenta. Eso obliga a decir dos cosas
 * que el muro anterior no tenía que decir, porque llegaba con el usuario ya
 * dentro:
 *
 *  · que la cuenta se crea DESPUÉS, y con este mismo correo — si no, pagar
 *    sin registrarse se lee como haber perdido el dinero;
 *  · que el correo es la forma de recuperar el pago si alguien cierra la
 *    pestaña antes de terminar. Es el caso borde real del embudo, y callarlo
 *    no lo hace desaparecer.
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

  monederos: { apple: "Apple Pay", google: "Google Pay", divider: "o paga con tarjeta" },

  campos: {
    email: "Tu correo",
    emailHelp: "Con este correo se crea tu cuenta en el siguiente paso.",
    emailPlaceholder: "tucorreo@ejemplo.com",
    /* Sin correo el cobro queda huérfano: nadie puede vincularlo a una cuenta
       ni avisar a quien pagó. Por eso el error no dice sólo "revisa el
       formato", dice para qué sirve. */
    emailError: "Escribe tu correo: es con lo que se crea tu cuenta y lo único con lo que podemos encontrar tu pago.",
    tarjeta: "Tarjeta",
  },

  cta: (importe: string) => `Pagar ${importe} y crear mi cuenta`,
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

  monederos: { apple: "Apple Pay", google: "Google Pay", divider: "or pay by card" },

  campos: {
    email: "Your email",
    emailHelp: "Your account is created with this email in the next step.",
    emailPlaceholder: "you@example.com",
    emailError: "Enter your email: it is what creates your account, and the only way we can find your payment.",
    tarjeta: "Card",
  },

  cta: (importe: string) => `Pay ${importe} and create my account`,
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
  monederos: typeof es.monederos;
  campos: typeof es.campos;
  cta: string;
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
