"use client";

/**
 * ARMAZÓN DE LA APLICACIÓN — el del sistema de diseño.
 *
 * Antes esto eran cuatro wireframes distintos: topbar de 56px con
 * hamburguesa, chip de ubicación, campana y avatar; drawer lateral;
 * sidebar colapsable de 240px; y una tab bar de cuatro destinos que sólo
 * aparecía por debajo de 640px. Cinco piezas de navegación para siete
 * módulos.
 *
 * El diseño lo reduce a dos:
 *
 *   · **Una cabecera** con la marca y UN icono. Nada más.
 *   · **Una barra de cinco pestañas** abajo, siempre, en cualquier ancho:
 *     Inicio · Bóveda · Academia · Comunidad · Perfil.
 *
 * ── Dónde fue a parar lo que se quitó ──
 *
 * · El **sidebar y el drawer** listaban los siete módulos. Eso ahora lo
 *   hace la propia pantalla de Inicio, con sus baldosas en tres bloques.
 *   §4.3 sigue cumpliéndose —los siete están, en orden canónico y sin
 *   reordenar— sólo que en el contenido y no en el cromo.
 * · El **chip de ubicación** se convierte en el sobretítulo de Inicio
 *   («Utah · martes 8 de enero»), que es donde el dato significa algo.
 * · El **avatar** es la pestaña de Perfil.
 * · **Configuración, ayuda y cerrar sesión** viven en Perfil.
 *
 * La campana se queda en la cabecera: es lo único que puede tener algo
 * nuevo que decir en cualquier momento.
 *
 * ── Por qué una columna estrecha también en el portátil ──
 *
 * El sistema de diseño no tiene versión de escritorio, y no por descuido:
 * está dimensionado para 360–414px porque es como entra este público. Una
 * versión ancha inventada por mí no sería el diseño, sería otra cosa que
 * se le parece. La columna se centra y se queda en su ancho.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  Building2,
  GraduationCap,
  House,
  Plane,
  ScanLine,
  ShieldCheck,
  Store,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { PAST_DUE_GRACE_DAYS, ROUTES } from "@/lib/config";
import { MODULES } from "@/lib/catalogs/modules";
import type { ModuleId } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Glyph,
  HEADER_ACTION_ID,
  HEADER_BACK_ID,
  type IconComponent,
} from "@/components/ui/kit";
import { CristalMenu, type CristalTool } from "@/components/ui/cristal-menu";
import { usePanel } from "./panel-context";
import { formatDate } from "./panel-utils";

/** Ancla del grid de módulos: destino de "Explorar todos los módulos" (§4.3). */
export const MODULES_ANCHOR = "modulos";

// ── La barra de cinco pestañas ───────────────────────────

type Tab = {
  href: string;
  label: string;
  icon: IconComponent;
  /** El nombre Lucide: es lo que el CSS mira para darle su gesto. */
  iconName: string;
};

function tabs(dict: Dictionary): Tab[] {
  const shell = dict.panel.shell;
  return [
    { href: ROUTES.panel, label: shell.home, icon: House, iconName: "house" },
    {
      href: ROUTES.modulo("boveda"),
      label: shell.moduleNav[1],
      icon: ShieldCheck,
      iconName: "shield",
    },
    {
      href: ROUTES.modulo("academia"),
      label: shell.moduleNav[6],
      icon: GraduationCap,
      iconName: "graduation-cap",
    },
    {
      href: ROUTES.modulo("comunidad"),
      label: shell.moduleNav[5],
      icon: Users,
      iconName: "users",
    },
  ];
}

/**
 * TODO LO DEMÁS, en una rejilla de 3×3.
 *
 * Lo que NO está ya en la barra. Bóveda, Academia y Comunidad son
 * pestañas, así que repetirlas aquí sería ofrecer la misma puerta dos
 * veces con dos formas distintas — y de paso empujaba lo que sólo está
 * aquí a la tercera fila.
 *
 * Quedan ocho: los cuatro módulos que abren durante el piloto, la Tienda,
 * las Inversiones, el Perfil y el escáner. Con la equis, nueve: la
 * cuadrícula exacta.
 *
 * Entre las pestañas y esta rejilla, los SIETE módulos siguen alcanzables
 * desde la navegación (§4.3) — tres arriba, cuatro aquí.
 */
