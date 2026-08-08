/**
 * S3 · CINTA DE CONFIANZA — banda estrecha entre el hero y la comparativa.
 *
 * Es el respiro de la página: después del hero (denso, alto, con La Ruta) y
 * antes de la sección emocional. Por eso es lo más bajo y lo más callado de
 * toda la landing — una sola línea de aire sobre `bg-surface`, cerrada arriba
 * y abajo por `border-line`.
 *
 * ── Qué NO es (§6 del PRD, obligatorio) ────────────────────────────────
 * Los portales de gobierno son DESTINOS a los que guiamos, no respaldos. Por
 * eso van como texto tipográfico y NUNCA como logo: dibujar el sello de USCIS
 * o del IRS afirmaría visualmente una afiliación que el disclaimer de abajo
 * niega por escrito. Un logotipo inventado además sería una marca falsa.
 * Las dos alianzas sí son reales y van en su propio bloque, separado por una
 * regla vertical, para que nadie las lea como "socios del gobierno".
 *
 * ── Movimiento ─────────────────────────────────────────────────────────
 * DESCARTADA la marquesina infinita en móvil. WCAG 2.2.2 exige un mecanismo
 * para pausar cualquier contenido en movimiento automático que dure más de
 * cinco segundos, y aquí el contenido es justo el que hay que LEER: son los
 * cuatro nombres que sostienen la credibilidad de la página. Un bucle sin
 * pausa obliga a esperar a que "USCIS" vuelva a pasar.
 * En su lugar: los nombres entran escalonados y se quedan quietos — la
 * sensación de teletipo que aterriza, sin el bucle. A 320px envuelven en
 * varias líneas, que es exactamente lo que hace falta para que se lean.
 * (Si el dueño del producto prefiere la marquesina, el cambio vive entero
 * en este archivo; queda anotado en el reporte.)
 *
 * Server Component: no hay interacción. Lo único que se hidrata es el par
 * <RevealGroup>/<RevealItem>, que ya respeta `prefers-reduced-motion`.
 */

import { RevealGroup, RevealItem } from "@/components/motion/reveal";

export type TrustSectionCopy = {
  /** "Te guiamos paso a paso hacia los portales oficiales" */
  eyebrow: string;
  /** USCIS · IRS · DMV · EOIR. Nombres, nunca logos. */
  portals: readonly string[];
  /** "Con el ecosistema de" */
  alliancesEyebrow: string;
  /** Las dos alianzas REALES. No se inventan marcas. */
  alliances: readonly string[];
  /** Aviso §6: ANDEX no está afiliado a ninguna agencia gubernamental. */
  disclaimer: string;
};

export type SectionTrustProps = {
  copy: TrustSectionCopy;
};

/** Regla vertical fina entre nombres. Decorativa: fuera del árbol a11y. */
function Divider() {
  return <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-line" />;
}

const EYEBROW_CLASS =
  "text-caption font-semibold uppercase tracking-widest text-muted";

/** Tratamiento tipográfico compartido por portales y alianzas. */
const NAME_CLASS = "font-heading text-body font-semibold text-ink";

export function SectionTrust({ copy }: SectionTrustProps) {
  return (
    <section
      id="confianza"
      aria-labelledby="confianza-titulo"
      className="border-y border-line bg-surface px-4 py-7 sm:py-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          {/* ── Portales oficiales: el bloque principal ── */}
          <div className="min-w-0 flex-1">
            <p id="confianza-titulo" className={EYEBROW_CLASS}>
              {copy.eyebrow}
            </p>
            <RevealGroup
              as="ul"
              stagger={0.09}
              className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2"
            >
              {copy.portals.map((portal, index) => (
                <RevealItem
                  as="li"
                  key={portal}
                  className="flex items-center gap-3"
                >
                  <span className={NAME_CLASS}>{portal}</span>
                  {index < copy.portals.length - 1 ? <Divider /> : null}
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          {/* Separación real entre "a dónde te llevamos" y "con quién vamos".
              En móvil el salto de línea ya las separa; en escritorio hace
              falta la regla para que no se lean como una sola lista. */}
          <span
            aria-hidden="true"
            className="hidden w-px self-stretch bg-line lg:block"
          />

          {/* ── Alianzas reales ── */}
          <div className="min-w-0">
            <p className={EYEBROW_CLASS}>{copy.alliancesEyebrow}</p>
            <RevealGroup
              as="ul"
              stagger={0.09}
              className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2"
            >
              {copy.alliances.map((ally, index) => (
                <RevealItem
                  as="li"
                  key={ally}
                  className="flex items-center gap-3"
                >
                  <span className={NAME_CLASS}>{ally}</span>
                  {index < copy.alliances.length - 1 ? <Divider /> : null}
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>

        {/* §6: el aviso viaja pegado a los nombres que lo hacen necesario.
            Separarlo al pie sería esconderlo. */}
        <p className="mt-6 border-t border-line pt-4 text-caption text-muted">
          {copy.disclaimer}
        </p>
      </div>
    </section>
  );
}
