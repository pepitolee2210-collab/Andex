/**
 * POST /api/subscription — cancelar o reactivar la membresía (§3.4.6, §3.4.7).
 *
 * Existe porque `subscriptions` NO tiene políticas de escritura
 * (supabase/migrations/0002_rls.sql): el cliente solo LEE su suscripción.
 * Toda mutación pasa por aquí → API de Stripe → webhook → BD con el cliente
 * admin. `lib/data/supabase-store.ts` ya llama a este endpoint desde
 * cancelSubscription() y reactivateSubscription().
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CANCELACIÓN EN UN CLIC (§3.4.6, fila "Cancelación tan simple como la
 * suscripción"). Este endpoint es deliberadamente tonto:
 *   · No pregunta por qué antes de cancelar (el motivo se pregunta DESPUÉS,
 *     con "No, gracias" a la vista — decisión D18).
 *   · No ofrece descuentos de retención, ni pasos extra, ni un teléfono.
 *   · No exige confirmar dos veces.
 * Si algún día alguien añade aquí un paso intermedio, está rompiendo un
 * requisito de cumplimiento, no mejorando la conversión.
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Contrato (acordado con el agente de Datos, no cambiar sin avisar):
 *   Request : { action: "cancel" | "reactivate" }
 *   200     : { ok: true, planType, daysActive }
 *   4xx/5xx : { error: string } — mensaje en español, apto para el usuario.
 *
 * NO escribe en `subscriptions`: el webhook `customer.subscription.updated`
 * es la única fuente de verdad del estado.
 */

import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe, isStripeServerConfigured } from "@/lib/stripe/server";
import type { PlanType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "cancel" | "reactivate";

function fail(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function parseAction(payload: unknown): Action | null {
  if (typeof payload !== "object" || payload === null) return null;
  const value = (payload as Record<string, unknown>).action;
  return value === "cancel" || value === "reactivate" ? value : null;
}

/** Días transcurridos desde el alta — prop `days_active` de §7.5. */
function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const started = new Date(iso).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 86_400_000));
}

export async function POST(req: NextRequest): Promise<Response> {
  if (isDemoMode || !isStripeServerConfigured()) {
    // En modo demo la suscripción vive en el navegador y `demo-store.ts` la
    // cancela sin pasar por aquí. Si algo llega igualmente, se dice la verdad
    // en vez de responder 200 sin haber hecho nada.
    return fail(
      "Este entorno corre en modo demostración: la membresía se gestiona en " +
        "el navegador y no hay nada que cancelar en Stripe.",
      503,
    );
  }

  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    return fail("No se entendió la solicitud.", 400);
  }

  const action = parseAction(payload);
  if (!action) {
    return fail("Acción no reconocida sobre la membresía.", 400);
  }

  const supabase = await getSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return fail("Inicia sesión para gestionar tu membresía.", 401);
  }
  const userId = auth.user.id;

  // Lectura con RLS: el usuario solo puede ver su propia suscripción, así que
  // es imposible cancelar la de otro aunque se manipule la petición.
  const { data: row, error: readError } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, plan_type, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readError) {
    return fail(
      "No pudimos leer el estado de tu membresía. Inténtalo de nuevo en un minuto.",
      500,
    );
  }
  if (!row?.stripe_subscription_id) {
    return fail("No encontramos una membresía asociada a tu cuenta.", 404);
  }

  try {
    const stripe = getStripe();

    // §3.4.7: cancelar NO corta el acceso. Se marca cancel_at_period_end y el
    // usuario entra al panel hasta `current_period_end`; la cuenta y el perfil
    // quedan intactos después (nunca se borran datos).
    const updated = await stripe.subscriptions.update(row.stripe_subscription_id, {
      cancel_at_period_end: action === "cancel",
    });

    const planType: PlanType =
      row.plan_type === "annual" || row.plan_type === "monthly"
        ? row.plan_type
        : "monthly";
    const daysActive = daysSince(row.created_at);

    // ⚠️ AQUÍ NO SE EMITE `subscription_canceled` (§7.5).
    //
    // Lo emite `components/panel/subscription-card.tsx`, y solo él. Este
    // endpoint llegó a insertarlo también, lo que duplicaba el evento en
    // producción —una vez aquí y otra desde el navegador— e inflaba la métrica
    // de cancelación al doble. Se quitó de aquí, y no al revés, por dos
    // razones:
    //
    //   · §7.5 exige la propiedad `reason`, y D18 manda preguntar el motivo
    //     DESPUÉS de cancelar. El servidor no lo conoce nunca: desde aquí el
    //     evento saldría siempre con `reason: null`, incumpliendo la tabla.
    //   · La cancelación en sí no se pierde aunque el evento sí: queda escrita
    //     en `subscriptions` (`cancel_at_period_end`, `canceled_at`), que es la
    //     fuente de verdad del churn. Un evento duplicado, en cambio, corrompe
    //     la métrica sin dejar forma de detectarlo.
    //
    // Si algún día hace falta blindar la emisión ante un cierre de pestaña, la
    // vía correcta es que el cliente mande el `reason` a este endpoint y el
    // servidor sea el único emisor — nunca los dos a la vez.

    return NextResponse.json({
      ok: true,
      planType,
      daysActive,
      cancelAtPeriodEnd: updated.cancel_at_period_end,
    });
  } catch (caught) {
    const detail = caught instanceof Error ? caught.message : "";
    console.error(`[andex] /api/subscription (${action}) falló:`, detail);
    return fail(
      action === "cancel"
        ? "No pudimos cancelar tu membresía ahora mismo. Inténtalo de nuevo en unos minutos; no se te cobró nada por este intento."
        : "No pudimos reactivar tu membresía ahora mismo. Inténtalo de nuevo en unos minutos.",
      502,
    );
  }
}
