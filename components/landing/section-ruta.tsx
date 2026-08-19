/**
 * LANDING · LA RUTA DEL INMIGRANTE
 *
 * Sustituye a la rejilla de módulos, y el cambio no es de estilo. Una
 * rejilla dice «aquí hay ocho cosas» y devuelve al visitante la pregunta
 * con la que llegó: ¿por cuál empiezo? Una RUTA la contesta. El orden es el
 * del camino de Henry —primero la gente, luego los papeles, luego el dinero
 * que entra y al final el que se pone a trabajar— y ese orden es, de hecho,
 * lo que se está vendiendo.
 *
 * ── Por qué un raíl vertical y no una rejilla de 4×2 ──
 *
 * Una fila de ocho no cabe: a 1200px tocan a 150px por parada, que no dan
 * ni para el nombre y una línea. Y una rejilla de 4×2 con la línea dibujada
 * entre celdas obliga a inventar el trazo del salto de fila, que se rompe
 * en cuanto una parada crece un renglón. El raíl vertical es la misma forma
 * en todas las anchuras, aguanta que un texto crezca y se lee como lo que
 * es: un camino que se baja.
 *
 * ── Sin rótulos de estado ──
 *
 * Las ocho paradas se anuncian igual, sin distintivo de «disponible» o «se
 * abre durante el piloto». Decisión del dueño del producto, tomada
 * expresamente. Queda dicho lo que implica: cuatro de las ocho —Migraciones,
 * Educación financiera, Empleo y Creación de empresa— siguen en
 * `coming_soon` en el catálogo, y la portada ya no lo matiza.
 *
 * ── Componente de SERVIDOR ──
 *
 * No hay estado ni interacción: es una lista. Serlo mantiene fuera del
 * paquete del navegador un componente que sólo pinta texto — y esta página
 * es la que decide si alguien se queda.
 */

