import type { LocationContext } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * La Ruta — <RouteBar /> (§2.8, spec exacta):
 *
 *   Nodo:        11px · radius-full · --line
 *   Nodo done:   --teal-deep
 *   Nodo now:    13px · --teal · halo 5px --teal-soft
 *   Nodo seal:   18px · --amber · halo 5px --amber-soft (solo nodo 6 en step 6)
 *   Conector:    1.5px · --line → --teal-deep cuando done
 *   Glifo fork:  dos trazos de 11px a ±32° convergiendo en el nodo 2
 *   Transición:  .35s nodos · .4s conectores
 *
 * (Clases .rb-* al final de globals.css, tamaños en rem.)
 *
 * RESTRICCIÓN §2.8: aparece UNA sola vez por pantalla. Nunca como
 * divisor ni viñeta.
 *
 * Accesibilidad: el gráfico completo va aria-hidden; el CONSUMIDOR pone
 * el texto visible "Paso X de Y" (p. ej. vía <ProgressBar label>) para
 * lectores de pantalla.
 *
 * `context` codifica información real (§2.8: "en cada aparición dice
 * algo verdadero"): con context, solo el trazo de la rama del usuario
 * se enciende al pasar el nodo 2 — pre_arrival el superior, in_us el
 * inferior (mismo orden que el hero §3.1.1). Sin context, ambos.
 */

export type RouteBarStep = 1 | 2 | 3 | 4 | 5 | 6;

export type RouteBarProps = {
  step: RouteBarStep;
  context?: LocationContext;
  className?: string;
};

const NODES: RouteBarStep[] = [1, 2, 3, 4, 5, 6];

function nodeState(node: RouteBarStep, step: RouteBarStep): string | undefined {
  if (node === step) return node === 6 ? "seal" : "now";
  if (node < step) return "done";
  return undefined;
}

export function RouteBar({ step, context, className }: RouteBarProps) {
  const forkReached = step >= 2;
  const forkUpDone = forkReached && (context === undefined || context === "pre_arrival");
  const forkDownDone = forkReached && (context === undefined || context === "in_us");

  return (
    <div aria-hidden="true" data-context={context} className={cn("rb", className)}>
      {NODES.map((node) => (
        <span key={node} className="contents">
          {node > 1 ? (
            <span className="rb-connector" data-done={step >= node || undefined} />
          ) : null}
          <span className="rb-node" data-state={nodeState(node, step)}>
            {node === 2 ? (
              <>
                <span className="rb-fork rb-fork-up" data-done={forkUpDone || undefined} />
                <span className="rb-fork rb-fork-down" data-done={forkDownDone || undefined} />
              </>
            ) : null}
          </span>
        </span>
      ))}
    </div>
  );
}
