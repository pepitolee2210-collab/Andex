import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin/access";
import { isDemoMode } from "@/lib/config";

/**
 * PANEL DE ADMINISTRACIÓN — carcasa.
 *
 * Fuera del grupo `(panel)` a propósito: esto no es una pantalla de producto
 * y no debe aparecer en la barra de pestañas ni en el menú del usuario.
 *
 * A quien no es administrador se le devuelve **404, no 403**. Un 403 confirma
 * que la ruta existe; un 404 no le dice nada a nadie que ande probando URLs.
 *
 * Y esto es sólo la puerta de la interfaz. La seguridad de verdad está en la
 * base: las políticas RLS de `0006_roles.sql` devuelven cero filas a quien no
 * tiene el rol, aunque llegara hasta aquí de alguna forma.
 *
 * El panel va SÓLO EN ESPAÑOL, sin pasar por i18n. Lo usa el equipo, no la
 * comunidad, y traducir cada etiqueta interna a dos idiomas es trabajo que no
 * le sirve a ningún usuario.
 */

const SECCIONES = [
  { href: "/admin/talleres", label: "Talleres" },
] as const;

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireUser();
  if (!isAdminEmail(user.email)) notFound();

  return (
    <div className="min-h-dvh bg-page">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2 font-heading text-h3 text-ink">
            <ShieldCheck aria-hidden="true" className="size-5 text-teal-deep" />
            Administración
          </Link>
          <nav aria-label="Secciones del panel" className="flex flex-wrap gap-4">
            {SECCIONES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="min-h-11 py-2 text-body text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                {s.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/panel"
            className="ml-auto min-h-11 py-2 text-body text-teal-deep underline underline-offset-4"
          >
            Volver a la app
          </Link>
        </div>
      </header>

      {/* Que nadie confunda una demostración con datos reales. */}
      {isDemoMode ? (
        <p className="border-b border-amber-deep/30 bg-amber-soft px-4 py-2 text-center text-caption text-ink">
          Modo demostración · lo que guardes aquí vive sólo en este navegador
        </p>
      ) : null}

      <main id="contenido" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
