"use client";

/**
 * INVERSIONES — la pantalla.
 *
 * Dos bloques, en este orden a propósito:
 *
 *  1. **Negocios para empezar.** Es lo que necesita la mayoría de quien
 *     entra: llegó hace poco y hace falta que entre dinero ya.
 *  2. **Inversiones.** Para quien ya tiene capital ahorrado.
 *
 * Todo desemboca en WhatsApp. Cada tarjeta lleva su botón con el mensaje ya
 * escrito, así que quien llega no tiene que redactar nada — escribir el
 * primer mensaje a un negocio es justo la fricción que hace que no se
 * escriba.
 *
 * §9 — en el enlace no viaja ni un dato del usuario: sólo de qué
 * oportunidad viene.
 */

import {
  Building2,
  Hammer,
  Handshake,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { WHATSAPP_INVERSIONES } from "@/lib/config";
import { oportunidadesPor, type Opportunity } from "@/lib/catalogs/inversiones";
import { buildWhatsAppLink, opportunityMessage } from "@/lib/inversiones/whatsapp";
import type { InversionesDict } from "@/lib/i18n/dictionaries/inversiones";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  UtensilsCrossed,
  Truck,
  Hammer,
  TrendingUp,
  Building2,
  Handshake,
};

const fill = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/**
 * Formatea el capital de entrada: "$5,000".
 *
 * Se fuerza `en-US` a propósito, aunque la interfaz esté en español. Con
 * `es` el navegador escribe "5000 US$", que no es como se ven los precios
 * en Utah: en un rótulo, en un recibo o en un anuncio, aquí siempre es
 * "$5,000". Traducir el formato del dinero confunde en vez de ayudar.
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
  const inversiones = oportunidadesPor("inversion");

  function Tarjeta({ o }: { o: Opportunity }) {
    const texto = copy.opportunities[o.id as keyof typeof copy.opportunities];
    const Icon = ICONS[o.icon] ?? Sparkles;
    const enlace = buildWhatsAppLink({
      phone: WHATSAPP_INVERSIONES,
      message: opportunityMessage(copy.cta.message, texto.title),
    });

    return (
      <li className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-md"
            style={{
              color: `var(${o.accent})`,
              background: `color-mix(in srgb, var(${o.accent}) 12%, transparent)`,
            }}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-h3 text-ink">{texto.title}</h3>
            <p className="mt-1 text-body text-muted">{texto.body}</p>

            {/* Las cifras, juntas y en una línea: es lo que decide si sigue
                leyendo o no. */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {o.monthlyReturn ? (
                <span className="inline-flex min-h-8 items-center rounded-full bg-success-soft px-3 text-caption font-bold text-success">
                  {fill(copy.inversion.returnLabel, {
                    min: o.monthlyReturn.min,
                    max: o.monthlyReturn.max,
                  })}
                </span>
              ) : null}
              {o.fromUsd !== null ? (
                <span className="inline-flex min-h-8 items-center rounded-full bg-surface-alt px-3 text-caption font-medium text-muted">
                  {fill(
                    o.kind === "inversion" ? copy.inversion.from : copy.negocio.from,
                    { amount: money(o.fromUsd) },
                  )}
                </span>
              ) : null}
            </div>

            {/* El final del ciclo. Sin número configurado no se pinta un
                botón que abriría un chat vacío: se dice lo que pasa. */}
            {enlace ? (
              <Button
                href={enlace}
                className="mt-4"
                aria-label={fill(copy.cta.aria, { opportunity: texto.title })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle aria-hidden="true" className="size-5" />
                {copy.cta.label}
              </Button>
            ) : (
              <p role="status" className="mt-4 text-caption text-muted">
                {copy.unavailable}
              </p>
            )}
          </div>
        </div>
      </li>
    );
  }

  const enlaceGeneral = buildWhatsAppLink({
    phone: WHATSAPP_INVERSIONES,
    message: copy.cta.generalMessage,
  });

  return (
    <article className="mx-auto w-full max-w-4xl">
      <header>
        <h1 className="font-heading text-h2 text-ink sm:text-h1">{copy.title}</h1>
        <p className="mt-1 text-body text-muted sm:text-body-lg">{copy.subtitle}</p>
      </header>

      {/* ── Negocios para empezar ── */}
      <section aria-labelledby="inv-negocio" className="mt-8">
        <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
          {copy.negocio.eyebrow}
        </p>
        <h2 id="inv-negocio" className="mt-1 font-heading text-h2 text-ink">
          {copy.negocio.headline}
        </h2>
        <p className="mt-1 max-w-2xl text-body text-muted">{copy.negocio.body}</p>
        <ul className="mt-4 space-y-3">
          {negocios.map((o) => (
            <Tarjeta key={o.id} o={o} />
          ))}
        </ul>
      </section>

      {/* ── Inversiones ── */}
      <section aria-labelledby="inv-capital" className="mt-10">
        <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
          {copy.inversion.eyebrow}
        </p>
        <h2 id="inv-capital" className="mt-1 font-heading text-h2 text-ink">
          {copy.inversion.headline}
        </h2>
        <p className="mt-1 max-w-2xl text-body text-muted">{copy.inversion.body}</p>
        <ul className="mt-4 space-y-3">
          {inversiones.map((o) => (
            <Tarjeta key={o.id} o={o} />
          ))}
        </ul>
      </section>

      {/* ── El cierre ──
          Para quien no se decidió por ninguna: una salida más, sin obligarle
          a elegir primero. */}
      <section
        aria-labelledby="inv-cierre"
        className="mt-10 rounded-xl border border-line bg-teal-soft p-5 shadow-sm"
      >
        <h2 id="inv-cierre" className="font-heading text-h3 text-ink">
          {copy.closing.title}
        </h2>
        <p className="mt-1 text-body text-ink">{copy.closing.body}</p>
        {enlaceGeneral ? (
          <Button href={enlaceGeneral} className="mt-4" target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden="true" className="size-5" />
            {copy.cta.general}
          </Button>
        ) : (
          <p role="status" className="mt-4 text-caption text-muted">
            {copy.unavailable}
          </p>
        )}
      </section>
    </article>
  );
}
