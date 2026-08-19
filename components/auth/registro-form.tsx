"use client";

/**
 * REGISTRO (§0.2-B, §3: landing → REGISTRO → entrevista).
 *
 * Réplica de `onboarding.jsx → Registro` del sistema de diseño con nuestro
 * contenido. Lo que manda en esta pantalla: «un campo por pantalla y el
 * aviso de para qué sirve el dato al lado del dato». Por eso los tres
 * campos van en una sola lista agrupada, cada uno con su nota debajo, y no
 * en tarjetas sueltas con la letra pequeña al final.
 *
 * El aviso de cifrado cierra la pantalla, junto al botón: es donde surge la
 * pregunta («¿qué van a hacer con mis papeles?»). Dice la promesa y su
 * límite en la misma frase, que es la regla del proyecto.
 *
 * Al crear la cuenta el usuario va SIEMPRE a `/entrevista`: el embudo no
 * enseña precio antes de haber armado el plan.
 *
 * Cumplimiento §3.4.6: la casilla de términos llega SIN marcar y el
 * consentimiento se registra con `TERMS_VERSION` al crear la cuenta.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { ROUTES, isDemoMode } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { cn, isValidEmail } from "@/lib/utils";
import {
  MIN_PASSWORD_LENGTH,
  signInWithMagicLink,
  signUpWithPassword,
} from "@/lib/auth/client";
import { Glyph, KitButton, KitNotice, ScreenHeader } from "@/components/ui/kit";
import { toast } from "@/components/ui/toaster";
import { CheckboxField } from "./checkbox-field";
import { FormAlert } from "./form-alert";
import { KitField, KIT_INPUT_CLASS } from "./kit-field";
import { MagicLinkSent } from "./magic-link-sent";
import { OrDivider } from "./or-divider";
import { focusField } from "./focus";
import { getDataStore } from "@/lib/data";
import { borrarPagoPendiente, leerPagoPendiente } from "@/lib/pago-pendiente";

const FIELD_IDS = {
  firstName: "registro-nombre",
  email: "registro-email",
  password: "registro-password",
  terms: "registro-terminos",
} as const;

type FieldErrors = {
  firstName?: string;
  email?: string;
  password?: string;
};

type Pending = "none" | "signup" | "magic";

/**
 * Enlace a una página legal desde dentro del formulario.
 *
 * Se abre en una pestaña nueva a propósito: leer los términos no puede
 * costarle al usuario el formulario a medio llenar. `rel="noopener
 * noreferrer"` es obligatorio con `target="_blank"` — sin él la página
 * abierta obtiene `window.opener` y puede redirigir la pestaña original.
 */
function LegalLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // El clic en el enlace no debe marcar/desmarcar la casilla que lo
      // envuelve: aceptar y leer son dos acciones distintas.
      onClick={(event) => event.stopPropagation()}
      className="font-semibold text-teal-deep underline underline-offset-4"
    >
      {label}
    </Link>
  );
}

