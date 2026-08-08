"use client";

/**
 * Solicitud de restablecimiento de contraseña (§0.2-B).
 *
 * REGLA DURA (§9 / riesgo R5): la respuesta es SIEMPRE la misma exista o no
 * la cuenta. Si aquí se dijera "no encontramos ese correo", cualquiera podría
 * usar el formulario para averiguar quién está registrado en ANDEX — con una
 * base de usuarios migrantes eso no es un detalle, es un riesgo real.
 * Los únicos errores que se muestran son los que no revelan nada: formato
 * inválido, límite de envíos y falta de conexión.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { ROUTES } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { isValidEmail } from "@/lib/utils";
import { requestPasswordReset } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthHeading } from "./auth-heading";
import { FormAlert } from "./form-alert";
import { focusField } from "./focus";

const EMAIL_ID = "recuperar-email";
/** Mismo minuto que anuncia el copy de `rateLimitedEmail`. */
const RESEND_COOLDOWN_S = 60;

export function RecuperarForm({ lang }: { lang: Lang }) {
  const dict = getDictionary(lang);
  const t = dict.auth;

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function send(): Promise<void> {
    if (pending) return;

    if (email.trim().length === 0 || !isValidEmail(email)) {
      const message =
        email.trim().length === 0 ? t.errors.emailRequired : t.errors.emailInvalid;
      setFieldError(message);
      setFormError(null);
      focusField(EMAIL_ID);
      return;
    }

    setFieldError(undefined);
    setFormError(null);
    setPending(true);

    const result = await requestPasswordReset(email);
    setPending(false);

    if (!result.ok) {
      setFormError(result.error ?? t.errors.unknown);
      return;
    }

    setSentTo(email.trim());
    setCooldown(RESEND_COOLDOWN_S);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await send();
  }

  if (sentTo) {
    return (
      <div>
        <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-teal-soft">
          <MailCheck aria-hidden="true" className="size-6 text-teal-deep" />
        </div>
        <h1 className="font-heading text-h2 text-ink">{t.recuperar.sentTitle}</h1>
        <p className="mt-2 text-body text-muted">{t.recuperar.sentBody(sentTo)}</p>

        <FormAlert message={formError} className="mt-4" />

        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => void send()}
            loading={pending}
            loadingLabel={t.shared.submitting}
            disabled={cooldown > 0}
          >
            {t.recuperar.resend}
          </Button>
          {cooldown > 0 ? (
            <p aria-live="polite" className="text-caption text-muted">
              {t.recuperar.resendWait(cooldown)}
            </p>
          ) : null}
        </div>

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

  return (
    <div>
      <AuthHeading
        eyebrow={t.recuperar.eyebrow}
        title={t.recuperar.title}
        subtitle={t.recuperar.subtitle}
      />

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id={EMAIL_ID}
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
          enterKeyHint="send"
          maxLength={254}
          aria-required="true"
          error={fieldError}
        />

        <FormAlert message={formError} />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={pending}
          loadingLabel={t.shared.submitting}
        >
          {t.recuperar.submit}
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
