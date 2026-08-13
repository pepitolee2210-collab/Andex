"use client";

/**
 * UN TEMARIO — el oficio, lo que se aprende, y el manual para llevárselo.
 *
 * Cerrado enseña lo único que decide si alguien entra: de qué oficio es y
 * cuánto dura. Abierto, el temario entero agrupado por MOMENTO del trabajo
 * —la entrevista, el primer día, cuando algo sale mal— y no por dificultad.
 *
 * `<details>` y no estado propio: funciona sin JavaScript, el navegador se
 * encarga del teclado y de los lectores de pantalla, y no hay nada que
 * sincronizar.
 */

import { useState } from "react";
import { ChevronDown, Download, FileText, Loader2, Scale, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downloadBlob } from "@/lib/scanner";
import {
  lessonsBySituation,
  phraseCount,
  type LessonTrack,
} from "@/lib/academia/types";
import type { AcademiaDict } from "@/lib/i18n/dictionaries/academia";
import { PhraseCard } from "./phrase-card";

const fill = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

export type TrackCardProps = {
  track: LessonTrack;
  copy: AcademiaDict;
  /** Nombre del archivo, ya con el idioma resuelto. */
  className?: string;
};

export function TrackCard({ track, copy, className }: TrackCardProps) {
  const [building, setBuilding] = useState(false);
  const [failed, setFailed] = useState(false);

  const lecciones = track.lessons.length;
  const frases = phraseCount(track);

  const meta = fill(copy.tracks.meta, {
    lessons: lecciones,
    phrases: frases,
    weeks: track.weeks,
  });

  /**
   * Genera el manual y lo entrega.
   *
   * `pdf-lib` llega aquí y sólo aquí: el `import()` está dentro de
   * `buildSyllabusPdf`, así que la pantalla no carga la librería hasta que
   * alguien pulsa. Quien sólo lee el temario en el teléfono no descarga nada.
   */
  async function descargar() {
    setFailed(false);
    setBuilding(true);
    try {
      const { buildSyllabusPdf } = await import("@/lib/academia/syllabus-pdf");
      const blob = await buildSyllabusPdf(track, {
        brand: "ANDEX",
        kind: copy.pdf.kind,
        weeks: (n) => (n === 1 ? copy.pdf.weeksOne : fill(copy.pdf.weeks, { n })),
        phrases: (n) => (n === 1 ? copy.pdf.phrasesOne : fill(copy.pdf.phrases, { n })),
        situations: copy.situations,
        sayLabel: copy.phrase.sayLabel,
        factsTitle: copy.facts.title,
        factsSource: copy.facts.source,
        factsDisclaimer: copy.facts.disclaimer,
        footer: copy.pdf.footer,
        page: (n, total) => fill(copy.pdf.page, { n, total }),
      });
      downloadBlob(blob, `${copy.download.fileName}-${track.slug}.pdf`);
    } catch {
      setFailed(true);
    } finally {
      setBuilding(false);
    }
  }

  return (
    <details
      className={cn(
        "group overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition-colors open:border-teal-deep",
        className,
      )}
    >
      <summary
        className={cn(
          "flex min-h-16 cursor-pointer list-none items-center gap-3 p-4 text-left sm:p-5",
          "[&::-webkit-details-marker]:hidden",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-deep",
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-soft text-teal-deep"
        >
          <FileText className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-h3 text-ink">{track.title}</span>
          <span className="mt-0.5 block text-body text-muted">{track.summary}</span>
          <span className="mt-1.5 block text-caption font-medium text-muted">{meta}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-teal-deep transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-line px-4 pb-5 pt-1 sm:px-5">
        {lessonsBySituation(track).map((grupo) => (
          <section key={grupo.situation} className="mt-5 first:mt-4">
            <h4 className="text-caption font-bold uppercase tracking-widest text-teal-deep">
              {copy.situations[grupo.situation] ?? grupo.situation}
            </h4>
            {grupo.lessons.map((leccion) => (
              <div key={leccion.id} className="mt-3">
                <p className="text-body font-semibold text-ink">{leccion.title}</p>

                {/* ── Lo que hay que SABER ──
                    Va ANTES de las frases y con otro aspecto, porque no es
                    lo mismo: una frase se practica, un derecho se sabe. Y
                    cada uno lleva su fuente a la vista — un hecho sobre
                    salarios o sobre OSHA sin fuente es una afirmación
                    nuestra, y este producto no puede permitirse ninguna. */}
                {leccion.facts && leccion.facts.length > 0 ? (
                  <div className="mt-2 rounded-lg border border-teal-deep/25 bg-teal-soft p-3.5">
                    <p className="flex items-center gap-2 text-caption font-bold uppercase tracking-wide text-teal-deep">
                      <Scale aria-hidden="true" className="size-4" />
                      {copy.facts.title}
                    </p>
                    <ul className="mt-2 space-y-2.5">
                      {leccion.facts.map((hecho) => (
                        <li key={hecho.text}>
                          <p className="text-body text-ink">{hecho.text}</p>
                          <p className="mt-0.5 text-caption text-muted">
                            {copy.facts.source}:{" "}
                            {hecho.url ? (
                              <a
                                href={hecho.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2 hover:text-ink"
                              >
                                {hecho.source}
                              </a>
                            ) : (
                              hecho.source
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 flex items-start gap-2 border-t border-teal-deep/20 pt-2.5 text-caption text-muted">
                      <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                      <span className="min-w-0">{copy.facts.disclaimer}</span>
                    </p>
                  </div>
                ) : null}

                <ul className="mt-1">
                  {leccion.phrases.map((frase) => (
                    <PhraseCard key={frase.en} phrase={frase} copy={copy.phrase} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}

        {/* ── El manual ──
            Va al final del temario a propósito: quien ha llegado leyendo
            hasta aquí es quien de verdad lo quiere. */}
        <div className="mt-6 rounded-lg border border-line bg-surface-alt p-4">
          <p className="font-heading text-h3 text-ink">{copy.download.title}</p>
          <p className="mt-1 text-body text-muted">{copy.download.body}</p>
          <Button onClick={() => void descargar()} className="mt-3" disabled={building}>
            {building ? (
              <Loader2 aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <Download aria-hidden="true" className="size-5" />
            )}
            {building ? copy.download.building : copy.download.cta}
          </Button>
          {failed ? (
            <p role="alert" className="mt-2 text-caption text-danger">
              {copy.download.failed}
            </p>
          ) : null}
        </div>
      </div>
    </details>
  );
}
