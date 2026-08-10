import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { VaultModule } from "@/components/vault/vault-module";

/**
 * BÓVEDA DIGITAL — módulo 1 (§5-M1).
 *
 * Segmento estático: en el App Router `/modulo/boveda` gana a
 * `/modulo/[slug]`, así que esta pantalla sustituye a la carcasa genérica
 * sólo para este módulo. Los otros seis siguen con el placeholder de §4.6.
 *
 * El servidor hace lo único que puede hacer: resolver el idioma y el texto.
 * Los documentos viven cifrados en el navegador (IndexedDB) y no existen
 * fuera de él, así que la pantalla es cliente. El layout de (panel) ya exigió
 * sesión y montó el control de acceso de §3.4.7.
 *
 * Al cliente sólo cruzan strings: `dict.common.aria` contiene funciones y no
 * es serializable, por eso los textos genéricos se pasan uno a uno.
 */

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.boveda.title };
}

export default async function BovedaPage() {
  const lang = await getLang();
  const dict = getDictionary(lang);

  return (
    <VaultModule
      lang={lang}
      copy={dict.boveda}
      common={{
        save: dict.common.actions.save,
        cancel: dict.common.actions.cancel,
        back: dict.common.actions.back,
        closeModal: dict.common.aria.closeModal,
        readFailed: dict.common.errors.server,
      }}
    />
  );
}
