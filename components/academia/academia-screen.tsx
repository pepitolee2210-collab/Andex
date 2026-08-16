"use client";

/**
 * INGLÉS PARA EL TRABAJO — la pantalla del módulo.
 *
 * ── Lo que manda aquí ──
 *
 * «Frases exactas con su pronunciación en teal profundo. No es un curso: no
 * hay lecciones ni progreso porcentual.» Por eso esta pantalla no tiene
 * insignias de racha, ni barras de avance, ni niveles: nada de lo que mide
 * un curso, porque esto no lo es. Lo único que se dice de tamaño es cuántas
 * frases hay dentro, y se dice antes de entrar.
 *
 * ── Los tres niveles ──
 *
 *  1. Los nueve temarios, en dos listas: los que sirven en cualquier trabajo
 *     y los de oficio. Arriba, la clase en vivo, que es lo único con fecha.
 *  2. Un temario: sus MOMENTOS —la entrevista, el primer día, cuando algo
 *     sale mal— y el manual en PDF.
 *  3. Un momento: sus frases a 25px, y lo que hay que saber con su fuente.
 *
 * Se navega con estado local, como la Bóveda: el módulo tiene una sola ruta
 * (`/modulo/academia`) y las pantallas de dentro no son direcciones del
 * producto, son profundidad dentro de la misma.
 *
 * ── La clase en vivo ──
 *
 * El ESTADO sale de `doorState`, el mismo de Comunidad: los mismos cuatro
 * estados, la misma regla de no enseñar un botón sin sala. Lo que cambia es
 * la forma —aquí es una tarjeta de tres líneas, no la puerta entera— porque
 * en Academia la clase es el aperitivo y las frases son el plato. Si algún
 * día la puerta admite una variante compacta, esta tarjeta se sustituye por
 * ella sin tocar nada más.
 */

import { useEffect, useState } from "react";
import {
  Baby,
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Hammer,
  HandCoins,
  HardHat,
  HeartHandshake,
  Sprout,
  SprayCan,
  Utensils,
  Video,
} from "lucide-react";
import { RUTAS_POR_OFICIO, RUTAS_TRANSVERSALES, rutaPorSlug } from "@/lib/catalogs/ingles";
import {
  calendarDateIn,
  doorState,
  resolveTimeZone,
  type DoorState,
  type Workshop,
} from "@/lib/community/schedule";
import { phraseCount, type LessonSituation, type LessonTrack } from "@/lib/academia/types";
import type { AcademiaDict } from "@/lib/i18n/dictionaries/academia";
import type { DoorCopy } from "@/components/community/workshop-door";
import {
  Glyph,
  KitCard,
  KitNotice,
  ListGroup,
  ListRow,
  ScreenHeader,
  SectionLabel,
  type IconComponent,
} from "@/components/ui/kit";
import { MomentDetail, TrackDetail } from "./track-card";

const UTAH = "America/Denver";

const fill = (t: string, v: Record<string, string | number>): string =>
  t.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

/**
 * El icono de cada temario, por slug.
 *
 * El `name` en kebab-case no es decorativo: es lo que el CSS mira para
 * darle su gesto —el aerosol rocía, el martillo golpea, el brote crece—.
 * Sin él el icono se queda quieto, que es un fallo silencioso.
 */
const ICONOS: Record<string, { name: string; icon: IconComponent }> = {
  "pago-y-derechos": { name: "hand-coins", icon: HandCoins },
  seguridad: { name: "hard-hat", icon: HardHat },
  "primeros-meses": { name: "calendar-days", icon: CalendarDays },
  limpieza: { name: "spray-can", icon: SprayCan },
  restaurante: { name: "utensils", icon: Utensils },
  "cuidado-ninos": { name: "baby", icon: Baby },
  jardineria: { name: "sprout", icon: Sprout },
  "cuidado-en-casa": { name: "heart-handshake", icon: HeartHandshake },
  construccion: { name: "hammer", icon: Hammer },
};

