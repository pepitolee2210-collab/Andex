"use client";

/**
 * LA RUEDA DE MÓDULOS — el redoble antes del detalle.
 *
 * Los siete frentes de ANDEX pasando en bucle, con el que está en el punto
 * de mira nítido y grande, y el resto desenfocándose a medida que se alejan.
 * Va entre "por qué existe ANDEX" y la parrilla de módulos: después del
 * argumento emocional, la rueda los nombra; después, la parrilla los explica.
 *
 * ── Decisiones ─────────────────────────────────────────────────────────
 *
 * · **Fondo navy, no negro puro.** El encargo pedía #000000, pero en esta
 *   misma página ya hay dos bloques oscuros (servicios y cierre) en navy.
 *   Un tercer negro distinto se lee como un error de sistema, no como una
 *   decisión. El navy es el oscuro de la marca y aquí hace el mismo trabajo.
 *
 * · **No es decoración: es navegación.** Cada palabra es un enlace real a su
 *   módulo. Un carrusel hipnótico que no lleva a ninguna parte es un efecto;
 *   uno que te deja donde quieres ir es un componente.
 *
 * · **Accesible de verdad.** Para un lector de pantalla esto es una lista de
 *   siete enlaces, sin bucles ni copias. Todo el aparato visual —los
 *   duplicados que hacen el bucle infinito, el desenfoque, la escala— va
 *   `aria-hidden`. Con `prefers-reduced-motion` no gira sola, no desenfoca
 *   nada y se comporta como una lista normal con scroll.
 *
 * · **El desenfoque está acotado a 3px** y solo se aplica a lo que está en
 *   pantalla: `filter: blur()` es caro y el público objetivo usa Android de
 *   gama baja.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type WheelItem = {
  /** Nombre corto que se ve girando. */
  label: string;
  href: string;
};

export type ModuleWheelProps = {
  eyebrow: string;
  title: string;
  /** Texto solo para lectores de pantalla que explica qué es la lista. */
  listLabel: string;
  items: readonly WheelItem[];
  id?: string;
  className?: string;
};

/** Copias de la lista. Tres permiten saltar por el centro sin que se note. */
const COPIES = 3;

/**
 * Velocidad de crucero en **píxeles por segundo**, no por fotograma.
 * Atarla al fotograma haría que corriese al doble en una pantalla de 120 Hz
 * y a tirones en un móvil lento. Con tiempo real el ritmo es idéntico en
 * cualquier dispositivo, que es de lo que depende que se vea elegante.
 * A 31 px/s cada palabra tarda algo menos de dos segundos y medio en cruzar
 * el punto de lectura: se lee entera sin que la rueda parezca lenta.
 */
const AUTOPLAY_PX_PER_SEC = 31;

/**
 * Cuánta velocidad extra conserva cada segundo tras soltar el arrastre.
 * La rueda NUNCA se detiene: el impulso del gesto decae hacia la velocidad
 * de crucero, no hacia cero. Por eso no hay pausa ni imantado — tocarla la
 * empuja, no la para.
 */
const DECAY_PER_SEC = 0.02;

