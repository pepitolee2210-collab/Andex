/**
 * RECORRIDO DEL PRODUCTO — el guion del teléfono del hero.
 *
 * No es una galería de pantallas bonitas: es una demostración narrada. El
 * visitante ve, en menos de treinta segundos, exactamente qué le vamos a
 * preguntar, qué recibe a cambio y qué encuentra dentro. De esto depende que
 * decida pagar, así que cada paso responde a una objeción concreta:
 *
 *   1. "¿Me van a hacer rellenar un formulario eterno?"  → son 5 preguntas
 *   2. "¿Y esto para qué sirve?"                          → mira, se ordena solo
 *   3. "¿Qué recibo exactamente?"                         → tu panel, con tu caso
 *   4. "¿Estoy solo en esto?"                             → hay una comunidad
 *
 * El texto de narración va FUERA del teléfono, para que se lea como quien te
 * enseña la app, no como un cartel dentro de la interfaz.
 */

const es = {
  ariaLabel:
    "Recorrido por ANDEX: las cinco preguntas del registro, el panel personalizado y la comunidad",
  chip: "Utah",
  /**
   * Etiqueta del control que salta a un paso concreto.
   * Es una PLANTILLA, no una función: este diccionario cruza la frontera
   * servidor→cliente y las funciones no se pueden serializar ahí.
   */
  goToStep: "Ir al paso {n} de {total}",
  playLabel: "Reanudar el recorrido",
  pauseLabel: "Pausar el recorrido",
  /** Botón de avance de los pasos del registro. */
  nextLabel: "Continuar",

  steps: {
    // ── 0 · La bienvenida ─────────────────────────────────
    // Pantalla de apertura de la app. Rompe con el crema del resto a
    // propósito: es el momento en que se enciende, no una pantalla más.
    welcome: {
      eyebrow: "Al abrir ANDEX",
      caption:
        "Así se abre. Dos caminos distintos —el de quien ya está aquí y el de quien viene— y un solo lugar donde se juntan.",
      brand: "ANDEX",
      tagline: "Tu progreso cruza fronteras",
      pathTop: "Ya en EE.UU.",
      pathBottom: "Fuera de EE.UU.",
      greeting: "Bienvenida, María",
      hint: "Empecemos por conocerte.",
    },

    // ── 1 · La bifurcación ────────────────────────────────
    branch: {
      eyebrow: "Paso 1 de 5",
      caption: "Empezamos por lo único que lo cambia todo: dónde estás.",
      progress: "Paso 1 de 5",
      question: "¿Dónde estás ahora?",
      help: "Esto nos ayuda a mostrarte lo que de verdad te sirve.",
      options: [
        { title: "Ya estoy en Estados Unidos", body: "Vivo o estoy aquí ahora" },
        { title: "Estoy fuera de Estados Unidos", body: "Me preparo para viajar" },
      ],
      /** Índice de la opción que el recorrido "elige" en pantalla. */
      chosen: 0,
    },

    // ── 2 · Los intereses ─────────────────────────────────
    interests: {
      eyebrow: "Paso 4 de 5",
      caption: "Marcas lo que necesitas. Nada de formularios eternos.",
      progress: "Paso 4 de 5",
      question: "¿Qué te interesa ahora?",
      help: "Elige todas las que quieras.",
      options: [
        "Trámites y visas",
        "Crear mi empresa",
        "Crédito y ahorro",
        "Empleo",
        "Licencia de manejo",
        "Certificaciones",
      ],
      /** Índices que se marcan solos, en orden, mientras avanza el paso. */
      chosen: [1, 2],
    },

    // ── 3 · El objetivo ───────────────────────────────────
    goal: {
      eyebrow: "Paso 5 de 5",
      caption: "Y qué quieres resolver en los próximos 30 días.",
      progress: "Paso 5 de 5",
      question: "¿Qué quieres resolver primero?",
      help: "Lo verás arriba en tu panel.",
      options: [
        "Crear o formalizar una empresa",
        "Construir mi crédito",
        "Escribe tu propio objetivo",
      ],
      chosen: 0,
      cta: "Ver mi plan",
    },

    // ── 4 · El panel ──────────────────────────────────────
    panel: {
      eyebrow: "Tu panel",
      caption:
        "Y tu panel se arma solo. Los 7 módulos siguen abiertos: cambia el orden, no el acceso.",
      greeting: "Hola, María",
      headline: "Tu prioridad en Utah este mes",
      goalLabel: "Tu objetivo de estos 30 días",
      goal: "formalizar tu negocio",
      badge: "Recomendado para ti",
      cardTitle: "Desarrollo Empresarial",
      cardReason: "Porque dijiste que quieres formalizar tu negocio.",
      cardCta: "Empezar aquí",
      gridLabel: "Explora todos los módulos",
      tiles: [
        "Bóveda Digital",
        "Conexión Laboral",
        "Finanzas",
        "Comunidad",
        "Academia",
        "Migración",
      ],
      alert: "Tu permiso de trabajo vence en 60 días",
    },

    // ── 5 · La comunidad ──────────────────────────────────
    community: {
      eyebrow: "Tu comunidad",
      caption:
        "Y no estás solo: ferias de ayuda, talleres y servicios de tu zona, con gente que ya pasó por lo mismo.",
      title: "Comunidad en Utah",
      subtitle: "Esta semana cerca de ti",
      events: [
        {
          day: "SÁB",
          date: "14",
          title: "Feria de ayuda familiar",
          meta: "West Valley City · Asesoría legal gratuita",
          tag: "Gratis",
        },
        {
          day: "MAR",
          date: "17",
          title: "Taller: tu primer crédito",
          meta: "En vivo · 45 minutos",
          tag: "En vivo",
        },
      ],
      directoryLabel: "Cerca de ti",
      directory: ["Clínicas económicas", "Comida latina", "Parques familiares"],
      familyLabel: "Para tu familia",
      family: ["CEO Junior", "Padres 3.0"],
    },
  },
};

