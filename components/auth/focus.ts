/**
 * Foco al primer campo con error tras enviar (§9).
 *
 * Se resuelve por `id` en vez de por `ref` porque `components/ui/input.tsx`
 * (propiedad del agente de Diseño) no reenvía refs y no se puede modificar.
 * Los ids son explícitos y estables en cada formulario.
 */
export function focusField(id: string): void {
  if (typeof document === "undefined") return;
  const element = document.getElementById(id);
  if (element instanceof HTMLElement) element.focus();
}
