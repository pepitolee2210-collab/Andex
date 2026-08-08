import { ROUTES } from "@/lib/config";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";

/**
 * 404 sobrio (§2.8: "todo lo demás es disciplinado y silencioso").
 * Sin La Ruta, sin sello, sin ilustración: un error no es una pantalla de
 * producto. El copy sale de `common.errors` — dice qué pasó y cómo salir
 * de ahí (§2.7).
 */

export default async function NotFound() {
  const dict = getDictionary(await getLang());

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <a
        href={ROUTES.landing}
        className="inline-flex min-h-11 items-center font-heading text-h3 font-bold tracking-tight text-ink"
      >
        {dict.common.brand.name}
      </a>
      <h1 className="font-heading text-h1 text-ink">
        {dict.common.errors.notFoundTitle}
      </h1>
      <p className="text-body-lg text-muted">
        {dict.common.errors.notFoundBody}
      </p>
      {/* No hay clave "Volver al inicio" en lib/i18n; `actions.back` es la
          más cercana y no se inventa copy (brief §4.8). Ver reporte. */}
      <Button href={ROUTES.landing} variant="primary" size="lg" className="mt-2">
        {dict.common.actions.back}
      </Button>
    </main>
  );
}
