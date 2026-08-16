"use client";

/*
 * Va marcado como cliente porque `HeaderAction` usa `useState` y un
 * portal. Sin esta línea, cualquier página de SERVIDOR que importe una
 * primitiva de aquí rompe la compilación con un error que no señala a
 * este archivo — y cuesta encontrarlo.
 */

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

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { ComponentType, CSSProperties, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
   La acción de la cabecera

   En el diseño la cabecera lleva la marca y UN icono, y ese icono es de
   la pantalla: el Panel pone la campana, la Bóveda pone la lupa. Pero la
   cabecera la dibuja el armazón, no la pantalla.

   Se resuelve con un portal a un hueco fijo. Se probó antes con contexto
   y estado, y no vale: el nodo de React es distinto en cada render, así
   que `setState` en un efecto sin dependencias entra en bucle, y con
   dependencias el icono se queda congelado cuando cambia (la lupa que
   pasa a equis al abrir la búsqueda).

   Cuál se ve lo decide el CSS con `:has()`: si la pantalla puso algo, la
   campana por defecto se esconde. Cero estado, cero bucles.
   ───────────────────────────────────────────────────────── */

/** El hueco de la cabecera donde aterriza la acción de la pantalla. */
export const HEADER_ACTION_ID = "ax-nav-action";

/**
 * El hueco de la IZQUIERDA. En el diseño el «‹ Atrás» no se añade a la
 * marca: la SUSTITUYE, porque estando dentro de un detalle lo que importa
 * es volver, no la marca. Mismo mecanismo que la acción de la derecha.
 */
export const HEADER_BACK_ID = "ax-nav-back";

/** Se comparte entre los dos huecos: sólo cambia el id y el atributo. */
function useHeaderSlot(id: string, flag: string) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.getElementById(id);
    setHost(node);
    const barra = node?.closest(".navrow");
    if (!(barra instanceof HTMLElement)) return;
    barra.dataset[flag] = "true";
    return () => {
      delete barra.dataset[flag];
    };
  }, [id, flag]);

  return host;
}

export function HeaderBack({ children }: { children: ReactNode }) {
  const host = useHeaderSlot(HEADER_BACK_ID, "screenBack");
  return host ? createPortal(children, host) : null;
}

export function HeaderAction({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.getElementById(HEADER_ACTION_ID);
    setHost(node);
    if (!node?.parentElement) return;
    // Se marca el contenedor para que la campana por defecto se retire.
    // Se probó con `:has()` y no sobrevive a la compilación del CSS según
    // los objetivos de navegador: la regla se escribe y no llega. Un
    // atributo funciona en todas partes y se ve en el inspector.
    const barra = node.parentElement;
    barra.dataset.screenAction = "true";
    return () => {
      delete barra.dataset.screenAction;
    };
  }, []);

  return host ? createPortal(children, host) : null;
}

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
  id?: string;
  className?: string;
};

/**
 * Sin fila de acciones: el icono de la esquina va en la cabecera del
 * armazón, con la marca, y se pone desde la pantalla con `HeaderAction`.
 * Cuando esto dibujaba su propia fila salían dos —campana arriba, lupa
 * debajo— y el titular quedaba empujado media pantalla.
 */
