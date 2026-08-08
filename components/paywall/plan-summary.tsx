import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { PILOT_FAMILIES, type PaywallPersonalization } from "./personalization";

/**
 * Tarjeta de resumen del paywall — el "eco del ranking" del wireframe §3.4.2:
 *
 *   ┌─────────────────────────────────────────┐
 *   │ ✓ Bóveda Digital       [TU PRIORIDAD]  │ ← módulo #1 real
 *   │ ✓ Trámites y Estatus + 5 módulos más   │ ← módulo #2 real
 *   │ ✓ Alertas de fechas límite              │
 *   │ ✓ Comunidad de 2,400 familias en Utah   │ ← su estado / su país
 *   │ ✓ Contenido para tu familiar            │ ← solo si seeking ≠ self
 *   └─────────────────────────────────────────┘
 *
 * Todo sale de `buildPersonalization()`, es decir, de datos reales del perfil
 * y del ranking (§3.4.3). Aquí no hay ni un texto de relleno.
 *
 * La razón del módulo #1 ("Porque dijiste que quieres…") se muestra bajo la
 * primera línea: es la prueba más directa de que este plan lo armó el usuario
 * y no una plantilla. Ver reporte (decisión documentada).
 */

export type PlanSummaryProps = {
  personalization: PaywallPersonalization;
  dict: Dictionary;
  lang: Lang;
};

function SummaryRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <Check
        aria-hidden="true"
        className="mt-1 size-4.5 shrink-0 text-teal-deep"
      />
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

export function PlanSummary({ personalization, dict, lang }: PlanSummaryProps) {
  const t = dict.paywall.summary;
  const p = personalization;

  const numberFormat = new Intl.NumberFormat(lang === "es" ? "es-MX" : "en-US");
  const families = numberFormat.format(PILOT_FAMILIES);

  return (
    <section
      aria-label={t.ariaLabel}
      className="rounded-lg border border-line bg-surface p-5 shadow-sm sm:p-6"
    >
      <ul className="flex flex-col gap-4 text-body text-ink">
        {/* 1 — Módulo #1 del ranking, con el badge de prioridad (§3.4.3). */}
        <SummaryRow>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{t.topModule(p.topModuleTitle)}</span>
            <Badge variant="amber">{t.priorityBadge}</Badge>
          </span>
          <span className="mt-1 block text-caption text-muted">
            {p.topModuleReason}
          </span>
        </SummaryRow>

        {/* 2 — Módulo #2 nombrado + los que quedan (§3.4.3). */}
        <SummaryRow>
          {t.secondModule(p.secondModuleTitle, p.remainingModules)}
        </SummaryRow>

        {/* 3 — Alertas de fechas límite (wireframe §3.4.2). */}
        <SummaryRow>{t.alerts}</SummaryRow>

        {/* 4 — Referencia geográfica: su estado o su país (§3.4.3). */}
        <SummaryRow>
          {p.place
            ? t.community(families, p.place)
            : t.communityNoPlace(families)}
        </SummaryRow>

        {/* 5 — Línea de familia: SOLO si seeking_for ≠ 'self' (§3.4.3). */}
        {p.showFamilyLine ? <SummaryRow>{t.familyLine}</SummaryRow> : null}
      </ul>

      {/* 6 — Nota de moneda: SOLO en pre_arrival (§3.4.3). */}
      {p.showCurrencyNote ? (
        <p className="mt-5 border-t border-line pt-4 text-caption text-muted">
          {t.currencyNote}
        </p>
      ) : null}
    </section>
  );
}
