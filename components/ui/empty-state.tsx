import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * EmptyState (§2.5) — icono + título + descripción + acción opcional.
 * Un vacío es una invitación a actuar: el consumidor pasa la acción.
 * Todo el texto llega por props (los componentes no importan lib/i18n).
 */

export type EmptyStateProps = {
  /** Icono lucide (el consumidor lo instancia, p. ej. <Inbox />). */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Acción opcional, normalmente un <Button>. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface-alt text-muted [&>svg]:size-7"
        >
          {icon}
        </div>
      ) : null}
      <h3 className="font-heading text-h3 text-ink">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-body text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
