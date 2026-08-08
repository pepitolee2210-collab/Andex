"use client";

import type {
  Lang,
  LocationContext,
  OnboardingDraft,
  SeekingFor,
  SituationTag,
} from "@/lib/types";
import type { WizardDict } from "@/lib/i18n";
import { situationLabel } from "@/lib/i18n";
import { situationsForContext } from "@/lib/catalogs/situations";
import { track } from "@/lib/analytics/track";
import { OptionChips, type ChipOption } from "@/components/ui/option-chips";
import { FreeTextField } from "./free-text-field";
import { isOneOf, selectedSituationValue } from "./draft-utils";

/**
 * PASO 3 (situación actual) + PASO 3.5 (¿para quién buscas ayuda?) en la
 * MISMA pantalla, tal como pide §3.2 ("un único chip de tres opciones, en la
 * misma pantalla del paso 3").
 *
 * Las 9 opciones de cada rama salen del catálogo en el orden del PRD e
 * incluyen "Otro" y "Prefiero no responder" **con el mismo peso visual que
 * las demás** (requisito de privacidad §3.2): son chips idénticos, en la
 * misma rejilla, sin gris ni tipografía menor.
 */

const SEEKING: readonly SeekingFor[] = ["self", "family", "both"];

export type StepSituationProps = {
  dict: WizardDict;
  lang: Lang;
  branch: LocationContext;
  draft: OnboardingDraft;
  onPatch: (patch: Partial<OnboardingDraft>) => void;
};

export function StepSituation({
  dict,
  lang,
  branch,
  draft,
  onPatch,
}: StepSituationProps) {
  const t = dict.step3;
  const options = situationsForContext(branch);
  const selected = selectedSituationValue(draft);
  const validTags = options
    .map((o) => o.tag)
    .filter((tag): tag is SituationTag => tag !== "other" && tag !== "declined");

  function handleSituation(value: string) {
    if (value === "declined") {
      // "Prefiero no responder": bandera aparte, el enum queda limpio.
      onPatch({ situation: null, situationOther: null, situationDeclined: true });
      track("situation_declined", { branch });
      return;
    }
    if (value === "other") {
      onPatch({ situation: "other", situationDeclined: false });
      return;
    }
    if (isOneOf(value, validTags)) {
      onPatch({ situation: value, situationOther: null, situationDeclined: false });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <OptionChips
          hideLabel
          label={branch === "in_us" ? t.titleInUs : t.titlePreArrival}
          options={options.map<ChipOption>((o) => ({
            value: o.tag,
            label: situationLabel(o.tag, branch, lang),
          }))}
          value={selected}
          onChange={handleSituation}
        />

        {draft.situation === "other" ? (
          <FreeTextField
            label={dict.other.label}
            placeholder={dict.other.placeholder}
            help={`${dict.other.help} ${dict.other.optionalNote}`}
            value={draft.situationOther ?? ""}
            onChange={(value) => onPatch({ situationOther: value })}
            counter={dict.step5.counter}
            counterNearLimit={dict.step5.counterNearLimit}
            autoFocus
          />
        ) : null}
      </div>

      {/* PASO 3.5 — misma pantalla */}
      <div className="border-t border-line pt-6">
        <h2 className="font-heading text-h3 text-ink">{dict.step35.title}</h2>
        <p className="mt-1 mb-3 text-body text-muted">{dict.step35.subtitle}</p>
        <OptionChips
          hideLabel
          label={dict.step35.title}
          options={SEEKING.map<ChipOption>((value) => ({
            value,
            label: dict.step35.options[value],
          }))}
          value={draft.seekingFor ?? null}
          onChange={(value) => {
            if (!isOneOf(value, SEEKING)) return;
            onPatch({ seekingFor: value });
            track("seeking_for_selected", { value });
          }}
        />
      </div>
    </div>
  );
}
