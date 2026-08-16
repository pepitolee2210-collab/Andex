"use client";

/**
 * COMUNIDAD — la pantalla de talleres en vivo.
 *
 * Cliente entero porque todo lo que importa aquí depende del reloj y de la
 * zona horaria del navegador, y ninguna de las dos cosas las sabe el
 * servidor. Lo único que hace el servidor es resolver el idioma y el texto.
 *
 * ── La forma, del sistema de diseño ──
 *
 * Tres filetes rotulados parten la pantalla —«Hoy», «Esta semana»,
 * «Todavía sin fecha»— y cada uno lleva su recuento. Debajo de cada uno van
 * las tarjetas con el peso que les toca: la sala abierta con filete teal, la
 * de la semana plana, la que no tiene fecha en contorno fino.
 *
 * En qué grupo cae cada taller NO es un campo: sale de comparar la fecha de
 * su próxima sesión con hoy, **en la zona del navegador**. Por eso un mismo
 * taller está en «Hoy» para quien mira desde Utah y en «Esta semana» para
 * quien mira desde Manila, que es exactamente lo correcto.
 *
 * ── Un solo reloj ──
 *
 * El estado de cada puerta se calcula aquí, no dentro de cada tarjeta. Con
 * un `setInterval` por tarjeta, N talleres son N despertadores en un
 * teléfono de gama media. El intervalo se afina a un segundo sólo cuando
 * alguna sala está por abrir; el resto del tiempo basta cada 30.
 */

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Landmark, Lock, Users } from "lucide-react";
import { TALLERES, type WorkshopSeed } from "@/lib/catalogs/talleres";
import {
  calendarDateIn,
  doorState,
  resolveTimeZone,
  type DoorState,
} from "@/lib/community/schedule";
import type { ComunidadDict } from "@/lib/i18n/dictionaries/comunidad";
import {
  DayRule,
  Glyph,
  HeaderAction,
  KitNotice,
  ScreenHeader,
  StatePanel,
} from "@/components/ui/kit";
import { WorkshopDoor } from "./workshop-door";

const UTAH = "America/Denver";

const fill = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/** Los tres pesos de la pantalla, en el orden en que se leen. */
type Grupo = "hoy" | "semana" | "sinFecha";

type Puerta = { taller: WorkshopSeed; state: DoorState | null };

export type CommunityScreenProps = {
  lang: string;
  copy: ComunidadDict;
};

