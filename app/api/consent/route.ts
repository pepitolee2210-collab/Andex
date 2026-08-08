/**
 * POST /api/consent — registro de consentimientos (§3.4.6).
 *
 * §3.4.6 exige guardar el consentimiento con **versión de términos, timestamp
 * e IP**. Los dos primeros los sabe cualquiera; la IP no: el navegador no
 * conoce la suya. Por eso este registro NO puede hacerse desde el cliente y
 * vive aquí, donde la cabecera de la petición sí la trae.
 *
 * La IP se guarda como EVIDENCIA de que ese consentimiento se otorgó — es lo
 * que convierte el registro en prueba si alguien reclama que nunca aceptó.
 * No se usa para rastrear al usuario, no se cruza con analítica y no sale de
 * `user_consents`.
 *
 * Contrato:
 *   POST { consents: [{ type: "terms"|"privacy"|"marketing", granted: bool }] }
 *   204 → registrado (o modo demo: no hay base ni registro legal que llevar)
 *   401 → sin sesión · 400 → cuerpo inválido · 500 → la base rechazó el alta
 *
 * La versión de términos la pone el servidor desde `TERMS_VERSION`: si viniera
 * del cliente, cualquiera podría declarar que aceptó una versión que no leyó.
 */

import { NextResponse, type NextRequest } from "next/server";
import { TERMS_VERSION, isDemoMode } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CONSENT_TYPES = ["terms", "privacy", "marketing"] as const;
type ConsentType = (typeof CONSENT_TYPES)[number];

type ConsentInput = { type: ConsentType; granted: boolean };

function isConsentType(value: unknown): value is ConsentType {
  return (
    typeof value === "string" &&
    (CONSENT_TYPES as readonly string[]).includes(value)
  );
}

/**
 * IP del cliente. `x-forwarded-for` puede traer una cadena de proxies
 * ("cliente, proxy1, proxy2"): el primer valor es el origen real.
 */
function clientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const candidate =
    forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim();
  if (!candidate) return null;
  // La columna es INET: un valor con basura reventaría el INSERT entero y
  // perdería el consentimiento, que importa más que su IP.
  return /^[0-9a-fA-F:.]+$/.test(candidate) ? candidate : null;
}

function parseConsents(payload: unknown): ConsentInput[] | null {
  if (typeof payload !== "object" || payload === null) return null;
  const raw = (payload as Record<string, unknown>).consents;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 10) return null;

  const consents: ConsentInput[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const record = item as Record<string, unknown>;
    if (!isConsentType(record.type) || typeof record.granted !== "boolean") {
      return null;
    }
    consents.push({ type: record.type, granted: record.granted });
  }
  return consents;
}

export async function POST(req: NextRequest) {
  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const consents = parseConsents(payload);
  if (!consents) return new NextResponse(null, { status: 400 });

  // Modo demo: no hay base de datos ni obligación legal que cumplir. Se
  // acepta en silencio para que el alta siga su curso.
  if (isDemoMode) return new NextResponse(null, { status: 204 });

  const supabase = await getSupabaseServerClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) return new NextResponse(null, { status: 401 });

  const userId = data.user.id;
  const ip = clientIp(req);

  // `ip_address` existe en la tabla (0005_schema_gaps.sql) pero todavía no en
  // lib/db-types.ts, que es del agente de Datos. El payload se arma como
  // variable —no como literal— para que TypeScript no lo rechace por
  // propiedad excedente; al regenerar los tipos esto sigue siendo válido.
  const rows = consents.map((consent) => ({
    user_id: userId,
    consent_type: consent.type,
    document_version: TERMS_VERSION,
    granted: consent.granted,
    ip_address: ip,
  }));

  const { error } = await supabase.from("user_consents").insert(rows);
  if (error) {
    // Se registra en el servidor: un consentimiento perdido es un problema de
    // cumplimiento, no un detalle. El alta del usuario no se cancela por esto.
    console.warn("[andex] no se pudo registrar el consentimiento:", error.message);
    return new NextResponse(null, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