const ICONO_POR_DEFECTO = { name: "book-open", icon: BookOpen };

/** Qué se ve: la lista, un temario, o un momento de un temario. */
type Vista =
  | { modo: "temarios" }
  | { modo: "temario"; slug: string }
  | { modo: "momento"; slug: string; situacion: LessonSituation };

export type AcademiaScreenProps = {
  lang: string;
  copy: AcademiaDict;
  /** La serie de la clase de inglés, del mismo catálogo que Comunidad. */
  workshop: Workshop | null;
  workshopTitle: string;
  workshopSummary: string;
  workshopCaveat: string;
  doorCopy: DoorCopy;
};

export function AcademiaScreen({
  lang,
  copy,
  workshop,
  doorCopy,
}: AcademiaScreenProps) {
  // Del navegador, nunca de la IP. Ver `lib/community/schedule.ts`.
  const [zone, setZone] = useState(UTAH);
  useEffect(() => setZone(resolveTimeZone(UTAH)), []);

  const [vista, setVista] = useState<Vista>({ modo: "temarios" });

  /**
   * Al cambiar de nivel se vuelve arriba. El armazón sólo lo hace cuando
   * cambia la ruta, y aquí la ruta no cambia: sin esto se entra a un
   * temario y se aparece a media pantalla, como si no hubiera pasado nada.
   */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [vista]);

  const temario: LessonTrack | undefined =
    vista.modo === "temarios" ? undefined : rutaPorSlug(vista.slug);

  if (temario && vista.modo === "momento") {
    return (
      <MomentDetail
        track={temario}
        situation={vista.situacion}
        copy={copy}
        onBack={() => setVista({ modo: "temario", slug: temario.slug })}
      />
    );
  }

  if (temario && vista.modo === "temario") {
    return (
      <TrackDetail
        track={temario}
        copy={copy}
        onOpen={(situacion) => setVista({ modo: "momento", slug: temario.slug, situacion })}
        onBack={() => setVista({ modo: "temarios" })}
      />
    );
  }

  return (
    <article className="mx-auto w-full max-w-4xl">
      <ScreenHeader overline={copy.overline} title={copy.title} sub={copy.subtitle} />

      {workshop ? (
        <ClaseEnVivo
          workshop={workshop}
          copy={copy}
          doorCopy={doorCopy}
          lang={lang}
          zone={zone}
        />
      ) : null}

      {/* ── Lo que le sirve a todo el mundo ──
          VA PRIMERO, y es una decisión de producto: nadie sabe que necesita
          saber qué hacer cuando no le pagan o cuando algo es peligroso. Si
          esto se pone debajo de los oficios, sólo lo encuentra quien ya
          sabía que existía — o sea, casi nadie. */}
      {RUTAS_TRANSVERSALES.length > 0 ? (
        <>
          <SectionLabel as="h2" id="academia-todos">
            {copy.tracks.everyoneLabel}
          </SectionLabel>
          <ListGroup>
            {RUTAS_TRANSVERSALES.map((track) => (
              <FilaTemario
                key={track.id}
                track={track}
                // Teal sólo aquí: es lo que separa «esto es de todos» de
                // «esto es de tu oficio».
                tone="accent"
                meta={track.summary}
                onOpen={() => setVista({ modo: "temario", slug: track.slug })}
              />
            ))}
          </ListGroup>
        </>
      ) : null}

      <SectionLabel as="h2" id="academia-oficios">
        {copy.tracks.byTradeLabel}
      </SectionLabel>
      {RUTAS_POR_OFICIO.length > 0 ? (
        <ListGroup>
          {RUTAS_POR_OFICIO.map((track) => (
            <FilaTemario
              key={track.id}
              track={track}
              meta={fill(copy.tracks.phrasesInMoments, {
                phrases: phraseCount(track),
                moments: new Set(track.lessons.map((l) => l.situation)).size,
              })}
              onOpen={() => setVista({ modo: "temario", slug: track.slug })}
            />
          ))}
        </ListGroup>
      ) : (
        <KitNotice iconName="graduation-cap" icon={GraduationCap}>
          {copy.tracks.empty}
        </KitNotice>
      )}
      <div className="h-4" />
    </article>
  );
}

