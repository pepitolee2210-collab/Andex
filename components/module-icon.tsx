import {
  Briefcase,
  Building2,
  FolderLock,
  GraduationCap,
  Plane,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ModuleSlug } from "@/lib/types";

/**
 * ModuleIcon — mapa slug → icono lucide de los 7 módulos (seed §7.4).
 * Iconos importados individualmente (named imports; Next optimiza
 * lucide-react de serie con optimizePackageImports).
 *
 * Siempre decorativo (aria-hidden): el nombre del módulo va en texto al
 * lado. El color se hereda (currentColor) o llega por className.
 */

const ICONS: Record<ModuleSlug, LucideIcon> = {
  boveda: FolderLock,
  migracion: Plane,
  finanzas: TrendingUp,
  negocio: Building2,
  comunidad: Users,
  academia: GraduationCap,
  empleo: Briefcase,
};

export type ModuleIconProps = {
  slug: ModuleSlug;
  /** Tamaño en px (prop nativa de lucide). Default 24. */
  size?: number;
  className?: string;
};

export function ModuleIcon({ slug, size = 24, className }: ModuleIconProps) {
  const Icon = ICONS[slug];
  return <Icon aria-hidden="true" size={size} className={className} />;
}
