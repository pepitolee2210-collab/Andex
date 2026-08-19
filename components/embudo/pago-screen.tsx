"use client";

import { useCallback, useId, useState } from "react";
import Link from "next/link";
import { Check, Lock } from "lucide-react";

import { PasosEmbudo } from "./pasos-embudo";
import { ROUTES } from "@/lib/config";
import type { PagoDirectoDict } from "@/lib/i18n/dictionaries/pago-directo";
import type { PlanType } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * PASO 2 — EL PAGO, SIN CUENTA TODAVÍA.
 *
 * Aquí NO se pide nada. Ni correo ni tarjeta: esta pantalla sólo enseña los
 * dos planes y manda a la caja de Stripe, que es quien pregunta el correo,
 * quien pregunta la tarjeta y quien cobra.
 *
 * ── Por qué se dejó de pedir el correo aquí ──
 *
 * Lo pedíamos porque el cobro ocurre antes de que exista la cuenta y hacía
 * falta algo que atara el pago a una persona. Pero preguntarlo dos veces
 * —una nuestra y otra de Stripe— es un formulario de más en el punto donde
 * más gente se cae, y encima obligaba a validar y a explicar por qué lo
 * pedíamos. Ahora lo recoge Stripe una sola vez y nosotros lo leemos DEL
 * LADO DEL SERVIDOR al volver, en `/pago/confirmado`. El correo no viaja
 * nunca por la URL.
 *
 * ── Y la tarjeta, menos todavía ──
 *
 * Con la caja alojada de Stripe, el número de tarjeta no pasa ni cerca de
 * nuestro dominio. Es la forma más estrecha posible del alcance de PCI DSS y
 * es regla dura del proyecto: ANDEX no toca datos de tarjeta.
 *
 * Los monederos —Apple Pay, Google Pay— tampoco se pintan aquí: los ofrece
 * la propia caja de Stripe según el dispositivo, que sabe cuál está
 * disponible mejor que nosotros.
 */

export type PagoScreenProps = {
  copy: PagoDirectoDict;
  marca: string;
  /** Los cuatro nombres del recorrido y «Paso 2 de 4», ya compuestos. */
  pasos: readonly string[];
  pasoActual: string;
  /** Cadencia preseleccionada. */
  planInicial: PlanType;
  /** Modo demo: no hay pasarela y la pantalla lo dice. */
  demo: boolean;
  demoAviso?: string;
  className?: string;
};

