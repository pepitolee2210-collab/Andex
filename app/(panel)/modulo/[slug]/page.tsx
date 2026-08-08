import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { moduleBySlug } from "@/lib/catalogs/modules";
import { ModulePlaceholder } from "@/components/panel/module-placeholder";

/**
 * Pantalla de módulo (§4.6). En v1 son las siete carcasas con captura de
 * interés; la lógica interna de §5 queda para las iteraciones siguientes.
 *
 * §0.4 — acceso abierto: los 7 slugs son válidos para CUALQUIER usuario con
 * membresía, sin importar su perfil. Aquí no hay filtro por contexto ni por
 * intereses: la personalización ordena y enfatiza, nunca oculta ni bloquea.
 *
 * §9 — el slug del módulo no es un dato sensible (es un catálogo público),
 * así que sí puede viajar en la ruta. Nada más lo hace.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = moduleBySlug(slug);
  if (!meta) return {};
  const dict = getDictionary(await getLang());
  // El <title> usa el nombre canónico del módulo (variante in_us, la del seed
  // §7.4): el servidor no puede leer el perfil en modo demo, así que no sabe
  // qué variante de contenido le toca a este usuario. El TÍTULO DE LA PANTALLA
  // sí es el correcto — lo resuelve el cliente con `contentVariant`.
  return { title: dict.common.modules.titles[meta.id].in_us };
}

export default async function ModuloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = moduleBySlug(slug);
  if (!meta) notFound();

  return <ModulePlaceholder moduleId={meta.id} />;
}
