"use client";

/**
 * TUS APLICACIONES.
 *
 * Cierra un agujero que el inicio abrió: se podía quitar una app y no había
 * forma de traerla de vuelta. En el prototipo esta pantalla se llama
 * "Store"; aquí no, y es deliberado — la palabra sugiere comprar, y en un
 * producto que ya cobra una suscripción insinuar un segundo cobro es
 * exactamente la desconfianza que hay que evitar. Por eso el subtítulo dice
 * lo que dice: todo esto ya viene con la cuenta.
 *
 * Primera pantalla montada enteramente con las piezas de
 * `components/os/primitives.tsx`.
 */

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Gavel, GraduationCap, Plus, ScanLine, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { ReactNode } from "react";
import { getClientLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { OS_APPS, type AppSlug } from "@/lib/os/apps";
import {
  CLAVE_INICIO,
  anadirApp,
  appsColocadas,
  appsQuitadas,
  layoutInicial,
  parseLayout,
  type HomeLayout,
} from "@/lib/os/home";
import { OsHeader, OsRow } from "@/components/os/primitives";
import { toast } from "@/components/ui/toaster";

const GLIFO: Record<AppSlug, ReactNode> = {
  boveda: <ShieldCheck className="size-[18px]" />,
  escaner: <ScanLine className="size-[18px]" />,
  ia: <Sparkles className="size-[18px]" />,
  legal: <Gavel className="size-[18px]" />,
  ingles: <GraduationCap className="size-[18px]" />,
  comunidad: <Users className="size-[18px]" />,
  avisos: <Bell className="size-[18px]" />,
  ajustes: <Settings className="size-[18px]" />,
};

export default function Aplicaciones() {
  const lang = getClientLang();
  const copy = getDictionary(lang).os;
  const [layout, setLayout] = useState<HomeLayout>(layoutInicial);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CLAVE_INICIO);
      if (guardado) setLayout(parseLayout(guardado));
    } catch { /* almacenamiento bloqueado: se muestra el de fábrica */ }
  }, []);

  const recuperar = useCallback((slug: AppSlug) => {
    setLayout((previo) => {
      const siguiente = anadirApp(previo, slug);
      try { window.localStorage.setItem(CLAVE_INICIO, JSON.stringify(siguiente)); }
      catch { /* se pierde al salir, pero la pantalla ya la muestra */ }
      return siguiente;
    });
    toast.success(copy.store.added);
  }, [copy.store.added]);

  const puestas = appsColocadas(layout);
  const fuera = appsQuitadas(layout);

  return (
    <main className="shell-os min-h-dvh pb-10 pt-6">
      <OsHeader
        title={copy.store.title}
        subtitle={copy.store.subtitle}
        backHref="/inicio"
        backLabel={copy.store.back}
      />

      {/* ── Las que faltan ──
          Van PRIMERO. Quien entra aquí viene a recuperar algo; la lista de
          lo que ya tiene no le resuelve nada y le haría bajar. */}
      <section aria-labelledby="apps-fuera" className="mt-7 px-5">
        <h2 id="apps-fuera" className="text-[11.5px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--os-muted)" }}>
          {copy.store.removed}
        </h2>
        {fuera.length > 0 ? (
          <ul className="mt-3 space-y-2.5">
            {fuera.map((slug) => {
              const meta = OS_APPS.find((a) => a.slug === slug);
              return (
                <li key={slug}>
                  <OsRow
                    icon={GLIFO[slug]}
                    title={copy.apps[slug]}
                    meta={copy.appDesc[slug]}
                    accent={meta?.accent}
                    onClick={() => recuperar(slug)}
                    trailing={
                      <span
                        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[11.5px] font-bold"
                        style={{ background: "var(--os-chip)", color: "var(--os-ink)" }}
                      >
                        <Plus aria-hidden="true" className="size-3.5" strokeWidth={3} />
                        {copy.store.add}
                      </span>
                    }
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-[13px]" style={{ color: "var(--os-muted)" }}>
            {copy.store.empty}
          </p>
        )}
      </section>

      {/* ── Las que ya están ── */}
      <section aria-labelledby="apps-dentro" className="mt-8 px-5">
        <h2 id="apps-dentro" className="text-[11.5px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--os-muted)" }}>
          {copy.store.onHome}
        </h2>
        <ul className="mt-3 space-y-2.5">
          {puestas.map((slug) => {
            const meta = OS_APPS.find((a) => a.slug === slug);
            return (
              <li key={slug}>
                <OsRow
                  icon={GLIFO[slug]}
                  title={copy.apps[slug]}
                  meta={copy.appDesc[slug]}
                  accent={meta?.accent}
                  trailing={
                    <Check
                      aria-label={copy.store.onHome}
                      className="size-[17px] shrink-0"
                      style={{ color: "var(--acc-boveda)" }}
                      strokeWidth={3}
                    />
                  }
                />
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
