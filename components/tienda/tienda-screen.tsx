"use client";

/**
 * TIENDA — la pantalla.
 *
 * Cada miniaplicación vive fuera de ANDEX. Eso obliga a decir tres cosas
 * ANTES de que la persona toque el botón:
 *
 *   1. **qué resuelve** — no qué es
 *   2. **cuánto tarda** — para que sepa si tiene tiempo ahora
 *   3. **a dónde va** — el dominio, a la vista
 *
 * Lo tercero no es formalidad. En un producto cuyo argumento es la
 * confianza, un enlace que se abre sin avisar a un sitio desconocido es
 * justo lo que hace dudar. Se dice a dónde va y se abre en otra pestaña,
 * para que ANDEX siga ahí cuando vuelva.
 */

import { useState } from "react";
import {
  Clock,
  GraduationCap,
  ExternalLink,
  Landmark,
  Scale,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { MINI_APPS, urlDe, type MiniApp } from "@/lib/catalogs/tienda";
import { validarEnlace } from "@/lib/tienda/enlaces";
import type { TiendaDict } from "@/lib/i18n/dictionaries/tienda";
import { Button } from "@/components/ui/button";

const ICONS: Record<string, LucideIcon> = { Scale, Wallet, Landmark, GraduationCap };

const fill = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

export type TiendaScreenProps = { copy: TiendaDict };

export function TiendaScreen({ copy }: TiendaScreenProps) {
  const [avisado, setAvisado] = useState<string[]>([]);

  function Tarjeta({ app }: { app: MiniApp }) {
    const texto = copy.apps[app.id];
    /* Algunas traen una línea propia —"empezar es gratis"— y otras no.
       Se lee así en vez de con `in` para que TypeScript no obligue a
       declararla vacía en las que no la tienen. */
    const gratis = (texto as { free?: string }).free;
    const Icon = ICONS[app.icon] ?? Scale;
    const enlace = validarEnlace(urlDe(app.id));
    const yaAvisado = avisado.includes(app.id);

    return (
      <li className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-md"
            style={{
              color: `var(${app.accent})`,
              background: `color-mix(in srgb, var(${app.accent}) 12%, transparent)`,
            }}
          >
            <Icon className="size-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-h3 text-ink">{texto.title}</h3>
              {!enlace.ok ? (
                <span className="inline-flex min-h-8 items-center rounded-full bg-surface-alt px-3 text-caption font-medium text-muted">
                  {copy.card.soonBadge}
                </span>
              ) : null}
            </div>

            <p className="mt-1 text-body text-muted">{texto.body}</p>

            {/* Cuánto tarda, o qué cuesta empezar. Va antes del botón porque
                es lo que decide si entra ahora o vuelve luego. */}
            <div className="mt-3 flex flex-wrap gap-2">
              {app.minutos > 0 ? (
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-surface-alt px-3 text-caption font-medium text-muted">
                  <Clock aria-hidden="true" className="size-4" />
                  {fill(copy.card.minutes, { n: app.minutos })}
                </span>
              ) : null}
              {gratis ? (
                <span className="inline-flex min-h-8 items-center rounded-full bg-success-soft px-3 text-caption font-bold text-success">
                  {gratis}
                </span>
              ) : null}
            </div>

            {enlace.ok ? (
              <>
                <Button
                  href={enlace.url}
                  className="mt-4"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink aria-hidden="true" className="size-5" />
                  {copy.card.open}
                </Button>
                {/* A dónde va, con su dominio. Antes de tocar, no después. */}
                <p className="mt-2 text-caption text-muted">
                  {fill(copy.card.leaves, { domain: enlace.dominio })}
                </p>
              </>
            ) : (
              <div className="mt-4">
                <p className="text-caption text-muted">{copy.card.soonBody}</p>
                {yaAvisado ? (
                  <p role="status" className="mt-2 text-caption font-medium text-success">
                    {copy.card.notified}
                  </p>
                ) : (
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={() => setAvisado((a) => [...a, app.id])}
                  >
                    {copy.card.notify}
                  </Button>
                )}
              </div>
            )}

            {/* El aviso de las que tocan corte, dinero o trámite. */}
            {app.aviso ? (
              <p className="mt-4 flex items-start gap-2 border-t border-line pt-3 text-caption text-muted">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">{copy.disclaimer}</span>
              </p>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  return (
    <article className="mx-auto w-full max-w-4xl">
      <header>
        <h1 className="font-heading text-h2 text-ink sm:text-h1">{copy.title}</h1>
        <p className="mt-1 text-body text-muted sm:text-body-lg">{copy.subtitle}</p>
      </header>

      <section
        aria-labelledby="tienda-intro"
        className="mt-6 rounded-xl border border-line bg-teal-soft p-4 shadow-sm sm:p-5"
      >
        <p className="text-caption font-bold uppercase tracking-widest text-teal-deep">
          {copy.intro.eyebrow}
        </p>
        <h2 id="tienda-intro" className="mt-1 font-heading text-h2 text-ink">
          {copy.intro.headline}
        </h2>
        <p className="mt-2 text-body text-ink">{copy.intro.body}</p>
      </section>

      <ul className="mt-6 space-y-3">
        {MINI_APPS.map((app) => (
          <Tarjeta key={app.id} app={app} />
        ))}
      </ul>

      <p className="mt-6 flex items-start gap-2 rounded-xl border border-line bg-amber-soft p-4 text-caption text-ink">
        <Landmark aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span className="min-w-0">{copy.official}</span>
      </p>
    </article>
  );
}