import {
  Award,
  Briefcase,
  Building2,
  GraduationCap,
  Landmark,
  Lock,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { PRICES, WHATSAPP_HENRY } from "@/lib/config";
import { buildWhatsAppLink } from "@/lib/inversiones/whatsapp";
import { cn } from "@/lib/utils";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import type { IconComponent } from "@/components/ui/kit";
import type { LandingDict } from "@/lib/i18n/dictionaries/landing";

/**
 * El icono de cada parada, en el orden de la ruta.
 *
 * Educación financiera lleva cartera e Inversión lleva la curva: al
 * principio compartían icono y en el raíl parecían la misma parada dos
 * veces.
 */
const ICONOS: readonly IconComponent[] = [
  Users,
  Landmark,
  Wallet,
  Briefcase,
  GraduationCap,
  Award,
  Building2,
  TrendingUp,
];

export type SectionRutaProps = {
  copy: LandingDict["ruta"];
  /** A dónde va el botón de entrar. */
  ctaHref: string;
  /** «Explorar ANDEX» — se recibe hecho: vive en el bloque del showcase. */
  ctaLabel: string;
  className?: string;
};

export function SectionRuta({ copy, ctaHref, ctaLabel, className }: SectionRutaProps) {
  /**
   * Sin número no hay tarjeta. Anunciar un servicio de 150 dólares con un
   * botón que no abre nada es peor que no anunciarlo: quien lo pulsa cree
   * que escribió y espera una respuesta que no va a llegar.
   */
  const whatsapp = WHATSAPP_HENRY
    ? buildWhatsAppLink({ phone: WHATSAPP_HENRY, message: copy.personalizada.mensaje })
    : null;

  return (
    <section
      id="modulos"
      aria-labelledby="ruta-titulo"
      className={cn("relative bg-navy-body text-[color:var(--text-on-invert)]", className)}
    >
      {/* El ancho vive en un envoltorio: el fondo va a sangre para que la
          costura de arco de arriba encaje con él. */}
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 sm:py-24">
        <div className="lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
          {/* ── La cabecera, quieta a un lado en escritorio ── */}
          <Reveal className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-caption font-bold uppercase tracking-widest text-[color:var(--teal-200)]">
              {copy.eyebrow}
            </p>
            <h2
              id="ruta-titulo"
              className="mt-3 font-heading text-h1 leading-[1.05] text-[color:var(--text-on-invert)] sm:text-display"
            >
              {copy.title}
            </h2>
            <p className="mt-5 text-body leading-[1.55] text-[color:var(--text-on-invert-quiet)]">
              {copy.subtitle}
            </p>

            <Button href={ctaHref} className="mt-8 hidden lg:inline-flex">
              {ctaLabel}
            </Button>
          </Reveal>

          {/* ── El raíl ──
              La línea es un borde del contenedor, no un elemento por parada:
              así crece con el contenido y no hay que medir nada. El último
              tramo se corta con un degradado para que el camino se acabe en
              vez de chocar contra el borde de la sección. */}
          <RevealGroup
            as="ol"
            aria-label={copy.listLabel}
            className="relative mt-10 grid grid-cols-1 border-l border-[color:var(--hairline-on-invert-soft)] pl-6 sm:pl-8 lg:mt-0"
          >
            {copy.paradas.map((parada, i) => {
              const Icono = ICONOS[i] ?? Users;
              return (
                <RevealItem
                  as="li"
                  key={parada.name}
                  className="relative pb-9 last:pb-0"
                >
                  {/* El punto, montado sobre la línea. */}
                  <span
                    aria-hidden="true"
                    className="absolute -left-6 top-1 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-[color:var(--text-on-invert-accent)] bg-[color:var(--navy-950)] text-[color:var(--text-on-invert-accent)] sm:-left-8"
                  >
                    <Icono className="size-4" />
                  </span>

                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                    <span
                      aria-hidden="true"
                      className="font-mono text-caption tabular-nums text-[color:var(--text-on-invert-quiet)]"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-heading text-h3 leading-tight text-[color:var(--text-on-invert)]">
                      {parada.name}
                    </h3>
                  </div>
                  <p className="mt-2 max-w-[46ch] text-body leading-[1.5] text-[color:var(--text-on-invert-quiet)]">
                    {parada.body}
                  </p>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>

        {/* ── La Bóveda: no es una parada, es lo que llevas encima ──
            Por eso va fuera del raíl y con otra forma. Ponerla como novena
            parada diría que se pasa por ella y se sigue, y es al revés. */}
        <Reveal className="mt-12 sm:mt-16">
          <div className="vidrio legible flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-7 sm:p-8">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-wash-invert)] text-[color:var(--text-on-invert-accent)]"
            >
              <Lock className="size-7" />
            </span>
            <div className="min-w-0">
              <p className="text-caption font-bold uppercase tracking-[0.18em] text-[color:var(--teal-200)]">
                {copy.boveda.label}
              </p>
              <h3 className="mt-1.5 font-heading text-h2 text-[color:var(--text-on-invert)]">
                {copy.boveda.name}
              </h3>
              <p className="mt-2 text-body leading-[1.5] text-[color:var(--text-on-invert)]">
                {copy.boveda.body}
              </p>
            </div>
          </div>
        </Reveal>

        {/* ── La ruta personalizada ──
            Sólo si hay número al otro lado. Ver la nota de arriba. */}
        {whatsapp ? (
          <Reveal className="mt-5">
            <div className="rounded-xl border border-[color:var(--hairline-on-invert)] p-6 sm:p-8">
              <p className="text-caption font-bold uppercase tracking-[0.18em] text-[color:var(--text-on-invert-quiet)]">
                {copy.personalizada.label}
              </p>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h3 className="font-heading text-h2 text-[color:var(--text-on-invert)]">
                  {copy.personalizada.name}
                </h3>
                <p className="font-heading text-h2 tabular-nums text-[color:var(--text-on-invert-accent)]">
                  ${PRICES.rutaPersonalizada.usd}
                </p>
              </div>
              <p className="mt-3 max-w-[58ch] text-body leading-[1.5] text-[color:var(--text-on-invert-quiet)]">
                {copy.personalizada.body}
              </p>
              {/* Que va aparte se dice AQUÍ, no en una nota al pie:
                  enterarse después de pagar es justo lo que este producto
                  promete no hacer. */}
              <p className="mt-2 text-label font-semibold text-[color:var(--text-on-glass-amber)]">
                {copy.personalizada.aparte}
              </p>
              {/* Un `<a>` con el botón del kit, y no `<Button>`.
                  ─────────────────────────────────────────────────
                  `Button` no tiene variante para fondo invertido: `ghost` y
                  `secondary` pintan `text-ink`, que es navy, y sobre este
                  fondo el botón desaparecía — medido: 1.19:1. Sobrescribir
                  el color por `className` tampoco vale, porque `cn()` sólo
                  concatena y no resuelve conflictos de Tailwind: `text-ink`
                  seguía ganando por orden de hoja.

                  `.ax-btn` no fija color, así que aquí el token es el único
                  que manda. Contorno y no relleno a propósito: el relleno
                  teal es «Explorar ANDEX», la acción principal de la
                  sección; este servicio cuesta 150 dólares aparte y no debe
                  competir en peso con entrar. */}
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="ax-btn btn-lg mt-6 border border-[color:var(--hairline-on-invert)] text-[color:var(--text-on-invert)] transition-colors hover:bg-[color:var(--surface-on-invert)]"
              >
                {copy.personalizada.cta}
              </a>
            </div>
          </Reveal>
        ) : null}

        {/* En móvil el botón de entrar va al final: arriba, con ocho paradas
            todavía por leer, pide entrar antes de haber contado nada. */}
        <Reveal className="mt-10 lg:hidden">
          <Button href={ctaHref} fullWidth>
            {ctaLabel}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
