/**
 * ANDEX i18n — AUTENTICACIÓN (registro, login, magic link, recuperación).
 *
 * Regla §2.7: los errores dicen QUÉ pasó y CÓMO resolverlo.
 * Nunca se disculpan ("lo sentimos"), nunca son vagos ("algo salió mal").
 */

import type { Lang } from "@/lib/types";

const es = {
  shared: {
    emailLabel: "Correo electrónico",
    emailPlaceholder: "tunombre@correo.com",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "Mínimo 8 caracteres",
    passwordShow: "Mostrar contraseña",
    passwordHide: "Ocultar contraseña",
    passwordHelp: "Usa al menos 8 caracteres. Mézclalos como quieras.",
    or: "o",
    submitting: "Un momento…",
  },

  registro: {
    eyebrow: "CREA TU CUENTA",
    title: "Empecemos por tu correo",
    subtitle:
      "Con esto guardamos tu avance. Si cierras la página, retomas donde quedaste.",
    submit: "Crear mi cuenta",
    magicLink: "Envíame un enlace de acceso",
    magicLinkHelp: "Sin contraseña: te llega un enlace y entras con un clic.",
    haveAccount: "¿Ya tienes cuenta?",
    haveAccountLink: "Inicia sesión",
    /** Consentimiento §3.4.6: afirmativo y expreso, nunca premarcado. */
    termsPrefix: "Al crear tu cuenta aceptas los",
    termsLink: "Términos de servicio",
    termsMiddle: "y la",
    privacyLink: "Política de privacidad",
    marketingOptIn:
      "Quiero recibir avisos de eventos y fechas límite por correo.",
  },

  login: {
    eyebrow: "BIENVENIDO DE VUELTA",
    title: "Entra a tu cuenta",
    subtitle: "Tu plan y tus respuestas siguen guardados.",
    submit: "Entrar",
    magicLink: "Entrar con un enlace por correo",
    forgot: "¿Olvidaste tu contraseña?",
    noAccount: "¿Todavía no tienes cuenta?",
    noAccountLink: "Créala en un minuto",
  },

  recuperar: {
    eyebrow: "RECUPERAR ACCESO",
    title: "Te mandamos un enlace para cambiar tu contraseña",
    subtitle:
      "Escribe el correo con el que te registraste y revisa tu bandeja de entrada.",
    submit: "Enviar enlace",
    backToLogin: "Volver a iniciar sesión",
    sentTitle: "Revisa tu correo",
    sentBody: (email: string) =>
      `Enviamos el enlace a ${email}. Vence en 1 hora. Si no aparece en unos minutos, busca en la carpeta de spam o correo no deseado.`,
    resend: "Enviar de nuevo",
    resendWait: (seconds: number) =>
      `Puedes pedir otro enlace en ${seconds} segundos.`,
    newPasswordTitle: "Elige tu nueva contraseña",
    newPasswordLabel: "Nueva contraseña",
    newPasswordConfirmLabel: "Repite la nueva contraseña",
    newPasswordSubmit: "Guardar y entrar",
  },

  magicLink: {
    sentTitle: "Enlace enviado",
    sentBody: (email: string) =>
      `Abre el correo que llegó a ${email} y toca el botón para entrar. El enlace sirve una sola vez y vence en 1 hora.`,
    openMailApp: "Abrir mi correo",
    wrongEmail: "¿Escribiste mal el correo?",
    wrongEmailLink: "Cámbialo y vuelve a enviar",
    verifying: "Verificando tu enlace…",
  },

  /**
   * ERRORES ESPECÍFICOS §2.7. Cada uno nombra la causa y da la salida.
   * Las claves de Supabase/Stripe se mapean a estas entradas en el feature.
   */
  errors: {
    emailRequired: "Escribe tu correo para continuar.",
    emailInvalid:
      "Ese correo no tiene un formato válido. Revisa que lleve @ y el dominio completo, como nombre@correo.com.",
    passwordRequired: "Escribe tu contraseña para continuar.",
    passwordTooShort:
      "Tu contraseña necesita al menos 8 caracteres. Agrega unos cuantos más.",
    passwordMismatch:
      "Las dos contraseñas no coinciden. Escríbelas otra vez con cuidado.",
    invalidCredentials:
      "El correo o la contraseña no coinciden. Revisa ambos, o pide un enlace de acceso por correo.",
    emailAlreadyRegistered:
      "Ya existe una cuenta con este correo. Inicia sesión, o recupera tu contraseña si no la recuerdas.",
    emailNotFound:
      "No encontramos una cuenta con este correo. Revisa que esté bien escrito o crea tu cuenta.",
    emailNotConfirmed:
      "Falta confirmar tu correo. Abre el mensaje que te enviamos y toca el botón de confirmación.",
    linkExpired:
      "Este enlace ya venció. Los enlaces duran 1 hora; pide uno nuevo y úsalo enseguida.",
    linkAlreadyUsed:
      "Este enlace ya se usó. Pide uno nuevo para entrar.",
    tooManyAttempts:
      "Hubo demasiados intentos seguidos desde este dispositivo. Espera 15 minutos y vuelve a intentar.",
    rateLimitedEmail:
      "Acabamos de enviarte un correo. Espera un minuto antes de pedir otro.",
    weakPassword:
      "Esta contraseña es fácil de adivinar. Cámbiala por una más larga o menos común.",
    samePassword:
      "Esa es la contraseña que ya tenías. Escribe una distinta.",
    /** §3.4.6: el consentimiento es afirmativo y expreso; sin él no hay alta. */
    termsRequired:
      "Necesitas aceptar los términos para crear tu cuenta.",
    sessionExpired:
      "Tu sesión se cerró por inactividad. Entra de nuevo y sigues donde ibas.",
    network:
      "No hay conexión con el servidor. Revisa tu internet y toca Reintentar.",
    unknown:
      "El servidor rechazó la petición. Espera un momento y vuelve a intentar; tu cuenta no cambió.",
  },

  /**
   * Medidor de fuerza del campo de contraseña. Es orientativo: el requisito
   * duro (8 caracteres) lo dice `shared.passwordHelp` con palabras y es lo
   * que se valida. Estas etiquetas se anuncian, no son decoración.
   */
  passwordStrength: {
    weak: "Débil",
    medium: "Media",
    strong: "Fuerte",
  },

  success: {
    accountCreated: "Cuenta creada. Vamos a armar tu plan.",
    loggedIn: "Ya entraste.",
    passwordChanged: "Tu contraseña quedó cambiada.",
  },
};

