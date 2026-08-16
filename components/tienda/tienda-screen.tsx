"use client";

/**
 * TIENDA — la pantalla.
 *
 * Estructura editorial: una destacada grande arriba y lo que aún no está,
 * en lista, debajo.
 *
 * ── Por qué una destacada y no una rejilla ──
 *
 * Sólo hay una miniaplicación viva. Una rejilla de tres tarjetas iguales
 * donde dos dicen «muy pronto» es un escaparate con dos huecos: parece
 * catálogo y no lo es. La destacada enseña lo que SÍ se puede usar hoy, y
 * lo que viene se dice en una línea por guía, sin fingir.
 *
 * ── Lo que hay que decir antes del botón ──
 *
 * Cada miniaplicación vive fuera de ANDEX, así que antes de tocar hay que
 * saber tres cosas: **qué resuelve** (no qué es), **qué cuesta empezar** y
 * **a dónde va** —el dominio, a la vista—. Lo tercero no es formalidad: en
 * un producto cuyo argumento es la confianza, un enlace que se abre sin
 * avisar a un sitio desconocido es justo lo que hace dudar.
 *
 * ── El reparto lo decide el enlace ──
 *
 * Una miniaplicación está viva cuando tiene a dónde llevar, no cuando
 * alguien escribió «disponible» en un campo. Así no puede quedarse marcada
 * como lista sin estarlo.
 */

import { useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  GraduationCap,
  Landmark,
  Scale,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { MINI_APPS, urlDe, type MiniApp } from "@/lib/catalogs/tienda";
import { validarEnlace } from "@/lib/tienda/enlaces";
import type { TiendaDict } from "@/lib/i18n/dictionaries/tienda";
import { Glyph, KitNotice, SectionLabel } from "@/components/ui/kit";
import { CoverCarousel } from "./cover-carousel";

const ICONS: Record<string, { icon: LucideIcon; name: string }> = {
  Scale: { icon: Scale, name: "scale" },
  Wallet: { icon: Wallet, name: "wallet" },
  Landmark: { icon: Landmark, name: "landmark" },
  GraduationCap: { icon: GraduationCap, name: "graduation-cap" },
};

const fill = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

export type TiendaScreenProps = { copy: TiendaDict };

export function TiendaScreen({ copy }: TiendaScreenProps) {
  const [avisado, setAvisado] = useState<string[]>([]);

  const destacada = MINI_APPS.find((a) => validarEnlace(urlDe(a.id)).ok);
  const proximas = MINI_APPS.filter((a) => !validarEnlace(urlDe(a.id)).ok);

  return (
    <article className="mx-auto w-full max-w-4xl">
      <header>
        <p className="navover">{copy.overline}</p>
        <h1 className="largeTitle">{copy.title}</h1>
      </header>

      {destacada ? (
        <Destacada app={destacada} copy={copy} />
      ) : (
        <div className="ax-card mt-5">
          <h2 className="font-heading text-h3 text-ink">{copy.empty.title}</h2>
          <p className="mt-2 text-body text-muted">{copy.empty.body}</p>
        </div>
      )}

      {proximas.length > 0 ? (
        <section aria-labelledby="tienda-proximos">
          <SectionLabel
            as="h2"
            id="tienda-proximos"
            action={
              /* Sin color propio: hereda el del rótulo (`--navy-700`), que
                 ya está en la matriz de contraste. Con `text-disabled` daba
                 3.13:1 y con `text-muted` 4.11 — el mínimo son 4.5, y lo
                 cazó el verificador, no yo mirando. */
              <span className="text-caption font-normal normal-case tracking-normal">
                {proximas.length === 1
                  ? copy.upcoming.countOne
                  : fill(copy.upcoming.count, { n: proximas.length })}
              </span>
            }
          >
            {copy.upcoming.title}
          </SectionLabel>

          <ul className="space-y-2.5">
            {proximas.map((app) => (
              <li key={app.id}>
                <Proxima
                  app={app}
                  copy={copy}
                  avisado={avisado.includes(app.id)}
                  onAvisar={() => setAvisado((a) => [...a, app.id])}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <KitNotice iconName="landmark" icon={Landmark} className="mt-6">
        {copy.official}
      </KitNotice>
    </article>
  );
}

/**
 * La destacada.
 *
 * Orden: foto → quién lo hace → qué promete → qué resuelve → qué cuesta
 * empezar y a dónde va. El botón va al final porque hasta entonces no hay
 * con qué decidir.
 */
function Destacada({ app, copy }: { app: MiniApp; copy: TiendaDict }) {
  const texto = copy.apps[app.id];
  const gratis = (texto as { free?: string }).free;
  const enlace = validarEnlace(urlDe(app.id));

  return (
    <section
      aria-labelledby="tienda-destacada"
      className="ax-card mt-5 overflow-hidden !p-0"
    >
      <div className="relative">
        {app.portadas?.length ? (
          <CoverCarousel
            images={app.portadas}
            alts={copy.hero.covers}
            navLabel={copy.hero.coverNav}
          />
        ) : null}

        {/* La insignia flota sobre la foto, no debajo: que se puede usar HOY
            es lo primero que hay que saber. */}
        <p className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-amber px-3 py-1.5 text-caption font-bold text-on-highlight shadow-md">
          <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
          {copy.hero.liveBadge}
        </p>
      </div>

      <div className="p-5">
        <p className="text-caption font-bold uppercase tracking-widest text-muted">
          {copy.hero.author}
        </p>
        <h2 id="tienda-destacada" className="mt-2 font-heading text-h2 text-ink">
          {copy.hero.headline}
        </h2>
        <p className="mt-2 text-body text-muted">{copy.hero.body}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-body text-muted">{gratis ?? texto.body}</p>

          {enlace.ok ? (
            <a
              href={enlace.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-navy px-6 text-body font-bold text-white shadow-md transition-transform active:scale-95"
            >
              {copy.card.open}
              {/* La flecha diagonal significa SIEMPRE «esto sale de la
                  aplicación», y no se usa para nada más. */}
              <ArrowUpRight aria-hidden="true" className="size-5 shrink-0" />
            </a>
          ) : null}
        </div>

        {/* A dónde va, con su dominio. Antes de tocar, no después. */}
        {enlace.ok ? (
          <p className="mt-3 text-caption text-muted">
            {fill(copy.card.leaves, { domain: enlace.dominio })}
          </p>
        ) : null}

        {app.aviso ? (
          <p className="mt-3 border-t border-line pt-3 text-caption text-muted">
            {copy.disclaimer}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** Una fila de lo que viene: qué es, cuánto dura, y el aviso. */
function Proxima({
  app,
  copy,
  avisado,
  onAvisar,
}: {
  app: MiniApp;
  copy: TiendaDict;
  avisado: boolean;
  onAvisar: () => void;
}) {
  const texto = copy.apps[app.id];
  const kind = (texto as { kind?: string }).kind;
  const glifo = ICONS[app.icon] ?? ICONS.Scale;

  const meta = [
    kind,
    app.minutos > 0 ? fill(copy.card.minutes, { n: app.minutos }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="ax-card flex items-center gap-3 !p-3">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-alt text-muted"
      >
        <Glyph name={glifo.name} icon={glifo.icon} size={20} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-ink">{texto.title}</span>
        <span className="mt-0.5 block text-caption text-muted">{meta}</span>
      </span>

      {/* La confirmación ocurre en el MISMO botón, sin aviso flotante ni
          ventana: es donde estaba el dedo y es donde se mira. */}
      <button
        type="button"
        onClick={onAvisar}
        disabled={avisado}
        aria-label={fill(copy.upcoming.notifyAria, { name: texto.title })}
        className={
          avisado
            ? "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-success-soft px-4 text-caption font-semibold text-success"
            : "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-surface-alt px-4 text-caption font-semibold text-ink transition-transform active:scale-95"
        }
      >
        {avisado ? (
          <Check aria-hidden="true" className="size-4 shrink-0" />
        ) : (
          <Bell aria-hidden="true" className="size-4 shrink-0" />
        )}
        {avisado ? copy.upcoming.notified : copy.upcoming.notify}
      </button>
    </div>
  );
}
