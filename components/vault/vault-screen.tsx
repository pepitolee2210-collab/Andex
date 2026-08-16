"use client";

/**
 * BÓVEDA DIGITAL — la pantalla del módulo 1 (§5-M1).
 *
 * ── Qué se ve al entrar ──
 *
 * Tres cuentas —vencen pronto · sin fecha · en regla— que dicen el estado
 * entero de la bóveda en una línea y **además son el filtro**. No es una
 * lista de doce papeles sin orden: lo primero que se quiere saber al abrir
 * la bóveda con prisa no es «en qué carpeta lo metí» sino «¿tengo algo
 * encima?».
 *
 * Debajo, los documentos de la cuenta elegida; después el botón de escanear
 * y las carpetas, para cuando la pregunta sí es dónde está algo. De las
 * cinco carpetas se enseñan tres y un enlace abre el resto: cinco filas
 * empujaban la consulta de trámites fuera de la pantalla.
 *
 * ── Las cuatro pantallas que viven aquí dentro ──
 *
 * Esta pantalla es también la de sus estados, porque son la experiencia
 * habitual y no el caso raro: la app se usa con datos contados y en un
 * teléfono lleno.
 *
 *  · **Descifrando** — esqueletos con el tinte de la superficie y ni una
 *    barra de progreso: no sabemos cuánto falta, y una barra inventada es
 *    el registro visual de quien les mintió.
 *  · **Bóveda vacía** — una sola acción y la nota de cifrado, que es la
 *    pregunta real de ese momento.
 *  · **Sin conexión** — el reparto entre lo que sigue funcionando (todo lo
 *    que vive en el teléfono) y lo que necesita red.
 *  · **Sin espacio** — cuánto queda, qué pasa cuando se acabe y QUÉ borrar.
 *
 * Y dos que se van a su propio archivo: la carpeta abierta y el detalle de
 * un documento.
 *
 * ── Lo que NO cambió ──
 *
 * Los documentos siguen sin salir del dispositivo: se leen de IndexedDB
 * cifrado (`lib/vault/storage`) ya en el navegador. Por eso todo esto es
 * cliente y el servidor sólo resuelve el idioma y el texto.
 *
 * La tarjeta de privacidad se queda aunque el diseño no la dibuje en la
 * pantalla llena. No es decoración: es el argumento que hace que alguien se
 * atreva a fotografiar su pasaporte, y dice su límite real en la misma
 * frase. Este público ya oyó «nivel bancario» de quien lo estafó.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CalendarOff,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  HardDrive,
  House,
  IdCard,
  Landmark,
  Lock,
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
import {
  FolderGrid,
  Glyph,
  HeaderAction,
  KitBadge,
  KitButton,
  KitNotice,
  ListGroup,
  ListRow,
  ScreenHeader,
  SectionLabel,
  StatePanel,
  Tally,
  type TallyItem,
} from "@/components/ui/kit";
import { DocumentDetail } from "./document-detail";
import { DocumentList } from "./document-list";
import { OfflineScreen } from "./offline-screen";
import { TrackerSection } from "./tracker/tracker-section";
import {
  biggestDocuments,
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
  percentFree,
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
  immigration: Landmark,
  driving: Car,
  taxes: Receipt,
  housing: House,
};

/** El nombre Lucide de cada carpeta: es lo que activa su gesto en el CSS. */
const FOLDER_ICON_NAMES: Record<VaultFolderId, string> = {
  identity: "id-card",
  immigration: "landmark",
  driving: "car",
  taxes: "receipt",
  housing: "house",
};

/**
 * Cuántas carpetas se enseñan antes del enlace «Ver las 5».
 *
 * Con las cinco, la consulta de trámites oficiales —que es la sección que
 * más gente busca— se iba entera por debajo del pliegue.
 */
const FOLDERS_PREVIEW = 3;

