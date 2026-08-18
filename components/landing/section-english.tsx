import { Check } from "lucide-react";

import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

/**
 * S6 · INGLÉS LABORAL EN VIVO.
 *
 * El documento maestro la quiere destacada, y lo está por el terreno: fondo
 * navy en mitad de una página crema. El salto tonal la separa sin necesidad
 * de un marco, una sombra ni un «¡NUEVO!».
 *
 * Es la única sección de un módulo con página propia, y hay una razón: es lo
 * que se paga y no se ve. Los documentos y los trámites se entienden solos
 * leyendo el nombre del módulo; que las clases sean EN VIVO, cuatro días por
 * semana y sin cuota aparte, no — y eso es exactamente lo que separa a esta
 * membresía de una carpeta de PDF.
 *
 * ── El ámbar ──
 * El documento pide acentos en ámbar y teal. El ámbar entra sólo como
 * superficie del distintivo, con texto navy encima: la regla del proyecto
 * prohíbe el ámbar puro debajo de texto claro —blanco sobre ámbar da
 * 1.77:1— y `--on-highlight` es el navy que sí resuelve sobre él.
 *
 * Server Component: no hay estado.
 */

export type EnglishPoint = {
  title: string;
  body: string;
};

export type SectionEnglishCopy = {
  eyebrow: string;
  title: string;
  points: readonly EnglishPoint[];
};

export type SectionEnglishProps = {
  copy: SectionEnglishCopy;
  id?: string;
};

export function SectionEnglish({ copy, id = "ingles" }: SectionEnglishProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="bg-navy px-5 py-16 text-[color:var(--text-on-invert)] sm:px-6 sm:py-24"
    >
      <div className="mx-auto w-full max-w-5xl">
        <Reveal className="max-w-3xl">
          <span className="inline-flex items-center rounded-full bg-amber px-3 py-1 text-caption font-bold uppercase tracking-wide text-[color:var(--on-highlight)]">
            {copy.eyebrow}
          </span>
          <h2
            id={`${id}-titulo`}
            className="mt-4 font-heading text-h1 text-[color:var(--text-on-invert)] sm:text-display"
          >
            {copy.title}
          </h2>
        </Reveal>

        <RevealGroup
          as="ul"
          className="mt-9 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5"
        >
          {copy.points.map((punto) => (
            <RevealItem
              as="li"
              key={punto.title}
              className="flex gap-3 rounded-xl bg-[color:var(--surface-on-invert)] p-5 ring-1 ring-[color:var(--hairline-on-invert-soft)]"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--text-on-invert-accent)]"
              >
                <Check
                  className="size-3.5 text-[color:var(--navy-900)]"
                  strokeWidth={3}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-body font-semibold leading-[1.35] text-[color:var(--text-on-invert)]">
                  {punto.title}
                </span>
                <span className="mt-1.5 block text-body leading-[1.55] text-[color:var(--text-on-invert-quiet)]">
                  {punto.body}
                </span>
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
