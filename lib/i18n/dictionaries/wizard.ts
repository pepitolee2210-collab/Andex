/**
 * ANDEX i18n — MICRO-ENTREVISTA (§3.2, los 5 pasos).
 *
 * Los labels de situación e interés se indexan por el tag canónico de
 * `lib/types.ts` para que el catálogo (lib/catalogs/*) case por clave.
 * Aquí vive SOLO el texto; el orden y la estructura viven en el catálogo.
 *
 * Textos marcados "exacto" salen literales del PRD.
 */

import type {
  InterestTag,
  Lang,
  SeekingFor,
  SituationTagInUS,
  SituationTagPreArrival,
  TimeInUSTag,
  TravelPlanTag,
} from "@/lib/types";

const es = {
  /** Título del documento de la pantalla de entrevista (<title>). */
  pageTitle: "Tu micro-entrevista",

  /** Barra de progreso (§3.2 regla UX 2: conteo explícito, ambas ramas 5 pasos). */
  progress: {
    label: (current: number, total: number) => `Paso ${current} de ${total}`,
    aria: (current: number, total: number) =>
      `Entrevista ANDEX, paso ${current} de ${total}`,
    /**
     * El nombre corto del paso. Acompaña al conteo en la misma línea —«Paso
     * 1 de 5 · Lo básico»— para que el progreso diga además de qué va este
     * paso, no sólo cuántos quedan.
     */
    names: ["Lo básico", "Tu ubicación", "Tu camino", "Tus temas", "Prioridad"],
  },

  nav: {
    next: "Continuar",
    back: "Atrás",
    finish: "Ver mi plan",
    /** Regla UX 6: disponible desde el paso 3, nunca en el paso 2. */
    skip: "Prefiero explorar por mi cuenta",
    skipConfirmTitle: "¿Salir de la entrevista?",
    skipConfirmBody:
      "Guardamos lo que ya respondiste. Verás el panel con el orden por defecto y puedes completar tu perfil cuando quieras.",
    skipConfirmAccept: "Sí, explorar por mi cuenta",
    skipConfirmCancel: "Seguir respondiendo",
  },

  /** Guardado parcial (regla UX 1). */
  toasts: {
    saved: "Guardado.",
    savedStep: (step: number) => `Paso ${step} guardado.`,
    resumed: "Retomamos donde quedaste.",
    saveFailed:
      "No pudimos guardar este paso: se perdió la conexión. Tus respuestas siguen en pantalla; toca Continuar otra vez.",
  },

  // ── PASO 1 — Datos básicos ────────────────────────────
  step1: {
    title: "Empecemos por lo básico",
    subtitle: "Solo lo necesario para llamarte por tu nombre y guardar tu avance.",
    firstName: {
      label: "Nombre",
      placeholder: "María",
      error: "Escribe tu nombre para continuar.",
    },
    lastName: {
      label: "Apellido",
      placeholder: "González",
      optional: "Opcional",
    },
    email: {
      label: "Correo electrónico",
      placeholder: "tunombre@correo.com",
      help: "Aquí te avisamos de tus fechas límite.",
      error: "Ese correo no tiene un formato válido. Revisa que lleve @ y el dominio, como nombre@correo.com.",
    },
    phone: {
      label: "Teléfono",
      optional: "Opcional",
      placeholder: "555 123 4567",
      countryCodeLabel: "Código de país",
      help: "Lo usamos solo para avisos urgentes de tus trámites.",
      /** Regla UX 7: se sugiere por IP, el usuario confirma. */
      prefilledHint: "Preseleccionamos tu país por tu conexión. Cámbialo si no es el tuyo.",
    },
  },

  // ── PASO 2 — LA BIFURCACIÓN ───────────────────────────
  step2: {
    /** Exacto §3.2 PASO 2 */
    title: "¿Dónde estás ahora?",
    /** Exacto §3.2 PASO 2 */
    subtitle: "Esto nos ayuda a mostrarte lo que de verdad te sirve.",

    /**
     * Sin emoji: el sistema de diseño no los admite como icono, y una
     * bandera además dice cosas que aquí no queremos decir. El icono es de
     * Lucide y lo pone la pantalla.
     */
    cards: {
      in_us: {
        title: "Ya estoy en Estados Unidos",
        description: "Vivo o estoy actualmente en EE. UU.",
      },
      pre_arrival: {
        title: "Estoy fuera de Estados Unidos",
        description: "Me estoy preparando para viajar o quiero informarme",
      },
    },

    /** Distintivo de la fila elegida. */
    selectedBadge: "Elegido",
    /** Por qué esta pregunta pesa más que las otras, y que se puede cambiar. */
    branchNotice:
      "Esta respuesta cambia lo que ves en toda la aplicación. Puedes cambiarla después desde tu perfil.",

    /** Ramificación A — se despliega en la misma pantalla. */
    inUs: {
      stateLabel: "¿En qué estado vives?",
      statePlaceholder: "Escribe para buscar tu estado",
      stateHelp: "Con esto te mostramos el DMV, las cortes y los eventos de tu estado.",
      stateEmpty: "No encontramos ese estado. Prueba con otra palabra.",
      stateError: "Elige tu estado para continuar.",
      stateGroups: {
        pilot: "Nuestra comunidad piloto",
        popular: "Los más buscados",
        all: "Todos los estados",
      },
      timeLabel: "¿Cuánto tiempo llevas en Estados Unidos?",
      timeHelp: "Sin fechas exactas: un rango basta.",
    },

    /** Ramificación B */
    preArrival: {
      countryLabel: "¿En qué país vives ahora?",
      countryPlaceholder: "Escribe para buscar tu país",
      countryHelp: "Con esto te mostramos el consulado y los costos que te tocan.",
      countryEmpty: "No encontramos ese país. Prueba con otra palabra.",
      countryError: "Elige tu país para continuar.",
      countryGroups: {
        latam: "Latinoamérica y España",
        rest: "Resto del mundo",
      },
      /** Convención Anexo C.2 — opción final del combobox de países. */
      countryNotListed: "Mi país no está en la lista",
      countryNotListedPlaceholder: "Escribe el nombre de tu país",
      /** Toggle exacto §3.2 Ramificación B */
      nationalityToggle: "Mi nacionalidad es otra",
      nationalityLabel: "Nacionalidad",
      nationalityPlaceholder: "Escribe para buscar",
      nationalityOptional: "Opcional",
      travelPlanLabel: "¿Cómo vas con tu viaje?",
      travelPlanHelp: "Nos dice qué tan pronto necesitas cada cosa.",
      prefilledHint: "Preseleccionamos tu país por tu conexión. Cámbialo si no es el tuyo.",
    },

    /** Chips de tiempo en EE. UU. — enum TimeInUSTag */
    timeOptions: {
      menos_6_meses: "Menos de 6 meses",
      "6m_2a": "6 meses – 2 años",
      "2a_5a": "2 – 5 años",
      mas_5a: "Más de 5 años",
      no_responde: "Prefiero no decir",
    } satisfies Record<TimeInUSTag, string>,

    /** Chips de plan de viaje — enum TravelPlanTag */
    travelPlanOptions: {
      fecha_confirmada: "Ya tengo fecha de viaje",
      este_ano: "Quiero ir este año",
      explorando: "Estoy explorando la idea",
      no_se: "Aún no lo sé",
    } satisfies Record<TravelPlanTag, string>,

    error: "Elige dónde estás para continuar. Es lo único que necesitamos sí o sí.",

    /** §3.2.2 — confirmación TEXTUAL al cambiar de rama */
    changeBranchTitle: "¿Cambiar tu ubicación?",
    changeBranchBody:
      "Vas a cambiar tu ubicación. Se borrarán los datos que ya escribiste de la opción anterior. ¿Continuar?",
    changeBranchAccept: "Sí, cambiar",
    changeBranchCancel: "Dejarlo como está",
  },

  // ── PASO 3 — Situación actual ─────────────────────────
  step3: {
    /** Encabezados exactos §3.2 PASO 3 */
    titleInUs: "¿En qué momento de tu camino estás?",
    titlePreArrival: "¿Qué te trae a ANDEX?",
    /** Requisito de privacidad: opcional en ambas ramas */
    subtitle: "Puedes saltarte esta pregunta. Tu plan funciona igual de bien sin ella.",

    /** Rama A — 7 tags del enum + las dos filas especiales (ver `special`) */
    situationsInUs: {
      recien_llegado: "Acabo de llegar y estoy organizándome",
      tramite_proceso: "Tengo un trámite o solicitud en proceso",
      permiso_trabajo: "Tengo permiso de trabajo vigente",
      residente: "Soy residente permanente",
      ciudadano: "Soy ciudadano estadounidense",
      visa_temporal: "Estoy con visa temporal (turismo, estudio o trabajo)",
      resolviendo: "Estoy resolviendo mi situación migratoria",
    } satisfies Record<SituationTagInUS, string>,

    /** Rama B — 7 tags del enum + las dos filas especiales */
    situationsPreArrival: {
      visa_turismo: "Quiero solicitar una visa de turismo (B1/B2)",
      visa_estudiante: "Quiero estudiar en EE. UU. (F-1 / M-1)",
      visa_aprobada: "Ya tengo mi visa y estoy preparando el viaje",
      visa_negada: "Me negaron una visa y quiero volver a intentarlo",
      explorando: "Quiero emigrar pero no sé por dónde empezar",
      reunificacion: "Tengo familia en EE. UU. y quiero reunirme con ellos",
      inversion_remota: "Quiero invertir o abrir una empresa desde mi país",
    } satisfies Record<SituationTagPreArrival, string>,

    /** Las dos filas finales, presentes en AMBAS ramas, con el mismo peso visual. */
    special: {
      other: "Otro",
      declined: "Prefiero no responder",
    },
  },

  // ── PASO 3.5 — ¿Para quién buscas ayuda? ──────────────
  step35: {
    /** Exacto §3.2 PASO 3.5 */
    title: "¿Para quién buscas ayuda?",
    subtitle: "Si es para alguien más, también te preparamos su parte.",
    options: {
      self: "Para mí",
      family: "Para un familiar",
      both: "Para ambos",
    } satisfies Record<SeekingFor, string>,
  },

  // ── PASO 4 — Intereses principales ────────────────────
  step4: {
    title: "¿Qué te interesa resolver con ANDEX?",
    subtitle: "Marca todas las que quieras. La primera que elijas es la que más pesa.",
    error: "Elige al menos una opción, o toca Continuar para saltarte esta pregunta.",
    selectedCount: (n: number) =>
      n === 1 ? "1 opción elegida" : `${n} opciones elegidas`,

    /** Labels exactos del PRD §3.2 PASO 4, indexados por InterestTag. */
    interests: {
      legal_tramites: "Asesoría legal, trámites migratorios y citas consulares",
      empresa_llc: "Crear o formalizar una empresa (LLC)",
      finanzas: "Educación financiera, inversión segura y crédito",
      certificaciones: "Certificaciones técnicas (taxes, seguros, bienes raíces)",
      familia_educacion: "Educación de hijos y programas familiares (CEO Junior)",
      empleo: "Empleo y oportunidades laborales",
      comunidad_local: "Comunidad, ferias de ayuda, restaurantes y vida local",
      licencia_conducir: "Licencia de conducir y trámites locales",
      visa_preparacion: "Preparación de visa y entrevista consular",
      vida_en_usa: "Cómo es la vida en EE. UU. (costos, vivienda, escuelas)",
      finanzas_prellegada: "Preparación financiera antes de viajar",
      other: "Otro",
    } satisfies Record<InterestTag, string>,
  },

  // ── PASO 5 — Objetivo inmediato ───────────────────────
  step5: {
    title: "¿Qué quieres resolver primero?",
    subtitle: "Elige tu problema número 1 para los próximos 30 días. Lo verás arriba en tu panel.",
    /** Exacto §3.2 PASO 5 */
    customOption: "Escribe tu propio objetivo",
    customPlaceholder: "Ej.: renovar mi permiso de trabajo antes de diciembre",
    customLabel: "Tu objetivo, con tus palabras",
    /** Máximo 120 caracteres (§3.2.1 regla 3). */
    counter: (used: number, max: number) => `${used} de ${max} caracteres`,
    counterNearLimit: (left: number) => `Te quedan ${left} caracteres`,
    error: "Elige un objetivo o escribe el tuyo para continuar.",
    emptyInterestsHint:
      "Como no marcaste intereses, te mostramos los objetivos más comunes de quienes están en tu situación.",
  },

  /** Patrón "Otro" §3.2.1 — mismo texto en todos los campos de opción. */
  other: {
    label: "Otro",
    placeholder: "Cuéntanos en pocas palabras",
    help: "Máximo 120 caracteres. Lo leemos todo.",
    /** Regla 4: elegir Otro sin escribir nada es válido. */
    optionalNote: "Puedes dejarlo en blanco si prefieres.",
  },

  /** Pantalla de cierre antes del paywall. */
  done: {
    title: "Listo. Estamos armando tu plan…",
    body: "Ordenamos los 7 módulos según lo que nos contaste.",
  },
};

