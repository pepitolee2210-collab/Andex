/**
 * Separador "o" entre la vía principal (contraseña) y la alternativa
 * (enlace por correo). Es una regla neutra: La Ruta (§2.8) NUNCA se usa como
 * divisor.
 */
export function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
      <span className="text-caption uppercase tracking-wide text-muted">{label}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </div>
  );
}
