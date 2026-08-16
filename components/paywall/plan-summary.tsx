import {
  Baby,
  GraduationCap,
  HardDrive,
  LayoutGrid,
  Shield,
  Target,
  Users,
} from "lucide-react";
import {
  KitBadge,
  KitNotice,
  ListGroup,
  ListRow,
  SectionLabel,
} from "@/components/ui/kit";
import type { Dictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { PILOT_FAMILIES, type PaywallPersonalization } from "./personalization";

/**
 * QUÉ INCLUYE LA MEMBRESÍA — una sola lista, y las dos primeras filas son
 * las suyas.
 *
 * El sistema de diseño manda aquí: «Qué incluye el plan anual y qué no. Los
 * cuatro módulos pendientes se dicen aquí, no después.» Por eso la lista
 * cierra con "Los cuatro módulos que faltan · Se abren durante el piloto":
 * contado antes del cobro es un plazo; contado después, una sorpresa.
 *
 * Y sigue siendo el "eco del ranking" que pide §3.4.3: las dos primeras
 * filas salen de `buildPersonalization()`, es decir, del perfil y del
 * ranking reales. La razón del módulo #1 («Porque dijiste que…») va bajo su
 * título: es la prueba más directa de que este plan lo armó el usuario y no
 * una plantilla. Antes estas filas vivían en una tarjeta aparte; unirlas
 * evita dos listas seguidas diciendo casi lo mismo.
 *
 *   ┌─────────────────────────────────────────┐
 *   │ ◎ Bóveda Digital        [TU PRIORIDAD]  │ ← módulo #1 real
 *   │ ▦ Trámites y Estatus + 5 módulos más    │ ← módulo #2 real
 *   │ ⛨ Bóveda con avisos de vencimiento      │
 *   │ ⌂ Academia: inglés para el trabajo      │
 *   │ ⚇ Talleres en vivo · 2,400 familias…    │ ← su estado / su país
 *   │ ⛁ Los cuatro módulos que faltan         │ ← lo que TODAVÍA no hay
 *   │ ⚇ Contenido para tu familiar            │ ← sólo si seeking ≠ self
 *   └─────────────────────────────────────────┘
 */

export type PlanSummaryProps = {
  personalization: PaywallPersonalization;
  dict: Dictionary;
  lang: Lang;
};

export function PlanSummary({ personalization, dict, lang }: PlanSummaryProps) {
  const t = dict.paywall.summary;
  const inc = dict.paywall.includes;
  const p = personalization;

  const numberFormat = new Intl.NumberFormat(lang === "es" ? "es-MX" : "en-US");
  const families = numberFormat.format(PILOT_FAMILIES);

  const community = p.place
    ? t.community(families, p.place)
    : t.communityNoPlace(families);

  return (
    <section aria-label={t.ariaLabel}>
      <SectionLabel as="h2">{inc.label}</SectionLabel>

      <ListGroup>
        {/* 1 — Módulo #1 del ranking, con su porqué y el distintivo de
            prioridad. La ficha va en teal: el diseño reserva ese tono para
            el módulo prioritario y sólo para él. */}
        <ListRow
          iconName="target"
          icon={Target}
          iconTone="accent"
          /* El distintivo va DENTRO del título y no en la columna de la
             derecha: «TU PRIORIDAD» es largo y allí estrujaba el nombre del
             módulo hasta partirlo en tres líneas. */
          title={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {t.topModule(p.topModuleTitle)}
              <KitBadge tone="accent">{t.priorityBadge}</KitBadge>
            </span>
          }
          meta={p.topModuleReason}
        />

        {/* 2 — Módulo #2 nombrado + los que quedan (§3.4.3). */}
        <ListRow
          iconName="layout-grid"
          icon={LayoutGrid}
          title={t.secondModule(p.secondModuleTitle, p.remainingModules)}
        />

        {/* 3–6 — Lo que la membresía trae siempre, y lo que todavía no. */}
        <ListRow
          iconName="shield"
          icon={Shield}
          title={inc.vault.title}
          meta={inc.vault.meta}
        />
        <ListRow
          iconName="graduation-cap"
          icon={GraduationCap}
          title={inc.academy.title}
          meta={inc.academy.meta}
        />
        <ListRow
          iconName="users"
          icon={Users}
          title={inc.workshops.title}
          meta={`${inc.workshops.meta} · ${community}`}
        />
        <ListRow
          iconName="hard-drive"
          icon={HardDrive}
          title={inc.pending.title}
          meta={inc.pending.meta}
        />

        {/* 7 — Línea de familia: SOLO si seeking_for ≠ 'self' (§3.4.3). */}
        {p.showFamilyLine ? (
          <ListRow iconName="baby" icon={Baby} title={t.familyLine} />
        ) : null}
      </ListGroup>

      {/* Nota de moneda: SOLO en pre_arrival (§3.4.3). */}
      {p.showCurrencyNote ? (
        <KitNotice className="mt-3">{t.currencyNote}</KitNotice>
      ) : null}
    </section>
  );
}
