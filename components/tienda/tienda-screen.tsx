"use client";

/**
 * TIENDA — la pantalla.
 *
 * Cada miniaplicación vive fuera de ANDEX. Eso obliga a decir tres cosas
 * ANTES de que la persona toque el botón, y en este orden:
 *
 *   1. **cuánto tarda** — para que sepa si tiene tiempo ahora
 *   2. **qué resuelve** — no qué es
 *   3. **a dónde va** — el dominio, a la vista
 *
 * Lo tercero no es formalidad. En un producto cuyo argumento es la
 * confianza, un enlace que se abre sin avisar a un sitio desconocido es
 * justo lo que hace dudar. Se dice a dónde va y se abre en otra pestaña,
 * para que ANDEX siga ahí cuando vuelva.
 *
 * ── La forma, del sistema de diseño ──
 *
 * El catálogo se parte en dos con un filete rotulado —«Puedes usarla ya» /
 * «Todavía no está lista»— y cada rótulo lleva su recuento. Las que no
 * están listas se pintan con `card-pending`: sin fondo, contorno fino y
 * titular apagado. Se ve que están y que todavía no tocan.
 *
 * **La flecha diagonal significa «esto sale de la aplicación»** y no se usa
 * para nada más. Por eso la que todavía no tiene enlace lleva un globo: no
 * sale a ningún sitio todavía.
 *
 * ── Cuándo la tienda está «vacía» ──
 *
 * Cuando NINGUNA está abierta. Entonces no se pinta un catálogo de tarjetas
 * «muy pronto» —sería un escaparate con luces y nada dentro— sino un solo
 * panel que dice qué falta y ofrece UNA acción.
 */

import { useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  Clock,
  ExternalLink,
  Globe,
  Landmark,
  Store,
} from "lucide-react";
import { MINI_APPS, urlDe, type MiniApp } from "@/lib/catalogs/tienda";
import { validarEnlace, type ResultadoEnlace } from "@/lib/tienda/enlaces";
import type { TiendaDict } from "@/lib/i18n/dictionaries/tienda";
import { cn } from "@/lib/utils";
import {
  DayRule,
  Glyph,
  KitBadge,
  KitButton,
  KitNotice,
  KitCard,
  ScreenHeader,
  StatePanel,
} from "@/components/ui/kit";

const fill = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

export type TiendaScreenProps = { copy: TiendaDict };

