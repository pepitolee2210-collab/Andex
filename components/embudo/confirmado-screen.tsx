"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { guardarPagoPendiente } from "@/lib/pago-pendiente";
import type { PlanType } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * EL INSTANTE ENTRE EL COBRO Y LA CUENTA.
 *
 * Anota el pago en el navegador y sigue al registro. Dura lo que tarda en
 * escribirse una clave de `localStorage`, y aun así se pinta algo: quien
 * acaba de pagar en otro dominio y vuelve a una pantalla en blanco cree,
 * durante ese segundo, que algo salió mal.
 *
 * ── Por qué el efecto lleva guardia ──
 *
 * En desarrollo React monta dos veces a propósito. Sin la guardia, el
 * `replace` se dispara dos veces y la segunda pisa la navegación de la
 * primera: la pantalla se queda parada aquí y el registro no llega nunca.
 * Cuesta una línea y ahorra media hora buscando un fallo que sólo pasa en
 * desarrollo.
 */

export type ConfirmadoScreenProps = {
  copy: {
    title: string;
    heading: string;
    body: string;
    llevando: string;
  };
  plan: PlanType;
  /** El que dio la pasarela, si lo dio. En demo no hay. */
  email: string | null;
  destino: string;
  className?: string;
};

export function ConfirmadoScreen({
  copy: t,
  plan,
  email,
  destino,
  className,
}: ConfirmadoScreenProps) {
  const router = useRouter();
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    guardarPagoPendiente({ plan, email, cobradoEn: Date.now() });
    router.replace(destino);
  }, [plan, email, destino, router]);

  return (
    <main
      id="contenido"
      className={cn(
        "relative isolate flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-navy-body px-5 text-center text-[color:var(--text-on-invert)]",
        className,
      )}
    >
      <div aria-hidden="true" className="hero-fondo -z-10">
        <span className="masa-2" />
        <span className="reflejo" />
      </div>

      <span
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full bg-[color:var(--accent-wash-invert)] text-[color:var(--text-on-invert-accent)]"
      >
        <Check className="size-8" strokeWidth={2.5} />
      </span>

      <h1 className="mt-6 max-w-[18ch] font-heading text-h1 leading-[1.1] text-[color:var(--text-on-invert)]">
        {t.heading}
      </h1>
      <p className="mt-4 max-w-[46ch] text-body leading-[1.5] text-[color:var(--text-on-invert-quiet)]">
        {t.body}
      </p>

      {/* Para quien no ve la pantalla, el cambio de página es un salto sin
          aviso. `role="status"` lo anuncia. */}
      <p
        role="status"
        className="mt-8 text-label text-[color:var(--text-on-invert-quiet)]"
      >
        {t.llevando}
      </p>
    </main>
  );
}
