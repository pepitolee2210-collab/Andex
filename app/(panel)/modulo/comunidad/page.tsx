import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { CommunityScreen } from "@/components/community/community-screen";

/**
 * COMUNIDAD — módulo 5 (§5-M5).
 *
 * Segmento estático: `/modulo/comunidad` gana a `/modulo/[slug]`, así que
 * esta pantalla sustituye a la carcasa genérica sólo para este módulo.
 *
 * El servidor resuelve idioma y texto y nada más. Todo lo demás —qué sesión
 * es la próxima, en qué estado está la puerta, en qué hora se enseña—
 * depende del reloj y de la zona horaria del navegador, que el servidor no
 * conoce. Calcularlo aquí produciría un HTML distinto al del cliente y una
 * cuenta atrás congelada en el instante de generar la página.
 */

export async function generateMetadata(): Promise<Metadata> {
  const dict = getDictionary(await getLang());
  /* El sobretítulo, no el titular: la pestaña del navegador tiene que
     decir en qué módulo estás («Comunidad y Vida Local»), no cómo se llama
     lo que se ve dentro («Talleres en vivo»). Con diez pestañas abiertas
     eso es la única forma de encontrarla. */
  return { title: dict.comunidad.overline };
}

export default async function ComunidadPage() {
  const lang = await getLang();
  const dict = getDictionary(lang);
  return <CommunityScreen lang={lang} copy={dict.comunidad} />;
}
