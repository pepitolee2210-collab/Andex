/**
 * ANDEX i18n — RAZONES DEL RANKING.
 *
 * El motor de recomendación es agnóstico de UI: devuelve un `ReasonCode`
 * estructurado, nunca copy (§3.3.1). Este archivo es el ÚNICO lugar donde
 * un ReasonCode se convierte en la frase que ve el usuario en la hero card
 * (§4.4: "Porque dijiste que quieres formalizar tu negocio…").
 *
 * Funciones puras, sin dependencias de React ni de datos.
 */

import type {
  InterestTag,
  Lang,
  LocationContext,
  ReasonCode,
  SituationTag,
} from "@/lib/types";

// ── Etiquetas de interés, encajables tras "te interesa …" ──

const INTEREST_LABELS: Record<Lang, Record<InterestTag, string>> = {
  es: {
    legal_tramites: "la asesoría legal y los trámites migratorios",
    empresa_llc: "crear o formalizar una empresa",
    finanzas: "la educación financiera y el crédito",
    certificaciones: "certificarte en un oficio técnico",
    familia_educacion: "la educación de tus hijos",
    empleo: "el empleo y las oportunidades laborales",
    comunidad_local: "la comunidad y la vida local",
    licencia_conducir: "la licencia de conducir y los trámites locales",
    visa_preparacion: "preparar tu visa y tu entrevista consular",
    vida_en_usa: "saber cómo es la vida en Estados Unidos",
    finanzas_prellegada: "preparar tus finanzas antes de viajar",
    other: "lo que nos contaste",
  },
  en: {
    legal_tramites: "legal advice and immigration paperwork",
    empresa_llc: "starting or formalizing a business",
    finanzas: "financial education and credit",
    certificaciones: "getting certified in a technical trade",
    familia_educacion: "your children's education",
    empleo: "jobs and work opportunities",
    comunidad_local: "community and local life",
    licencia_conducir: "your driver's license and local paperwork",
    visa_preparacion: "preparing your visa and consular interview",
    vida_en_usa: "learning what life in the United States is like",
    finanzas_prellegada: "getting your finances ready before you travel",
    other: "what you told us",
  },
};

/** Etiqueta de interés en la forma que encaja dentro de una razón. */
export function interestLabel(tag: InterestTag, lang: Lang): string {
  return INTEREST_LABELS[lang][tag] ?? INTEREST_LABELS[lang].other;
}

// ── Etiquetas de objetivo, encajables tras "quieres …" ──

const GOAL_LABELS: Record<Lang, Record<InterestTag | "custom", string>> = {
  es: {
    legal_tramites: "resolver tus trámites migratorios",
    empresa_llc: "formalizar tu negocio",
    finanzas: "poner en orden tus finanzas",
    certificaciones: "certificarte en un oficio nuevo",
    familia_educacion: "apoyar la educación de tus hijos",
    empleo: "encontrar un mejor trabajo",
    comunidad_local: "conectarte con tu comunidad",
    licencia_conducir: "sacar tu licencia de conducir",
    visa_preparacion: "preparar tu visa y tu entrevista",
    vida_en_usa: "saber cómo es la vida allá",
    finanzas_prellegada: "preparar tu dinero antes de viajar",
    other: "avanzar en lo que nos escribiste",
    custom: "lograr el objetivo que escribiste",
  },
  en: {
    legal_tramites: "sort out your immigration paperwork",
    empresa_llc: "formalize your business",
    finanzas: "get your finances in order",
    certificaciones: "get certified in a new trade",
    familia_educacion: "support your children's education",
    empleo: "find a better job",
    comunidad_local: "connect with your community",
    licencia_conducir: "get your driver's license",
    visa_preparacion: "prepare your visa and your interview",
    vida_en_usa: "learn what life over there is like",
    finanzas_prellegada: "get your money ready before you travel",
    other: "make progress on what you wrote us",
    custom: "reach the goal you wrote",
  },
};

/** Etiqueta de objetivo del paso 5 en la forma que encaja dentro de una razón. */
export function goalLabel(goal: InterestTag | "custom", lang: Lang): string {
  return GOAL_LABELS[lang][goal] ?? GOAL_LABELS[lang].other;
}

// ── Una frase por situación (las 14 del Anexo C.3) ──