export function TiendaScreen({ copy }: TiendaScreenProps) {
  const [avisado, setAvisado] = useState<string[]>([]);
  const [avisadoPrimera, setAvisadoPrimera] = useState(false);

  /**
   * El enlace manda: una miniaplicación está lista cuando su URL existe,
   * es `https` y no lleva ni un dato del usuario (§9). No hay un campo
   * «publicada» que pueda desmentir al enlace.
   */
  const catalogo = MINI_APPS.map((app) => ({ app, enlace: validarEnlace(urlDe(app.id)) }));
  const listas = catalogo.filter((e) => e.enlace.ok);
  const pendientes = catalogo.filter((e) => !e.enlace.ok);

  const cuenta = (n: number): string =>
    n === 1 ? copy.sections.countOne : fill(copy.sections.count, { n });

  function Tarjeta({ app, enlace }: { app: MiniApp; enlace: ResultadoEnlace }) {
    const texto = copy.apps[app.id];
    /* Algunas traen una línea propia —«empezar es gratis»— y otras no.
       Se lee así en vez de con `in` para que TypeScript no obligue a
       declararla vacía en las que no la tienen. */
    const gratis = (texto as { free?: string }).free;
    const pronto = !enlace.ok;
    const yaAvisado = avisado.includes(app.id);

    /* El dominio va destacado dentro de la frase, no en una línea aparte:
       lo que hay que leer es «a dónde va», no «hay un dominio». */
    const [antes, despues] = copy.card.leaves.split("{domain}");

    /* El sobretítulo es el dato que decide si entra ahora o vuelve luego.
       Normalmente es cuánto tarda; en las que no se miden en minutos —un
       catálogo entero— es lo otro que decide: que entrar no cuesta. */
    const sobre =
      app.minutos > 0
        ? { name: "clock", icon: Clock, texto: fill(copy.card.minutes, { n: app.minutos }) }
        : gratis
          ? { name: "check", icon: Check, texto: gratis }
          : null;

    return (
      <KitCard tone={pronto ? "pending" : undefined}>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            {sobre ? (
              <>
                <Glyph
                  name={sobre.name}
                  icon={sobre.icon}
                  size={15}
                  className={cn("shrink-0", pronto ? "text-disabled" : "text-ink")}
                />
                <span
                  className={cn(
                    "min-w-0 text-micro uppercase",
                    pronto ? "text-disabled" : "text-ink",
                  )}
                >
                  {sobre.texto}
                </span>
              </>
            ) : null}
          </span>
          {pronto ? <KitBadge tone="building">{copy.card.soonBadge}</KitBadge> : null}
        </div>

        <h3
          className={cn(
            "mt-2 text-pretty text-body-lg font-bold leading-[1.24] tracking-[-0.018em]",
            pronto ? "text-muted" : "text-ink",
          )}
        >
          {texto.title}
        </h3>

        <p className="mt-2 text-pretty text-body leading-[1.45] text-muted">{texto.body}</p>

        <div className="mt-4">
          {enlace.ok ? (
            /* Un enlace, no un botón: sale de la aplicación y tiene que
               poder abrirse en otra pestaña. Lleva las clases del sistema
               porque `KitButton` sólo sabe dibujar `<button>`. */
            <a
              href={enlace.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={fill(copy.card.openAria, { app: texto.title })}
              className="ax-btn btn-accent btn-sm"
            >
              <Glyph name="external-link" icon={ExternalLink} size={17} strokeWidth={2} />
              {copy.card.open}
            </a>
          ) : (
            /* Confirmación en el sitio: el mismo botón cambia de estado, sin
               aviso flotante ni ventana. Vuelve atrás si se toca otra vez. */
            <div role="status">
              <KitButton
                size="sm"
                kind={yaAvisado ? "quiet" : "ghost"}
                iconName={yaAvisado ? "check" : "bell"}
                icon={yaAvisado ? Check : Bell}
                onClick={() =>
                  setAvisado((lista) =>
                    lista.includes(app.id)
                      ? lista.filter((id) => id !== app.id)
                      : [...lista, app.id],
                  )
                }
              >
                {yaAvisado ? copy.card.notified : copy.card.notify}
              </KitButton>
            </div>
          )}
        </div>

        {/* A dónde va, con su dominio. Antes de tocar, no después. */}
        <p className="mt-3 flex items-start gap-1.5 text-pretty text-label leading-[1.45] text-disabled">
          <Glyph
            name={enlace.ok ? "arrow-up-right" : "globe"}
            icon={enlace.ok ? ArrowUpRight : Globe}
            size={15}
            className="mt-0.5 shrink-0"
          />
          <span className="min-w-0">
            {enlace.ok ? (
              <>
                {antes}
                <strong className="font-semibold text-muted">{enlace.dominio}</strong>
                {despues}
              </>
            ) : (
              copy.card.leavesSoon
            )}
          </span>
        </p>

        {/* El aviso de las que tocan corte, dinero o trámite. */}
        {app.aviso ? (
          <p className="mt-3 border-t border-line pt-3 text-pretty text-label leading-[1.45] text-disabled">
            {copy.disclaimer}
          </p>
        ) : null}
      </KitCard>
    );
  }

  const hayAlguna = listas.length > 0;

  return (
    <article className="mx-auto w-full max-w-4xl">
      <ScreenHeader overline={copy.overline} title={copy.title} sub={copy.subtitle} />

      {hayAlguna ? (
        <>
          <section aria-label={copy.sections.ready}>
            <DayRule
              className="mt-[18px]"
              day={copy.sections.ready}
              date={cuenta(listas.length)}
            />
            <ul className="flex flex-col gap-2.5">
              {listas.map(({ app, enlace }) => (
                <li key={app.id}>
                  <Tarjeta app={app} enlace={enlace} />
                </li>
              ))}
            </ul>
          </section>

          {pendientes.length > 0 ? (
            <section aria-label={copy.sections.soon}>
              <DayRule day={copy.sections.soon} date={cuenta(pendientes.length)} />
              <ul className="flex flex-col gap-2.5">
                {pendientes.map(({ app, enlace }) => (
                  <li key={app.id}>
                    <Tarjeta app={app} enlace={enlace} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        /* ── Ninguna disponible todavía ──
           Ningún catálogo fingido: un panel, una acción. */
        <StatePanel
          className="mt-8"
          iconName="store"
          icon={Store}
          title={copy.empty.title}
          body={copy.empty.body}
        >
          <div role="status" className="mt-5">
            <KitButton
              size="sm"
              kind={avisadoPrimera ? "quiet" : "ghost"}
              iconName={avisadoPrimera ? "check" : "bell"}
              icon={avisadoPrimera ? Check : Bell}
              onClick={() => setAvisadoPrimera((antes) => !antes)}
            >
              {avisadoPrimera ? copy.empty.notified : copy.empty.cta}
            </KitButton>
          </div>
        </StatePanel>
      )}

      <KitNotice iconName="landmark" icon={Landmark} className={hayAlguna ? "mt-[18px]" : "mt-6"}>
        {copy.official}
      </KitNotice>
    </article>
  );
}
