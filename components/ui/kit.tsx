/**
 * PRIMITIVAS DEL SISTEMA DE DISEÑO
 *
 * Las piezas del proyecto de Claude Design, en TypeScript. Cada una
 * escribe las clases de `app/kit.css` y **nada más**: ni un tamaño, ni un
 * color, ni un margen a mano. Si algo hay que ajustar, se ajusta en el
 * CSS y cambia en todas partes a la vez.
 *
 * ── Tres cosas que no vienen del diseño y aquí son obligatorias ──
 *
 * 1. **Ningún texto va dentro.** El kit trae los textos escritos en el
 *    JSX ("Verificado el…", "ANDEX no está afiliado…"). Aquí eso deja el
 *    producto en español para siempre y hace mentir al conmutador EN, así
 *    que todo entra por props y sale de `lib/i18n/`.
 *
 * 2. **`data-icon`.** El sistema de movimiento va por el nombre del icono
 *    de Lucide: el escudo se sella, la campana suena, el coche avanza.
 *    `<Glyph name="shield" icon={Shield} />` pone el atributo; sin él, el
 *    icono simplemente no se mueve, que es un fallo silencioso. Por eso
 *    hay un componente y no un `<Shield />` suelto.
 *
 * 3. **Los botones son `<button type="button">`.** El kit los deja sin
 *    `type` y dentro de un formulario eso los convierte en enviar.
 */

import type { ComponentType, CSSProperties, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
   Icono
   ───────────────────────────────────────────────────────── */

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type GlyphProps = {
  /** Nombre del icono en Lucide, en kebab-case. Es lo que activa su gesto. */
  name: string;
  icon: IconComponent;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
};

export function Glyph({
  name,
  icon: Icon,
  size = 20,
  strokeWidth = 1.75,
  className,
  style,
}: GlyphProps) {
  return (
    <Icon
      aria-hidden="true"
      data-icon={name}
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    />
  );
}

/* ─────────────────────────────────────────────────────────
   Cabecera de pantalla

   El sobretítulo dice de qué módulo es; el titular dice qué es esta
   pantalla. Separarlos es lo que permite que el titular sea corto —«Tu
   bóveda» en vez de «Bóveda Digital y Alertas»— sin perder el contexto.
   ───────────────────────────────────────────────────────── */

export type ScreenHeaderProps = {
  /** El módulo al que pertenece. Va arriba, pequeño. */
  overline?: string;
  title: string;
  /** El dato de estado: «12 documentos en 5 carpetas». */
  sub?: string;
  /** Acciones de la esquina (buscar, ajustes). */
  right?: ReactNode;
  id?: string;
  className?: string;
};

export function ScreenHeader({
  overline,
  title,
  sub,
  right,
  id,
  className,
}: ScreenHeaderProps) {
  return (
    <header className={className}>
      {right ? (
        <div className="navrow">
          <span />
          <span className="navright">{right}</span>
        </div>
      ) : null}
      {overline ? <p className="navover">{overline}</p> : null}
      <h1 id={id} className="largeTitle">
        {title}
      </h1>
      {sub ? <p className="navsub">{sub}</p> : null}
    </header>
  );
}

/* ─────────────────────────────────────────────────────────
   Rótulo de sección

   No es un título, es un rótulo: separa, no compite. Por eso va en
   versalitas de 13px y no es un `<h2>` salvo que se le pase `as`.
   ───────────────────────────────────────────────────────── */

export type SectionLabelProps = {
  children: ReactNode;
  /** El enlace de la derecha («Ver las 5»). */
  action?: ReactNode;
  as?: "div" | "h2" | "h3";
  id?: string;
  className?: string;
};

export function SectionLabel({
  children,
  action,
  as: Tag = "div",
  id,
  className,
}: SectionLabelProps) {
  return (
    <Tag id={id} className={cn("seclbl", className)}>
      <span>{children}</span>
      {action}
    </Tag>
  );
}

/* ─────────────────────────────────────────────────────────
   Lista agrupada
   ───────────────────────────────────────────────────────── */

export type ListGroupProps = {
  children: ReactNode;
  as?: "div" | "ul";
  className?: string;
};

export function ListGroup({ children, as: Tag = "div", className }: ListGroupProps) {
  return <Tag className={cn("ax-group", className)}>{children}</Tag>;
}

export type ListRowTone = "quiet" | "accent" | "highlight" | "invert";

export type ListRowProps = {
  iconName?: string;
  icon?: IconComponent;
  iconTone?: ListRowTone;
  title: ReactNode;
  meta?: ReactNode;
  /** El aviso al pie, separado por un filete. Para lo que hay que leer. */
  warn?: ReactNode;
  badge?: ReactNode;
  /** El galón de la derecha. Se quita cuando la fila no lleva a ningún sitio. */
  trail?: ReactNode;
  onClick?: () => void;
  href?: string;
  external?: boolean;
  className?: string;
  /**
   * El botón real. Hace falta para devolver el foco a la fila de la que se
   * salió cuando un detalle sustituye a la lista y se vuelve: sin esto,
   * quien navega con teclado o lector reaparece al principio de la página.
   */
  buttonRef?: (node: HTMLButtonElement | null) => void;
};

export function ListRow({
  iconName,
  icon,
  iconTone = "quiet",
  title,
  meta,
  warn,
  badge,
  trail,
  onClick,
  href,
  external,
  className,
  buttonRef,
}: ListRowProps) {
  const inner = (
    <>
      {icon && iconName ? (
        <span className={cn("rowicon", `tone-${iconTone}`)}>
          <Glyph name={iconName} icon={icon} />
        </span>
      ) : null}
      <span className="rowmain">
        <span className="rowtitle">{title}</span>
        {meta ? <span className="rowmeta">{meta}</span> : null}
        {warn ? <span className="rowwarn">{warn}</span> : null}
      </span>
      {badge || trail ? (
        <span className="rowtrail">
          {badge}
          {trail}
        </span>
      ) : null}
    </>
  );

  const classes = cn("row", (onClick || href) && "tappable", className);

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" ref={buttonRef} onClick={onClick} className={classes}>
        {inner}
      </button>
    );
  }

  return <div className={classes}>{inner}</div>;
}

