"use client";

/**
 * Las dos cifras vivas de la tarjeta anual (§3.4.4).
 *
 * Viven en su propio archivo cliente a propósito: `section-pricing.tsx`
 * sigue siendo Server Component y solo estos dos trozos —un contador y un
 * rebote— viajan como JavaScript al navegador. Todo el resto de la sección
 * comercial se sirve como HTML.
 *
 * ── Por qué anime.js y no CSS
 * Un contador no es una transición de estilo: hay que interpolar un NÚMERO
 * y volver a formatearlo en cada fotograma. anime.js hace exactamente eso
 * sobre un objeto plano, y entra por `import()` diferido —igual que GSAP en
 * `components/motion/smooth-scroll.tsx`—, así que no pesa en el chunk
 * inicial de la landing y ni siquiera se descarga si el visitante nunca
 * llega a precios.
 *
 * ── Lo que NO es esto (§3.4.1 / §3.4.6)
 * No es un contador de urgencia, ni un cupo, ni un descuento que expira.
 * Es la misma cifra de siempre entrando en escena una vez. El precio final
 * ya está en el HTML servido: sin JavaScript se lee igual, y el número que
 * queda al terminar es literalmente la cadena que llegó por props.
 *
 * ── Accesibilidad
 * El nodo que se anima va `aria-hidden` y al lado viaja el precio completo
 * en un `sr-only`: un lector de pantalla nunca oye "$37 al año" a mitad de
 * la cuenta. Con `prefers-reduced-motion` no se anima nada — ni el número
 * ni el rebote— y las cifras se pintan quietas y completas (§2.5).
 */

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Precio ya formateado por el diccionario: "$140 / año", "$14 / mes". */
type ParsedPrice = {
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
};

/**
 * Aísla el primer número de una cadena ya compuesta. El componente jamás
 * formatea moneda por su cuenta (eso es de `formatUsd`): reconstruye la
 * MISMA cadena con el número interpolado en medio.
 */
function parsePrice(value: string): ParsedPrice | null {
  const match = /\d[\d,]*(?:\.\d+)?/.exec(value);
  if (!match) return null;

  const raw = match[0];
  const target = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(target)) return null;

  const dot = raw.indexOf(".");
  return {
    prefix: value.slice(0, match.index),
    suffix: value.slice(match.index + raw.length),
    target,
    decimals: dot === -1 ? 0 : raw.length - dot - 1,
  };
}

/**
 * Espera a que el elemento entre en pantalla y ejecuta `run` una sola vez.
 * Devuelve la función de limpieza del observador.
 */
function onceInView(node: Element, run: () => void, threshold: number): () => void {
  // Navegador sin IntersectionObserver: se ejecuta ya. Nunca se deja una
  // cifra a medias esperando un evento que no va a llegar.
  if (typeof IntersectionObserver === "undefined") {
    run();
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      run();
    },
    { threshold },
  );
  observer.observe(node);
  return () => observer.disconnect();
}

export type AnimatedPriceProps = {
  /** Cadena final, p. ej. "$140 / año". */
  value: string;
  className?: string;
};

export function AnimatedPrice({ value, className }: AnimatedPriceProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;

    const parsed = parsePrice(value);
    if (!parsed) return;

    const render = (n: number) =>
      `${parsed.prefix}${n.toLocaleString("en-US", {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })}${parsed.suffix}`;

    // Se pone a cero ANTES de que la cifra entre en pantalla: la cuenta
    // empieza desde el principio y nunca se ve el salto 140 → 0.
    node.textContent = render(0);

    let cancelled = false;
    let stop: (() => void) | undefined;

    const disconnect = onceInView(
      node,
      () => {
        void (async () => {
          try {
            const { animate } = await import("animejs");
            if (cancelled) return;

            const state = { n: 0 };
            const animation = animate(state, {
              n: parsed.target,
              duration: 1100,
              ease: "outExpo",
              onUpdate: () => {
                node.textContent = render(state.n);
              },
              // El estado final es la cadena original, sin reformatear:
              // lo que se ve al terminar es exactamente lo que dice el copy.
              onComplete: () => {
                node.textContent = value;
              },
            });
            stop = () => animation.pause();
          } catch {
            // Si el chunk de anime.js no llega, el precio vuelve entero.
            // Un "$0" por una animación fallida sería mucho peor que no
            // animar nada.
            node.textContent = value;
          }
        })();
      },
      0.4,
    );

    return () => {
      cancelled = true;
      disconnect();
      stop?.();
      node.textContent = value;
    };
  }, [value, reduced]);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span
        ref={ref}
        aria-hidden="true"
        className={cn("tabular-nums", className)}
      >
        {value}
      </span>
    </>
  );
}

export type SavingsBadgeProps = {
  /** "Ahorras $28 al año" — resta verdadera, no rebaja inventada. */
  children: string;
};

export function SavingsBadge({ children }: SavingsBadgeProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;

    let cancelled = false;
    let stop: (() => void) | undefined;

    const disconnect = onceInView(
      node,
      () => {
        void (async () => {
          try {
            const { animate } = await import("animejs");
            if (cancelled) return;

            const animation = animate(node, {
              scale: [0.94, 1.06, 1],
              duration: 620,
              // Aterriza cuando el contador ya casi ha llegado: primero el
              // precio, después lo que te ahorras. Ese es el orden de lectura.
              delay: 820,
              ease: "outBack",
            });
            stop = () => animation.pause();
          } catch {
            /* sin anime.js el badge se queda quieto y legible: no pasa nada */
          }
        })();
      },
      0.6,
    );

    return () => {
      cancelled = true;
      disconnect();
      stop?.();
    };
  }, [reduced]);

  return (
    <span ref={ref} className="inline-block will-change-transform">
      <Badge variant="teal">{children}</Badge>
    </span>
  );
}
