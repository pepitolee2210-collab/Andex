"use client";

/**
 * LOS TRES BENEFICIOS DE LA PORTADA — acordeón que se turna solo.
 *
 * ── Por qué desplegable ──
 *
 * Los tres puntos con su explicación medían 340px de la primera pantalla y
 * empujaban el mockup fuera de vista. Plegados miden 150 y dicen lo mismo:
 * el título de cada uno ya es la promesa entera; la explicación es para
 * quien quiera comprobarla.
 *
 * ── Por qué se turnan solos ──
 *
 * Un acordeón cerrado del todo es un acordeón que nadie abre. Turnándose
 * cada diez segundos, los tres se leen sin que haya que tocar nada, y quien
 * quiera detenerse en uno lo toca y se queda.
 *
 * ── Y por qué eso NO es una animación suelta ──
 *
 * Contenido que cambia solo, sin avisar, se lee como un fallo. Tres cosas lo
 * evitan:
 *
 *  · **La barra de tiempo.** Bajo el abierto corre un filete teal de diez
 *    segundos. No decora: dice que esto se va a mover y cuánto falta, así
 *    que el cambio se anticipa en vez de sorprender.
 *  · **Tocar manda.** En cuanto alguien abre uno a mano, el turno se para
 *    para siempre. Pasar el ratón o entrar con el tabulador lo pausa
 *    mientras dure. Es lo que exige WCAG 2.2.2 para contenido que se mueve
 *    solo más de cinco segundos, y además es de sentido común: nadie quiere
 *    que se le cierre lo que está leyendo.
 *  · **Con `prefers-reduced-motion` no se turna.** Queda el primero abierto
 *    y los tres se abren a mano. Sin movimiento no se pierde nada.
 *
 * Y si la pestaña se va al fondo, el turno se detiene: no tiene sentido
 * gastar los diez segundos con nadie mirando.
 *
 * ── Accesibilidad (patrón WAI-ARIA Accordion), igual que en la FAQ ──
 *
 *  · cada título es un `<button aria-expanded aria-controls>` dentro de un
 *    `<h3>`, así se anuncia como encabezado Y como control;
 *  · el cuerpo es una región con `id` y `aria-labelledby`;
 *  · ↑ ↓ Inicio Fin saltan entre los tres sin salir del bloque.
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Misma curva que el resto del sistema de movimiento. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Lo que dura cada beneficio abierto antes de pasar el turno. */
export const TURNO_MS = 10_000;

export type HeroBenefit = {
  title: string;
  body: string;
};

export type HeroBenefitsProps = {
  items: readonly HeroBenefit[];
  className?: string;
};

