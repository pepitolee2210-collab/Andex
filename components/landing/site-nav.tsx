"use client";

/**
 * S1 · NAVEGACIÓN de la landing.
 *
 * Tres cosas que hace y conviene entender antes de tocarla:
 *
 * 1. **Se vuelve sólida al hacer scroll, no antes.** En el pliegue superior
 *    la barra es transparente y deja respirar al hero; en cuanto la página
 *    se mueve aparece el fondo translúcido con `backdrop-blur` y el borde.
 *    Es una sola clase condicional, sin re-render por píxel: el estado solo
 *    cambia al cruzar el umbral (`useMotionValueEvent` sobre `scrollY`).
 *
 * 2. **Línea de progreso de lectura** al borde inferior de la barra, en
 *    teal. `useScroll().scrollYProgress` pasado por `useSpring` para que no
 *    tiemble con el scroll suave de Lenis. Con `prefers-reduced-motion` se
 *    usa el valor crudo: la línea sigue informando, pero sin inercia.
 *
 * 3. **Menú de pantalla completa por debajo de 1024px** con las tres reglas
 *    que hacen que un panel sea usable de verdad y no una trampa: cierre
 *    con Escape, foco atrapado dentro mientras está abierto, y scroll del
 *    documento bloqueado. Al cerrar, el foco vuelve al botón que lo abrió.
 *
 * A 320px la barra son DOS elementos: marca y hamburguesa. El diseño
 * anterior metía "Iniciar sesión" y "Comenzar ahora" en la misma fila y
 * ambos partían en dos líneas; aquí esos dos CTAs viven dentro del panel,
 * a ancho completo, donde no compiten por espacio con nadie.
 *
 * Todo el copy llega por props. Importar `@/lib/i18n` desde un componente
 * cliente metería los nueve diccionarios en ES y EN en el bundle de la
 * página pública (§3.1.1, presupuesto de 300 KB).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { Menu, X } from "lucide-react";

import { ROUTES } from "@/lib/config";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CtaLink } from "./cta-link";

/**
 * Los cinco destinos ancla de la página. El orden es el del recorrido, y
 * las claves casan una a una con `dict.landing.nav.links`, así que añadir
 * un enlace sin su copy es error de compilación.
 */
/*
 * Tres, no cinco. El rediseno de la landing sustituyo `SectionServicios` y
 * `SectionComunidad` por la vitrina de modulos, y esos dos enlaces quedaron
 * apuntando a un `id` que ya no existe: pulsarlos no hacia nada. Un enlace
 * muerto, con este publico, es la primera senal de que el sitio no es lo que
 * dice. Su copy sigue en el diccionario por si esas secciones vuelven.
 */
/*
 * El documento maestro pide cinco enlaces: Soluciones · Módulos · Inglés en
 * Vivo · Servicios con 20% OFF · Membresía. Quedan tres, y cada baja tiene
 * su motivo:
 *
 *  · «Servicios con 20% OFF» — su sección se dejó fuera por decisión del
 *    producto, así que el enlace no llevaría a ninguna parte.
 *  · «Soluciones» — en la estructura reducida no hay una sección que sea
 *    «las soluciones»: los módulos ya tienen su enlace y el resto son la
 *    historia del fundador y el respaldo. Antes apuntaba a `#solucion`, un
 *    `id` que vivía en una sección que esta versión ya no monta.
 *
 * Un enlace muerto, con este público, es la primera señal de que el sitio
 * no es lo que dice ser.
 */
const NAV_ORDER = ["modulos", "ingles", "precios"] as const;

type NavKey = (typeof NAV_ORDER)[number];

/**
 * Los `id` que el ensamblador debe poner en las secciones. `site-footer.tsx`
 * repite cuatro de estos cinco en su propia constante en vez de importarlos:
 * cruzar un valor desde un módulo `"use client"` hacia un Server Component
 * lo convierte en referencia de cliente y leerlo en el servidor revienta.
 * Son cinco cadenas; la duplicación sale más barata que el acoplamiento.
 */
const NAV_HREF: Record<NavKey, string> = {
  modulos: "#modulos",
  ingles: "#ingles",
  precios: "#precios",
};

