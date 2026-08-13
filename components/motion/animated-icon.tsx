"use client";

/**
 * ICONO ANIMADO — el puente entre lucide-animated y un teléfono.
 *
 * ── El problema ──
 *
 * Los iconos de lucide-animated se animan con `onMouseEnter`. En un
 * teléfono no hay `mouseenter`: el icono se queda quieto para siempre. Y
 * donde sí lo hay a medias —iOS simula hover al tocar— es peor, porque el
 * estado se queda PEGADO hasta que tocas otra cosa.
 *
 * O sea: tal como vienen, en el sitio donde se va a usar este producto no
 * funcionan.
 *
 * ── La salida ──
 *
 * Cada icono expone un mando por `ref` (`startAnimation`/`stopAnimation`),
 * y en cuanto se le pasa una `ref` deja de escuchar al ratón. Este
 * envoltorio toma ese mando y lo conecta a los disparadores que SÍ existen
 * en un móvil:
 *
 *   `tap`     al tocarlo — el sustituto directo del hover
 *   `appear`  cuando entra en pantalla, una sola vez
 *   `state`   cuando cambia un valor: el icono es el que AVISA del cambio
 *   `loop`    en bucle, para algo que está ocurriendo ahora
 *
 * `state` es el que de verdad importa y el que ningún hover puede dar:
 * guardas un documento y el escudo de la Bóveda se anima **porque acaba de
 * pasar algo**, no porque alguien pase el dedo por encima.
 *
 * Y si el sistema pide menos movimiento, no se anima nada.
 */

import {
  useCallback,
  useEffect,
  useRef,
  type ComponentType,
  type Ref,
} from "react";

/** El mando que expone cualquier icono del registro. */
export type IconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

/** La forma de todo icono de lucide-animated. */
export type AnimatedIconComponent = ComponentType<{
  ref?: Ref<IconHandle>;
  size?: number;
  className?: string;
}>;

export type AnimatedIconProps = {
  icon: AnimatedIconComponent;
  size?: number;
  className?: string;
  /**
   * Qué lo dispara.
   * @default "tap"
   */
  trigger?: "tap" | "appear" | "state" | "loop";
  /** Con `trigger="state"`: se anima cada vez que esto cambia. */
  watch?: unknown;
  /** Con `trigger="loop"`: cada cuánto se repite, en ms. */
  every?: number;
  /** El icono decora; el nombre lo pone quien lo envuelve. */
  label?: string;
};

const quiereQuieto = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function AnimatedIcon({
  icon: Icon,
  size = 28,
  className,
  trigger = "tap",
  watch,
  every = 4000,
  label,
}: AnimatedIconProps) {
  const mando = useRef<IconHandle>(null);
  const caja = useRef<HTMLSpanElement>(null);
  // La primera pasada de `watch` es el montaje, no un cambio. Sin esto,
  // toda la pantalla se animaría de golpe al abrir.
  const primeraVez = useRef(true);

  const animar = useCallback(() => {
    if (quiereQuieto()) return;
    mando.current?.startAnimation();
  }, []);

  // ── Al tocar ──
  // `pointerdown` y no `click`: se anima cuando el dedo baja, no cuando se
  // levanta. Es lo que hace que se sienta inmediato.
  const alTocar = useCallback(() => {
    if (trigger === "tap") animar();
  }, [trigger, animar]);

  // ── Al aparecer ──
  useEffect(() => {
    if (trigger !== "appear" || !caja.current) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        animar();
        observador.disconnect();
      },
      { threshold: 0.5 },
    );
    observador.observe(caja.current);
    return () => observador.disconnect();
  }, [trigger, animar]);

  // ── Cuando cambia el estado ──
  useEffect(() => {
    if (trigger !== "state") return;
    if (primeraVez.current) { primeraVez.current = false; return; }
    animar();
  }, [trigger, watch, animar]);

  // ── En bucle ──
  useEffect(() => {
    if (trigger !== "loop" || quiereQuieto()) return;
    animar();
    const reloj = window.setInterval(animar, every);
    return () => window.clearInterval(reloj);
  }, [trigger, every, animar]);

  return (
    <span
      ref={caja}
      onPointerDown={alTocar}
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
      role={label ? "img" : undefined}
      className={className}
      style={{ display: "inline-flex" }}
    >
      <Icon ref={mando} size={size} />
    </span>
  );
}
