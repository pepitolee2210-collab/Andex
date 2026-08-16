"use client";

/**
 * UNA FRASE — lo que se dice, cómo suena y qué significa.
 *
 * ── La jerarquía visual no es decorativa ──
 *
 * Arriba y grande va el INGLÉS (25px, peso 700), porque es lo que la persona
 * va a decir en voz alta. Debajo, en cursiva y en teal profundo, la
 * pronunciación escrita como suena en español; y al final, apagado, el
 * significado: se consulta una vez y luego estorba.
 *
 * La pronunciación NO se parte por sílabas (`word-break: keep-all` en
 * `.phrase-pr`): una pronunciación cortada a la mitad se lee mal en voz
 * alta, que es exactamente para lo que está. Y no lleva rótulo delante —el
 * «Se dice:» que había antes— porque la cursiva y el color ya dicen qué es,
 * y ese rótulo le robaba una línea a cada frase.
 *
 * Un temario que pone el español primero se lee como una lista de
 * traducciones. Éste se lee como un guion para hablar.
 *
 * ── Por qué hay dos formas ──
 *
 * `PhraseItem` es un botón entero: toda la frase es el área de pulsación
 * para escucharla. Eso sólo vale si el navegador PUEDE hablar. Si no puede,
 * la frase se pinta con las mismas clases pero sin botón: un botón que no
 * hace nada gasta la confianza que este producto no puede permitirse.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { KitNotice, PhraseItem } from "@/components/ui/kit";
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
  /** Escalona la entrada de la lista. */
  delayMs?: number;
};

/**
 * Más lento que el habla normal: se está aprendiendo a repetirlo, no
 * escuchando una conversación.
 */
const RATE = 0.85;

/**
 * Caracteres por segundo a esa velocidad. Sólo sirve para mover el anillo
 * de progreso mientras suena; `onboundary` lo corrige en cuanto llega, y
 * `onend` lo cierra. Nunca se usa para decidir nada.
 */
const CHARS_PER_SECOND = 12;

/**
 * El guion de sílaba no puede partir la línea.
 *
 * `word-break: keep-all` no lo impide: un guion es una oportunidad de corte
 * propia, y «am ai péid bai de áu-/ar or bai de yob» es exactamente la
 * pronunciación cortada a la mitad que el diseño prohíbe — se lee mal en voz
 * alta, que es justo para lo que está.
 *
 * Se sustituye por el guion que no rompe (U+2011) **sólo al pintar**: el dato
 * del catálogo no cambia, así que el PDF y las pruebas siguen viendo el guion
 * normal.
 */
const sinCortes = (texto: string): string => texto.replace(/-/g, "‑");

export function PhraseCard({ phrase, copy, delayMs = 0 }: PhraseCardProps) {
  /**
   * `null` hasta montar: `speechSynthesis` no existe en el servidor, y
   * decidir en el primer render daría un HTML distinto al del cliente.
   */
  const [canSpeak, setCanSpeak] = useState<boolean | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const detener = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setSpeaking(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    setCanSpeak(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      // Salir de la pantalla no puede dejar una voz hablando sola.
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function hablar() {
    if (!canSpeak) return;
    const synth = window.speechSynthesis;

    // Segunda pulsación sobre la misma frase: se calla.
    if (speaking) {
      synth.cancel();
      detener();
      return;
    }

    // Cancelar antes de empezar: sin esto, pulsar dos frases seguidas las
    // encola y la segunda se oye cuando ya nadie la está mirando.
    synth.cancel();

    const u = new SpeechSynthesisUtterance(phrase.en);
    u.lang = "en-US";
    u.rate = RATE;
    u.onend = detener;
    u.onerror = detener;
    // El anillo real, cuando el motor lo da: en qué carácter va.
    u.onboundary = (evento) => {
      const avance = evento.charIndex / Math.max(1, phrase.en.length);
      setProgress((previo) => Math.min(0.97, Math.max(previo, avance)));
    };

    const duracion = Math.max(1200, (phrase.en.length / CHARS_PER_SECOND) * 1000);
    const arranque = Date.now();
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      const avance = (Date.now() - arranque) / duracion;
      // Se queda a un pelo del final: quien lo cierra es `onend`, no el reloj.
      setProgress((previo) => Math.min(0.97, Math.max(previo, avance)));
    }, 60);

    setProgress(0);
    setSpeaking(true);
    synth.speak(u);
  }

  const frase =
    canSpeak === true ? (
      <PhraseItem
        english={phrase.en}
        pronunciation={sinCortes(phrase.say)}
        spanish={phrase.es}
        playing={speaking}
        progress={progress}
        onPlay={hablar}
        playLabel={`${copy.listen}: ${phrase.en}`}
        delayMs={delayMs}
      />
    ) : (
      /* Sin voz en el navegador, las mismas tres líneas sin botón. */
      <div className="phrase enter" style={{ animationDelay: `${delayMs}ms` }}>
        <span className="phrasemain">
          <span className="phrase-en" lang="en">
            {phrase.en}
          </span>
          <span className="phrase-pr">{sinCortes(phrase.say)}</span>
          <span className="phrase-es">{phrase.es}</span>
        </span>
      </div>
    );

  if (!phrase.note) return frase;

  /* La nota —«pregúntalo siempre», «no da pena: da confianza»— no está en el
     diseño porque el diseño no tenía contenido real. Aquí sí lo hay, así que
     va debajo y en voz baja, sin romper el ritmo entre frases. */
  return (
    <div>
      {frase}
      <KitNotice iconName="info" icon={Info} plain>
        {phrase.note}
      </KitNotice>
    </div>
  );
}
