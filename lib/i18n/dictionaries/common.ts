/**
 * ANDEX i18n — dominio COMÚN.
 * Marca, navegación, acciones genéricas, errores base, aria-labels
 * compartidos, títulos CANÓNICOS de módulo por id y variante (§4.2.1)
 * y descripciones cortas del seed (§7.4).
 *
 * Patrón: `en` se valida contra la forma de `es` con `satisfies` —
 * una clave faltante o sobrante en inglés es error de compilación.
 */

import type { Lang, LocationContext, ModuleId } from "@/lib/types";

type ModuleVariantText = Record<LocationContext, string>;

const es = {
  brand: {
    name: "ANDEX",
    tagline: "Tu progreso cruza fronteras.",
  },

  nav: {
    login: "Iniciar sesión",
    signup: "Comenzar ahora",
    logout: "Cerrar sesión",
    panel: "Mi panel",
    profile: "Tu perfil",
    backToPanel: "Volver a mi panel",
    skipToContent: "Saltar al contenido",
  },

  lang: {
    es: "Español",
    en: "English",
    ariaSwitch: "Cambiar idioma",
  },

  theme: {
    light: "Tema claro",
    dark: "Tema oscuro",
    system: "Según tu dispositivo",
    ariaSwitch: "Cambiar tema",
  },

  actions: {
    continue: "Continuar",
    back: "Atrás",
    backHome: "Volver al inicio",
    save: "Guardar",
    cancel: "Cancelar",
    close: "Cerrar",
    edit: "Editar",
    retry: "Reintentar",
    send: "Enviar",
    confirm: "Confirmar",
    understood: "Entendido",
    loading: "Cargando…",
  },

  /** Errores base §2.7: qué pasó + cómo resolverlo. Sin disculpas, sin vaguedad. */
  errors: {
    network:
      "No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.",
    server:
      "Algo falló de nuestro lado. Espera un momento y vuelve a intentar; tus datos no se perdieron.",
    notFoundTitle: "Esta página no existe",
    notFoundBody:
      "El enlace está roto o la página cambió de lugar. Vuelve al inicio para seguir tu camino.",
    formInvalid:
      "Hay campos por corregir. Revisa los mensajes marcados en el formulario.",
  },

  aria: {
    closeModal: "Cerrar ventana",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    required: "Obligatorio",
    /** La Ruta (§2.8): progreso accesible del camino de 6 nodos. */
    routeBar: (step: number) => `Tu camino ANDEX: punto ${step} de 6`,
    /** Chip compacto del topbar del panel (§2.8). */
    locationChip: "Tu ubicación actual",
    moduleIcon: (moduleTitle: string) => `Icono del módulo ${moduleTitle}`,
  },

  /** Sufijo de campos no obligatorios (§3.2: sin campos obligatorios innecesarios). */
  optionalLabel: "Opcional",

  badges: {
    /** Estado `coming-soon` del ModuleCard (§4.5). */
    soon: "Pronto",
    /** Hero card y tarjeta recomendada (§4.4, §4.5). */
    recommended: "RECOMENDADO PARA TI",
  },

  /** Disclaimer §6 — se muestra junto a todo enlace externo oficial y en el footer. */
  legal: {
    govDisclaimer:
      "ANDEX no está afiliado a ninguna agencia gubernamental. Estos trámites son gratuitos en los portales oficiales.",
    terms: "Términos de servicio",
    privacy: "Política de privacidad",
  },

  /**
   * Títulos CANÓNICOS por módulo y variante de contexto — tabla §4.2.1 completa.
   * TODO título de módulo visible sale de aquí (o de modules.ts, que reutiliza estos).
   */
  modules: {
    titles: {
      1: {
        in_us: "Bóveda Digital & Alertas",
        pre_arrival: "Tus documentos para el viaje",
      },
      2: {
        in_us: "Trámites y Estatus Migratorio",
        pre_arrival: "Prepara tu visa y tu cita",
      },
      3: {
        in_us: "Finanzas & Patrimonio",
        pre_arrival: "Prepara tu llegada financiera",
      },
      4: {
        in_us: "Desarrollo Empresarial",
        pre_arrival: "Invierte o abre empresa en EE. UU.",
      },
      5: {
        in_us: "Comunidad & Vida Local",
        pre_arrival: "Conoce tu destino antes de llegar",
      },
      6: {
        in_us: "Academia de Certificaciones",
        pre_arrival: "Certifícate desde tu país",
      },
      7: {
        in_us: "Conexión Laboral",
        pre_arrival: "Cómo funciona el mercado laboral",
      },
    } satisfies Record<ModuleId, ModuleVariantText>,

    /** Descripciones cortas del seed §7.4 — una línea por módulo. */
    descriptions: {
      1: "Guarda tus documentos y no pierdas ninguna fecha límite.",
      2: "Visas, pasaportes y citas, paso a paso.",
      3: "Construye tu crédito y protege lo que ahorras.",
      4: "Crea tu LLC y haz crecer tu negocio.",
      5: "Encuentra tu gente, eventos y servicios cerca de ti.",
      6: "Certifícate en carreras de alta demanda.",
      7: "Empleos que coinciden con tu perfil.",
    } satisfies Record<ModuleId, string>,
  },
};

