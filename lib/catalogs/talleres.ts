/**
 * TALLERES — catálogo semilla.
 *
 * ⚠️ ESTO ES TEMPORAL Y ESTÁ HECHO PARA MORIR. La forma de cada objeto es
 * exactamente la de `workshop_series` en `0007_comunidad.sql`, así que el
 * día que exista el panel de administración lo único que cambia es de dónde
 * salen los datos: de aquí a una consulta. Ni un componente se entera.
 *
 * Por eso los campos son planos y serializables, sin funciones ni clases.
 *
 * ── El enlace va vacío a propósito ──
 *
 * `joinUrl: null` en las dos series. No es un olvido: un enlace de Zoom fijo
 * que nunca cambia deja entrar para siempre a cualquiera que lo consiga una
 * vez, y basta con que alguien lo reenvíe por WhatsApp. En una sala donde
 * una persona va a decir en voz alta, con su cara y su nombre visibles, que
 * tiene una audiencia en corte de inmigración, eso no es una fuga de
 * negocio: es una lista de asistencia para quien la quiera.
 *
 * Lo correcto es una reunión programada con ID único por sesión y sala de
 * espera. Mientras eso no exista, la interfaz enseña el horario y dice la
 * verdad —"todavía no hay enlace"— en vez de publicar uno que no debería
 * publicarse.
 */

import type { Weekday, Workshop } from "@/lib/community/schedule";

export type WorkshopSeed = Workshop & {
  slug: string;
  /** Oficios a los que sirve. Vacío = interesa a todo el mundo. */
  occupationTags: readonly string[];
  /** Módulo del catálogo §7.4 con el que se relaciona. */
  moduleId: number | null;
  /**
   * Quién lo conduce y con qué credencial.
   *
   * `hostCredential` no es un adorno de currículum: es lo que decide qué
   * puede prometer el copy. Sin alguien habilitado delante, un taller NO
   * puede ofrecer evaluación de casos concretos — eso es asesoría legal, y
   * es la misma línea que el Anexo B del PRD ya obligó a respetar con lo de
   * "notario".
   */
  hostName: string | null;
  hostCredential: string | null;
};

/** Martes a viernes. */
const MARTES_A_VIERNES: readonly Weekday[] = [2, 3, 4, 5];

const UTAH = "America/Denver";

export const TALLERES: readonly WorkshopSeed[] = [
  {
    id: "entender-tu-carta",
    slug: "entender-tu-carta",
    // Antes se llamaba "Evalúa tu caso en vivo". Se cambió por dos motivos
    // que no son de estilo: evaluar un caso concreto es asesoría legal, y
    // hacerlo en grupo expone el caso de una persona a los otros cuarenta.
    // Explicar qué significa una carta y qué plazos corren da el mismo
    // valor sin ninguna de las dos cosas.
    occupationTags: [],
    moduleId: 1,
    weekdays: MARTES_A_VIERNES,
    startMinutes: 18 * 60,
    endMinutes: 19 * 60,
    timeZone: UTAH,
    joinUrl: null,
    hostName: null,
    hostCredential: null,
  },
  {
    id: "ingles-para-el-trabajo",
    slug: "ingles-para-el-trabajo",
    // No es un curso de inglés: es el inglés de una entrevista concreta.
    // Por eso lleva etiquetas de oficio — las mismas de `work_profile` y
    // `job_postings`— y por eso puede aparecer dentro de una vacante:
    // "esta pide inglés básico; el taller del jueves lo enseña".
    occupationTags: ["limpieza", "mesero", "ninera", "jardineria", "construccion", "bodega"],
    moduleId: 7,
    weekdays: MARTES_A_VIERNES,
    startMinutes: 19 * 60,
    endMinutes: 20 * 60,
    timeZone: UTAH,
    joinUrl: null,
    hostName: null,
    hostCredential: null,
  },
] as const;

export function workshopBySlug(slug: string): WorkshopSeed | undefined {
  return TALLERES.find((t) => t.slug === slug);
}
