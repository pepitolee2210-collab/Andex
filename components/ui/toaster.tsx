"use client";

/**
 * Toast (§2.5) — variantes success / error / info, con icono.
 * Reemplaza al stub de Sesión 0 CONSERVANDO su API pública:
 *
 *   toast.success("...") · toast.error("...") · toast.info("...")
 *   <Toaster /> montado una sola vez en el layout raíz.
 *
 * - Cola con tope de 5 avisos visibles.
 * - aria-live="polite": los mensajes se anuncian sin interrumpir.
 * - Auto-dismiss a los 5 s, con pausa al hover y al foco.
 * - Animación sutil de entrada (keyframe andex-toast-in en globals.css;
 *   prefers-reduced-motion la anula por la regla global).
 */

import { useEffect, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info";

type ToastFn = (message: string) => void;

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

const AUTO_DISMISS_MS = 5000;
const MAX_VISIBLE = 5;

// ── Emisor a nivel de módulo (la API pública no cambia) ──
let nextId = 1;
const listeners = new Set<(item: ToastItem) => void>();
/** Toasts emitidos antes de que <Toaster /> monte. */
const pending: ToastItem[] = [];

function emit(kind: ToastKind, message: string) {
  const item: ToastItem = { id: nextId++, kind, message };
  if (listeners.size === 0) {
    pending.push(item);
    return;
  }
  listeners.forEach((fn) => fn(item));
}

export const toast: Record<ToastKind, ToastFn> = {
  success: (m) => emit("success", m),
  error: (m) => emit("error", m),
  info: (m) => emit("info", m),
};

// ── Presentación ─────────────────────────────────────────

const KIND_STYLES: Record<ToastKind, { bar: string; icon: string }> = {
  success: { bar: "border-l-success", icon: "text-success" },
  error: { bar: "border-l-danger", icon: "text-danger" },
  info: { bar: "border-l-info", icon: "text-info" },
};

function KindIcon({ kind }: { kind: ToastKind }) {
  const cls = cn("mt-0.5 size-5 shrink-0", KIND_STYLES[kind].icon);
  if (kind === "success") return <CircleCheck aria-hidden="true" className={cls} />;
  if (kind === "error") return <CircleAlert aria-hidden="true" className={cls} />;
  return <Info aria-hidden="true" className={cls} />;
}

type TimerState = { timeout: ReturnType<typeof setTimeout>; expiresAt: number };

export type ToasterProps = {
  /** aria-label de la región de avisos. Default: "Notificaciones". */
  regionLabel?: string;
  /** aria-label del botón de cierre de cada aviso. Default: "Cerrar aviso". */
  dismissLabel?: string;
};

export function Toaster({
  regionLabel = "Notificaciones",
  dismissLabel = "Cerrar aviso",
}: ToasterProps = {}) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, TimerState>());
  const remaining = useRef(new Map<number, number>());

  function dismiss(id: number) {
    const t = timers.current.get(id);
    if (t) clearTimeout(t.timeout);
    timers.current.delete(id);
    remaining.current.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function schedule(id: number, ms: number) {
    const timeout = setTimeout(() => dismiss(id), ms);
    timers.current.set(id, { timeout, expiresAt: Date.now() + ms });
  }

  function pause(id: number) {
    const t = timers.current.get(id);
    if (!t) return;
    clearTimeout(t.timeout);
    timers.current.delete(id);
    remaining.current.set(id, Math.max(1000, t.expiresAt - Date.now()));
  }

  function resume(id: number) {
    if (timers.current.has(id)) return;
    schedule(id, remaining.current.get(id) ?? AUTO_DISMISS_MS);
    remaining.current.delete(id);
  }

  useEffect(() => {
    const onToast = (item: ToastItem) => {
      setItems((prev) => {
        const next = [...prev, item];
        // Tope de cola: se descarta el más antiguo.
        const overflow = next.length - MAX_VISIBLE;
        if (overflow > 0) {
          next.slice(0, overflow).forEach((old) => {
            const t = timers.current.get(old.id);
            if (t) clearTimeout(t.timeout);
            timers.current.delete(old.id);
          });
          return next.slice(overflow);
        }
        return next;
      });
      schedule(item.id, AUTO_DISMISS_MS);
    };

    listeners.add(onToast);
    // Drena lo emitido antes del montaje.
    while (pending.length > 0) {
      const item = pending.shift();
      if (item) onToast(item);
    }
    const timerMap = timers.current;
    return () => {
      listeners.delete(onToast);
      timerMap.forEach((t) => clearTimeout(t.timeout));
      timerMap.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="region"
      aria-label={regionLabel}
      aria-live="polite"
      /* En móvil el aviso va ARRIBA. Abajo es territorio de acciones: la
         barra de pestañas del panel y los botones fijos de los formularios
         viven ahí, y un aviso a `bottom-4` se les pone encima. Como lleva
         `pointer-events-auto` —lo necesita para cerrarse y para pausar el
         temporizador— se comía el toque: en el paso 1 de la entrevista se
         pulsaba "Continuar" y no pasaba nada hasta que el aviso se iba.
         En pantalla ancha no hay conflicto y se queda abajo a la derecha. */
      className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:items-end"
    >
      {items.map((item) => (
        <div
          key={item.id}
          onMouseEnter={() => pause(item.id)}
          onMouseLeave={() => resume(item.id)}
          onFocus={() => pause(item.id)}
          onBlur={() => resume(item.id)}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-md border border-line border-l-4 bg-surface p-3.5 pr-2 shadow-lg",
            "animate-[andex-toast-in_0.25s_ease-out]",
            KIND_STYLES[item.kind].bar,
          )}
        >
          <KindIcon kind={item.kind} />
          <p className="min-w-0 flex-1 py-0.5 text-body text-ink">{item.message}</p>
          <button
            type="button"
            aria-label={dismissLabel}
            onClick={() => dismiss(item.id)}
            className="-my-1 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
