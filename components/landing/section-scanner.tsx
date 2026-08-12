"use client";

/**
 * PRUÉBALO AHORA — el escáner funcionando en la landing, sin registro.
 *
 * Es la demostración de valor más barata y convincente que tiene el
 * producto: en vez de contar que resuelve un problema, lo resuelve delante
 * del visitante, gratis y sin pedirle nada.
 *
 * ── Por qué la descarga es libre ───────────────────────────────────────
 *
 * Cobrar por descargar lo que la persona acaba de crear es, para esta
 * audiencia, el mismo patrón del que ya la estafaron: "servicio gratis…
 * ahora paga para bajarlo". §3.4.1 es explícito — cada elemento existe para
 * REDUCIR la sospecha, no para aumentar la urgencia.
 *
 * Así que el PDF se entrega entero, sin marca de agua y sin correo. Lo que
 * se cobra es lo que de verdad duele: que ese archivo se pierda en la
 * carpeta de Descargas y que nadie avise cuando el documento venza. Ese
 * argumento funciona porque es cierto, y se puede decir sin retener nada.
 *
 * ── Cuándo se carga ────────────────────────────────────────────────────
 * El escáner (worker, canvas, generador de PDF) NO viaja con la página:
 * llega cuando alguien pulsa el botón.
 *
 * Esto NO limita lo que el escáner puede pesar (D61 derogó el peso como
 * criterio). Es sólo el sitio donde se carga: la portada es lo que decide
 * si alguien se registra, así que no puede tragarse el motor completo para
 * la mayoría que nunca lo va a pulsar. Cargar en diferido resuelve las dos
 * cosas a la vez — el escáner puede crecer todo lo que necesite.
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Loader2, ScanLine, ShieldCheck } from "lucide-react";
import type { ScannedPage } from "@/lib/scanner";
import type { ScannerFlowCopy } from "@/components/vault/scanner-flow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CtaLink } from "./cta-link";
import { trackLazy } from "./track-lazy";

/**
 * Carga diferida de verdad: el chunk del escáner se pide cuando este
 * componente se monta, y sólo se monta al pulsar el botón.
 */
const ScannerFlow = dynamic(
  () => import("@/components/vault/scanner-flow").then((m) => m.ScannerFlow),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="fixed inset-0 z-50 flex items-center justify-center bg-page"
      >
        <Loader2 aria-hidden="true" className="size-8 animate-spin text-teal-deep" />
      </div>
    ),
  },
);

export type SectionScannerCopy = {
  eyebrow: string;
  title: string;
  body: string;
  /** Tres garantías cortas: sin registro, sin tarjeta, no sale del teléfono. */
  assurances: readonly string[];
  cta: string;
  /** Estado tras generar el PDF. */
  doneTitle: string;
  pitchTitle: string;
  pitchBody: string;
  pitchBenefits: readonly string[];
  pitchCta: string;
  scanAgain: string;
};

export type SectionScannerProps = {
  copy: SectionScannerCopy;
  /** Copy del flujo de escaneo, compartido con la Bóveda. */
  scanCopy: ScannerFlowCopy;
  ctaHref: string;
  id?: string;
  className?: string;
};

export function SectionScanner({
  copy,
  scanCopy,
  ctaHref,
  id = "probar",
  className,
}: SectionScannerProps) {
  const reduced = useReducedMotion();
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);
  const pitchRef = useRef<HTMLDivElement>(null);

  function start() {
    trackLazy("vault_scan_started", { source: "landing" });
    setScanning(true);
  }

  function handleComplete(_pdf: Blob, pages: ScannedPage[]) {
    // El PDF ya se descargó solo: aquí el objetivo es que se lo lleve, no
    // retenerlo. Lo que queda es explicar qué le falta a ese archivo suelto.
    trackLazy("vault_document_saved", {
      folder: "guest",
      page_count: pages.length,
      has_expiry: false,
    });
    setScanning(false);
    setDone(true);
  }

  /**
   * El escáner ocupa toda la pantalla; al cerrarse, la página vuelve a donde
   * estaba y el argumento queda por debajo del pliegue. Justo en el instante
   * de mayor intención —acaba de ver que funciona— tendría que salir a
   * buscarlo. Así que lo traemos nosotros, y le damos el foco para que quien
   * usa lector de pantalla escuche el resultado en vez de volver al principio.
   */
  useEffect(() => {
    if (!done) return;
    const el = pitchRef.current;
    if (!el) return;
    el.scrollIntoView({
      block: "center",
      behavior: reduced ? "auto" : "smooth",
    });
    el.focus({ preventScroll: true });
  }, [done, reduced]);

  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={cn("bg-surface px-4 py-16 sm:py-20", className)}
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
          {copy.eyebrow}
        </p>
        <h2
          id={`${id}-titulo`}
          className="mt-2 font-heading text-h1 text-ink lg:text-display"
        >
          {copy.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-body-lg text-muted">{copy.body}</p>

        {/* Las tres objeciones, respondidas antes de que se formulen. */}
        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
          {copy.assurances.map((item) => (
            <li key={item} className="flex items-center gap-1.5 text-body text-ink">
              <Check aria-hidden="true" className="size-4 shrink-0 text-teal-deep" />
              {item}
            </li>
          ))}
        </ul>

        {done ? (
          <motion.div
            ref={pitchRef}
            tabIndex={-1}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 text-left outline-none"
          >
            <p className="flex items-center justify-center gap-2 text-body font-semibold text-success">
              <Check aria-hidden="true" className="size-5 shrink-0" />
              {copy.doneTitle}
            </p>

            {/* El argumento de venta. No retiene nada: explica lo que le
                falta al archivo que la persona ya tiene en la mano. */}
            <div className="mt-6 rounded-xl border-2 border-teal-deep bg-teal-soft p-6 sm:p-8">
              <h3 className="font-heading text-h2 text-ink">{copy.pitchTitle}</h3>
              <p className="mt-3 text-body text-ink">{copy.pitchBody}</p>

              <ul className="mt-5 space-y-2.5">
                {copy.pitchBenefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2.5 text-body text-ink">
                    <ShieldCheck
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-teal-deep"
                    />
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center">
                <CtaLink position="scanner" href={ctaHref} size="lg" className="group">
                  {copy.pitchCta}
                  <ArrowRight
                    aria-hidden="true"
                    className="ml-2 inline size-5 transition-transform duration-200 group-hover:translate-x-1"
                  />
                </CtaLink>
                <Button variant="ghost" onClick={start}>
                  {copy.scanAgain}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="mt-9">
            <Button size="lg" onClick={start} className="group w-full sm:w-auto">
              <ScanLine
                aria-hidden="true"
                className="mr-2 inline size-5 transition-transform duration-200 group-hover:scale-110"
              />
              {copy.cta}
            </Button>
          </div>
        )}
      </div>

      {scanning ? (
        <ScannerFlow
          copy={scanCopy}
          // Aquí SÍ se descarga sola: en la landing el objetivo es que se
          // lleve el archivo, no que lo guarde en una bóveda que aún no tiene.
          autoDownload
          fileName="documento-andex"
          onComplete={handleComplete}
          onCancel={() => setScanning(false)}
        />
      ) : null}
    </section>
  );
}
