/**
 * BÓVEDA — formato y contratos de copy de la pantalla.
 *
 * Módulo PURO: sin React y sin i18n en tiempo de ejecución. Los textos
 * llegan SIEMPRE desde `dict.boveda` (el Server Component los resuelve y los
 * pasa por props); aquí sólo se rellenan sus huecos `{n}` y se decide qué
 * plantilla toca. Del diccionario no sale ni una palabra nueva.
 *
 * El único tipo que se importa de i18n es `BovedaDict`, y con `import type`:
 * se borra en compilación, así que ningún componente cliente arrastra los
 * diccionarios al bundle.
 */

import type { BovedaDict } from "@/lib/i18n/dictionaries/boveda";
import type { Lang } from "@/lib/types";
import type { ExpiryState, VaultDocument, VaultFolderId } from "@/lib/vault/types";

// ─── Contratos de copy ───────────────────────────────────

export type VaultListCopy = BovedaDict["list"];
export type VaultExpiryCopy = BovedaDict["expiry"];
export type VaultFoldersCopy = BovedaDict["folders"];
export type VaultTrackerCopy = BovedaDict["tracker"];

/**
 * Textos genéricos que la pantalla necesita y que NO viven en `boveda`
 * (salen de `common`). Se declaran uno a uno, como strings, por dos motivos:
 * el contrato queda explícito y —importante— lo que cruza de servidor a
 * cliente tiene que ser serializable, y `dict.common.aria` contiene funciones.
 */
export type VaultCommonCopy = {
  save: string;
  cancel: string;
  back: string;
  closeModal: string;
  /** Un documento que no se pudo leer o descifrar. */
  readFailed: string;
};

/** Etiquetas del formulario de edición, reutilizadas del bloque `scanner`. */
export type VaultFieldsCopy = {
  nameLabel: string;
  /** Etiquetas del campo de vencimiento, editable después de guardar. */
  expiryLabel: string;
  expiryHelp: string;
  namePlaceholder: string;
  folderLabel: string;
};

/** Todo lo que necesita una tarjeta de documento, en un solo objeto. */
export type VaultDocumentCopy = {
  list: VaultListCopy;
  expiry: VaultExpiryCopy;
  folders: VaultFoldersCopy;
  fields: VaultFieldsCopy;
  common: VaultCommonCopy;
};

/** Un documento con su estado de vencimiento ya calculado. */
export type VaultEntry = {
  document: VaultDocument;
  state: ExpiryState;
};

// ─── Plantillas ──────────────────────────────────────────

/** Rellena los huecos `{clave}` de una plantilla del diccionario. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match: string, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export function documentCountText(count: number, copy: VaultListCopy): string {
  return count === 1 ? copy.documentCountOne : fill(copy.documentCount, { n: count });
}

export function pageCountText(count: number, copy: VaultListCopy): string {
  return count === 1 ? copy.pageCountOne : fill(copy.pageCount, { n: count });
}

// ─── Vencimiento ─────────────────────────────────────────

/**
 * Tono del estado. NUNCA viaja solo: siempre acompaña al texto de
 * `expiryText`. El daltonismo es frecuente y aquí el estado tiene
 * consecuencias legales, así que el color es refuerzo, jamás el mensaje.
 */
export type ExpiryTone = "danger" | "warning" | "neutral";

export function expiryTone(state: ExpiryState): ExpiryTone {
  switch (state.kind) {
    case "expired":
      return "danger";
    case "soon":
      // `expiryState` clasifica el día del vencimiento como `soon` con 0 días
      // restantes. Ese documento ya no sirve mañana: se pinta como vencido.
      return state.daysLeft === 0 ? "danger" : "warning";
    default:
      return "neutral";
  }
}

const TONE_TEXT: Record<ExpiryTone, string> = {
  danger: "text-danger",
  warning: "text-amber-deep",
  neutral: "text-muted",
};

export function expiryToneClass(tone: ExpiryTone): string {
  return TONE_TEXT[tone];
}

/** El texto exacto del diccionario que le corresponde al estado. */
export function expiryText(state: ExpiryState, copy: VaultExpiryCopy): string {
  switch (state.kind) {
    case "none":
      return copy.none;
    case "expired":
      return fill(copy.expired, { n: state.daysAgo });
    case "soon":
      // Sin días por delante: "Venció hoy". Es la única plantilla del
      // diccionario que habla de hoy, y equivocarse hacia la urgencia es
      // preferible a decirle a alguien "vence en 0 días".
      if (state.daysLeft === 0) return copy.expiredToday;
      return state.daysLeft === 1 ? copy.soonOne : fill(copy.soon, { n: state.daysLeft });
    case "ok":
      return copy.ok;
  }
}

/** ¿Es de los que hay que enseñar arriba, con fecha límite encima? */
export function isUrgent(state: ExpiryState): boolean {
  return state.kind === "expired" || state.kind === "soon";
}

/**
 * Orden de la lista de urgencias: primero lo vencido, después lo que vence
 * antes. Con el mismo estado manda la fecha, que es el dato real; el `id`
 * cierra el desempate para que el orden no baile entre renders.
 */
