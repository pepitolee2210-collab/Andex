/**
 * Estados de EE. UU. — catálogo del PASO 2, rama A (Anexo C.1).
 *
 * Orden de presentación en TRES bloques, tal como pide el PRD:
 *   Bloque 1 — Utah, el piloto, destacado con separador visual.
 *   Bloque 2 — los 12 estados de mayor población hispana (acceso rápido),
 *              en el orden exacto del documento, no alfabético.
 *   Bloque 3 — todos los demás, alfabéticos por nombre en español.
 *
 * Se guarda SIEMPRE el código ISO de 2 letras, nunca el nombre (C.1).
 * La implementación en pantalla debe ser un combobox con búsqueda, no un
 * `<select>` nativo de 52 entradas: en mobile, escribir es más rápido que
 * hacer scroll (C.1).
 *
 * `timezone` alimenta notificaciones, eventos y recordatorios (C.4). En los
 * estados que abarcan más de una zona horaria se usa la de la mayoría de la
 * población; los casos afectados van comentados.
 */

export type UsState = {
  /** ISO 3166-2 sin el prefijo "US-". Es lo que se persiste. */
  code: string;
  nameEs: string;
  nameEn: string;
  /** 1 = piloto · 2 = acceso rápido · 3 = resto alfabético */
  block: 1 | 2 | 3;
  /** Zona horaria IANA principal. */
  timezone: string;
};

/** Estado del programa piloto (§0, §3.3.1 PILOT_BOOST). */
export const PILOT_STATE_CODE = "UT";

