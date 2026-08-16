/**
 * LOS ENLACES DE LA TIENDA — salir de ANDEX sin dejar rastro.
 *
 * Cada miniaplicación vive fuera del producto. Eso obliga a dos cosas que
 * aquí se comprueban con pruebas, porque son fáciles de romper sin darse
 * cuenta:
 *
 * **1 · Ningún dato del usuario viaja en la URL.**
 * §9 del PRD. Un enlace externo queda en el historial, en el portapapeles y
 * en los registros de cualquier proxy por el que pase. Con este público —y
 * con temas como una audiencia en corte— eso es un riesgo real, no una
 * formalidad. Si un enlace trae parámetros que parezcan datos personales,
 * se rechaza entero en vez de limpiarlo a medias.
 *
 * **2 · Sólo `https`.**
 * Un enlace `http:` viaja en claro. Y `javascript:` o `data:` en un `href`
 * son ejecución de código: aunque el catálogo lo escriba el equipo, esto
 * pasa por i18n y por variables de entorno, y un fallo ahí no puede
 * convertirse en un agujero.
 */

/** Parámetros que delatan que alguien metió un dato personal en la URL. */
const PARAMETROS_PROHIBIDOS = [
  "name", "nombre", "email", "correo", "phone", "telefono", "tel",
  "user", "usuario", "uid", "id", "token", "session", "estado", "state",
  "case", "caso", "a-number", "anumber", "dob", "ssn", "itin",
];

export type EnlaceInvalido =
  | { ok: false; motivo: "vacio" }
  | { ok: false; motivo: "no-es-https" }
  | { ok: false; motivo: "lleva-datos"; parametro: string };

export type EnlaceValido = { ok: true; url: string; dominio: string };

export type ResultadoEnlace = EnlaceValido | EnlaceInvalido;

/**
 * Valida el enlace de una miniaplicación.
 *
 * Devuelve un resultado explícito en vez de lanzar o de devolver `null`: la
 * pantalla necesita saber POR QUÉ falla para decidir si enseña un aviso o
 * simplemente no pinta la tarjeta.
 */
export function validarEnlace(bruto: string | undefined | null): ResultadoEnlace {
  const valor = (bruto ?? "").trim();
  if (!valor) return { ok: false, motivo: "vacio" };

  let url: URL;
  try {
    url = new URL(valor);
  } catch {
    return { ok: false, motivo: "no-es-https" };
  }

  if (url.protocol !== "https:") return { ok: false, motivo: "no-es-https" };

  for (const [clave] of url.searchParams) {
    if (PARAMETROS_PROHIBIDOS.includes(clave.toLowerCase())) {
      return { ok: false, motivo: "lleva-datos", parametro: clave };
    }
  }

  return { ok: true, url: url.toString(), dominio: url.hostname.replace(/^www\./, "") };
}

/** El dominio, para poder enseñarle a la persona a dónde va antes de ir. */
export function dominioDe(bruto: string | undefined | null): string | null {
  const r = validarEnlace(bruto);
  return r.ok ? r.dominio : null;
}
