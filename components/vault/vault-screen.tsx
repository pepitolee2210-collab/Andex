"use client";

/**
 * BÓVEDA DIGITAL — la pantalla del módulo 1 (§5-M1).
 *
 * ── Qué cambió en el rediseño, y por qué ──
 *
 * Antes lo primero que se veía era un icono grande, un título, un botón y
 * una tarjeta de privacidad; los papeles empezaban por debajo del pliegue.
 * Y había DOS controles para la misma pregunta: una tira de chips
 * («Todos · Vence pronto · Sin fecha») y una rejilla de cinco carpetas.
 *
 * Ninguno de los dos contestaba lo primero que se quiere saber al abrir la
 * bóveda con prisa, que no es «en qué carpeta lo metí» sino **«¿tengo algo
 * encima?»**.
 *
 * Ahora lo primero son tres cuentas —vencen pronto · sin fecha · en regla—
 * que dicen el estado entero de la bóveda en una línea y **además son el
 * filtro**. Las carpetas siguen abajo, para cuando la pregunta sí es dónde
 * está algo.
 *
 * Y no hay estado «todos»: una lista de doce documentos sin orden de
 * urgencia no es una respuesta a ninguna pregunta.
 *
 * ── Lo que NO cambió ──
 *
 * Los documentos siguen sin salir del dispositivo: se leen de IndexedDB
 * cifrado (`lib/vault/storage`) ya en el navegador. Por eso todo esto es
 * cliente y el servidor sólo resuelve el idioma y el texto.
 *
 * La tarjeta de privacidad se queda aunque el diseño no la dibuje. No es
 * decoración: es el argumento que hace que alguien se atreva a fotografiar
 * su pasaporte, y dice su límite real en la misma frase. Este público ya
 * oyó «nivel bancario» de quien lo estafó.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarOff,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
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
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Glyph,
  HeaderAction,
  KitBadge,
  KitButton,
  KitNotice,
  ListGroup,
  ListRow,
  ScreenHeader,
  SectionLabel,
  Tally,
  type TallyItem,
} from "@/components/ui/kit";
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
  urgencyTone,
  urgencyToneVar,
  type StorageEstimate,
  type UrgencyTone,
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

/** El nombre Lucide de cada carpeta: es lo que activa su gesto en el CSS. */
const FOLDER_ICON_NAMES: Record<VaultFolderId, string> = {
  identity: "id-card",
  immigration: "plane",
  driving: "car",
  taxes: "receipt",
  housing: "house",
};

/**
 * Los tres estados del resumen, en orden de urgencia. «Vencen pronto»
 * recoge también lo ya vencido: quien tiene un permiso caducado no
 * necesita que se lo pongan en una cuarta columna, necesita verlo primero.
 */
const TALLY_STATES = ["soon", "none", "ok"] as const;
type TallyState = (typeof TALLY_STATES)[number];

/** El estado de un documento reducido a la cuenta a la que pertenece. */
function bucketOf(tone: UrgencyTone): TallyState {
  if (tone === "now" || tone === "soon") return "soon";
  if (tone === "none") return "none";
  return "ok";
}

/** El token de color de cada cuenta. */
const TALLY_TONE: Record<TallyState, string> = {
  soon: urgencyToneVar("soon"),
  none: urgencyToneVar("none"),
  ok: urgencyToneVar("ok"),
};

/** Qué se está mirando: un estado, o una carpeta concreta. */
type View =
  | { mode: "state"; state: TallyState }
  | { mode: "folder"; folder: VaultFolderId };

