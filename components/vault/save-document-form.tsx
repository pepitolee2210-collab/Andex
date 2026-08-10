"use client";

/**
 * Guardar el documento escaneado en la bóveda.
 *
 * Es el puente entre el escáner (que produce un PDF) y el almacenamiento
 * (que lo cifra). Vive aparte de `ScannerFlow` a propósito: el escáner no
 * debe saber que existe una bóveda — así sirve igual para el modo invitado,
 * donde sólo se descarga.
 *
 * La fecha de vencimiento es el campo que más importa y el único que no se
 * puede corregir después: si se guarda vacía, ese documento jamás disparará
 * una alerta, que es todo el valor del módulo. Por eso se pide aquí, con el
 * PDF ya hecho y delante, que es el momento en que la persona todavía tiene
 * el papel en la mano.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { track } from "@/lib/analytics/track";
import { sanitizeFreeText } from "@/lib/utils";
import { VAULT_FOLDERS, type VaultFolderId } from "@/lib/vault/types";
import { requestPersistence, saveDocument } from "@/lib/vault/storage";

export type SaveDocumentCopy = {
  title: string;
  nameLabel: string;
  namePlaceholder: string;
  folderLabel: string;
  noteLabel: string;
  notePlaceholder: string;
  expiryLabel: string;
  expiryOptional: string;
  expiryPromise: string;
  save: string;
  cancel: string;
  downloadPdf: string;
  /** Nombres visibles de las carpetas, por id. */
  folders: Record<VaultFolderId, string>;
  /** Error si el guardado falla (sin espacio, modo privado). */
  failed: string;
};

export type SaveDocumentFormProps = {
  copy: SaveDocumentCopy;
  pdf: Blob;
  pageCount: number;
  /** Carpeta sugerida. La bóveda propone la que el usuario tenía abierta. */
  suggestedFolder?: VaultFolderId;
  onSaved: () => void;
  onCancel: () => void;
  onDownload: () => void;
};

export function SaveDocumentForm({
  copy,
  pdf,
  pageCount,
  suggestedFolder,
  onSaved,
  onCancel,
  onDownload,
}: SaveDocumentFormProps) {
  const [name, setName] = useState("");
  const [folder, setFolder] = useState<VaultFolderId>(
    suggestedFolder ?? "identity",
  );
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanName = sanitizeFreeText(name, 80);
  const canSave = cleanName.length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      // Se pide persistencia ANTES de escribir: sin ella, un teléfono lleno
      // puede vaciar IndexedDB sin avisar y llevarse los documentos.
      await requestPersistence();

      await saveDocument({
        folder,
        name: cleanName,
        expiresAt: expiresAt || null,
        note: sanitizeFreeText(note, 120) || null,
        pageCount,
        pdf,
      });

      track("vault_document_saved", {
        folder,
        page_count: pageCount,
        has_expiry: expiresAt !== "",
      });
      onSaved();
    } catch {
      setError(copy.failed);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <h2 className="font-heading text-h2 text-ink">{copy.title}</h2>

      <div className="mt-6 space-y-5">
        <Input
          id="vault-doc-name"
          label={copy.nameLabel}
          placeholder={copy.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoComplete="off"
        />

        <Select
          id="vault-doc-folder"
          label={copy.folderLabel}
          value={folder}
          onChange={(e) => setFolder(e.target.value as VaultFolderId)}
        >
          {VAULT_FOLDERS.map((id) => (
            <option key={id} value={id}>
              {copy.folders[id]}
            </option>
          ))}
        </Select>

        <div>
          <Input
            id="vault-doc-expiry"
            type="date"
            label={copy.expiryLabel}
            help={copy.expiryOptional}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          {/* La promesa que justifica pedir la fecha. Se muestra siempre,
              no sólo cuando hay valor: es el argumento para rellenarla. */}
          <p className="mt-2 text-caption text-teal-deep">{copy.expiryPromise}</p>
        </div>

        <Input
          id="vault-doc-note"
          label={copy.noteLabel}
          placeholder={copy.notePlaceholder}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
          autoComplete="off"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-body text-danger">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-2 sm:flex-row-reverse">
        <Button onClick={handleSave} disabled={!canSave} className="sm:flex-1">
          {saving ? (
            <>
              <Loader2 aria-hidden="true" className="mr-2 inline size-4 animate-spin" />
              {copy.save}
            </>
          ) : (
            copy.save
          )}
        </Button>
        <Button variant="secondary" onClick={onDownload}>
          {copy.downloadPdf}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          {copy.cancel}
        </Button>
      </div>
    </div>
  );
}
