"use client";

/**
 * INVERSIONES — la pantalla.
 *
 * Dos bloques, en este orden a propósito:
 *
 *  1. **Negocios para arrancar.** Es lo que necesita la mayoría de quien
 *     entra: llegó hace poco y hace falta que entre dinero ya. Una lista
 *     agrupada, con lo único que decide antes de escribir: cuánto capital
 *     hace falta.
 *  2. **Fondos de inversión.** Una sola opción, desde $100. Entrar con cien
 *     dólares es lo que la hace alcanzable para quien acaba de llegar;
 *     poner al lado una de $20.000 convertiría la sección en un escaparate
 *     donde casi todo queda fuera de alcance.
 *
 * Todo desemboca en WhatsApp. Cada fila y cada botón llevan el mensaje ya
 * escrito, así que quien llega no tiene que redactar nada — escribir el
 * primer mensaje a un negocio es justo la fricción que hace que no se
 * escriba.
 *
 * ── Dos reglas que se ven en la pantalla ──
 *
 * · **§9 — en el enlace no viaja ni un dato del usuario**: sólo de qué
 *   oportunidad viene. Lo garantiza `lib/inversiones/whatsapp.ts`.
 * · **La flecha diagonal significa «esto sale de la aplicación».** Estas
 *   filas abren WhatsApp, así que llevan la flecha y no el galón: un galón
 *   promete una pantalla de detalle que no existe.
 *
 * El color NO se usa por categoría —ni un teal para limpieza ni un ámbar
 * para construcción—: si cada cosa tuviera su color, el ámbar de «vence en
 * 7 días» dejaría de significar algo en el resto del producto.
 */