export type AuthDict = typeof es;

const en = {
  shared: {
    emailLabel: "Email",
    emailPlaceholder: "yourname@email.com",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 8 characters",
    passwordShow: "Show password",
    passwordHide: "Hide password",
    passwordHelp: "Use at least 8 characters. Mix them however you like.",
    or: "or",
    submitting: "One moment…",
  },

  registro: {
    eyebrow: "CREATE YOUR ACCOUNT",
    title: "Let's start with your email",
    subtitle:
      "This saves your progress. If you close the page, you pick up where you left off.",
    submit: "Create my account",
    magicLink: "Send me a sign-in link",
    magicLinkHelp: "No password: we email you a link and you're in with one click.",
    haveAccount: "Already have an account?",
    haveAccountLink: "Log in",
    termsPrefix: "By creating your account you accept the",
    termsLink: "Terms of Service",
    termsMiddle: "and the",
    privacyLink: "Privacy Policy",
    marketingOptIn: "Email me about events and deadlines.",
  },

  login: {
    eyebrow: "WELCOME BACK",
    title: "Log in to your account",
    subtitle: "Your plan and your answers are still saved.",
    submit: "Log in",
    magicLink: "Log in with an emailed link",
    forgot: "Forgot your password?",
    noAccount: "Don't have an account yet?",
    noAccountLink: "Create one in a minute",
  },

  recuperar: {
    eyebrow: "RECOVER ACCESS",
    title: "We'll email you a link to change your password",
    subtitle: "Enter the email you signed up with and check your inbox.",
    submit: "Send link",
    backToLogin: "Back to log in",
    sentTitle: "Check your email",
    sentBody: (email: string) =>
      `We sent the link to ${email}. It expires in 1 hour. If it doesn't show up in a few minutes, check your spam or junk folder.`,
    resend: "Send again",
    resendWait: (seconds: number) =>
      `You can request another link in ${seconds} seconds.`,
    newPasswordTitle: "Choose your new password",
    newPasswordLabel: "New password",
    newPasswordConfirmLabel: "Repeat the new password",
    newPasswordSubmit: "Save and log in",
  },

  magicLink: {
    sentTitle: "Link sent",
    sentBody: (email: string) =>
      `Open the email we sent to ${email} and tap the button to log in. The link works once and expires in 1 hour.`,
    openMailApp: "Open my email",
    wrongEmail: "Typed the wrong email?",
    wrongEmailLink: "Change it and send again",
    verifying: "Verifying your link…",
  },

  errors: {
    emailRequired: "Enter your email to continue.",
    emailInvalid:
      "That email isn't in a valid format. Make sure it has an @ and the full domain, like name@email.com.",
    passwordRequired: "Enter your password to continue.",
    passwordTooShort:
      "Your password needs at least 8 characters. Add a few more.",
    passwordMismatch:
      "The two passwords don't match. Type them again carefully.",
    invalidCredentials:
      "That email and password don't match. Check both, or request a sign-in link by email.",
    emailAlreadyRegistered:
      "An account with this email already exists. Log in, or recover your password if you don't remember it.",
    emailNotFound:
      "We couldn't find an account with this email. Check the spelling or create your account.",
    emailNotConfirmed:
      "Your email still needs confirming. Open the message we sent and tap the confirmation button.",
    linkExpired:
      "This link expired. Links last 1 hour; request a new one and use it right away.",
    linkAlreadyUsed: "This link was already used. Request a new one to log in.",
    tooManyAttempts:
      "Too many attempts in a row from this device. Wait 15 minutes and try again.",
    rateLimitedEmail:
      "We just sent you an email. Wait a minute before requesting another.",
    weakPassword:
      "This password is easy to guess. Change it for a longer or less common one.",
    samePassword: "That's the password you already had. Choose a different one.",
    termsRequired: "You need to accept the terms to create your account.",
    sessionExpired:
      "Your session closed after being idle. Log in again and you'll continue where you were.",
    network:
      "We can't reach the server. Check your internet connection and tap Try again.",
    unknown:
      "The server rejected the request. Wait a moment and try again; your account didn't change.",
  },

  passwordStrength: {
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
  },

  success: {
    accountCreated: "Account created. Let's build your plan.",
    loggedIn: "You're in.",
    passwordChanged: "Your password has been changed.",
  },
} satisfies AuthDict;

export const auth: Record<Lang, AuthDict> = { es, en };