const SITUATION_REASONS: Record<Lang, Record<SituationTag, string>> = {
  es: {
    // Rama A — in_us
    recien_llegado: "Porque acabas de llegar y toca organizarse.",
    tramite_proceso:
      "Porque tienes un trámite en proceso y conviene no perderle el paso.",
    permiso_trabajo:
      "Porque con tu permiso de trabajo vigente se te abren más opciones.",
    residente:
      "Porque como residente permanente toca cuidar y hacer crecer lo que ya construiste.",
    ciudadano:
      "Porque siendo ciudadano puedes ayudar a los tuyos y hacer crecer lo tuyo.",
    visa_temporal: "Porque estás con visa temporal y las fechas mandan.",
    resolviendo:
      "Porque estás resolviendo tu situación migratoria y aquí tienes el paso a paso.",
    // Rama B — pre_arrival
    visa_turismo:
      "Porque vas a solicitar tu visa de turismo y hay que preparar la cita.",
    visa_estudiante:
      "Porque quieres estudiar en Estados Unidos y esa visa tiene su propio camino.",
    visa_aprobada: "Porque ya tienes tu visa y ahora toca preparar el viaje.",
    visa_negada:
      "Porque quieres volver a intentar tu visa, esta vez mejor preparado.",
    explorando:
      "Porque quieres emigrar y lo primero es saber por dónde empezar.",
    reunificacion:
      "Porque quieres reunirte con tu familia en Estados Unidos.",
    inversion_remota:
      "Porque quieres invertir o abrir tu empresa desde tu país.",
  },
  en: {
    recien_llegado: "Because you just arrived and it's time to get organized.",
    tramite_proceso:
      "Because you have a case in progress and it's best not to lose track of it.",
    permiso_trabajo:
      "Because a valid work permit opens up more options for you.",
    residente:
      "Because as a permanent resident it's time to protect and grow what you've built.",
    ciudadano:
      "Because as a citizen you can help your people and grow what's yours.",
    visa_temporal: "Because you're on a temporary visa and the dates rule.",
    resolviendo:
      "Because you're working out your immigration situation and here's the step by step.",
    visa_turismo:
      "Because you're applying for a tourist visa and the appointment needs preparing.",
    visa_estudiante:
      "Because you want to study in the United States and that visa has its own path.",
    visa_aprobada:
      "Because you already have your visa and now it's time to prepare the trip.",
    visa_negada:
      "Because you want to try for your visa again, better prepared this time.",
    explorando:
      "Because you want to emigrate and the first thing is knowing where to start.",
    reunificacion: "Because you want to join your family in the United States.",
    inversion_remota:
      "Because you want to invest or start your business from your country.",
  },
};

// ── Plantillas del resto de códigos ──

const TEMPLATES: Record<
  Lang,
  {
    goal: (goal: string) => string;
    interest: (interest: string) => string;
    family: string;
    urgency: Record<LocationContext, string>;
    pilot: string;
    contextDefault: Record<LocationContext, string>;
    contextDefaultNamed: Record<LocationContext, (moduleTitle: string) => string>;
  }
> = {
  es: {
    goal: (goal) => `Porque dijiste que quieres ${goal} en los próximos 30 días.`,
    interest: (interest) => `Porque te interesa ${interest}.`,
    family: "Porque buscas ayuda para tu familia.",
    urgency: {
      in_us: "Porque llevas poco tiempo aquí y hay cosas que conviene resolver ya.",
      pre_arrival: "Porque tu viaje está cerca y conviene llegar con todo listo.",
    },
    pilot: "Porque estás en Utah, nuestra comunidad piloto.",
    contextDefault: {
      in_us: "Porque es el mejor punto de partida para construir tu vida aquí.",
      pre_arrival: "Porque es el mejor punto de partida para preparar tu llegada.",
    },
    contextDefaultNamed: {
      in_us: (moduleTitle) =>
        `Porque ${moduleTitle} es el mejor punto de partida para construir tu vida aquí.`,
      pre_arrival: (moduleTitle) =>
        `Porque ${moduleTitle} es el mejor punto de partida para preparar tu llegada.`,
    },
  },
  en: {
    goal: (goal) => `Because you said you want to ${goal} in the next 30 days.`,
    interest: (interest) => `Because you're interested in ${interest}.`,
    family: "Because you're looking for help for your family.",
    urgency: {
      in_us: "Because you haven't been here long and some things are best handled now.",
      pre_arrival: "Because your trip is close and it pays to arrive with everything ready.",
    },
    pilot: "Because you're in Utah, our pilot community.",
    contextDefault: {
      in_us: "Because it's the best starting point for building your life here.",
      pre_arrival: "Because it's the best starting point for preparing your arrival.",
    },
    contextDefaultNamed: {
      in_us: (moduleTitle) =>
        `Because ${moduleTitle} is the best starting point for building your life here.`,
      pre_arrival: (moduleTitle) =>
        `Because ${moduleTitle} is the best starting point for preparing your arrival.`,
    },
  },
};

export type ReasonContext = {
  /** Título del módulo ya resuelto por variante (§4.2.1). Opcional. */
  moduleTitle?: string;
};

/**
 * Convierte el ReasonCode del motor en la frase de la hero card (§4.4).
 * Nunca devuelve cadena vacía: si el código no se reconoce, cae al
 * genérico de contexto.
 */
export function formatReason(
  reason: ReasonCode,
  lang: Lang,
  ctx?: ReasonContext,
): string {
  const t = TEMPLATES[lang];

  switch (reason.type) {
    case "goal":
      return t.goal(goalLabel(reason.goal, lang));

    case "interest":
      return t.interest(interestLabel(reason.interest, lang));

    case "situation":
      return (
        SITUATION_REASONS[lang][reason.situation] ?? t.contextDefault.in_us
      );

    case "family":
      return t.family;

    case "urgency":
      return t.urgency[reason.context];

    case "pilot":
      return t.pilot;

    case "context_default":
      return ctx?.moduleTitle
        ? t.contextDefaultNamed[reason.context](ctx.moduleTitle)
        : t.contextDefault[reason.context];

    default:
      return t.contextDefault.in_us;
  }
}
