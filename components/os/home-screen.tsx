"use client";

/**
 * LA PANTALLA DE INICIO.
 *
 * ── Por qué el carrusel es `scroll-snap` y no JavaScript ──
 *
 * La referencia mueve las páginas con un arrastre en JS. Aquí se usa un
 * scroller horizontal con `scroll-snap-type: x mandatory`. No es pereza:
 *
 *  · el navegador aporta la inercia de verdad, la que ya conoce el pulgar;
 *  · funciona con lector de pantalla y con teclado sin escribir nada;
 *  · no hay `preventDefault` peleándose con el desplazamiento vertical,
 *    que es de donde salen los carruseles que se traban;
 *  · respeta `prefers-reduced-motion` sin código.
 *
 * ── Qué se guarda ──
 *
 * Sólo la disposición, en `localStorage`. Ni un dato personal: quién tiene
 * qué documento no sale del dispositivo, y el inicio no es una excepción.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bell, Camera, Check, Gavel, GraduationCap, Mic, Pencil, ScanLine,
  Plus, Settings, ShieldCheck, Sparkles, Users,
} from "lucide-react";
import { ShieldCheckIcon } from "@/components/icons/shield-check";
import { ScanTextIcon } from "@/components/icons/scan-text";
import { SparklesIcon } from "@/components/icons/sparkles";
import { GavelIcon } from "@/components/icons/gavel";
import { GraduationCapIcon } from "@/components/icons/graduation-cap";
import { UsersIcon } from "@/components/icons/users";
import { BellIcon } from "@/components/icons/bell";
import { SettingsIcon } from "@/components/icons/settings";
import type { AnimatedIconComponent } from "@/components/motion/animated-icon";
import type { AppSlug } from "@/lib/os/apps";
import {
  CLAVE_ANTERIOR,
  CLAVE_INICIO,
  layoutInicial,
  parseLayout,
  quitarApp,
  quitarWidget,
  type HomeLayout,
} from "@/lib/os/home";
import type { OsDict } from "@/lib/i18n/dictionaries/os";
import { cn } from "@/lib/utils";
import { AppIcon } from "./app-icon";
import { StatusBar } from "./status-bar";
import { OsWidget, type WidgetContent } from "./widget";

const ICONOS: Record<AppSlug, AnimatedIconComponent> = {
  boveda: ShieldCheckIcon,
  escaner: ScanTextIcon,
  ia: SparklesIcon,
  legal: GavelIcon,
  ingles: GraduationCapIcon,
  comunidad: UsersIcon,
  avisos: BellIcon,
  ajustes: SettingsIcon,
};

/* El glifo de 15px de la cabecera del widget. Es el mismo icono de la app
   pero SIN animar: dentro de una tarjeta que ya se toca entera, un icono
   que se mueve al tocarlo compite con la propia tarjeta. */
const GLIFO: Record<AppSlug, ReactNode> = {
  boveda: <ShieldCheck className="size-[15px]" />,
  escaner: <ScanLine className="size-[15px]" />,
  ia: <Sparkles className="size-[15px]" />,
  legal: <Gavel className="size-[15px]" />,
  ingles: <GraduationCap className="size-[15px]" />,
  comunidad: <Users className="size-[15px]" />,
  avisos: <Bell className="size-[15px]" />,
  ajustes: <Settings className="size-[15px]" />,
};

/** El icono del botón de un widget pequeño: micrófono o cámara. */
const ICONO_ACCION: Partial<Record<AppSlug, ReactNode>> = {
  ia: <Mic aria-hidden="true" className="size-[13px]" />,
  escaner: <Camera aria-hidden="true" className="size-[13px]" />,
};

/* Las cuatro del dock, en el orden del prototipo. No es el catálogo: es lo
   que se usa a diario y por eso está siempre a un pulgar de distancia. */
const DOCK: readonly AppSlug[] = ["boveda", "escaner", "ia", "legal"];

const rellenar = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/** Lo que el inicio sabe del usuario. Lo calcula la ruta, no esta pantalla. */
export type DatosInicio = {
  boveda: {
    total: number;
    /** El que vence antes, si alguno tiene fecha. */
    proximo: { nombre: string; dias: number } | null;
    /** Si NINGUNO tiene fecha: es el estado que hay que corregir. */
    sinFechas: boolean;
    ultimos: { nombre: string; cuando: string }[];
  };
  ingles: { cuando: string | null; enVivo: boolean };
};

export type HomeScreenProps = {
  nombre: string | null;
  lang: string;
  copy: OsDict;
  datos: DatosInicio;
  /** Qué hacer con una app que todavía no tiene pantalla. */
  onSoon: (slug: AppSlug) => void;
};

