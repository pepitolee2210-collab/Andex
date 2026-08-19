/**
 * /registro — PASO 3 del embudo: bienvenida → pago → REGISTRO → comunidad.
 *
 * Fuera del grupo `(auth)` a propósito. Aquel armazón —cabecera clara con la
 * flecha de vuelta, los conmutadores de idioma y tema, y una columna estrecha
 * sobre fondo de página— es para quien viene a entrar a una cuenta que ya
 * tiene. Aquí llega alguien que acaba de pagar, y la pantalla tiene que ser
 * la continuación de `/bienvenida` y `/pago`: navy a sangre, sin salidas
 * laterales. Envuelto en aquel armazón quedaban además dos `<main
 * id="contenido">` anidados, que es un `id` repetido y dos regiones
 * principales en la misma página.
 *
 * Server Component: resuelve el idioma desde la cookie y se lo pasa al
 * formulario. Así no hay desajuste de hidratación (el servidor ya sabe el
 * idioma; `getClientLang()` en el primer render no).
 */

import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { RegistroForm } from "@/components/auth/registro-form";

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  return { title: dict.auth.registro.eyebrow };
}

export default async function RegistroPage() {
  const lang = await getLang();
  return <RegistroForm lang={lang} />;
}
