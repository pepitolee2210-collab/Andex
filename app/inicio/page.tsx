"use client";

/**
 * LA RUTA DEL INICIO.
 *
 * Su único trabajo es reunir los datos que hacen que los widgets digan algo
 * cierto, y pasárselos a la pantalla. La pantalla no lee nada por su cuenta:
 * así se puede probar con datos inventados sin montar una bóveda.
 *
 * Los documentos se leen en el NAVEGADOR, de IndexedDB. Están cifrados y no
 * salen del dispositivo: el servidor no puede contarlos aunque quisiera, y
 * por eso este componente es de cliente.
 */

import { useCallback, useEffect, useState } from "react";
import { getClientLang } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { listDocuments } from "@/lib/vault/storage";
import { workshopBySlug } from "@/lib/catalogs/talleres";
import { doorState, nextSession, resolveTimeZone } from "@/lib/community/schedule";
import { HomeScreen, type DatosInicio } from "@/components/os/home-screen";
import type { AppSlug } from "@/lib/os/apps";
import { toast } from "@/components/ui/toaster";

const UTAH = "America/Denver";
const DIA_MS = 86_400_000;

const VACIO: DatosInicio = {
  boveda: { total: 0, proximo: null, sinFechas: false, ultimos: [] },
  ingles: { cuando: null, enVivo: false },
};

export default function Inicio() {
  const lang = getClientLang();
  const dict = getDictionary(lang);
  const [datos, setDatos] = useState<DatosInicio>(VACIO);
  const [nombre, setNombre] = useState<string | null>(null);

  /* ── Cada fuente va por su cuenta ──
     El primer intento encadenaba las dos: se esperaba a la bóveda y DESPUÉS
     se calculaba el inglés, con un solo `setDatos` al final. Falla de una
     forma silenciosa y fea: si `listDocuments()` tarda —o se queda esperando
     una clave que no existe porque la sesión no está abierta— el widget de
     inglés se queda diciendo "sin clase programada" para siempre, aunque el
     horario esté ahí y no dependa de nada.

     Son datos independientes. Se leen por separado y cada uno se pinta en
     cuanto está: uno lento no puede dejar mudo al otro. */

  // ── Inglés: no depende de red ni de permisos, así que va primero ──
  useEffect(() => {
    const semilla = workshopBySlug("ingles-para-el-trabajo");
    if (!semilla) return;
    const zona = resolveTimeZone(UTAH);
    const ahora = new Date();
    const sesion = nextSession(semilla, ahora);
    const ingles = {
      enVivo: doorState(semilla, ahora).kind === "live",
      cuando: sesion
        ? new Intl.DateTimeFormat(lang, {
            weekday: "short", hour: "numeric", minute: "2-digit", timeZone: zona,
          }).format(sesion.startsAt)
        : null,
    };
    setDatos((previo) => ({ ...previo, ingles }));
  }, [lang]);

  // ── Bóveda: lee de IndexedDB, puede tardar o estar bloqueada ──
  useEffect(() => {
    let vivo = true;

    (async () => {
      let boveda = VACIO.boveda;
      try {
        const docs = await listDocuments();
        const hoy = Date.now();
        const conFecha = docs
          .filter((d) => d.expiresAt)
          .map((d) => ({
            nombre: d.name,
            dias: Math.ceil((new Date(d.expiresAt as string).getTime() - hoy) / DIA_MS),
          }))
          .sort((a, b) => a.dias - b.dias);

        boveda = {
          total: docs.length,
          proximo: conFecha[0] ?? null,
          // "Ninguno tiene fecha" sólo es cierto —y sólo merece decirse—
          // cuando hay documentos. Con la bóveda vacía sobra.
          sinFechas: docs.length > 0 && conFecha.length === 0,
          ultimos: [...docs]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 2)
            .map((d) => ({
              nombre: d.name,
              cuando: new Intl.DateTimeFormat(lang, { day: "numeric", month: "short" })
                .format(new Date(d.createdAt)),
            })),
        };
      } catch { /* bóveda bloqueada o sin permiso: el widget lo dirá vacío */ }

      if (vivo) setDatos((previo) => ({ ...previo, boveda }));
    })();

    try {
      const guardado = window.localStorage.getItem("andex_user_name");
      if (guardado && vivo) setNombre(guardado);
    } catch { /* sin almacenamiento: saludo sin nombre */ }

    return () => { vivo = false; };
  }, [lang]);

  const alTocarLoQueNoExiste = useCallback((slug: AppSlug) => {
    toast.info(dict.os.soonBody);
    void slug;
  }, [dict.os.soonBody]);

  return (
    <HomeScreen
      nombre={nombre}
      lang={lang}
      copy={dict.os}
      datos={datos}
      onSoon={alTocarLoQueNoExiste}
    />
  );
}
