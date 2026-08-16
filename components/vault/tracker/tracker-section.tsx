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
import { ArrowUpRight, Landmark } from "lucide-react";
import { ListGroup, ListRow, SectionLabel } from "@/components/ui/kit";
import type { VaultCommonCopy, VaultTrackerCopy } from "../vault-format";
import {
  TRACKER_FLOWS,
  TRACKER_ICONS,
  TRACKER_ICON_NAMES,
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
      {/* Un rótulo, no un titular. Era el único `text-h2` de la pantalla,
          entre rótulos en versalitas: leía como si aquí empezara otra
          pantalla distinta, y no es eso — es la última sección de ésta. */}
      <SectionLabel as="h2" id={headingId}>
        {copy.title}
      </SectionLabel>
      <p className="text-body text-muted">{copy.subtitle}</p>

      {/* El aviso de §6, arriba y con cuerpo de texto normal. */}
      <p className="mt-3 flex items-start gap-2.5 rounded-md bg-amber-soft p-3.5 text-body text-ink">
        <Landmark aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-deep" />
        <span className="min-w-0">{copy.disclaimer}</span>
      </p>

      <div className="mt-4">
        {active ? (
          <TrackerFlow id={active} copy={copy} common={common} onBack={close} />
        ) : (
          <ListGroup as="ul">
            {TRACKER_FLOWS.map((id) => {
              const Icon = TRACKER_ICONS[id];
              return (
                <li key={id}>
                  <ListRow
                    icon={Icon}
                    iconName={TRACKER_ICON_NAMES[id]}
                    title={copy[id].name}
                    meta={copy[id].summary}
                    buttonRef={(node) => {
                      triggers.current[id] = node;
                    }}
                    /* La flecha diagonal, no el galón: en el sistema de
                       diseño significa siempre «esto sale de la aplicación»,
                       y estas cuatro consultas terminan en el portal del
                       gobierno. El galón habría prometido que se resuelve
                       aquí dentro. */
                    trail={
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-disabled"
                      />
                    }
                    onClick={() => setActive(id)}
                  />
                </li>
              );
            })}
          </ListGroup>
        )}
      </div>
    </section>
  );
}
