import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Briefcase, MapPin, GraduationCap } from "lucide-react";

export const metadata: Metadata = { title: "Administración · ANDEX" };

/**
 * Índice del panel.
 *
 * Las tarjetas sin enlace son las tablas que ya existen en la base
 * (`0008_empleo.sql`, `0009_lugares_y_ingles.sql`) pero cuya pantalla todavía
 * no está escrita. Se enseñan apagadas en vez de esconderse: así se ve de un
 * vistazo qué falta, en lugar de descubrirlo buscando un enlace que no está.
 */

const SECCIONES = [
  {
    href: "/admin/talleres",
    icon: CalendarClock,
    title: "Talleres",
    body: "Genera las sesiones de las próximas semanas y pégale a cada una su enlace de Zoom.",
    listo: true,
  },
  {
    href: "/admin/empleos",
    icon: Briefcase,
    title: "Empleos y empleadores",
    body: "Vacantes verificadas y la sincronización con el National Labor Exchange.",
    listo: false,
  },
  {
    href: "/admin/lugares",
    icon: MapPin,
    title: "Lugares de apoyo",
    body: "Clínicas, ayuda legal, bancos de comida y consulados, por estado.",
    listo: false,
  },
  {
    href: "/admin/ingles",
    icon: GraduationCap,
    title: "Inglés por oficio",
    body: "Las frases de cada trabajo, con su pronunciación escrita.",
    listo: false,
  },
] as const;

export default function AdminHome() {
  return (
    <>
      <h1 className="font-heading text-h1 text-ink">Panel de administración</h1>
      <p className="mt-1 text-body-lg text-muted">
        Todo lo que la comunidad ve, se carga desde aquí.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECCIONES.map((s) => {
          const Icon = s.icon;
          const contenido = (
            <>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-soft text-teal-deep">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-heading text-h3 text-ink">{s.title}</span>
                <span className="mt-1 block text-body text-muted">{s.body}</span>
                {!s.listo ? (
                  <span className="mt-2 inline-block text-caption font-semibold text-muted">
                    Pantalla pendiente · la tabla ya existe en la base
                  </span>
                ) : null}
              </span>
            </>
          );

          return (
            <li key={s.title}>
              {s.listo ? (
                <Link
                  href={s.href}
                  className="flex h-full gap-4 rounded-xl border border-line bg-surface p-5 shadow-sm transition-colors hover:border-teal-deep hover:bg-surface-alt"
                >
                  {contenido}
                </Link>
              ) : (
                <div className="flex h-full gap-4 rounded-xl border border-dashed border-line bg-surface/50 p-5 opacity-70">
                  {contenido}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
