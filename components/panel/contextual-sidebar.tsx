"use client";

/**
 * Sidebar contextual (§4.2, fila "Sidebar contextual": contenido asociado a
 * los módulos #1 y #2 del ranking; §2.4: columna derecha de 320px en ≥1440,
 * y contenido apilado bajo el feed por debajo de ese ancho).
 *
 * Trae el elemento adaptativo "Enlaces externos" de §4.2 — DMV de tu estado /
 * consulado de tu país — resuelto por `external_resources.scope`.
 *
 * §6: todo enlace externo lleva su fecha de verificación y el disclaimer
 * permanente de no afiliación gubernamental. Ninguna URL se inventa: solo
 * salen las que el PRD escribe y el seed validó.
 */

import Link from "next/link";
import { CalendarClock, ExternalLink, ShieldAlert, UserRound } from "lucide-react";
import { ROUTES } from "@/lib/config";
import type { Dictionary } from "@/lib/i18n";
import type { ModuleSlug } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { usePanel } from "./panel-context";
import {
  RESOURCES_VERIFIED_AT,
  resourcesFor,
  type ResourceLabelKey,
} from "./external-links";
import { formatDate, scopeName } from "./panel-utils";

/** Etiqueta visible del recurso. El único con parámetro es el consulado. */
function resourceLabel(
  dict: Dictionary,
  key: ResourceLabelKey,
  scope: string | null,
): string {
  const r = dict.panel.resources;
  switch (key) {
    case "uscisCase":
      return r.uscisCase;
    case "eoirCourt":
      return r.eoirCourt;
    case "ds160":
      return r.ds160;
    case "embassy":
      return r.embassy(scope ?? "");
    case "dmvUt":
      return r.dmvUt;
    case "llcUt":
      return r.llcUt;
    case "ptin":
      return r.ptin;
  }
}

function SidebarSection({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4 shadow-sm">
      <h2 className="flex items-center gap-2 font-heading text-h3 text-ink">
        {icon ? (
          <span aria-hidden="true" className="text-muted">
            {icon}
          </span>
        ) : null}
        {title}
      </h2>
      {subtitle ? <p className="mt-0.5 text-caption text-muted">{subtitle}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export type ContextualSidebarProps = {
  /** Slugs de los módulos #1 y #2: lo que hace "contextual" a este sidebar. */
  topSlugs: readonly ModuleSlug[];
};

export function ContextualSidebar({ topSlugs }: ContextualSidebarProps) {
  const { dict, lang, profile } = usePanel();
  if (!profile) return null;

  const s = dict.panel.sidebar;
  const context = profile.locationContext;
  const scope = scopeName(profile, lang);

  const resourceScope = {
    context,
    stateUS: profile.stateUS,
    countryOfResidence: profile.countryOfResidence,
  };
  // Primero lo del módulo top; si esos módulos no tienen recursos oficiales,
  // se muestran los que sí aplican a este usuario antes que dejar el hueco.
  const contextual = resourcesFor(resourceScope, topSlugs);
  const resources = contextual.length > 0 ? contextual : resourcesFor(resourceScope);

  const linksTitle =
    scope === null
      ? s.linksTitle
      : context === "in_us"
        ? s.linksInUs(scope)
        : s.linksPreArrival(scope);

  const eventsTitle =
    context === "in_us" && scope !== null ? s.eventsInUs(scope) : s.eventsTitle;

  return (
    <div className="space-y-4">
      {resources.length > 0 ? (
        <SidebarSection title={linksTitle} icon={<ExternalLink className="size-4" />}>
          <ul className="space-y-1">
            {resources.map((resource) => (
              <li key={`${resource.labelKey}-${resource.officialUrl}`}>
                <a
                  href={resource.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-start gap-2 rounded-md px-2 py-2 text-body text-ink transition-colors hover:bg-surface-alt"
                >
                  <span className="min-w-0 flex-1">
                    {resourceLabel(dict, resource.labelKey, scope)}
                    <span className="sr-only"> — {s.linkOpensExternal}</span>
                  </span>
                  <ExternalLink
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-muted"
                  />
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-2 px-2 text-caption text-muted">
            {s.linkVerifiedAt(formatDate(RESOURCES_VERIFIED_AT, lang))}
          </p>
          {/* §6 — disclaimer permanente junto a TODO enlace oficial. */}
          <p className="mt-3 rounded-sm bg-surface-alt px-3 py-2 text-caption text-muted">
            {s.linksDisclaimer}
          </p>
        </SidebarSection>
      ) : null}

      {context === "pre_arrival" ? (
        <SidebarSection title={s.linksCostTitle}>
          {/* §3.4.1 y criterio de evidencia: una tarifa inventada sería peor
              que no dar ninguna. Se dice dónde está la oficial. */}
          <p className="text-body text-muted">{dict.panel.resources.costPending}</p>
        </SidebarSection>
      ) : null}

      <SidebarSection title={eventsTitle} icon={<CalendarClock className="size-4" />}>
        <p className="text-body text-muted">{s.eventsEmpty}</p>
      </SidebarSection>

      <SidebarSection
        title={s.alertsTitle}
        subtitle={s.alertsSubtitle}
        icon={<ShieldAlert className="size-4" />}
      >
        <p className="text-body text-muted">{s.alertsEmpty}</p>
      </SidebarSection>

      <SidebarSection title={s.profileTitle} icon={<UserRound className="size-4" />}>
        <p className="text-body text-muted">
          {profile.firstName}
          {profile.email ? ` · ${profile.email}` : ""}
        </p>
        <Button href={ROUTES.perfil} variant="secondary" className="mt-3">
          {s.profileEdit}
        </Button>
      </SidebarSection>

      <p className="px-1 text-caption text-muted">
        <Link href={ROUTES.terminos} className="underline underline-offset-2">
          {dict.common.legal.terms}
        </Link>
        {" · "}
        <Link href={ROUTES.privacidad} className="underline underline-offset-2">
          {dict.common.legal.privacy}
        </Link>
      </p>
    </div>
  );
}