export type SiteNavCopy = {
  brand: string;
  tagline: string;
  links: Record<NavKey, string>;
  login: string;
  cta: string;
  openMenu: string;
  closeMenu: string;
};

export type SiteNavProps = {
  /** `dict.landing.nav` completo. */
  copy: SiteNavCopy;
  /** Idioma activo (cookie `andex_lang`), para el LanguageToggle. */
  lang: Lang;
  /** Tema conocido por el servidor (cookie `andex_theme`), evita parpadeo. */
  initialTheme?: "light" | "dark" | "system";
  /** aria-label del selector de idioma. Sugerido: `dict.common.lang.ariaSwitch`. */
  langAriaLabel?: string;
  /** aria-label del selector de tema. Sugerido: `dict.common.theme.ariaSwitch`. */
  themeAriaLabel?: string;
  /** Nombres de los tres estados de tema. Sugerido: `dict.common.theme.*`. */
  themeLabels?: { light: string; dark: string; system: string };
  /** Destino de "Iniciar sesión". Default: `ROUTES.login`. */
  loginHref?: string;
  /** Destino del CTA primario. Default: `ROUTES.registro`. */
  ctaHref?: string;
  /** Ruta a la que vuelve el cambio de idioma. Default: `ROUTES.landing`. */
  backPath?: string;
  className?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SiteNav({
  copy,
  lang,
  initialTheme,
  langAriaLabel,
  themeAriaLabel,
  themeLabels,
  loginHref = ROUTES.login,
  ctaHref = ROUTES.registro,
  backPath = ROUTES.landing,
  className,
}: SiteNavProps) {
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { scrollY, scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 34,
    restDelta: 0.001,
  });
  // Sin inercia cuando el sistema pide menos movimiento: la barra sigue
  // marcando cuánto queda, pero no "persigue" al scroll.
  const progress = reduced ? scrollYProgress : smoothProgress;

  useMotionValueEvent(scrollY, "change", (value) => {
    const next = value > 8;
    setScrolled((prev) => (prev === next ? prev : next));
  });

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  /**
   * Al cruzar a escritorio el panel deja de tener sentido (y queda oculto
   * por `lg:hidden`), pero su bloqueo de scroll y su trampa de foco
   * seguirían activos. Se cierra solo.
   */
  useEffect(() => {
    if (!menuOpen) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (desktop.matches) closeMenu();
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, [menuOpen, closeMenu]);

  /** Escape + trampa de foco + bloqueo de scroll + devolución del foco. */
  useEffect(() => {
    if (!menuOpen) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const focusables = (): HTMLElement[] => {
      const node = panelRef.current;
      if (!node) return [];
      return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
    };

    focusables()[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const list = focusables();
      if (list.length === 0) return;

      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      const inside = panelRef.current?.contains(active) ?? false;

      if (event.shiftKey) {
        if (!inside || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!inside || active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [menuOpen]);

  const panelDuration = reduced ? 0 : 0.28;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b transition-colors duration-300",
          scrolled
            ? "border-[color:var(--hairline-on-invert-soft)] bg-[color:var(--navy-deep)]/85 backdrop-blur-lg"
            : "border-transparent bg-transparent",
          className,
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
          {/* ── Marca ── */}
          <a
            href={ROUTES.landing}
            className="mr-auto inline-flex min-h-11 shrink-0 flex-col justify-center"
          >
            <span className="font-heading text-h3 font-bold tracking-tight text-[color:var(--text-on-invert)]">
              {copy.brand}
            </span>
            {/* El tagline solo cabe con holgura a partir de 1440px: entre
                1024 y 1439 la fila ya va justa con cinco enlaces + cuatro
                controles a la derecha. */}
            <span className="hidden text-caption leading-tight text-[color:var(--text-on-invert-quiet)] xl:block">
              {copy.tagline}
            </span>
          </a>

          {/* ── Menú central (solo ≥1024px) ──
              `text-label` a propósito: son etiquetas de navegación, no
              cuerpo de texto, y a 16px los cinco enlaces + los controles
              de la derecha no caben en 1024px sin desbordar. Desde 1440
              hay sitio de sobra y suben a 16px. */}
          <nav
            aria-label={copy.brand}
            className="hidden min-w-0 items-center lg:flex"
          >
            {NAV_ORDER.map((key) => (
              <a
                key={key}
                href={NAV_HREF[key]}
                className={cn(
                  "inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-2 xl:px-3",
                  "text-label font-medium text-[color:var(--text-on-invert-quiet)] xl:text-body",
                  "transition-colors duration-150 hover:bg-[color:var(--surface-on-invert)] hover:text-[color:var(--text-on-invert)]",
                )}
              >
                {copy.links[key]}
              </a>
            ))}
          </nav>

          {/* ── Controles de la derecha (solo ≥1024px) ── */}
          <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
            <LanguageToggle
              lang={lang}
              backPath={backPath}
              ariaLabel={langAriaLabel}
            />
            <ThemeToggle
              initialTheme={initialTheme}
              ariaLabel={themeAriaLabel}
              labels={themeLabels}
            />
            <Button
              href={loginHref}
              variant="ghost"
              className="whitespace-nowrap px-2.5 xl:px-4"
            >
              {copy.login}
            </Button>
            <CtaLink
              position="header"
              href={ctaHref}
              className="whitespace-nowrap px-4 xl:px-5"
            >
              {copy.cta}
            </CtaLink>
          </div>

          {/* ── Hamburguesa (solo <1024px) ── */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={copy.openMenu}
            aria-expanded={menuOpen}
            aria-controls="andex-nav-panel"
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-md",
              "border border-[color:var(--hairline-on-invert-soft)] bg-[color:var(--surface-on-invert)] text-[color:var(--text-on-invert)]",
              "transition-colors duration-150 hover:bg-[color:var(--hairline-on-invert)] lg:hidden",
            )}
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
        </div>

        {/* ── Línea de progreso de lectura ──
            Decorativa para el lector de pantalla: la información que da
            (cuánto queda de página) ya la da el scroll del navegador. */}
        <motion.div
          aria-hidden="true"
          style={{ scaleX: progress }}
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-teal"
        />
      </header>

      {/* ── Panel móvil a pantalla completa ── */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            key="andex-nav-panel"
            id="andex-nav-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={copy.brand}
            initial={reduced ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: panelDuration, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain bg-page lg:hidden"
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-2">
              <span className="mr-auto inline-flex min-h-11 flex-col justify-center">
                <span className="font-heading text-h3 font-bold tracking-tight text-ink">
                  {copy.brand}
                </span>
                <span className="text-caption leading-tight text-muted">
                  {copy.tagline}
                </span>
              </span>
              <button
                type="button"
                onClick={closeMenu}
                aria-label={copy.closeMenu}
                className={cn(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-md",
                  "border border-line bg-surface text-ink",
                  "transition-colors duration-150 hover:bg-surface-alt",
                )}
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            {/* Enlaces grandes y separados: el pulgar acierta a la primera. */}
            <nav aria-label={copy.brand} className="flex flex-col px-4 py-2">
              {NAV_ORDER.map((key) => (
                <a
                  key={key}
                  href={NAV_HREF[key]}
                  onClick={closeMenu}
                  className={cn(
                    "flex min-h-14 items-center border-b border-line",
                    "font-heading text-h3 text-ink",
                    "transition-colors duration-150 hover:text-teal-deep",
                  )}
                >
                  {copy.links[key]}
                </a>
              ))}
            </nav>

            {/* mt-auto: los CTAs se pegan abajo, al alcance del pulgar,
                cuando el panel sobra de alto. */}
            <div className="mt-auto flex flex-col gap-3 px-4 pb-6 pt-4">
              <div className="flex items-center gap-2">
                <LanguageToggle
                  lang={lang}
                  backPath={backPath}
                  ariaLabel={langAriaLabel}
                />
                <ThemeToggle
                  initialTheme={initialTheme}
                  ariaLabel={themeAriaLabel}
                  labels={themeLabels}
                />
              </div>
              <CtaLink
                position="header"
                href={ctaHref}
                size="lg"
                fullWidth
                className="whitespace-nowrap"
              >
                {copy.cta}
              </CtaLink>
              <Button
                href={loginHref}
                variant="secondary"
                size="lg"
                fullWidth
                className="whitespace-nowrap"
              >
                {copy.login}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
