"use client";

/**
 * LANDING · LOS MÓDULOS, MAESTRO-DETALLE
 *
 * A la izquierda los siete; a la derecha, el que esté elegido. Es la
 * maqueta: se pulsa uno y su detalle aparece al lado.
 *
 * ── Por qué en móvil NO es maestro-detalle ──
 *
 * A 390px no hay «al lado»: el detalle caería debajo del selector y al
 * pulsar el cuarto módulo el texto aparecería fuera de la pantalla, sin
 * que nada avise de que algo cambió. En móvil se convierte en una lista
 * donde cada módulo lleva su propio texto siempre visible — misma
 * información, sin un cambio que no se ve.
 *
 * ── Los cuatro que no abren siguen estando ──
 *
 * Aparecen con su insignia. Esconder lo que falta hasta que esté listo es
 * cómodo pero deshonesto: quien paga tiene derecho a saber qué está
 * comprando y qué todavía no.
 *
 * ── Accesibilidad ──
 *
 * El selector es un `tablist` de verdad, con flechas del teclado, porque
 * eso es exactamente lo que hace: elegir cuál de siete paneles se ve.
 */

import { useId, useRef, useState } from "react";
import {
  Briefcase,
  Check,
  Building2,
  GraduationCap,
  Landmark,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { MODULES } from "@/lib/catalogs/modules";
import { ROUTES } from "@/lib/config";
import type { ModuleId, ModuleSlug } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Glyph, KitBadge, type IconComponent } from "@/components/ui/kit";
import { Button } from "@/components/ui/button";
import type { LandingDict } from "@/lib/i18n/dictionaries/landing";

const GLIFO: Record<ModuleSlug, { icon: IconComponent; name: string }> = {
  boveda: { icon: ShieldCheck, name: "shield" },
  migracion: { icon: Landmark, name: "landmark" },
  finanzas: { icon: Wallet, name: "wallet" },
  negocio: { icon: Building2, name: "building-2" },
  comunidad: { icon: Users, name: "users" },
  academia: { icon: GraduationCap, name: "graduation-cap" },
  empleo: { icon: Briefcase, name: "briefcase" },
};

export type SectionShowcaseProps = {
  copy: LandingDict["showcase"];
  /**
   * Cada módulo ya resuelto por el servidor: nombre, para qué sirve y las
   * cuatro cosas concretas que se pueden hacer dentro.
   *
   * Las cuatro son lo que llena el panel. Con sólo el nombre y una línea
   * quedaba casi vacío, y un panel vacío al lado de siete botones parece
   * que la elección no ha hecho nada.
   */
  modules: readonly {
    id: ModuleId;
    slug: ModuleSlug;
    name: string;
    body: string;
    features: readonly string[];
  }[];
};

