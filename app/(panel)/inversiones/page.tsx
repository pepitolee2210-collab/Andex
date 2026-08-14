import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { InversionesScreen } from "@/components/inversiones/inversiones-screen";

/**
 * INVERSIONES.
 *
 * Va dentro de `(panel)`, así que hereda la sesión y el control de acceso
 * del layout: esta sección no se enseña a quien no ha entrado.
 *
 * No es uno de los siete módulos del catálogo (§7.4) y por eso no toca el
 * orden canónico de la navegación, que §4.3 congela a propósito.
 */

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.inversiones.title };
}

export default async function InversionesPage() {
  const dict = getDictionary(await getLang());
  return <InversionesScreen copy={dict.inversiones} />;
}
