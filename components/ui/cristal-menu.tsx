"use client";

/**
 * BARRA EN CÁPSULA Y MENÚ FLOTANTE DE CRISTAL
 *
 * Cuatro pestañas, un botón «+» y un modal suspendido con la cuadrícula de
 * herramientas. Estilo Apple: cristal de zafiro oscuro, guijarros
 * redondeados y física de resorte.
 *
 * El material sigue al tema —crema de día, tinta de noche—, con bisel,
 * brillo a 160° y grano de vidrio esmerilado. Vive en su propia hoja,
 * `app/cristal.css`, porque es un lenguaje de superficie distinto al del
 * resto del sistema y conviene que sus bordes se vean.
 *
 * ── Decisiones que no son de estilo ──
 *
 * 0. **El «+» abre TODO lo que hay**: los siete módulos, la Tienda, las
 *    Inversiones, el Perfil y el escáner. Once, que con la equis llenan
 *    exactamente una rejilla de 3×4.
 *
 *    Se probó a convertirlo en un menú de acciones —que es lo que un «+»
 *    significa en iOS— y se volvió atrás a propósito: aquí el valor está
 *    en ver de un golpe todo lo que la suscripción incluye, y eso además
 *    devuelve los siete módulos a la navegación (§4.3) después de que el
 *    rediseño retirara la barra lateral que los listaba.
 *
 * 1. **Es un `<dialog>` nativo.** La trampa de foco, la tecla Escape, el
 *    fondo inerte y el `::backdrop` los da el navegador, bien hechos. Una
 *    reimplementación con `div` y `useEffect` deja fuera a quien navega
 *    con teclado o con lector, y aquí eso es medio público objetivo.
 *
 * 2. **El «+» no cambia de glifo al abrirse: gira 45°.** Es el mismo
 *    trazo, así que la transición es continua y no hay dos iconos que
 *    mantener sincronizados.
 *
 * 3. **El cierre espera a su animación.** `close()` inmediato corta el
 *    fotograma y el panel desaparece de golpe; se marca `cerrando`, se
 *    espera al `animationend` y entonces se cierra. Con
 *    `prefers-reduced-motion` no hay animación y el temporizador de
 *    seguridad lo cierra igual.
 *
 * 4. **Ningún texto vive aquí.** Todo entra por props desde `lib/i18n/`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Glyph, type IconComponent } from "./kit";

/** Duración de la contracción. Debe coincidir con `--dur-fast` del CSS. */
const CIERRE_MS = 160;

export type CristalTab = {
  href: string;
  label: string;
  icon: IconComponent;
  /** Nombre Lucide en kebab-case: es lo que activa el gesto del icono. */
  iconName: string;
  active?: boolean;
};

export type CristalTool = {
  key: string;
  label: string;
  icon: IconComponent;
  iconName: string;
  /** A dónde lleva. */
  href?: string;
  /** O qué ocurre aquí mismo, sin navegar. */
  onSelect?: () => void;
  /**
   * Todavía no abre. Se apaga el aspecto, NO el destino: su pantalla «En
   * construcción» dice qué se va a poder hacer y recoge qué necesitas
   * primero, así que es contenido real y no un callejón.
   */
  pending?: boolean;
};

export type CristalMenuProps = {
  tabs: readonly CristalTab[];
  tools: readonly CristalTool[];
  /** Rótulo de la cuadrícula. «Todo lo que hay», «Herramientas»… */
  category: string;
  labels: {
    /** Nombre accesible de la barra. */
    barAria: string;
    /** Nombre accesible del modal. */
    menuAria: string;
    open: string;
    close: string;
    /** Se lee tras el nombre de un módulo que todavía no abre. */
    pending: string;
  };
};

