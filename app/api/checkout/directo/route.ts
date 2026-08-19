/**
 * POST /api/checkout/directo — abre la caja de pago del embudo nuevo.
 *
 * Es el hermano SIN SESIÓN de `/api/checkout`. Aquel prepara una intención
 * de cobro para alguien que ya tiene cuenta y paga con Stripe Elements
 * dentro de nuestra página; éste manda a la caja ALOJADA de Stripe a alguien
 * que todavía no existe como usuario.
 *
 * Por qué alojada y no Elements: aquí no hay cuenta, así que el correo hay
 * que pedirlo igual, y pedirlo nosotros significaba un campo más en el punto
 * donde más gente se cae, más una validación y una explicación de por qué lo
 * queremos. Stripe lo pide una vez, junto con la tarjeta, en su propio
 * dominio. De paso, el número de tarjeta no pasa ni cerca del nuestro: es la
 * forma más estrecha posible del alcance de PCI DSS.
 *
 * Contrato:
 *   POST { plan: "monthly" | "annual" }
 *   200  { url }   — a dónde mandar el navegador
 *   400  { error } — plan inválido
 *   503  { error } — Stripe configurado a medias
 *
 * NO escribe en ninguna tabla. Quien decide que un pago ocurrió es el
 * webhook, que es idempotente; si esta ruta escribiera habría dos escritores
 * peleándose por la misma fila.
 */

import { NextResponse, type NextRequest } from "next/server";

import { SITE_URL } from "@/lib/config";
import { isPlanType } from "@/lib/stripe/plans";
import { getStripe, isStripeServerConfigured, stripePriceId } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function error(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return error("Cuerpo ilegible.", 400);
  }

  const plan = (cuerpo as { plan?: unknown } | null)?.plan;
  if (!isPlanType(plan)) return error("Plan inválido.", 400);

  /* El origen sale de la petición y no sólo de la variable de entorno: en
     desarrollo el puerto cambia, y una `success_url` apuntando a otro puerto
     devuelve a la persona a una página que no existe justo después de haber
     pagado. `SITE_URL` queda de red de seguridad. */
  const origen = req.nextUrl.origin || SITE_URL;

  /**
   * MODO DEMO — sin pasarela.
   *
   * No se finge una pantalla de Stripe: se salta directamente al paso de
   * vuelta, marcado como demo. Así el resto del embudo se recorre entero y
   * el día que existan las credenciales sólo cambia esta rama.
   */
  if (!isStripeServerConfigured()) {
    return NextResponse.json({
      url: `${origen}/pago/confirmado?demo=1&plan=${plan}`,
    });
  }

  try {
    const stripe = getStripe();
    const sesion = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: stripePriceId(plan), quantity: 1 }],
      /* `{CHECKOUT_SESSION_ID}` lo sustituye Stripe. Es un identificador
         opaco suyo, no un dato de la persona: el correo se lee DESPUÉS,
         del lado del servidor, canjeando ese identificador. Nunca viaja
         por la URL. */
      success_url: `${origen}/pago/confirmado?session_id={CHECKOUT_SESSION_ID}`,
      /* Al cancelar se vuelve al mismo plan que estaba mirando, no al
         principio: hacerle elegir otra vez es castigar la duda. */
      cancel_url: `${origen}/pago?plan=${plan}`,
      /* Sin cupones: este producto no tiene descuentos que expiran, y el
         campo de código promocional invita a buscar uno y abandonar. */
      allow_promotion_codes: false,
      billing_address_collection: "auto",
    });

    if (!sesion.url) return error("Stripe no devolvió destino.", 503);
    return NextResponse.json({ url: sesion.url });
  } catch {
    /* El detalle del fallo se queda aquí: hacia fuera va una frase que la
       persona pueda leer, y la certeza de que no se le ha cobrado. */
    return error("No se pudo abrir la pasarela.", 503);
  }
}
