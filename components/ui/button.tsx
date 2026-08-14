import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Button (§2.5) — variantes primary, secondary, ghost, danger.
 * Estados: default / hover / active / focus-visible / disabled / loading.
 *
 * Contraste (§2.1.1):
 * - primary → bg-teal-deep + text-on-accent (blanco sobre #0F766E, 5.47:1 ✓;
 *   en oscuro se invierte solo vía tokens).
 * - danger  → bg-danger + text-on-accent (blanco sobre #B42318 en claro,
 *   navy-oscuro sobre rojo claro en dark — el token resuelve ambos).
 * - hover/active con brightness: no introduce colores nuevos y funciona
 *   en ambos temas.
 *
 * Sin "use client": es compartido. Con `href` renderiza un enlace
 * (<Link> interno, <a> externo); sin él, un <button>.
 * Target táctil mínimo 44px (min-h-11) en todos los tamaños.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-teal-deep text-on-accent shadow-sm hover:brightness-95 active:brightness-90",
  secondary:
    "border border-ink bg-transparent text-ink hover:bg-surface-alt active:bg-surface-alt",
  ghost: "bg-transparent text-ink hover:bg-surface-alt active:bg-surface-alt",
  danger:
    "bg-danger text-on-accent shadow-sm hover:brightness-95 active:brightness-90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-body",
  lg: "min-h-12 px-7 text-body-lg",
};

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Muestra spinner accesible, marca aria-busy y bloquea la acción. */
  loading?: boolean;
  /** Anuncio para lectores durante loading. Default: "Cargando". */
  loadingLabel?: string;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps & {
  href?: undefined;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;

type ButtonAsLink = CommonProps & {
  /** Con href el botón se renderiza como enlace. */
  href: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href">;

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Qué NO debe pasar por `next/link`.
 *
 * Además de las URL absolutas y `mailto:`, entran aquí `blob:` y `data:`:
 * son archivos generados en el propio navegador —un PDF recién escaneado,
 * por ejemplo— y el enrutador los trataría como una ruta de la aplicación,
 * intentaría prefetcharlos y rompería la descarga.
 */
function isExternal(href: string): boolean {
  return (
    /^(https?:)?\/\//.test(href) ||
    href.startsWith("mailto:") ||
    href.startsWith("blob:") ||
    href.startsWith("data:")
  );
}

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    loadingLabel = "Cargando",
    fullWidth = false,
    className,
    children,
    ...rest
  } = props;

  /* `data-variant` no cambia nada por sí solo: es el gancho que permite a
     la cáscara del sistema (`app/motion.css`) vestir el botón principal con
     el degradado del prototipo SIN tocar este componente ni sus 60 llamadas.
     Fuera de `.shell-os` el botón sigue exactamente igual que antes. */
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium",
    "select-none transition-[background-color,border-color,box-shadow,filter] duration-150",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && "w-full",
    className,
  );

  const content = (
    <>
      {loading ? (
        <>
          <Loader2 aria-hidden="true" className="size-4.5 shrink-0 animate-spin" />
          <span className="sr-only">{loadingLabel}</span>
        </>
      ) : null}
      {children}
    </>
  );

  if (typeof props.href === "string") {
    const { href, ...anchorRest } = rest as Omit<ButtonAsLink, keyof CommonProps> & {
      href: string;
    };
    const linkProps = {
      className: classes,
      "data-variant": variant,
      "aria-busy": loading || undefined,
      "aria-disabled": loading || undefined,
      tabIndex: loading ? -1 : undefined,
      ...anchorRest,
    };
    return isExternal(props.href) ? (
      <a href={props.href} {...linkProps}>
        {content}
      </a>
    ) : (
      <Link href={props.href} {...linkProps}>
        {content}
      </Link>
    );
  }

  const buttonRest = rest as Omit<ButtonAsButton, keyof CommonProps>;
  return (
    <button
      type={buttonRest.type ?? "button"}
      {...buttonRest}
      disabled={buttonRest.disabled || loading}
      aria-busy={loading || undefined}
      className={classes} data-variant={variant}
    >
      {content}
    </button>
  );
}
