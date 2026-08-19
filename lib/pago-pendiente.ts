import type { PlanType } from "@/lib/types";

/**
 * EL PAGO QUE YA OCURRIÓ Y TODAVÍA NO TIENE CUENTA.
 *
 * El embudo nuevo cobra ANTES de registrar: bienvenida → pago → cuenta →
 * comunidad. Eso deja una ventana en la que existe un cobro y no existe
 * ningún usuario al que atarlo, y esa ventana hay que sostenerla en algún
 * sitio o el dinero se pierde de vista.
 *
 * Aquí se sostiene. Es el equivalente en modo demo de lo que en producción
 * hace Stripe: la sesión de pago guarda el correo y la cadencia, y la cuenta
 * se crea después contra ese registro.
 *
 * ── Qué se guarda, y qué NO ──
 *
 * Sólo el plan, el correo (si la pasarela lo dio) y cuándo. Nada de tarjeta —ANDEX no la toca nunca,
 * es regla dura— y nada de estatus migratorio ni de las respuestas de la
 * entrevista. Si mañana alguien mira este `localStorage`, lo que encuentra es
 * lo mismo que hay en un recibo.
 *
 * ── Por qué caduca ──
 *
 * Un pago pendiente de hace tres semanas no es un pago pendiente: es basura
 * que va a activar una membresía a quien no la compró, en un navegador
 * compartido —y este público comparte teléfono y biblioteca pública más de lo
 * que se suele suponer—. Veinticuatro horas es de sobra para volver del
 * correo y terminar el registro.
 */

const CLAVE = "andex_pago_pendiente";

/** Lo que se conserva entre el cobro y la creación de la cuenta. */
export type PagoPendiente = {
  plan: PlanType;
  /**
   * El correo que recogió la pasarela, si lo hubo.
   *
   * Puede faltar. Desde que el cobro entero ocurre en la caja alojada de
   * Stripe, el correo se lee del lado del servidor al volver — y en modo
   * demo no hay pasarela que lo recoja, así que no hay ninguno. Cuando
   * viene, el registro lo precarga para que la cuenta se cree con el mismo
   * correo que pagó, que es lo que la pantalla de pago prometió.
   */
  email: string | null;
  /** Marca de tiempo del cobro, en milisegundos. */
  cobradoEn: number;
};

/** Veinticuatro horas. Ver el comentario de arriba. */
export const VIGENCIA_MS = 24 * 60 * 60 * 1000;

function hayAlmacen(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function esValido(valor: unknown): valor is PagoPendiente {
  if (typeof valor !== "object" || valor === null) return false;
  const r = valor as Record<string, unknown>;
  const plan = r.plan;
  return (
    (plan === "monthly" || plan === "annual") &&
    (r.email === null || typeof r.email === "string") &&
    typeof r.cobradoEn === "number" &&
    Number.isFinite(r.cobradoEn)
  );
}

/** Anota el cobro. Se llama justo después de que la pasarela confirme. */
export function guardarPagoPendiente(pago: PagoPendiente): void {
  if (!hayAlmacen()) return;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(pago));
  } catch {
    /* Almacenamiento bloqueado (modo privado, cuota). El registro seguirá
       funcionando: pedirá el correo a mano, que es el peor caso aceptable. */
  }
}

/**
 * El pago pendiente, si lo hay y sigue vigente. Un registro caducado se
 * borra al leerlo: dejarlo ahí sólo sirve para activar la membresía de otro.
 */
export function leerPagoPendiente(): PagoPendiente | null {
  if (!hayAlmacen()) return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const valor: unknown = JSON.parse(crudo);
    if (!esValido(valor)) {
      borrarPagoPendiente();
      return null;
    }
    if (Date.now() - valor.cobradoEn > VIGENCIA_MS) {
      borrarPagoPendiente();
      return null;
    }
    return valor;
  } catch {
    return null;
  }
}

/** Se llama en cuanto la cuenta existe y la membresía queda activada. */
export function borrarPagoPendiente(): void {
  if (!hayAlmacen()) return;
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    /* nada que hacer */
  }
}