export function SectionShowcase({ copy, modules }: SectionShowcaseProps) {
  const [activo, setActivo] = useState(0);
  const baseId = useId();
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  /** Flechas: es un `tablist`, y un `tablist` se recorre con el teclado. */
  function alTeclear(e: React.KeyboardEvent, i: number) {
    const salto = e.key === "ArrowDown" || e.key === "ArrowRight"
      ? 1
      : e.key === "ArrowUp" || e.key === "ArrowLeft"
        ? -1
        : 0;
    if (!salto) return;
    e.preventDefault();
    const siguiente = (i + salto + modules.length) % modules.length;
    setActivo(siguiente);
    botones.current[siguiente]?.focus();
  }

  const elegido = modules[activo];
  const estado = MODULES.find((m) => m.slug === elegido?.slug)?.status;

  return (
    <section
      id="modulos"
      aria-labelledby="showcase-titulo"
      className="relative bg-navy-body text-[color:var(--text-on-invert)]"
    >
      {/* El ancho y el aire viven en un envoltorio: el fondo tiene que ir a
          sangre para que la costura de arco de arriba encaje con él. */}
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
      <Reveal className="max-w-3xl">
        <p className="text-caption font-bold uppercase tracking-widest text-[color:var(--teal-200)]">
          {copy.eyebrow}
        </p>
        <h2 id="showcase-titulo" className="mt-3 font-heading text-h1 text-[color:var(--text-on-invert)] sm:text-display">
          {copy.title}
        </h2>
      </Reveal>

      {/* ── Escritorio: maestro-detalle ── */}
      <div className="mt-10 hidden gap-8 lg:mt-14 lg:grid lg:grid-cols-[minmax(0,20rem)_1fr]">
        <div
          role="tablist"
          aria-label={copy.pickerLabel}
          aria-orientation="vertical"
          className="flex flex-col gap-1.5 border-r border-[color:var(--hairline-on-invert-soft)] pr-6"
        >
          {modules.map((m, i) => {
            const g = GLIFO[m.slug];
            const activoEste = i === activo;
            return (
              <button
                key={m.id}
                ref={(n) => {
                  botones.current[i] = n;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${m.id}`}
                aria-selected={activoEste}
                aria-controls={`${baseId}-panel-${m.id}`}
                tabIndex={activoEste ? 0 : -1}
                onClick={() => setActivo(i)}
                onKeyDown={(e) => alTeclear(e, i)}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-lg px-3 text-left transition-colors",
                  activoEste
                    ? "bg-[color:var(--accent-wash-invert)] text-[color:var(--text-on-invert)]"
                    : "text-[color:var(--text-on-invert-quiet)] hover:bg-[color:var(--surface-on-invert)] hover:text-[color:var(--text-on-invert)]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-md",
                    activoEste
                      ? "bg-[color:var(--text-on-invert-accent)] text-[color:var(--navy-900)]"
                      : "bg-[color:var(--surface-on-invert)] text-[color:var(--text-on-invert-quiet)]",
                  )}
                >
                  <Glyph name={g.name} icon={g.icon} size={20} />
                </span>
                <span className="min-w-0 text-body font-semibold">{m.name}</span>
              </button>
            );
          })}
        </div>

        {elegido ? (
          <div
            role="tabpanel"
            id={`${baseId}-panel-${elegido.id}`}
            aria-labelledby={`${baseId}-tab-${elegido.id}`}
            tabIndex={0}
            className="min-w-0"
          >
            {estado !== "live" ? (
              <KitBadge tone="building">{copy.building}</KitBadge>
            ) : null}
            <h3 className="mt-3 font-heading text-h1 text-[color:var(--text-on-invert)]">{elegido.name}</h3>
            <p className="mt-4 max-w-2xl text-body-lg text-[color:var(--text-on-invert-quiet)]">{elegido.body}</p>

            <ul className="mt-6 max-w-2xl space-y-3">
              {elegido.features.map((f) => (
                <li key={f} className="flex gap-3 border-t border-[color:var(--hairline-on-invert-soft)] pt-3 text-body text-[color:var(--text-on-invert)]">
                  <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[color:var(--text-on-invert-accent)]" />
                  <span className="min-w-0">{f}</span>
                </li>
              ))}
            </ul>

            <Button href={ROUTES.registro} className="mt-8">
              {copy.explore}
            </Button>
          </div>
        ) : null}
      </div>

      {/* ── Móvil: lista, no maestro-detalle ──
          A 390px no hay «al lado»: el detalle caería fuera de la pantalla y
          el cambio ocurriría sin que nadie lo viera. */}
      <RevealGroup as="ul" className="mt-9 grid grid-cols-1 gap-3 lg:hidden">
        {modules.map((m) => {
          const g = GLIFO[m.slug];
          const suEstado = MODULES.find((x) => x.slug === m.slug)?.status;
          return (
            <RevealItem
              as="li"
              key={m.id}
              className="vidrio plano p-4"
            >
              {/* La insignia va DEBAJO del titulo, no a su lado. En la misma
                  fila su ancho es fijo —no parte la frase— y a 390px dejaba
                  unos cien pixeles al titulo: «Tramites y Estatus Migratorio»
                  caia en cuatro lineas de dos palabras. Medido a 390px. */}
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-wash-invert)] text-[color:var(--text-on-invert-accent)]"
                >
                  <Glyph name={g.name} icon={g.icon} size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-h3 text-[color:var(--text-on-invert)]">{m.name}</h3>
                  {suEstado !== "live" ? (
                    <p className="mt-2">
                      <KitBadge tone="building">{copy.building}</KitBadge>
                    </p>
                  ) : null}
                </div>
              </div>
              <p className="mt-2.5 text-body text-[color:var(--text-on-invert-quiet)]">{m.body}</p>
              <ul className="mt-3 space-y-2">
                {m.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-caption text-[color:var(--text-on-invert-quiet)]">
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[color:var(--text-on-invert-accent)]" />
                    <span className="min-w-0">{f}</span>
                  </li>
                ))}
              </ul>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <div className="mt-9 lg:hidden">
        <Button href={ROUTES.registro} fullWidth>
          {copy.explore}
        </Button>
      </div>
      </div>
    </section>
  );
}