export type VaultScreenProps = {
  lang: Lang;
  copy: BovedaDict;
  common: VaultCommonCopy;
  /**
   * ⛏️ Punto de conexión del escáner. Mientras no exista su UI, la pantalla
   * no enseña un botón que no lleva a ninguna parte.
   */
  onScan?: () => void;
  /**
   * Cambia cuando se guarda un documento nuevo. La bóveda recarga su lista
   * sin volver a montarse, para no perder lo que el usuario tenía abierto
   * justo después de escanear.
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

  const folderCounts = useMemo(() => {
    const map = new Map<VaultFolderId, number>();
    for (const folder of VAULT_FOLDERS) map.set(folder, 0);
    for (const entry of entries) {
      map.set(entry.document.folder, (map.get(entry.document.folder) ?? 0) + 1);
    }
    return map;
  }, [entries]);

  /** Cuántos hay en cada una de las tres cuentas. */
  const stateCounts = useMemo(() => {
    const map: Record<TallyState, number> = { soon: 0, none: 0, ok: 0 };
    for (const entry of entries) map[bucketOf(urgencyTone(entry.state))] += 1;
    return map;
  }, [entries]);

  const urgent = useMemo(
    () => entries.filter((entry) => isUrgent(entry.state)).sort(compareUrgency),
    [entries],
  );

  /**
   * Sin elección explícita se abre la primera cuenta que tenga algo, en
   * orden de urgencia: si hay algo venciéndose, es lo que se ve al entrar.
   */
  const [chosen, setChosen] = useState<View | null>(null);
  const view: View = chosen ?? {
    mode: "state",
    state: TALLY_STATES.find((s) => stateCounts[s] > 0) ?? "soon",
  };

  const visible = useMemo(() => {
    const list =
      view.mode === "folder"
        ? entries.filter((e) => e.document.folder === view.folder)
        : entries.filter((e) => bucketOf(urgencyTone(e.state)) === view.state);
    return list.sort(compareUrgency);
  }, [entries, view]);

  const documentCopy = useMemo<VaultDocumentCopy>(
    () => ({
      list: copy.list,
      expiry: copy.expiry,
      folders: copy.folders,
      fields: {
        nameLabel: copy.scanner.nameLabel,
        namePlaceholder: copy.scanner.namePlaceholder,
        folderLabel: copy.scanner.folderLabel,
        expiryLabel: copy.scanner.expiryEditLabel,
        expiryHelp: copy.scanner.expiryEditHelp,
      },
      common,
    }),
    [copy, common],
  );

  const lowOnSpace = isLowOnSpace(storage);
  const isEmpty = documents !== null && documents.length === 0;

  /** «12 documentos en 5 carpetas» — el dato de estado bajo el titular. */
  const usedFolders = VAULT_FOLDERS.filter((f) => (folderCounts.get(f) ?? 0) > 0).length;
  const summarySub = fill(copy.summary.inFolders, {
    docs: documentCountText(entries.length, copy.list),
    folders:
      usedFolders === 1
        ? copy.summary.folderCountOne
        : fill(copy.summary.folderCount, { n: usedFolders }),
  });

  // ── Buscar ──
  // Buscar y navegar son dos modos, no uno con adornos: mientras hay texto
  // escrito o un filtro puesto, el resumen se aparta y se enseña una lista
  // plana con TODO lo que coincide, venga de donde venga. Quien escribe
  // "pasaporte" no quiere que le contesten "en esa carpeta no está".
  //
  // El campo vive detrás del icono de la cabecera, como en el diseño: en una
  // bóveda de doce papeles se busca de vez en cuando, y un campo permanente
  // ocupa la altura que necesita el resumen.
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VaultFilter>("all");
  const searching = query.trim().length > 0 || filter !== "all";
  const searchRef = useRef<HTMLInputElement>(null);

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

  function toggleSearch() {
    setSearchOpen((open) => {
      if (open) {
        setQuery("");
        setFilter("all");
        return false;
      }
      // En el fotograma siguiente, cuando el campo ya existe.
      requestAnimationFrame(() => searchRef.current?.focus());
      return true;
    });
  }

  /** Salta del aviso de vencimiento a la tarjeta real, en su carpeta. */
  const listRef = useRef<HTMLElement>(null);
  function irADocumento(folder: VaultFolderId) {
    setChosen({ mode: "folder", folder });
    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const tallyItems: readonly TallyItem[] = TALLY_STATES.map((state) => ({
    key: state,
    count: stateCounts[state],
    label: copy.states[state].tally,
    tone: TALLY_TONE[state],
  }));

  /** El rótulo y la nota de lo que se está mirando ahora mismo. */
  const listTitle =
    view.mode === "folder"
      ? copy.folders[view.folder].name
      : copy.states[view.state].title;

  const listNote =
    view.mode === "folder"
      ? copy.folders[view.folder].hint
      : view.state === "soon"
        ? copy.expiry.alertPromise
        : copy.states[view.state].note;

  const listNoteIcon =
    view.mode === "folder" ? null : view.state === "soon" ? Bell : view.state === "none" ? CalendarOff : CheckCircle2;

  const listNoteIconName =
    view.mode === "folder"
      ? null
      : view.state === "soon"
        ? "bell"
        : view.state === "none"
          ? "calendar-off"
          : "check-circle-2";

  return (
    <article className="mx-auto w-full max-w-4xl">
      {/* La lupa va arriba del todo, al lado de la marca, como en el
          diseño — no en una segunda fila propia. */}
      {!isEmpty ? (
        <HeaderAction>
          <button
            type="button"
            onClick={toggleSearch}
            aria-expanded={searchOpen}
            aria-label={searchOpen ? copy.search.clear : copy.search.label}
            className="ax-iconbtn"
          >
            {searchOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Glyph name="search" icon={Search} size={21} />
            )}
          </button>
        </HeaderAction>
      ) : null}

      <ScreenHeader
        overline={copy.summary.overline}
        title={copy.summary.title}
        sub={isEmpty ? undefined : summarySub}
      />

      {/* ── Buscar ── */}
      {searchOpen && !isEmpty ? (
        <div className="mt-4">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted"
            />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={copy.search.label}
              placeholder={copy.search.placeholder}
              // `min-h-12` para que el dedo acierte, y 16px de tipo para que
              // Safari en iPhone no haga zoom al enfocar el campo.
              //
              // Se oculta la equis nativa de `type="search"`: el navegador
              // dibuja la suya y salían dos, una al lado de la otra.
              className={cn(
                "min-h-12 w-full rounded-md border border-line bg-surface pl-11 pr-4 text-[1rem] text-ink",
                "placeholder:text-muted focus-visible:border-teal-deep focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-deep",
                "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
              )}
            />
          </div>

          {/* Filtros por ESTADO, no por carpeta. */}
          <div role="group" aria-label={copy.expiry.label} className="filterbar mt-2">
            {FILTERS.map((option) => {
              const count = filterCounts[option];
              // Un filtro que no puede devolver nada no se ofrece.
              if (option !== "all" && count === 0) return null;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={option === filter}
                  onClick={() => setFilter(option)}
                  className="filterchip"
                >
                  {copy.search.filters[option]}
                  {option !== "all" ? (
                    <span className="filtercount">{count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {documents === null ? (
        <div aria-busy="true" className="mt-6 space-y-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : searching ? (
        /* ── Resultados ──
           Mientras se busca, el resumen se aparta: sobra el mapa cuando ya
           se ha dicho lo que se busca. */
        <section aria-labelledby="boveda-resultados" className="mt-5">
          <h2 id="boveda-resultados" className="text-body font-semibold text-ink">
            {results.length === 1
              ? copy.search.resultCountOne
              : fill(copy.search.resultCount, { n: results.length })}
          </h2>

          {/* El empujón que tapa el agujero: sin fecha no hay aviso, y el
              aviso es justo por lo que se paga el módulo. */}
          {filter === "noExpiry" && results.length > 0 ? (
            <KitNotice iconName="triangle-alert" icon={TriangleAlert} className="mt-3">
              {copy.search.noExpiryNudge}
            </KitNotice>
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
           Sin documentos no hay resumen que enseñar, ni carpetas: serían
           cinco controles que no llevan a ningún sitio. */
        <>
          <EmptyState
            icon={<FolderLock />}
            title={copy.empty.title}
            description={copy.empty.body}
            className="mt-6 rounded-xl border border-dashed border-line bg-surface"
          />
          {onScan ? (
            <div className="mt-4">
              <KitButton iconName="scan-line" icon={ScanLine} onClick={onScan} wide>
                {copy.empty.cta}
              </KitButton>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {/* ── El resumen, que además es el filtro ──
              Lo primero de la pantalla. Dice el estado entero de la bóveda
              antes de que haga falta desplazarse. */}
          <Tally
            className="mt-4"
            items={tallyItems}
            selected={view.mode === "state" ? view.state : ""}
            onSelect={(key) => setChosen({ mode: "state", state: key as TallyState })}
            groupLabel={copy.summary.groupLabel}
          />

          {/* ── Lo que se está mirando ── */}
          <section ref={listRef} aria-labelledby="boveda-lista" className="scroll-mt-4">
            <SectionLabel as="h2" id="boveda-lista">
              {listTitle}
            </SectionLabel>

            {visible.length > 0 ? (
              <DocumentList
                entries={visible}
                copy={documentCopy}
                showFolder={view.mode === "state"}
                onChanged={refresh}
              />
            ) : (
              <p className="rounded-lg border border-dashed border-line p-6 text-center text-body text-muted">
                {view.mode === "folder"
                  ? copy.empty.body
                  : copy.states[view.state].empty}
              </p>
            )}

            {/* La nota va DESPUÉS de la lista, no antes: primero los papeles,
                luego la explicación de qué pasa con ellos. */}
            {listNote ? (
              <KitNotice
                className="mt-4"
                iconName={listNoteIconName ?? undefined}
                icon={listNoteIcon ?? undefined}
              >
                {listNote}
              </KitNotice>
            ) : null}
          </section>

          {onScan ? (
            <div className="mt-5">
              <KitButton iconName="scan-line" icon={ScanLine} onClick={onScan} wide>
                {copy.empty.cta}
              </KitButton>
            </div>
          ) : null}

          {/* ── Lo que se te vence, si es que hay algo ──
              Un aviso, no una segunda copia del archivo: una línea por
              documento con lo único que importa aquí —cuánto le queda— y un
              toque que baja a su tarjeta. Sólo cuando no se está mirando ya
              esa misma cuenta. */}
          {urgent.length > 0 && !(view.mode === "state" && view.state === "soon") ? (
            <section aria-labelledby="boveda-vencimientos">
              <SectionLabel as="h2" id="boveda-vencimientos">
                {copy.sections.dueSoon}
              </SectionLabel>
              <ListGroup as="ul">
                {urgent.map(({ document, state }) => (
                  <li key={document.id}>
                    <ListRow
                      icon={FileText}
                      iconName="file-text"
                      title={document.name}
                      meta={
                        <span className={expiryToneClass(expiryTone(state))}>
                          {expiryText(state, copy.expiry)}
                        </span>
                      }
                      /* La insignia dice DÓNDE está, no cómo de urgente es:
                         eso ya lo dice la línea de arriba, con su color y
                         su texto. Pintada con el tono de urgencia, un
                         ámbar que grita «corre» acababa encima de las
                         palabras «Manejo y vehículo». */
                      badge={
                        <KitBadge tone="none">
                          {copy.folders[document.folder].name}
                        </KitBadge>
                      }
                      trail={
                        <ChevronRight
                          aria-hidden="true"
                          className="size-5 shrink-0 text-disabled"
                        />
                      }
                      onClick={() => irADocumento(document.folder)}
                    />
                  </li>
                ))}
              </ListGroup>
            </section>
          ) : null}

          {/* ── Las cinco carpetas ──
              Bajadas del encabezado a su sitio: aquí la pregunta ya no es
              «¿tengo algo encima?» sino «¿dónde metí aquello?». Una lista,
              no una rejilla de fichas: los nombres en español son largos
              («Estatus migratorio», «Vivienda y estudios») y en una ficha
              de media columna se parten en tres líneas. */}
          <section aria-labelledby="boveda-carpetas">
            <SectionLabel as="h2" id="boveda-carpetas">
              {copy.sections.folders}
            </SectionLabel>
            <ListGroup as="ul">
              {VAULT_FOLDERS.map((folder) => {
                const count = folderCounts.get(folder) ?? 0;
                return (
                  <li key={folder}>
                    <ListRow
                      icon={FOLDER_ICONS[folder]}
                      iconName={FOLDER_ICON_NAMES[folder]}
                      title={copy.folders[folder].name}
                      meta={documentCountText(count, copy.list)}
                      trail={
                        <ChevronRight
                          aria-hidden="true"
                          className="size-5 shrink-0 text-disabled"
                        />
                      }
                      onClick={() => irADocumento(folder)}
                    />
                  </li>
                );
              })}
            </ListGroup>
          </section>

          {/* ── Espacio en el teléfono: sólo cuando aprieta ── */}
          {lowOnSpace && storage ? (
            <section aria-labelledby="boveda-espacio" className="mt-6">
              <div className="ax-card card-highlight">
                <h2
                  id="boveda-espacio"
                  className="flex items-center gap-2 font-heading text-h3 text-ink"
                >
                  <Glyph name="hard-drive" icon={HardDrive} className="shrink-0" />
                  {copy.storage.title}
                </h2>
                <p className="mt-1.5 text-body text-ink">
                  {fill(copy.storage.used, {
                    used: formatBytes(storage.used, lang),
                    total: formatBytes(storage.quota, lang),
                  })}
                </p>
                <p className="mt-1 text-body text-ink">{copy.storage.warning}</p>
              </div>
            </section>
          ) : null}
        </>
      )}

      {/* ── Privacidad: el argumento, no el descargo ──
          Abierta cuando la bóveda está vacía —es entonces cuando la persona
          decide si se fía— y plegada en cuanto hay documentos, para que no
          se interponga entre ella y sus papeles cada vez que entra.
          `<details>` lo resuelve sin estado y funciona aunque el JavaScript
          no cargue. */}
      <details
        open={isEmpty}
        className="group ax-card card-accent mt-8 overflow-hidden !p-0"
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

      {/* ── Consulta guiada de trámites oficiales ── */}
      <TrackerSection
        copy={copy.tracker}
        common={common}
        headingId="boveda-tramites"
        className="mt-8"
      />
    </article>
  );
}
