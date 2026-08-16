/**
 * ANDEX i18n — MÓDULOS: pantalla placeholder v1 (§4.6) con el contenido
 * derivado de la especificación §5, en dos variantes de contexto.
 *
 * El TÍTULO de cada módulo NO se repite aquí: vive una sola vez en
 * `common.modules.titles[id][contentVariant]` (tabla §4.2.1).
 * Aquí van el propósito en lenguaje del usuario y las 3–4 funcionalidades
 * que traerá, por módulo y por variante.
 */

import type { Lang, LocationContext, ModuleId } from "@/lib/types";

type ModuleCopy = {
  /** Qué va a resolver, en lenguaje del usuario (§4.6, punto 2). */
  purpose: string;
  /** Las 3–4 funcionalidades que traerá (§4.6, punto 3). */
  features: string[];
};

type ModuleCopyByContext = Record<LocationContext, ModuleCopy>;

const es = {
  /**
   * Cabecera y captura de interés — iguales en los 7 módulos (§4.6).
   *
   * El copy es el del sistema de diseño (`ComingSoonModule`), y su regla
   * está escrita al lado del componente: **nunca se promete una fecha**.
   * «Falta poco» es lo más fuerte que esta pantalla puede decir.
   */
  placeholder: {
    badge: "En construcción",
    statusLine: "Este módulo todavía no está abierto. Falta poco.",
    featuresTitle: "Lo que vas a poder hacer aquí",
    /** Exacto §4.6, punto 4 */
    captureQuestion: "¿Qué es lo primero que necesitas de este módulo?",
    capturePlaceholder: "Escríbelo con tus palabras.",
    captureCounter: (used: number, max: number) => `${used} / ${max}`,
    /** Exacto §4.6, punto 4 */
    submit: "Avísame cuando esté listo",
    submitting: "Enviando…",
    /**
     * La confirmación va en el propio botón, así que tiene que decir qué
     * pasa después — no «Listo». Es el mismo patrón que «Apuntarme» →
     * «Te avisamos 30 min antes» en Comunidad.
     */
    submitted: "Te avisamos por correo",
    submitFailed:
      "No pudimos enviar tu respuesta: se perdió la conexión. Tu texto sigue aquí; toca Enviar otra vez.",
    /** §4.6, punto 5 — la vuelta, en la esquina, como en el diseño. */
    back: "Atrás",
  },

  byModule: {
    // ── M1 — Bóveda Digital & Alertas ───────────────────
    1: {
      in_us: {
        purpose:
          "Guarda aquí tus documentos importantes y deja de cargar carpetas. Te avisamos antes de que algo venza, no después.",
        features: [
          "Carpetas listas para pasaporte, licencia, permiso de trabajo, I-94 y taxes",
          "Subes una foto o un PDF desde el celular y lo ves cuando quieras",
          "Avisos a los 90, 60 y 30 días de cada vencimiento que registres",
          "Consulta del estado oficial de tu caso con tu número de recibo",
        ],
      },
      pre_arrival: {
        purpose:
          "Ten lista y ordenada la papelería del viaje antes de tu cita. Sabrás qué te falta sin revolver cajones.",
        features: [
          "Lista de lo que pide tu consulado, para ir tachando",
          "Guardas pasaporte, comprobantes y cartas en un solo lugar",
          "Aviso antes de que venza tu pasaporte o tu visa",
          "Todo te espera adentro cuando llegues a Estados Unidos",
        ],
      },
    },

    // ── M2 — Trámites y Estatus / Visa y cita ───────────
    2: {
      in_us: {
        purpose:
          "Entiende en qué va tu trámite y qué sigue, en palabras claras y sin tener que adivinar el siguiente paso.",
        features: [
          "Guía paso a paso de los trámites más comunes según tu estatus",
          "Seguimiento del estatus de tu caso y de tus fechas de corte",
          "Requisitos y citas del DMV de tu estado",
          "Acompañamiento de un especialista cuando prefieras no hacerlo solo",
        ],
      },
      pre_arrival: {
        purpose:
          "Prepara tu visa y tu entrevista consular sabiendo qué se pregunta, qué se lleva y en qué orden va todo.",
        features: [
          "Preparación del formulario DS-160 campo por campo",
          "Cómo agendar tu cita en el consulado de tu país",
          "Simulacro de entrevista con las preguntas que más se repiten",
          "Qué hacer si ya te negaron una visa y quieres volver a intentar",
        ],
      },
    },

    // ── M3 — Finanzas & Patrimonio ──────────────────────
    3: {
      in_us: {
        purpose:
          "Construye tu crédito desde cero y protege lo que ahorras, sin productos que no entiendes.",
        features: [
          "Cómo abrir cuenta y empezar tu historial de crédito paso a paso",
          "Qué sube y qué baja tu puntaje FICO, explicado con ejemplos",
          "Simulador para ver cuánto crece tu ahorro según monto y plazo",
          "Guía para abrir cuentas de alto rendimiento sin letra chica",
        ],
      },
      pre_arrival: {
        purpose:
          "Llega con las cuentas claras: cuánto cuesta instalarse, qué llevar y qué se puede dejar listo desde tu país.",
        features: [
          "Costo real de los primeros tres meses, por estado",
          "Qué puedes dejar arreglado antes de viajar y qué no",
          "Cómo funciona el crédito en Estados Unidos y por qué empiezas de cero",
          "Cómo enviar y recibir dinero sin perder en cada cambio",
        ],
      },
    },

    // ── M4 — Desarrollo Empresarial ─────────────────────
    4: {
      in_us: {
        purpose:
          "Formaliza tu negocio y hazlo crecer: de la idea que ya vende a la empresa registrada que puede facturar.",
        features: [
          "Registro de tu LLC en tu estado, con la lista de datos que te van a pedir",
          "Cómo obtener tu EIN y para qué lo vas a necesitar",
          "Plantillas del acuerdo entre socios y de tus primeros contratos",
          "Combo de lanzamiento: marca, sitio web y campañas para conseguir clientes",
        ],
      },
      pre_arrival: {
        purpose:
          "Sí puedes abrir una empresa en Estados Unidos sin vivir allá. Aquí está el camino completo, sin rodeos.",
        features: [
          "Qué estado te conviene y por qué, según tu tipo de negocio",
          "Cómo constituir tu LLC y obtener el EIN desde tu país",
          "Cómo cobrar desde el exterior y qué banco acepta no residentes",
          "Qué obligaciones de impuestos te tocan y cuáles no",
        ],
      },
    },

    // ── M5 — Comunidad & Vida Local ─────────────────────
    5: {
      in_us: {
        purpose:
          "Encuentra a tu gente y lo que necesitas cerca: quién ayuda, dónde comer como en casa y qué pasa esta semana.",
        features: [
          "Directorio local con ferias de ayuda, asesorías gratuitas y comida",
          "Clínicas comunitarias y de bajo costo cerca de ti",
          "Restaurantes y negocios latinos filtrados por país de origen",
          "Programas para tus hijos: CEO Junior y Padres 3.0",
        ],
      },
      pre_arrival: {
        purpose:
          "Conoce el lugar al que llegas antes de llegar: cuánto cuesta vivir, cómo son las escuelas y quién ya está ahí.",
        features: [
          "Cómo es vivir en cada estado: renta, clima, transporte y escuelas",
          "Comunidades de gente de tu país ya instalada allá",
          "Qué resolver la primera semana y qué puede esperar",
          "Eventos y talleres en línea a los que puedes entrar desde ya",
        ],
      },
    },

    // ── M6 — Academia de Certificaciones ────────────────
    6: {
      in_us: {
        purpose:
          "Certifícate en oficios que pagan bien en tu estado y ten un ingreso propio, aunque empieces de cero.",
        features: [
          "Preparación para preparador de impuestos y trámite del PTIN",
          "Licencias de seguros: vida, salud y auto",
          "Certificación de bienes raíces y asesoría financiera básica",
          "Clases en video y simulador de examen para practicar",
        ],
      },
      pre_arrival: {
        purpose:
          "Aprovecha el tiempo antes de viajar: estudia desde tu país y llega con una certificación en la mano.",
        features: [
          "Qué certificaciones puedes estudiar desde tu país y cuáles no",
          "Cursos en video a tu ritmo, con simulador de examen",
          "Cómo se convalida lo que ya estudiaste en tu país",
          "Qué te falta hacer en persona una vez que llegues",
        ],
      },
    },

    // ── M7 — Conexión Laboral ───────────────────────────
    7: {
      in_us: {
        purpose:
          "Encuentra trabajo que encaje con lo que sabes hacer y con los papeles que tienes hoy.",
        features: [
          "Vacantes con sueldo, ubicación y requisitos a la vista",
          "Aviso al celular cuando salga una que coincide con tu perfil",
          "Empleos publicados por negocios de la comunidad, ya verificados",
          "Cómo armar tu currículum al estilo de Estados Unidos",
        ],
      },
      pre_arrival: {
        purpose:
          "Entiende cómo se consigue trabajo allá antes de llegar: qué se pide, cuánto se paga y qué papeles hacen falta.",
        features: [
          "Qué permiso necesitas para trabajar legalmente y cómo se obtiene",
          "Sueldos reales por oficio y por estado",
          "Cómo se traduce tu experiencia al formato que allá se pide",
          "Qué oficios tienen más demanda en la comunidad piloto",
        ],
      },
    },
  } satisfies Record<ModuleId, ModuleCopyByContext>,
};

