"use client";

/**
 * Shell del panel — los dos wireframes de §2.4.
 *
 * Mobile (<640):   topbar de 56px (isotipo, campana, avatar) + drawer lateral
 *                  + tab bar inferior (Inicio, Academia, Comunidad, Perfil).
 * sm (640–1023):   sidebar izquierdo COLAPSADO (solo iconos) + feed.
 * lg (1024–1439):  sidebar izquierdo de 240px + feed.
 * xl (≥1440):      lo anterior + sidebar derecho contextual de 320px, que
 *                  monta la propia pantalla (es contenido, no chrome).
 *
 * §4.3 — lo que NO se adapta y por eso vive aquí: la presencia y accesibilidad
 * de los 7 módulos (siempre en ORDEN CANÓNICO en la navegación, jamás
 * reordenados), el acceso a perfil, configuración y ayuda, y el botón
 * "Explorar todos los módulos".
 *
 * §2.8 — La Ruta aparece una sola vez: el chip compacto del topbar.
 * §2.9 — el sello NO aparece aquí. Es del paywall y solo del paywall.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  GraduationCap,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { PAST_DUE_GRACE_DAYS, ROUTES } from "@/lib/config";
import { signOut } from "@/lib/auth/client";
import { MODULES } from "@/lib/catalogs/modules";
import type { Dictionary } from "@/lib/i18n";
import type { ModuleId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ModuleIcon } from "@/components/module-icon";
import { LocationChip } from "./location-chip";
import { usePanel } from "./panel-context";
import { ShellDock } from "./shell-dock";
import { formatDate } from "./panel-utils";

const SIDEBAR_KEY = "andex_panel_sidebar_collapsed";
/** Ancla del grid de módulos: destino de "Explorar todos los módulos" (§4.3). */
export const MODULES_ANCHOR = "modulos";

// ── Navegación (§4.3: fija, idéntica para todos) ─────────

type NavLink = {
  href: string;
  label: string;
  icon: ReactNode;
};

function moduleLinks(dict: Dictionary): NavLink[] {
  // Orden CANÓNICO del catálogo, nunca el del ranking: §4.3 congela la
  // navegación a propósito para que nadie pierda de vista un módulo.
  return MODULES.map((meta) => ({
    href: ROUTES.modulo(meta.slug),
    label: dict.panel.shell.moduleNav[meta.id as ModuleId],
    icon: <ModuleIcon slug={meta.slug} size={20} />,
  }));
}

function isActive(pathname: string, href: string): boolean {
  const clean = href.split("#")[0];
  return pathname === clean;
}

// ── Piezas del shell ─────────────────────────────────────

function NavItem({
  link,
  active,
  showLabel,
  onNavigate,
}: {
  link: NavLink;
  active: boolean;
  /** false = sidebar colapsado: solo icono, el texto queda para lectores. */
  showLabel: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title={showLabel ? undefined : link.label}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-md px-3 text-body transition-colors",
        showLabel ? "justify-start" : "justify-center",
        active
          ? "bg-teal-soft font-medium text-ink"
          : "text-muted hover:bg-surface-alt hover:text-ink",
      )}
    >
      <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
        {link.icon}
      </span>
      <span className={cn("min-w-0 truncate", showLabel ? "inline" : "sr-only")}>
        {link.label}
      </span>
    </Link>
  );
}

function NavSection({
  dict,
  pathname,
  showLabels,
  onNavigate,
}: {
  dict: Dictionary;
  pathname: string;
  showLabels: boolean;
  onNavigate?: () => void;
}) {
  const shell = dict.panel.shell;
  const modules = moduleLinks(dict);

  return (
    <nav aria-label={shell.primaryNavAria} className="flex flex-1 flex-col gap-1">
      <NavItem
        link={{
          href: ROUTES.panel,
          label: shell.home,
          icon: <Home aria-hidden="true" className="size-5" />,
        }}
        active={isActive(pathname, ROUTES.panel)}
        showLabel={showLabels}
        onNavigate={onNavigate}
      />

      <p
        className={cn(
          "mt-4 px-3 text-caption font-semibold uppercase tracking-wide text-muted",
          showLabels ? "block" : "sr-only",
        )}
      >
        {shell.modulesNavTitle}
      </p>
      {modules.map((link) => (
        <NavItem
          key={link.href}
          link={link}
          active={isActive(pathname, link.href)}
          showLabel={showLabels}
          onNavigate={onNavigate}
        />
      ))}

      {/* §4.3 — botón fijo para todos, en todas las pantallas del panel. */}
      <NavItem
        link={{
          href: `${ROUTES.panel}#${MODULES_ANCHOR}`,
          label: shell.exploreAll,
          icon: <LayoutGrid aria-hidden="true" className="size-5" />,
        }}
        active={false}
        showLabel={showLabels}
        onNavigate={onNavigate}
      />

      <div aria-hidden="true" className="my-3 border-t border-line" />

      <NavItem
        link={{
          href: ROUTES.perfil,
          label: dict.common.nav.profile,
          icon: <User aria-hidden="true" className="size-5" />,
        }}
        active={isActive(pathname, ROUTES.perfil)}
        showLabel={showLabels}
        onNavigate={onNavigate}
      />
      <NavItem
        link={{
          href: `${ROUTES.perfil}#preferencias`,
          label: shell.settings,
          icon: <Settings aria-hidden="true" className="size-5" />,
        }}
        active={false}
        showLabel={showLabels}
        onNavigate={onNavigate}
      />
      <NavItem
        link={{
          href: ROUTES.contacto,
          label: shell.help,
          icon: <CircleHelp aria-hidden="true" className="size-5" />,
        }}
        active={isActive(pathname, ROUTES.contacto)}
        showLabel={showLabels}
        onNavigate={onNavigate}
      />
    </nav>
  );
}

