import type { Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * LanguageToggle ES│EN (§2.5, §2.7) — server-friendly: funciona SIN
 * JavaScript porque cada opción es un enlace a GET /api/prefs
 * (requisito §3.1.1: "Funciona sin JavaScript: Hero + CTA sí").
 *
 * El idioma activo se marca con aria-current. Targets ≥44px.
 */

export type LanguageToggleProps = {
  /** Idioma activo (el consumidor lo lee de la cookie andex_lang). */
  lang: Lang;
  /** Ruta interna a la que volver tras el cambio, p. ej. "/entrevista". */
  backPath: string;
  /** Etiqueta accesible del grupo. Default: "Idioma". */
  ariaLabel?: string;
  className?: string;
};

const OPTIONS: Array<{ code: Lang; label: string }> = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

export function LanguageToggle({
  lang,
  backPath,
  ariaLabel = "Idioma",
  className,
}: LanguageToggleProps) {
  const back = encodeURIComponent(backPath || "/");

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-surface p-0.5",
        className,
      )}
    >
      {OPTIONS.map((opt, i) => {
        const active = opt.code === lang;
        return (
          <span key={opt.code} className="flex items-center">
            {i > 0 ? (
              <span aria-hidden="true" className="h-4 w-px bg-line" />
            ) : null}
            <a
              href={`/api/prefs?lang=${opt.code}&back=${back}`}
              aria-current={active ? "true" : undefined}
              hrefLang={opt.code}
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3",
                "text-label transition-colors duration-150",
                active
                  ? "bg-surface-alt font-semibold text-ink"
                  : "font-medium text-muted hover:text-ink",
              )}
            >
              {opt.label}
            </a>
          </span>
        );
      })}
    </nav>
  );
}