/* ─────────────────────────────────────────────────────────
   Insignia de urgencia

   Los cuatro estados del sistema. El color NUNCA viaja solo: la insignia
   siempre lleva su texto, porque el daltonismo es frecuente y aquí el
   estado tiene consecuencias legales.
   ───────────────────────────────────────────────────────── */

export type BadgeTone = "now" | "soon" | "ok" | "none" | "accent" | "building";

export function KitBadge({
  tone = "ok",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("badge", `tone-${tone}`, className)}>{children}</span>;
}

/* ─────────────────────────────────────────────────────────
   Recuento que además es el filtro

   Tres cuentas en una fila: dice qué hay y en qué punto está la bóveda
   antes de que haga falta desplazarse. Sustituye a la tira de filtros y
   a la rejilla de carpetas en la cabecera, que eran dos controles
   distintos para la misma pregunta.
   ───────────────────────────────────────────────────────── */

export type TallyItem = {
  key: string;
  count: number;
  label: string;
  /** El token de color del estado. Pinta el número y el filete. */
  tone: string;
};

export function Tally({
  items,
  selected,
  onSelect,
  groupLabel,
  className,
}: {
  items: readonly TallyItem[];
  selected: string;
  onSelect: (key: string) => void;
  /** Etiqueta accesible del grupo: sin ella son tres botones sueltos. */
  groupLabel: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={groupLabel} className={cn("tally", className)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={item.key === selected}
          onClick={() => onSelect(item.key)}
          className="tallycell"
          style={{ "--tally-tone": item.tone } as CSSProperties}
        >
          <span className="tallynum">{item.count}</span>
          <span className="tallylbl">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Aviso

   Gris, sin borde, sin icono de alarma. Un aviso que grita se ignora; lo
   que se lee es lo que parece una nota al pie.
   ───────────────────────────────────────────────────────── */

export function KitNotice({
  iconName,
  icon,
  children,
  plain,
  className,
}: {
  iconName?: string;
  icon?: IconComponent;
  children: ReactNode;
  plain?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("ax-notice", plain && "tone-plain", className)}>
      {icon && iconName ? (
        <Glyph
          name={iconName}
          icon={icon}
          size={17}
          className="mt-0.5 shrink-0 text-disabled"
        />
      ) : null}
      <span className="min-w-0">{children}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Botón

   Se hunde al tocarlo. Es el único acuse de recibo que existe antes de
   que conteste la red, y con conexión mala es lo único que hay.
   ───────────────────────────────────────────────────────── */

export type KitButtonKind =
  | "primary"
  | "accent"
  | "quiet"
  | "ghost"
  | "danger"
  | "onInvert";

export function KitButton({
  kind = "primary",
  size = "lg",
  wide,
  iconName,
  icon,
  onClick,
  disabled,
  type = "button",
  children,
  className,
}: {
  kind?: KitButtonKind;
  size?: "lg" | "sm";
  wide?: boolean;
  iconName?: string;
  icon?: IconComponent;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("ax-btn", `btn-${kind}`, `btn-${size}`, wide && "wide", className)}
    >
      {icon && iconName ? (
        <Glyph name={iconName} icon={icon} size={size === "sm" ? 17 : 20} strokeWidth={2} />
      ) : null}
      {children}
    </button>
  );
}
