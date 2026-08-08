/**
 * POST /api/webhooks/stripe — la ÚNICA fuente de verdad del estado de las
 * suscripciones (§3.4.5, §7.2).
 *
 * Tres invariantes, todas exigidas por el PRD:
 *
 * 1. **Firma verificada.** Sin `STRIPE_WEBHOOK_SECRET` no se procesa nada:
 *    cualquiera podría inventarse un pago con un POST.
 * 2. **Idempotencia contra `stripe_events`** (§9, definición de terminado:
 *    "un webhook duplicado no duplica lógica de negocio"). El `event_id` se
 *    RESERVA con un INSERT antes de tocar nada; si ya existía, se sale con
 *    200 sin reprocesar. Si el procesado falla, la reserva se libera para que
 *    el reintento de Stripe sirva de algo.
 * 3. **Escritura con el cliente admin.** `subscriptions` y `stripe_events` no
 *    tienen políticas de escritura a propósito (0002_rls.sql): solo el service
 *    role puede escribirlas. Es la única excepción autorizada al contrato de
 *    `lib/data` (brief §6).
 *
 * ⚠️ TARIFA CONGELADA (§3.4.4 y riesgo R2): `stripe_price_id` se copia tal
 * cual desde la suscripción de Stripe y queda fijado por suscripción. Este
 * webhook **jamás** debe reescribirlo hacia el precio de lista vigente, y
 * nunca puede existir un job que lo haga en bloque. Ver lib/stripe/server.ts.
 */

import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { ROUTES, SITE_URL } from "@/lib/config";
import { enqueueEmail } from "@/lib/notifications/email";
import { getSupabaseAdminClient, type AndexAdminClient } from "@/lib/supabase/admin";
import {
  epochToIso,
  expandedId,
  getStripe,
  getStripeWebhookSecret,
  isStripeWebhookConfigured,
  planFromPriceId,
} from "@/lib/stripe/server";
import type { PlanType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Eventos que este endpoint sabe manejar. El resto se acusa y se ignora. */
const HANDLED: readonly string[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
];

/** Código de violación de unicidad en PostgreSQL: el evento ya se procesó. */
const UNIQUE_VIOLATION = "23505";

// ─── Idempotencia ────────────────────────────────────────

/**
 * Reserva el evento. `true` = es nuevo y hay que procesarlo.
 * `false` = ya se procesó (o se está procesando): no repetir nada.
 */
async function claimEvent(
  admin: AndexAdminClient,
  event: Stripe.Event,
): Promise<boolean> {
  const { error } = await admin
    .from("stripe_events")
    .insert({ event_id: event.id, event_type: event.type });

  if (!error) return true;
  if (error.code === UNIQUE_VIOLATION) return false;
  throw new Error(`No se pudo registrar el evento de Stripe: ${error.message}`);
}

/**
 * Libera la reserva cuando el procesado falló. Sin esto, el reintento de
 * Stripe vería el evento como "ya procesado" y el cobro nunca se reflejaría.
 */
async function releaseEvent(
  admin: AndexAdminClient,
  eventId: string,
): Promise<void> {
  await admin.from("stripe_events").delete().eq("event_id", eventId);
}

// ─── Resolución del usuario ──────────────────────────────

function metadataUserId(metadata: Stripe.Metadata | null | undefined): string | null {
  const value = metadata?.user_id;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function metadataPlan(metadata: Stripe.Metadata | null | undefined): PlanType | null {
  const value = metadata?.plan_type;
  return value === "monthly" || value === "annual" ? value : null;
}

/**
 * De quién es esta suscripción. Tres caminos, del más fiable al más lento:
 * metadata de la suscripción → fila previa con el mismo customer →
 * metadata del cliente de Stripe.
 */
async function resolveUserId(
  admin: AndexAdminClient,
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const fromMetadata = metadataUserId(subscription.metadata);
  if (fromMetadata) return fromMetadata;

  const customerId = expandedId(subscription.customer);
  if (!customerId) return null;

  const { data } = await admin
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .limit(1)
    .maybeSingle();
  if (data?.user_id) return data.user_id;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) return metadataUserId(customer.metadata);
  } catch {
    // Cliente borrado en Stripe: no hay a quién atribuirlo.
  }
  return null;
}

/** Correo al que mandar recibo y avisos. */
async function resolveEmail(
  stripe: Stripe,
  customerId: string | null,
): Promise<string | null> {
  if (!customerId) return null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer.email ?? null;
  } catch {
    return null;
  }
}

// ─── Escritura de `subscriptions` ────────────────────────

function priceIdOf(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price.id ?? null;
}

/**
 * Vuelca el estado de Stripe en `subscriptions`. Es un espejo, no una lógica:
 * lo que Stripe diga es lo que vale.
 */
