/**
 * POST /api/events — ingesta de analítica de producto (§7.5).
 *
 * Body: { name: AnalyticsEventName, props?: Record<string, string|number|boolean|null> }
 *
 * Reglas:
 *   · `name` se valida contra la lista tipada (lib/analytics/event-names.ts).
 *     Un nombre desconocido es 400: la tabla §7.5 es cerrada a propósito.
 *   · Con Supabase configurado se inserta en `analytics_events` con el
 *     cliente de servidor: user_id de la sesión, o NULL si no hay (la landing
 *     dispara eventos antes del registro — política `events_insert_anon`).
 *   · En modo demo devuelve 204: el buffer local lo lleva demo-store.
 *   · Acepta `navigator.sendBeacon`, que manda content-type text/plain con
 *     JSON dentro (típico en `beforeunload` → onboarding_abandoned).
 *
 * La analítica JAMÁS rompe la app: ante un fallo de escritura se responde
 * 204 y se deja rastro en el log del servidor.
 */

import { NextResponse } from "next/server";

import { isAnalyticsEventName } from "@/lib/analytics/event-names";
import { isSupabaseConfigured } from "@/lib/config";
import type { Json } from "@/lib/db-types";

/** Valores admitidos en `properties` (espejo de AnalyticsProps). */
type PropValue = string | number | boolean | null;

function sanitizeProps(raw: unknown): Record<string, PropValue> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: Record<string, PropValue> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === undefined) continue;
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    }
    // Objetos anidados y arrays se descartan: §7.5 solo usa props planas.
  }
  return Object.keys(out).length > 0 ? out : null;
}

export async function POST(request: Request): Promise<Response> {
  // sendBeacon manda text/plain; fetch normal manda application/json.
  let payload: unknown;
  try {
    const text = await request.text();
    if (!text) return NextResponse.json({ error: "Cuerpo vacío." }, { status: 400 });
    payload = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Se esperaba un objeto." }, { status: 400 });
  }

  const { name, props } = payload as { name?: unknown; props?: unknown };

  if (!isAnalyticsEventName(name)) {
    return NextResponse.json(
      { error: "Evento desconocido: usa un nombre de la tabla §7.5." },
      { status: 400 },
    );
  }

  const properties = sanitizeProps(props);

  // Modo demo: sin backend donde escribir. El buffer local ya lo lleva
  // lib/data/demo-store.ts, así que aquí no hay nada que hacer.
  if (!isSupabaseConfigured) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    // Import dinámico: en modo demo ni siquiera se carga el cliente.
    const { getSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = await getSupabaseServerClient();

    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? null;

    const { error } = await supabase.from("analytics_events").insert({
      user_id: userId,
      event_name: name,
      properties: properties as Json | null,
    });

    if (error) {
      console.warn("[andex] analytics_events insert falló:", error.message);
    }
  } catch (err) {
    console.warn("[andex] /api/events no pudo registrar el evento:", err);
  }

  // Siempre 204: el cliente no debe reintentar ni mostrar error por analítica.
  return new NextResponse(null, { status: 204 });
}
