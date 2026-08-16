/**
 * ANDEX — Configuración central del MVP.
 * Precios y reglas de §3.4.4; modos del paywall de §3.4.8.
 */

export const COOKIES = {
  lang: "andex_lang",
  theme: "andex_theme",
  /** Sesión del modo demo (sin Supabase). En producción la sesión es de Supabase Auth. */
  demoSession: "andex_session",
} as const;

/**
 * §3.1.1 — La rama elegida en el hero de la landing se guarda en
 * `sessionStorage` (no cookie, no cuenta todavía) y **precarga el paso 2 del
 * wizard** para que el usuario no responda dos veces. Si cambia de rama
 * dentro del wizard, gana la del wizard.
 */
export const SESSION_KEYS = {
  landingBranch: "andex_landing_branch",
  /** Banda superior cerrada: no reaparece durante la misma sesión. */
  bannerDismissed: "andex_banner_dismissed",
} as const;

/** §3.4.4 — Estrategia de precios y anclaje. USD only en v1 (§0.3). */
export const PRICES = {
  monthly: { usd: 14, stripeEnv: "STRIPE_PRICE_MONTHLY" },
  annual: {
    usd: 140,
    monthlyEquivalentUsd: 11.6,
    savingsUsd: 28,
    stripeEnv: "STRIPE_PRICE_ANNUAL",
  },
} as const;

/**
 * WhatsApp del equipo de Inversiones — donde termina el ciclo de esa
 * sección. En formato internacional y sin signos: `wa.me` los rechaza.
 *
 * Vive en una variable de entorno porque cambia sin tocar código y porque
 * el número de un comercial no es una constante del producto. Si falta, la
 * sección lo dice en vez de pintar un botón que abre un chat vacío.
 */
export const WHATSAPP_INVERSIONES = process.env.NEXT_PUBLIC_WHATSAPP_INVERSIONES ?? "";

/** Versión de términos registrada en user_consents (§3.4.6). */
export const TERMS_VERSION = "v1-2026-08";

/**
 * Familias acompañadas en el piloto de Utah. Lo usan la prueba social de la
 * landing (§3.1) y el paywall (§3.4.3: "2,400 familias en Utah").
 *
 * Es un PARÁMETRO, no texto fijo (decisión D19): un número exacto e inmóvil
 * es lo primero que esta audiencia lee como inflado. Cuando exista un conteo
 * verificable, se cambia aquí y en ningún otro sitio.
 */
export const PILOT_FAMILIES = 2400;

/**
 * §3.4.8 — Un solo componente de paywall, tres variantes por configuración:
 * 'direct'   → cobro inmediato (MVP)
 * 'trial'    → prueba de 7 días con tarjeta (contingencia A)
 * 'freemium' → módulos base gratis (contingencia B)
 */
export const PAYWALL_MODE = "direct" as "direct" | "trial" | "freemium";
export const TRIAL_DAYS = 7;

/** Días de acceso de solo lectura cuando la suscripción está past_due (§3.4.7). */
export const PAST_DUE_GRACE_DAYS = 7;

// ── Detección de entorno ─────────────────────────────────
// Sin credenciales la app corre en MODO DEMO: datos en el navegador,
// checkout simulado. Ver docs/BRIEF-AGENTES.md.

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const isStripeConfigured = Boolean(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

export const isDemoMode = !isSupabaseConfigured;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// ── Mapa de rutas (única fuente; no hardcodear strings) ──

export const ROUTES = {
  landing: "/",
  login: "/login",
  registro: "/registro",
  recuperar: "/recuperar",
  entrevista: "/entrevista",
  membresia: "/membresia",
  pago: "/pago",
  pagoExito: "/pago/exito",
  panel: "/panel",
  modulo: (slug: string) => `/modulo/${slug}`,
  perfil: "/perfil",
  inversiones: "/inversiones",
  tienda: "/tienda",
  design: "/design",

  // Páginas legales. Enlazadas desde el footer y desde el checkout (§3.4.6
  // exige divulgar los términos antes del cobro). El CONTENIDO es redacción
  // legal, no de ingeniería, y queda fuera del alcance de v1 — ver
  // docs/DECISIONES.md.
  terminos: "/terminos",
  privacidad: "/privacidad",
  contacto: "/contacto",
} as const;
