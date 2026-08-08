"use client";

/**
 * Primitivas de aparición al hacer scroll.
 *
 * Una sola gramática de movimiento para toda la landing, en vez de efectos
 * sueltos sección por sección: todo entra desde abajo, con la misma curva y
 * la misma distancia. Lo que cambia es el retardo, que se usa para marcar
 * jerarquía — primero el titular, después el contenido.
 *
 * `prefers-reduced-motion` lo anula: los elementos aparecen ya colocados,
 * sin transición (§2.5, piso de accesibilidad no negociable).
 */

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

/** Curva compartida: sale con energía y aterriza sin rebote. */
const EASE = [0.22, 1, 0.36, 1] as const;

export type RevealProps = {
  children: ReactNode;
  /** Retardo en segundos. Se usa para escalonar dentro de una sección. */
  delay?: number;
  /** Distancia de entrada en píxeles. */
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header" | "p" | "span";
};

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Contenedor que escalona a sus hijos directos envueltos en <RevealItem>.
 * Útil en rejillas: las tarjetas entran una detrás de otra, no todas de golpe.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.07,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ol" | "ul" | "section";
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];

  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : stagger } },
  };

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial={reduced ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </MotionTag>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];

  const variants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };

  return (
    <MotionTag className={className} variants={reduced ? undefined : variants}>
      {children}
    </MotionTag>
  );
}
