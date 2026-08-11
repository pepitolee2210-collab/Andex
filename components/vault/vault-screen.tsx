"use client";

/**
 * BÓVEDA DIGITAL — la pantalla del módulo 1 (§5-M1).
 *
 * El orden de arriba abajo no es estético, es una jerarquía de urgencia:
 *
 *  1. **La acción.** Escanear es el verbo del módulo y está siempre a mano,
 *     no sólo cuando la bóveda está vacía.
 *  2. **La privacidad.** Es el argumento que hace que alguien se atreva a
 *     fotografiar su pasaporte, con su límite real ("protege tu teléfono"):
 *     en seguridad prometer de más es peor que no prometer nada, y este
 *     público ya oyó "nivel bancario" de quien lo estafó. Abierta de par en
 *     par la primera vez —cuando se decide la confianza— y plegada después,
 *     porque en la visita veinte se interpone entre la persona y sus papeles.
 *  3. **Lo que se vence**, como aviso corto y accionable.
 *  4. Las carpetas y sus documentos.
 *  5. El espacio del teléfono, **sólo cuando queda poco** (<15%): enseñarlo
 *     siempre es ruido; enseñarlo tarde es un guardado que falla sin motivo.
 *  6. La consulta guiada de trámites oficiales.
 *
 * ── Por qué el aviso de vencimiento NO repite la tarjeta ──
 * Un documento que vence pronto salía dos veces: entero arriba y entero otra
 * vez en su carpeta. En un móvil las dos copias caen a dos pantallas de
 * distancia y se leen como dos documentos distintos. Ahora arriba va una
 * línea —nombre, cuánto le queda— que lleva a la tarjeta de verdad. El
 * documento existe en un solo sitio.
 *
 * Los documentos NO salen del dispositivo: se leen de IndexedDB cifrado
 * (`lib/vault/storage`) ya en el navegador. Por eso todo esto es cliente y el
 * servidor sólo resuelve el idioma y el texto.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Car,
  ChevronDown,
  ChevronRight,
  FolderLock,
  HardDrive,
  House,
  IdCard,
  Lock,
  Plane,
  Receipt,
  ScanLine,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { moduleBySlug } from "@/lib/catalogs/modules";
import type { Lang, ModuleId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { listDocuments, storageEstimate } from "@/lib/vault/storage";
import {
  VAULT_FOLDERS,
  expiryState,
  type VaultDocument,
  type VaultFolderId,
} from "@/lib/vault/types";
import { usePanel } from "@/components/panel/panel-context";
import { ModuleIcon } from "@/components/module-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentList } from "./document-list";
import { TrackerSection } from "./tracker/tracker-section";
import {
  compareUrgency,
  documentCountText,
  expiryText,
  expiryTone,
  expiryToneClass,
  fill,
  formatBytes,
  isLowOnSpace,
  isUrgent,
  matchesFilter,
  searchDocuments,
  type StorageEstimate,
  type VaultCommonCopy,
  type VaultDocumentCopy,
  type VaultEntry,
  type VaultFilter,
} from "./vault-format";
import type { BovedaDict } from "@/lib/i18n/dictionaries/boveda";

/** Id del módulo en el catálogo §7.4 (el slug es el contrato, no el número). */
const BOVEDA_ID: ModuleId = moduleBySlug("boveda")?.id ?? 1;

const FOLDER_ICONS: Record<VaultFolderId, LucideIcon> = {
  identity: IdCard,
  immigration: Plane,
  driving: Car,
  taxes: Receipt,
  housing: House,
};

export type VaultScreenProps = {
  lang: Lang;
  copy: BovedaDict;
  common: VaultCommonCopy;
  /**
   * ⛏️ Punto de conexión del escáner. Mientras no exista su UI, la pantalla
   * no enseña un botón que no lleva a ninguna parte: el estado vacío se queda
   * con su explicación y sin llamada a la acción. En cuanto el flujo de
   * escaneo esté listo se monta aquí y esto pasa a abrirlo.
   */
  onScan?: () => void;
  /**
   * Cambia cuando se guarda un documento nuevo. La bóveda recarga su lista
   * sin volver a montarse, para no perder la carpeta que el usuario tenía
   * abierta justo después de escanear.
   */
  refreshSignal?: number;
};