export type ModulesDict = typeof es;

const en = {
  placeholder: {
    badge: "Under construction",
    statusLine: "This module isn't open yet. It's close.",
    featuresTitle: "What you'll be able to do here",
    captureQuestion: "What's the first thing you need from this module?",
    capturePlaceholder: "Write it in your own words.",
    captureCounter: (used: number, max: number) => `${used} / ${max}`,
    submit: "Let me know when it's ready",
    submitting: "Sending…",
    submitted: "We'll email you",
    submitFailed:
      "We couldn't send your answer: the connection dropped. Your text is still here; tap Send again.",
    back: "Back",
  },

  byModule: {
    1: {
      in_us: {
        purpose:
          "Keep your important documents here and stop carrying folders around. We warn you before something expires, not after.",
        features: [
          "Ready-made folders for passport, license, work permit, I-94, and taxes",
          "Upload a photo or a PDF from your phone and see it whenever you want",
          "Alerts at 90, 60, and 30 days before every expiration you record",
          "Check your case's official status with your receipt number",
        ],
      },
      pre_arrival: {
        purpose:
          "Have your travel paperwork ready and organized before your appointment. You'll know what's missing without digging through drawers.",
        features: [
          "The list your consulate asks for, so you can check items off",
          "Store your passport, proof documents, and letters in one place",
          "A heads-up before your passport or visa expires",
          "It's all waiting for you inside when you get to the United States",
        ],
      },
    },

    2: {
      in_us: {
        purpose:
          "Understand where your case stands and what comes next, in plain words and without guessing the next step.",
        features: [
          "Step-by-step guides for the most common procedures for your status",
          "Track your case status and your court dates",
          "Requirements and appointments for your state's DMV",
          "A specialist to walk you through it when you'd rather not go alone",
        ],
      },
      pre_arrival: {
        purpose:
          "Get your visa and consular interview ready, knowing what's asked, what to bring, and in what order everything goes.",
        features: [
          "DS-160 form preparation, field by field",
          "How to book your appointment at your country's consulate",
          "Interview practice with the questions that come up most",
          "What to do if your visa was denied and you want to try again",
        ],
      },
    },

    3: {
      in_us: {
        purpose:
          "Build your credit from zero and protect what you save, without products you don't understand.",
        features: [
          "How to open an account and start your credit history, step by step",
          "What raises and lowers your FICO score, explained with examples",
          "A simulator to see how your savings grow by amount and term",
          "A guide to opening high-yield accounts with no fine print",
        ],
      },
      pre_arrival: {
        purpose:
          "Arrive with the numbers clear: what settling in costs, what to bring, and what can be set up from your country.",
        features: [
          "The real cost of your first three months, by state",
          "What you can sort out before traveling and what you can't",
          "How credit works in the U.S. and why you start from zero",
          "How to send and receive money without losing on every exchange",
        ],
      },
    },

    4: {
      in_us: {
        purpose:
          "Formalize your business and grow it: from the idea that already sells to a registered company that can invoice.",
        features: [
          "Register your LLC in your state, with the list of details they'll ask for",
          "How to get your EIN and what you'll need it for",
          "Templates for your partner agreement and your first contracts",
          "Launch bundle: brand, website, and campaigns to bring in customers",
        ],
      },
      pre_arrival: {
        purpose:
          "You can open a U.S. company without living there. Here's the whole path, no detours.",
        features: [
          "Which state suits you and why, based on your type of business",
          "How to form your LLC and get the EIN from your country",
          "How to get paid from abroad and which banks accept non-residents",
          "Which tax obligations apply to you and which don't",
        ],
      },
    },

    5: {
      in_us: {
        purpose:
          "Find your people and what you need nearby: who helps, where to eat like back home, and what's happening this week.",
        features: [
          "Local directory with help fairs, free advice, and food assistance",
          "Community and low-cost clinics near you",
          "Latino restaurants and businesses filtered by country of origin",
          "Programs for your kids: CEO Junior and Padres 3.0",
        ],
      },
      pre_arrival: {
        purpose:
          "Get to know where you're landing before you land: what living costs, what the schools are like, and who's already there.",
        features: [
          "What life is like in each state: rent, weather, transit, and schools",
          "Communities from your country already settled there",
          "What to handle your first week and what can wait",
          "Online events and workshops you can join right now",
        ],
      },
    },

    6: {
      in_us: {
        purpose:
          "Get certified in trades that pay well in your state and build your own income, even starting from zero.",
        features: [
          "Tax preparer training and the PTIN application",
          "Insurance licenses: life, health, and auto",
          "Real estate certification and basic financial advising",
          "Video classes and an exam simulator to practice",
        ],
      },
      pre_arrival: {
        purpose:
          "Make the wait count: study from your country and arrive with a certification in hand.",
        features: [
          "Which certifications you can study from your country and which you can't",
          "Self-paced video courses with an exam simulator",
          "How your prior studies get recognized",
          "What you'll still need to do in person once you arrive",
        ],
      },
    },

    7: {
      in_us: {
        purpose:
          "Find work that fits what you know how to do and the papers you have today.",
        features: [
          "Job listings with pay, location, and requirements up front",
          "A phone alert when one matching your profile opens up",
          "Jobs posted by verified community businesses",
          "How to put together a U.S.-style résumé",
        ],
      },
      pre_arrival: {
        purpose:
          "Understand how people find work there before you arrive: what's asked, what it pays, and which papers you need.",
        features: [
          "Which permit you need to work legally and how to get it",
          "Real pay by trade and by state",
          "How to translate your experience into the format they expect",
          "Which trades are most in demand in the pilot community",
        ],
      },
    },
  },
} satisfies ModulesDict;

export const modules: Record<Lang, ModulesDict> = { es, en };
