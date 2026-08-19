/**
 * Cliente de Stripe — SOLO SERVIDOR.
 *
 * Usa `STRIPE_SECRET_KEY`. PROHIBIDO importarlo desde un componente, un hook o
 * cualquier módulo que pueda acabar en el bundle del navegador: filtraría la
 * clave con la que se cobra. Lo que el cliente necesita saber de los planes
 * está en `lib/stripe/plans.ts`, que es puro.
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  ⚠️  TARIFA CONGELADA — PROMESA COMERCIAL VINCULANTE (§3.4.4, R2)    ║
 * ║                                                                      ║
 * ║  El sello del paywall dice, con estas palabras:                       ║
 * ║    "Pagas $250 mientras mantengas tu membresía, aunque el precio     ║
 * ║     suba."                                                           ║
 * ║                                                                      ║
 * ║  Consecuencia técnica, no negociable:                                ║
 * ║  · El `stripe_price_id` queda FIJADO en la suscripción al crearla y  ║
 * ║    se persiste en `subscriptions.stripe_price_id`.                   ║
 * ║  · Cuando el precio de lista suba, se crea un `price` NUEVO en       ║
 * ║    Stripe y se apunta aquí (vía las env vars). Las suscripciones ya  ║
 * ║    existentes NO se tocan.                                           ║
 * ║  · **NUNCA** se corre una migración masiva de precios sobre          ║
 * ║    `subscriptions` ni un `subscriptions.update({items:[…]})` en      ║
 * ║    bloque. Hacerlo rompe una promesa publicada, no un detalle        ║
 * ║    técnico.                                                          ║
 * ║  · Un cambio de precio para un usuario concreto solo es legítimo si  ║
 * ║    él lo pide (cambio de plan mensual↔anual), y entonces el precio   ║
 * ║    nuevo es el vigente: la congelación protege al que no se mueve.   ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import Stripe from "stripe";
import type { PlanType } from "@/lib/types";
import { planPriceEnvName } from "./plans";

if (typeof window !== "undefined") {
  throw new Error(
    "lib/stripe/server.ts se importó en el navegador. Este módulo usa la " +
      "STRIPE_SECRET_KEY y solo puede ejecutarse en el servidor.",
  );
}

/**
 * Versión de API fijada a mano: si Stripe publica una nueva, el
 * comportamiento del webhook y del checkout no cambia bajo los pies.
 */
const API_VERSION: Stripe.LatestApiVersion = "2025-02-24.acacia";

let client: Stripe | null = null;

/** ¿Hay credenciales de servidor para cobrar de verdad? */
export function isStripeServerConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** ¿Está el webhook listo para verificar firmas? */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "Falta STRIPE_WEBHOOK_SECRET: sin él no se puede verificar la firma de " +
        "los webhooks y cualquiera podría inventar un pago.",
    );
  }
  return secret;
}

export function getStripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Falta STRIPE_SECRET_KEY: el servidor no puede hablar con Stripe. " +
        "Sin ella la app corre en modo demo (checkout simulado).",
    );
  }

  client = new Stripe(key, {
    apiVersion: API_VERSION,
    appInfo: { name: "ANDEX", version: "1.0.0" },
    // Los cortes de red son la causa más común de un cobro "fantasma":
    // el reintento del SDK usa la misma clave de idempotencia.
    maxNetworkRetries: 2,
  });
  return client;
}

/**
 * Mapa plan → `price_id`, leído de las variables de entorno.
 *
 * TARIFA CONGELADA: este mapa dice cuál es el precio para altas NUEVAS. No
 * describe lo que paga un usuario ya suscrito — eso vive en
 * `subscriptions.stripe_price_id` y es intocable.
 */
export function stripePriceId(plan: PlanType): string {
  const envName = planPriceEnvName(plan);
  const value = process.env[envName];
  if (!value) {
    throw new Error(
      `Falta la variable ${envName}: no hay price_id de Stripe para el plan ` +
        `${plan}. Créalo en el panel de Stripe y decláralo en el entorno.`,
    );
  }
  return value;
}

/** `price_id` → plan. Se usa en el webhook cuando el evento no trae metadata. */
export function planFromPriceId(priceId: string | null | undefined): PlanType | null {
  if (!priceId) return null;
  if (priceId === process.env[planPriceEnvName("annual")]) return "annual";
  if (priceId === process.env[planPriceEnvName("monthly")]) return "monthly";
  return null;
}

/** Segundos epoch de Stripe → ISO para PostgreSQL. */
export function epochToIso(seconds: number | null | undefined): string | null {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000).toISOString();
}

/** Desenvuelve un campo expandible de Stripe (`string | Objeto | null`). */
export function expandedId(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
