/**
 * POST /api/checkout/abandonado — el usuario dejó el checkout sin pagar.
 *
 * §3.4.7, fila "Usuario vuelve días después":
 *   "Correo de recuperación a las 24 h con enlace directo al paywall
 *    personalizado. **Uno solo, sin secuencia insistente.**"
 *
 * Qué hace hoy: encolar ese correo con `enqueueEmail` (stub de
 * `lib/notifications/email.ts`). Qué NO hace: esperar 24 h. No hay scheduler
 * en v1 — el job queda encolado y hace falta un cron (Vercel Cron / Supabase
 * cron) que lo despache con el retraso y que compruebe ANTES de enviarlo que
 * el usuario no pagó mientras tanto. Anotado en el reporte del agente.
 *
 * El perfil NO se toca: §3.4.7 exige que quede intacto para que al volver el
 * usuario entre directo al paywall ya armado.
 *
 * Se llama con `navigator.sendBeacon`, así que la respuesta es 204 sin cuerpo
 * y nunca falla de forma visible: abandonar un pago no puede romper nada.
 */

import { NextResponse, type NextRequest } from "next/server";
import { ROUTES, SITE_URL, isDemoMode } from "@/lib/config";
import { enqueueEmail } from "@/lib/notifications/email";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  // El cuerpo se lee y se descarta: `sendBeacon` siempre manda uno y dejarlo
  // sin consumir deja la conexión colgando en algunos runtimes.
  await req.text().catch(() => "");

  // Modo demo: no hay correo que enviar ni base donde mirar.
  if (isDemoMode) return new NextResponse(null, { status: 204 });

  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) {
      return new NextResponse(null, { status: 204 });
    }

    await enqueueEmail({
      kind: "checkout_recovery",
      to: data.user.email,
      // Enlace directo al paywall personalizado, no a la landing: §3.4.7 pide
      // que no repita la entrevista.
      paywallUrl: `${SITE_URL}${ROUTES.membresia}`,
    });
  } catch {
    // Un correo de recuperación no vale una pantalla de error.
  }

  return new NextResponse(null, { status: 204 });
}