export type WizardDict = typeof es;

const en = {
  pageTitle: "Your quick interview",

  progress: {
    label: (current: number, total: number) => `Step ${current} of ${total}`,
    aria: (current: number, total: number) =>
      `ANDEX interview, step ${current} of ${total}`,
    names: ["The basics", "Your location", "Your journey", "Your topics", "Priority"],
  },

  nav: {
    next: "Continue",
    back: "Back",
    finish: "See my plan",
    skip: "I'd rather explore on my own",
    skipConfirmTitle: "Leave the interview?",
    skipConfirmBody:
      "We'll save what you've answered. You'll see the dashboard in default order and can finish your profile whenever you want.",
    skipConfirmAccept: "Yes, let me explore",
    skipConfirmCancel: "Keep answering",
  },

  toasts: {
    saved: "Saved.",
    savedStep: (step: number) => `Step ${step} saved.`,
    resumed: "We picked up where you left off.",
    saveFailed:
      "We couldn't save this step: the connection dropped. Your answers are still on screen; tap Continue again.",
  },

  step1: {
    title: "Let's start with the basics",
    subtitle: "Just enough to call you by name and save your progress.",
    firstName: {
      label: "First name",
      placeholder: "María",
      error: "Enter your first name to continue.",
    },
    lastName: {
      label: "Last name",
      placeholder: "González",
      optional: "Optional",
    },
    email: {
      label: "Email",
      placeholder: "yourname@email.com",
      help: "This is where we send your deadline alerts.",
      error: "That email isn't in a valid format. Make sure it has an @ and the domain, like name@email.com.",
    },
    phone: {
      label: "Phone",
      optional: "Optional",
      placeholder: "555 123 4567",
      countryCodeLabel: "Country code",
      help: "We only use it for urgent alerts about your paperwork.",
      prefilledHint: "We preselected your country from your connection. Change it if it's not yours.",
    },
  },

  step2: {
    title: "Where are you right now?",
    subtitle: "This helps us show you what's actually useful to you.",

    cards: {
      in_us: {
        title: "I'm already in the United States",
        description: "I live in or am currently in the U.S.",
      },
      pre_arrival: {
        title: "I'm outside the United States",
        description: "I'm getting ready to travel or want to learn more",
      },
    },

    selectedBadge: "Chosen",
    branchNotice:
      "This answer changes what you see across the whole app. You can change it later from your profile.",

    inUs: {
      stateLabel: "Which state do you live in?",
      statePlaceholder: "Type to search for your state",
      stateHelp: "This is how we show you the DMV, the courts, and events in your state.",
      stateEmpty: "We couldn't find that state. Try another word.",
      stateError: "Choose your state to continue.",
      stateGroups: {
        pilot: "Our pilot community",
        popular: "Most searched",
        all: "All states",
      },
      timeLabel: "How long have you been in the United States?",
      timeHelp: "No exact dates needed: a range is enough.",
    },

    preArrival: {
      countryLabel: "Which country do you live in now?",
      countryPlaceholder: "Type to search for your country",
      countryHelp: "This is how we show you the right consulate and the costs that apply to you.",
      countryEmpty: "We couldn't find that country. Try another word.",
      countryError: "Choose your country to continue.",
      countryGroups: {
        latam: "Latin America and Spain",
        rest: "Rest of the world",
      },
      countryNotListed: "My country isn't on the list",
      countryNotListedPlaceholder: "Type your country's name",
      nationalityToggle: "My nationality is different",
      nationalityLabel: "Nationality",
      nationalityPlaceholder: "Type to search",
      nationalityOptional: "Optional",
      travelPlanLabel: "How's your trip coming along?",
      travelPlanHelp: "It tells us how soon you need each thing.",
      prefilledHint: "We preselected your country from your connection. Change it if it's not yours.",
    },

    timeOptions: {
      menos_6_meses: "Less than 6 months",
      "6m_2a": "6 months – 2 years",
      "2a_5a": "2 – 5 years",
      mas_5a: "More than 5 years",
      no_responde: "I'd rather not say",
    },

    travelPlanOptions: {
      fecha_confirmada: "I already have a travel date",
      este_ano: "I want to go this year",
      explorando: "I'm exploring the idea",
      no_se: "I don't know yet",
    },

    error: "Choose where you are to continue. It's the only thing we truly need.",

    changeBranchTitle: "Change your location?",
    changeBranchBody:
      "You're about to change your location. The details you entered for the previous option will be erased. Continue?",
    changeBranchAccept: "Yes, change it",
    changeBranchCancel: "Leave it as is",
  },

  step3: {
    titleInUs: "Where are you on your journey?",
    titlePreArrival: "What brings you to ANDEX?",
    subtitle: "You can skip this question. Your plan works just as well without it.",

    situationsInUs: {
      recien_llegado: "I just arrived and I'm getting settled",
      tramite_proceso: "I have a case or application in progress",
      permiso_trabajo: "I have a valid work permit",
      residente: "I'm a permanent resident",
      ciudadano: "I'm a U.S. citizen",
      visa_temporal: "I'm on a temporary visa (tourism, study, or work)",
      resolviendo: "I'm working out my immigration situation",
    },

    situationsPreArrival: {
      visa_turismo: "I want to apply for a tourist visa (B1/B2)",
      visa_estudiante: "I want to study in the U.S. (F-1 / M-1)",
      visa_aprobada: "I already have my visa and I'm preparing the trip",
      visa_negada: "My visa was denied and I want to try again",
      explorando: "I want to emigrate but don't know where to start",
      reunificacion: "I have family in the U.S. and want to join them",
      inversion_remota: "I want to invest or start a business from my country",
    },

    special: {
      other: "Other",
      declined: "I'd rather not answer",
    },
  },

  step35: {
    title: "Who are you looking for help for?",
    subtitle: "If it's for someone else, we'll prepare their part too.",
    options: {
      self: "For myself",
      family: "For a family member",
      both: "For both",
    },
  },

  step4: {
    title: "What do you want to solve with ANDEX?",
    subtitle: "Check as many as you want. The first one you pick carries the most weight.",
    error: "Choose at least one option, or tap Continue to skip this question.",
    selectedCount: (n: number) => (n === 1 ? "1 option selected" : `${n} options selected`),

    interests: {
      legal_tramites: "Legal advice, immigration paperwork, and consular appointments",
      empresa_llc: "Start or formalize a business (LLC)",
      finanzas: "Financial education, safe investing, and credit",
      certificaciones: "Technical certifications (taxes, insurance, real estate)",
      familia_educacion: "Children's education and family programs (CEO Junior)",
      empleo: "Jobs and work opportunities",
      comunidad_local: "Community, help fairs, restaurants, and local life",
      licencia_conducir: "Driver's license and local paperwork",
      visa_preparacion: "Visa preparation and consular interview",
      vida_en_usa: "What life in the U.S. is like (costs, housing, schools)",
      finanzas_prellegada: "Financial preparation before you travel",
      other: "Other",
    },
  },

  step5: {
    title: "What do you want to solve first?",
    subtitle: "Pick your number 1 problem for the next 30 days. You'll see it at the top of your dashboard.",
    customOption: "Write your own goal",
    customPlaceholder: "e.g., renew my work permit before December",
    customLabel: "Your goal, in your own words",
    counter: (used: number, max: number) => `${used} of ${max} characters`,
    counterNearLimit: (left: number) => `${left} characters left`,
    error: "Pick a goal or write your own to continue.",
    emptyInterestsHint:
      "Since you didn't pick any interests, we're showing the most common goals for people in your situation.",
  },

  other: {
    label: "Other",
    placeholder: "Tell us in a few words",
    help: "120 characters max. We read every one.",
    optionalNote: "You can leave it blank if you prefer.",
  },

  done: {
    title: "Done. We're building your plan…",
    body: "We're sorting the 7 modules based on what you told us.",
  },
} satisfies WizardDict;

export const wizard: Record<Lang, WizardDict> = { es, en };
