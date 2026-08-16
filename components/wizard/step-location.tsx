"use client";

import { useMemo, useRef, useState } from "react";
import { Info, MapPin, Plane } from "lucide-react";
import type {
  Lang,
  LocationContext,
  OnboardingDraft,
  TimeInUSTag,
  TravelPlanTag,
} from "@/lib/types";
import type { WizardDict } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/track";
import { COUNTRY_NOT_LISTED, countriesGrouped } from "@/lib/catalogs/countries";
import { statesGrouped } from "@/lib/catalogs/states";
import { Glyph, KitBadge, KitNotice } from "@/components/ui/kit";
import { Combobox, type ComboboxItem } from "@/components/ui/combobox";
import { OptionChips, type ChipOption } from "@/components/ui/option-chips";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FreeTextField } from "./free-text-field";
import { hasBranchDataToLose, isOneOf } from "./draft-utils";

/**
 * PASO 2 — LA BIFURCACIÓN (§3.2, la pantalla más importante del wizard).
 *
 * - Pregunta única, dos tarjetas grandes. Al elegir, la rama se despliega
 *   **en la misma pantalla, sin navegación adicional**.
 * - No hay opción de saltar (regla 6): sin `location_context` el dashboard
 *   no puede adaptarse a nada.
 * - Cambiar de rama con datos ya escritos abre la confirmación textual de
 *   §3.2.2 y solo al aceptar se limpian los campos de la rama anterior
 *   (regla dura: nunca conviven estado de EE. UU. y país extranjero).
 */

const TIME_TAGS: readonly TimeInUSTag[] = [
  "menos_6_meses",
  "6m_2a",
  "2a_5a",
  "mas_5a",
  "no_responde",
];

const TRAVEL_TAGS: readonly TravelPlanTag[] = [
  "fecha_confirmada",
  "este_ano",
  "explorando",
  "no_se",
];

const BRANCHES: readonly LocationContext[] = ["in_us", "pre_arrival"];

export type StepLocationProps = {
  dict: WizardDict;
  lang: Lang;
  draft: OnboardingDraft;
  onPatch: (patch: Partial<OnboardingDraft>) => void;
  /** Aplica el cambio de rama (limpia lo incoherente y emite el evento). */
  onSelectBranch: (next: LocationContext) => void;
  /** D28: el ámbito (estado o país) también bloquea el avance del paso 2. */
  errors: { location?: string; stateUS?: string; country?: string };
  /** País detectado por IP; preselecciona el país de residencia (rama B). */
  geoCountry: string | null;
};