export function CristalMenu({ tabs, tools, category, labels }: CristalMenuProps) {
  const [abierto, setAbierto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const modalRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const masRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  /**
   * Al cambiar de pantalla, el menú se cierra SIEMPRE y de golpe.
   *
   * No es cosmético. `PanelShell` no se vuelve a montar al navegar —sólo
   * cambia lo de dentro—, así que este componente conserva su estado; y un
   * `<dialog>` abierto con `showModal()` deja **toda la página inerte**.
   * Si el cierre suave se quedaba a medias al tocar una herramienta —la
   * navegación ocurre antes de que llegue el `animationend`—, la pantalla
   * siguiente aparecía completa y no respondía a nada. Costó encontrarlo
   * porque no da ningún error: simplemente nada reacciona.
   */
  useEffect(() => {
    const modal = modalRef.current;
    if (modal?.open) modal.close();
    setAbierto(false);
    setCerrando(false);
  }, [pathname]);

  const cerrar = useCallback(() => {
    const modal = modalRef.current;
    if (!modal?.open || cerrando) return;
    setCerrando(true);

    let hecho = false;
    const terminar = () => {
      if (hecho) return;
      hecho = true;
      modal.close();
      setCerrando(false);
      setAbierto(false);
      // El foco vuelve al «+», que es de donde salió.
      masRef.current?.focus();
    };

    panelRef.current?.addEventListener("animationend", terminar, { once: true });
    // Red de seguridad: sin animación —`prefers-reduced-motion`, o una
    // pestaña en segundo plano— el evento no llega nunca y el modal se
    // quedaría abierto para siempre.
    window.setTimeout(terminar, CIERRE_MS + 120);
  }, [cerrando]);

  function abrir() {
    modalRef.current?.showModal();
    setAbierto(true);
  }

  // Escape y el botón «atrás» del navegador cierran el `<dialog>` por su
  // cuenta: hay que enterarse para que el «+» vuelva a su sitio.
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const alCerrar = () => {
      setAbierto(false);
      setCerrando(false);
    };
    modal.addEventListener("close", alCerrar);
    return () => modal.removeEventListener("close", alCerrar);
  }, []);

  /** Clic en el velo: el `<dialog>` ocupa toda la pantalla y el panel no. */
  function alPulsarFuera(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === modalRef.current) cerrar();
  }

  function elegir(tool: CristalTool) {
    tool.onSelect?.();
    cerrar();
  }

  return (
    <>
      <nav
        aria-label={labels.barAria}
        className={cn("cristal-barra", abierto && "sin-blur")}
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn("cristal-tab", tab.active && "on")}
          >
            {/* El trazo engorda en la activa: el estado no se dice sólo
                con color, que es refuerzo y nunca el mensaje. */}
            <Glyph
              name={tab.iconName}
              icon={tab.icon}
              size={22}
              strokeWidth={tab.active ? 2.2 : 1.7}
            />
            <span>{tab.label}</span>
          </Link>
        ))}

        <button
          ref={masRef}
          type="button"
          onClick={() => (abierto ? cerrar() : abrir())}
          aria-expanded={abierto}
          aria-label={abierto ? labels.close : labels.open}
          className="cristal-mas"
        >
          {/* Un solo glifo. Abierto, gira 45° y es una equis. */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </nav>

      <dialog
        ref={modalRef}
        onClick={alPulsarFuera}
        onCancel={(e) => {
          // Escape: se intercepta para que se contraiga en vez de
          // desaparecer de golpe.
          e.preventDefault();
          cerrar();
        }}
        aria-label={labels.menuAria}
        className={cn("cristal-modal", cerrando && "cerrando")}
      >
        <div ref={panelRef} className={cn("cristal-panel", cerrando && "cerrando")}>
          <span aria-hidden="true" className="cristal-grabber" />
          <span className="cristal-categoria">{category}</span>

          <div className="cristal-rejilla">
            {tools.map((tool) => {
              const contenido = (
                <>
                  <Glyph name={tool.iconName} icon={tool.icon} size={24} />
                  <span className="cristal-etiqueta">{tool.label}</span>
                  {tool.pending ? (
                    <span className="sr-only">{labels.pending}</span>
                  ) : null}
                </>
              );

              if (tool.href) {
                return (
                  <Link
                    key={tool.key}
                    href={tool.href}
                    onClick={cerrar}
                    className={cn("cristal-accion", tool.pending && "pendiente")}
                  >
                    {contenido}
                  </Link>
                );
              }

              return (
                <button
                  key={tool.key}
                  type="button"
                  onClick={() => elegir(tool)}
                  className={cn("cristal-accion", tool.pending && "pendiente")}
                >
                  {contenido}
                </button>
              );
            })}

            {/* La equis, en la esquina inferior derecha de la cuadrícula. */}
            <button
              type="button"
              onClick={cerrar}
              aria-label={labels.close}
              className="cristal-accion cerrar"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
