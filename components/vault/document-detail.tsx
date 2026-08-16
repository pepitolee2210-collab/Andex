"use client";

/**
 * BÓVEDA · DETALLE DEL DOCUMENTO.
 *
 * La pantalla de un solo papel. Tres cosas y ninguna más:
 *
 *  1. **Cuándo vence**, con los días y la fecha, y debajo la promesa de los
 *     avisos a 90/60/30/7 días — el mismo texto que en el resto del módulo,
 *     porque es la misma promesa. No hay ningún control de avisos aquí: los
 *     avisos todavía NO existen, y un interruptor que no enciende nada sería
 *     exactamente la clase de mentira que este producto no puede permitirse.
 *
 *  2. **El archivo**: abrirlo, descargarlo, compartirlo. Compartir sólo
 *     aparece si el teléfono sabe hacerlo; ofrecerlo y que no pase nada es
 *     peor que no ofrecerlo.
 *
 *  3. **Lo que se puede cambiar**, con «borrar» al final y su aviso de que
 *     no se puede deshacer.
 *
 * Y al pie, el recordatorio de que no hay copia en ningún servidor. Va aquí,
 * y no en un aviso legal aparte, porque es aquí donde alguien decide si
 * borra la app o cambia de teléfono.
 *
 * Todo el texto entra por props: este componente no importa los diccionarios.
 */

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FolderInput,
  Lock,
  Pencil,
  Share2,
  Trash2,
} from "lucide-react";
import {
  KitBadge,
  KitCard,
  KitNotice,
  ListGroup,
  ListRow,
  ScreenHeader,
  SectionLabel,
} from "@/components/ui/kit";
import { canSharePdf, downloadBlob, sharePdf } from "@/lib/scanner";
import { readDocument } from "@/lib/vault/storage";
import type { ExpiryState, VaultDocument } from "@/lib/vault/types";
import type { Lang } from "@/lib/types";
import { DocumentDialogs, type DocumentDialogKind } from "./document-dialogs";
import {
  expiryText,
  fill,
  formatBytes,
  formatDateShort,
  formatTimestamp,
  pageCountText,
  urgencyTone,
  urgencyToneVar,
  type VaultDetailCopy,
  type VaultDocumentCopy,
  type VaultSectionsCopy,
} from "./vault-format";

/**
 * Margen antes de revocar la URL del PDF. Revocarla en el mismo tick deja la
 * pestaña nueva en blanco: el visor todavía no ha pedido los bytes.
 */
const REVOKE_DELAY_MS = 60_000;

export type DocumentDetailProps = {
  doc: VaultDocument;
  state: ExpiryState;
  copy: VaultDocumentCopy;
  detail: VaultDetailCopy;
  sections: VaultSectionsCopy;
  /** La promesa de los avisos, tal cual se dice en el resto del módulo. */
  alertPromise: string;
  /** Etiqueta del botón de volver. Sale de `common.back`. */
  backLabel: string;
  lang: Lang;
  onBack: () => void;
  onChanged: () => void;
};

