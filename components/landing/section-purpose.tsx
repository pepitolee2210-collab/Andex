"use client";

/**
 * S7 · MISIÓN, VISIÓN Y ECOSISTEMA FAMILIAR — la sección HUMANA.
 *
 * ── Por qué aquí no hay tarjetas
 * La misión no es una feature. Meterla en una tarjeta blanca de 16px la
 * iguala con "Bóveda Digital" y la vuelve invisible. Aquí manda la
 * tipografía: la misión ocupa `text-h1` a medida de línea corta, la visión
 * `text-h2`, y todo respira sobre `bg-page` (crema). Es el respiro claro
 * justo después del navy de servicios — el ritmo de la página se construye
 * con el peso de cada sección, no con más adornos.
 *
 * ── Cero imágenes
 * No hay fotos que usar y las generadas están prohibidas en este proyecto.
 * El único "gráfico" es la escala tipográfica y dos chips de icono, que ya
 * son el lenguaje del resto del producto (`modules-section` usa el mismo
 * `bg-teal-soft` + `text-teal-deep`, legible en claro y en oscuro).
 *
 * ── Movimiento: la misión entra palabra a palabra
 * Es el momento de mayor peso emocional de la landing, así que es el único
 * sitio donde el movimiento hace algo más que colocar el bloque: cada
 * palabra sube 0.35em y aparece con 35 ms de retardo entre ellas. Sin
 * rebote (misma curva que `components/motion/reveal.tsx`), sin escala, sin
 * desenfoque.
 *
 * Accesibilidad del troceado: las palabras son `<span>` en línea separados
 * por nodos de texto reales, así que el párrafo conserva su contenido y su
 * salto de línea natural — el lector de pantalla lee la frase entera, no
 * palabra por palabra, y el texto se puede seleccionar y copiar. Con
 * `prefers-reduced-motion` ni siquiera se trocea: se renderiza el párrafo
 * plano (§2.5).
 *
 * Todo el copy llega por props: importar `@/lib/i18n` desde un componente
 * cliente metería los nueve diccionarios en ES y EN en el bundle.
 */

import { Fragment } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { GraduationCap, Users, type LucideIcon } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";

/** Misma curva que el resto de la landing: energía al salir, sin rebote. */
const EASE = [0.22, 1, 0.36, 1] as const;

const WORDS_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};

const WORD: Variants = {
  hidden: { opacity: 0, y: "0.35em" },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export type PurposeProgram = {
  title: string;
  body: string;
};

export type PurposeCopy = {
  eyebrow: string;
  missionTitle: string;
  mission: string;
  visionTitle: string;
  vision: string;
  familyTitle: string;
  familySubtitle: string;
  family: readonly PurposeProgram[];
};

export type SectionPurposeProps = {
  copy: PurposeCopy;
  /** `id` del <section>: ancla del nav y clave de `landing_section_viewed`. */
  id?: string;
};

/** Iconos por POSICIÓN en `family`: CEO Junior · Padres 3.0. */
const PROGRAM_ICONS: readonly LucideIcon[] = [GraduationCap, Users];

function WordsReveal({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <p className={className}>{text}</p>;
  }

  const words = text.split(" ");

  return (
    <motion.p
      className={className}
      variants={WORDS_CONTAINER}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-15%" }}
    >
      {words.map((word, index) => (
        <Fragment key={`${index}-${word}`}>
          <motion.span variants={WORD} className="inline-block">
            {word}
          </motion.span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </motion.p>
  );
}

export function SectionPurpose({ copy, id = "proposito" }: SectionPurposeProps) {
  const titleId = `${id}-titulo`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="bg-page px-4 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-5xl">
        {/* El eyebrow ES el encabezado de la sección: dentro no hay un título
            único, sino tres bloques (misión, visión, familia) que cuelgan de
            él como h3. Así el árbol de encabezados queda correcto sin
            inventar copy que no existe en el diccionario. */}
        <Reveal>
          <h2
            id={titleId}
            className="font-heading text-label font-semibold uppercase tracking-widest text-muted"
          >
            {copy.eyebrow}
          </h2>
        </Reveal>

        {/* ── MISIÓN ── el momento de más peso de la página ── */}
        <div className="mt-8">
          <Reveal as="p" className="text-label font-semibold uppercase tracking-widest text-teal-deep">
            {copy.missionTitle}
          </Reveal>
          <WordsReveal
            text={copy.mission}
            className="mt-4 max-w-4xl font-heading text-h1 leading-snug text-ink"
          />
        </div>

        {/* ── VISIÓN ── un peldaño por debajo, separada por un filete ── */}
        <div className="mt-12 border-t border-line pt-12">
          <Reveal as="p" className="text-label font-semibold uppercase tracking-widest text-teal-deep">
            {copy.visionTitle}
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-4 max-w-3xl font-heading text-h2 leading-snug text-ink">
              {copy.vision}
            </p>
          </Reveal>
        </div>

        {/* ── ECOSISTEMA FAMILIAR ── */}
        <div className="mt-14">
          <Reveal>
            <h3 className="font-heading text-h2 text-ink">{copy.familyTitle}</h3>
          </Reveal>
          <Reveal as="p" delay={0.06} className="mt-2 text-body-lg text-muted">
            {copy.familySubtitle}
          </Reveal>

          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {copy.family.map((program, index) => {
              const Icon = PROGRAM_ICONS[index] ?? GraduationCap;
              return (
                <li key={program.title} className="h-full">
                  <Reveal delay={0.08 * index} className="h-full">
                    {/* El hover vive aquí y no en el nodo que anima Motion:
                        el `transform` en línea del reveal pisaría la clase. */}
                    <article className="flex h-full flex-col rounded-xl border border-line bg-surface p-6 shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-8">
                      <span
                        aria-hidden="true"
                        className="flex size-12 items-center justify-center rounded-md bg-teal-soft text-teal-deep"
                      >
                        <Icon className="size-6" />
                      </span>
                      <h4 className="mt-5 font-heading text-h2 text-ink">
                        {program.title}
                      </h4>
                      <p className="mt-3 text-body-lg text-muted">
                        {program.body}
                      </p>
                    </article>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
