import type { Metadata } from "next";

import { getDictionary } from "@/lib/i18n";
import { bienvenidaCopy } from "@/lib/i18n/dictionaries/bienvenida";
import { getLang } from "@/lib/i18n/server";
import { imagenLanding } from "@/lib/landing-images";
import { BienvenidaScreen } from "@/components/embudo/bienvenida-screen";

/**
 * PASO 1 DEL EMBUDO — la bienvenida de Henry.
 *
 * Server Component mínimo: idioma, copy y cartel del video. NO exige sesión,
 * y esa es la diferencia con el embudo anterior — aquí todavía no hay cuenta
 * ni hace falta: se crea después del pago.
 *
 * El cartel se resuelve aquí porque el catálogo comprueba el disco con
 * `node:fs`. Y el copy se compone aquí por lo mismo: los textos con
 * parámetro son funciones, y una función no cruza a un componente cliente.
 */

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.bienvenida.title };
}

export default async function BienvenidaPage() {
  const lang = await getLang();
  const dict = getDictionary(lang);

  return (
    <BienvenidaScreen
      copy={bienvenidaCopy(lang)}
      marca={dict.common.brand.name}
      poster={imagenLanding("fundador")}
    />
  );
}
