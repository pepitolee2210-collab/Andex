/**
 * Cabecera de una pantalla de auth: antetítulo, título y bajada.
 * Todo el texto llega ya resuelto desde `lib/i18n` — este componente no
 * conoce ningún string.
 */

export type AuthHeadingProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export function AuthHeading({ eyebrow, title, subtitle }: AuthHeadingProps) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-caption font-semibold uppercase tracking-wider text-muted">
        {eyebrow}
      </p>
      <h1 className="font-heading text-h2 text-ink">{title}</h1>
      {subtitle ? <p className="mt-2 text-body text-muted">{subtitle}</p> : null}
    </div>
  );
}