export function ModuleWheel({
  eyebrow,
  title,
  listLabel,
  items,
  id = "frentes",
  className,
}: ModuleWheelProps) {
  const reduced = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Refs en vez de estado: esto corre en cada fotograma y un `setState`
  // por frame provocaría un re-render por frame.
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);
  const loopHeight = useRef(0);
  /**
   * Posición en coma flotante. `scrollTop` redondea a entero y el avance por
   * fotograma es de décimas de píxel: sin este acumulador la rueda se
   * quedaría clavada.
   */
  const offset = useRef(0);
  /** Velocidad actual en px/ms. Arranca ya en la de crucero. */
  const velocity = useRef(AUTOPLAY_PX_PER_SEC / 1000);
  const lastMoveY = useRef(0);
  const lastMoveT = useRef(0);

  const list = Array.from({ length: COPIES }, () => items).flat();

  /**
   * Aplica escala, opacidad y desenfoque según la distancia al punto de mira.
   *
   * `instant` corta las transiciones durante un fotograma. Es imprescindible
   * en el salto de copia del bucle: ahí cada palabra cambia de distancia al
   * centro de golpe y, con la transición viva, las 21 se pondrían a animar
   * ese salto durante 400 ms. Eso es exactamente el frenazo que se veía al
   * pasar de "Negocios" a "Empleo".
   */
  const paint = useCallback((instant = false) => {
    const rail = railRef.current;
    if (!rail) return;

    if (instant) rail.dataset.jumping = "true";
    const mid = rail.clientHeight / 2;
    let nearest = { dist: Infinity, index: 0 };

    for (const node of Array.from(rail.children) as HTMLElement[]) {
      const center = node.offsetTop - rail.scrollTop + node.offsetHeight / 2;
      const dist = Math.abs(center - mid);

      // Fuera de pantalla no se pinta: ahorra trabajo de composición.
      if (center < -160 || center > rail.clientHeight + 160) {
        node.style.opacity = "0";
        continue;
      }

      const t = Math.min(dist / mid, 1); // 0 en el centro, 1 en el borde
      if (!reduced) {
        node.style.transform = `scale(${1.25 - t * 0.4})`;
        node.style.filter = `blur(${Math.min(t * 4, 3).toFixed(2)}px)`;
        node.style.opacity = String(1 - t * 0.62);
      } else {
        node.style.transform = "";
        node.style.filter = "";
        node.style.opacity = "1";
      }

      if (dist < nearest.dist) {
        nearest = { dist, index: Number(node.dataset.index ?? 0) };
      }
    }

    if (instant) {
      // Se fuerza el recálculo con las transiciones ya cortadas y solo
      // después se devuelven. Sin este reflow el navegador agruparía ambos
      // cambios y la transición seguiría animando el salto.
      void rail.offsetHeight;
      delete rail.dataset.jumping;
    }

    setActive(nearest.index);
  }, [reduced]);

  /**
   * Devuelve el scroll a la copia central cuando se acerca a un extremo.
   * Informa de cuánto ha saltado para que el acumulador se ajuste por
   * diferencia: sobrescribirlo con `rail.scrollTop` perdería los decimales,
   * y a 14 px/s cada fotograma avanza 0,2 px — el navegador los redondearía
   * y la rueda se quedaría clavada.
   */
  const wrap = useCallback((): number => {
    const rail = railRef.current;
    if (!rail || loopHeight.current === 0) return 0;
    const h = loopHeight.current;
    if (rail.scrollTop < h * 0.5) {
      rail.scrollTop += h;
      return h;
    }
    if (rail.scrollTop > h * 1.5) {
      rail.scrollTop -= h;
      return -h;
    }
    return 0;
  }, []);

  // Colocación inicial en la copia del medio
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const measure = () => {
      loopHeight.current = rail.scrollHeight / COPIES;
      rail.scrollTop = loopHeight.current;
      // El acumulador en coma flotante arranca donde está el carril: si se
      // quedara en 0, el primer fotograma daría un salto al principio.
      offset.current = rail.scrollTop;
      paint();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(rail);
    return () => ro.disconnect();
  }, [paint]);

  /**
   * Un único bucle para todo el movimiento.
   *
   * La idea que lo gobierna todo: **la rueda nunca se detiene.** No hay
   * estado de "parada", ni pausa tras interactuar, ni imantado. Solo hay una
   * velocidad que siempre tiende a la de crucero. Arrastrar la empuja o la
   * frena; en cuanto se suelta, ese impulso se disuelve y la rueda retoma su
   * paso. Tocarla forma parte del movimiento, no lo interrumpe.
   */
  useEffect(() => {
    if (reduced) return;
    const rail = railRef.current;
    if (!rail) return;

    const cruise = AUTOPLAY_PX_PER_SEC / 1000; // px/ms
    let raf = 0;
    let prev = performance.now();

    const tick = (now: number) => {
      // Se acota el delta: al volver de una pestaña en segundo plano el
      // salto sería de segundos y la rueda pegaría un tirón.
      const dt = Math.min(now - prev, 48);
      prev = now;

      if (!dragging.current) {
        // Una sola fórmula para la inercia y para el giro base: la velocidad
        // decae exponencialmente HACIA la de crucero, nunca hacia cero. Si
        // el gesto fue hacia atrás, la curva la trae de vuelta sola.
        velocity.current =
          cruise + (velocity.current - cruise) * Math.pow(DECAY_PER_SEC, dt / 1000);
        offset.current += velocity.current * dt;

        rail.scrollTop = offset.current;
        // El acumulador se ajusta por el salto de copia, nunca se sustituye
        // por `rail.scrollTop`: ahí se perderían los decimales del avance.
        const jump = wrap();
        offset.current += jump;
        // En el fotograma del salto se pinta sin transición, para que el
        // bucle sea invisible en vez de un frenazo de 400 ms.
        paint(jump !== 0);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, paint, wrap]);

  // ── Arrastre con ratón y con el dedo ──

  function onPointerDown(e: React.PointerEvent) {
    const rail = railRef.current;
    if (!rail) return;
    dragging.current = true;
    dragStartY.current = e.clientY;
    dragStartScroll.current = rail.scrollTop;
    lastMoveY.current = e.clientY;
    lastMoveT.current = performance.now();
    rail.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const rail = railRef.current;
    if (!rail) return;

    rail.scrollTop = dragStartScroll.current - (e.clientY - dragStartY.current);
    wrap();
    offset.current = rail.scrollTop;

    // Velocidad instantánea, suavizada: una media móvil evita que un
    // temblor del último milisegundo dispare la inercia.
    const now = performance.now();
    const dt = now - lastMoveT.current;
    if (dt > 0) {
      const v = -(e.clientY - lastMoveY.current) / dt;
      velocity.current = velocity.current * 0.7 + v * 0.3;
      lastMoveY.current = e.clientY;
      lastMoveT.current = now;
    }

    paint();
  }

  function endDrag(e: React.PointerEvent) {
    if (!dragging.current) return;
    dragging.current = false;
    railRef.current?.releasePointerCapture(e.pointerId);
    // Nada más que hacer: el bucle recoge la velocidad que dejó el gesto y
    // la disuelve hacia la de crucero. La rueda no se para nunca.
  }

  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={cn("relative overflow-hidden bg-navy px-4 py-16 sm:py-20", className)}
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-caption font-bold uppercase tracking-widest text-teal">
          {eyebrow}
        </p>
        <h2
          id={`${id}-titulo`}
          className="mt-2 max-w-2xl font-heading text-h1 text-white lg:text-display"
        >
          {title}
        </h2>

        <div className="relative mt-10">
          {/* Punto de mira. La flecha no es un adorno fijo: da un empujón y
              suelta un halo cada vez que una palabra nueva entra en el
              punto de lectura. Así el ojo sabe que ha pasado algo sin tener
              que comparar el texto. La `key` reinicia la animación en cada
              cambio, que es lo que la hace latir. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-1/2 z-20 flex -translate-y-1/2 items-center"
          >
            <motion.span
              key={active}
              initial={reduced ? false : { scale: 0.8, x: -6, opacity: 0.55 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
              className="relative flex items-center"
            >
              {/* Halo que se expande y se apaga: el pulso del latido */}
              {reduced ? null : (
                <motion.span
                  initial={{ scale: 0.4, opacity: 0.5 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="absolute left-1 size-6 rounded-full bg-teal sm:size-7"
                />
              )}
              <ArrowRight
                className="relative size-7 text-white sm:size-9"
                strokeWidth={1.5}
              />
            </motion.span>
          </div>

          {/* Desvanecidos arriba y abajo: la rueda se pierde en el fondo en
              vez de cortarse en seco contra el borde. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-navy to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-navy to-transparent"
          />

          {/* La rueda. Es puro aparato visual: los duplicados del bucle no
              deben leerse, así que va oculta a los lectores de pantalla y
              debajo se sirve la lista real. */}
          <div
            ref={railRef}
            aria-hidden="true"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onWheel={() => {
              // La rueda del ratón mueve el carril por su cuenta: basta con
              // resincronizar el acumulador. El giro sigue su curso desde la
              // nueva posición, sin pausas.
              const rail = railRef.current;
              if (!rail) return;
              offset.current = rail.scrollTop;
            }}
            className="scrollbar-none h-[19rem] cursor-grab touch-pan-y overflow-y-scroll pl-12 active:cursor-grabbing sm:h-[24rem] sm:pl-16"
          >
            {list.map((item, i) => (
              <div
                key={`${item.label}-${i}`}
                data-index={i % items.length}
                className="origin-left py-1 font-heading text-[2.25rem] font-bold leading-tight text-white transition-[transform,filter,opacity] duration-[400ms] [transition-timing-function:cubic-bezier(0.25,1,0.5,1)] sm:text-[3.25rem]"
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* La lista real: lo que existe para un lector de pantalla y lo que
            queda si el JavaScript no llega. El elemento en el punto de mira
            se resalta y es la vía rápida para entrar a ese módulo. */}
        <ul aria-label={listLabel} className="mt-8 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-body transition-colors duration-200",
                  i === active
                    ? "border-teal bg-teal-soft font-semibold text-white"
                    : "border-white/20 text-white/70 hover:border-teal hover:text-white",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