export function StepLocation({
  dict,
  lang,
  draft,
  onPatch,
  onSelectBranch,
  errors,
  geoCountry,
}: StepLocationProps) {
  const t = dict.step2;
  const branch = draft.locationContext ?? null;
  const [pendingBranch, setPendingBranch] = useState<LocationContext | null>(null);
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [nationalityOpen, setNationalityOpen] = useState(
    () => draft.nationality != null,
  );

  const name = (es: string, en: string) => (lang === "es" ? es : en);

  const stateItems = useMemo<ComboboxItem[]>(() => {
    const { pilot, quickAccess, rest } = statesGrouped();
    return [
      ...pilot.map((s) => ({ value: s.code, label: name(s.nameEs, s.nameEn), group: "pilot" })),
      ...quickAccess.map((s) => ({ value: s.code, label: name(s.nameEs, s.nameEn), group: "popular" })),
      ...rest.map((s) => ({ value: s.code, label: name(s.nameEs, s.nameEn), group: "all" })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const countryItems = useMemo<ComboboxItem[]>(() => {
    const { quickAccess, rest } = countriesGrouped();
    return [
      ...quickAccess.map((c) => ({ value: c.code, label: name(c.nameEs, c.nameEn), group: "latam" })),
      ...rest.map((c) => ({ value: c.code, label: name(c.nameEs, c.nameEn), group: "rest" })),
      // Anexo C.2: opción final de la lista.
      { value: COUNTRY_NOT_LISTED, label: t.preArrival.countryNotListed, group: "rest" },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, t.preArrival.countryNotListed]);

  /** Nacionalidad: mismo catálogo, sin la salida de emergencia. */
  const nationalityItems = useMemo<ComboboxItem[]>(
    () => countryItems.filter((it) => it.value !== COUNTRY_NOT_LISTED),
    [countryItems],
  );

  function requestBranch(next: LocationContext) {
    if (branch === next) return;
    // §3.2.2: solo se confirma si de verdad hay datos que se van a borrar.
    if (branch !== null && hasBranchDataToLose(draft, branch)) {
      setPendingBranch(next);
      return;
    }
    onSelectBranch(next);
  }

  function handleCardKeyDown(e: React.KeyboardEvent, index: number) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const next = (index + delta + BRANCHES.length) % BRANCHES.length;
    cardRefs.current[next]?.focus();
    requestBranch(BRANCHES[next]);
  }

  const focusIndex = branch ? BRANCHES.indexOf(branch) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Dos filas en una lista agrupada, con su ficha de icono y el
          distintivo de la elegida. Antes eran dos tarjetas con emoji: el
          sistema de diseño no admite emoji como icono —y una bandera, además,
          afirma cosas sobre la persona que aquí nadie ha preguntado. */}
      <div role="radiogroup" aria-label={t.title} className="ax-group">
        {BRANCHES.map((value, index) => {
          const card = t.cards[value];
          const selected = branch === value;
          return (
            <button
              key={value}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={index === focusIndex ? 0 : -1}
              onClick={() => requestBranch(value)}
              onKeyDown={(e) => handleCardKeyDown(e, index)}
              className="row tappable"
            >
              <span className={cn("rowicon", selected ? "tone-accent" : "tone-quiet")}>
                <Glyph
                  name={value === "in_us" ? "map-pin" : "plane"}
                  icon={value === "in_us" ? MapPin : Plane}
                />
              </span>
              <span className="rowmain">
                <span className="rowtitle">{card.title}</span>
                <span className="rowmeta">{card.description}</span>
              </span>
              {selected ? (
                <span className="rowtrail">
                  <KitBadge tone="accent">{t.selectedBadge}</KitBadge>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <KitNotice iconName="info" icon={Info}>
        {t.branchNotice}
      </KitNotice>

      {errors.location ? (
        <p role="alert" className="text-label text-danger">
          {errors.location}
        </p>
      ) : null}

      {/* Rama A — se despliega EN LA MISMA PANTALLA */}
      {branch === "in_us" ? (
        <div className="flex flex-col gap-5 border-t border-line pt-5">
          <Combobox
            label={t.inUs.stateLabel}
            placeholder={t.inUs.statePlaceholder}
            help={t.inUs.stateHelp}
            emptyText={t.inUs.stateEmpty}
            groupLabels={t.inUs.stateGroups}
            error={errors.stateUS}
            items={stateItems}
            value={draft.stateUS ?? null}
            onChange={(code) => {
              onPatch({ stateUS: code });
              track("location_scope_selected", {
                context: "in_us",
                scope_value: code,
              });
            }}
          />

          <div>
            <OptionChips
              label={t.inUs.timeLabel}
              options={TIME_TAGS.map<ChipOption>((tag) => ({
                value: tag,
                label: t.timeOptions[tag],
              }))}
              value={draft.timeInUS ?? null}
              onChange={(value) => {
                if (isOneOf(value, TIME_TAGS)) onPatch({ timeInUS: value });
              }}
            />
            <p className="mt-2 text-caption text-muted">{t.inUs.timeHelp}</p>
          </div>
        </div>
      ) : null}

      {/* Rama B */}
      {branch === "pre_arrival" ? (
        <div className="flex flex-col gap-5 border-t border-line pt-5">
          <Combobox
            label={t.preArrival.countryLabel}
            placeholder={t.preArrival.countryPlaceholder}
            help={
              geoCountry && draft.countryOfResidence === geoCountry
                ? t.preArrival.prefilledHint
                : t.preArrival.countryHelp
            }
            emptyText={t.preArrival.countryEmpty}
            groupLabels={t.preArrival.countryGroups}
            error={errors.country}
            items={countryItems}
            value={draft.countryOfResidence ?? null}
            onChange={(code) => {
              onPatch({
                countryOfResidence: code,
                // Al volver a un país real, el texto libre deja de aplicar.
                countryOther: code === COUNTRY_NOT_LISTED ? (draft.countryOther ?? null) : null,
              });
              track("location_scope_selected", {
                context: "pre_arrival",
                scope_value: code,
              });
            }}
          />

          {/* Anexo C.2 + patrón "Otro" §3.2.1: se revela debajo, sin cambiar
              de pantalla, y dejarlo en blanco es válido. */}
          {draft.countryOfResidence === COUNTRY_NOT_LISTED ? (
            <FreeTextField
              label={t.preArrival.countryNotListed}
              placeholder={t.preArrival.countryNotListedPlaceholder}
              help={`${dict.other.help} ${dict.other.optionalNote}`}
              value={draft.countryOther ?? ""}
              onChange={(value) => onPatch({ countryOther: value })}
              counter={dict.step5.counter}
              counterNearLimit={dict.step5.counterNearLimit}
              autoFocus
            />
          ) : null}

          <div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-body text-ink">
              <input
                type="checkbox"
                checked={nationalityOpen}
                onChange={(e) => {
                  setNationalityOpen(e.target.checked);
                  if (!e.target.checked) onPatch({ nationality: null });
                }}
                className="size-5 shrink-0 accent-teal-deep"
              />
              {t.preArrival.nationalityToggle}
            </label>

            {nationalityOpen ? (
              <div className="mt-3">
                <Combobox
                  label={`${t.preArrival.nationalityLabel} · ${t.preArrival.nationalityOptional}`}
                  placeholder={t.preArrival.nationalityPlaceholder}
                  emptyText={t.preArrival.countryEmpty}
                  groupLabels={t.preArrival.countryGroups}
                  items={nationalityItems}
                  value={draft.nationality ?? null}
                  onChange={(code) => onPatch({ nationality: code })}
                />
              </div>
            ) : null}
          </div>

          <div>
            <OptionChips
              label={t.preArrival.travelPlanLabel}
              options={TRAVEL_TAGS.map<ChipOption>((tag) => ({
                value: tag,
                label: t.travelPlanOptions[tag],
              }))}
              value={draft.travelPlan ?? null}
              onChange={(value) => {
                if (isOneOf(value, TRAVEL_TAGS)) onPatch({ travelPlan: value });
              }}
            />
            <p className="mt-2 text-caption text-muted">
              {t.preArrival.travelPlanHelp}
            </p>
          </div>
        </div>
      ) : null}

      {/* §3.2.2 — confirmación textual antes de borrar nada */}
      <Modal
        open={pendingBranch !== null}
        onClose={() => setPendingBranch(null)}
        title={t.changeBranchTitle}
        closeLabel={t.changeBranchCancel}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingBranch(null)}>
              {t.changeBranchCancel}
            </Button>
            <Button
              onClick={() => {
                if (pendingBranch) onSelectBranch(pendingBranch);
                setPendingBranch(null);
              }}
            >
              {t.changeBranchAccept}
            </Button>
          </>
        }
      >
        <p className="text-body text-ink">{t.changeBranchBody}</p>
      </Modal>
    </div>
  );
}
