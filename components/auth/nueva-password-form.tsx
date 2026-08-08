"use client";

/**
 * Nueva contraseña, tras abrir el enlace del correo (§0.2-B).
 *
 * Modo real: al llegar aquí `/callback` ya cambió el código por una sesión de
 * recuperación, así que `updatePassword()` puede escribir. Si el enlace venció
 * o ya se usó no hay sesión y el error lo dice con esas palabras.
 *
 * Modo demo: no existe contraseña que cambiar; la pantalla se recorre igual
 * para poder validar el flujo completo sin credenciales.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import {
  MIN_PASSWORD_LENGTH,
  resolvePostAuthRouteForCurrentUser,
  updatePassword,
} from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { AuthHeading } from "./auth-heading";
import { FormAlert } from "./form-alert";
import { PasswordField } from "./password-field";
import { focusField } from "./focus";

const FIELD_IDS = {
  password: "nueva-password",
  confirm: "nueva-password-confirmar",
} as const;

type FieldErrors = { password?: string; confirm?: string };

export function NuevaPasswordForm({ lang }: { lang: Lang }) {
  const router = useRouter();
  const dict = getDictionary(lang);
  const t = dict.auth;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const nextErrors: FieldErrors = {};
    if (password.length === 0) nextErrors.password = t.errors.passwordRequired;
    else if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = t.errors.passwordTooShort;
    } else if (password !== confirmPassword) {
      nextErrors.confirm = t.errors.passwordMismatch;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError(dict.common.errors.formInvalid);
      focusField(nextErrors.password ? FIELD_IDS.password : FIELD_IDS.confirm);
      return;
    }

    setFormError(null);
    setPending(true);

    const result = await updatePassword({ password, confirmPassword });
    if (!result.ok) {
      setPending(false);
      setFormError(result.error);
      return;
    }

    toast.success(t.success.passwordChanged);
    // El copy del botón es "Guardar y entrar": el usuario ya tiene sesión,
    // así que sigue por donde iba en el embudo (§3).
    const target = await resolvePostAuthRouteForCurrentUser();
    router.replace(target);
    router.refresh();
  }

  return (
    <div>
      <AuthHeading
        eyebrow={t.recuperar.eyebrow}
        title={t.recuperar.newPasswordTitle}
        subtitle={t.shared.passwordHelp}
      />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        <PasswordField
          id={FIELD_IDS.password}
          label={t.recuperar.newPasswordLabel}
          placeholder={t.shared.passwordPlaceholder}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          showLabel={t.shared.passwordShow}
          hideLabel={t.shared.passwordHide}
          error={errors.password}
          meter
          strengthLabels={t.passwordStrength}
        />

        <PasswordField
          id={FIELD_IDS.confirm}
          label={t.recuperar.newPasswordConfirmLabel}
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          showLabel={t.shared.passwordShow}
          hideLabel={t.shared.passwordHide}
          error={errors.confirm}
        />

        <FormAlert message={formError} />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={pending}
          loadingLabel={t.shared.submitting}
        >
          {t.recuperar.newPasswordSubmit}
        </Button>
      </form>

      <p className="mt-6 border-t border-line pt-5">
        <Link
          href={ROUTES.login}
          className="text-body font-medium text-teal-deep underline underline-offset-4"
        >
          {t.recuperar.backToLogin}
        </Link>
      </p>
    </div>
  );
}