export const US_STATES: readonly UsState[] = [
  // ── Bloque 1 — Piloto ──────────────────────────────────
  { code: "UT", nameEs: "Utah", nameEn: "Utah", block: 1, timezone: "America/Denver" },

  // ── Bloque 2 — Mayor población hispana (orden del PRD) ──
  { code: "CA", nameEs: "California", nameEn: "California", block: 2, timezone: "America/Los_Angeles" },
  { code: "TX", nameEs: "Texas", nameEn: "Texas", block: 2, timezone: "America/Chicago" }, // El Paso es Mountain
  { code: "FL", nameEs: "Florida", nameEn: "Florida", block: 2, timezone: "America/New_York" }, // Panhandle es Central
  { code: "NY", nameEs: "Nueva York", nameEn: "New York", block: 2, timezone: "America/New_York" },
  { code: "AZ", nameEs: "Arizona", nameEn: "Arizona", block: 2, timezone: "America/Phoenix" }, // sin horario de verano
  { code: "IL", nameEs: "Illinois", nameEn: "Illinois", block: 2, timezone: "America/Chicago" },
  { code: "NJ", nameEs: "Nueva Jersey", nameEn: "New Jersey", block: 2, timezone: "America/New_York" },
  { code: "CO", nameEs: "Colorado", nameEn: "Colorado", block: 2, timezone: "America/Denver" },
  { code: "NV", nameEs: "Nevada", nameEn: "Nevada", block: 2, timezone: "America/Los_Angeles" },
  { code: "GA", nameEs: "Georgia", nameEn: "Georgia", block: 2, timezone: "America/New_York" },
  { code: "NC", nameEs: "Carolina del Norte", nameEn: "North Carolina", block: 2, timezone: "America/New_York" },
  { code: "WA", nameEs: "Washington", nameEn: "Washington", block: 2, timezone: "America/Los_Angeles" },

  // ── Bloque 3 — Resto, alfabético por nameEs ─────────────
  { code: "AL", nameEs: "Alabama", nameEn: "Alabama", block: 3, timezone: "America/Chicago" },
  { code: "AK", nameEs: "Alaska", nameEn: "Alaska", block: 3, timezone: "America/Anchorage" },
  { code: "AR", nameEs: "Arkansas", nameEn: "Arkansas", block: 3, timezone: "America/Chicago" },
  { code: "SC", nameEs: "Carolina del Sur", nameEn: "South Carolina", block: 3, timezone: "America/New_York" },
  { code: "CT", nameEs: "Connecticut", nameEn: "Connecticut", block: 3, timezone: "America/New_York" },
  { code: "ND", nameEs: "Dakota del Norte", nameEn: "North Dakota", block: 3, timezone: "America/Chicago" },
  { code: "SD", nameEs: "Dakota del Sur", nameEn: "South Dakota", block: 3, timezone: "America/Chicago" },
  { code: "DE", nameEs: "Delaware", nameEn: "Delaware", block: 3, timezone: "America/New_York" },
  { code: "HI", nameEs: "Hawái", nameEn: "Hawaii", block: 3, timezone: "Pacific/Honolulu" },
  { code: "ID", nameEs: "Idaho", nameEn: "Idaho", block: 3, timezone: "America/Boise" },
  { code: "IN", nameEs: "Indiana", nameEn: "Indiana", block: 3, timezone: "America/Indiana/Indianapolis" },
  { code: "IA", nameEs: "Iowa", nameEn: "Iowa", block: 3, timezone: "America/Chicago" },
  { code: "KS", nameEs: "Kansas", nameEn: "Kansas", block: 3, timezone: "America/Chicago" },
  { code: "KY", nameEs: "Kentucky", nameEn: "Kentucky", block: 3, timezone: "America/New_York" }, // el oeste es Central
  { code: "LA", nameEs: "Luisiana", nameEn: "Louisiana", block: 3, timezone: "America/Chicago" },
  { code: "ME", nameEs: "Maine", nameEn: "Maine", block: 3, timezone: "America/New_York" },
  { code: "MD", nameEs: "Maryland", nameEn: "Maryland", block: 3, timezone: "America/New_York" },
  { code: "MA", nameEs: "Massachusetts", nameEn: "Massachusetts", block: 3, timezone: "America/New_York" },
  { code: "MI", nameEs: "Michigan", nameEn: "Michigan", block: 3, timezone: "America/Detroit" },
  { code: "MN", nameEs: "Minnesota", nameEn: "Minnesota", block: 3, timezone: "America/Chicago" },
  { code: "MS", nameEs: "Misisipi", nameEn: "Mississippi", block: 3, timezone: "America/Chicago" },
  { code: "MO", nameEs: "Misuri", nameEn: "Missouri", block: 3, timezone: "America/Chicago" },
  { code: "MT", nameEs: "Montana", nameEn: "Montana", block: 3, timezone: "America/Denver" },
  { code: "NE", nameEs: "Nebraska", nameEn: "Nebraska", block: 3, timezone: "America/Chicago" },
  { code: "NH", nameEs: "Nuevo Hampshire", nameEn: "New Hampshire", block: 3, timezone: "America/New_York" },
  { code: "NM", nameEs: "Nuevo México", nameEn: "New Mexico", block: 3, timezone: "America/Denver" },
  { code: "OH", nameEs: "Ohio", nameEn: "Ohio", block: 3, timezone: "America/New_York" },
  { code: "OK", nameEs: "Oklahoma", nameEn: "Oklahoma", block: 3, timezone: "America/Chicago" },
  { code: "OR", nameEs: "Oregón", nameEn: "Oregon", block: 3, timezone: "America/Los_Angeles" },
  { code: "PA", nameEs: "Pensilvania", nameEn: "Pennsylvania", block: 3, timezone: "America/New_York" },
  { code: "PR", nameEs: "Puerto Rico", nameEn: "Puerto Rico", block: 3, timezone: "America/Puerto_Rico" },
  { code: "RI", nameEs: "Rhode Island", nameEn: "Rhode Island", block: 3, timezone: "America/New_York" },
  { code: "TN", nameEs: "Tennessee", nameEn: "Tennessee", block: 3, timezone: "America/Chicago" }, // el este es Eastern
  { code: "VT", nameEs: "Vermont", nameEn: "Vermont", block: 3, timezone: "America/New_York" },
  { code: "VA", nameEs: "Virginia", nameEn: "Virginia", block: 3, timezone: "America/New_York" },
  { code: "WV", nameEs: "Virginia Occidental", nameEn: "West Virginia", block: 3, timezone: "America/New_York" },
  { code: "DC", nameEs: "Washington D. C.", nameEn: "Washington D.C.", block: 3, timezone: "America/New_York" },
  { code: "WI", nameEs: "Wisconsin", nameEn: "Wisconsin", block: 3, timezone: "America/Chicago" },
  { code: "WY", nameEs: "Wyoming", nameEn: "Wyoming", block: 3, timezone: "America/Denver" },
];

const BY_CODE = new Map(US_STATES.map((s) => [s.code, s]));

export function stateByCode(code: string | null | undefined): UsState | null {
  if (!code) return null;
  return BY_CODE.get(code.toUpperCase()) ?? null;
}

/** Los tres bloques por separado, para los encabezados del combobox. */
export function statesGrouped(): {
  pilot: UsState[];
  quickAccess: UsState[];
  rest: UsState[];
} {
  return {
    pilot: US_STATES.filter((s) => s.block === 1),
    quickAccess: US_STATES.filter((s) => s.block === 2),
    rest: US_STATES.filter((s) => s.block === 3),
  };
}
