"use client";

/**
 * Formulario de inicio de sesión (§0.2-B).
 *
 * Destino tras entrar, por orden:
 *   1. `next` — la pantalla que el usuario pidió y el middleware interceptó
 *      (ya validada como ruta interna en el servidor, §9).
 *   2. `resolvePostAuthRouteForCurrentUser()` — la regla del embudo (§3):
 *      sin perfil → /entrevista · con perfil sin membresía → /membresia ·
 *      con membresía vigente → /panel (§3.4.7).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES, isDemoMode } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { isValidEmail } from "@/lib/utils";
import {
  resolvePostAuthRouteForCurrentUser,
  signInWithMagicLink,
  signInWithPassword,
} from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { AuthHeading } from "./auth-heading";
import { FormAlert } from "./form-alert";
import { MagicLinkSent } from "./magic-link-sent";
import { OrDivider } from "./or-divider";
import { PasswordField } from "./password-field";
import { focusField } from "./focus";

const FIELD_IDS = {
  email: "login-email",
  password: "login-password",
} as const;

type FieldErrors = { email?: string; password?: string };
type Pending = "none" | "password" | "magic";

export type LoginFormProps = {
  lang: Lang;
  /** Ruta interna validada en el servidor, o null. */
  next: string | null;
  /** Mensaje ya traducido que viene de `/callback` (enlace vencido, etc.). */
  initialError: string | null;
};

export function LoginForm({ lang, next, initialError }: LoginFormProps) {
  const router = useRouter();
  const dict = getDictionary(lang);
  const t = dict.auth;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(initialError);
  const [pending, setPending] = useState<Pending>("none");
  const [magicSentTo, setMagicSentTo] = useState<string | null>(null);

  async function goAfterAuth() {
    const target = next ?? (await resolvePostAuthRouteForCurrentUser());
    router.replace(target);
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending !== "none") return;

    const nextErrors: FieldErrors = {};
    if (email.trim().length === 0) nextErrors.email = t.errors.emailRequired;
    else if (!isValidEmail(email)) nextErrors.email = t.errors.emailInvalid;
    if (password.length === 0) nextErrors.password = t.errors.passwordRequired;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError(dict.common.errors.formInvalid);
      focusField(nextErrors.email ? FIELD_IDS.email : FIELD_IDS.password);
      return;
    }

    setFormError(null);
    setPending("password");

    const result = await signInWithPassword({ email, password });
    if (!result.ok) {
      setPending("none");
      setFormError(result.error);
      focusField(FIELD_IDS.password);
      return;
    }

    toast.success(t.success.loggedIn);
    await goAfterAuth();
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
      toast.success(t.success.loggedIn);
      await goAfterAuth();
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
        eyebrow={t.login.eyebrow}
        title={t.login.title}
        subtitle={t.login.subtitle}
      />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        <div>
          <PasswordField
            id={FIELD_IDS.password}
            label={t.shared.passwordLabel}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            showLabel={t.shared.passwordShow}
            hideLabel={t.shared.passwordHide}
            error={errors.password}
          />
          <Link
            href={ROUTES.recuperar}
            className="mt-2 inline-flex min-h-11 items-center text-body text-teal-deep underline underline-offset-4"
          >
            {t.login.forgot}
          </Link>
        </div>

        <FormAlert message={formError} />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={pending === "password"}
          loadingLabel={t.shared.submitting}
          disabled={pending === "magic"}
        >
          {t.login.submit}
        </Button>
      </form>

      <OrDivider label={t.shared.or} />

      <Button
        variant="secondary"
        fullWidth
        onClick={handleMagicLink}
        loading={pending === "magic"}
        loadingLabel={t.shared.submitting}
        disabled={pending === "password"}
      >
        {t.login.magicLink}
      </Button>

      <p className="mt-6 border-t border-line pt-5 text-body text-muted">
        {t.login.noAccount}{" "}
        <Link
          href={ROUTES.registro}
          className="font-medium text-teal-deep underline underline-offset-4"
        >
          {t.login.noAccountLink}
        </Link>
      </p>
    </div>
  );
}