// ── Una fila de la lista de temarios ─────────────────────

function FilaTemario({
  track,
  meta,
  tone,
  onOpen,
}: {
  track: LessonTrack;
  meta: string;
  tone?: "accent";
  onOpen: () => void;
}) {
  const icono = ICONOS[track.slug] ?? ICONO_POR_DEFECTO;
  return (
    <ListRow
      iconName={icono.name}
      icon={icono.icon}
      iconTone={tone ?? "quiet"}
      title={track.title}
      meta={meta}
      onClick={onOpen}
      trail={
        <Glyph
          name="chevron-right"
          icon={ChevronRight}
          size={19}
          strokeWidth={2}
          className="text-disabled"
        />
      }
    />
  );
}

// ── La clase en vivo ─────────────────────────────────────

function ClaseEnVivo({
  workshop,
  copy,
  doorCopy,
  lang,
  zone,
}: {
  workshop: Workshop;
  copy: AcademiaDict;
  doorCopy: DoorCopy;
  lang: string;
  zone: string;
}) {
  /**
   * `null` en el primer render, siempre. El estado depende de la hora
   * actual, y el servidor y el navegador no comparten reloj: calcularlo en
   * el servidor haría que React encontrara un HTML distinto al hidratar.
   */
  const [estado, setEstado] = useState<DoorState | null>(null);

  useEffect(() => {
    const tick = () => setEstado(doorState(workshop, new Date()));
    tick();
    // Al minuto basta: aquí no hay cuenta atrás al segundo que refrescar,
    // y en un teléfono de gama media un intervalo fino es batería tirada.
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [workshop]);

  const sesion = estado && estado.kind !== "none" ? estado.session : null;
  const abierta = estado?.kind === "live" || estado?.kind === "opening";

  /* `hour12` forzado, igual que en Comunidad. Con `lang` a secas —«es», no
     «es-MX»— `Intl` resuelve a 24 horas y escribe «20:00» donde este
     público dice «8:00 p.m.». La misma clase tiene que decir la misma hora
     aquí y en Comunidad, o una de las dos miente. */
  const hora = new Intl.DateTimeFormat(lang, {
    timeZone: zone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dia = new Intl.DateTimeFormat(lang, { timeZone: zone, weekday: "long" });

  let cuando: string | null = null;
  if (sesion) {
    const hoy = calendarDateIn(new Date(), zone);
    const suyo = calendarDateIn(sesion.startsAt, zone);
    const mismoDia =
      hoy.year === suyo.year && hoy.month === suyo.month && hoy.day === suyo.day;
    cuando = fill(copy.liveClass.when, {
      day: mismoDia ? copy.liveClass.today : dia.format(sesion.startsAt),
      time: hora.format(sesion.startsAt),
    });
  }

  return (
    <KitCard className="mt-5 flex items-start gap-3.5">
      <span className="rowicon tone-accent">
        <Glyph name="video" icon={Video} size={19} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold">{copy.liveClass.title}</p>
        {/* Se reserva el hueco mientras arranca el reloj del cliente, para
            que la tarjeta no dé un salto al hidratar. */}
        <p className="rowmeta mt-1.5 min-h-6 first-letter:uppercase">{cuando}</p>

        {workshop.joinUrl && abierta ? (
          <a
            href={workshop.joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ax-btn btn-accent btn-sm mt-3.5"
          >
            <Glyph name="video" icon={Video} size={17} strokeWidth={2} />
            {copy.liveClass.cta}
          </a>
        ) : (
          /* Sin enlace no hay botón, y se dice por qué. Un botón que no
             lleva a ninguna parte gasta la confianza que este producto no
             puede permitirse gastar. */
          <p className="rowmeta mt-2 text-disabled">{doorCopy.noLink}</p>
        )}
      </div>
    </KitCard>
  );
}
