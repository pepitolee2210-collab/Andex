"use client";

/**
 * S0 · BANDA SUPERIOR — el primer píxel de la página.
 *
 * Qué dice y qué NO dice (§3.4.1, y las correcciones 3 y 6 de
 * `dictionaries/landing.ts`): promete la **tarifa congelada** del miembro
 * fundador y nada más. Aquí NO hay cuenta atrás, ni "quedan X plazas", ni
 * descuento que expira. No es una omisión estética: esta audiencia ya fue
 * exprimida por gestores con urgencia inventada, y el propio copy de
 * precios promete "sin contadores, sin cupos falsos, sin descuentos que
 * expiran". Una banda con reloj contradiría la promesa dos pantallas más
 * abajo y se llevaría por delante la confianza de toda la página.
 *
 * El acento ámbar entra como BADGE (fondo ámbar + texto navy vía
 * `text-on-highlight`, 8.2:1 ✓), nunca como color de texto: §2.1.1 declara
 * el ámbar color de superficie. Es la única aparición del ámbar en el
 * chrome de la landing.
 *
 * Cierre persistente por SESIÓN, no por año: si alguien vuelve mañana, la
 * oferta de fundador vuelve a verse una vez. `localStorage` la enterraría
 * para siempre; una cookie viajaría en cada request para nada.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Clave de `sessionStorage`. Vive aquí y no en `SESSION_KEYS` de
 * `@/lib/config` porque ese archivo es de Sesión 0 (no se toca). Si el
 * orquestador quiere centralizarla, es un movimiento de una línea.
 */
const BANNER_DISMISSED_KEY = "andex_banner_dismissed";

/** Misma curva que `components/motion/reveal.tsx`: una sola gramática. */
const EASE = [0.22, 1, 0.36, 1] as const;

export type TopBannerProps = {
  /** `dict.landing.banner.text` */
  text: string;
  /** `dict.landing.banner.cta` */
  ctaLabel: string;
  /** Destino del CTA. Default: la sección de precios (donde vive la tarifa congelada). */
  ctaHref?: string;
  /** aria-label del botón de cierre. Sugerido: `dict.common.actions.close`. */
  closeLabel: string;
  className?: string;
};

export function TopBanner({
  text,
  ctaLabel,
  ctaHref = "#precios",
  closeLabel,
  className,
}: TopBannerProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(true);
  /**
   * El servidor no puede leer `sessionStorage`, así que la banda se sirve
   * SIEMPRE visible (HTML completo, funciona sin JavaScript) y se retira al
   * montar si ya estaba cerrada. `animated` distingue los dos casos: al
   * restaurar el cierre desaparece sin transición (no es una acción del
   * usuario ahora mismo); al pulsar la ✕ sí colapsa con animación.
   */
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(BANNER_DISMISSED_KEY) === "1";
    } catch {
      /* modo privado o storage bloqueado: la banda simplemente se queda */
    }
    if (dismissed) {
      setOpen(false);
      return;
    }
    setAnimated(true);
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      window.sessionStorage.setItem(BANNER_DISMISSED_KEY, "1");
    } catch {
      /* sin storage el cierre dura lo que dure la página; nada se rompe */
    }
  }

  const duration = animated && !reduced ? 0.35 : 0;

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="andex-top-banner"
          initial={false}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration, ease: EASE }}
          className={cn("relative overflow-hidden bg-navy", className)}
        >
          {/* pr-14: deja libre la esquina donde vive la ✕ absoluta, para que
              el texto nunca pase por debajo del botón a 320px. */}
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-1 pr-14 text-center sm:pr-16">
            {/* text-label (14px): la banda es una tira de anuncio del
                sistema, no cuerpo de texto. A 16px ocupa cinco líneas en un
                teléfono de 320px y se come el pliegue entero. */}
            <p className="text-label text-white/85">{text}</p>

            <a
              href={ctaHref}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full bg-amber px-4",
                "text-label font-semibold text-on-highlight",
                "transition-[filter] duration-150 hover:brightness-95 active:brightness-90",
              )}
            >
              {ctaLabel}
            </a>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label={closeLabel}
            title={closeLabel}
            className={cn(
              "absolute right-1 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center",
              "rounded-md text-white/70 transition-colors duration-150",
              "hover:bg-white/10 hover:text-white",
            )}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
