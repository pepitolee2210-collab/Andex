"use client";

/**
 * BÓVEDA — orquestador del módulo.
 *
 * Une las tres piezas que hasta ahora vivían sueltas: la pantalla de la
 * bóveda, el escáner y el formulario de guardado. Están separadas a
 * propósito — el escáner no sabe que existe una bóveda, y por eso el mismo
 * flujo servirá tal cual para el modo invitado de la landing, donde sólo se
 * descarga el PDF.
 *
 * Recorrido: bóveda → escanear → PDF listo → guardar cifrado → volver.
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/toaster";
import { track } from "@/lib/analytics/track";
import type { BovedaDict } from "@/lib/i18n/dictionaries/boveda";
import type { Lang } from "@/lib/types";
import { downloadBlob, type ScannedPage } from "@/lib/scanner";
import type { VaultFolderId } from "@/lib/vault/types";
import { ScannerFlow } from "./scanner-flow";
import { SaveDocumentForm } from "./save-document-form";
import type { VaultCommonCopy } from "./vault-format";
import { VaultScreen } from "./vault-screen";

export type VaultModuleProps = {
  lang: Lang;
  copy: BovedaDict;
  common: VaultCommonCopy;
};

type Stage =
  | { kind: "vault" }
  | { kind: "scanning" }
  | { kind: "saving"; pdf: Blob; pageCount: number };

export function VaultModule({ lang, copy, common }: VaultModuleProps) {
  /**
   * `?escanear=1` abre el escáner directo.
   *
   * Lo usa la acción «Escanear» del menú flotante, que si no tendría que
   * llevar a `/modulo/boveda` a secas — el mismo destino que la pestaña de
   * Bóveda, y entonces el menú estaría repitiendo una puerta que ya existe.
   *
   * Es una BANDERA, no un dato: en la URL de este producto no viaja nada
   * de la persona (historial, portapapeles y registros de proxy), y con
   * este público eso no es una precaución teórica.
   */
  const [stage, setStage] = useState<Stage>({ kind: "vault" });

  /* Se lee de `window.location` en un efecto, y NO con `useSearchParams`.
     Ese hook obliga a un límite de `Suspense` en Next 15: sin él la página
     falla al renderizarse entera en el servidor, aunque funcione al navegar
     desde dentro. Daba un fallo intermitente —según se llegara por enlace o
     por carga completa— que costó encontrar justamente por eso. */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("escanear") === "1") {
      track("vault_scan_started", { source: "menu" });
      setStage({ kind: "scanning" });
    }
  }, []);
  /** Cambia al guardar para que la bóveda recargue su lista. */
  const [savedCount, setSavedCount] = useState(0);

  const startScan = useCallback(() => {
    track("vault_scan_started", { source: "vault" });
    setStage({ kind: "scanning" });
  }, []);

  const handleScanComplete = useCallback((pdf: Blob, pages: ScannedPage[]) => {
    setStage({ kind: "saving", pdf, pageCount: pages.length });
  }, []);

  const fileName = `${copy.title.toLowerCase().replace(/\s+/g, "-")}.pdf`;

  if (stage.kind === "scanning") {
    return (
      <ScannerFlow
        copy={copy.scan}
        // El PDF se guarda cifrado en el paso siguiente: descargarlo aquí
        // dejaría una copia sin cifrar en la carpeta de Descargas, que es
        // justo lo que este módulo existe para evitar.
        autoDownload={false}
        onComplete={handleScanComplete}
        onCancel={() => setStage({ kind: "vault" })}
      />
    );
  }

  if (stage.kind === "saving") {
    return (
      <div className="px-4 py-10">
        <SaveDocumentForm
          copy={{
            title: copy.scanner.saveTitle,
            nameLabel: copy.scanner.nameLabel,
            namePlaceholder: copy.scanner.namePlaceholder,
            folderLabel: copy.scanner.folderLabel,
            noteLabel: copy.scanner.noteLabel,
            notePlaceholder: copy.scanner.notePlaceholder,
            expiryLabel: copy.expiry.label,
            expiryOptional: copy.expiry.optional,
            expiryPromise: copy.expiry.alertPromise,
            save: copy.scanner.save,
            cancel: copy.scanner.cancel,
            downloadPdf: copy.scanner.downloadPdf,
            folders: Object.fromEntries(
              Object.entries(copy.folders).map(([id, f]) => [id, f.name]),
            ) as Record<VaultFolderId, string>,
            failed: common.readFailed,
          }}
          pdf={stage.pdf}
          pageCount={stage.pageCount}
          onSaved={() => {
            toast.success(copy.scanner.saved);
            setSavedCount((n) => n + 1);
            setStage({ kind: "vault" });
          }}
          onDownload={() => downloadBlob(stage.pdf, fileName)}
          onCancel={() => setStage({ kind: "vault" })}
        />
      </div>
    );
  }

  return (
    <VaultScreen
      lang={lang}
      copy={copy}
      common={common}
      onScan={startScan}
      refreshSignal={savedCount}
    />
  );
}