export function PagoScreen({
  copy: t,
  marca,
  pasos,
  pasoActual,
  planInicial,
  demo,
  demoAviso,
  className,
}: PagoScreenProps) {
  const [plan, setPlan] = useState<PlanType>(planInicial);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const idError = useId();

  const anual = plan === "annual";

  /**
   * Al pulsar, el servidor abre la sesión de pago y devuelve a dónde ir.
   *
   * El plan viaja en el cuerpo del POST y no en la URL. Es una preferencia
   * comercial, no un dato de la persona, pero el hábito de no meter estado
   * del usuario en una dirección se mantiene también cuando es inofensivo:
   * la excepción de hoy es la costumbre de mañana.
   */
  const pagar = useCallback(async () => {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await fetch("/api/checkout/directo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const datos = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !datos.url) throw new Error(datos.error ?? "sin destino");
      /* `assign` y no `router.push`: la caja de Stripe está en OTRO dominio,
         y el enrutador de Next sólo sabe navegar dentro de éste. */
      window.location.assign(datos.url);
    } catch {
      setEnviando(false);
      setError(t.errorPasarela);
    }
  }, [enviando, plan, t.errorPasarela]);

  return (
    <main
      id="contenido"
      className={cn(
        "relative isolate min-h-dvh w-full overflow-hidden bg-navy-body text-[color:var(--text-on-invert)]",
        className,
      )}
    >
      <div aria-hidden="true" className="hero-fondo -z-10">
        <span className="masa-2" />
        <span className="reflejo" />
      </div>

      <div className="border-b border-[color:var(--hairline-on-invert-soft)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link href={ROUTES.landing} className="flex min-h-11 items-center">
            <span className="font-heading text-h3 font-bold tracking-tight text-[color:var(--text-on-invert)]">
              {marca}
            </span>
          </Link>
          <PasosEmbudo pasos={pasos} actual={2} etiqueta={pasoActual} className="flex-1 lg:flex-none" />
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14">
        {/* ══ Elegir y pagar ══ */}
        <div>
          <p className="text-caption font-bold uppercase tracking-[0.18em] text-[color:var(--text-on-invert-quiet)]">
            {t.eyebrow}
          </p>
          <h1 className="mt-4 font-heading text-h1 text-[color:var(--text-on-invert)] sm:text-display">
            {t.heading}
          </h1>
          <p className="mt-3 max-w-[52ch] text-body leading-[1.55] text-[color:var(--text-on-invert-quiet)] sm:text-body-lg">
            {t.lead}
          </p>

          {demo && demoAviso ? (
            <p className="mt-6 rounded-xl border border-[color:var(--amber-500)] bg-[color:var(--surface-on-invert)] px-4 py-3 text-body text-[color:var(--text-on-glass-amber)]">
              {demoAviso}
            </p>
          ) : null}

          {/* Los dos planes: mensual primero, anual recomendado. */}
          <fieldset className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-center">
            <legend className="sr-only">{t.planesAria}</legend>

            <PlanOpcion
              nombre={t.mensual.name}
              precio={t.mensual.price}
              periodo={t.mensual.period}
              detalle={t.mensual.detail}
              elegido={!anual}
              selectedAria={t.planSelected}
              onSelect={() => setPlan("monthly")}
            />
            <PlanOpcion
              nombre={t.anual.name}
              precio={t.anual.price}
              periodo={t.anual.period}
              detalle={t.anual.detail}
              ahorro={t.anual.savings}
              distintivo={t.anual.badge}
              elegido={anual}
              selectedAria={t.planSelected}
              onSelect={() => setPlan("annual")}
            />
          </fieldset>

          {/* Qué va a pasar al pulsar, dicho ANTES de pulsar. Se sale del
              sitio hacia otro dominio, y quien no lo espera lo lee como que
              algo se rompió — o peor, como que le sacaron de la página. */}
          <p className="mt-8 text-body leading-[1.5] text-[color:var(--text-on-invert-quiet)]">
            {t.despues}
          </p>

          <button
            type="button"
            onClick={pagar}
            disabled={enviando}
            aria-describedby={error ? idError : undefined}
            className="ax-btn btn-accent btn-lg wide brillo mt-5"
          >
            {enviando ? t.procesando : t.cta}
          </button>

          {error ? (
            <p
              id={idError}
              role="alert"
              className="mt-3 text-label leading-[1.45] text-[color:var(--text-on-glass-amber)]"
            >
              {error}
            </p>
          ) : null}

          <p className="mt-4 text-caption leading-[1.55] text-[color:var(--text-on-invert-quiet)]">
            {t.legal}
          </p>
        </div>

        {/* ══ El resumen ══ */}
        <div className="lg:pt-4">
          <div className="vidrio legible p-5 sm:p-6">
            <p className="text-caption font-bold uppercase tracking-[0.18em] text-[color:var(--teal-200)]">
              {t.resumen.title}
            </p>

            <div className="mt-5 flex items-baseline justify-between gap-4">
              <span className="text-body font-semibold text-[color:var(--text-on-invert)]">
                {t.resumen.concepto}
              </span>
              <span className="text-body font-extrabold tabular-nums text-[color:var(--text-on-invert)]">
                {t.resumen.importe}
              </span>
            </div>
            <p className="mt-1.5 text-caption text-[color:var(--text-on-invert-quiet)]">
              {t.resumen.cadencia}
            </p>

            <div aria-hidden="true" className="my-5 h-px bg-[color:var(--hairline-on-invert-soft)]" />

            <div className="flex items-baseline justify-between gap-4">
              <span className="text-body-lg font-extrabold text-[color:var(--text-on-invert)]">
                {t.resumen.total}
              </span>
              <span className="font-heading text-h2 tabular-nums text-[color:var(--text-on-invert)]">
                {t.resumen.importe}
              </span>
            </div>

            <ul className="mt-5 border-t border-[color:var(--hairline-on-invert-soft)] pt-4">
              {t.resumen.garantias.map((g) => (
                <li key={g} className="flex gap-3 py-2">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-wash-invert)]"
                  >
                    <Check
                      className="size-3 text-[color:var(--text-on-invert-accent)]"
                      strokeWidth={3}
                    />
                  </span>
                  <span className="min-w-0 text-label leading-[1.45] text-[color:var(--text-on-glass-quiet)]">
                    {g}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Quién cobra y qué no tocamos. Pegado al resumen porque es aquí
              donde surge la pregunta, no en una nota al pie. */}
          <div className="mt-4 flex gap-3 rounded-xl border border-[color:var(--hairline-on-invert-soft)] p-4">
            <Lock
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-[color:var(--text-on-invert-accent)]"
            />
            <p className="text-caption leading-[1.5] text-[color:var(--text-on-invert-quiet)]">
              {t.pasarela}
            </p>
          </div>

          <p className="mt-5 text-center text-caption text-[color:var(--text-on-invert-quiet)]">
            {t.yaTengoCuenta}{" "}
            <Link
              href={ROUTES.login}
              className="text-[color:var(--teal-200)] underline decoration-[color:var(--hairline-on-invert)] underline-offset-4"
            >
              {t.iniciarSesion}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

/**
 * Una opción de plan. Radio real debajo, tarjeta enmarcada encima: la elegida
 * se marca con filete de acento y palomita, sin invertir la superficie —
 * invertirla dejaría las dos tarjetas sin poder compararse justo cuando hay
 * que compararlas.
 */
function PlanOpcion({
  nombre,
  precio,
  periodo,
  detalle,
  ahorro,
  distintivo,
  elegido,
  selectedAria,
  onSelect,
}: {
  nombre: string;
  precio: string;
  periodo: string;
  detalle: string;
  ahorro?: string;
  distintivo?: string;
  elegido: boolean;
  selectedAria: string;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "vidrio legible relative cursor-pointer border-2 p-5 transition-colors duration-200",
        elegido
          ? "border-[color:var(--text-on-invert-accent)]"
          : "border-[color:var(--hairline-on-invert-soft)]",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus-ring)]",
      )}
    >
      <input
        type="radio"
        name="plan"
        checked={elegido}
        onChange={onSelect}
        className="sr-only"
      />

      {distintivo ? (
        <span className="absolute -top-3 right-5 rounded-full bg-[color:var(--text-on-invert-accent)] px-3 py-1 text-caption font-extrabold uppercase tracking-wide text-[color:var(--navy-900)]">
          {distintivo}
        </span>
      ) : null}

      <span className="flex items-center justify-between gap-3">
        <span className="text-body font-semibold text-[color:var(--text-on-invert)]">
          {nombre}
        </span>
        {elegido ? <span className="sr-only">{selectedAria}</span> : null}
        <span
          aria-hidden="true"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200",
            elegido
              ? "border-[color:var(--text-on-invert-accent)] bg-[color:var(--text-on-invert-accent)]"
              : "border-[color:var(--hairline-on-invert)]",
          )}
        >
          {elegido ? (
            <Check className="size-4 text-[color:var(--navy-900)]" strokeWidth={3} />
          ) : null}
        </span>
      </span>

      <span className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <span className="font-heading text-h1 tabular-nums text-[color:var(--text-on-invert)]">
          {precio}
          <span className="text-body-lg font-bold text-[color:var(--text-on-invert-quiet)]">
            {periodo}
          </span>
        </span>
        {ahorro ? (
          <span className="rounded-full bg-[color:var(--surface-on-invert)] px-2.5 py-1 text-caption font-semibold tabular-nums text-[color:var(--text-on-glass-amber)]">
            {ahorro}
          </span>
        ) : null}
      </span>

      <span className="mt-2 block text-label text-[color:var(--text-on-invert-quiet)]">
        {detalle}
      </span>
    </label>
  );
}
