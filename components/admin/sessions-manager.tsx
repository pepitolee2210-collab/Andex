"use client";

/**
 * ADMINISTRACIÓN — sesiones de un taller.
 *
 * La pantalla existe para una cosa concreta: **que cada sesión tenga su
 * propio enlace de Zoom**. Un enlace fijo, el mismo cada semana, deja entrar
 * para siempre a cualquiera que lo consiga una vez —basta con que alguien lo
 * reenvíe por WhatsApp— y en una sala donde se habla de casos de inmigración
 * eso no es una fuga de negocio: es una lista de asistencia para quien la
 * quiera.
 *
 * Las fechas NO se escriben a mano. Se generan de la recurrencia de la serie
 * (`lib/community/schedule.ts`, con sus 23 pruebas) para que el horario de
 * verano y el salto de día no dependan de que alguien se acuerde.
 *
 * ── La forma es la del sistema de diseño ──
 *
 * `screens.jsx` → `Admin`: un rótulo «Próximas cuatro semanas» con la fila
 * que genera, y debajo una tarjeta por sesión que dice su estado con
 * palabras («Enlace guardado», «Dominio rechazado») y no sólo con color. El
 * enlace ya guardado se lee como texto, igual que en el diseño; el campo
 * aparece cuando hay algo que escribir.
 *
 * ── Dónde se guarda ──
 * En modo demo, en `localStorage`: la app corre sin credenciales (D2) y los
 * datos viven en el navegador. La forma guardada es exactamente la de
 * `workshop_sessions` en `0007_comunidad.sql`, así que enchufar Supabase es
 * cambiar de dónde salen, no reescribir la pantalla.
 */

import { useEffect, useMemo, useState } from "react";
import {
  CalendarOff,
  CalendarPlus,
  ChevronRight,
  Link2,
  Pencil,
  Trash2,
} from "lucide-react";
import type { WorkshopSeed } from "@/lib/catalogs/talleres";
import { upcomingSessions } from "@/lib/community/schedule";
import { getDictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Glyph,
  KitCard,
  KitNotice,
  ListGroup,
  ListRow,
  ScreenHeader,
  SectionLabel,
  StatePanel,
} from "@/components/ui/kit";

/** Espejo de `workshop_sessions`. Instantes en ISO, como en la base. */
export type StoredSession = {
  id: string;
  seriesId: string;
  startsAt: string;
  endsAt: string;
  joinUrl: string | null;
  status: "scheduled" | "canceled";
};

const CLAVE = "andex.admin.sessions.v1";

function leer(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as StoredSession[]) : [];
  } catch {
    return [];
  }
}

function escribir(rows: StoredSession[]): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(rows));
  } catch {
    // Cuota llena o almacenamiento bloqueado. No se rompe la pantalla: el
    // aviso de abajo ya dice que en demo esto vive sólo en el navegador.
  }
}

/**
 * Sólo se acepta un enlace de Zoom por HTTPS.
 *
 * No es puritanismo de validación: es el único filtro barato contra pegar
 * por error un enlace de otra cosa —o uno que alguien mandó por correo— en
 * el sitio donde cuarenta personas van a pulsar sin mirar.
 */
