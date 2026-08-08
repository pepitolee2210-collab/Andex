/**
 * Envoltura de las pantallas de autenticación (/registro, /login, /recuperar).
 *
 * Sobria a propósito: aquí el usuario no viene a leer, viene a entrar. Marca
 * arriba (y de paso, salida hacia la landing), controles de idioma y tema, y
 * una sola tarjeta centrada.
 *
 * La Ruta (§2.8) NO aparece: su sitio es el hero de la landing, el wizard y el
 * paywall. En auth no diría nada verdadero sobre dónde está el usuario.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { COOKIES, ROUTES } from "@/lib/config";
import { PATHNAME_HEADER, safeInternalPath } from "@/lib/auth/routing";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const lang = await getLang();
  const dict = getDictionary(lang);

  const requestHeaders = await headers();
  // El middleware publica la ruta actual: el toggle de idioma vuelve aquí
  // mismo en vez de mandar al usuario a la landing a medio formulario.
  const backPath = safeInternalPath(requestHeaders.get(PATHNAME_HEADER)) ?? ROUTES.login;

  const cookieStore = await cookies();
  const themeCookie = cookieStore.get(COOKIES.theme)?.value;
  const initialTheme =
    themeCookie === "dark" || themeCookie === "light" ? themeCookie : "system";

  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-surface focus:px-4 focus:text-body focus:text-ink focus:shadow-md"
      >
        {dict.common.nav.skipToContent}
      </a>

      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 pb-2 pt-5 sm:pt-8">
        <Link
          href={ROUTES.landing}
          className="inline-flex min-h-11 items-center gap-2 rounded-md pr-2 text-ink"
          title={dict.common.brand.tagline}
        >
          <ArrowLeft aria-hidden="true" className="size-4 shrink-0 text-muted" />
          <span className="font-heading text-h3 tracking-tight">
            {dict.common.brand.name}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle
            lang={lang}
            backPath={backPath}
            ariaLabel={dict.common.lang.ariaSwitch}
          />
          <ThemeToggle
            initialTheme={initialTheme}
            ariaLabel={dict.common.theme.ariaSwitch}
            labels={{
              light: dict.common.theme.light,
              dark: dict.common.theme.dark,
              system: dict.common.theme.system,
            }}
          />
        </div>
      </header>

      <main
        id="contenido"
        className="flex w-full flex-1 justify-center px-4 py-6 sm:items-center sm:py-10"
      >
        <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5 shadow-md sm:p-8">
          {children}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-md px-4 pb-6 text-center">
        <p className="text-caption text-muted">{dict.common.brand.tagline}</p>
      </footer>
    </div>
  );
}
