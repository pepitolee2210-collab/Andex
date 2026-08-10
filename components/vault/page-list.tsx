"use client";

/**
 * BÓVEDA · ESCÁNER — las páginas capturadas.
 *
 * El orden importa: un expediente con la página 3 delante de la 1 se
 * devuelve. Por eso reordenar se hace con BOTONES de subir y bajar, no
 * arrastrando. Arrastrar es más elegante y deja fuera a quien navega con
 * teclado, a quien usa lector de pantalla y a quien tiene poco pulso —
 * justo el usuario que más veces va a repetir este trámite.
 *
 * Borrar siempre pregunta. Volver a fotografiar el permiso de trabajo
 * cuesta diez minutos y, muchas veces, pedirle el documento a alguien.
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, FileImage, Trash2 } from "lucide-react";
import type { ScannedPage } from "@/lib/scanner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

// ─── Copy ────────────────────────────────────────────────

export type PageListCopy = {
  /** Contador de una página. Ej.: "1 página". */
  countOne: string;
  /** Contador de varias. Usa `{n}`. Ej.: "{n} páginas". */
  countOther: string;
  /** Nombre de cada página. Usa `{n}`. Ej.: "Página {n}". */
  pageLabel: string;
  /** aria-label de subir. Usa `{n}`. Ej.: "Subir la página {n}". */
  moveUpLabel: string;
  /** aria-label de bajar. Usa `{n}`. */
  moveDownLabel: string;
  /** aria-label de eliminar. Usa `{n}`. */
  deleteLabel: string;
  /** Anuncio para lector de pantalla. Usa `{from}` y `{to}`. */
  movedAnnouncement: string;
  deleteTitle: string;
  /** Cuerpo de la confirmación. Usa `{n}`. */
  deleteBody: string;
  deleteConfirmLabel: string;
  deleteCancelLabel: string;
  emptyTitle: string;
  emptyBody: string;
  /** Texto alternativo de la miniatura. Usa `{n}`. */
  thumbnailAlt: string;
};

// ─── Props ───────────────────────────────────────────────

export type PageListProps = {
  pages: readonly ScannedPage[];
  copy: PageListCopy;
  /** Mueve la página del índice `from` al índice `to`. */
  onReorder: (from: number, to: number) => void;
  onDelete: (id: string) => void;
  className?: string;
};

/** Rellena `{clave}` en una plantilla de copy. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match: string, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export function PageList({
  pages,
  copy,
  onReorder,
  onDelete,
  className,
}: PageListProps) {
  const [pendingDelete, setPendingDelete] = useState<ScannedPage | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const pendingIndex = pendingDelete
    ? pages.findIndex((page) => page.id === pendingDelete.id)
    : -1;

  function move(from: number, to: number) {
    if (to < 0 || to >= pages.length) return;
    onReorder(from, to);
    setAnnouncement(fillTemplate(copy.movedAnnouncement, { from: from + 1, to: to + 1 }));
  }

  function confirmDelete() {
    if (pendingDelete) onDelete(pendingDelete.id);
    setPendingDelete(null);
  }

  if (pages.length === 0) {
    return (
      <EmptyState
        icon={<FileImage />}
        title={copy.emptyTitle}
        description={copy.emptyBody}
        className={className}
      />
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <p className="mb-3 text-label text-muted">
        {pages.length === 1
          ? copy.countOne
          : fillTemplate(copy.countOther, { n: pages.length })}
      </p>

      {/* El reordenado no se ve en pantalla si no se mira la lista: se
          anuncia. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {pages.map((page, index) => {
          const number = index + 1;
          return (
            <li
              key={page.id}
              className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-sm"
            >
              <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-surface-alt">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={page.thumbnail}
                  alt={fillTemplate(copy.thumbnailAlt, { n: number })}
                  className="size-full object-contain"
                />
                <span className="absolute left-2 top-2 rounded-sm bg-navy/80 px-2 py-0.5 text-caption text-white">
                  {fillTemplate(copy.pageLabel, { n: number })}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1 border-t border-line px-1 py-1">
                <button
                  type="button"
                  aria-label={fillTemplate(copy.moveUpLabel, { n: number })}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  className="inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronUp aria-hidden="true" className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label={fillTemplate(copy.moveDownLabel, { n: number })}
                  disabled={index === pages.length - 1}
                  onClick={() => move(index, index + 1)}
                  className="inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronDown aria-hidden="true" className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label={fillTemplate(copy.deleteLabel, { n: number })}
                  onClick={() => setPendingDelete(page)}
                  className="inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 aria-hidden="true" className="size-5" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={copy.deleteTitle}
        closeLabel={copy.deleteCancelLabel}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              {copy.deleteCancelLabel}
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              {copy.deleteConfirmLabel}
            </Button>
          </>
        }
      >
        <p className="text-body text-ink">
          {fillTemplate(copy.deleteBody, { n: pendingIndex >= 0 ? pendingIndex + 1 : 1 })}
        </p>
      </Modal>
    </div>
  );
}