/** Tab bar inferior, solo <640px (§2.4). Cuatro destinos reales. */
function TabBar({ dict, pathname }: { dict: Dictionary; pathname: string }) {
  const shell = dict.panel.shell;
  const tabs: NavLink[] = [
    {
      href: ROUTES.panel,
      label: shell.home,
      icon: <Home aria-hidden="true" className="size-5" />,
    },
    {
      href: ROUTES.modulo("academia"),
      label: shell.moduleNav[6],
      icon: <GraduationCap aria-hidden="true" className="size-5" />,
    },
    {
      href: ROUTES.modulo("comunidad"),
      label: shell.moduleNav[5],
      icon: <Users aria-hidden="true" className="size-5" />,
    },
    {
      href: ROUTES.perfil,
      label: dict.common.nav.profile,
      icon: <User aria-hidden="true" className="size-5" />,
    },
  ];

  return (
    <nav
      aria-label={shell.tabBarAria}
      className="k-chrome sticky bottom-0 z-30 border-t border-line bg-surface sm:hidden"
    >
      <ul className="flex items-stretch">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href} className="min-w-0 flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-caption transition-colors",
                  active ? "font-medium text-ink" : "text-muted",
                )}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span className="w-full truncate text-center">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
function TopNotices() {
  const { dict, subscription, access, lang } = usePanel();
  const notices = dict.panel.notices;

  if (access === "read-only") {
    return (
      <div className="border-b border-line bg-amber-soft px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2">
          <p className="min-w-0 flex-1 text-body text-ink">
            <strong className="font-semibold">{notices.pastDueTitle}.</strong>{" "}
            {notices.pastDueBody(PAST_DUE_GRACE_DAYS)}
          </p>
          <Button href={ROUTES.membresia} variant="secondary">
            {notices.pastDueCta}
          </Button>
        </div>
      </div>
    );
  }

  if (subscription?.cancelAtPeriodEnd && access === "full") {
    return (
      <div className="border-b border-line bg-surface-alt px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2">
          <p className="min-w-0 flex-1 text-body text-ink">
            <strong className="font-semibold">{notices.canceledTitle}.</strong>{" "}
            {notices.canceledBody(formatDate(subscription.currentPeriodEnd, lang))}
          </p>
          <Button href={ROUTES.perfil} variant="ghost">
            {notices.canceledCta}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Shell ────────────────────────────────────────────────

export function PanelShell({ children }: { children: ReactNode }) {
  const { dict, lang, loading, profile, access } = usePanel();
  const pathname = usePathname() ?? ROUTES.panel;
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);

  const shell = dict.panel.shell;

  // Preferencia de sidebar colapsado. Se lee tras montar para no romper la
  // hidratación (el servidor no conoce localStorage).
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "1");
    } catch {
      /* almacenamiento bloqueado: se queda expandido */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      } catch {
        /* ignorar */
      }
      return next;
    });
  }

  // El drawer usa <dialog> nativo: trampa de foco, Escape y `inert` del fondo
  // salen gratis y bien implementados por el navegador.
  useEffect(() => {
    const dialog = drawerRef.current;
    if (!dialog) return;
    if (drawerOpen && !dialog.open) dialog.showModal();
    if (!drawerOpen && dialog.open) dialog.close();
  }, [drawerOpen]);

  // Al navegar, el drawer se cierra solo.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    router.push(ROUTES.landing);
  }

  const blocked = access === "blocked" && pathname !== ROUTES.perfil;

  /* ══ UNA SOLA NAVEGACIÓN, EN TODAS LAS PANTALLAS ══
     Antes esto se aplicaba SÓLO al inicio, y era un error que se veía al
     primer toque: se entraba en la Bóveda desde el dock y aparecía la barra
     superior y la de pestañas del panel viejo. Dos menús distintos, dos
     sitios para ir a Comunidad, y la sensación de haber cambiado de
     aplicación a mitad de camino.

     Ahora el cromo es el mismo en todas: el dock abajo, permanente, y cada
     pantalla con su propia cabecera. La barra superior, la de pestañas y el
     lateral del panel dejan de montarse.

     Lo que NO cambia: los avisos de suscripción siguen arriba —si la cuenta
     está vencida hay que decirlo—, y la cuenta bloqueada mantiene el shell
     completo, porque ahí lo que toca no es navegar sino resolver el pago. */
  if (!blocked) {
    return (
      <div className="shell-os flex min-h-dvh flex-col pb-[152px]">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-surface focus:px-4 focus:text-body focus:text-ink focus:shadow-md"
        >
          {dict.common.nav.skipToContent}
        </a>
        <TopNotices />
        <main id="contenido" className="flex-1">{children}</main>
        <ShellDock pathname={pathname} />
      </div>
    );
  }

  return (
    /* `shell-os` sustituye a `bg-page`: no es sólo un fondo, es el remapeo
       completo de los tokens (ver `app/motion.css`). Todo lo que cuelga de
       aquí —tarjetas, botones, campos, modales— resuelve sus colores contra
       la superficie oscura sin que haya que tocar un solo componente. */
    <div className="shell-os flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-surface focus:px-4 focus:text-body focus:text-ink focus:shadow-md"
      >
        {dict.common.nav.skipToContent}
      </a>

      {/* ── Topbar 56px (§2.4) ── */}
      <header className="k-chrome sticky top-0 z-30 border-b border-line bg-surface">
        <div className="flex h-14 items-center gap-1 px-3 sm:px-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={dict.common.aria.openMenu}
            aria-expanded={drawerOpen}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface-alt sm:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>

          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? shell.expand : shell.collapse}
            className="hidden size-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink lg:inline-flex"
          >
            {collapsed ? (
              <ChevronsRight aria-hidden="true" className="size-5" />
            ) : (
              <ChevronsLeft aria-hidden="true" className="size-5" />
            )}
          </button>

          <Link
            href={ROUTES.panel}
            className="inline-flex min-h-11 shrink-0 items-center rounded-md px-1 font-heading text-body font-bold tracking-tight text-ink sm:px-2 sm:text-h3"
            title={dict.common.brand.tagline}
          >
            {dict.common.brand.name}
          </Link>

          <div className="ml-auto flex min-w-0 items-center gap-1">
            {profile ? (
              <LocationChip dict={dict} lang={lang} profile={profile} />
            ) : null}

            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              aria-label={shell.notifications}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <Bell aria-hidden="true" className="size-5" />
            </button>

            <Link
              href={ROUTES.perfil}
              aria-label={dict.common.nav.profile}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-ink transition-colors hover:bg-surface-alt"
            >
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-full bg-teal-soft text-caption font-semibold text-teal-deep"
              >
                {profile?.firstName?.trim().charAt(0).toUpperCase() || (
                  <User className="size-4" />
                )}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ── Sidebar izquierdo colapsable (§2.4) ── */}
        <aside
          className={cn(
            "k-chrome sticky top-14 hidden h-[calc(100dvh-3.5rem)] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface px-2 py-4 sm:flex",
            collapsed ? "w-[4.5rem]" : "w-[4.5rem] lg:w-60",
          )}
        >
          <NavSection dict={dict} pathname={pathname} showLabels={!collapsed} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNotices />

          <main id="contenido" className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {loading ? (
              <div aria-busy="true" aria-live="polite" className="mx-auto w-full max-w-6xl">
                <p className="text-body text-muted">{dict.panel.empty.loading}</p>
                <div className="mt-6 space-y-4">
                  <Skeleton variant="card" className="h-40 rounded-xl" />
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {[0, 1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="card" />
                    ))}
                  </div>
                </div>
              </div>
            ) : blocked ? (
              // §3.4.7 — panel bloqueado, cuenta y perfil INTACTOS.
              <div className="mx-auto w-full max-w-xl rounded-xl border border-line bg-surface p-6 shadow-sm">
                <Badge variant="neutral">{dict.perfil.subscription.statusCanceled}</Badge>
                <h1 className="mt-3 font-heading text-h1 text-ink">
                  {dict.panel.notices.expiredTitle}
                </h1>
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
        </div>
      </div>

      <TabBar dict={dict} pathname={pathname} />

      {/* ── Drawer lateral (mobile, §2.4) ── */}
      <dialog
        ref={drawerRef}
        onClose={() => setDrawerOpen(false)}
        aria-label={shell.menuTitle}
        className="m-0 h-dvh max-h-none w-[17rem] max-w-[85vw] rounded-none bg-surface p-0 text-ink shadow-lg backdrop:bg-navy/60"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="px-1 font-heading text-h3 tracking-tight text-ink">
              {dict.common.brand.name}
            </span>
            <button
              type="button"
              onClick={() => drawerRef.current?.close()}
              aria-label={dict.common.aria.closeMenu}
              className="inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3">
            <NavSection
              dict={dict}
              pathname={pathname}
              showLabels
              onNavigate={() => drawerRef.current?.close()}
            />
          </div>

          <div className="border-t border-line px-2 py-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-body text-muted transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <LogOut aria-hidden="true" className="size-5 shrink-0" />
              {dict.common.nav.logout}
            </button>
          </div>
        </div>
      </dialog>

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