import {
  ArrowUpRight,
  Hammer,
  MessageCircle,
  SprayCan,
  TrendingUp,
  Truck,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { WHATSAPP_INVERSIONES } from "@/lib/config";
import { oportunidadesPor, oportunidadPorId } from "@/lib/catalogs/inversiones";
import { buildWhatsAppLink, opportunityMessage } from "@/lib/inversiones/whatsapp";
import type { InversionesDict } from "@/lib/i18n/dictionaries/inversiones";
import {
  Glyph,
  KitCard,
  KitNotice,
  ListGroup,
  ListRow,
  ScreenHeader,
  SectionLabel,
} from "@/components/ui/kit";

/**
 * El glifo de cada oportunidad.
 *
 * La clave es el nombre que el catálogo declara, y el valor trae el icono
 * más su nombre en kebab-case, que es lo que activa su gesto en el CSS: el
 * bote rocía, los cubiertos sirven, el camión avanza, el martillo golpea.
 *
 * El catálogo pedía antes «Sparkles» y «UtensilsCrossed», que no tienen
 * gesto y se quedaban quietos. Se corrigió allí, en el origen, en vez de
 * traducirlo aquí: si el nombre del catálogo y el del CSS no son el mismo,
 * el icono deja de moverse sin que nada avise.
 */
const ICONS: Record<string, { icon: LucideIcon; name: string }> = {
  SprayCan: { icon: SprayCan, name: "spray-can" },
  Utensils: { icon: Utensils, name: "utensils" },
  Truck: { icon: Truck, name: "truck" },
  Hammer: { icon: Hammer, name: "hammer" },
  TrendingUp: { icon: TrendingUp, name: "trending-up" },
};

const fill = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/**
 * Formatea el capital de entrada: "$100".
 *
 * Se fuerza `en-US` a propósito, aunque la interfaz esté en español. Con
 * `es` el navegador escribe "5000 US$", que no es como se ven los precios
 * en Utah: en un rótulo, en un recibo o en un anuncio, aquí siempre es
 * "$100". Traducir el formato del dinero confunde en vez de ayudar.
 */
function money(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}

export type InversionesScreenProps = {
  copy: InversionesDict;
};

export function InversionesScreen({ copy }: InversionesScreenProps) {
  const negocios = oportunidadesPor("negocio");
  const fondo = oportunidadPorId("fondo");

  /** El enlace de una oportunidad concreta, con su mensaje ya escrito. */
  const enlaceDe = (titulo: string): string | null =>
    buildWhatsAppLink({
      phone: WHATSAPP_INVERSIONES,
      message: opportunityMessage(copy.cta.message, titulo),
    });

  const enlaceGeneral = buildWhatsAppLink({
    phone: WHATSAPP_INVERSIONES,
    message: copy.cta.generalMessage,
  });

  const enlaceFondo = enlaceDe(copy.opportunities.fondo.title);

  /** «Esto sale de la aplicación». No significa ninguna otra cosa. */
  const flecha = (
    <Glyph
      name="arrow-up-right"
      icon={ArrowUpRight}
      size={18}
      strokeWidth={2}
      className="text-disabled"
    />
  );

  return (
    <article className="mx-auto w-full max-w-4xl">
      <ScreenHeader title={copy.title} />

      {/* ── Negocios para arrancar ── */}
      <section aria-labelledby="inv-negocios">
        <SectionLabel as="h2" id="inv-negocios">
          {copy.negocio.label}
        </SectionLabel>
        <ListGroup as="ul">
          {negocios.map((o) => {
            const texto = copy.opportunities[o.id as keyof typeof copy.opportunities];
            const glifo = ICONS[o.icon] ?? ICONS.TrendingUp;
            const enlace = enlaceDe(texto.title);
            return (
              <li key={o.id}>
                <ListRow
                  icon={glifo.icon}
                  iconName={glifo.name}
                  title={texto.title}
                  meta={
                    o.fromUsd !== null
                      ? fill(copy.negocio.from, { amount: money(o.fromUsd) })
                      : undefined
                  }
                  /* Sin número configurado la fila no lleva a ningún sitio, y
                     lo dice: un galón que no abre nada se toca tres veces
                     antes de que alguien se rinda. */
                  {...(enlace
                    ? { href: enlace, external: true, trail: flecha }
                    : { warn: copy.unavailable })}
                />
              </li>
            );
          })}
        </ListGroup>
      </section>

      {/* ── Fondos de inversión ──
          Una sola tarjeta: el rendimiento y su límite en la misma frase. */}
      {fondo ? (
        <section aria-labelledby="inv-fondos">
          <SectionLabel as="h2" id="inv-fondos">
            {copy.inversion.label}
          </SectionLabel>
          <KitCard>
            <p className="text-h3 font-extrabold">
              {fondo.monthlyReturn
                ? fill(copy.inversion.headline, {
                    min: fondo.monthlyReturn.min,
                    max: fondo.monthlyReturn.max,
                  })
                : copy.inversion.label}
            </p>
            <p className="mt-2 text-pretty text-body leading-[1.5] text-muted">
              {fill(copy.inversion.body, {
                amount: money(fondo.fromUsd ?? 0),
              })}
            </p>
            <div className="mt-4">
              {/* Un enlace, no un botón: abre WhatsApp fuera de ANDEX. Lleva
                  las clases del sistema porque `KitButton` sólo sabe
                  dibujar `<button>`. */}
              {enlaceFondo ? (
                <a
                  href={enlaceFondo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ax-btn btn-primary btn-sm"
                >
                  <Glyph name="message-circle" icon={MessageCircle} size={17} strokeWidth={2} />
                  {copy.cta.label}
                </a>
              ) : (
                <p role="status" className="text-label text-muted">
                  {copy.unavailable}
                </p>
              )}
            </div>
          </KitCard>
        </section>
      ) : null}

      {/* ── La salida para quien no se decidió por ninguna ──
          Sin obligarle a elegir primero. Va en contorno fino: el primario de
          la pantalla ya está gastado en el fondo. */}
      <KitCard tone="quiet" className="mt-8">
        <h2 className="text-h3">{copy.closing.title}</h2>
        <p className="mt-2 text-pretty text-body leading-[1.5] text-muted">{copy.closing.body}</p>
        <div className="mt-4">
          {enlaceGeneral ? (
            <a
              href={enlaceGeneral}
              target="_blank"
              rel="noopener noreferrer"
              className="ax-btn btn-ghost btn-sm"
            >
              <Glyph name="message-circle" icon={MessageCircle} size={17} strokeWidth={2} />
              {copy.cta.general}
            </a>
          ) : (
            <p role="status" className="text-label text-muted">
              {copy.unavailable}
            </p>
          )}
        </div>
      </KitCard>

      {/* Cómo termina esto, y quién cobra qué. */}
      <KitNotice iconName="message-circle" icon={MessageCircle} className="mt-5">
        {copy.whatsappNote}
      </KitNotice>
    </article>
  );
}
