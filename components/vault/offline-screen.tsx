"use client";

/**
 * BÓVEDA · SIN CONEXIÓN.
 *
 * Con datos contados esto no es el caso raro: es la mañana normal de mucha
 * gente. Por eso la pantalla no dice «error» ni pone un icono de alarma —
 * dice el REPARTO, que es la única información útil aquí:
 *
 *  · La bóveda entera y el escáner siguen funcionando, porque viven en el
 *    teléfono. Ése es literalmente el argumento del módulo, y sin señal es
 *    cuando se demuestra.
 *  · Lo único que se cae es lo que necesita la red: los talleres en vivo y
 *    las consultas a los portales del gobierno.
 *
 * Las filas de «necesita datos» se enseñan APAGADAS, no se esconden: si
 * desaparecen, quien las buscaba cree que la app se las comió.
 *
 * No se finge contenido. No hay una fila de «manuales descargados» porque
 * hoy no sabemos cuántos hay descargados, y un número inventado aquí sería
 * exactamente lo que este producto no puede permitirse.
 *
 * Todo el texto entra por props: este componente no importa los diccionarios.
 */

import { ChevronRight, ExternalLink, FolderLock, ScanLine, Video, WifiOff } from "lucide-react";
import {
  Glyph,
  HeaderAction,
  ListGroup,
  ListRow,
  ScreenHeader,
  SectionLabel,
} from "@/components/ui/kit";
import { fill, type VaultOfflineCopy } from "./vault-format";

export type OfflineScreenProps = {
  copy: VaultOfflineCopy;
  /** Sobretítulo y titular: los mismos que la bóveda, es la misma pantalla. */
  overline: string;
  title: string;
  sections: { worksOffline: string; needsData: string };
  documentCount: number;
  /** Abre el escáner. Sigue funcionando: todo el proceso es local. */
  onScan?: () => void;
  /** Deja pasar a la bóveda de siempre. Los documentos están aquí. */
  onOpenVault: () => void;
};

export function OfflineScreen({
  copy,
  overline,
  title,
  sections,
  documentCount,
  onScan,
  onOpenVault,
}: OfflineScreenProps) {
  const documentsLabel =
    documentCount === 0
      ? copy.documentsNone
      : documentCount === 1
        ? copy.documentsOne
        : fill(copy.documents, { n: documentCount });

  const trail = <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-disabled" />;

  return (
    <article className="mx-auto w-full max-w-4xl">
      {/* El icono de la cabecera cambia a «sin señal»: es el mismo sitio
          donde vive la lupa cuando hay red, y dice el estado sin ocupar una
          línea de la pantalla. */}
      <HeaderAction>
        <span className="ax-iconbtn" style={{ color: "var(--urgency-soon-fg)" }}>
          <Glyph name="wifi-off" icon={WifiOff} size={21} />
        </span>
      </HeaderAction>

      <ScreenHeader overline={overline} title={title} />

      <div className="ax-card card-highlight mt-5 flex items-start gap-3">
        <Glyph
          name="wifi-off"
          icon={WifiOff}
          size={19}
          strokeWidth={2}
          className="mt-0.5 shrink-0"
          style={{ color: "var(--amber-700)" }}
        />
        <div className="min-w-0">
          <h2 className="text-body font-bold text-ink">{copy.title}</h2>
          <p className="mt-2 text-body" style={{ color: "var(--amber-700)" }}>
            {copy.body}
          </p>
        </div>
      </div>

      <section aria-labelledby="boveda-sin-datos">
        <SectionLabel as="h2" id="boveda-sin-datos">
          {sections.worksOffline}
        </SectionLabel>
        <ListGroup as="ul">
          {onScan ? (
            <li>
              <ListRow
                icon={ScanLine}
                iconName="scan-line"
                iconTone="accent"
                title={copy.scan}
                meta={copy.scanMeta}
                trail={trail}
                onClick={onScan}
              />
            </li>
          ) : null}
          <li>
            <ListRow
              icon={FolderLock}
              iconName="folder"
              title={documentsLabel}
              trail={trail}
              onClick={onOpenVault}
            />
          </li>
        </ListGroup>
      </section>

      {/* Apagadas, no escondidas: siguen en su sitio y dicen cuándo vuelven. */}
      <section aria-labelledby="boveda-necesita-datos">
        <SectionLabel as="h2" id="boveda-necesita-datos">
          {sections.needsData}
        </SectionLabel>
        <ListGroup as="ul">
          <li>
            <ListRow
              icon={Video}
              iconName="video"
              title={copy.workshops}
              meta={copy.waitForSignal}
            />
          </li>
          <li>
            <ListRow
              icon={ExternalLink}
              iconName="external-link"
              title={copy.tracker}
              meta={copy.waitForSignal}
            />
          </li>
        </ListGroup>
      </section>
    </article>
  );
}