export function HomeScreen({ nombre, lang, copy, datos, onSoon }: HomeScreenProps) {
  const [layout, setLayout] = useState<HomeLayout>(layoutInicial);
  const [pagina, setPagina] = useState(0);
  const [editando, setEditando] = useState(false);
  const pista = useRef<HTMLDivElement>(null);

  // ── Lo guardado llega después del primer pintado ──
  // Así el servidor y el cliente pintan lo mismo y no hay error de
  // hidratación. El precio es un parpadeo para quien lo tenga ordenado a su
  // manera; el alternativo —no pintar nada hasta leer— es peor: pantalla en
  // blanco en el arranque, que es justo cuando se juzga un producto.
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CLAVE_INICIO)
        ?? window.localStorage.getItem(CLAVE_ANTERIOR);
      if (guardado) setLayout(parseLayout(guardado));
      // La clave vieja se retira en cuanto se ha migrado.
      if (window.localStorage.getItem(CLAVE_ANTERIOR)) {
        window.localStorage.removeItem(CLAVE_ANTERIOR);
      }
    } catch { /* almacenamiento bloqueado: se sigue con el de fábrica */ }
  }, []);

  const guardar = useCallback((siguiente: HomeLayout) => {
    setLayout(siguiente);
    try { window.localStorage.setItem(CLAVE_INICIO, JSON.stringify(siguiente)); }
    catch { /* sin espacio o en privado: se pierde al salir, no rompe nada */ }
  }, []);

  // La página visible se deduce del desplazamiento real, no de un contador
  // propio: si se desliza a medias y se suelta, el navegador decide dónde
  // encaja y este cálculo va detrás de esa decisión, nunca por delante.
  const alDesplazar = useCallback(() => {
    const nodo = pista.current;
    if (!nodo) return;
    setPagina(Math.round(nodo.scrollLeft / Math.max(1, nodo.clientWidth)));
  }, []);

  const irA = (n: number) => {
    const nodo = pista.current;
    if (!nodo) return;
    nodo.scrollTo({ left: n * nodo.clientWidth, behavior: "smooth" });
  };

  const contenido = (slug: AppSlug): WidgetContent => {
    const w = copy.widgets;
    if (slug === "boveda") {
      const b = datos.boveda;
      const cuerpo = b.total === 0
        ? w.boveda.empty
        : b.proximo
          ? b.proximo.dias <= 0
            ? rellenar(w.boveda.soonestToday, { name: b.proximo.nombre })
            : b.proximo.dias === 1
              ? rellenar(w.boveda.soonestOne, { name: b.proximo.nombre })
              : rellenar(w.boveda.soonest, { name: b.proximo.nombre, days: b.proximo.dias })
          : b.sinFechas ? w.boveda.noDates : w.boveda.count.replace("{n}", String(b.total));
      return {
        title: w.boveda.title,
        figure: b.total > 0 ? String(b.total) : undefined,
        body: b.total > 0
          ? (b.total === 1 ? w.boveda.countOne : rellenar(w.boveda.count, { n: b.total }))
          : cuerpo,
        rows: b.total > 0
          ? [{ text: cuerpo }, ...b.ultimos.slice(0, 1).map((u) => ({ text: u.nombre, meta: u.cuando }))]
          : undefined,
        badge: b.total > 0 ? w.boveda.encrypted : undefined,
        action: w.boveda.action,
      };
    }
    if (slug === "ingles") {
      const i = datos.ingles;
      return {
        title: w.ingles.title,
        body: i.enVivo ? w.ingles.live : i.cuando ? rellenar(w.ingles.next, { when: i.cuando }) : w.ingles.none,
        action: w.ingles.action,
        actionIcon: ICONO_ACCION.ingles,
      };
    }
    const resto = w[slug] as { title: string; body: string; action: string };
    return { title: resto.title, body: resto.body, action: resto.action, actionIcon: ICONO_ACCION[slug] };
  };

  const total = layout.pages.length;

  /* La fecha se calcula tras montar, nunca en el servidor: el servidor está
     en otra zona horaria que la persona y "lunes" contra "martes" es
     exactamente el error que ya rompió `/pago` con una hidratación
     descuadrada. Hasta que llega, no se pinta nada en su sitio. */
  const [fechaLarga, setFechaLarga] = useState("");
  useEffect(() => {
    setFechaLarga(
      new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" })
        .format(new Date())
        .replace(/^\w/, (c) => c.toUpperCase()),
    );
  }, [lang]);

  return (
    /* pb-[168px]: el dock mide 152 y la fila puede desplazarse. Sin este
       hueco, la última fila de iconos queda debajo y no se puede tocar. */
    <div className="flex min-h-dvh flex-col">
      <StatusBar lang={lang} />

      {/* ── Cabecera ── */}
      <header className="flex items-start gap-3 px-5 pt-2">
        <div className="min-w-0 flex-1">
          {/* La fecha va ENCIMA del saludo y en 11.5px/500 al 54%, como el
              prototipo. El saludo, 24px/800 con -0.5px de interletraje. */}
          <p className="text-[11.5px] font-medium" style={{ color: "var(--os-muted)", letterSpacing: "0.2px" }}>
            {fechaLarga}
          </p>
          <h1 className="mt-0.5 text-[24px] font-extrabold leading-tight" style={{ letterSpacing: "-0.5px" }}>
            {nombre ? rellenar(copy.greeting, { name: nombre }) : copy.greetingAnon}
          </h1>
          {editando ? (
            <p className="mt-1 text-[0.875rem]" style={{ color: "var(--os-muted)" }}>
              {copy.editing.help}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setEditando((v) => !v)}
          /* 33px de alto es lo que dibuja el prototipo, pero el área
             pulsable se lleva a 44 con padding vertical: 33px de objetivo
             táctil falla demasiado. Lo que se VE mide lo mismo. */
          className="k-press inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[12px] font-bold"
          style={{ background: "var(--os-chip)" }}
        >
          {editando ? <Check aria-hidden="true" className="size-[13px]" /> : <Pencil aria-hidden="true" className="size-[13px]" />}
          {editando ? copy.done : copy.edit}
        </button>
      </header>

      {/* ── Las páginas ──
          `snap-x mandatory` + `overscroll-x-contain`: el gesto horizontal se
          queda dentro y no dispara el "atrás" del navegador. */}
      <div
        ref={pista}
        onScroll={alDesplazar}
        className="mt-5 flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {layout.pages.map((p, indice) => (
          <section
            key={indice}
            aria-label={rellenar(copy.pageOf, { n: indice + 1, total })}
            className="w-full shrink-0 snap-center px-5"
          >
            {p.widgets.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {p.widgets.map((w) => (
                  <OsWidget
                    key={w.id}
                    slug={w.app}
                    size={w.size}
                    icon={GLIFO[w.app]}
                    content={contenido(w.app)}
                    editing={editando}
                    removeLabel={rellenar(copy.editing.remove, { app: copy.apps[w.app] })}
                    onRemove={() => guardar(quitarWidget(layout, w.id))}
                    onOpen={() => onSoon(w.app)}
                  />
                ))}
              </div>
            ) : null}

            <ul className={cn("grid grid-cols-4 gap-x-[24px] gap-y-[16px]", p.widgets.length > 0 && "mt-8")}>
              {p.apps.map((slug, casilla) => (
                <li key={casilla} className="min-h-[87px]">
                  {slug ? (
                    <AppIcon
                      slug={slug}
                      label={copy.apps[slug]}
                      icon={ICONOS[slug]}
                      editing={editando}
                      removeLabel={rellenar(copy.editing.remove, { app: copy.apps[slug] })}
                      onRemove={() => guardar(quitarApp(layout, slug))}
                      onOpen={() => onSoon(slug)}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* ── Los puntos ──
          Son botones de verdad, no adornos: con un pulgar grande deslizar
          falla, y tocar el punto siempre funciona. */}
      {total > 1 ? (
        <nav aria-label={rellenar(copy.pageOf, { n: pagina + 1, total })} className="mt-4 flex justify-center gap-2">
          {layout.pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => irA(i)}
              aria-current={i === pagina}
              aria-label={rellenar(copy.goToPage, { n: i + 1 })}
              className="flex size-11 items-center justify-center"
            >
              <span
                className="block h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === pagina ? "1.5rem" : "0.375rem",
                  background: i === pagina ? "var(--os-ink)" : "var(--os-faint)",
                }}
              />
            </button>
          ))}
        </nav>
      ) : null}

      {/* En edición aparece la salida a 'Tus aplicaciones': es donde se
          recupera lo que se quitó. Sin este enlace, quitar una app era una
          decisión sin vuelta atrás. */}
      {editando ? (
        <div className="mt-6 px-5">
          <Link
            href="/inicio/aplicaciones"
            className="k-press k-glass flex min-h-12 items-center justify-center gap-2 rounded-full text-[13px] font-bold"
          >
            <Plus aria-hidden="true" className="size-4" strokeWidth={3} />
            {copy.editing.addApp}
          </Link>
        </div>
      ) : null}

      </div>
  );
}
