"use client";

/**
 * UNA FRASE — lo que se dice, cómo suena y qué significa.
 *
 * ── La jerarquía visual no es decorativa ──
 *
 * Arriba y grande va el INGLÉS, porque es lo que la persona va a decir en
 * voz alta. Debajo, en color y en cursiva, la pronunciación escrita como
 * suena en español — visualmente separada para que el ojo la encuentre sola
 * mientras se practica. Y al final, apagado, el significado: se consulta una
 * vez y luego estorba.
 *
 * Un temario que pone el español primero se lee como una lista de
 * traducciones. Éste se lee como un guion para hablar.
 */

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Phrase } from "@/lib/academia/types";

export type PhraseCopy = {
  sayLabel: string;
  listen: string;
  listening: string;
  unsupported: string;
};

export type PhraseCardProps = {
  phrase: Phrase;
  copy: PhraseCopy;
  className?: string;
};

export function PhraseCard({ phrase, copy, className }: PhraseCardProps) {
  /**
   * `null` hasta montar: `speechSynthesis` no existe en el servidor, y
   * decidir en el primer render daría un HTML distinto al del cliente.
   */
  const [canSpeak, setCanSpeak] = useState<boolean | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      // Salir de la pantalla no puede dejar una voz hablando sola.
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function speak() {
    if (!canSpeak) return;
    const synth = window.speechSynthesis;
    // Cancelar antes de empezar: sin esto, pulsar dos frases seguidas las
    // encola y la segunda se oye cuando ya nadie la está mirando.
    synth.cancel();

    const u = new SpeechSynthesisUtterance(phrase.en);
    u.lang = "en-US";
    // Más lento que el habla normal: se está aprendiendo a repetirlo, no
    // escuchando una conversación.
    u.rate = 0.85;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utteranceRef.current = u;
    setSpeaking(true);
    synth.speak(u);
  }

  return (
    <li
      className={cn(
        "flex items-start gap-3 border-b border-line py-3.5 last:border-b-0",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold text-ink" lang="en">
          {phrase.en}
        </p>
        {/* La pronunciación, que es la razón de ser del módulo. */}
        <p className="mt-1 text-body italic text-teal-deep">
          <span className="not-italic font-medium">{copy.sayLabel}: </span>
          {phrase.say}
        </p>
        <p className="mt-1 text-caption text-muted">{phrase.es}</p>
        {phrase.note ? (
          <p className="mt-1.5 border-l-2 border-amber-deep/40 pl-2.5 text-caption text-muted">
            {phrase.note}
          </p>
        ) : null}
      </div>

      {/* Escuchar. Sólo aparece si el navegador puede: un botón que no hace
          nada gasta la confianza que este producto no puede permitirse. */}
      {canSpeak ? (
        <button
          type="button"
          onClick={speak}
          aria-label={`${copy.listen}: ${phrase.en}`}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors",
            speaking
              ? "border-teal-deep bg-teal-deep text-white"
              : "border-line bg-surface text-teal-deep hover:border-teal-deep hover:bg-teal-soft",
          )}
        >
          <Volume2
            aria-hidden="true"
            className={cn("size-5", speaking && "animate-pulse motion-reduce:animate-none")}
          />
        </button>
      ) : null}
    </li>
  );
}
