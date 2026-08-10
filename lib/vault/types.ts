/**
 * BÓVEDA DIGITAL — tipos del módulo 1.
 *
 * Guarda los documentos que definen la vida legal de una persona: pasaporte,
 * permiso de trabajo, notificación de corte. El PRD marca estos datos como
 * riesgo alto (§R5) y esa clasificación gobierna todo el módulo.
 */

/**
 * Las cinco carpetas de la bóveda.
 *
 * Los identificadores están en inglés porque son claves de datos; los
 * nombres visibles viven en `lib/i18n`. El orden es el de urgencia real:
 * primero lo que te identifica, después lo que te permite estar y trabajar.
 */
export type VaultFolderId =
  | "identity"      // Pasaportes, matrículas consulares, actas de nacimiento
  | "immigration"   // EAD, I-94, NTA, recibos I-797, asilo
  | "driving"       // Licencia, registro del auto, seguro
  | "taxes"         // Carta de ITIN, W-2, 1099, declaraciones
  | "housing";      // Contrato de renta, récords escolares, títulos

export const VAULT_FOLDERS: readonly VaultFolderId[] = [
  "identity",
  "immigration",
  "driving",
  "taxes",
  "housing",
];

/**
 * Antelación de los avisos, en días.
 *
 * El PRD pide 90/60/30 (§5-M1). Se añade el de 7 días porque los tres del
 * documento avisan con tiempo de sobra para empezar un trámite, pero
 * ninguno atrapa a quien lo dejó pasar. El de 7 días es el último recordatorio
 * antes de quedarse sin permiso de trabajo, que es justo el caso que más
 * daño hace.
 */
export const ALERT_DAYS = [90, 60, 30, 7] as const;

/** Los mismos umbrales de menor a mayor, para buscar el que está vigente. */
const ASCENDING_ALERTS: readonly number[] = [...ALERT_DAYS].sort((a, b) => a - b);

export type VaultDocument = {
  id: string;
  folder: VaultFolderId;
  /** Nombre que le pone el usuario. Texto libre, sanitizado. */
  name: string;
  /**
   * Fecha de vencimiento en ISO (AAAA-MM-DD), o null si no caduca.
   * Un acta de nacimiento no vence; un permiso de trabajo sí, y ahí está
   * todo el valor del módulo.
   */
  expiresAt: string | null;
  /** Número de páginas del PDF. */
  pageCount: number;
  /** Tamaño del archivo cifrado, en bytes. */
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  /** Nota opcional del usuario: "el que pidió el abogado", etc. */
  note: string | null;
};

/** Estado de vencimiento, para ordenar y para pintar la lista. */
export type ExpiryState =
  | { kind: "none" }
  | { kind: "expired"; daysAgo: number }
  | { kind: "soon"; daysLeft: number; threshold: number }
  | { kind: "ok"; daysLeft: number };

/**
 * Calcula el estado de vencimiento de un documento.
 *
 * `today` se inyecta en vez de leer el reloj dentro: así la función es pura
 * y se puede probar con fechas fijas, en lugar de depender del día en que
 * se ejecute la suite.
 */
export function expiryState(expiresAt: string | null, today: Date): ExpiryState {
  if (!expiresAt) return { kind: "none" };

  // Se comparan días naturales en UTC, no instantes: si no, un documento
  // que vence hoy aparecería como vencido o vigente según la hora.
  const due = Date.parse(`${expiresAt}T00:00:00Z`);
  if (Number.isNaN(due)) return { kind: "none" };

  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days = Math.round((due - now) / 86_400_000);

  if (days < 0) return { kind: "expired", daysAgo: -days };

  // El umbral vigente es el MÁS PEQUEÑO que todavía cubre los días que
  // quedan: a 60 días el aviso activo es el de 60, no el de 90. Buscar
  // sobre `ALERT_DAYS` tal cual —que va de mayor a menor— devolvería
  // siempre el primero que encaja, o sea el más lejano, y el usuario leería
  // "te avisamos con 90 días" cuando le quedan 8.
  const threshold = ASCENDING_ALERTS.find((d) => days <= d);
  return threshold !== undefined
    ? { kind: "soon", daysLeft: days, threshold }
    : { kind: "ok", daysLeft: days };
}

/** Orden de la lista: primero lo que arde. */
export function urgencyRank(state: ExpiryState): number {
  switch (state.kind) {
    case "expired":
      return 0;
    case "soon":
      return 1;
    case "ok":
      return 2;
    case "none":
      return 3;
  }
}
