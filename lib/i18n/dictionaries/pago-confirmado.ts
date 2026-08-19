/**
 * LA VUELTA DE STRIPE — el instante entre el cobro y la cuenta.
 *
 * Tres frases y ya. Nadie se queda aquí: la pantalla anota el pago y sigue
 * al registro. Existe porque volver de otro dominio a una página en blanco,
 * justo después de haber pagado, se lee como que algo salió mal.
 *
 * Lo que NO dice: ni el importe ni los cuatro últimos dígitos de nada. El
 * recibo lo manda Stripe, que es quien cobró; repetirlo aquí sería fingir
 * que el cobro lo tenemos nosotros.
 */

const es = {
  title: "Pago recibido",
  heading: "Listo, tu pago entró.",
  body: "Ahora sólo falta tu cuenta. Es un paso y lo tienes delante.",
  llevando: "Llevándote a crear tu cuenta…",
};

const en: typeof es = {
  title: "Payment received",
  heading: "Done, your payment went through.",
  body: "All that is left is your account. It is one step, and it is right here.",
  llevando: "Taking you to create your account…",
};

export const pagoConfirmado = { es, en };