export function isZoomUrl(value: string): boolean {
  const v = value.trim();
  if (v === "") return true; // vacío = todavía sin publicar, es válido
  try {
    const u = new URL(v);
    return u.protocol === "https:" && /(^|\.)zoom\.us$/i.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Por qué se rechazó, con el dominio delante.
 *
 * El diseño lo escribe así —«zoom-us.link» no es un dominio de Zoom— y no
 * es un adorno: quien pega un enlace de phishing convincente necesita ver
 * QUÉ dominio pegó, porque a simple vista se parecía al bueno.
 */
function motivoRechazo(value: string): string {
  const v = value.trim();
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") {
      return "El enlace tiene que ir por https. Sólo se aceptan enlaces de zoom.us.";
    }
    return `«${u.hostname}» no es un dominio de Zoom. Sólo se aceptan enlaces de zoom.us.`;
  } catch {
    const host = v.match(/^(?:[a-z]+:\/\/)?([^/?#\s]+)/i)?.[1] ?? "";
    if (host.includes(".")) {
      return `«${host}» no es un dominio de Zoom. Sólo se aceptan enlaces de zoom.us.`;
    }
    return "Eso no parece un enlace. Sólo se aceptan enlaces https de zoom.us.";
  }
}

/** Los días de la semana, para leer la recurrencia de la serie. */
const DIAS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const mayuscula = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** «Martes a viernes» si son seguidos; si no, la lista entera. */
function rangoDias(weekdays: readonly number[]): string {
  if (weekdays.length === 0) return "";
  const orden = [...weekdays].sort((a, b) => a - b);
  const seguidos = orden.every((d, i) => i === 0 || d === orden[i - 1] + 1);
  if (seguidos && orden.length > 2) {
    return mayuscula(`${DIAS[orden[0]]} a ${DIAS[orden[orden.length - 1]]}`);
  }
  return mayuscula(orden.map((d) => DIAS[d]).join(", "));
}

/** 1080 → «6:00 p.m.». La hora del taller se dice como se dice en Utah. */
function hora12(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  const sufijo = h >= 12 ? "p.m." : "a.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

/** El piloto es Utah; si algún día hay otra zona, se dice su nombre IANA. */
const ZONAS: Record<string, string> = { "America/Denver": "hora de Utah" };

/** Los títulos reales de los talleres, los mismos que ve la comunidad. */
const TITULOS = getDictionary("es").comunidad.workshops;

function tituloDe(serie: WorkshopSeed): string {
  return TITULOS[serie.slug as keyof typeof TITULOS]?.title ?? serie.slug;
}

export type SessionsManagerProps = {
  series: readonly WorkshopSeed[];
  /** Cuántas sesiones genera cada pulsación. Cuatro semanas de martes a viernes. */
  generateCount?: number;
};

export function SessionsManager({ series, generateCount = 16 }: SessionsManagerProps) {
  const [rows, setRows] = useState<StoredSession[] | null>(null);
  const [activa, setActiva] = useState(series[0]?.id ?? "");
  /** Qué sesión tiene el campo abierto. El resto enseña el enlace como texto. */
  const [editando, setEditando] = useState<string | null>(null);

  useEffect(() => setRows(leer()), []);

  const guardar = (next: StoredSession[]) => {
    setRows(next);
    escribir(next);
  };

  const serie = series.find((s) => s.id === activa) ?? series[0];

  const propias = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => r.seriesId === serie?.id)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [rows, serie],
  );

  function generar() {
    if (!serie || !rows) return;
    const nuevas = upcomingSessions(serie, new Date(), generateCount).map((s) => ({
      id: `${serie.id}:${s.startsAt.toISOString()}`,
      seriesId: serie.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      joinUrl: null,
      status: "scheduled" as const,
    }));
    // Se conservan las que ya existen con su enlace: regenerar no puede
    // borrar el trabajo hecho. Es la misma clave única que la base impone
    // con `uq_sesion_serie_inicio`.
    const existentes = new Set(rows.map((r) => r.id));
    guardar([...rows, ...nuevas.filter((n) => !existentes.has(n.id))]);
  }

  function setEnlace(id: string, url: string) {
    if (!rows) return;
    guardar(rows.map((r) => (r.id === id ? { ...r, joinUrl: url.trim() || null } : r)));
  }

  function borrar(id: string) {
    if (!rows) return;
    guardar(rows.filter((r) => r.id !== id));
  }

  const fmt = new Intl.DateTimeFormat("es-MX", {
    timeZone: serie?.timeZone ?? "America/Denver",
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  if (!serie) return <p className="text-body text-muted">No hay talleres configurados.</p>;

  const sinEnlace = propias.filter((r) => !r.joinUrl).length;
  const cuando = `${rangoDias(serie.weekdays)}, ${hora12(serie.startMinutes)} ${
    ZONAS[serie.timeZone] ?? serie.timeZone
  }`;

  return (
    <>
      {/* La cabecera vive aquí y no en la página porque las primitivas del
          kit usan `useState` sin declarar `"use client"`: sólo se pueden
          importar desde un componente de cliente, y la página es servidor. */}
      <ScreenHeader
        overline="Panel interno"
        title="Sesiones de talleres"
        sub="Generar las próximas y pegar su enlace de Zoom."
      />

      {/* ── Qué taller se está tocando ──
          Con una sola serie no hay nada que elegir, así que no se pinta. */}
      {series.length > 1 ? (
        <div role="group" aria-label="Taller" className="chiplist mt-5">
          {series.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={s.id === serie.id}
              onClick={() => {
                setActiva(s.id);
                setEditando(null);
              }}
              className={cn("ax-chip", s.id === serie.id && "on")}
            >
              {tituloDe(s)}
            </button>
          ))}
        </div>
      ) : null}

      <SectionLabel as="h2">Próximas cuatro semanas</SectionLabel>
      <ListGroup>
        <ListRow
          iconName="calendar-plus"
          icon={CalendarPlus}
          title="Generar sesiones"
          meta={cuando}
          warn={`Las fechas salen de la recurrencia del taller, con el cambio de horario ya resuelto. Salen ${generateCount} de una vez y las repetidas no se duplican.`}
          onClick={generar}
          trail={
            <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-disabled" />
          }
        />
      </ListGroup>

      {/* ── Las sesiones ── */}
      <SectionLabel as="h2">Enlaces por sesión</SectionLabel>

      <KitNotice iconName="link-2" icon={Link2} className="mb-3">
        {sinEnlace > 0
          ? `${sinEnlace === 1 ? "Una sesión no tiene" : `${sinEnlace} sesiones no tienen`} enlace todavía: en la app salen con su horario, pero sin botón de entrar. `
          : ""}
        Cada sesión lleva el suyo. Uno fijo dejaría entrar para siempre a cualquiera que
        lo consiga una vez.
      </KitNotice>

      {rows === null ? (
        <p className="text-body text-muted" aria-busy="true">
          Cargando…
        </p>
      ) : propias.length === 0 ? (
        <StatePanel
          iconName="calendar-off"
          icon={CalendarOff}
          title="Todavía no hay sesiones"
          body="Toca «Generar sesiones» y aparecen aquí las de las próximas cuatro semanas, una por una, para pegarles su enlace."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {propias.map((r) => {
            const guardado = r.joinUrl ?? "";
            const valido = isZoomUrl(guardado);
            const abierto = editando === r.id || guardado === "" || !valido;
            const fecha = mayuscula(fmt.format(new Date(r.startsAt)));

            return (
              <li key={r.id}>
                <KitCard>
                  <p className="text-body font-semibold text-ink">
                    {fecha} · {tituloDe(serie)}
                  </p>

                  {/* El estado, con palabras y no sólo con color. */}
                  <p
                    className={cn(
                      "mt-2 text-body font-bold",
                      guardado === ""
                        ? "text-muted"
                        : valido
                          ? "text-success"
                          : "text-danger",
                    )}
                  >
                    {guardado === ""
                      ? "Sin enlace todavía"
                      : valido
                        ? "Enlace guardado"
                        : "Dominio rechazado"}
                  </p>

                  {abierto ? (
                    <>
                      <label className="sr-only" htmlFor={`url-${r.id}`}>
                        Enlace de Zoom para la sesión del {fecha}
                      </label>
                      <input
                        id={`url-${r.id}`}
                        type="url"
                        inputMode="url"
                        defaultValue={guardado}
                        onBlur={(e) => {
                          setEnlace(r.id, e.target.value);
                          setEditando(null);
                        }}
                        placeholder="https://…zoom.us/j/…"
                        aria-invalid={!valido}
                        className={cn(
                          "mt-3 min-h-11 w-full rounded-md border bg-surface px-3.5 text-[1rem] text-ink placeholder:text-muted",
                          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-deep",
                          valido ? "border-line" : "border-danger",
                        )}
                      />
                      {!valido ? (
                        <p role="alert" className="mt-2 text-body text-muted">
                          {motivoRechazo(guardado)}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    // Guardado y válido: se lee, como en el diseño.
                    <p className="mt-2 break-all text-body text-muted">{guardado}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!abierto ? (
                      <button
                        type="button"
                        onClick={() => setEditando(r.id)}
                        className="ax-btn btn-ghost btn-sm"
                      >
                        <Glyph name="pencil" icon={Pencil} size={17} strokeWidth={2} />
                        Cambiar el enlace
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => borrar(r.id)}
                      aria-label={`Quitar la sesión del ${fecha}`}
                      className="ax-btn btn-danger btn-sm"
                    >
                      <Glyph name="trash-2" icon={Trash2} size={17} strokeWidth={2} />
                      Quitar
                    </button>
                  </div>
                </KitCard>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
