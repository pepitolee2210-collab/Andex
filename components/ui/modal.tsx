"use client";

import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Modal (§2.5) sobre <dialog> nativo — variantes default y
 * fullscreen-mobile (pantalla completa <640px, centrado radius-xl §2.3
 * en desktop).
 *
 * showModal() da gratis: focus trap real, cierre con Escape, inert del
 * fondo y devolución de foco al invocador. Se añade: cierre por clic en
 * backdrop, scroll interno del cuerpo, aria-labelledby al título y
 * bloqueo del scroll de fondo.
 */

export type ModalProps = {
  open: boolean;
  /** Se llama SIEMPRE que el diálogo se cierra (Escape, backdrop, X). */
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Zona de acciones fija al pie (normalmente <Button>s). */
  footer?: ReactNode;
  variant?: "default" | "fullscreen-mobile";
  /** aria-label del botón de cierre. Default: "Cerrar". */
  closeLabel?: string;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  variant = "default",
  closeLabel = "Cerrar",
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Bloquea el scroll del documento mientras el modal está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    // El panel interno cubre todo el dialog: si el target es el propio
    // <dialog>, el clic cayó en el ::backdrop.
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  }

  const fullscreen = variant === "fullscreen-mobile";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleBackdropClick}
      className={cn(
        "bg-surface text-ink shadow-lg backdrop:bg-navy/60",
        "w-full p-0",
        fullscreen
          ? // Mobile-first: pantalla completa; desde sm, centrado con radius-xl.
            "m-0 h-dvh max-h-none max-w-none rounded-none sm:m-auto sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:w-[calc(100%-3rem)] sm:max-w-lg sm:rounded-xl"
          : "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg rounded-xl",
        className,
      )}
    >
      <div className={cn("flex flex-col", fullscreen ? "h-full sm:h-auto sm:max-h-[calc(100dvh-3rem)]" : "max-h-[calc(100dvh-2rem)]")}>
        <header className="flex items-start justify-between gap-4 px-6 pb-3 pt-5">
          <h2 id={titleId} className="font-heading text-h3 text-ink">
            {title}
          </h2>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => dialogRef.current?.close()}
            className="-mr-2.5 -mt-1.5 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        {/* Cuerpo con scroll interno */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 text-body">
          {children}
        </div>

        {footer ? (
          <footer className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
