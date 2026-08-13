"use client";

/**
 * BÓVEDA · TARJETA DE DOCUMENTO.
 *
 * Cuatro acciones sobre un documento que sólo existe en este teléfono:
 * abrirlo, cambiarle el nombre, moverlo de carpeta y borrarlo.
 *
 * Dos decisiones que no son de estilo:
 *
 * 1. **El estado de vencimiento nunca se comunica sólo con color.** Va
 *    siempre con su texto ("Venció hace 12 días") y con un icono distinto
 *    por estado. El daltonismo es frecuente y aquí confundir "vigente" con
 *    "vencido" puede costar un permiso de trabajo.
 *
 * 2. **El object URL del PDF se revoca.** Cada apertura descifra el archivo
 *    en memoria; si la URL no se libera, el blob se queda vivo mientras dure
 *    la pestaña. Se revoca a los 60 s (antes rompe la carga del visor en
 *    Safari) y también al desmontar la tarjeta.
 *
 * Todo el texto entra por props: este componente no importa los diccionarios.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  Clock,
  FileText,
  FolderInput,
  Pencil,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { deleteDocument, readDocument, updateDocument } from "@/lib/vault/storage";
import { VAULT_FOLDERS, type ExpiryState, type VaultDocument, type VaultFolderId } from "@/lib/vault/types";
import { cn, sanitizeFreeText } from "@/lib/utils";
import {
  expiryText,
  expiryTone,
  expiryToneClass,
  pageCountText,
  type VaultDocumentCopy,
} from "./vault-format";

/** Tope del nombre. Lo mismo que sanitiza `sanitizeFreeText` por defecto. */
const NAME_MAX = 120;

/**
 * Margen antes de revocar la URL del PDF. Revocarla en el mismo tick deja la
 * pestaña nueva en blanco: el visor todavía no ha pedido los bytes.
 */
const REVOKE_DELAY_MS = 60_000;

type OpenDialog = "rename" | "move" | "delete";

export type DocumentCardProps = {
  doc: VaultDocument;
  state: ExpiryState;
  copy: VaultDocumentCopy;
  /** Nombre de la carpeta, cuando la lista mezcla varias (urgencias). */
  folderLabel?: string;
  /** Se llama tras guardar o borrar, para que la pantalla recargue. */
  onChanged: () => void;
};

