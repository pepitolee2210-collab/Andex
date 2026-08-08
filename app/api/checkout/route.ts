/**
 * POST /api/checkout — crea (o recupera) la suscripción de Stripe y devuelve
 * el `client_secret` con el que Stripe Elements confirma el pago (§3.4.5).
 *
 * ANDEX **nunca** toca datos de tarjeta: aquí no entra ni un dígito. Este
 * endpoint solo prepara la intención de cobro; la tarjeta viaja del navegador
 * a Stripe directamente.
 *
 * Contrato:
 *   POST { plan: "monthly" | "annual" }
 *   200  { clientSecret, mode: "payment"|"setup", subscriptionId, amountUsd }
 *   400  { error } — plan inválido
 *   401  { error } — sin sesión
 *   409  { error } — ya hay membresía vigente (no se cobra dos veces)
 *   503  { error } — Stripe no configurado (la app corre en modo demo)
 *
 * NO escribe en `subscriptions`: la única fuente de verdad del estado es el
 * webhook (`app/api/webhooks/stripe`), que además es idempotente. Si esta
 * ruta escribiera, habría dos escritores compitiendo por la misma fila.
 */

import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { PAYWALL_MODE, TRIAL_DAYS, isDemoMode } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isPlanType, planPriceUsd } from "@/lib/stripe/plans";
import {
  getStripe,
  isStripeServerConfigured,
  stripePriceId,
} from "@/lib/stripe/server";
import type { PlanType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutResponse = {
  clientSecret: string;
  /** `setup` cuando hay prueba gratuita: aún no hay nada que cobrar (§3.4.8 A). */
  mode: "payment" | "setup";
  subscriptionId: string;
  amountUsd: number;
};

function error(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Estados de Stripe que significan "ya tiene acceso, no le cobres otra vez". */
const LIVE_STATUSES: readonly Stripe.Subscription.Status[] = [
  "active",
  "trialing",
  "past_due",
];

/**
 * Cliente de Stripe del usuario. Se reutiliza el que ya exista en
 * `subscriptions` (lectura con RLS: el usuario solo ve lo suyo) para no
 * fabricar un cliente nuevo en cada intento de pago.
 */
async function resolveCustomerId(
  stripe: Stripe,
  existingCustomerId: string | null,
  userId: string,
  email: string,
): Promise<string> {
  if (existingCustomerId) return existingCustomerId;

  const customer = await stripe.customers.create({
    email,
    // El webhook cae de pie aunque el evento no traiga metadata propia.
    metadata: { user_id: userId },
  });
  return customer.id;
}

/**
 * Reutiliza una suscripción `incomplete` del mismo precio en vez de crear
 * otra. Sin esto, cada reintento tras un rechazo (§3.4.7) dejaría una
 * suscripción huérfana en Stripe.
 */
async function findReusableSubscription(
  stripe: Stripe,
  customerId: string,
  priceId: string,
): Promise<Stripe.Subscription | null> {
  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: "incomplete",
    limit: 10,
    expand: ["data.latest_invoice.payment_intent", "data.pending_setup_intent"],
  });

  return (
    list.data.find((sub) =>
      sub.items.data.some((item) => item.price.id === priceId),
    ) ?? null
  );
}

/** Extrae el client secret, sea de PaymentIntent (cobro) o SetupIntent (prueba). */
function readClientSecret(
  subscription: Stripe.Subscription,
): { clientSecret: string; mode: "payment" | "setup" } | null {
  const setupIntent = subscription.pending_setup_intent;
  if (setupIntent && typeof setupIntent !== "string" && setupIntent.client_secret) {
    return { clientSecret: setupIntent.client_secret, mode: "setup" };
  }

  const invoice = subscription.latest_invoice;
  if (invoice && typeof invoice !== "string") {
    const intent = invoice.payment_intent;
    if (intent && typeof intent !== "string" && intent.client_secret) {
      return { clientSecret: intent.client_secret, mode: "payment" };
    }
  }

  return null;
}

export async function POST(req: NextRequest): Promise<Response> {
  if (isDemoMode || !isStripeServerConfigured()) {
    return error(
      "El cobro real no está disponible en este entorno: la app corre en modo " +
        "demostración y el checkout se simula.",
      503,
    );
  }

  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    return error("No se entendió la solicitud de pago.", 400);
  }

  const plan: unknown =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).plan
      : null;

  if (!isPlanType(plan)) {
    return error("Elige un plan antes de continuar.", 400);
  }
  const planType: PlanType = plan;

  const supabase = await getSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return error("Inicia sesión para completar tu membresía.", 401);
  }
  const userId = auth.user.id;
  const email = auth.user.email ?? "";

  // Lectura con RLS: el usuario solo puede ver su propia suscripción.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.status && ["active", "trialing"].includes(existing.status)) {
    return error("Tu membresía ya está activa. No hace falta pagar de nuevo.", 409);
  }

  try {
    const stripe = getStripe();
    const priceId = stripePriceId(planType);
    const customerId = await resolveCustomerId(
      stripe,
      existing?.stripe_customer_id ?? null,
      userId,
      email,
    );

    // Defensa extra: si Stripe ya tiene una suscripción viva para este
    // cliente, no se abre otra (la BD podría ir por detrás del webhook).
    const live = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
    if (live.data.some((sub) => LIVE_STATUSES.includes(sub.status))) {
      return error("Tu membresía ya está activa. No hace falta pagar de nuevo.", 409);
    }

    let subscription =
      (await findReusableSubscription(stripe, customerId, priceId)) ?? null;

    if (!subscription) {
      subscription = await stripe.subscriptions.create({
        customer: customerId,
        // TARIFA CONGELADA (§3.4.4 / R2): este price_id queda fijado en la
        // suscripción y no se migra jamás en bloque. Ver lib/stripe/server.ts.
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
          payment_method_types: ["card"],
        },
        // §3.4.8 opción A: la prueba se activa por configuración, sin código
        // nuevo. En 'direct' y 'freemium' no hay prueba.
        ...(PAYWALL_MODE === "trial" ? { trial_period_days: TRIAL_DAYS } : {}),
        // El webhook necesita saber de quién es la suscripción y qué plan es
        // sin tener que consultar la base (§7.2).
        metadata: { user_id: userId, plan_type: planType },
        expand: ["latest_invoice.payment_intent", "pending_setup_intent"],
      });
    }

    const secret = readClientSecret(subscription);
    if (!secret) {
      return error(
        "Stripe no devolvió una intención de pago utilizable. Inténtalo de " +
          "nuevo en un minuto; no se hizo ningún cargo.",
        502,
      );
    }

    const body: CheckoutResponse = {
      clientSecret: secret.clientSecret,
      mode: secret.mode,
      subscriptionId: subscription.id,
      amountUsd: planPriceUsd(planType),
    };
    return NextResponse.json(body);
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : "";
    console.error("[andex] /api/checkout falló:", detail);
    return error(
      "No pudimos preparar tu pago y no se hizo ningún cargo. Inténtalo de " +
        "nuevo en unos minutos; tu plan sigue guardado.",
      502,
    );
  }
}
