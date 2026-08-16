import type { Metadata } from "next";
import { TALLERES } from "@/lib/catalogs/talleres";
import { SessionsManager } from "@/components/admin/sessions-manager";

export const metadata: Metadata = { title: "Talleres · Administración" };

/**
 * Sesiones de los talleres. Es la pantalla que el sistema de diseño llama
 * «Administración»: panel interno, la única que no es de la persona
 * suscrita.
 *
 * Va en la misma columna estrecha que el resto del producto. No es una
 * limitación heredada: el equipo carga las sesiones desde el teléfono, en el
 * mismo aparato donde después se comprueba que el enlace pegado funciona.
 *
 * La cabecera la pone `SessionsManager` y no esta página, y por un motivo
 * técnico: las primitivas del kit (`components/ui/kit.tsx`) usan `useState`
 * sin declarar `"use client"`, así que sólo se pueden importar desde un
 * componente de cliente. Aquí sólo queda el catálogo y el `metadata`, que
 * son cosa del servidor.
 */
export default function AdminTalleresPage() {
  return (
    <div className="mx-auto w-full max-w-[26.5rem]">
      <SessionsManager series={TALLERES} />
    </div>
  );
}
