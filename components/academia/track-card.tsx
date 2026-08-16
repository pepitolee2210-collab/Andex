"use client";

/**
 * UN TEMARIO, POR DENTRO — sus dos niveles.
 *
 *  · `TrackDetail`  — los MOMENTOS del trabajo que cubre el temario, y el
 *                     manual para llevárselo.
 *  · `MomentDetail` — las frases de un momento, y lo que hay que saber.
 *
 * ── Por qué se entra y no se despliega ──
 *
 * Antes esto era un `<details>`: el temario entero —lecciones, hechos,
 * frases y manual— se abría dentro de la lista de los nueve. Con 21 frases
 * en Construcción eso son cinco pantallas de desplazamiento debajo de una
 * tarjeta, y la lista de temarios se queda a un palmo de distancia sin que
 * se vea nada de ella.
 *
 * El diseño lo parte en tres pasos: los nueve temarios → los momentos de
 * uno → las frases de un momento. En cada pantalla caben cinco o seis
 * frases a 25px, que es el tamaño al que se leen en voz alta. Es lo que
 * permite que la frase sea el objeto de la pantalla y no una fila más.
 *
 * ── Lo que hay que saber va DESPUÉS de las frases ──
 *
 * Al revés que antes. Un hecho sobre salarios o sobre OSHA no se practica,
 * se sabe; ponerlo delante metía un bloque de prosa entre quien abre el
 * momento y las frases que venía a ver. Ahora cierra la pantalla, en voz
 * más baja y con su fuente enlazada al lado de la afirmación.
 */

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, ShieldCheck } from "lucide-react";
import { downloadBlob } from "@/lib/scanner";
import {
  lessonsBySituation,
  type LessonSituation,
  type LessonTrack,
} from "@/lib/academia/types";
import type { AcademiaDict } from "@/lib/i18n/dictionaries/academia";
import {
  Glyph,
  KitButton,
  KitNotice,
  PhraseList,
  ScreenHeader,
  SectionLabel,
} from "@/components/ui/kit";
import { PhraseCard } from "./phrase-card";

const fill = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/** Volver al nivel anterior. Es el `onBack` de la cabecera del diseño. */
function BackLink({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="navback">
      <Glyph name="chevron-left" icon={ChevronLeft} size={22} strokeWidth={2} />
      {label}
    </button>
  );
}

// ── Nivel 2 · los momentos de un temario ─────────────────

export type TrackDetailProps = {
  track: LessonTrack;
  copy: AcademiaDict;
  onOpen: (situation: LessonSituation) => void;
  onBack: () => void;
};

export function TrackDetail({ track, copy, onOpen, onBack }: TrackDetailProps) {
  const [building, setBuilding] = useState(false);
  const [failed, setFailed] = useState(false);

  const grupos = lessonsBySituation(track);

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
    <article className="mx-auto w-full max-w-4xl">
      <BackLink label={copy.back} onBack={onBack} />
      <ScreenHeader overline={copy.title} title={track.title} sub={copy.tracks.momentsBody} />

      <div className="mt-6 flex flex-col gap-3">
        {grupos.map((grupo, i) => {
          const frases = grupo.lessons.reduce((n, l) => n + l.phrases.length, 0);
          // El título de la lección ES la pista de cuándo se usa el momento:
          // «La entrevista · Antes de aceptar el trabajo».
          const pista = grupo.lessons.map((l) => l.title).join(" · ");
          return (
            <button
              key={grupo.situation}
              type="button"
              onClick={() => onOpen(grupo.situation)}
              style={{ animationDelay: `${i * 40}ms` }}
              className="ax-card enter flex w-full items-center gap-3.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-body-lg font-bold">
                  {copy.situations[grupo.situation] ?? grupo.situation}
                </span>
                <span className="rowmeta mt-1.5">{pista}</span>
                <span className="rowmeta mt-1 text-disabled">
                  {frases === 1
                    ? copy.tracks.phrasesOne
                    : fill(copy.tracks.phrases, { n: frases })}
                </span>
              </span>
              <Glyph
                name="chevron-right"
                icon={ChevronRight}
                size={19}
                strokeWidth={2}
                className="shrink-0 text-disabled"
              />
            </button>
          );
        })}
      </div>

      {/* ── El manual ──
          Va al final del temario a propósito: quien ha llegado hasta aquí
          es quien de verdad lo quiere. */}
      <SectionLabel as="h2">{copy.download.label}</SectionLabel>
      <KitButton
        kind="quiet"
        wide
        iconName="download"
        icon={Download}
        onClick={() => void descargar()}
        disabled={building}
      >
        {building ? copy.download.building : copy.download.cta}
      </KitButton>
      {failed ? (
        <p role="alert" className="mt-2.5 text-body text-danger">
          {copy.download.failed}
        </p>
      ) : null}
      <div className="h-6" />
    </article>
  );
}

// ── Nivel 3 · las frases de un momento ───────────────────

export type MomentDetailProps = {
  track: LessonTrack;
  situation: LessonSituation;
  copy: AcademiaDict;
  onBack: () => void;
};

export function MomentDetail({ track, situation, copy, onBack }: MomentDetailProps) {
  const grupo = lessonsBySituation(track).find((g) => g.situation === situation);
  if (!grupo) return null;

  const frases = grupo.lessons.flatMap((l) => l.phrases);
  const hechos = grupo.lessons.flatMap((l) => l.facts ?? []);
  const pista = grupo.lessons.map((l) => l.title).join(" · ");

  return (
    <article className="mx-auto w-full max-w-4xl">
      <BackLink label={copy.back} onBack={onBack} />
      <ScreenHeader
        overline={track.title}
        title={copy.situations[situation] ?? situation}
        sub={pista}
      />

      <PhraseList className="mt-[26px]">
        {frases.map((frase, i) => (
          <PhraseCard key={frase.en} phrase={frase} copy={copy.phrase} delayMs={i * 40} />
        ))}
      </PhraseList>

      {/* ── Lo que hay que saber ──
          El filete de la izquierda dice «esto no lo decimos nosotros». Cada
          afirmación lleva su fuente pegada, no en una nota al pie: un hecho
          sobre salarios o sobre OSHA sin fuente es una afirmación nuestra, y
          este producto no puede permitirse ninguna.

          No se usa `SourcedFacts` del kit porque exige `href` y tres de
          nuestros diez hechos no tienen página pública a la que enlazar
          («Fair Labor Standards Act», «CASAS 4.3.4 · OSHA»). Inventarles una
          URL sería justo lo contrario de lo que hace este bloque. Las clases
          son las suyas, sin una línea de CSS nueva. */}
      {hechos.length > 0 ? (
        <>
          <SectionLabel as="h2">{copy.facts.title}</SectionLabel>
          <div className="sourced">
            {hechos.map((hecho) => (
              <p key={hecho.text}>
                {hecho.text}{" "}
                {hecho.url ? (
                  <a href={hecho.url} target="_blank" rel="noopener noreferrer">
                    {hecho.source}
                  </a>
                ) : (
                  <span className="font-semibold">{hecho.source}</span>
                )}
              </p>
            ))}
          </div>
          <KitNotice iconName="shield-check" icon={ShieldCheck} className="mt-4">
            {copy.facts.disclaimer}
          </KitNotice>
        </>
      ) : null}
      <div className="h-6" />
    </article>
  );
}