export function DocumentDetail({
  doc,
  state,
  copy,
  detail,
  sections,
  alertPromise,
  backLabel,
  lang,
  onBack,
  onChanged,
}: DocumentDetailProps) {
  const [dialog, setDialog] = useState<DocumentDialogKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareFailed, setShareFailed] = useState(false);

  /**
   * `navigator.canShare` no existe en el servidor: consultarlo durante el
   * render daría un HTML distinto al del cliente. Se resuelve tras montar.
   */
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(canSharePdf()), []);

  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.length = 0;
    };
  }, []);

  /** El PDF descifrado, o `null` si no se pudo leer. Pone el error él mismo. */
  async function decrypt(): Promise<Blob | null> {
    setError(null);
    try {
      const blob = await readDocument(doc.id);
      if (!blob) {
        setError(copy.common.readFailed);
        return null;
      }
      return blob;
    } catch {
      setError(copy.common.readFailed);
      return null;
    }
  }

  const fileName = `${doc.name}.pdf`;

  async function handleOpen() {
    const blob = await decrypt();
    if (!blob) return;
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
  }

  async function handleDownload() {
    const blob = await decrypt();
    if (blob) downloadBlob(blob, fileName);
  }

  async function handleShare() {
    setShareFailed(false);
    const blob = await decrypt();
    if (!blob) return;
    const result = await sharePdf(blob, fileName, doc.name);
    // "cancelled" es la persona cerrando la hoja: no se le enseña un error.
    if (result === "failed" || result === "unsupported") setShareFailed(true);
  }

  const tone = urgencyTone(state);
  const trail = <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-disabled" />;

  return (
    <article className="mx-auto w-full max-w-4xl">
      <div className="navrow">
        <button type="button" onClick={onBack} className="navback">
          <ChevronLeft aria-hidden="true" className="size-6 shrink-0" />
          {backLabel}
        </button>
      </div>

      <ScreenHeader
        title={doc.name}
        sub={fill(detail.subtitle, {
          folder: copy.folders[doc.folder].name,
          date: formatTimestamp(doc.createdAt, lang),
        })}
      />

      {/* ── Cuándo vence ──
          El estado a la izquierda y la fecha en la insignia, con su tono. El
          filete separa el dato de la promesa: son dos cosas distintas y
          leerlas juntas confunde una con la otra. */}
      <KitCard className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className="text-body font-semibold"
            style={{ color: urgencyToneVar(tone) }}
          >
            {expiryText(state, copy.expiry)}
          </span>
          {doc.expiresAt ? (
            <KitBadge tone={tone}>{formatDateShort(doc.expiresAt, lang)}</KitBadge>
          ) : null}
        </div>
        <p className="mt-4 border-t border-line pt-4 text-body text-muted">
          {/* Sin fecha no hay aviso posible, así que lo que se dice es otra
              cosa: que no lo va a haber, y dónde ponerla. */}
          {doc.expiresAt ? alertPromise : detail.noExpiry}
        </p>
      </KitCard>

      {/* ── El archivo ── */}
      <SectionLabel as="h2">{sections.file}</SectionLabel>
      <ListGroup as="ul">
        <li>
          <ListRow
            icon={Eye}
            iconName="eye"
            title={detail.open}
            meta={fill(detail.fileMeta, {
              pages: pageCountText(doc.pageCount, copy.list),
              size: formatBytes(doc.sizeBytes, lang),
            })}
            trail={trail}
            onClick={() => void handleOpen()}
          />
        </li>
        <li>
          <ListRow
            icon={Download}
            iconName="download"
            title={detail.download}
            trail={trail}
            onClick={() => void handleDownload()}
          />
        </li>
        {canShare ? (
          <li>
            <ListRow
              icon={Share2}
              iconName="share-2"
              title={detail.share}
              meta={detail.shareMeta}
              trail={trail}
              onClick={() => void handleShare()}
            />
          </li>
        ) : null}
      </ListGroup>

      {shareFailed ? (
        <p role="alert" className="mt-2 text-body text-danger">
          {detail.shareFailed}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-body text-danger">
          {error}
        </p>
      ) : null}

      {/* ── Cambiar ── */}
      <SectionLabel as="h2">{sections.change}</SectionLabel>
      <ListGroup as="ul">
        <li>
          <ListRow
            icon={Pencil}
            iconName="pencil"
            title={detail.rename}
            trail={trail}
            onClick={() => setDialog("rename")}
          />
        </li>
        <li>
          <ListRow
            icon={FolderInput}
            iconName="folder-input"
            title={detail.move}
            meta={copy.folders[doc.folder].name}
            trail={trail}
            onClick={() => setDialog("move")}
          />
        </li>
        <li>
          <ListRow
            icon={Trash2}
            iconName="trash-2"
            title={detail.delete}
            meta={detail.deleteMeta}
            trail={trail}
            onClick={() => setDialog("delete")}
          />
        </li>
      </ListGroup>

      {/* La promesa y su límite en la misma frase. */}
      <KitNotice iconName="lock" icon={Lock} className="mt-5">
        {detail.encrypted}
      </KitNotice>

      <DocumentDialogs
        doc={doc}
        kind={dialog}
        copy={copy}
        onClose={() => setDialog(null)}
        onChanged={onChanged}
        onDeleted={onBack}
      />
    </article>
  );
}
