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

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Clock,
  Eye,
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
import { sanitizeFreeText } from "@/lib/utils";
import {
  expiryText,
  expiryTone,
  pageCountText,
  urgencyTone,
  urgencyToneVar,
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
    <article className="doccard">
      {/* La cabecera entera abre el documento. Antes «Abrir» era un botón
          más entre cuatro, del mismo tamaño que «Eliminar»: la acción que
          se hace el 95% de las veces valía lo mismo que la irreversible.
          Ahora abrir es toda la tarjeta, y las cuatro siguen abajo para
          quien las busque. */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={busy && dialog === null}
        className="dochead"
      >
        <span className="rowicon tone-quiet">
          <FileText aria-hidden="true" data-icon="file-text" className="size-5" />
        </span>

        <span className="docmain">
          {/* Se envuelve, no se recorta: el apellido que se perdería con
              puntos suspensivos es justo el que distingue el acta de un
              hijo de la del otro. */}
          <span className="docname">{doc.name}</span>
          <span className="docmeta">{meta}</span>
          <span className="docstate" style={{ color: urgencyToneVar(urgencyTone(state)) }}>
            {ToneIcon ? (
              <ToneIcon aria-hidden="true" className="size-4 shrink-0" />
            ) : null}
            <span className="min-w-0">{stateText}</span>
          </span>
        </span>
      </button>

      {/* Las cuatro acciones, a la vista y repartidas a partes iguales.
          Estaban detrás de tres iconos sin texto: un icono de lápiz no
          dice «cambiar nombre» a quien no lo ha visto antes. */}
      <div className="docactions">
        <button type="button" onClick={handleOpen}>
          <Eye aria-hidden="true" className="size-4 shrink-0" />
          {copy.list.open}
        </button>
        <button
          type="button"
          aria-label={copy.list.rename}
          onClick={() => openDialog("rename")}
        >
          <Pencil aria-hidden="true" className="size-4 shrink-0" />
          {copy.list.renameShort}
        </button>
        <button
          type="button"
          aria-label={copy.list.move}
          onClick={() => openDialog("move")}
        >
          <FolderInput aria-hidden="true" className="size-4 shrink-0" />
          {copy.list.moveShort}
        </button>
        <button
          type="button"
          className="danger"
          aria-label={copy.list.delete}
          onClick={() => openDialog("delete")}
        >
          <Trash2 aria-hidden="true" className="size-4 shrink-0" />
          {copy.list.deleteShort}
        </button>
      </div>

      {error && dialog === null ? (
        <p role="alert" className="px-4 pb-3 text-caption text-danger">
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
/* `IconAction` vivía aquí: tres botones de icono sin texto para cambiar
   nombre, mover y borrar. Se ha ido con el rediseño — ahora las cuatro
   acciones llevan su palabra escrita, que es lo que hace falta cuando el
   lápiz y la carpeta-con-flecha no significan nada de antemano. */