export function HeroBenefits({ items, className }: HeroBenefitsProps) {
  const reduced = useReducedMotion();
  const uid = useId();
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const [abierto, setAbierto] = useState(0);
  /** Alguien tomó el control: el turno no vuelve. */
  const [manual, setManual] = useState(false);
  /** Pausa temporal: ratón encima, foco dentro o pestaña al fondo. */
  const [pausado, setPausado] = useState(false);

  const auto = !reduced && !manual && !pausado;

  // ── El turno ─────────────────────────────────────────────
  useEffect(() => {
    if (!auto) return;
    const t = window.setTimeout(
      () => setAbierto((i) => (i + 1) % items.length),
      TURNO_MS,
    );
    return () => window.clearTimeout(t);
  }, [auto, abierto, items.length]);

  // ── Sin nadie mirando, no corre ──────────────────────────
  useEffect(() => {
    const alCambiar = () => setPausado(document.hidden);
    document.addEventListener("visibilitychange", alCambiar);
    return () => document.removeEventListener("visibilitychange", alCambiar);
  }, []);

  const abrir = useCallback((i: number) => {
    // Tocar manda: el turno se detiene y no vuelve solo.
    setManual(true);
    setAbierto((actual) => (actual === i ? -1 : i));
  }, []);

  function alTeclear(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const ultimo = items.length - 1;
    let siguiente: number | null = null;

    if (event.key === "ArrowDown") siguiente = index === ultimo ? 0 : index + 1;
    else if (event.key === "ArrowUp") siguiente = index === 0 ? ultimo : index - 1;
    else if (event.key === "Home") siguiente = 0;
    else if (event.key === "End") siguiente = ultimo;

    if (siguiente === null) return;
    event.preventDefault();
    buttonsRef.current[siguiente]?.focus();
  }

  return (
    <ul
      className={cn(
        "flex flex-col overflow-hidden rounded-xl px-4",
        "bg-[color:var(--surface-on-invert)]",
        "ring-1 ring-[color:var(--hairline-on-invert-soft)]",
        className,
      )}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={(event) => {
        // Sólo se reanuda si el foco salió del bloque entero.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPausado(false);
        }
      }}
    >
      {items.map((item, index) => {
        const activo = abierto === index;
        const botonId = `${uid}-b-${index}`;
        const panelId = `${uid}-p-${index}`;

        return (
          <li
            key={item.title}
            className="border-t border-[color:var(--hairline-on-invert-soft)] first:border-t-0"
          >
            <h3>
              <button
                ref={(node) => {
                  buttonsRef.current[index] = node;
                }}
                id={botonId}
                type="button"
                aria-expanded={activo}
                aria-controls={panelId}
                onClick={() => abrir(index)}
                onKeyDown={(event) => alTeclear(event, index)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 py-3.5 text-left",
                  "transition-opacity duration-200",
                  activo ? "opacity-100" : "opacity-70 hover:opacity-100",
                )}
              >
                {/* El visto se enciende con el turno: en reposo es un disco
                    apagado, abierto se llena de teal. Es la señal más barata
                    de cuál está sonando. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full",
                    "transition-colors duration-300",
                    activo
                      ? "bg-[color:var(--text-on-invert-accent)]"
                      : "bg-[color:var(--hairline-on-invert)]",
                  )}
                >
                  <Check
                    className={cn(
                      "size-3.5 transition-colors duration-300",
                      activo
                        ? "text-[color:var(--navy-900)]"
                        : "text-[color:var(--text-on-invert-quiet)]",
                    )}
                    strokeWidth={3}
                  />
                </span>

                <span className="min-w-0 flex-1 text-body font-semibold leading-[1.35] text-[color:var(--text-on-invert)]">
                  {item.title}
                </span>

                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: activo ? 180 : 0 }}
                  transition={{ duration: reduced ? 0 : 0.3, ease: EASE }}
                  className="shrink-0 text-[color:var(--text-on-invert-quiet)]"
                >
                  <ChevronDown className="size-5" />
                </motion.span>
              </button>
            </h3>

            {/* La región vive SIEMPRE en el DOM para que el `aria-controls`
                del botón apunte a algo real; lo que entra y sale es su
                contenido. Desmontar el texto —en vez de esconderlo con
                altura 0— es lo correcto: dentro de un contenedor colapsado
                seguiría siendo legible para el lector de pantalla y
                enfocable con Tab. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={botonId}
              className="overflow-hidden"
            >
              <AnimatePresence initial={false}>
                {activo ? (
                  <motion.div
                    key="panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.36, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="pb-4 pl-9 pr-1 text-body leading-[1.55] text-[color:var(--text-on-invert-quiet)]">
                      {item.body}
                    </p>

                    {/* La barra de tiempo. Sólo mientras el turno corre: si
                        alguien tomó el control, contar segundos que no van a
                        pasar sería mentir. */}
                    {auto ? (
                      <span
                        aria-hidden="true"
                        className="mb-3.5 ml-9 block h-0.5 max-w-40 overflow-hidden rounded-full bg-[color:var(--hairline-on-invert)]"
                      >
                        <span
                          key={abierto}
                          className="hero-turno block h-full w-full rounded-full bg-[color:var(--text-on-invert-accent)]"
                        />
                      </span>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
