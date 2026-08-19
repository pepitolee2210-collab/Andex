import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConfirmadoScreen } from "@/components/embudo/confirmado-screen";
import { ROUTES } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { parsePlan } from "@/lib/stripe/plans";
import { getStripe, isStripeServerConfigured, planFromPriceId } from "@/lib/stripe/server";
import type { PlanType } from "@/lib/types";

/**
 * LA VUELTA DE STRIPE — el puente entre el cobro y la cuenta.
 *
 * Stripe devuelve aquí con su identificador de sesión. Esta página lo canjea
 * DEL LADO DEL SERVIDOR por dos datos —qué plan se compró y con qué correo—
 * y se los pasa a una pantalla mínima que los anota y sigue al registro.
 *
 * ── Por qué el correo no viaja por la URL ──
 *
 * Podría venir en el `success_url` y sería más simple. No se hace: una URL
 * queda en el historial del navegador, en el portapapeles de quien la copia
 * y en los registros de cualquier proxy por el que pase. Con este público
 * eso es un riesgo real, y es regla dura del proyecto. Lo que viaja es el
 * identificador de sesión de Stripe, que es opaco y sólo sirve canjeado
 * contra la clave secreta, que vive en el servidor.
 *
 * ── Por qué hay una pantalla y no un `redirect` seco ──
 *
 * El pago pendiente vive en `localStorage`, que es del navegador: el
 * servidor no puede escribirlo. Así que hace falta un instante de cliente
 * para anotarlo antes de seguir. Ese instante se aprovecha para decir que el
 * pago salió bien, que es justo lo que la persona quiere leer.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.pagoConfirmado.title };
}

/** Lo que se pudo averiguar del cobro. */
type Cobro = { plan: PlanType; email: string | null };

/**
 * Canjea el identificador de sesión por el plan y el correo.
 *
 * Devuelve `null` si la sesión no existe o no está pagada. Un `null`
 * explícito obliga a la página a decidir, en vez de dejar pasar a alguien
 * que llegó a esta URL a mano y activarle una membresía que nadie compró.
 */
async function cobroDeStripe(sessionId: string): Promise<Cobro | null> {
  try {
    const stripe = getStripe();
    const sesion = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
    if (sesion.payment_status !== "paid" && sesion.status !== "complete") return null;

    const precio = sesion.line_items?.data[0]?.price?.id ?? null;
    const plan = planFromPriceId(precio);
    if (!plan) return null;

    return { plan, email: sesion.customer_details?.email ?? null };
  } catch {
    return null;
  }
}

export default async function PagoConfirmadoPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; demo?: string; plan?: string | string[] }>;
}) {
  const [lang, params] = await Promise.all([getLang(), searchParams]);
  const dict = getDictionary(lang);

  let cobro: Cobro | null = null;

  if (params.session_id && isStripeServerConfigured()) {
    cobro = await cobroDeStripe(params.session_id);
  } else if (params.demo === "1" && !isStripeServerConfigured()) {
    /* Modo demo: no hay pasarela que canjear. Sólo se acepta cuando Stripe
       NO está configurado — si lo está, este atajo sería una forma de
       activar una membresía sin pagar escribiendo una URL. */
    cobro = { plan: parsePlan(params.plan), email: null };
  }

  // Sin cobro comprobable no se anota nada: de vuelta a elegir plan.
  if (!cobro) redirect(ROUTES.pago);

  return (
    <ConfirmadoScreen
      copy={dict.pagoConfirmado}
      plan={cobro.plan}
      email={cobro.email}
      destino={ROUTES.registro}
    />
  );
}