export function ScreenHeader({
  overline,
  title,
  sub,
  id,
  className,
}: ScreenHeaderProps) {
  return (
    <header className={className}>
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
  href,
  external,
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
  /**
   * Cuando la acción es ir a otro sitio, es un enlace de verdad. Un botón
   * con `router.push` dentro rompe el clic con el botón central, «abrir en
   * pestaña nueva» y el menú contextual.
   */
  href?: string;
  /** Sale de ANDEX: se abre aparte y con `rel` seguro. */
  external?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const classes = cn("ax-btn", `btn-${kind}`, `btn-${size}`, wide && "wide", className);
  const inner = (
    <>
      {icon && iconName ? (
        <Glyph name={iconName} icon={icon} size={size === "sm" ? 17 : 20} strokeWidth={2} />
      ) : null}
      {children}
    </>
  );

  if (href && !disabled) {
    if (external) {
      return (
        <a
          href={href}
          onClick={onClick}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {inner}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   Tarjeta

   Tres pesos, y no por capricho: `raise` es lo normal, `lift` es lo que
   está pasando ahora (lleva filete teal) y `pending` es lo que todavía no
   existe (sin fondo, contorno fino, titular apagado).

   NUNCA se le pone una sombra en línea. De noche el token vale `none` y
   una sombra escrita a mano ganaría, cancelando el filete de un píxel que
   la sustituye — y la tarjeta se quedaría sin separación ninguna.
   ───────────────────────────────────────────────────────── */

export type CardTone = "accent" | "highlight" | "invert" | "quiet" | "lift" | "pending";

export function KitCard({
  tone,
  children,
  className,
  style,
}: {
  tone?: CardTone;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("ax-card", tone && `card-${tone}`, className)} style={style}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Rejilla de módulos

   Una baldosa por módulo. El nombre tiene dos líneas de sitio, que es lo
   que pide «Bóveda Digital y Alertas» en español; el dato vive debajo sin
   apretar la fila.
   ───────────────────────────────────────────────────────── */

export function TileGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("tilegrid", className)}>{children}</div>;
}

export function Tile({
  iconName,
  icon,
  iconTone = "quiet",
  iconBare,
  name,
  meta,
  foot,
  quiet,
  wide,
  onClick,
  href,
  className,
}: {
  iconName?: string;
  icon?: IconComponent;
  iconTone?: ListRowTone;
  /**
   * El icono sin su ficha de color. La baldosa apagada del diseño —un
   * módulo que todavía no abre— lo lleva desnudo: la ficha es lo que dice
   * «esto está vivo».
   */
  iconBare?: boolean;
  name: ReactNode;
  meta?: ReactNode;
  foot?: ReactNode;
  /** Un módulo que aún no abre no se pinta como uno que sí. */
  quiet?: boolean;
  wide?: boolean;
  /** Se llama también cuando hay `href`: la telemetría no se pierde. */
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const inner = (
    <>
      {icon && iconName ? (
        iconBare ? (
          <Glyph name={iconName} icon={icon} size={19} className="text-disabled" />
        ) : (
          <span className={cn("rowicon", `tone-${iconTone}`)}>
            <Glyph name={iconName} icon={icon} size={19} />
          </span>
        )
      ) : null}
      <span className="min-w-0">
        <span className="tilename">{name}</span>
        {meta ? <span className="tilemeta">{meta}</span> : null}
      </span>
      {foot ? <span className="tilefoot">{foot}</span> : null}
    </>
  );
  const classes = cn("tile", quiet && "quiet", wide && "wide", className);

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {inner}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   Recomendación

   Va sobre navy a sangre. Lleva SIEMPRE su porqué («Porque dijiste
   que…») y siempre la salida: una recomendación que no se puede rechazar
   no es una recomendación, es una imposición.
   ───────────────────────────────────────────────────────── */

export function RecommendationCard({
  eyebrow,
  title,
  reason,
  action,
  dismiss,
  dismissIcon,
  dismissIconName,
  onAction,
  onDismiss,
  className,
}: {
  eyebrow: string;
  title: string;
  /** Ya redactado, con su «Porque…»: el motivo es copy, no lógica. */
  reason?: string;
  action: string;
  dismiss?: string;
  /** El icono del descarte. En el diseño es una equis. */
  dismissIcon?: IconComponent;
  dismissIconName?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("ax-card card-invert", className)}>
      <span
        className="block font-bold uppercase"
        style={{
          fontSize: "var(--size-micro)",
          letterSpacing: "var(--track-label)",
          color: "var(--teal-200)",
        }}
      >
        {eyebrow}
      </span>
      <h2
        className="mt-3"
        style={{
          fontSize: "var(--size-title-2)",
          fontWeight: 800,
          letterSpacing: "var(--track-title)",
          lineHeight: 1.14,
        }}
      >
        {title}
      </h2>
      {reason ? (
        <p
          className="mt-2.5"
          style={{ fontSize: 16, lineHeight: 1.5, color: "var(--text-on-invert-quiet)" }}
        >
          {reason}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button type="button" onClick={onAction} className="ax-btn btn-onInvert btn-sm">
          {action}
        </button>
        {dismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="ax-btn btn-sm"
            style={{
              background: "transparent",
              color: "var(--text-on-invert-quiet)",
              boxShadow: "inset 0 0 0 1.5px var(--hairline-on-invert)",
            }}
          >
            {dismissIcon && dismissIconName ? (
              <Glyph
                name={dismissIconName}
                icon={dismissIcon}
                size={15}
                strokeWidth={2.2}
              />
            ) : null}
            {dismiss}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Estados de sistema

   Sin cámara, sin conexión, sin espacio, recorte fallido. Son la
   experiencia habitual —datos contados, teléfono lleno—, no el caso raro.
   Siempre dicen qué falta y ofrecen UNA acción.
   ───────────────────────────────────────────────────────── */

export type StateTone = "quiet" | "accent" | "warn" | "alert";

export function StatePanel({
  iconName,
  icon,
  tone = "quiet",
  title,
  body,
  children,
  className,
}: {
  iconName?: string;
  icon?: IconComponent;
  tone?: StateTone;
  title: string;
  body?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("statepanel", className)}>
      {icon && iconName ? (
        <span className={cn("stateglyph", `tone-${tone}`)}>
          <Glyph name={iconName} icon={icon} size={28} />
        </span>
      ) : null}
      <h2 className="statetitle">{title}</h2>
      {body ? <p className="statebody">{body}</p> : null}
      {children}
    </div>
  );
}

/**
 * Una promesa numerada de un módulo en construcción. Dice qué se va a
 * poder hacer, sin lista de espera ni contador: un contador inventado es
 * justo el patrón que el PRD veta.
 */
export function PromiseItem({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="promise">
      <span className="promisenum">{n}</span>
      <span className="promisetext">{children}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Academia — la frase

   La frase en inglés es el objeto de la pantalla: 25px, peso 700. La
   pronunciación va en cursiva teal y NO se parte por sílabas: una
   pronunciación cortada a la mitad se lee mal en voz alta, que es
   exactamente para lo que está.
   ───────────────────────────────────────────────────────── */

export function PhraseItem({
  english,
  pronunciation,
  spanish,
  playing,
  progress = 0,
  onPlay,
  playLabel,
  note,
  delayMs = 0,
  className,
}: {
  english: string;
  pronunciation: string;
  spanish: string;
  playing?: boolean;
  /** 0–1. Dibuja el anillo alrededor del botón mientras suena. */
  progress?: number;
  /**
   * Sin `onPlay` no hay botón: cuando el navegador no tiene voz, un botón
   * de reproducir que no reproduce es peor que no tenerlo.
   */
  onPlay?: () => void;
  /** Nombre accesible del botón: «Escuchar "..."». */
  playLabel: string;
  /** La advertencia de cuándo NO se dice así. Va debajo, apagada. */
  note?: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const cuerpo = (
    <>
      <span className="phrasemain">
        <span className="phrase-en" lang="en">
          {english}
        </span>
        <span className="phrase-pr">{pronunciation}</span>
        <span className="phrase-es">{spanish}</span>
      </span>
      <span className={cn("playbtn", playing && "playing")}>
        {playing ? (
          <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true" fill="currentColor">
            <path d="M8 5.5v13l11-6.5-11-6.5Z" />
          </svg>
        )}
        {playing ? (
          <svg className="playring" viewBox="0 0 56 56" aria-hidden="true">
            <circle
              cx="28"
              cy="28"
              r={r}
              strokeDasharray={c}
              strokeDashoffset={c * (1 - progress)}
            />
          </svg>
        ) : null}
      </span>
    </>
  );

  return (
    <div className={cn(note ? "flex flex-col gap-2.5" : undefined)}>
      {onPlay ? (
        <button
          type="button"
          onClick={onPlay}
          aria-label={playLabel}
          aria-pressed={playing}
          className={cn("phrase enter", className)}
          style={{ animationDelay: `${delayMs}ms` }}
        >
          {cuerpo}
        </button>
      ) : (
        <div
          className={cn("phrase enter", className)}
          style={{ animationDelay: `${delayMs}ms` }}
        >
          {cuerpo}
        </div>
      )}
      {note}
    </div>
  );
}

export function PhraseList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("phraselist", className)}>{children}</div>;
}

/* ─────────────────────────────────────────────────────────
   Dato con fuente

   El filete de la izquierda dice «esto no lo decimos nosotros». Nunca se
   afirma un dato de empleo o de trámite sin su enlace.
   ───────────────────────────────────────────────────────── */

export function SourcedFacts({
  facts,
  who,
  className,
}: {
  /**
   * `href` es opcional a propósito. Hay fuentes reales sin página pública
   * —«Fair Labor Standards Act», «CASAS 4.3.4»— y inventarles una URL sería
   * exactamente lo contrario de lo que hace este bloque: citarlas sin
   * enlace es honesto; enlazarlas a cualquier sitio, no.
   */
  facts: readonly { text: string; source: string; href?: string }[];
  /** Quién lo verificó y cuándo. */
  who?: string;
  className?: string;
}) {
  return (
    <div className={cn("sourced", className)}>
      {facts.map((f) => (
        <p key={f.source + f.text.slice(0, 24)}>
          {f.text}{" "}
          {f.href ? (
            <a href={f.href} target="_blank" rel="noopener noreferrer">
              {f.source}
            </a>
          ) : (
            <span>{f.source}</span>
          )}
        </p>
      ))}
      {who ? <p className="sourcedwho">{who}</p> : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Controles
   ───────────────────────────────────────────────────────── */

export function Segmented<T extends string>({
  items,
  value,
  onChange,
  groupLabel,
  className,
}: {
  items: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  groupLabel: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={groupLabel} className={cn("segmented", className)}>
      {items.map((i) => (
        <button
          key={i.key}
          type="button"
          aria-pressed={i.key === value}
          onClick={() => onChange(i.key)}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Filtros con contador. Un filtro sin nada dentro se enseña APAGADO, no se
 * esconde: si desaparece, quien lo buscaba cree que la app se lo comió.
 */
export function FilterBar<T extends string>({
  items,
  value,
  onChange,
  groupLabel,
  className,
}: {
  items: readonly { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
  groupLabel: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={groupLabel} className={cn("filterbar", className)}>
      {items.map((f) => (
        <button
          key={f.key}
          type="button"
          aria-pressed={f.key === value}
          disabled={f.count === 0}
          onClick={() => onChange(f.key)}
          className="filterchip"
        >
          {f.label}
          {typeof f.count === "number" ? (
            <span className="filtercount">{f.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function FolderGrid({
  folders,
  onOpen,
  className,
}: {
  folders: readonly {
    id: string;
    name: string;
    /** Ya redactado y en plural: «3 documentos» / «Vacía». */
    count: string;
    iconName: string;
    icon: IconComponent;
  }[];
  onOpen: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("foldergrid", className)}>
      {folders.map((f) => (
        <button key={f.id} type="button" onClick={() => onOpen(f.id)} className="foldercard">
          <span className="rowicon tone-quiet">
            <Glyph name={f.iconName} icon={f.icon} size={19} />
          </span>
          <span className="foldername">{f.name}</span>
          <span className="foldercount">{f.count}</span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Presencia — la comunidad son personas

   Iniciales en tipografía, nunca retratos: no inventamos caras.
   ───────────────────────────────────────────────────────── */

export function Initials({
  children,
  accent,
  className,
}: {
  children: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <span aria-hidden="true" className={cn("initials", accent && "accent", className)}>
      {children}
    </span>
  );
}

export function InitialsStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("ax-stack", className)}>{children}</span>;
}

/** El punto verde de «está pasando ahora». Nunca va solo: lleva su texto. */
export function LiveDot({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("livedot", className)} />;
}

/** Separador de día: «HOY», con la fecha a la derecha y un filete al fondo. */
export function DayRule({
  day,
  date,
  id,
  className,
}: {
  day: string;
  date?: string;
  /** Para atar la sección con `aria-labelledby` en vez de repetir el texto. */
  id?: string;
  className?: string;
}) {
  return (
    <p className={cn("dayrule", className)}>
      <span id={id}>{day}</span>
      {date ? <span>{date}</span> : null}
    </p>
  );
}

/** «Verificado el 12 de enero». Lo que hace creíble un dato oficial. */
export function Verified({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("verified", className)}>{children}</p>;
}

/** Los puntos de progreso de la entrevista. */
export function ProgressDots({
  total,
  current,
  label,
  className,
}: {
  total: number;
  /** 1-indexado. */
  current: number;
  /** «Paso 3 de 5» — el progreso también se dice, no sólo se pinta. */
  label: string;
  className?: string;
}) {
  return (
    <p
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={label}
      className={cn("ax-progress", className)}
    >
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < current ? "on" : undefined} />
      ))}
    </p>
  );
}
