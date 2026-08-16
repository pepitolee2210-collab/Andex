"use client";

/**
 * BÓVEDA · TARJETA DE DOCUMENTO.
 *
 * Cuatro acciones sobre un documento que sólo existe en este teléfono:
 * abrirlo, cambiarle el nombre, moverlo de carpeta y borrarlo.
 *
 * Tres decisiones que no son de estilo:
 *
 * 1. **El estado de vencimiento nunca se comunica sólo con color.** Va
 *    siempre con su texto ("Venció hace 12 días") y con un icono distinto
 *    por estado. El daltonismo es frecuente y aquí confundir "vigente" con
 *    "vencido" puede costar un permiso de trabajo.
 *
 * 2. **La línea de estado lleva la fecha real**, no sólo los días: «Vence en
 *    40 días · 14 de febrero de 2026». Los días solos obligan a contar en la
 *    cabeza para saber si eso cae antes o después de la cita en la corte.
 *
 * 3. **El metadato es sólo el número de páginas.** La carpeta estaba ahí y
 *    sobra: o se está mirando esa carpeta, o el rótulo de la sección ya lo
 *    dice. Repetirla empujaba la fecha —lo único urgente— a la tercera línea.
 *
 * Tocar la tarjeta abre el DETALLE; el botón «Abrir» abre el PDF directo,
 * que es lo que se hace el 95% de las veces.
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
import { readDocument } from "@/lib/vault/storage";
import type { ExpiryState, VaultDocument } from "@/lib/vault/types";
import type { Lang } from "@/lib/types";
import { DocumentDialogs, type DocumentDialogKind } from "./document-dialogs";
import {
  expiryLine,
  expiryTone,
  pageCountText,
  urgencyTone,
  urgencyToneVar,
  type VaultDocumentCopy,
} from "./vault-format";

/**
 * Margen antes de revocar la URL del PDF. Revocarla en el mismo tick deja la
 * pestaña nueva en blanco: el visor todavía no ha pedido los bytes.
 */
const REVOKE_DELAY_MS = 60_000;

export type DocumentCardProps = {
  doc: VaultDocument;
  state: ExpiryState;
  copy: VaultDocumentCopy;
  lang: Lang;
  /** Abre la pantalla de detalle. Sin ella, la tarjeta abre el PDF. */
  onOpenDetail?: (doc: VaultDocument) => void;
  /** Se llama tras guardar o borrar, para que la pantalla recargue. */
  onChanged: () => void;
};

export function DocumentCard({
  doc,
  state,
  copy,
  lang,
  onOpenDetail,
  onChanged,
}: DocumentCardProps) {
  const [dialog, setDialog] = useState<DocumentDialogKind | null>(null);
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

  const tone = expiryTone(state);
  const stateText = expiryLine(state, doc.expiresAt, copy.expiry, lang);
  const ToneIcon =
    state.kind === "none"
      ? null
      : tone === "danger"
        ? TriangleAlert
        : tone === "warning"
          ? Clock
          : Check;

  return (
    <article className="doccard">
      {/* La cabecera entera lleva al documento. Antes «Abrir» era un botón
          más entre cuatro, del mismo tamaño que «Eliminar»: la acción que
          se hace el 95% de las veces valía lo mismo que la irreversible. */}
      <button
        type="button"
        onClick={() => (onOpenDetail ? onOpenDetail(doc) : void handleOpen())}
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
          <span className="docmeta">{pageCountText(doc.pageCount, copy.list)}</span>
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
        <button type="button" onClick={() => void handleOpen()}>
          <Eye aria-hidden="true" className="size-4 shrink-0" />
          {copy.list.open}
        </button>
        <button
          type="button"
          aria-label={copy.list.rename}
          onClick={() => setDialog("rename")}
        >
          <Pencil aria-hidden="true" className="size-4 shrink-0" />
          {copy.list.renameShort}
        </button>
        <button
          type="button"
          aria-label={copy.list.move}
          onClick={() => setDialog("move")}
        >
          <FolderInput aria-hidden="true" className="size-4 shrink-0" />
          {copy.list.moveShort}
        </button>
        <button
          type="button"
          className="danger"
          aria-label={copy.list.delete}
          onClick={() => setDialog("delete")}
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

      <DocumentDialogs
        doc={doc}
        kind={dialog}
        copy={copy}
        onClose={() => setDialog(null)}
        onChanged={onChanged}
      />
    </article>
  );
}
/* `IconAction` vivía aquí: tres botones de icono sin texto para cambiar
   nombre, mover y borrar. Se ha ido con el rediseño — ahora las cuatro
   acciones llevan su palabra escrita, que es lo que hace falta cuando el
   lápiz y la carpeta-con-flecha no significan nada de antemano. */
