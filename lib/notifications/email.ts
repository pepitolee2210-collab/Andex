/**
 * Correos transaccionales — STUBS con la interfaz definitiva.
 * v1 no integra proveedor (pendiente: Resend/SES + scheduler, ver
 * docs/DECISIONES.md). Los flujos llaman a estas funciones para que el
 * cableado quede listo; hoy solo registran en consola del servidor.
 *
 * Exigidos por el PRD:
 *  - §3.4.6: aviso 48 h antes de cada renovación, con enlace a cancelar.
 *  - §3.4.6: recibo tras cada cobro (Stripe puede enviarlo nativo).
 *  - §3.4.7: recuperación de checkout abandonado a las 24 h (UNO solo).
 *  - §3.2.3: aviso "¿Ya llegaste?" en fecha estimada de viaje + 3 días.
 */

type EmailJob =
  | { kind: "renewal_reminder"; to: string; renewsAt: string; cancelUrl: string }
  | { kind: "receipt"; to: string; amountUsd: number; plan: "monthly" | "annual" }
  | { kind: "checkout_recovery"; to: string; paywallUrl: string }
  | { kind: "arrival_checkin"; to: string; panelUrl: string };

export async function enqueueEmail(job: EmailJob): Promise<void> {
  // TODO(integración): proveedor de email + cola/cron. Ver docs/DECISIONES.md.
  console.info("[email:stub]", job.kind, "→", job.to);
}
