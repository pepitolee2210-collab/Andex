"use client";

/**
 * BÓVEDA · LISTA DE DOCUMENTOS.
 *
 * Una lista de verdad (`<ul>`), no un montón de divs: el lector de pantalla
 * anuncia cuántos documentos hay antes de recorrerlos, que es justo lo que
 * necesita quien no ve la pantalla.
 *
 * La usan las dos zonas de la pantalla —la carpeta abierta y "se te vence
 * pronto"—, y por eso puede enseñar la carpeta de cada documento: en la lista
 * de urgencias se mezclan carpetas y saber dónde está cada papel importa.
 */

import { cn } from "@/lib/utils";
import { DocumentCard } from "./document-card";
import { type VaultDocumentCopy, type VaultEntry } from "./vault-format";

export type DocumentListProps = {
  entries: readonly VaultEntry[];
  copy: VaultDocumentCopy;
  /** Añade la carpeta al pie de cada documento. */
  showFolder?: boolean;
  onChanged: () => void;
  className?: string;
};

export function DocumentList({
  entries,
  copy,
  showFolder = false,
  onChanged,
  className,
}: DocumentListProps) {
  return (
    <ul className={cn("space-y-2", className)}>
      {entries.map(({ document: doc, state }) => (
        <li key={doc.id}>
          <DocumentCard
            doc={doc}
            state={state}
            copy={copy}
            folderLabel={showFolder ? copy.folders[doc.folder].name : undefined}
            onChanged={onChanged}
          />
        </li>
      ))}
    </ul>
  );
}