function tools(dict: Dictionary): CristalTool[] {
  const shell = dict.panel.shell;
  const c = shell.cristal;
  const modulo = (
    slug: string,
    id: ModuleId,
    icon: IconComponent,
    iconName: string,
  ): CristalTool => {
    const meta = MODULES.find((m) => m.slug === slug);
    return {
      key: slug,
      /* El nombre COMPLETO, no la abreviatura del sidebar viejo. Aquí no
         hay contexto alrededor que lo explique: «Negocio» a secas no dice
         qué hay dentro; «Desarrollo Empresarial», sí. */
      label: dict.common.modules.titles[id].in_us,
      icon,
      iconName,
      href: ROUTES.modulo(slug),
      pending: meta?.status !== "live",
    };
  };

  /* PRIMERO LO QUE YA FUNCIONA. Antes abría con el escáner y seguía con
     los cuatro módulos cerrados, así que lo primero que se veía al abrir
     el menú era una fila entera de cosas apagadas — la impresión de que
     no hay nada, teniendo cuatro que sí. Ahora las cuatro vivas ocupan la
     primera fila y media, y lo que falta va detrás. */
  return [
    { key: "tienda", label: c.store, icon: Store, iconName: "store", href: ROUTES.tienda },
    { key: "inversiones", label: c.invest, icon: TrendingUp, iconName: "trending-up",
      href: ROUTES.inversiones },
    { key: "perfil", label: dict.common.nav.profile, icon: User, iconName: "circle-user",
      href: ROUTES.perfil },
    /* Con su bandera: sin ella el destino sería el mismo que el de la
       pestaña de Bóveda y el menú repetiría una puerta que ya existe. */
    { key: "escaner", label: c.scan, icon: ScanLine, iconName: "scan-line",
      href: `${ROUTES.modulo("boveda")}?escanear=1` },
    modulo("migracion", 2, Plane, "plane"),
    modulo("finanzas", 3, Wallet, "wallet"),
    modulo("negocio", 4, Building2, "building-2"),
    modulo("empleo", 7, Briefcase, "briefcase"),
  ];
}

/**
 * La pestaña activa. No basta con la igualdad exacta: estando dentro de un
 * taller de Comunidad la pestaña de Comunidad tiene que seguir encendida,
 * porque si no, la barra dice que no estás en ningún sitio.
 */
