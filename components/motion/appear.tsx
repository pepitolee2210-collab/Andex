"use client";

/**
 * APARECER — lo que en escritorio se revelaba al pasar el ratón.
 *
 * En un teléfono nadie "pasa por encima": se desplaza. Así que el
 * disparador natural no es el cursor sino la pantalla — el elemento entra,
 * y entonces se anima. Una sola vez: repetirlo cada vez que se sube y baja
 * marea y hace que la lista parezca inestable.
 *
 * El escalonado va por `--i` en CSS (ver `.k-appear` en motion.css), no con
 * un temporizador por elemento: así el navegador lo resuelve en el
 * compositor y no hay un `setTimeout` por tarjeta.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AppearProps = {
  children: ReactNode;
  /** Posición en la tanda: retrasa la entrada 60ms por puesto. */
  index?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
};

export function Appear({ children, index = 0, className, as = "div" }: AppearProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;

    // Sin `IntersectionObserver` no se esconde nada. Preferimos perder la
    // animación antes que dejar la pantalla en blanco en un teléfono viejo.
    if (typeof IntersectionObserver === "undefined") { setVisible(true); return; }

    const observador = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setVisible(true);
        observador.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, []);

  /* Nota sobre el caso "el JavaScript no llega":
     un temporizador de rescate aquí NO sirve — vive dentro de `useEffect`,
     así que si el JS no corre, tampoco corre el rescate; y en una página
     larga haría aparecer todo de golpe, matando el escalonado. El caso real
     se cubre con el `<noscript>` del layout, que devuelve la opacidad a 1
     sin depender de nada. */

  const Etiqueta = as as "div";
  return (
    <Etiqueta
      ref={ref as React.Ref<HTMLDivElement>}
      data-visible={visible ? "true" : "false"}
      style={{ ["--i" as string]: index }}
      className={cn("k-appear", className)}
    >
      {children}
    </Etiqueta>
  );
}
