"use client";

/**
 * Formulario de registro (§0.2-B, §3: landing → REGISTRO → entrevista).
 *
 * Al crear la cuenta el usuario va SIEMPRE a `/entrevista`: el embudo no
 * enseña precio antes de haber armado el plan.
 *
 * Copy: `auth` para todo lo propio de la pantalla. La etiqueta del nombre se
 * toma de `wizard.step1.firstName` — es el mismo dato con el mismo nombre y
 * el diccionario de auth no lo trae (ver reporte del agente de Auth).
 *
 * Cumplimiento §3.4.6: la casilla de términos llega SIN marcar y el
 * consentimiento se registra con `TERMS_VERSION` al crear la cuenta.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES, isDemoMode } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { isValidEmail } from "@/lib/utils";
import {
  MIN_PASSWORD_LENGTH,
  signInWithMagicLink,
  signUpWithPassword,
} from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { AuthHeading } from "./auth-heading";
import { CheckboxField } from "./checkbox-field";
import { FormAlert } from "./form-alert";
import { MagicLinkSent } from "./magic-link-sent";
import { OrDivider } from "./or-divider";
import { PasswordField } from "./password-field";
import { focusField } from "./focus";

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
      className="font-medium text-teal-deep underline underline-offset-4"
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
    // §3: del registro se pasa a la entrevista, nunca al paywall.
    router.replace(ROUTES.entrevista);
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
      router.replace(ROUTES.entrevista);
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
    <div>
      <AuthHeading
        eyebrow={t.registro.eyebrow}
        title={t.registro.title}
        subtitle={t.registro.subtitle}
      />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id={FIELD_IDS.firstName}
          label={dict.wizard.step1.firstName.label}
          placeholder={dict.wizard.step1.firstName.placeholder}
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          autoComplete="given-name"
          autoCapitalize="words"
          enterKeyHint="next"
          maxLength={100}
          aria-required="true"
          error={errors.firstName}
        />

        <Input
          id={FIELD_IDS.email}
          label={t.shared.emailLabel}
          placeholder={t.shared.emailPlaceholder}
          type="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          maxLength={254}
          aria-required="true"
          error={errors.email}
        />

        <PasswordField
          id={FIELD_IDS.password}
          label={t.shared.passwordLabel}
          placeholder={t.shared.passwordPlaceholder}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          showLabel={t.shared.passwordShow}
          hideLabel={t.shared.passwordHide}
          help={t.shared.passwordHelp}
          error={errors.password}
          meter
          strengthLabels={t.passwordStrength}
        />

        <div className="flex flex-col gap-1">
          <CheckboxField
            id={FIELD_IDS.terms}
            checked={acceptedTerms}
            onChange={(checked) => {
              setAcceptedTerms(checked);
              if (checked) setTermsError(undefined);
            }}
            required
            error={termsError}
          >
            {t.registro.termsPrefix} <LegalLink href={ROUTES.terminos} label={t.registro.termsLink} />{" "}
            {t.registro.termsMiddle}{" "}
            <LegalLink href={ROUTES.privacidad} label={t.registro.privacyLink} />.
          </CheckboxField>

          <CheckboxField
            id="registro-marketing"
            checked={wantsMarketing}
            onChange={setWantsMarketing}
          >
            {t.registro.marketingOptIn}
          </CheckboxField>
        </div>

        <FormAlert message={formError} />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={pending === "signup"}
          loadingLabel={t.shared.submitting}
          disabled={pending === "magic"}
        >
          {t.registro.submit}
        </Button>
      </form>

      <OrDivider label={t.shared.or} />

      <Button
        variant="secondary"
        fullWidth
        onClick={handleMagicLink}
        loading={pending === "magic"}
        loadingLabel={t.shared.submitting}
        disabled={pending === "signup"}
      >
        {t.registro.magicLink}
      </Button>
      <p className="mt-2 text-caption text-muted">{t.registro.magicLinkHelp}</p>

      <p className="mt-6 border-t border-line pt-5 text-body text-muted">
        {t.registro.haveAccount}{" "}
        <Link
          href={ROUTES.login}
          className="font-medium text-teal-deep underline underline-offset-4"
        >
          {t.registro.haveAccountLink}
        </Link>
      </p>
    </div>
  );
}
