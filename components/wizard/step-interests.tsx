"use client";

import type { InterestTag, Lang, LocationContext, OnboardingDraft } from "@/lib/types";
import type { WizardDict } from "@/lib/i18n";
import { interestOptionLabel } from "@/lib/i18n";
import { interestsForBranch } from "@/lib/catalogs/interests";
import { OptionChips, type ChipOption } from "@/components/ui/option-chips";
import { FreeTextField } from "./free-text-field";

/**
 * PASO 4 — Intereses principales (§3.2), multi-select filtrado por rama.
 *
 * ⚠️ D14 / §3.3.1: los intereses se guardan en **ORDEN DE SELECCIÓN**, no en
 * el orden del catálogo. El motor da +30 al elemento [0] y +15 al resto; si
 * se guardara el orden de la lista, el "interés principal" sería un accidente
 * del diseño de la pantalla en vez de una señal del usuario.
 *
 * `OptionChips` devuelve la selección en el orden de sus `options`, así que
 * aquí se reconstruye: se conservan los ya elegidos en su orden previo y lo
 * nuevo se añade al final.
 */

export type StepInterestsProps = {
  dict: WizardDict;
  lang: Lang;
  branch: LocationContext;
  draft: OnboardingDraft;
  onPatch: (patch: Partial<OnboardingDraft>) => void;
};

export function StepInterests({
  dict,
  lang,
  branch,
  draft,
  onPatch,
}: StepInterestsProps) {
  const t = dict.step4;
  const available = interestsForBranch(branch);
  const selected = (draft.interests ?? []).filter((tag) => available.includes(tag));

  function handleChange(fromChips: string[]) {
    const next = fromChips.filter((v): v is InterestTag =>
      available.includes(v as InterestTag),
    );
    // Orden de selección: lo ya elegido conserva su posición; lo nuevo va al final.
    const kept = selected.filter((tag) => next.includes(tag));
    const added = next.filter((tag) => !selected.includes(tag));
    const interests = [...kept, ...added];

    const goal = draft.immediateGoal;
    const goalStillValid =
      goal == null || goal === "custom" || interests.includes(goal);

    onPatch({
      interests,
      // El texto libre muere con su opción (§3.2.1 regla 2: columna aparte).
      interestsOther: interests.includes("other") ? (draft.interestsOther ?? null) : null,
      // El paso 5 se genera desde este paso: un objetivo que ya no está entre
      // los intereses deja de existir.
      immediateGoal: goalStillValid ? (goal ?? null) : null,
      immediateGoalCustom: goalStillValid ? (draft.immediateGoalCustom ?? null) : null,
    });
  }

  return (
    <div>
      <OptionChips
        multiple
        hideLabel
        label={t.title}
        options={available.map<ChipOption>((tag) => ({
          value: tag,
          label: interestOptionLabel(tag, lang),
        }))}
        value={selected}
        onChange={handleChange}
      />

      <p aria-live="polite" className="mt-3 text-caption text-muted">
        {selected.length > 0 ? t.selectedCount(selected.length) : ""}
      </p>

      {selected.includes("other") ? (
        <FreeTextField
          label={dict.other.label}
          placeholder={dict.other.placeholder}
          help={`${dict.other.help} ${dict.other.optionalNote}`}
          value={draft.interestsOther ?? ""}
          onChange={(value) => onPatch({ interestsOther: value })}
          counter={dict.step5.counter}
          counterNearLimit={dict.step5.counterNearLimit}
          autoFocus
        />
      ) : null}
    </div>
  );
}