/** Cuántos documentos pesados se enseñan cuando el teléfono se llena. */
const BIGGEST_SHOWN = 3;

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

  // ── Sin conexión ────────────────────────────────────────
  // `navigator.onLine` no se puede leer en el render: en el servidor no
  // existe, y el HTML saldría distinto al del cliente. Se resuelve al
  // montar y se sigue con los dos eventos del navegador.
  const [online, setOnline] = useState(true);
  /** Quien ya vio el reparto y quiere sus papeles, pasa. */
  const [offlineSeen, setOfflineSeen] = useState(false);

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // Al volver la señal el aviso se rearma: la próxima caída se vuelve a ver.
  useEffect(() => {
    if (online) setOfflineSeen(false);
  }, [online]);

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

  /** Cuántos hay venciéndose en cada carpeta. Es lo que pinta su insignia. */
  const folderUrgent = useMemo(() => {
    const map = new Map<VaultFolderId, number>();
    for (const entry of entries) {
      if (!isUrgent(entry.state)) continue;
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

  // ── El documento abierto ──
  // Se guarda el id, no el documento: tras renombrarlo o moverlo, la lista
  // se recarga y el objeto viejo quedaría congelado con el nombre anterior.
  const [openId, setOpenId] = useState<string | null>(null);
  const openEntry = entries.find((entry) => entry.document.id === openId) ?? null;

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

  /** Las cinco carpetas o sólo las tres primeras. */
  const [allFolders, setAllFolders] = useState(false);

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

  const tallyItems: readonly TallyItem[] = TALLY_STATES.map((state) => ({
    key: state,
    count: stateCounts[state],
    label: copy.states[state].tally,
    tone: TALLY_TONE[state],
  }));

  /** El galón de la derecha, el mismo en todas las filas que llevan dentro. */
  const trail = <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-disabled" />;

  /** Las cinco carpetas para la rejilla de la pantalla de carpeta. */
  const folderCards = VAULT_FOLDERS.map((folder) => ({
    id: folder,
    name: copy.folders[folder].name,
    count: documentCountText(folderCounts.get(folder) ?? 0, copy.list),
    iconName: FOLDER_ICON_NAMES[folder],
    icon: FOLDER_ICONS[folder],
  }));

  const scanButton = onScan ? (
    <KitButton iconName="scan-line" icon={ScanLine} onClick={onScan} wide>
      {copy.empty.cta}
    </KitButton>
  ) : null;

  const privacyCard = (
    <PrivacyCard copy={copy.privacy} open={isEmpty} className={isEmpty ? "mt-4" : "mt-8"} />
  );

  // ═══════════════════════════════════════════════════════
  // DETALLE DEL DOCUMENTO
  // ═══════════════════════════════════════════════════════
  if (openEntry) {
    return (
      <DocumentDetail
        doc={openEntry.document}
        state={openEntry.state}
        copy={documentCopy}
        detail={copy.detail}
        sections={copy.sections}
        alertPromise={copy.expiry.alertPromise}
        backLabel={common.back}
        lang={lang}
        onBack={() => setOpenId(null)}
        onChanged={refresh}
      />
    );
  }

  // ═══════════════════════════════════════════════════════
  // SIN CONEXIÓN
  // ═══════════════════════════════════════════════════════
  if (!online && !offlineSeen) {
    return (
      <OfflineScreen
        copy={copy.offline}
        overline={copy.summary.overline}
        title={copy.summary.title}
        sections={copy.sections}
        documentCount={entries.length}
        onScan={onScan}
        onOpenVault={() => setOfflineSeen(true)}
      />
    );
  }

  // ═══════════════════════════════════════════════════════
  // CARPETA — una de las cinco, abierta
  // ═══════════════════════════════════════════════════════
  if (view.mode === "folder") {
    const folder = view.folder;
    return (
      <article className="mx-auto w-full max-w-4xl">
        <div className="navrow">
          <button type="button" onClick={() => setChosen(null)} className="navback">
            <ChevronLeft aria-hidden="true" className="size-6 shrink-0" />
            {common.back}
          </button>
        </div>

        <ScreenHeader
          overline={copy.sections.folderOverline}
          title={copy.folders[folder].name}
          sub={documentCountText(folderCounts.get(folder) ?? 0, copy.list)}
        />

        {/* Qué va en esta carpeta, en concreto. Es lo que evita que el
            permiso de trabajo acabe en «Identificación». */}
        <p className="mt-3 text-body text-muted">{copy.folders[folder].hint}</p>

        {scanButton ? <div className="mt-5">{scanButton}</div> : null}

        <div className="mt-5">
          {visible.length > 0 ? (
            <DocumentList
              entries={visible}
              copy={documentCopy}
              lang={lang}
              onOpenDetail={(doc) => setOpenId(doc.id)}
              onChanged={refresh}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-line p-6 text-center text-body text-muted">
              {copy.empty.body}
            </p>
          )}
        </div>

        {/* Las otras cuatro, para saltar sin volver atrás. */}
        <section aria-labelledby="boveda-carpetas">
          <SectionLabel as="h2" id="boveda-carpetas">
            {copy.sections.folders}
          </SectionLabel>
          <FolderGrid
            folders={folderCards}
            onOpen={(id) => setChosen({ mode: "folder", folder: id as VaultFolderId })}
          />
        </section>

        {privacyCard}
      </article>
    );
  }

  // ═══════════════════════════════════════════════════════
  // LA BÓVEDA
  // ═══════════════════════════════════════════════════════
  const listTitle = copy.states[view.state].title;
  const listNote =
    view.state === "soon" ? copy.expiry.alertPromise : copy.states[view.state].note;
  const listNoteIcon =
    view.state === "soon" ? Bell : view.state === "none" ? CalendarOff : CheckCircle2;
  const listNoteIconName =
    view.state === "soon" ? "bell" : view.state === "none" ? "calendar-off" : "check-circle-2";

  const shownFolders = allFolders ? VAULT_FOLDERS : VAULT_FOLDERS.slice(0, FOLDERS_PREVIEW);

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

      {/* Mientras se descifra no hay cuenta que dar: «0 documentos en 0
          carpetas» sería mentira, y justo la que más asusta. */}
      <ScreenHeader
        overline={copy.summary.overline}
        title={copy.summary.title}
        sub={
          documents === null ? undefined : isEmpty ? copy.subtitle : summarySub
        }
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
        /* ── DESCIFRANDO ──
           Se dice qué está pasando y cuánto tarda. Los esqueletos llevan el
           tinte de la superficie, no un gris ajeno, y no hay barra de
           progreso: no sabemos cuánto falta. */
        <>
          {onScan ? (
            <div className="mt-5">
              <KitButton iconName="scan-line" icon={ScanLine} disabled wide>
                {copy.empty.cta}
              </KitButton>
            </div>
          ) : null}
          <KitNotice iconName="lock" icon={Lock} className="mt-4">
            {copy.loading.decrypting}
          </KitNotice>
          <div aria-busy="true" className="mt-6 space-y-3">
            {[82, 62, 74].map((width, index) => (
              <div key={width} className="ax-card flex gap-3.5">
                <span aria-hidden="true" className="ax-skeleton size-9 shrink-0" />
                <span className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <span
                    aria-hidden="true"
                    className="ax-skeleton block h-4"
                    style={{ width: `${width}%` }}
                  />
                  <span aria-hidden="true" className="ax-skeleton block h-4 w-1/3" />
                  <span
                    aria-hidden="true"
                    className="ax-skeleton block h-4"
                    style={{ width: index === 1 ? "62%" : "50%" }}
                  />
                </span>
              </div>
            ))}
          </div>
        </>
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
              lang={lang}
              onOpenDetail={(doc) => setOpenId(doc.id)}
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
        /* ── BÓVEDA VACÍA ──
           Una sola acción, y encima de todo. Después la nota de cifrado
           abierta: en el primer uso la pregunta real no es qué hacer, es a
           dónde va la foto del pasaporte. */
        <>
          {scanButton ? <div className="mt-5">{scanButton}</div> : null}
          {privacyCard}
          <StatePanel
            iconName="folder-open"
            icon={FolderOpen}
            tone="quiet"
            title={copy.empty.title}
            body={copy.empty.body}
            className="mt-10"
          />
        </>
      ) : (
        <>
          {/* ── El resumen, que además es el filtro ──
              Lo primero de la pantalla. Dice el estado entero de la bóveda
              antes de que haga falta desplazarse. */}
          <Tally
            className="mt-4"
            items={tallyItems}
            selected={view.state}
            onSelect={(key) => setChosen({ mode: "state", state: key as TallyState })}
            groupLabel={copy.summary.groupLabel}
          />

          {/* ── Lo que se está mirando ── */}
          <section aria-labelledby="boveda-lista" className="scroll-mt-4">
            <SectionLabel as="h2" id="boveda-lista">
              {listTitle}
            </SectionLabel>

            {visible.length > 0 ? (
              <DocumentList
                entries={visible}
                copy={documentCopy}
                lang={lang}
                onOpenDetail={(doc) => setOpenId(doc.id)}
                onChanged={refresh}
              />
            ) : (
              <p className="rounded-lg border border-dashed border-line p-6 text-center text-body text-muted">
                {copy.states[view.state].empty}
              </p>
            )}

            {/* La nota va DESPUÉS de la lista, no antes: primero los papeles,
                luego la explicación de qué pasa con ellos. */}
            {listNote ? (
              <KitNotice className="mt-4" iconName={listNoteIconName} icon={listNoteIcon}>
                {listNote}
              </KitNotice>
            ) : null}
          </section>

          {scanButton ? <div className="mt-5">{scanButton}</div> : null}

          {/* ── Lo que se te vence, si es que hay algo ──
              Un aviso, no una segunda copia del archivo: una línea por
              documento con lo único que importa aquí —cuánto le queda— y un
              toque que lleva a su detalle. Sólo cuando no se está mirando ya
              esa misma cuenta. */}
          {urgent.length > 0 && view.state !== "soon" ? (
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
                      trail={trail}
                      onClick={() => setOpenId(document.id)}
                    />
                  </li>
                ))}
              </ListGroup>
            </section>
          ) : null}

          {/* ── Las carpetas ──
              Tres, y el enlace abre las cinco. Una lista y no una rejilla de
              fichas: los nombres en español son largos («Estatus
              migratorio», «Vivienda y estudios») y en una ficha de media
              columna se parten en tres líneas.

              La insignia dice cuántos papeles de esa carpeta se están
              venciendo — el número solo sería color sin significado, así que
              lleva su texto para quien no ve la pantalla. */}
          <section aria-labelledby="boveda-carpetas">
            <SectionLabel
              as="h2"
              id="boveda-carpetas"
              action={
                allFolders ? undefined : (
                  <button type="button" onClick={() => setAllFolders(true)}>
                    {fill(copy.sections.seeAll, { n: VAULT_FOLDERS.length })}
                  </button>
                )
              }
            >
              {copy.sections.folders}
            </SectionLabel>
            <ListGroup as="ul">
              {shownFolders.map((folder) => {
                const count = folderCounts.get(folder) ?? 0;
                const due = folderUrgent.get(folder) ?? 0;
                return (
                  <li key={folder}>
                    <ListRow
                      icon={FOLDER_ICONS[folder]}
                      iconName={FOLDER_ICON_NAMES[folder]}
                      title={copy.folders[folder].name}
                      meta={documentCountText(count, copy.list)}
                      badge={
                        due > 0 ? (
                          <KitBadge tone="soon">
                            {due}
                            <span className="sr-only"> {copy.states.soon.tally}</span>
                          </KitBadge>
                        ) : undefined
                      }
                      trail={trail}
                      onClick={() => setChosen({ mode: "folder", folder })}
                    />
                  </li>
                );
              })}
            </ListGroup>
          </section>

          {/* ── SIN ESPACIO ──
              Sólo cuando aprieta, y entonces dice las tres cosas que hacen
              falta: cuánto queda, qué deja de funcionar y QUÉ borrar. Sin
              esa última lista, el aviso deja a la persona buscando a ciegas
              entre papeles que no se puede permitir perder. */}
          {lowOnSpace && storage ? (
            <section aria-labelledby="boveda-espacio">
              <div className="ax-card card-highlight mt-8">
                <h2
                  id="boveda-espacio"
                  className="flex items-center gap-2.5 text-label"
                  style={{ color: "var(--amber-700)" }}
                >
                  <Glyph
                    name="hard-drive"
                    icon={HardDrive}
                    size={18}
                    strokeWidth={2}
                    className="shrink-0"
                  />
                  {copy.storage.title}
                </h2>
                <p className="mt-3 text-body" style={{ color: "var(--amber-700)" }}>
                  {fill(copy.storage.free, { n: percentFree(storage) })}
                </p>
                {/* Decorativa: la frase de arriba ya dice el número. */}
                <div
                  aria-hidden="true"
                  className="mt-4 h-2 overflow-hidden rounded-full"
                  style={{ background: "var(--amber-200)" }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${100 - percentFree(storage)}%`,
                      background: "var(--amber-600)",
                    }}
                  />
                </div>
                <p className="mt-3 text-caption" style={{ color: "var(--amber-700)" }}>
                  {fill(copy.storage.used, {
                    used: formatBytes(storage.used, lang),
                    total: formatBytes(storage.quota, lang),
                  })}
                </p>
              </div>

              <SectionLabel as="h3">{copy.sections.biggest}</SectionLabel>
              <DocumentList
                entries={biggestDocuments(entries, BIGGEST_SHOWN)}
                copy={documentCopy}
                lang={lang}
                onOpenDetail={(doc) => setOpenId(doc.id)}
                onChanged={refresh}
              />
            </section>
          ) : null}

          {privacyCard}
        </>
      )}

      {/* ── Consulta guiada de trámites oficiales ──
          No en el primer uso: un estado vacío ofrece UNA acción, y cuatro
          trámites del gobierno debajo la convierten en cinco. */}
      {isEmpty ? null : (
        <TrackerSection
          copy={copy.tracker}
          common={common}
          headingId="boveda-tramites"
          className="mt-8"
        />
      )}
    </article>
  );
}

/* ─────────────────────────────────────────────────────────
   La tarjeta de privacidad

   Abierta cuando la bóveda está vacía —es entonces cuando la persona decide
   si se fía— y plegada en cuanto hay documentos, para que no se interponga
   entre ella y sus papeles cada vez que entra. `<details>` lo resuelve sin
   estado y funciona aunque el JavaScript no cargue.
   ───────────────────────────────────────────────────────── */

function PrivacyCard({
  copy,
  open,
  className,
}: {
  copy: BovedaDict["privacy"];
  open: boolean;
  className?: string;
}) {
  return (
    <details open={open} className={cn("group ax-card card-accent overflow-hidden !p-0", className)}>
      <summary
        className={cn(
          "flex min-h-12 cursor-pointer list-none items-center gap-2 p-4 text-left",
          "[&::-webkit-details-marker]:hidden",
          "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-deep",
        )}
      >
        <span className="rowicon tone-accent">
          <Glyph name="lock" icon={Lock} size={19} />
        </span>
        <span className="min-w-0 flex-1 text-body font-semibold text-ink">
          {copy.headline}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-teal-deep transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="px-4 pb-4">
        <Badge variant="teal">
          <Lock aria-hidden="true" className="size-3.5" />
          {copy.badge}
        </Badge>
        <p className="mt-3 text-body text-ink">{copy.body}</p>
        {/* El límite real, con el mismo peso que la promesa. */}
        <p className="mt-3 flex items-start gap-2.5 border-t border-line pt-3 text-body text-ink">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal-deep" />
          <span className="min-w-0">{copy.caveat}</span>
        </p>
      </div>
    </details>
  );
}
