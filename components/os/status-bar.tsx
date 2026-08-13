"use client";

/**
 * BARRA DE ESTADO.
 *
 * El prototipo la dibuja: hora a la izquierda, señal/wifi/batería a la
 * derecha, 46px de alto. En sus exports la hora está congelada en 9:41
 * —la hora de los anuncios de Apple—; aquí es la del reloj de verdad,
 * porque una hora falsa encima de una hora real (la de la próxima clase)
 * hace dudar de las dos.
 *
 * Se calcula tras montar. En el servidor no se conoce la zona de la
 * persona, y pintar una hora en el HTML y otra al hidratar es justo el
 * fallo que ya rompió `/pago`.
 */

import { useEffect, useState } from "react";
import { Battery, Signal, Wifi } from "lucide-react";

export function StatusBar({ lang }: { lang: string }) {
  const [hora, setHora] = useState("");

  useEffect(() => {
    const pintar = () =>
      setHora(new Intl.DateTimeFormat(lang, { hour: "numeric", minute: "2-digit" }).format(new Date()));
    pintar();
    // Cada 20s: el minuto cambia como mucho una vez, y no cuesta nada.
    const reloj = window.setInterval(pintar, 20_000);
    return () => window.clearInterval(reloj);
  }, [lang]);

  return (
    <div aria-hidden="true" className="flex h-[46px] shrink-0 items-center justify-between px-6">
      <span className="text-[14px] font-bold tabular-nums">{hora}</span>
      <span className="flex items-center gap-1.5">
        <Signal className="size-[15px]" strokeWidth={2.5} />
        <Wifi className="size-[15px]" strokeWidth={2.5} />
        <Battery className="size-[15px]" strokeWidth={2.5} />
      </span>
    </div>
  );
}
