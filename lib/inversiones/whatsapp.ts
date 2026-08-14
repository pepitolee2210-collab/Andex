/**
 * EL ENLACE DE WHATSAPP — donde termina el ciclo de Inversiones.
 *
 * Toda la sección desemboca aquí: la persona lee una oportunidad y escribe.
 * Por eso este archivo es pequeño y está probado — es el único punto donde
 * el módulo puede fallar de una forma que nadie note hasta que se pierda un
 * contacto.
 *
 * ── Lo que este enlace NO lleva ──
 *
 * §9 del PRD: **ninguna respuesta del usuario viaja en la URL.** El mensaje
 * previo dice de qué oportunidad se viene y nada más. Ni nombre, ni correo,
 * ni estado, ni lo que contestó en la entrevista.
 *
 * No es purismo: `wa.me` es un enlace que queda en el historial del
 * navegador, en el portapapeles si alguien lo copia y en los registros de
 * cualquier proxy por el que pase. Meter ahí el nombre de una persona
 * indocumentada es un riesgo real por una comodidad mínima — y el negocio
 * puede preguntarle el nombre en el primer mensaje, que es donde se
 * pregunta.
 */

/** Deja sólo dígitos: `+1 (801) 555-0100` → `18015550100`. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Comprueba que un número sirve para `wa.me`.
 *
 * WhatsApp exige el formato internacional completo, sin `+` ni signos. Un
 * número local de 10 dígitos "funciona" en el enlace pero abre un chat con
 * un desconocido en otro país, así que se exige el prefijo: mínimo 11.
 */
export function isValidWhatsAppPhone(raw: string): boolean {
  const digits = normalizePhone(raw);
  return digits.length >= 11 && digits.length <= 15;
}

export type WhatsAppLinkOptions = {
  /** Número del negocio, en formato internacional. */
  phone: string;
  /** Mensaje ya escrito. Debe describir la oportunidad, NUNCA a la persona. */
  message: string;
};

/**
 * Construye el enlace.
 *
 * Devuelve `null` si el número no sirve. Un `null` explícito obliga a la
 * pantalla a decidir qué enseñar; la alternativa —devolver una cadena rota—
 * pinta un botón que abre WhatsApp con un chat vacío y la persona cree que
 * escribió y nadie le contesta nunca.
 */
export function buildWhatsAppLink(options: WhatsAppLinkOptions): string | null {
  if (!isValidWhatsAppPhone(options.phone)) return null;
  const phone = normalizePhone(options.phone);
  const text = encodeURIComponent(options.message.trim());
  return `https://wa.me/${phone}?text=${text}`;
}

/**
 * El mensaje previo.
 *
 * Escrito en primera persona y ya terminado: quien lo envía no tiene que
 * redactar nada. Para mucha gente de este público, escribir el primer
 * mensaje a un negocio en un idioma que no domina del todo es justo la
 * fricción que hace que no escriba.
 */
export function opportunityMessage(template: string, title: string): string {
  return template.replace("{opportunity}", title);
}
