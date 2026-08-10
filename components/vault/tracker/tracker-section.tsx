"use client";

/**
 * BÓVEDA · CONSULTA GUIADA — los cuatro trámites.
 *
 * §6 manda, y aquí no es letra pequeña: **ANDEX no está afiliado a ninguna
 * agencia del gobierno y estas consultas son gratuitas**. Va arriba, con el
 * mismo cuerpo de texto que todo lo demás y visible tanto en la lista como
 * mientras se sigue un trámite, porque el fraude que sufre este público
 * consiste exactamente en cobrar por lo que es gratis.
 *
 * La lista y el detalle comparten sitio: al elegir un trámite, el detalle
 * sustituye a la lista y el foco se va a su título. Al volver, el foco
 * regresa a la tarjeta desde la que se salió — nadie se pierde a mitad de
 * camino.
 */

import { useRef, useState } from "react";
import { ChevronRight, Landmark } from "lucide-react";
import type { VaultCommonCopy, VaultTrackerCopy } from "../vault-format";
import {
  TRACKER_FLOWS,
  TRACKER_ICONS,
  TrackerFlow,
  type TrackerFlowId,
} from "./tracker-flow";

export type TrackerSectionProps = {
  copy: VaultTrackerCopy;
  common: VaultCommonCopy;
  /** Id del <h2> para atarlo a la sección. */
  headingId: string;
  className?: string;
};

export function TrackerSection({
  copy,
  common,
  headingId,
  className,
}: TrackerSectionProps) {
  const [active, setActive] = useState<TrackerFlowId | null>(null);
  const triggers = useRef<Partial<Record<TrackerFlowId, HTMLButtonElement | null>>>({});

  function close() {
    const previous = active;
    setActive(null);
    // El foco vuelve a la tarjeta de la que se salió, ya en el DOM otra vez.
    window.requestAnimationFrame(() => {
      if (previous) triggers.current[previous]?.focus();
    });
  }

  return (
    <section
      aria-labelledby={headingId}
      className={className}
    >
      <h2 id={headingId} className="font-heading text-h2 text-ink">
        {copy.title}
      </h2>
      <p className="mt-1 text-body text-muted">{copy.subtitle}</p>

      {/* El aviso de §6, arriba y con cuerpo de texto normal. */}
      <p className="mt-3 flex items-start gap-2.5 rounded-lg bg-amber-soft p-3.5 text-body text-ink">
        <Landmark aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-deep" />
        <span className="min-w-0">{copy.disclaimer}</span>
      </p>

      <div className="mt-4">
        {active ? (
          <TrackerFlow id={active} copy={copy} common={common} onBack={close} />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {TRACKER_FLOWS.map((id) => {
              const Icon = TRACKER_ICONS[id];
              return (
                <li key={id}>
                  <button
                    type="button"
                    ref={(node) => {
                      triggers.current[id] = node;
                    }}
                    onClick={() => setActive(id)}
                    className="flex min-h-11 w-full items-start gap-3 rounded-lg border border-line bg-surface p-3.5 text-left shadow-sm transition-colors hover:border-muted hover:bg-surface-alt"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-soft text-teal-deep"
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-medium text-ink">
                        {copy[id].name}
                      </span>
                      <span className="mt-1 block text-caption text-muted">
                        {copy[id].summary}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="mt-2.5 size-5 shrink-0 text-muted"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