export function compareUrgency(a: VaultEntry, b: VaultEntry): number {
  const byState = urgencyOf(a.state) - urgencyOf(b.state);
  if (byState !== 0) return byState;
  const byDate = (a.document.expiresAt ?? "").localeCompare(b.document.expiresAt ?? "");
  if (byDate !== 0) return byDate;
  return a.document.id.localeCompare(b.document.id);
}

function urgencyOf(state: ExpiryState): number {
  return state.kind === "expired" ? 0 : state.kind === "soon" ? 1 : 2;
}

// ─── Espacio en disco ────────────────────────────────────

export type StorageEstimate = { used: number; quota: number };

/**
 * Umbral del aviso de espacio. Enseñar siempre cuánto ocupa la bóveda es
 * ruido: sólo importa cuando queda poco y el próximo guardado puede fallar.
 */
const LOW_SPACE_RATIO = 0.15;

export function isLowOnSpace(estimate: StorageEstimate | null): boolean {
  if (!estimate || estimate.quota <= 0) return false;
  return (estimate.quota - estimate.used) / estimate.quota < LOW_SPACE_RATIO;
}

/**
 * Tamaño legible. Es FORMATO, no copy: `Intl` pone la unidad en el idioma
 * del usuario, así que aquí no se escribe ningún texto.
 */
export function formatBytes(bytes: number, lang: Lang): string {
  const locale = lang === "en" ? "en-US" : "es-419";
  const gigabytes = bytes / 1_000_000_000;

  if (gigabytes >= 1) {
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "gigabyte",
      unitDisplay: "short",
      maximumFractionDigits: 1,
    }).format(gigabytes);
  }

  const megabytes = bytes / 1_000_000;
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "megabyte",
    unitDisplay: "short",
    maximumFractionDigits: megabytes < 10 ? 1 : 0,
  }).format(megabytes);
}

// ─── Carpetas ────────────────────────────────────────────

export function folderName(folder: VaultFolderId, copy: VaultFoldersCopy): string {
  return copy[folder].name;
}

export function folderHint(folder: VaultFolderId, copy: VaultFoldersCopy): string {
  return copy[folder].hint;
}

// ─── Buscar y filtrar ────────────────────────────────────

/**
 * Texto comparable: sin mayúsculas y sin diacríticos.
 *
 * ⚠️ SÓLO PARA COMPARAR, jamás para mostrar: rompe la ortografía a
 * propósito, y enseñar su salida sería escribirle mal su idioma al usuario.
 *
 * Quien guardó "Permiso de Trabajo" tiene que encontrarlo escribiendo
 * "permiso", y quien guardó "Matrícula" escribiendo "matricula". En un
 * teclado de móvil la tilde se escapa constantemente, y fallar la búsqueda
 * por un acento sería castigar a la persona por escribir su propio idioma.
 * NFD separa la letra de su diacrítico y el rango \u0300-\u036f lo borra.
 *
 * La Ñ cae en ese mismo barrido y se queda así a conciencia: en español es
 * una letra aparte, pero buena parte de esta comunidad teclea en un móvil
 * configurado en inglés, donde la ñ obliga a mantener pulsada la n. Al
 * plegarla, "compania" encuentra "Compañía". El precio —que "ano" encuentre
 * también "Año"— no le hace daño a nadie dentro de su propia bóveda.
 */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Coincide si TODAS las palabras aparecen en algún sitio del documento.
 *
 * Por palabras sueltas y no por la frase entera, porque nadie recuerda el
 * nombre exacto que le puso: "permiso trabajo" tiene que encontrar
 * "Permiso de trabajo (EAD)". Se busca también en la nota, que es donde la
 * gente escribe el para qué ("el que pidió el abogado").
 */
export function matchesQuery(document: VaultDocument, query: string): boolean {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeText(`${document.name} ${document.note ?? ""}`);
  return terms.every((term) => haystack.includes(term));
}

/**
 * Los tres modos de la barra de filtros.
 *
 * `noExpiry` no es una curiosidad: un documento guardado sin fecha nunca va a
 * disparar un aviso, que es justo por lo que se paga el módulo, y hoy no hay
 * forma de darse cuenta de que están ahí. Este filtro los saca a la luz.
 */
export type VaultFilter = "all" | "dueSoon" | "noExpiry";

export function matchesFilter(entry: VaultEntry, filter: VaultFilter): boolean {
  switch (filter) {
    case "dueSoon":
      return isUrgent(entry.state);
    case "noExpiry":
      return entry.document.expiresAt === null;
    case "all":
      return true;
  }
}

/**
 * Aplica texto y filtro a la vez y devuelve el resultado ya ordenado por
 * urgencia. No toca la carpeta: buscar es lo contrario de navegar, y quien
 * escribe "pasaporte" no quiere que le respondan "en esa carpeta no está".
 */
export function searchDocuments(
  entries: readonly VaultEntry[],
  query: string,
  filter: VaultFilter,
): VaultEntry[] {
  return entries
    .filter((entry) => matchesFilter(entry, filter) && matchesQuery(entry.document, query))
    .sort(compareUrgency);
}
