"use client";

/**
 * Pantalla de "enlace enviado" (modo real). Sustituye al formulario para que
 * quede claro que la pelota está en el correo del usuario, no aquí.
 *
 * En modo demo no se llega nunca: sin servidor de correo, el enlace se
 * "toca" solo y la sesión se abre al instante (lib/auth/client.ts).
 */

import { MailCheck } from "lucide-react";
import type { Lang } from "@/lib/types";
import { getDictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export type MagicLinkSentProps = {
  lang: Lang;
  email: string;
  /** Vuelve al formulario con el correo cargado, para corregirlo. */
  onChangeEmail: () => void;
};

export function MagicLinkSent({ lang, email, onChangeEmail }: MagicLinkSentProps) {
  const dict = getDictionary(lang).auth;

  return (
    <div>
      <div className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-teal-soft">
        <MailCheck aria-hidden="true" className="size-6 text-teal-deep" />
      </div>
      <h1 className="font-heading text-h2 text-ink">{dict.magicLink.sentTitle}</h1>
      <p className="mt-2 text-body text-muted">{dict.magicLink.sentBody(email)}</p>

      <div className="mt-6 border-t border-line pt-4">
        <p className="text-body text-muted">{dict.magicLink.wrongEmail}</p>
        <Button
          variant="ghost"
          onClick={onChangeEmail}
          className="mt-1 -ml-2 px-2 underline underline-offset-4"
        >
          {dict.magicLink.wrongEmailLink}
        </Button>
      </div>
    </div>
  );
}
