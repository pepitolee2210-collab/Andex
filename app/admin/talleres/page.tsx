import type { Metadata } from "next";
import { TALLERES } from "@/lib/catalogs/talleres";
import { SessionsManager } from "@/components/admin/sessions-manager";

export const metadata: Metadata = { title: "Talleres · Administración" };

/**
 * Sesiones de los talleres.
 *
 * El servidor sólo entrega el catálogo de series. Las sesiones y sus enlaces
 * se gestionan en el cliente porque en modo demo viven en `localStorage`; con
 * Supabase conectado, esta misma pantalla leerá y escribirá `workshop_sessions`
 * sin cambiar de forma.
 */
export default function AdminTalleresPage() {
  return (
    <>
      <h1 className="font-heading text-h1 text-ink">Sesiones de los talleres</h1>
      <p className="mt-1 max-w-2xl text-body-lg text-muted">
        Cada sesión lleva su propio enlace. Uno fijo dejaría entrar para siempre a cualquiera
        que lo consiga una vez.
      </p>

      <div className="mt-8">
        <SessionsManager series={TALLERES} />
      </div>
    </>
  );
}
