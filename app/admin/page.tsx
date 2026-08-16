import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  CalendarClock,
  ChevronRight,
  GraduationCap,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = { title: "Administración · ANDEX" };

/**
 * Índice del panel interno.
 *
 * Tiene la forma de una lista agrupada del sistema de diseño, la misma que
 * usa el producto: lo que se puede tocar arriba, con su galón; lo que
 * todavía no existe abajo, sin galón — algo que aún no abre no se pinta
 * como algo que sí.
 *
 * Las secciones sin pantalla son las tablas que ya existen en la base
 * (`0008_empleo.sql`, `0009_lugares_y_ingles.sql`). Se enseñan en vez de
 * esconderse: así se ve de un vistazo qué falta, en lugar de descubrirlo
 * buscando un enlace que no está.
 *
 * ── Por qué aquí se escriben las clases y no se usan las primitivas ──
 *
 * `components/ui/kit.tsx` importa `useState` y `useEffect` (los necesita
 * `HeaderAction`) sin declarar `"use client"`, así que sólo se puede
 * importar desde un componente de cliente. Esta página es de servidor
 * porque exporta `metadata`, y convertirla en cliente perdería el título de
 * la pestaña. Lo que se escribe abajo son EXACTAMENTE las clases que
 * escriben `ScreenHeader`, `SectionLabel`, `ListGroup` y `ListRow`, que
 * viven en `app/kit.css`: el sistema de diseño está entero, sólo que sin el
 * envoltorio de React. El día que el kit lleve `"use client"`, esto son
 * cuatro sustituciones.
 */

type Seccion = {
  href?: string;
  icon: LucideIcon;
  /** El nombre Lucide: es lo que el CSS mira para darle su gesto al icono. */
  iconName: string;
  title: string;
  meta: string;
};

const LISTAS: readonly Seccion[] = [
  {
    href: "/admin/talleres",
    icon: CalendarClock,
    iconName: "calendar-clock",
    title: "Talleres",
    meta: "Genera las sesiones de las próximas semanas y pégale a cada una su enlace de Zoom.",
  },
];

const PENDIENTES: readonly Seccion[] = [
  {
    icon: Briefcase,
    iconName: "briefcase",
    title: "Empleos y empleadores",
    meta: "Vacantes verificadas y la sincronización con el National Labor Exchange.",
  },
  {
    icon: MapPin,
    iconName: "map-pin",
    title: "Lugares de apoyo",
    meta: "Clínicas, ayuda legal, bancos de comida y consulados, por estado.",
  },
  {
    icon: GraduationCap,
    iconName: "graduation-cap",
    title: "Inglés por oficio",
    meta: "Las frases de cada trabajo, con su pronunciación escrita.",
  },
];

function Fila({ s }: { s: Seccion }) {
  const dentro = (
    <>
      <span className="rowicon tone-quiet">
        <s.icon
          aria-hidden="true"
          data-icon={s.iconName}
          width={20}
          height={20}
          strokeWidth={1.75}
        />
      </span>
      <span className="rowmain">
        <span className="rowtitle">{s.title}</span>
        <span className="rowmeta">{s.meta}</span>
      </span>
      {s.href ? (
        <span className="rowtrail">
          <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-disabled" />
        </span>
      ) : null}
    </>
  );

  // Sin destino no hay galón y no hay pulsación: la fila informa y ya.
  return s.href ? (
    <Link href={s.href} className="row tappable">
      {dentro}
    </Link>
  ) : (
    <div className="row">{dentro}</div>
  );
}

export default function AdminHome() {
  return (
    <div className="mx-auto w-full max-w-[26.5rem]">
      <header>
        <p className="navover">Panel interno</p>
        <h1 className="largeTitle">Lo que carga el equipo</h1>
        <p className="navsub">
          Todo lo que la comunidad ve en la app sale de estas pantallas.
        </p>
      </header>

      <h2 className="seclbl">
        <span>Se puede cargar ya</span>
      </h2>
      <div className="ax-group">
        {LISTAS.map((s) => (
          <Fila key={s.title} s={s} />
        ))}
      </div>

      <h2 className="seclbl">
        <span>Todavía sin pantalla</span>
      </h2>
      <div className="ax-group">
        {PENDIENTES.map((s) => (
          <Fila key={s.title} s={s} />
        ))}
      </div>

      <div className="ax-notice mt-3">
        <span className="min-w-0">
          La tabla de las tres ya existe en la base. Lo que falta es la pantalla para
          llenarlas, así que de momento se cargan por SQL.
        </span>
      </div>
    </div>
  );
}