export function VaultScreen({
  lang,
  copy,
  common,
  onScan,
  refreshSignal = 0,
}: VaultScreenProps) {
  const { openModule } = usePanel();

  const [documents, setDocuments] = useState<VaultDocument[] | null>(null);
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  const [selected, setSelected] = useState<VaultFolderId | null>(null);

  /** Día de referencia, fijo mientras dure la visita: el estado no baila. */
  const today = useMemo(() => new Date(), []);

  const refresh = useCallback(async () => {
    const [list, estimate] = await Promise.all([listDocuments(), storageEstimate()]);
    setDocuments(list);
    setStorage(estimate);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSignal]);

  // §7.5 — `module_opened`. Se emite por `openModule` del panel, que es quien
  // conoce la posición en el grid y si veníamos de una recomendación, y de
  // paso suma la apertura al comportamiento del motor (§3.3.2). El guard
  // sobrevive al doble render de desarrollo.
  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    openModule(BOVEDA_ID);
  }, [openModule]);

  // ── Derivados ───────────────────────────────────────────

  const entries = useMemo<VaultEntry[]>(
    () =>
      (documents ?? []).map((document) => ({
        document,
        state: expiryState(document.expiresAt, today),
      })),
    [documents, today],
  );

  const counts = useMemo(() => {
    const map = new Map<VaultFolderId, number>();
    for (const folder of VAULT_FOLDERS) map.set(folder, 0);
    for (const entry of entries) {
      map.set(entry.document.folder, (map.get(entry.document.folder) ?? 0) + 1);
    }
    return map;
  }, [entries]);

  const urgent = useMemo(
    () => entries.filter((entry) => isUrgent(entry.state)).sort(compareUrgency),
    [entries],
  );

  /** Sin elección explícita se abre la primera carpeta que tenga algo. */
  const activeFolder: VaultFolderId =
    selected ??
    VAULT_FOLDERS.find((folder) => (counts.get(folder) ?? 0) > 0) ??
    VAULT_FOLDERS[0];

  const visible = useMemo(
    () =>
      entries
        .filter((entry) => entry.document.folder === activeFolder)
        .sort(compareUrgency),
    [entries, activeFolder],
  );

  const documentCopy = useMemo<VaultDocumentCopy>(
    () => ({
      list: copy.list,
      expiry: copy.expiry,
      folders: copy.folders,
      fields: {
        nameLabel: copy.scanner.nameLabel,
        namePlaceholder: copy.scanner.namePlaceholder,
        folderLabel: copy.scanner.folderLabel,
      },
      common,
    }),
    [copy, common],
  );

  const lowOnSpace = isLowOnSpace(storage);
  const isEmpty = documents !== null && documents.length === 0;

  // ── Buscar ──
  // Buscar y navegar son dos modos, no uno con adornos: mientras hay texto
  // escrito o un filtro puesto, las carpetas se apartan y se enseña una
  // lista plana con TODO lo que coincide, venga de donde venga. Quien
  // escribe "pasaporte" no quiere que le contesten "en esa carpeta no está".
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VaultFilter>("all");
  const searching = query.trim().length > 0 || filter !== "all";

  const results = useMemo(
    () => (searching ? searchDocuments(entries, query, filter) : []),
    [entries, query, filter, searching],
  );

  /** Cuántos hay en cada filtro: un contador vacío no se ofrece. */
  const filterCounts = useMemo(
    () => ({
      all: entries.length,
      dueSoon: entries.filter((e) => matchesFilter(e, "dueSoon")).length,
      noExpiry: entries.filter((e) => matchesFilter(e, "noExpiry")).length,
    }),
    [entries],
  );

  const FILTERS: readonly VaultFilter[] = ["all", "dueSoon", "noExpiry"];

  /** Salta del aviso de vencimiento a la tarjeta real, en su carpeta. */
  const folderRef = useRef<HTMLElement>(null);
  function irADocumento(folder: VaultFolderId) {
    setSelected(folder);
    // En el fotograma siguiente, cuando la carpeta ya se ha pintado.
    requestAnimationFrame(() => {
      folderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <article className="mx-auto w-full max-w-4xl">
      {/* ── Encabezado del módulo ── */}
      <header className="flex items-start gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-teal-soft text-teal-deep sm:size-12"
        >
          <ModuleIcon slug="boveda" size={24} />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-h2 text-ink sm:text-h1">{copy.title}</h1>
          <p className="mt-1 text-body text-muted sm:text-body-lg">{copy.subtitle}</p>
        </div>
      </header>

      {/* ── La acción, siempre a mano ──
          Antes el botón de escanear vivía dentro del estado vacío, así que
          desaparecía en cuanto había un documento: la bóveda se quedaba sin
          forma de añadir el segundo. Ahora es lo primero después del título,
          que es donde debe estar el verbo del módulo. */}
      {onScan ? (
        <Button size="lg" fullWidth onClick={onScan} className="mt-4 sm:w-auto">
          <ScanLine aria-hidden="true" className="size-5" />
          {copy.empty.cta}
        </Button>
      ) : null}

      {/* ── Privacidad: el argumento, no el descargo ──
          Abierta cuando la bóveda está vacía —es entonces cuando la persona
          decide si se fía— y plegada en cuanto hay documentos, para que no se
          interponga entre ella y sus papeles cada vez que entra. `<details>`
          lo resuelve sin estado y funciona aunque el JavaScript no cargue. */}
      {/* Cerrada mientras se leen los documentos, no abierta: si empezara
          abierta, quien ya tiene papeles la vería desplegarse y plegarse
          sola en cada carga, moviendo todo lo de abajo. Así el salto ocurre
          una sola vez, en la primera visita, que es cuando además interesa
          que se despliegue. */}
      <details
        open={isEmpty}
        className="group mt-4 overflow-hidden rounded-xl border border-line bg-teal-soft shadow-sm"
      >
        <summary
          className={cn(
            "flex min-h-12 cursor-pointer list-none items-center gap-2 p-4 text-left",
            "[&::-webkit-details-marker]:hidden",
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-deep",
          )}
        >
          <Lock aria-hidden="true" className="size-4 shrink-0 text-teal-deep" />
          <span className="min-w-0 flex-1 text-body font-semibold text-ink">
            {copy.privacy.headline}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-5 shrink-0 text-teal-deep transition-transform duration-200 group-open:rotate-180"
          />
        </summary>
        <div className="px-4 pb-4">
          <Badge variant="teal">
            <Lock aria-hidden="true" className="size-3.5" />
            {copy.privacy.badge}
          </Badge>
          <p className="mt-3 text-body text-ink">{copy.privacy.body}</p>
          {/* El límite real, con el mismo peso que la promesa. */}
          <p className="mt-3 flex items-start gap-2.5 border-t border-line pt-3 text-body text-ink">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal-deep" />
            <span className="min-w-0">{copy.privacy.caveat}</span>
          </p>
        </div>
      </details>

      {documents === null ? (
        <div aria-busy="true" className="mt-6 space-y-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : (
        <>
          {/* ── Se te vence pronto ──
              Un aviso, no una segunda copia del archivo: una línea por
              documento con lo único que importa aquí —cuánto le queda— y un
              toque que baja a su tarjeta. */}
          {urgent.length > 0 && !searching ? (
            <section
              aria-labelledby="boveda-vencimientos"
              className="mt-6 overflow-hidden rounded-xl border border-amber-deep/30 bg-amber-soft"
            >
              <div className="px-4 pt-4">
                <h2 id="boveda-vencimientos" className="font-heading text-h3 text-ink">
                  {copy.sections.dueSoon}
                </h2>
                <p className="mt-1 text-caption text-muted">{copy.expiry.alertPromise}</p>
              </div>
              <ul className="mt-3 divide-y divide-line border-t border-line">
                {urgent.map(({ document, state }) => (
                  <li key={document.id}>
                    <button
                      type="button"
                      onClick={() => irADocumento(document.folder)}
                      className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-deep"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-medium text-ink">
                          {document.name}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-caption font-semibold",
                            expiryToneClass(expiryTone(state)),
                          )}
                        >
                          {expiryText(state, copy.expiry)}
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* ── Buscar y filtrar ──
              No aparece con la bóveda vacía: un buscador sobre cero
              documentos es un control que promete algo que no existe. */}
          {!isEmpty ? (
            <div className="mt-6">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label={copy.search.label}
                  placeholder={copy.search.placeholder}
                  // `min-h-12` para que el dedo acierte, y 16px de tipo para
                  // que Safari en iPhone no haga zoom al enfocar el campo.
                  //
                  // Se oculta la equis nativa de `type="search"`: el
                  // navegador dibuja la suya y salían dos, una al lado de la
                  // otra. Se queda la nuestra, que cumple el tamaño mínimo de
                  // 44px y lleva su etiqueta accesible.
                  className={cn(
                    "min-h-12 w-full rounded-lg border border-line bg-surface pl-11 pr-11 text-[1rem] text-ink",
                    "placeholder:text-muted focus-visible:border-teal-deep focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-deep",
                    "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
                  )}
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label={copy.search.clear}
                    className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                ) : null}
              </div>

              {/* Filtros por ESTADO, no por carpeta. Al abrir la bóveda con
                  prisa nadie piensa "esto era Identificación": piensa "qué se
                  me está venciendo". */}
              <div role="group" aria-label={copy.expiry.label} className="mt-2 flex flex-wrap gap-2">
                {FILTERS.map((option) => {
                  const active = option === filter;
                  const count = filterCounts[option];
                  // Un filtro que no puede devolver nada no se ofrece.
                  if (option !== "all" && count === 0) return null;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(option)}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-body transition-colors",
                        active
                          ? "border-teal-deep bg-teal-deep font-medium text-white"
                          : "border-line bg-surface text-muted hover:border-muted hover:text-ink",
                      )}
                    >
                      {copy.search.filters[option]}
                      {option !== "all" ? (
                        <span
                          className={cn(
                            "text-caption font-bold tabular-nums",
                            active ? "text-white/80" : "text-muted",
                          )}
                        >
                          {count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ── Resultados ──
              Mientras se busca, las carpetas se apartan: sobra el mapa
              cuando ya se ha dicho lo que se busca. */}
          {searching ? (
            <section aria-labelledby="boveda-resultados" className="mt-5">
              <h2 id="boveda-resultados" className="text-body font-semibold text-ink">
                {results.length === 1
                  ? copy.search.resultCountOne
                  : fill(copy.search.resultCount, { n: results.length })}
              </h2>

              {/* El empujón que tapa el agujero: sin fecha no hay aviso, y
                  el aviso es justo por lo que se paga el módulo. */}
              {filter === "noExpiry" && results.length > 0 ? (
                <p className="mt-2 flex items-start gap-2 rounded-lg border border-amber-deep/30 bg-amber-soft p-3 text-caption text-ink">
                  <TriangleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-amber-deep"
                  />
                  <span className="min-w-0">{copy.search.noExpiryNudge}</span>
                </p>
              ) : null}

              {results.length > 0 ? (
                <DocumentList
                  entries={results}
                  copy={documentCopy}
                  showFolder
                  onChanged={refresh}
                  className="mt-3"
                />
              ) : (
                <div className="mt-3 rounded-lg border border-dashed border-line p-6 text-center">
                  <p className="text-body text-ink">{copy.search.noResults}</p>
                  <p className="mt-1 text-caption text-muted">{copy.search.noResultsHint}</p>
                </div>
              )}
            </section>
          ) : isEmpty ? (
            /* ── Estado vacío ──
               Con la bóveda vacía no se enseñan las cinco carpetas: serían
               cinco controles que no llevan a ningún sitio. Vuelven en cuanto
               haya un documento, con sus pistas de qué guardar en cada una. */
            /* Sin botón: el de escanear ya está arriba, a un dedo de aquí.
               Dos llamadas idénticas en la misma pantalla no dan el doble de
               conversión, sólo obligan a elegir entre dos cosas iguales. */
            <EmptyState
              icon={<FolderLock />}
              title={copy.empty.title}
              description={copy.empty.body}
              className="mt-6 rounded-xl border border-dashed border-line bg-surface"
            />
          ) : (
            <>
              {/* ── Las cinco carpetas ──
                  Grupo de botones, no navegación: filtran lo que se ve debajo
                  y no llevan a otra pantalla, así que no añaden un landmark.

                  Fichas compactas: icono, nombre y cuántos hay. La pista de
                  qué guardar en cada una ("Pasaporte, matrícula consular…")
                  se ha bajado al encabezado de la carpeta abierta, que es
                  donde sirve. Repetida cinco veces aquí arriba ocupaba media
                  pantalla del teléfono para decir "0 documentos" cuatro
                  veces. */}
              <div role="group" aria-label={copy.scanner.folderLabel} className="mt-6">
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                  {VAULT_FOLDERS.map((folder) => {
                    const Icon = FOLDER_ICONS[folder];
                    const active = folder === activeFolder;
                    const count = counts.get(folder) ?? 0;
                    return (
                      <li key={folder}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelected(folder)}
                          className={cn(
                            "flex min-h-16 w-full flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors",
                            active
                              ? "border-teal-deep bg-teal-soft"
                              : "border-line bg-surface shadow-sm hover:border-muted hover:bg-surface-alt",
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Icon
                              aria-hidden="true"
                              className={cn(
                                "size-5 shrink-0",
                                active ? "text-teal-deep" : "text-muted",
                              )}
                            />
                            {/* El contador sólo aparece si hay algo: un "0"
                                repetido no informa, sólo llena. */}
                            {count > 0 ? (
                              <span
                                className={cn(
                                  "ml-auto rounded-full px-2 py-0.5 text-caption font-bold tabular-nums",
                                  active
                                    ? "bg-teal-deep text-white"
                                    : "bg-surface-alt text-muted",
                                )}
                              >
                                {count}
                              </span>
                            ) : null}
                          </span>
                          <span className="block text-caption font-medium leading-snug text-ink">
                            {copy.folders[folder].name}
                          </span>
                          <span className="sr-only">
                            {documentCountText(count, copy.list)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* ── Documentos de la carpeta abierta ── */}
              <section ref={folderRef} aria-labelledby="boveda-carpeta" className="mt-6 scroll-mt-4">
                <h2 id="boveda-carpeta" className="font-heading text-h3 text-ink">
                  {copy.folders[activeFolder].name}
                </h2>
                <p className="mt-1 text-caption text-muted">
                  {copy.folders[activeFolder].hint}
                </p>

                {visible.length > 0 ? (
                  <DocumentList
                    entries={visible}
                    copy={documentCopy}
                    onChanged={refresh}
                    className="mt-4"
                  />
                ) : (
                  <p className="mt-4 rounded-lg border border-dashed border-line p-6 text-center text-body text-muted">
                    {copy.empty.body}
                  </p>
                )}
              </section>
            </>
          )}

          {/* ── Espacio en el teléfono: sólo cuando aprieta ── */}
          {lowOnSpace && storage ? (
            <section
              aria-labelledby="boveda-espacio"
              className="mt-6 rounded-lg border border-line bg-amber-soft p-4"
            >
              <h2
                id="boveda-espacio"
                className="flex items-center gap-2 font-heading text-h3 text-ink"
              >
                <HardDrive aria-hidden="true" className="size-5 shrink-0 text-amber-deep" />
                {copy.storage.title}
              </h2>
              <p className="mt-1.5 text-body text-ink">
                {fill(copy.storage.used, {
                  used: formatBytes(storage.used, lang),
                  total: formatBytes(storage.quota, lang),
                })}
              </p>
              <p className="mt-1 text-body text-ink">{copy.storage.warning}</p>
            </section>
          ) : null}
        </>
      )}

      {/* ── Consulta guiada de trámites oficiales ── */}
      <TrackerSection
        copy={copy.tracker}
        common={common}
        headingId="boveda-tramites"
        className="mt-8 border-t border-line pt-6"
      />
    </article>
  );
}
