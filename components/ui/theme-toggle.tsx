"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { COOKIES } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * ThemeToggle (§2.6) — cicla claro → oscuro → sistema.
 *
 * Al hacer clic:
 * 1. Aplica data-theme al <html> AL INSTANTE (sin esperar red).
 * 2. Escribe la cookie andex_theme (system = borrarla; sin cookie decide
 *    prefers-color-scheme, ver globals.css).
 * 3. Notifica a /api/prefs en background para que el server quede en sync.
 */

type ThemeChoice = "light" | "dark" | "system";

const ORDER: ThemeChoice[] = ["light", "dark", "system"];
const YEAR_S = 60 * 60 * 24 * 365;

function readCookieTheme(): ThemeChoice {
  if (typeof document === "undefined") return "system";
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${COOKIES.theme}=(light|dark)`),
  );
  return (match?.[1] as ThemeChoice | undefined) ?? "system";
}

function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
    document.cookie = `${COOKIES.theme}=; path=/; max-age=0; samesite=lax`;
  } else {
    root.setAttribute("data-theme", choice);
    document.cookie = `${COOKIES.theme}=${choice}; path=/; max-age=${YEAR_S}; samesite=lax`;
  }
  // Background sync — el endpoint redirige, el resultado no importa.
  fetch(`/api/prefs?theme=${choice}&back=/`, { keepalive: true }).catch(() => {
    /* sin red no pasa nada: la cookie local ya quedó escrita */
  });
}

export type ThemeToggleProps = {
  /**
   * Estado inicial conocido por el server (cookie andex_theme), para
   * evitar parpadeo de icono. Si no llega, se lee la cookie al montar.
   */
  initialTheme?: ThemeChoice;
  /** Prefijo del aria-label. Default: "Cambiar tema". */
  ariaLabel?: string;
  /** Nombres visibles/anunciados de cada estado (defaults en español). */
  labels?: Record<ThemeChoice, string>;
  className?: string;
};

const DEFAULT_LABELS: Record<ThemeChoice, string> = {
  light: "claro",
  dark: "oscuro",
  system: "según el sistema",
};

export function ThemeToggle({
  initialTheme,
  ariaLabel = "Cambiar tema",
  labels = DEFAULT_LABELS,
  className,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeChoice>(initialTheme ?? "system");

  // Sin prop del server: sincroniza con la cookie real tras montar.
  useEffect(() => {
    if (initialTheme === undefined) {
      setTheme(readCookieTheme());
    }
  }, [initialTheme]);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    applyTheme(next);
  }

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${ariaLabel} (actual: ${labels[theme]})`}
      title={`${ariaLabel} (actual: ${labels[theme]})`}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-md border border-line bg-surface text-muted",
        "transition-colors duration-150 hover:bg-surface-alt hover:text-ink",
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
