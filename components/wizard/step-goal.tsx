"use client";

import type { InterestTag, Lang, OnboardingDraft } from "@/lib/types";
import type { WizardDict } from "@/lib/i18n";
import { interestOptionLabel } from "@/lib/i18n";
import { OptionChips, type ChipOption } from "@/components/ui/option-chips";
import { FreeTextField } from "./free-text-field";
import { goalOptionsFor } from "./draft-utils";

/**
 * PASO 5 — Objetivo inmediato (§3.2).
 *
 * "Las opciones se generan dinámicamente a partir de los intereses marcados
 * en el paso 4, más una opción libre." Se reutilizan los labels del paso 4
 * (los mismos que el usuario acaba de leer y marcar): así el paso 5 se lee
 * como una consecuencia del 4 y no aparece copy inventado fuera de i18n.
 *
 * El texto propio se muestra LITERALMENTE en el dashboard, va limitado a 120
 * caracteres con contador visible y se sanea antes de persistirse.
 */

const CUSTOM = "custom";

export type StepGoalProps = {
  dict: WizardDict;
  lang: Lang;
  draft: OnboardingDraft;
  onPatch: (patch: Partial<OnboardingDraft>) => void;
};

export function StepGoal({ dict, lang, draft, onPatch }: StepGoalProps) {
  const t = dict.step5;
  const { options, fromInterests } = goalOptionsFor(draft);

  const chips: ChipOption[] = [
    ...options.map((tag) => ({ value: tag, label: interestOptionLabel(tag, lang) })),
    { value: CUSTOM, label: t.customOption },
  ];

  function handleChange(value: string) {
    if (value === CUSTOM) {
      onPatch({ immediateGoal: CUSTOM });
      return;
    }
    if (options.includes(value as InterestTag)) {
      onPatch({
        immediateGoal: value as InterestTag,
        immediateGoalCustom: null,
      });
    }
  }

  return (
    <div>
      {!fromInterests ? (
        <p className="mb-3 text-body text-muted">{t.emptyInterestsHint}</p>
      ) : null}

      <OptionChips
        hideLabel
        label={t.title}
        options={chips}
        value={draft.immediateGoal ?? null}
        onChange={handleChange}
      />

      {draft.immediateGoal === CUSTOM ? (
        <FreeTextField
          label={t.customLabel}
          placeholder={t.customPlaceholder}
          help={dict.other.optionalNote}
          value={draft.immediateGoalCustom ?? ""}
          onChange={(value) => onPatch({ immediateGoalCustom: value })}
          counter={t.counter}
          counterNearLimit={t.counterNearLimit}
          autoFocus
        />
      ) : null}
    </div>
  );
}
