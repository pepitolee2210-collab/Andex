"use client";

/**
 * BÓVEDA DIGITAL — la pantalla del módulo 1 (§5-M1).
 *
 * El orden de arriba abajo no es estético, es una jerarquía de urgencia:
 *
 *  1. **La privacidad, arriba y visible.** No es un pie de página: es el
 *     argumento que hace que alguien se atreva a subir la foto de su
 *     pasaporte. Incluye el límite real ("protege tu teléfono"), porque en
 *     seguridad prometer de más es peor que no prometer nada, y este público
 *     ya oyó "nivel bancario" de quien lo estafó.
 *  2. **Lo que se vence.** Es lo único de esta pantalla con fecha límite, así
 *     que va antes que las carpetas. Vencido primero, y dentro de cada grupo
 *     lo que vence antes.
 *  3. Las carpetas y sus documentos.
 *  4. El espacio del teléfono, **sólo cuando queda poco** (<15%): enseñarlo
 *     siempre es ruido; enseñarlo tarde es un guardado que falla sin motivo.
 *  5. La consulta guiada de trámites oficiales.
 *
 * Los documentos NO salen del dispositivo: se leen de IndexedDB cifrado
 * (`lib/vault/storage`) ya en el navegador. Por eso todo esto es cliente y el
 * servidor sólo resuelve el idioma y el texto.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Car,
  FolderLock,
  HardDrive,
  House,
  IdCard,
  Lock,
  Plane,
  Receipt,
  ShieldCheck,
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
  fill,
  formatBytes,
  isLowOnSpace,
  isUrgent,
  type StorageEstimate,
  type VaultCommonCopy,
  type VaultDocumentCopy,
  type VaultEntry,
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

  return (
    <article className="mx-auto w-full max-w-4xl">
      {/* ── Encabezado del módulo ── */}
      <header className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-md bg-teal-soft text-teal-deep"
        >
          <ModuleIcon slug="boveda" size={26} />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-h1 text-ink">{copy.title}</h1>
          <p className="mt-1 text-body-lg text-muted">{copy.subtitle}</p>
        </div>
      </header>

      {/* ── Privacidad: el argumento, no el descargo ── */}
      <section
        aria-labelledby="boveda-privacidad"
        className="mt-5 rounded-xl border border-line bg-teal-soft p-4 shadow-sm sm:p-5"
      >
        <Badge variant="teal">
          <Lock aria-hidden="true" className="size-3.5" />
          {copy.privacy.badge}
        </Badge>
        <h2 id="boveda-privacidad" className="mt-3 font-heading text-h2 text-ink">
          {copy.privacy.headline}
        </h2>
        <p className="mt-2 text-body text-ink">{copy.privacy.body}</p>
        {/* El límite real, con el mismo peso que la promesa. */}
        <p className="mt-3 flex items-start gap-2.5 border-t border-line pt-3 text-body text-ink">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal-deep" />
          <span className="min-w-0">{copy.privacy.caveat}</span>
        </p>
      </section>

      {documents === null ? (
        <div aria-busy="true" className="mt-6 space-y-3">
          <Skeleton variant="card" />
          <Skeleton variant="card" />
        </div>
      ) : (
        <>
          {/* ── Se te vence pronto ── */}
          {urgent.length > 0 ? (
            <section
              aria-labelledby="boveda-vencimientos"
              // Fondo alterno para que las tarjetas blancas de dentro se
              // despeguen: esta es la zona que hay que mirar primero.
              className="mt-6 rounded-xl border border-line bg-surface-alt p-4 sm:p-5"
            >
              <h2 id="boveda-vencimientos" className="font-heading text-h2 text-ink">
                {copy.expiry.label}
              </h2>
              <p className="mt-1 text-body text-muted">{copy.expiry.alertPromise}</p>
              <DocumentList
                entries={urgent}
                copy={documentCopy}
                showFolder
                onChanged={refresh}
                className="mt-4"
              />
            </section>
          ) : null}

          {isEmpty ? (
            /* ── Estado vacío ──
               Con la bóveda vacía no se enseñan las cinco carpetas: serían
               cinco controles que no llevan a ningún sitio. Vuelven en cuanto
               haya un documento, con sus pistas de qué guardar en cada una. */
            <EmptyState
              icon={<FolderLock />}
              title={copy.empty.title}
              description={copy.empty.body}
              action={onScan ? <Button onClick={onScan}>{copy.empty.cta}</Button> : undefined}
              className="mt-6 rounded-xl border border-dashed border-line bg-surface"
            />
          ) : (
            <>
              {/* ── Las cinco carpetas ──
                  Grupo de botones, no navegación: filtran lo que se ve debajo
                  y no llevan a otra pantalla, así que no añaden un landmark. */}
              <div role="group" aria-label={copy.scanner.folderLabel} className="mt-6">
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {VAULT_FOLDERS.map((folder) => {
                    const Icon = FOLDER_ICONS[folder];
                    const active = folder === activeFolder;
                    return (
                      <li key={folder}>
                        <button
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelected(folder)}
                          className={cn(
                            "flex min-h-11 w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                            active
                              ? "border-teal-deep bg-teal-soft"
                              : "border-line bg-surface shadow-sm hover:border-muted hover:bg-surface-alt",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-md",
                              active
                                ? "bg-surface text-teal-deep"
                                : "bg-surface-alt text-muted",
                            )}
                          >
                            <Icon className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-body font-medium text-ink">
                              {copy.folders[folder].name}
                            </span>
                            <span className="mt-0.5 block text-caption text-muted">
                              {copy.folders[folder].hint}
                            </span>
                            <span className="mt-1 block text-caption font-medium text-muted">
                              {documentCountText(counts.get(folder) ?? 0, copy.list)}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* ── Documentos de la carpeta abierta ── */}
              <section aria-labelledby="boveda-carpeta" className="mt-6">
                <h2 id="boveda-carpeta" className="font-heading text-h2 text-ink">
                  {copy.folders[activeFolder].name}
                </h2>
                <p className="mt-1 text-body text-muted">
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