export function DocumentCard({
  doc,
  state,
  copy,
  folderLabel,
  onChanged,
}: DocumentCardProps) {
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const [name, setName] = useState(doc.name);
  const [folder, setFolder] = useState<VaultFolderId>(doc.folder);
  /**
   * Fecha de vencimiento editable.
   *
   * Faltaba, y era el hueco más caro del módulo: un documento guardado sin
   * fecha NUNCA dispara un aviso —que es justo lo que se paga— y no había
   * forma de corregirlo después. Lo destapó una auditoría del propio flujo,
   * no una lectura del código.
   */
  const [expiresAt, setExpiresAt] = useState(doc.expiresAt ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** URLs de objeto vivas. Se liberan al desmontar por si el temporizador no llega. */
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.length = 0;
    };
  }, []);

  function openDialog(next: OpenDialog) {
    setError(null);
    setName(doc.name);
    setFolder(doc.folder);
    setDialog(next);
  }

  async function handleOpen() {
    setBusy(true);
    setError(null);
    try {
      const blob = await readDocument(doc.id);
      if (!blob) {
        setError(copy.common.readFailed);
        return;
      }

      const url = URL.createObjectURL(blob);
      objectUrls.current.push(url);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.click();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        objectUrls.current = objectUrls.current.filter((entry) => entry !== url);
      }, REVOKE_DELAY_MS);
    } catch {
      setError(copy.common.readFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleRename() {
    const cleaned = sanitizeFreeText(name, NAME_MAX);
    if (cleaned.length === 0) return;
    setBusy(true);
    try {
      // Vacío significa "no vence" y tiene que poder volver a serlo: un
      // acta de nacimiento no caduca, y quien se equivocó al ponerle fecha
      // necesita quitarla.
      await updateDocument(doc.id, {
        name: cleaned,
        expiresAt: expiresAt.trim() === "" ? null : expiresAt,
      });
      setDialog(null);
      onChanged();
    } catch {
      setError(copy.common.readFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleMove() {
    setBusy(true);
    try {
      await updateDocument(doc.id, { folder });
      setDialog(null);
      onChanged();
    } catch {
      setError(copy.common.readFailed);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await deleteDocument(doc.id);
      setDialog(null);
      onChanged();
    } catch {
      setError(copy.common.readFailed);
    } finally {
      setBusy(false);
    }
  }

  const tone = expiryTone(state);
  const stateText = expiryText(state, copy.expiry);
  const ToneIcon =
    state.kind === "none"
      ? null
      : tone === "danger"
        ? TriangleAlert
        : tone === "warning"
          ? Clock
          : Check;

  const meta = [pageCountText(doc.pageCount, copy.list), folderLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="rounded-lg border border-line bg-surface p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-alt text-muted"
        >
          <FileText className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          {/* `break-words`, no `truncate`: un nombre largo se envuelve; a 320px
              nada se sale y nada se esconde. */}
          <h3 className="break-words text-body font-medium text-ink">{doc.name}</h3>
          <p className="mt-0.5 text-caption text-muted">{meta}</p>
          <p
            className={cn(
              "mt-1.5 flex items-center gap-1.5",
              // El texto ya dice el estado; el tamaño sube sólo cuando hay
              // fecha límite de por medio.
              tone === "neutral" ? "text-caption" : "text-body font-medium",
              expiryToneClass(tone),
            )}
          >
            {ToneIcon ? <ToneIcon aria-hidden="true" className="size-4 shrink-0" /> : null}
            <span className="min-w-0">{stateText}</span>
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Button variant="secondary" onClick={handleOpen} loading={busy && dialog === null}>
          {copy.list.open}
        </Button>
        <IconAction label={copy.list.rename} onClick={() => openDialog("rename")}>
          <Pencil aria-hidden="true" className="size-5" />
        </IconAction>
        <IconAction label={copy.list.move} onClick={() => openDialog("move")}>
          <FolderInput aria-hidden="true" className="size-5" />
        </IconAction>
        <IconAction label={copy.list.delete} onClick={() => openDialog("delete")}>
          <Trash2 aria-hidden="true" className="size-5" />
        </IconAction>
      </div>

      {error && dialog === null ? (
        <p role="alert" className="mt-2 text-caption text-danger">
          {error}
        </p>
      ) : null}

      {/* Un solo <dialog> por tarjeta, y sólo mientras hace falta. */}
      {dialog === "rename" ? (
        <Modal
          open
          onClose={() => setDialog(null)}
          title={copy.list.rename}
          closeLabel={copy.common.closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                {copy.common.cancel}
              </Button>
              <Button
                onClick={handleRename}
                loading={busy}
                disabled={sanitizeFreeText(name, NAME_MAX).length === 0}
              >
                {copy.common.save}
              </Button>
            </>
          }
        >
          <Input
            label={copy.fields.nameLabel}
            value={name}
            maxLength={NAME_MAX}
            placeholder={copy.fields.namePlaceholder}
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
          />
          {/* La fecha es lo que enciende el aviso. Va aquí y no en una
              pantalla aparte porque es la corrección que más falta hace, y
              esconderla detrás de otro paso la volvería invisible otra vez. */}
          <div className="mt-4">
            <Input
              type="date"
              label={copy.fields.expiryLabel}
              value={expiresAt}
              help={copy.fields.expiryHelp}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-caption text-danger">
              {error}
            </p>
          ) : null}
        </Modal>
      ) : null}

      {dialog === "move" ? (
        <Modal
          open
          onClose={() => setDialog(null)}
          title={copy.list.move}
          closeLabel={copy.common.closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                {copy.common.cancel}
              </Button>
              <Button onClick={handleMove} loading={busy}>
                {copy.common.save}
              </Button>
            </>
          }
        >
          <Select
            label={copy.fields.folderLabel}
            value={folder}
            onChange={(event) => setFolder(event.target.value as VaultFolderId)}
          >
            {VAULT_FOLDERS.map((id) => (
              <option key={id} value={id}>
                {copy.folders[id].name}
              </option>
            ))}
          </Select>
          {error ? (
            <p role="alert" className="mt-2 text-caption text-danger">
              {error}
            </p>
          ) : null}
        </Modal>
      ) : null}

      {dialog === "delete" ? (
        <Modal
          open
          onClose={() => setDialog(null)}
          title={copy.list.delete}
          closeLabel={copy.common.closeModal}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDialog(null)}>
                {copy.list.keep}
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={busy}>
                {copy.list.deleteAction}
              </Button>
            </>
          }
        >
          <p className="text-body text-ink">{doc.name}</p>
          <p className="mt-2 text-body text-muted">{copy.list.deleteConfirm}</p>
          {error ? (
            <p role="alert" className="mt-2 text-caption text-danger">
              {error}
            </p>
          ) : null}
        </Modal>
      ) : null}
    </article>
  );
}

/** Botón de icono con nombre accesible y target táctil de 44px. */
function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-line text-muted transition-colors hover:bg-surface-alt hover:text-ink"
    >
      {children}
    </button>
  );
}