function tabActive(pathname: string, href: string): boolean {
  if (href === ROUTES.panel) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TabBar({ dict, pathname }: { dict: Dictionary; pathname: string }) {
  const c = dict.panel.shell.cristal;
  return (
    <CristalMenu
      tabs={tabs(dict).map((t) => ({ ...t, active: tabActive(pathname, t.href) }))}
      tools={tools(dict)}
      category={c.category}
      labels={{
        barAria: c.barAria,
        menuAria: c.menuAria,
        open: c.open,
        close: c.close,
        pending: c.pending,
      }}
    />
  );
}

/**
 * Banda superior de avisos (§2.4 "Countdown Banner").
 *
 * En v1 solo lleva el estado real de la suscripción (§3.4.7): pago rechazado y
 * cancelación con fecha. La cuenta regresiva de eventos comunitarios queda
 * fuera porque el esquema §7.2 no tiene tabla de eventos y §3.4.1 prohíbe
 * fabricar urgencia; un contador inventado sería justo el patrón que el PRD
 * veta. Cuando exista la fuente de eventos, este es su sitio.
 */
function TopNotices({ pathname }: { pathname: string }) {
  const { dict, subscription, access, lang } = usePanel();
  const notices = dict.panel.notices;

  /* En Perfil vive la tarjeta entera del estado de la suscripción, con su
     copy propio. Repetir aquí la banda decía lo mismo dos veces y con otro
     tono, que es peor que no decirlo: la persona no sabe cuál creer. */
  if (pathname === ROUTES.perfil) return null;

  if (access === "read-only") {
    return (
      <div className="border-b border-line bg-amber-soft px-5 py-3">
        <p className="text-body text-ink">
          <strong className="font-semibold">{notices.pastDueTitle}.</strong>{" "}
          {notices.pastDueBody(PAST_DUE_GRACE_DAYS)}
        </p>
        <Button href={ROUTES.membresia} variant="secondary" className="mt-2">
          {notices.pastDueCta}
        </Button>
      </div>
    );
  }

  if (subscription?.cancelAtPeriodEnd && access === "full") {
    return (
      <div className="border-b border-line bg-surface-alt px-5 py-3">
        <p className="text-body text-ink">
          <strong className="font-semibold">{notices.canceledTitle}.</strong>{" "}
          {notices.canceledBody(formatDate(subscription.currentPeriodEnd, lang))}
        </p>
        <Button href={ROUTES.perfil} variant="ghost" className="mt-2">
          {notices.canceledCta}
        </Button>
      </div>
    );
  }

  return null;
}

// ── Shell ────────────────────────────────────────────────

export function PanelShell({ children }: { children: ReactNode }) {
  const { dict, loading, access } = usePanel();
  const pathname = usePathname() ?? ROUTES.panel;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const shell = dict.panel.shell;

  /**
   * Al cambiar de pantalla se vuelve arriba. Con una sola columna y la
   * barra de pestañas siempre presente, sin esto se salta de mitad de la
   * Bóveda a mitad de Academia y parece que la pantalla no ha cambiado.
   */
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const blocked = access === "blocked" && pathname !== ROUTES.perfil;

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-surface focus:px-4 focus:text-body focus:text-ink focus:shadow-md"
      >
        {dict.common.nav.skipToContent}
      </a>

      {/* La columna. 414px es el ancho máximo del sistema de diseño; por
          encima de eso no hay diseño, así que no se inventa. */}
      <div className="mx-auto flex min-h-dvh w-full max-w-[26.5rem] flex-col bg-page">
        {/* ── Cabecera: la marca y un icono ── */}
        <header className="sticky top-0 z-30 bg-page px-5 pb-1 pt-0.5">
          <div className="navrow">
            {/* 44×44 de área táctil, pero el símbolo se queda donde lo pone
                el diseño: a 20px del borde. El margen negativo de 10px
                compensa exactamente el centrado dentro de la caja. */}
            {/* Si la pantalla puso un «Atrás», aterriza aquí y el CSS retira
                la marca: en el diseño la sustituye, no se le suma. */}
            <span id={HEADER_BACK_ID} className="contents" />
            <Link
              href={ROUTES.panel}
              className="ax-mark -ml-2.5 inline-flex size-11 items-center justify-center rounded-md"
              title={dict.common.brand.tagline}
            >
              {/* El símbolo original del cliente, no redibujado. El nombre
                  queda para lectores de pantalla: la marca ya la dice. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/marca/andex-mark.svg"
                alt={dict.common.brand.name}
                width={24}
                height={22}
                className="h-[22px] w-auto"
              />
            </Link>

            {/* Un solo icono. Si la pantalla pone el suyo —la lupa de la
                Bóveda— aterriza en este hueco y el CSS esconde la campana. */}
            <span className="navright">
              <span id={HEADER_ACTION_ID} className="contents" />
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                aria-label={shell.notifications}
                className="ax-bell ax-iconbtn"
              >
                <Glyph name="bell" icon={Bell} size={21} />
              </button>
            </span>
          </div>
        </header>

        <TopNotices pathname={pathname} />

        {/* El hueco de la barra.
            Es `position: fixed`, así que no ocupa sitio en el flujo y se
            comía los últimos ~82px de cada pantalla — se veía tapando la
            primera fila de «Próximos lanzamientos» en la Tienda. El padding
            reserva su altura más el aire de debajo y el área segura del
            teléfono. */}
        <main
          id="contenido"
          className="min-w-0 flex-1 px-5"
          style={{
            paddingBottom:
              "calc(var(--bar-height) + 30px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          {loading ? (
            <div aria-busy="true" aria-live="polite" className="w-full">
              <p className="text-body text-muted">{dict.panel.empty.loading}</p>
              <div className="mt-6 space-y-4">
                <Skeleton variant="card" className="h-40 rounded-xl" />
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="card" />
                  ))}
                </div>
              </div>
            </div>
          ) : blocked ? (
            // §3.4.7 — panel bloqueado, cuenta y perfil INTACTOS.
            <div className="ax-card mt-4">
              <Badge variant="neutral">{dict.perfil.subscription.statusCanceled}</Badge>
              <h1 className="largeTitle">{dict.panel.notices.expiredTitle}</h1>
              <p className="mt-2 text-body text-muted">
                {dict.panel.notices.expiredBody}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href={ROUTES.membresia}>
                  {dict.panel.notices.expiredCta}
                </Button>
                <Button href={ROUTES.perfil} variant="ghost">
                  {dict.common.nav.profile}
                </Button>
              </div>
            </div>
          ) : (
            children
          )}
        </main>

        <TabBar dict={dict} pathname={pathname} />
      </div>

      <Modal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title={shell.notifications}
        closeLabel={dict.common.aria.closeModal}
      >
        <p className="text-body text-muted">{shell.notificationsEmpty}</p>
      </Modal>
    </div>
  );
}
