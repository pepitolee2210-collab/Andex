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
 * ── Dónde se guarda ──
 * En modo demo, en `localStorage`: la app corre sin credenciales (D2) y los
 * datos viven en el navegador. La forma guardada es exactamente la de
 * `workshop_sessions` en `0007_comunidad.sql`, así que enchufar Supabase es
 * cambiar de dónde salen, no reescribir la pantalla.
 */

import { useEffect, useMemo, useState } from "react";
import { Check, Link2, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import type { WorkshopSeed } from "@/lib/catalogs/talleres";
import { upcomingSessions } from "@/lib/community/schedule";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export type SessionsManagerProps = {
  series: readonly WorkshopSeed[];
  /** Cuántas sesiones genera cada pulsación. Cuatro semanas de martes a viernes. */
  generateCount?: number;
};

export function SessionsManager({ series, generateCount = 16 }: SessionsManagerProps) {
  const [rows, setRows] = useState<StoredSession[] | null>(null);
  const [activa, setActiva] = useState(series[0]?.id ?? "");

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
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  if (!serie) return <p className="text-body text-muted">No hay talleres configurados.</p>;

  const sinEnlace = propias.filter((r) => !r.joinUrl).length;

  return (
    <>
      {/* ── Elegir taller ── */}
      <div role="group" aria-label="Taller" className="flex flex-wrap gap-2">
        {series.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === serie.id}
            onClick={() => setActiva(s.id)}
            className={cn(
              "min-h-11 rounded-full border px-4 text-body transition-colors",
              s.id === serie.id
                ? "border-teal-deep bg-teal-deep font-medium text-white"
                : "border-line bg-surface text-muted hover:text-ink",
            )}
          >
            {s.slug}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={generar}>
          <RefreshCw aria-hidden="true" className="size-5" />
          Generar las próximas {generateCount}
        </Button>
        <p className="text-caption text-muted">
          Las fechas salen de la recurrencia del taller, con el cambio de horario ya resuelto.
        </p>
      </div>

      {sinEnlace > 0 ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-deep/30 bg-amber-soft p-3 text-body text-ink">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-deep" />
          <span>
            {sinEnlace} {sinEnlace === 1 ? "sesión no tiene" : "sesiones no tienen"} enlace. En la
            app se muestran con el horario, pero sin botón de entrar.
          </span>
        </p>
      ) : null}

      {/* ── Las sesiones ── */}
      {rows === null ? (
        <p className="mt-6 text-body text-muted" aria-busy="true">
          Cargando…
        </p>
      ) : propias.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-line p-6 text-center text-body text-muted">
          Todavía no hay sesiones generadas para este taller.
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {propias.map((r) => {
            const valido = isZoomUrl(r.joinUrl ?? "");
            return (
              <li
                key={r.id}
                className="rounded-lg border border-line bg-surface p-4 shadow-sm sm:flex sm:items-center sm:gap-4"
              >
                <p className="min-w-44 text-body font-medium capitalize text-ink">
                  {fmt.format(new Date(r.startsAt))}
                </p>

                <div className="mt-3 min-w-0 flex-1 sm:mt-0">
                  <label className="sr-only" htmlFor={`url-${r.id}`}>
                    Enlace de Zoom para la sesión del {fmt.format(new Date(r.startsAt))}
                  </label>
                  <div className="relative">
                    <Link2
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                    />
                    <input
                      id={`url-${r.id}`}
                      type="url"
                      inputMode="url"
                      defaultValue={r.joinUrl ?? ""}
                      onBlur={(e) => setEnlace(r.id, e.target.value)}
                      placeholder="https://…zoom.us/j/…"
                      aria-invalid={!valido}
                      className={cn(
                        "min-h-11 w-full rounded-md border bg-surface pl-9 pr-3 text-[1rem] text-ink placeholder:text-muted",
                        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-deep",
                        valido ? "border-line" : "border-danger",
                      )}
                    />
                  </div>
                  {!valido ? (
                    <p role="alert" className="mt-1 text-caption text-danger">
                      Tiene que ser un enlace https de zoom.us
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-2 sm:mt-0">
                  {r.joinUrl && valido ? (
                    <span className="flex items-center gap-1 text-caption font-medium text-success">
                      <Check aria-hidden="true" className="size-4" />
                      Lista
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => borrar(r.id)}
                    aria-label={`Quitar la sesión del ${fmt.format(new Date(r.startsAt))}`}
                    className="flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-danger"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