export function RegistroForm({ lang }: { lang: Lang }) {
  const router = useRouter();
  const dict = getDictionary(lang);
  const t = dict.auth;

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [wantsMarketing, setWantsMarketing] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [termsError, setTermsError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>("none");
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);

  /**
   * §3.4.6: qué versión aceptó, cuándo y desde qué IP. Va por el servidor
   * (`/api/consent`) porque el navegador no conoce su propia IP.
   */
  async function recordConsents(): Promise<void> {
    try {
      await fetch("/api/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          consents: [
            { type: "terms", granted: true },
            { type: "privacy", granted: true },
            { type: "marketing", granted: wantsMarketing },
          ],
        }),
      });
    } catch {
      // El registro del consentimiento no puede tumbar el alta. El endpoint
      // deja rastro en el log del servidor si falla.
    }
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (firstName.trim().length === 0) {
      next.firstName = dict.wizard.step1.firstName.error;
    }
    if (email.trim().length === 0) next.email = t.errors.emailRequired;
    else if (!isValidEmail(email)) next.email = t.errors.emailInvalid;

    if (password.length === 0) next.password = t.errors.passwordRequired;
    else if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = t.errors.passwordTooShort;
    }
    return next;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending !== "none") return;

    const nextErrors = validate();
    const missingTerms = !acceptedTerms;
    setErrors(nextErrors);
    setTermsError(missingTerms ? t.errors.termsRequired : undefined);

    if (Object.keys(nextErrors).length > 0 || missingTerms) {
      // Si el único problema son los términos, el mensaje específico ya está
      // junto a la casilla: repetirlo arriba sería ruido.
      setFormError(
        Object.keys(nextErrors).length > 0 ? dict.common.errors.formInvalid : null,
      );
      // Foco al primer problema, en orden de lectura (§9).
      if (nextErrors.firstName) focusField(FIELD_IDS.firstName);
      else if (nextErrors.email) focusField(FIELD_IDS.email);
      else if (nextErrors.password) focusField(FIELD_IDS.password);
      else focusField(FIELD_IDS.terms);
      return;
    }

    setFormError(null);
    setPending("signup");

    const result = await signUpWithPassword({ email, password, firstName });
    if (!result.ok) {
      setPending("none");
      setFormError(result.error);
      focusField(FIELD_IDS.email);
      return;
    }

    await recordConsents();
    toast.success(t.success.accountCreated);
    router.replace(await destinoTrasCrear());
    router.refresh();
  }

  async function handleMagicLink() {
    if (pending !== "none") return;

    if (email.trim().length === 0 || !isValidEmail(email)) {
      const message =
        email.trim().length === 0 ? t.errors.emailRequired : t.errors.emailInvalid;
      setErrors((current) => ({ ...current, email: message }));
      setFormError(dict.common.errors.formInvalid);
      focusField(FIELD_IDS.email);
      return;
    }

    setFormError(null);
    setPending("magic");

    const result = await signInWithMagicLink(email);
    if (!result.ok) {
      setPending("none");
      setFormError(result.error ?? t.errors.unknown);
      return;
    }

    if (isDemoMode) {
      // Demo: el enlace se da por tocado y la sesión ya está abierta.
      toast.success(t.success.loggedIn);
      router.replace(await destinoTrasCrear());
      router.refresh();
      return;
    }

    setPending("none");
    setMagicSentTo(email.trim());
  }

  if (magicSentTo) {
    return (
      <MagicLinkSent
        lang={lang}
        email={magicSentTo}
        onChangeEmail={() => {
          setMagicSentTo(null);
          focusField(FIELD_IDS.email);
        }}
      />
    );
  }

  return (
    /**
     * El armazón de `/registro` envuelve la pantalla en una tarjeta blanca
     * con relleno propio. El diseño pone la lista agrupada sobre el fondo de
     * página, no sobre otra tarjeta, así que aquí se anula ese relleno y se
     * repinta el fondo. Lo correcto sería tocar el layout, pero está fuera
     * del alcance de esta pasada (ver informe).
     */
    <div className="-m-5 flex flex-col rounded-xl bg-page p-5 sm:-m-8 sm:p-8">
      <ScreenHeader title={t.registro.title} sub={t.registro.subtitle} />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col">
        {/* Los tres datos, en una sola lista: un dato por fila y su nota
            justo debajo. */}
        <div className="ax-group mt-5">
          <KitField
            id={FIELD_IDS.firstName}
            label={dict.wizard.step1.firstName.label}
            error={errors.firstName}
          >
            <input
              id={FIELD_IDS.firstName}
              type="text"
              className={cn(KIT_INPUT_CLASS, "w-full")}
              placeholder={dict.wizard.step1.firstName.placeholder}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              autoComplete="given-name"
              autoCapitalize="words"
              enterKeyHint="next"
              maxLength={100}
              aria-required="true"
              aria-invalid={errors.firstName ? true : undefined}
              aria-describedby={
                errors.firstName ? `${FIELD_IDS.firstName}-hint` : undefined
              }
            />
          </KitField>

          <KitField
            id={FIELD_IDS.email}
            label={t.shared.emailLabel}
            hint={dict.wizard.step1.email.help}
            error={errors.email}
          >
            <input
              id={FIELD_IDS.email}
              type="email"
              inputMode="email"
              className={cn(KIT_INPUT_CLASS, "w-full")}
              placeholder={t.shared.emailPlaceholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              maxLength={254}
              aria-required="true"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={`${FIELD_IDS.email}-hint`}
            />
          </KitField>

          <KitField
            id={FIELD_IDS.password}
            label={t.shared.passwordLabel}
            hint={t.shared.passwordHelp}
            error={errors.password}
            action={
              /* Icono y no texto: «Mostrar contraseña» son 19 caracteres que
                 se comen la mitad de la fila y dejan el valor recortado. */
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-pressed={showPassword}
                aria-label={
                  showPassword ? t.shared.passwordHide : t.shared.passwordShow
                }
                className="ax-iconbtn -my-3 shrink-0"
              >
                <Glyph
                  name={showPassword ? "eye-off" : "eye"}
                  icon={showPassword ? EyeOff : Eye}
                />
              </button>
            }
          >
            <input
              id={FIELD_IDS.password}
              type={showPassword ? "text" : "password"}
              className={cn(KIT_INPUT_CLASS, "w-full")}
              placeholder={t.shared.passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              enterKeyHint="done"
              aria-required="true"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={`${FIELD_IDS.password}-hint`}
            />
          </KitField>
        </div>

        {/* El consentimiento, con su salida al lado. */}
        <div className="mt-5">
          <CheckboxField
            id={FIELD_IDS.terms}
            checked={acceptedTerms}
            onChange={(checked) => {
              setAcceptedTerms(checked);
              if (checked) setTermsError(undefined);
            }}
            required
            error={termsError}
            meta={t.registro.termsMeta}
          >
            {t.registro.termsPrefix}{" "}
            <LegalLink href={ROUTES.terminos} label={t.registro.termsLink} />{" "}
            {t.registro.termsMiddle}{" "}
            <LegalLink href={ROUTES.privacidad} label={t.registro.privacyLink} />.
          </CheckboxField>

          <CheckboxField
            id="registro-marketing"
            checked={wantsMarketing}
            onChange={setWantsMarketing}
            meta={t.registro.marketingMeta}
          >
            {t.registro.marketingOptIn}
          </CheckboxField>
        </div>

        <FormAlert message={formError} />

        {/* La acción y, pegado a ella, el límite de lo que prometemos. */}
        <div className="mt-8 flex flex-col gap-3">
          <KitButton type="submit" wide disabled={pending !== "none"}>
            {pending === "signup" ? t.shared.submitting : t.registro.submit}
          </KitButton>

          <KitNotice iconName="lock" icon={Lock}>
            {t.registro.vaultNotice}
          </KitNotice>
        </div>
      </form>

      {/* La vía sin contraseña y la salida a la sesión existente: no están en
          el diseño, pero son funcionalidad nuestra y no pueden desaparecer. */}
      <OrDivider label={t.shared.or} />

      <KitButton
        kind="ghost"
        wide
        onClick={handleMagicLink}
        disabled={pending !== "none"}
      >
        {pending === "magic" ? t.shared.submitting : t.registro.magicLink}
      </KitButton>
      <p className="mt-2 text-caption text-muted">{t.registro.magicLinkHelp}</p>

      <p className="mt-6 border-t border-line pt-5 text-body text-muted">
        {t.registro.haveAccount}{" "}
        <Link
          href={ROUTES.login}
          className="font-semibold text-teal-deep underline underline-offset-4"
        >
          {t.registro.haveAccountLink}
        </Link>
      </p>
    </div>
  );
}

/**
 * A DÓNDE VA QUIEN ACABA DE CREAR LA CUENTA.
 *
 * El embudo nuevo cobra ANTES de registrar, así que aquí puede haber un pago
 * esperando. Si lo hay: se activa la membresía sobre la cuenta recién creada,
 * se borra el registro —dejarlo activaría la membresía del siguiente que use
 * este navegador, y este público comparte teléfono más de lo que se suele
 * suponer— y se aterriza en la comunidad, que es donde está la gente.
 *
 * Si NO lo hay, se sigue por el embudo de siempre: la entrevista.
 */
async function destinoTrasCrear(): Promise<string> {
  const pendiente = leerPagoPendiente();
  if (!pendiente) return ROUTES.entrevista;

  try {
    const store = getDataStore();
    await store.activateDemoSubscription?.(pendiente.plan);
  } catch {
    /* Si la activación falla, la cuenta ya existe y el cobro está anotado:
       mejor entrar y que el perfil enseñe el estado real que quedarse en una
       pantalla en blanco. */
  }
  borrarPagoPendiente();
  return ROUTES.comunidad;
}