async function upsertSubscription(
  admin: AndexAdminClient,
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = await resolveUserId(admin, stripe, subscription);
  if (!userId) {
    // Sin usuario la fila no sirve para nada y rompería el FK. Se registra
    // para poder reconciliar a mano; el evento NO se reintenta en bucle.
    console.warn(
      "[andex] webhook de Stripe sin user_id atribuible:",
      subscription.id,
    );
    return;
  }

  const priceId = priceIdOf(subscription);

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: expandedId(subscription.customer),
      stripe_subscription_id: subscription.id,
      // ⚠️ TARIFA CONGELADA (§3.4.4): se copia el precio REAL de la
      // suscripción, nunca el precio de lista vigente. Nadie migra esto.
      stripe_price_id: priceId,
      plan_type: metadataPlan(subscription.metadata) ?? planFromPriceId(priceId),
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      trial_end: epochToIso(subscription.trial_end),
      current_period_start: epochToIso(subscription.current_period_start),
      current_period_end: epochToIso(subscription.current_period_end),
      canceled_at: epochToIso(subscription.canceled_at),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  if (error) {
    throw new Error(`No se pudo guardar la suscripción: ${error.message}`);
  }

  // §3.4.6 — "Aviso previo a la renovación: correo 48 h antes de cada cobro,
  // con enlace directo a cancelar". Se encola aquí porque es el momento en que
  // se conoce la fecha del próximo cobro.
  // ⛏️ FALTA EL SCHEDULER: `enqueueEmail` es un stub que hoy solo registra en
  // consola. Hace falta un cron que lo despache a (current_period_end − 48 h)
  // y que compruebe antes que la suscripción sigue viva.
  if (
    (subscription.status === "active" || subscription.status === "trialing") &&
    !subscription.cancel_at_period_end
  ) {
    const email = await resolveEmail(stripe, expandedId(subscription.customer));
    const renewsAt = epochToIso(subscription.current_period_end);
    if (email && renewsAt) {
      await enqueueEmail({
        kind: "renewal_reminder",
        to: email,
        renewsAt,
        // Cancelación en un clic desde Perfil (§3.4.6): el enlace del correo
        // lleva justo ahí, no a un formulario ni a un chat de retención.
        cancelUrl: `${SITE_URL}${ROUTES.perfil}`,
      });
    }
  }
}

/** Marca la fila como `past_due` sin tocar nada más (§3.4.7: no borrar datos). */
async function markPastDue(
  admin: AndexAdminClient,
  subscriptionId: string,
): Promise<void> {
  const { error } = await admin
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscriptionId);
  if (error) {
    throw new Error(`No se pudo marcar la suscripción vencida: ${error.message}`);
  }
}

// ─── Despacho por tipo de evento ─────────────────────────

async function handleEvent(
  admin: AndexAdminClient,
  stripe: Stripe,
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      // ANDEX cobra con Elements, no con Checkout Sessions, pero un Payment
      // Link o una prueba manual llegan por aquí y deben cuadrar igual.
      const session = event.data.object;
      const subscriptionId = expandedId(session.subscription);
      if (!subscriptionId) return;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await upsertSubscription(admin, stripe, subscription);
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // El objeto del evento ya trae el estado final; `deleted` llega con
      // status 'canceled', que es exactamente lo que hay que persistir.
      await upsertSubscription(admin, stripe, event.data.object);
      return;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const subscriptionId = expandedId(invoice.subscription);
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscription(admin, stripe, subscription);
      }

      // §3.4.6 — "Recibo: correo automático tras cada cobro".
      // ⛏️ Stripe también puede enviarlo nativo (Billing → recibos); mientras
      // no se active, este job lo cubre. Hoy es un stub.
      const email =
        invoice.customer_email ??
        (await resolveEmail(stripe, expandedId(invoice.customer)));
      if (email && invoice.amount_paid > 0) {
        const priceId = invoice.lines.data[0]?.price?.id ?? null;
        await enqueueEmail({
          kind: "receipt",
          to: email,
          amountUsd: invoice.amount_paid / 100,
          plan: planFromPriceId(priceId) ?? "monthly",
        });
      }
      return;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const subscriptionId = expandedId(invoice.subscription);
      if (!subscriptionId) return;
      // §3.4.7: `past_due` conserva acceso de solo lectura durante
      // PAST_DUE_GRACE_DAYS. Aquí solo se marca el estado; el corte de acceso
      // lo decide `hasDashboardAccess()` (lib/auth/routing.ts).
      await markPastDue(admin, subscriptionId);
      return;
    }

    default:
      // Evento suscrito por error o nuevo: se acusa recibo y se ignora. No es
      // un fallo — devolver 4xx haría que Stripe reintentara para siempre.
      return;
  }
}

// ─── Entrada ─────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
  if (!isStripeWebhookConfigured()) {
    // Sin credenciales no hay nada que verificar. 503 y no 200: un webhook
    // aceptado en silencio es peor que uno rechazado.
    return NextResponse.json(
      { error: "Stripe no está configurado en este entorno." },
      { status: 503 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta la firma." }, { status: 400 });
  }

  const stripe = getStripe();

  // El cuerpo CRUDO es obligatorio: cualquier reserialización invalida la
  // firma. Por eso se lee con .text() y nunca con .json().
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : "";
    console.warn("[andex] firma de webhook inválida:", detail);
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  let isNew: boolean;
  try {
    isNew = await claimEvent(admin, event);
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : "";
    console.error("[andex] no se pudo reservar el evento:", detail);
    // 500 → Stripe reintenta. Mejor reintentar que perder un cobro.
    return NextResponse.json({ error: "Error al registrar el evento." }, { status: 500 });
  }

  // IDEMPOTENCIA (§9): duplicado → 200 y ni una línea de lógica de negocio.
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!HANDLED.includes(event.type)) {
    return NextResponse.json({ received: true, handled: false });
  }

  try {
    await handleEvent(admin, stripe, event);
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : "";
    console.error(`[andex] webhook ${event.type} falló:`, detail);
    // Se libera la reserva para que el reintento de Stripe SÍ procese.
    await releaseEvent(admin, event.id).catch(() => {
      console.error("[andex] no se pudo liberar el evento", event.id);
    });
    return NextResponse.json({ error: "Error al procesar el evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