export function CommunityScreen({ lang, copy }: CommunityScreenProps) {
  /**
   * Arranca con la zona del taller y se corrige tras montar.
   *
   * Nunca se pregunta por IP: el navegador ya sabe su zona, es más exacto
   * que la geolocalización, no pide permiso y no cuesta un dato. En un
   * producto cuyo argumento entero es "no te sacamos información", pedir la
   * ubicación para algo que ya se sabe sería un autogol.
   */
  const [zone, setZone] = useState(UTAH);
  useEffect(() => setZone(resolveTimeZone(UTAH)), []);

  /**
   * `null` en el primer render, siempre.
   *
   * El servidor y el navegador no comparten reloj: calcularlo en el servidor
   * haría que React encontrara un HTML distinto al hidratar, y además nadie
   * debería ver una cuenta atrás congelada en el instante en que se generó
   * la página.
   */
  const [ahora, setAhora] = useState<Date | null>(null);
  const [fino, setFino] = useState(false);

  useEffect(() => {
    const tick = () => {
      const t = new Date();
      setAhora(t);
      setFino(
        TALLERES.some((taller) => {
          const k = doorState(taller, t).kind;
          return k === "opening" || k === "live";
        }),
      );
    };
    tick();
    // Al segundo sólo cuando alguna sala está por abrir. Una cuenta atrás de
    // tres días refrescada al segundo es batería tirada en el teléfono al
    // que apunta el producto.
    const id = setInterval(tick, fino ? 1000 : 30_000);
    return () => clearInterval(id);
  }, [fino]);

  /** Confirmación en el sitio, sin ventana ni aviso flotante. */
  const [apuntados, setApuntados] = useState<string[]>([]);
  const alternar = (id: string) =>
    setApuntados((lista) =>
      lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id],
    );

  const puertas = useMemo<Puerta[]>(
    () =>
      TALLERES.map((taller) => ({
        taller,
        state: ahora ? doorState(taller, ahora) : null,
      })),
    [ahora],
  );

  /**
   * En qué grupo cae. Se compara la fecha de calendario en la zona DEL
   * USUARIO: para quien mira desde Manila, el taller del martes en Utah ya
   * es de mañana.
   */
  const grupoDe = (state: DoorState | null): Grupo | null => {
    if (!state || !ahora) return null;
    if (state.kind === "none") return "sinFecha";
    const hoy = calendarDateIn(ahora, zone);
    const suyo = calendarDateIn(state.session.startsAt, zone);
    return hoy.year === suyo.year && hoy.month === suyo.month && hoy.day === suyo.day
      ? "hoy"
      : "semana";
  };

  const enGrupo = (grupo: Grupo): Puerta[] => puertas.filter((p) => grupoDe(p.state) === grupo);

  const hoy = enGrupo("hoy");
  const semana = enGrupo("semana");
  const sinFecha = enGrupo("sinFecha");

  const cuenta = (n: number): string =>
    n === 1 ? copy.sections.countOne : fill(copy.sections.count, { n });

  /** «martes 8 de enero», en la zona de quien mira. */
  const fechaHoy = ahora
    ? new Intl.DateTimeFormat(lang, {
        timeZone: zone,
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(ahora)
    : undefined;

  // `hour12` forzado por la misma razón que en la tarjeta: aquí nadie dice
  // «las diecinueve».
  const horaUtah = ahora
    ? new Intl.DateTimeFormat(lang, {
        timeZone: UTAH,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(ahora)
    : null;

  // "America/Denver" no le dice nada a nadie: se enseña la ciudad.
  const zonaLegible = zone.split("/").pop()?.replace(/_/g, " ") ?? zone;
  const textoZona = [
    fill(copy.timezone.detected, { zone: zonaLegible }),
    horaUtah ? fill(copy.timezone.utahReference, { time: horaUtah }) : null,
  ]
    .filter(Boolean)
    .join(" ");

  const puertaCopy = {
    ...copy.door,
    nextDay: copy.timezone.nextDay,
    prevDay: copy.timezone.prevDay,
  };

  const tarjeta = ({ taller, state }: Puerta, showDay?: boolean) => {
    const textos = copy.workshops[taller.slug as keyof typeof copy.workshops];
    if (!textos) return null;
    return (
      <li key={taller.id}>
        <WorkshopDoor
          workshop={taller}
          state={state}
          title={textos.title}
          summary={textos.summary}
          caveat={textos.caveat}
          copy={puertaCopy}
          lang={lang}
          userZone={zone}
          showDay={showDay}
          signedUp={apuntados.includes(taller.id)}
          onSignUp={() => alternar(taller.id)}
          /* `attendees` se queda sin pasar a propósito: no hay ni un dato
             real de quién está dentro, y un contador inventado es el patrón
             que el PRD veta. El hueco existe para el día que
             `workshop_enrollments` se lea de verdad. */
        />
      </li>
    );
  };

  return (
    <article className="mx-auto w-full max-w-4xl">
      {/* El calendario va arriba, al lado de la marca, como en el diseño.
          No es un botón: no lleva a ningún sitio, sólo dice de qué va esta
          pantalla. Pintarlo como botón prometería una acción que no hay. */}
      <HeaderAction>
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center text-disabled"
        >
          <Glyph name="calendar-days" icon={CalendarDays} size={21} />
        </span>
      </HeaderAction>

      <ScreenHeader overline={copy.overline} title={copy.title} sub={copy.subtitle} />

      {TALLERES.length === 0 ? (
        /* Nunca se finge contenido: se dice qué falta y se ofrece una salida. */
        <StatePanel
          className="mt-8"
          iconName="users"
          icon={Users}
          title={copy.empty.title}
          body={copy.empty.body}
        />
      ) : ahora === null ? (
        /* Mientras arranca el reloj del navegador no se sabe en qué grupo
           cae nada, así que las tarjetas van sin rótulo en vez de bajo uno
           equivocado. Es medio segundo, y no miente. */
        <ul className="mt-[18px] flex flex-col gap-2.5">{puertas.map((p) => tarjeta(p))}</ul>
      ) : (
        <>
          {hoy.length > 0 ? (
            <section aria-label={copy.sections.today}>
              <DayRule className="mt-[18px]" day={copy.sections.today} date={fechaHoy} />
              <ul className="flex flex-col gap-2.5">{hoy.map((p) => tarjeta(p))}</ul>
            </section>
          ) : null}

          {/* Por qué el enlace no está a la vista todavía. Va aquí, pegado a
              lo que está pasando hoy, que es donde surge la pregunta. */}
          {hoy.length > 0 ? (
            <KitNotice iconName="lock" icon={Lock} className="mt-4">
              {copy.door.noLinkWhy}
            </KitNotice>
          ) : null}

          {semana.length > 0 ? (
            <section aria-label={copy.sections.week}>
              <DayRule day={copy.sections.week} date={cuenta(semana.length)} />
              <ul className="flex flex-col gap-2.5">{semana.map((p) => tarjeta(p, true))}</ul>
            </section>
          ) : null}

          {sinFecha.length > 0 ? (
            <section aria-label={copy.sections.undated}>
              <DayRule day={copy.sections.undated} date={cuenta(sinFecha.length)} />
              <ul className="flex flex-col gap-2.5">{sinFecha.map((p) => tarjeta(p))}</ul>
            </section>
          ) : null}
        </>
      )}

      {/* La hora sale del navegador, nunca de la IP. Se dice cuál es, y se
          dice también la de Utah: la referencia común mantiene a todo el
          mundo hablando del mismo momento. */}
      <KitNotice iconName="clock" icon={Clock} className="mt-[18px]">
        {textoZona}
      </KitNotice>

      {/* Obligatorio por §6, y aquí más que nunca: un taller sobre cartas de
          USCIS es exactamente donde alguien podría creer que ANDEX habla en
          nombre del gobierno. */}
      <KitNotice iconName="landmark" icon={Landmark} className="mt-2.5">
        {copy.disclaimer}
      </KitNotice>
    </article>
  );
}
