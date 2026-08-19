"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { PANTALLA_HENRY } from "@/lib/pantalla-henry";
import type { LandingImage } from "@/lib/landing-images";
import { cn } from "@/lib/utils";

/**
 * UNA FOTO CON LA PANTALLA VIVA DENTRO.
 *
 * Henry sale sujetando un teléfono cuya pantalla está APAGADA en la foto.
 * Este componente encaja ahí dentro lo que se le pase — el recorrido del
 * producto — para que la app cambie de paso dentro de su mano.
 *
 * ── Por qué la escala se MIDE ──
 *
 * Lo que va dentro está maquetado a 312px de ancho con tamaños de letra en
 * píxeles fijos: es el dibujo de una pantalla de teléfono, no texto de
 * página. Encogerlo con `transform: scale()` conserva las proporciones
 * exactas del diseño; rehacerlo con anchos relativos daría una maqueta
 * distinta a cada ancho de ventana.
 *
 * El factor sale de medir la caja con un `ResizeObserver`, no de una tabla
 * de puntos de corte. La foto se escala con su columna, y esa columna cambia
 * en sitios que no coinciden con los breakpoints de Tailwind — la rejilla,
 * el `max-w`, el zoom del navegador. Un número escrito a mano acierta a
 * 1440 y falla a 1280.
 */

export type FotoConPantallaProps = {
  /** El recorte con transparencia. Del catálogo, ya comprobado en disco. */
  foto: LandingImage;
  /** Qué se ve en la foto, para quien no la ve. */
  alt: string;
  /** Lo que se pinta dentro de la pantalla apagada. */
  children: ReactNode;
  className?: string;
};

/**
 * Alto del mockup, deducido del hueco.
 *
 * El hueco mide `width`% del ancho del lienzo y `height`% del alto, y el
 * lienzo es 4:5 — de ahí el 1.25. Con eso, la caja interior tiene la MISMA
 * proporción que el hueco y al escalarla por ancho encaja sin bandas.
 */
const ALTO_MOCKUP = Math.round(
  (PANTALLA_HENRY.anchoMockup * PANTALLA_HENRY.height * 1.25) / PANTALLA_HENRY.width,
);

export function FotoConPantalla({ foto, alt, children, className }: FotoConPantallaProps) {
  const caja = useRef<HTMLDivElement>(null);
  /**
   * Arranca en 0 y dentro no se pinta nada hasta medir. Pintarlo a escala 1
   * durante un fotograma daría el mockup a tamaño real desbordando la foto
   * entera antes de encogerse de golpe.
   */
  const [escala, setEscala] = useState(0);
  /** Ancho del hueco en px: de él sale el radio de las esquinas. */
  const [hueco, setHueco] = useState(0);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;

    const medir = () => {
      const ancho = el.getBoundingClientRect().width;
      if (!ancho) return;
      const huecoPx = (ancho * PANTALLA_HENRY.width) / 100;
      setHueco(huecoPx);
      setEscala(huecoPx / PANTALLA_HENRY.anchoMockup);
    };

    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={caja} className={cn("relative w-full", className)}>
      <Image
        src={foto.src}
        alt={alt}
        width={foto.width}
        height={foto.height}
        /* La portada se juzga en el primer segundo y esta imagen ES la
           portada: no espera su turno. */
        priority
        sizes="(min-width: 1024px) 34rem, 100vw"
        className="h-auto w-full select-none"
      />

      {/* El hueco de la pantalla, en porcentajes medidos sobre el archivo.

          Las esquinas van REDONDEADAS con el radio medido en la foto. Con
          esquinas rectas, las cuatro puntas del recorrido asomaban fuera del
          negro del teléfono y toda la pantalla se leía pegada encima en vez
          de encendida dentro. */}
      <div
        className="absolute overflow-hidden"
        style={{
          left: `${PANTALLA_HENRY.left}%`,
          top: `${PANTALLA_HENRY.top}%`,
          width: `${PANTALLA_HENRY.width}%`,
          height: `${PANTALLA_HENRY.height}%`,
          borderRadius: hueco ? `${hueco * PANTALLA_HENRY.radio}px` : undefined,
        }}
      >
        {escala > 0 ? (
          <div
            style={{
              width: PANTALLA_HENRY.anchoMockup,
              height: ALTO_MOCKUP,
              transform: `scale(${escala})`,
              transformOrigin: "top left",
            }}
          >
            {children}
          </div>
        ) : null}

        {/* ── Lo que hace que la pantalla parezca ENCENDIDA y no pegada ──

            Una pantalla fotografiada nunca es plana: tiene el cristal
            reflejando la luz de la sala y el borde comiéndose un punto de
            brillo contra el chasis. Sin esto, el recorrido entraba plano y
            uniformemente iluminado sobre una foto que sí tiene luz, y el
            ojo lo cazaba al instante: se veía sobreexpuesto, recortado y
            encima.

            Son dos capas, ambas sin tocar nada: un velo diagonal muy suave
            —la luz que viene de arriba a la izquierda, igual que en la
            foto— y una sombra hacia dentro que asienta el cristal en su
            marco. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: "inherit",
            background:
              "linear-gradient(148deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0) 46%)",
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: "inherit",
            boxShadow:
              "inset 0 0 0 1px rgba(0,0,0,0.55), inset 0 2px 10px rgba(0,0,0,0.45)",
          }}
        />
      </div>
    </div>
  );
}
