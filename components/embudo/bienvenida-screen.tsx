"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";

import { PasosEmbudo } from "./pasos-embudo";
import { ROUTES } from "@/lib/config";
import type { LandingImage } from "@/lib/landing-images";
import type { BienvenidaDict } from "@/lib/i18n/dictionaries/bienvenida";
import { cn } from "@/lib/utils";

/**
 * PASO 1 — LA BIENVENIDA.
 *
 * Henry cuenta qué es esto antes de que se pida nada. Es lo primero que ve
 * quien entra, y es lo único del embudo que no pide nada a cambio.
 *
 * ── El video todavía no está ──
 *
 * El marco está montado con la proporción 16:9 ya reservada, así que cuando
 * llegue el archivo entra y nada salta. Mientras tanto se pinta el estado
 * PENDIENTE, rotulado: un marco vacío que parece un reproductor acaba en
 * producción sin que nadie se dé cuenta.
 *
 * Para montarlo: deja el archivo y sustituye el bloque `pendiente` por el
 * `<video>` con su `poster`. Nada más de esta pantalla cambia.
 *
 * ── Nunca se reproduce solo ──
 *
 * La duración y los subtítulos se dicen ANTES del play, y hay una salida
 * clara. No es una concesión: el público objetivo usa Android de gama media
 * con datos contados, y un video que arranca solo le cuesta dinero a quien
 * abre la página. Obligar a verlo antes de dejar avanzar es la forma más
 * rápida de perder a alguien que ya venía decidido.
 */

export type BienvenidaScreenProps = {
  /**
   * Sólo cadenas, ya compuestas. NO el diccionario entero: lleva funciones
   * —los textos con parámetro— y una función no cruza la frontera
   * servidor→cliente. Pasarlo entero revienta con un 500 en ejecución.
   */
  copy: BienvenidaDict;
  /** El nombre de la marca. */
  marca: string;
  /**
   * El retrato que hace de cartel mientras no hay video, desenfocado para
   * que se lea como un fondo y no como una foto puesta por error.
   *
   * Llega como prop y no se resuelve aquí a propósito: el catálogo comprueba
   * el disco con `node:fs` y esto es un componente cliente. Lo resuelve la
   * página, que sí corre en el servidor.
   */
  poster?: LandingImage | null;
  className?: string;
};

export function BienvenidaScreen({
  copy: t,
  marca,
  poster = null,
  className,
}: BienvenidaScreenProps) {

  return (
    <main
      id="contenido"
      className={cn(
        "relative isolate min-h-dvh w-full overflow-hidden bg-navy-body text-[color:var(--text-on-invert)]",
        className,
      )}
    >
      <div aria-hidden="true" className="hero-fondo -z-10">
        <span className="masa-1" />
        <span className="masa-2" />
        <span className="reflejo" />
      </div>

      {/* Barra: marca y recorrido. Aquí no se navega, se avanza. */}
      <div className="border-b border-[color:var(--hairline-on-invert-soft)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link href={ROUTES.landing} className="flex min-h-11 items-center gap-2.5">
            <span className="font-heading text-h3 font-bold tracking-tight text-[color:var(--text-on-invert)]">
              {marca}
            </span>
          </Link>
          <PasosEmbudo
            pasos={t.pasos}
            actual={1}
            etiqueta={t.pasoActual}
            className="flex-1 lg:flex-none"
          />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-16">
        {/* ── El video ── */}
        <div>
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="late size-2 rounded-full bg-[color:var(--text-on-invert-accent)]"
            />
            <span className="text-caption font-bold uppercase tracking-[0.18em] text-[color:var(--text-on-invert-quiet)]">
              {t.eyebrow}
            </span>
          </div>

          <h1 className="mt-5 max-w-[16ch] font-heading text-h1 leading-[1.02] text-[color:var(--text-on-invert)] sm:text-display lg:text-display-lg">
            {t.heading}
          </h1>

          {/* El marco. `aspect-video` reserva el hueco desde ahora. */}
          <div className="relative mt-7 aspect-video overflow-hidden rounded-xl border border-[color:var(--hairline-on-invert-soft)] bg-[color:var(--navy-950)] shadow-lg sm:mt-8">
            {poster ? (
              <Image
                src={poster.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 46rem, 100vw"
                className="object-cover opacity-55 blur-md saturate-[.85]"
                style={{ objectPosition: "center 24%" }}
              />
            ) : null}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-[color:var(--navy-950)]/50 via-transparent to-[color:var(--navy-950)]/85"
            />

            {/* ── ESTADO PENDIENTE ── */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span
                aria-hidden="true"
                className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-[color:var(--hairline-on-invert)] sm:size-[74px]"
              >
                <Play className="size-6 text-[color:var(--text-on-glass-quiet)]" />
              </span>
              <p className="font-mono text-caption uppercase tracking-[0.06em] text-[color:var(--text-on-glass-quiet)]">
                {t.pendiente.label}
              </p>
              <p className="text-caption text-[color:var(--text-on-invert-quiet)]">
                {t.pendiente.note}
              </p>
            </div>

            {/* Duración y subtítulos: los dos datos que deciden si alguien le
                da al play con datos contados. */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 sm:bottom-4 sm:left-5">
              <span className="rounded-full bg-[color:var(--navy-950)]/80 px-3 py-1.5 font-mono text-caption tabular-nums text-[color:var(--text-on-glass-quiet)]">
                {t.duracion}
              </span>
              <span className="rounded-full bg-[color:var(--navy-950)]/80 px-3 py-1.5 text-caption font-semibold text-[color:var(--text-on-glass-quiet)]">
                {t.subtitulos}
              </span>
            </div>
          </div>
        </div>

        {/* ── La columna que decide ── */}
        <div className="lg:pt-16">
          <div className="vidrio legible p-5 sm:p-6">
            <p className="text-caption font-bold uppercase tracking-[0.18em] text-[color:var(--teal-200)]">
              {t.puntosTitle}
            </p>
            <ol className="mt-4">
              {t.puntos.map((punto, i) => (
                <li
                  key={punto}
                  className="flex gap-3 border-t border-[color:var(--hairline-on-invert-soft)] py-3"
                >
                  <span
                    aria-hidden="true"
                    className="w-5 shrink-0 font-mono text-caption text-[color:var(--text-on-invert-accent)]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 text-body leading-[1.45] text-[color:var(--text-on-invert)]">
                    {punto}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <Link
            href={ROUTES.pago}
            className="ax-btn btn-accent btn-lg wide brillo mt-6 group"
          >
            {t.cta}
            <ArrowRight
              aria-hidden="true"
              className="ml-2 size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>

          {/* La salida. Ver la cabecera del archivo: no es una concesión. */}
          <p className="mt-4 text-center">
            <Link
              href={ROUTES.pago}
              className="inline-flex min-h-11 items-center text-label text-[color:var(--text-on-invert-quiet)] underline decoration-[color:var(--hairline-on-invert)] underline-offset-4 transition-colors hover:text-[color:var(--text-on-invert)]"
            >
              {t.skip}
            </Link>
          </p>

          <p className="mt-4 text-center text-caption leading-[1.55] text-[color:var(--text-on-invert-quiet)]">
            {t.nota}
          </p>
        </div>
      </div>
    </main>
  );
}