export type CommonDict = typeof es;

const en = {
  brand: {
    name: "ANDEX",
    tagline: "Your progress crosses borders.",
  },

  nav: {
    login: "Log in",
    signup: "Get started",
    logout: "Log out",
    panel: "My dashboard",
    profile: "Your profile",
    backToPanel: "Back to my dashboard",
    skipToContent: "Skip to content",
  },

  lang: {
    es: "Español",
    en: "English",
    ariaSwitch: "Change language",
  },

  theme: {
    light: "Light theme",
    dark: "Dark theme",
    system: "Match your device",
    ariaSwitch: "Change theme",
  },

  actions: {
    continue: "Continue",
    back: "Back",
    backHome: "Back to home",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    edit: "Edit",
    retry: "Try again",
    send: "Send",
    confirm: "Confirm",
    understood: "Got it",
    loading: "Loading…",
  },

  errors: {
    network:
      "We can't reach the server. Check your internet connection and try again.",
    server:
      "Something went wrong on our end. Wait a moment and try again; your data wasn't lost.",
    notFoundTitle: "This page doesn't exist",
    notFoundBody:
      "The link is broken or the page moved. Head back to the start to keep going.",
    formInvalid:
      "Some fields need fixing. Check the messages marked on the form.",
  },

  aria: {
    closeModal: "Close window",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    required: "Required",
    routeBar: (step: number) => `Your ANDEX path: point ${step} of 6`,
    locationChip: "Your current location",
    moduleIcon: (moduleTitle: string) => `${moduleTitle} module icon`,
  },

  optionalLabel: "Optional",

  badges: {
    soon: "Coming soon",
    recommended: "RECOMMENDED FOR YOU",
  },

  legal: {
    govDisclaimer:
      "ANDEX is not affiliated with any government agency. These procedures are free on the official portals.",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
  },

  modules: {
    titles: {
      1: {
        in_us: "Digital Vault & Alerts",
        pre_arrival: "Your documents for the trip",
      },
      2: {
        in_us: "Immigration Paperwork & Status",
        pre_arrival: "Get your visa and appointment ready",
      },
      3: {
        in_us: "Finances & Wealth",
        pre_arrival: "Prepare your financial landing",
      },
      4: {
        in_us: "Business Development",
        pre_arrival: "Invest or start a business in the U.S.",
      },
      5: {
        in_us: "Community & Local Life",
        pre_arrival: "Know your destination before you arrive",
      },
      6: {
        in_us: "Certification Academy",
        pre_arrival: "Get certified from your country",
      },
      7: {
        in_us: "Job Connection",
        pre_arrival: "How the job market works",
      },
    },

    descriptions: {
      1: "Store your documents and never miss a deadline.",
      2: "Visas, passports, and appointments, step by step.",
      3: "Build your credit and protect your savings.",
      4: "Start your LLC and grow your business.",
      5: "Find your people, events, and services near you.",
      6: "Get certified in high-demand careers.",
      7: "Jobs that match your profile.",
    },
  },
} satisfies CommonDict;

export const common: Record<Lang, CommonDict> = { es, en };
