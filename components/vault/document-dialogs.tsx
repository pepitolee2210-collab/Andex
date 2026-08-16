"use client";

/**
 * BÓVEDA · LOS TRES DIÁLOGOS DE UN DOCUMENTO.
 *
 * Cambiar el nombre y la fecha, moverlo de carpeta y borrarlo. Vivían dentro
 * de `document-card.tsx`, y con la pantalla de Detalle habrían tenido que
 * existir dos veces: dos copias del mismo formulario es la forma más segura
 * de que una de las dos se quede sin el campo de fecha.
 *
 * Cada diálogo monta su propio estado y muere al cerrarse, así que no hay
 * que acordarse de limpiarlo: abrirlo otra vez lo vuelve a leer del
 * documento real.
 *
 * Todo el texto entra por props: este componente no importa los diccionarios.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { deleteDocument, updateDocument } from "@/lib/vault/storage";
import { VAULT_FOLDERS, type VaultDocument, type VaultFolderId } from "@/lib/vault/types";
import { sanitizeFreeText } from "@/lib/utils";
import type { VaultDocumentCopy } from "./vault-format";

/** Tope del nombre. Lo mismo que sanitiza `sanitizeFreeText` por defecto. */
export const NAME_MAX = 120;

export type DocumentDialogKind = "rename" | "move" | "delete";

export type DocumentDialogsProps = {
  doc: VaultDocument;
  /** Cuál está abierto. `null` no monta ninguno. */
  kind: DocumentDialogKind | null;
  copy: VaultDocumentCopy;
  onClose: () => void;
  /** Se llama tras guardar. */
  onChanged: () => void;
  /** Se llama tras borrar: la pantalla que enseñaba el documento sobra. */
  onDeleted?: () => void;
};

export function DocumentDialogs({
  doc,
  kind,
  copy,
  onClose,
  onChanged,
  onDeleted,
}: DocumentDialogsProps) {
  const [name, setName] = useState(doc.name);
  const [folder, setFolder] = useState<VaultFolderId>(doc.folder);
  /**
   * Fecha de vencimiento editable.
   *
   * Faltaba, y era el hueco más caro del módulo: un documento guardado sin
   * fecha NUNCA dispara un aviso —que es justo lo que se paga— y no había
   * forma de corregirlo después.
   */
  const [expiresAt, setExpiresAt] = useState(doc.expiresAt ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (kind === null) return null;

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
      onClose();
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
      onClose();
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
      onClose();
      onChanged();
      onDeleted?.();
    } catch {
      setError(copy.common.readFailed);
    } finally {
      setBusy(false);
    }
  }

  if (kind === "rename") {
    return (
      <Modal
        open
        onClose={onClose}
        title={copy.list.rename}
        closeLabel={copy.common.closeModal}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
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
    );
  }

  if (kind === "move") {
    return (
      <Modal
        open
        onClose={onClose}
        title={copy.list.move}
        closeLabel={copy.common.closeModal}
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
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
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={copy.list.delete}
      closeLabel={copy.common.closeModal}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
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
  );
}