export type TourDict = typeof es;

const en = {
  ariaLabel:
    "ANDEX walkthrough: the five signup questions, the personalized dashboard and the community",
  chip: "Utah",
  goToStep: "Go to step {n} of {total}",
  playLabel: "Resume the walkthrough",
  pauseLabel: "Pause the walkthrough",
  nextLabel: "Continue",

  steps: {
    welcome: {
      eyebrow: "Opening ANDEX",
      caption:
        "This is how it opens. Two different paths — one for those already here, one for those on the way — and a single place where they meet.",
      brand: "ANDEX",
      tagline: "Your progress crosses borders",
      pathTop: "Already in the U.S.",
      pathBottom: "Outside the U.S.",
      greeting: "Welcome, María",
      hint: "Let's start by getting to know you.",
    },

    branch: {
      eyebrow: "Step 1 of 5",
      caption: "We start with the one thing that changes everything: where you are.",
      progress: "Step 1 of 5",
      question: "Where are you right now?",
      help: "This helps us show you what actually helps.",
      options: [
        { title: "I'm already in the United States", body: "I live or am here now" },
        { title: "I'm outside the United States", body: "I'm getting ready to travel" },
      ],
      chosen: 0,
    },

    interests: {
      eyebrow: "Step 4 of 5",
      caption: "You check what you need. No endless forms.",
      progress: "Step 4 of 5",
      question: "What matters to you now?",
      help: "Pick as many as you want.",
      options: [
        "Paperwork and visas",
        "Start my business",
        "Credit and savings",
        "Jobs",
        "Driver's license",
        "Certifications",
      ],
      chosen: [1, 2],
    },

    goal: {
      eyebrow: "Step 5 of 5",
      caption: "And what you want to solve in the next 30 days.",
      progress: "Step 5 of 5",
      question: "What do you want to solve first?",
      help: "You'll see it at the top of your dashboard.",
      options: [
        "Start or register a business",
        "Build my credit",
        "Write your own goal",
      ],
      chosen: 0,
      cta: "See my plan",
    },

    panel: {
      eyebrow: "Your dashboard",
      caption:
        "And your dashboard builds itself. All 7 modules stay open: the order changes, the access doesn't.",
      greeting: "Hi, María",
      headline: "Your priority in Utah this month",
      goalLabel: "Your goal for these 30 days",
      goal: "register my business",
      badge: "Recommended for you",
      cardTitle: "Business Development",
      cardReason: "Because you said you want to register your business.",
      cardCta: "Start here",
      gridLabel: "Explore all modules",
      tiles: [
        "Digital Vault",
        "Job Match",
        "Finances",
        "Community",
        "Academy",
        "Immigration",
      ],
      alert: "Your work permit expires in 60 days",
    },

    community: {
      eyebrow: "Your community",
      caption:
        "And you're not alone: help fairs, workshops and local services, with people who've been through the same.",
      title: "Community in Utah",
      subtitle: "This week near you",
      events: [
        {
          day: "SAT",
          date: "14",
          title: "Family help fair",
          meta: "West Valley City · Free legal advice",
          tag: "Free",
        },
        {
          day: "TUE",
          date: "17",
          title: "Workshop: your first credit",
          meta: "Live · 45 minutes",
          tag: "Live",
        },
      ],
      directoryLabel: "Near you",
      directory: ["Low-cost clinics", "Latin food", "Family parks"],
      familyLabel: "For your family",
      family: ["CEO Junior", "Padres 3.0"],
    },
  },
} satisfies TourDict;

export const tour = { es, en };
