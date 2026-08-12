/**
 * Catálogo estático de los 7 módulos — espejo del seed SQL §7.4.
 * Los títulos y descripciones visibles NO viven aquí: están en lib/i18n
 * (varían por idioma y por contentVariant, ver §4.2.1).
 */

import type { LocationContext, ModuleId, ModuleMeta, ModuleSlug } from "@/lib/types";

export const MODULES: readonly ModuleMeta[] = [
  // La Bóveda ya funciona: escanea, cifra y guarda. Sin este cambio, el
  // grid del panel le pondría el badge "Pronto" a un módulo operativo.
  { id: 1, slug: "boveda",    iconName: "folder-lock", accentColor: "#0F766E", canonicalOrder: 1, status: "live" },
  { id: 2, slug: "migracion", iconName: "plane",       accentColor: "#102A43", canonicalOrder: 2, status: "coming_soon" },
  { id: 3, slug: "finanzas",  iconName: "trending-up", accentColor: "#0E7C5A", canonicalOrder: 3, status: "coming_soon" },
  { id: 4, slug: "negocio",   iconName: "building",    accentColor: "#9A6B00", canonicalOrder: 4, status: "coming_soon" },
  // Comunidad ya tiene pantalla: talleres en vivo con horario en la hora
  // de quien mira. Sin esto el grid le pondria "Pronto" a un modulo que
  // ya se puede abrir.
  { id: 5, slug: "comunidad", iconName: "users",       accentColor: "#12B8A6", canonicalOrder: 5, status: "live" },
  { id: 6, slug: "academia",  iconName: "graduation",  accentColor: "#102A43", canonicalOrder: 6, status: "coming_soon" },
  { id: 7, slug: "empleo",    iconName: "briefcase",   accentColor: "#0F766E", canonicalOrder: 7, status: "coming_soon" },
] as const;

export const MODULE_IDS = MODULES.map((m) => m.id) as ModuleId[];

export function moduleById(id: ModuleId): ModuleMeta {
  const m = MODULES.find((x) => x.id === id);
  if (!m) throw new Error(`Módulo desconocido: ${id}`);
  return m;
}

export function moduleBySlug(slug: string): ModuleMeta | null {
  return MODULES.find((x) => x.slug === (slug as ModuleSlug)) ?? null;
}

/**
 * §3.3.1 — Orden por defecto cuando solo se conoce location_context
 * (usuario que saltó el wizard, scores empatados en 0, etc. §4.7).
 */
export const DEFAULT_ORDER: Record<LocationContext, ModuleId[]> = {
  in_us: [1, 7, 5, 3, 2, 4, 6],
  pre_arrival: [2, 6, 1, 3, 5, 4, 7],
};
