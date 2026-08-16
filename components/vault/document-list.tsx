"use client";

/**
 * BÓVEDA · LISTA DE DOCUMENTOS.
 *
 * Una lista de verdad (`<ul>`), no un montón de divs: el lector de pantalla
 * anuncia cuántos documentos hay antes de recorrerlos, que es justo lo que
 * necesita quien no ve la pantalla.
 *
 * La usan las tres zonas que enseñan papeles —la carpeta abierta, la
 * búsqueda y «lo que más ocupa»—, y todas dan la misma tarjeta: el
 * documento se ve igual venga de donde venga.
 */

import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/types";
import type { VaultDocument } from "@/lib/vault/types";
import { DocumentCard } from "./document-card";
import { type VaultDocumentCopy, type VaultEntry } from "./vault-format";

export type DocumentListProps = {
  entries: readonly VaultEntry[];
  copy: VaultDocumentCopy;
  lang: Lang;
  onOpenDetail?: (doc: VaultDocument) => void;
  onChanged: () => void;
  className?: string;
};

export function DocumentList({
  entries,
  copy,
  lang,
  onOpenDetail,
  onChanged,
  className,
}: DocumentListProps) {
  return (
    <ul className={cn("space-y-3", className)}>
      {entries.map(({ document: doc, state }) => (
        <li key={doc.id}>
          <DocumentCard
            doc={doc}
            state={state}
            copy={copy}
            lang={lang}
            onOpenDetail={onOpenDetail}
            onChanged={onChanged}
          />
        </li>
      ))}
    </ul>
  );
}
